import os
import numpy as np
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

# Load environment variables
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
PINECONE_INDEX = os.getenv("PINECONE_INDEX")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")

# Configure the Google Generative AI SDK
try:
    genai.configure(api_key=GOOGLE_API_KEY)
except Exception as e:
    print(f"Error configuring Google Generative AI SDK: {str(e)}")
    raise

# Initialize Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

# Check if index exists, if not create it
if PINECONE_INDEX not in pc.list_indexes().names():
    # Google text-embedding-004 has 768 dimensions
    pc.create_index(
        name=PINECONE_INDEX,
        dimension=768,
        metric="cosine",
        spec=ServerlessSpec(
            cloud="aws",
            region=PINECONE_ENV
        )
    )

# Get the index
index = pc.Index(PINECONE_INDEX)


class PineconeClient:
    """Client for interacting with Pinecone vector database"""
    
    @staticmethod
    def generate_embedding(text: str) -> List[float]:
        """Generate embedding for a text using Google's text-embedding-004 model"""
        try:
            # Call the embedding model
            embedding_result = genai.embed_content(
                model=EMBEDDING_MODEL,
                content=text,
                task_type="RETRIEVAL_DOCUMENT"
            )
            
            # Return the embedding vector
            embedding = embedding_result['embedding']
            
            # Validate the embedding
            if not embedding or not isinstance(embedding, list):
                print(f"Invalid embedding format: {type(embedding)}")
                # Return a zero vector with the correct dimension (768 for text-embedding-004)
                return [0.0] * 768
                
            # Ensure all values are floats
            embedding = [float(val) for val in embedding]
            
            print(f"Generated valid embedding with {len(embedding)} dimensions")
            return embedding
        except Exception as e:
            print(f"Error generating embedding: {str(e)}")
            # Return zero vector with the correct dimension (768 for text-embedding-004)
            return [0.0] * 768
    
    @staticmethod
    def upsert_embeddings(vectors: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Upsert embeddings to Pinecone
        
        Args:
            vectors: List of dictionaries with 'id', 'values', and 'metadata' keys
        
        Returns:
            Response from Pinecone upsert operation
        """
        return index.upsert(vectors=vectors)
    
    @staticmethod
    def query_embeddings(query_vector: List[float], top_k: int = 5, filter: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Query Pinecone for similar vectors
        
        Args:
            query_vector: The embedding vector to query with
            top_k: Number of results to return
            filter: Optional filter to apply to the query
            
        Returns:
            Query results from Pinecone
        """
        try:
            # Ensure query_vector is a valid list of floats
            if not query_vector or not isinstance(query_vector, list):
                print(f"Invalid query vector: {type(query_vector)}")
                return {"matches": []}
                
            # Convert numpy arrays to lists if needed
            if hasattr(query_vector, 'tolist'):
                query_vector = query_vector.tolist()
                
            # Ensure all values are floats
            query_vector = [float(val) for val in query_vector]
            
            # Execute the query
            result = index.query(
                vector=query_vector,
                top_k=top_k,
                include_metadata=True,
                filter=filter
            )
            
            return result
        except Exception as e:
            print(f"Error querying Pinecone: {str(e)}")
            # Return empty result on error
            return {"matches": []}
    
    @staticmethod
    def delete_embeddings(ids: List[str]) -> Dict[str, Any]:
        """Delete embeddings from Pinecone
        
        Args:
            ids: List of vector IDs to delete
            
        Returns:
            Response from Pinecone delete operation
        """
        return index.delete(ids=ids)
    
    @staticmethod
    def delete_by_metadata(filter: Dict[str, Any]) -> Dict[str, Any]:
        """Delete embeddings by metadata filter
        
        Args:
            filter: Metadata filter to apply
            
        Returns:
            Response from Pinecone delete operation
        """
        return index.delete(filter=filter)