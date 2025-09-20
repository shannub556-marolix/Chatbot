import os
import uuid
import tempfile
from typing import List, Dict, Any, Tuple, BinaryIO
from pathlib import Path
from unstructured.partition.auto import partition
from .pinecone_client import PineconeClient
from .db import MongoDB
from .models import DocumentMetadata


class DocumentProcessor:
    """Process and ingest documents into the system"""
    
    @staticmethod
    def process_file(file: BinaryIO, filename: str) -> Tuple[str, int]:
        """Process a file and ingest it into Pinecone and MongoDB
        
        Args:
            file: File object
            filename: Name of the file
            
        Returns:
            Tuple of (document_id, total_chunks)
        """
        # Generate a unique document ID
        doc_id = str(uuid.uuid4())
        
        # Save the file temporarily
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(file.read())
            temp_file_path = temp_file.name
        
        try:
            # Get file size and type
            file_size = os.path.getsize(temp_file_path)
            file_type = Path(filename).suffix.lower()[1:]  # Remove the dot
            
            # Extract text from the file
            elements = partition(temp_file_path)
            text = "\n\n".join([str(element) for element in elements])
            
            # Chunk the text
            chunks = DocumentProcessor.chunk_text(text)
            
            # Generate embeddings and upsert to Pinecone
            vectors = []
            for i, chunk in enumerate(chunks):
                # Generate embedding
                embedding = PineconeClient.generate_embedding(chunk)
                
                # Create vector with metadata
                vector = {
                    "id": f"{doc_id}_{i}",
                    "values": embedding,
                    "metadata": {
                        "doc_id": doc_id,
                        "filename": filename,
                        "chunk_id": i,
                        "text": chunk,
                        "page": i // 5 + 1  # Approximate page number (5 chunks per page)
                    }
                }
                
                vectors.append(vector)
            
            # Upsert vectors to Pinecone
            PineconeClient.upsert_embeddings(vectors)
            
            # Store document metadata in MongoDB
            metadata = DocumentMetadata(
                doc_id=doc_id,
                filename=filename,
                file_size=file_size,
                file_type=file_type,
                total_chunks=len(chunks)
            )
            
            MongoDB.store_document_metadata(metadata)
            
            return doc_id, len(chunks)
            
        finally:
            # Clean up the temporary file
            os.unlink(temp_file_path)
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks
        
        Args:
            text: Text to chunk
            chunk_size: Maximum size of each chunk
            overlap: Overlap between chunks
            
        Returns:
            List of text chunks
        """
        if not text:
            return []
        
        # Split text into sentences (simple approach)
        sentences = text.replace("\n", " ").split(". ")
        sentences = [s + "." for s in sentences if s.strip()]
        
        chunks = []
        current_chunk = []
        current_size = 0
        
        for sentence in sentences:
            sentence_size = len(sentence)
            
            if current_size + sentence_size <= chunk_size:
                current_chunk.append(sentence)
                current_size += sentence_size
            else:
                # Save the current chunk
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                
                # Start a new chunk with overlap
                overlap_size = 0
                overlap_chunk = []
                
                # Add sentences from the end of the previous chunk for overlap
                for s in reversed(current_chunk):
                    if overlap_size + len(s) <= overlap:
                        overlap_chunk.insert(0, s)
                        overlap_size += len(s)
                    else:
                        break
                
                current_chunk = overlap_chunk + [sentence]
                current_size = sum(len(s) for s in current_chunk)
        
        # Add the last chunk if it's not empty
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    @staticmethod
    def delete_document(doc_id: str) -> bool:
        """Delete a document from Pinecone and MongoDB
        
        Args:
            doc_id: Document ID
            
        Returns:
            True if document was deleted, False otherwise
        """
        # Delete from Pinecone
        PineconeClient.delete_by_metadata({"doc_id": doc_id})
        
        # Delete from MongoDB
        return MongoDB.delete_document(doc_id)