from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from datetime import datetime
import os
import uuid

# Import local modules
from app.models import ChatRequest, ChatResponse, FeedbackRequest, HealthResponse, ChatMessage, Source
from app.pinecone_client import PineconeClient
from app.gemini_client import GeminiClient
from app.db import MongoDB
from app.ingest import DocumentProcessor

# Create FastAPI app
app = FastAPI(
    title="Chatbot API",
    description="FastAPI backend for a chatbot using Google Gemini Pro, Pinecone, and MongoDB",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"GLOBAL EXCEPTION: {str(exc)}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

# JWT token verification (simplified for example)
def verify_admin_token(authorization: Optional[str] = Header(None)):
    """Verify admin JWT token
    
    Args:
        authorization: Authorization header
        
    Returns:
        True if token is valid
        
    Raises:
        HTTPException: If token is invalid
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = authorization.replace("Bearer ", "")
    
    # In a real application, verify the JWT token here
    # For this example, we'll just check if it's not empty
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return True


@app.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...), _: bool = Depends(verify_admin_token)):
    """Upload a document for processing
    
    Args:
        file: The file to upload
        _: Admin token verification
        
    Returns:
        Document ID and number of chunks
    """
    # Check file type
    allowed_extensions = [".pdf", ".txt", ".md"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    try:
        # Process the file
        doc_id, total_chunks = DocumentProcessor.process_file(file.file, file.filename)
        
        return {
            "doc_id": doc_id,
            "filename": file.filename,
            "total_chunks": total_chunks,
            "message": "Document processed successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing document: {str(e)}"
        )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with the bot
    
    Args:
        request: Chat request with question and session ID
        
    Returns:
        Bot response and sources
    """
    try:
        print(f"Processing chat request: {request.question[:50]}...")
        
        # Save user message to MongoDB
        try:
            user_message = ChatMessage(
                session_id=request.session_id,
                role="user",
                message=request.question
            )
            MongoDB.store_chat_message(user_message)
            print("User message stored in MongoDB")
        except Exception as mongo_err:
            print(f"Error storing user message: {str(mongo_err)}")
            raise
        
        # Get conversation history for context
        try:
            chat_history = MongoDB.get_recent_chat_context(request.session_id)
            print(f"Retrieved {len(chat_history)} messages from chat history")
            
            # Convert to format expected by Gemini client
            context = [
                {"role": msg["role"], "message": msg["message"]}
                for msg in chat_history
            ]
        except Exception as history_err:
            print(f"Error retrieving chat history: {str(history_err)}")
            raise
        
        # Generate embedding for the question
        try:
            print("Generating embedding for question")
            query_embedding = PineconeClient.generate_embedding(request.question)
            print(f"Generated embedding with {len(query_embedding)} dimensions")
        except Exception as embed_err:
            print(f"Error generating embedding: {str(embed_err)}")
            raise
        
        # Query Pinecone for relevant chunks
        try:
            print("Querying Pinecone for relevant chunks")
            query_results = PineconeClient.query_embeddings(query_embedding, top_k=5)
            print(f"Received {len(query_results.get('matches', []))} matches from Pinecone")
        except Exception as pinecone_err:
            print(f"Error querying Pinecone: {str(pinecone_err)}")
            raise
        
        # Extract relevant context from query results
        relevant_context = ""
        sources = []
        
        if query_results.get("matches"):
            for match in query_results["matches"]:
                if match["score"] > 0.7:  # Only use matches with high similarity
                    metadata = match["metadata"]
                    relevant_context += f"\n\nFrom {metadata['filename']} (Page {metadata['page']}):\n{metadata['text']}"
                    
                    # Add to sources if not already present
                    source = Source(
                        filename=metadata["filename"],
                        page=metadata["page"]
                    )
                    
                    if source not in sources:
                        sources.append(source)
        
        # Construct prompt with context if available
        if relevant_context:
            prompt = f"The user asked: {request.question}\n\nHere is relevant information from my documents:{relevant_context}"
        else:
            prompt = request.question
        
        # Generate response from Gemini
        try:
            print("Generating response from Gemini")
            # gemini_response = GeminiClient.generate_response(prompt, context)
            gemini_response = GeminiClient.generate_response(
                prompt=request.question,
                context=context,
                retrieved_chunks=[match["metadata"]["text"] for match in query_results.get("matches", [])]
            )

            print("Received response from Gemini")
            answer = GeminiClient.extract_text_from_response(gemini_response)
        except Exception as gemini_err:
            print(f"Error generating response from Gemini: {str(gemini_err)}")
            raise
        
        # Save assistant message to MongoDB
        try:
            assistant_message = ChatMessage(
                session_id=request.session_id,
                role="assistant",
                message=answer
            )
            MongoDB.store_chat_message(assistant_message)
            print("Assistant message stored in MongoDB")
        except Exception as mongo_err:
            print(f"Error storing assistant message: {str(mongo_err)}")
            # Continue even if storing fails
        
        # Return response
        print("Returning chat response")
        return ChatResponse(
            answer=answer,
            sources=sources
        )
    except Exception as e:
        print(f"ERROR in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating response: {str(e)}"
        )


@app.get("/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session
    
    Args:
        session_id: Session ID
        
    Returns:
        Chat history
    """
    try:
        # Get chat history from MongoDB
        history = MongoDB.get_chat_history(session_id)
        
        # Format the response
        formatted_history = []
        for msg in history:
            formatted_history.append({
                "role": msg["role"],
                "message": msg["message"],
                "timestamp": msg["timestamp"].isoformat()
            })
        
        return {"history": formatted_history}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving chat history: {str(e)}"
        )


@app.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """Submit feedback for a chat interaction
    
    Args:
        feedback: Feedback data
        
    Returns:
        Success message
    """
    try:
        # Store feedback in MongoDB
        feedback_id = MongoDB.store_feedback(feedback)
        
        return {
            "message": "Feedback submitted successfully",
            "feedback_id": feedback_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting feedback: {str(e)}"
        )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check the health of the service
    
    Returns:
        Service health status
    """
    services = {}
    
    # Check MongoDB connection
    try:
        # Simple ping to check connection
        MongoDB.get_all_documents()
        services["mongodb"] = "healthy"
    except Exception:
        services["mongodb"] = "unhealthy"
    
    # Check Pinecone connection
    try:
        # Simple query to check connection
        PineconeClient.query_embeddings([0.0] * 768, top_k=1)
        services["pinecone"] = "healthy"
    except Exception:
        services["pinecone"] = "unhealthy"
    
    # Check Gemini API connection
    try:
        # Simple query to check connection
        GeminiClient.generate_response("Hello")
        services["gemini"] = "healthy"
    except Exception:
        services["gemini"] = "unhealthy"
    
    # Determine overall status
    overall_status = "healthy" if all(status == "healthy" for status in services.values()) else "degraded"
    
    return HealthResponse(
        status=overall_status,
        services=services
    )


# Create __init__.py file to make the app directory a package
