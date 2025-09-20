import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from pymongo import MongoClient
from pymongo.collection import Collection
from dotenv import load_dotenv
from .models import DocumentMetadata, ChatMessage, FeedbackRequest

load_dotenv()

# Load environment variables
MONGO_URI = os.getenv("MONGO_URI")

# Initialize MongoDB client
client = MongoClient(MONGO_URI)
db = client.chatbot_db

# Collections
documents_collection = db.documents
chat_collection = db.chat_messages
feedback_collection = db.feedback


class MongoDB:
    """Client for interacting with MongoDB"""
    
    @staticmethod
    def store_document_metadata(metadata: DocumentMetadata) -> str:
        """Store document metadata in MongoDB
        
        Args:
            metadata: Document metadata
            
        Returns:
            Inserted document ID
        """
        result = documents_collection.insert_one(metadata.dict())
        return str(result.inserted_id)
    
    @staticmethod
    def get_document_metadata(doc_id: str) -> Optional[Dict[str, Any]]:
        """Get document metadata from MongoDB
        
        Args:
            doc_id: Document ID
            
        Returns:
            Document metadata or None if not found
        """
        return documents_collection.find_one({"doc_id": doc_id})
    
    @staticmethod
    def get_all_documents() -> List[Dict[str, Any]]:
        """Get all document metadata from MongoDB
        
        Returns:
            List of document metadata
        """
        return list(documents_collection.find({}))
    
    @staticmethod
    def delete_document(doc_id: str) -> bool:
        """Delete document metadata from MongoDB
        
        Args:
            doc_id: Document ID
            
        Returns:
            True if document was deleted, False otherwise
        """
        result = documents_collection.delete_one({"doc_id": doc_id})
        return result.deleted_count > 0
    
    @staticmethod
    def store_chat_message(message: ChatMessage) -> str:
        """Store chat message in MongoDB
        
        Args:
            message: Chat message
            
        Returns:
            Inserted message ID
        """
        result = chat_collection.insert_one(message.dict())
        return str(result.inserted_id)
    
    @staticmethod
    def get_chat_history(session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get chat history for a session from MongoDB
        
        Args:
            session_id: Session ID
            limit: Maximum number of messages to return
            
        Returns:
            List of chat messages in chronological order (oldest first)
        """
        return list(
            chat_collection.find(
                {"session_id": session_id}
            ).sort("timestamp", 1).limit(limit)
        )
    
    @staticmethod
    def get_recent_chat_context(session_id: str, turns: int = 3) -> List[Dict[str, Any]]:
        """Get recent chat context for a session from MongoDB
        
        Args:
            session_id: Session ID
            turns: Number of conversation turns to include
            
        Returns:
            List of recent chat messages (user and assistant alternating)
        """
        # Get the most recent messages (2 * turns because each turn has user + assistant)
        messages = list(
            chat_collection.find(
                {"session_id": session_id}
            ).sort("timestamp", -1).limit(2 * turns)
        )
        
        # Reverse to get chronological order
        messages.reverse()
        
        return messages
    
    @staticmethod
    def store_feedback(feedback: FeedbackRequest) -> str:
        """Store feedback in MongoDB
        
        Args:
            feedback: Feedback data
            
        Returns:
            Inserted feedback ID
        """
        feedback_data = feedback.dict()
        feedback_data["timestamp"] = datetime.now()
        
        result = feedback_collection.insert_one(feedback_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_all_feedback() -> List[Dict[str, Any]]:
        """Get all feedback from MongoDB
        
        Returns:
            List of feedback entries
        """
        return list(feedback_collection.find({}))