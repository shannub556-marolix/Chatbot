from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class DocumentMetadata(BaseModel):
    """Schema for document metadata"""
    doc_id: str
    filename: str
    upload_timestamp: datetime = Field(default_factory=datetime.now)
    file_size: int
    file_type: str
    total_chunks: int


class ChatMessage(BaseModel):
    """Schema for chat messages"""
    session_id: str
    role: str  # 'user' or 'assistant'
    message: str
    timestamp: datetime = Field(default_factory=datetime.now)


class ChatRequest(BaseModel):
    """Schema for chat request"""
    question: str
    session_id: str


class Source(BaseModel):
    """Schema for document sources"""
    filename: str
    page: Optional[int] = None


class ChatResponse(BaseModel):
    """Schema for chat response"""
    answer: str
    sources: List[Source] = []


class FeedbackRequest(BaseModel):
    """Schema for feedback request"""
    session_id: str
    question: str
    answer: str
    rating: int = Field(ge=1, le=5)  # Rating from 1 to 5
    comments: Optional[str] = None


class HealthResponse(BaseModel):
    """Schema for health check response"""
    status: str
    timestamp: datetime = Field(default_factory=datetime.now)
    services: Dict[str, str]  # Service name -> status