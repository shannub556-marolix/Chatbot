# Chatbot API Documentation

This document provides comprehensive details about the Chatbot API endpoints for frontend integration.

## Base URL

```
http://localhost:8000
```

## Authentication

Most endpoints require authentication using a Bearer token.

**Header Format:**
```
Authorization: Bearer <your_token>
```

## API Endpoints

### 1. Document Upload

Upload documents to be processed and indexed for the chatbot.

- **URL:** `/upload`
- **Method:** `POST`
- **Authentication:** Required (Admin token)
- **Content-Type:** `multipart/form-data`

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | File | Yes | Document file to upload (.pdf, .txt, .md) |

**Response:**
```json
{
  "doc_id": "string",
  "filename": "string",
  "total_chunks": "integer",
  "message": "Document processed successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Unsupported file type
- `401 Unauthorized`: Invalid authentication credentials
- `500 Internal Server Error`: Error processing document

### 2. Chat

Send a question to the chatbot and receive an answer.

- **URL:** `/chat`
- **Method:** `POST`
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "question": "string",
  "session_id": "string"
}
```

**Response:**
```json
{
  "answer": "string",
  "sources": [
    {
      "filename": "string",
      "page": "integer (optional)"
    }
  ]
}
```

**Error Responses:**
- `500 Internal Server Error`: Error generating response

### 3. Chat History

Retrieve chat history for a specific session.

- **URL:** `/history/{session_id}`
- **Method:** `GET`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| session_id | string | Yes | Session identifier |

**Response:**
```json
{
  "history": [
    {
      "role": "string",
      "message": "string",
      "timestamp": "string (ISO format)"
    }
  ]
}
```

**Error Responses:**
- `500 Internal Server Error`: Error retrieving chat history

### 4. Feedback

Submit feedback for a chat interaction.

- **URL:** `/feedback`
- **Method:** `POST`
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "session_id": "string",
  "question": "string",
  "answer": "string",
  "rating": "integer (1-5)",
  "comments": "string (optional)"
}
```

**Response:**
```json
{
  "message": "Feedback submitted successfully",
  "feedback_id": "string"
}
```

**Error Responses:**
- `500 Internal Server Error`: Error submitting feedback

### 5. Health Check

Check the health status of the API and its dependencies.

- **URL:** `/health`
- **Method:** `GET`

**Response:**
```json
{
  "status": "string (healthy or degraded)",
  "timestamp": "string (ISO format)",
  "services": {
    "mongodb": "string (healthy or unhealthy)",
    "pinecone": "string (healthy or unhealthy)",
    "gemini": "string (healthy or unhealthy)"
  }
}
```

## Data Models

### ChatRequest
```json
{
  "question": "string",
  "session_id": "string"
}
```

### ChatResponse
```json
{
  "answer": "string",
  "sources": [
    {
      "filename": "string",
      "page": "integer (optional)"
    }
  ]
}
```

### FeedbackRequest
```json
{
  "session_id": "string",
  "question": "string",
  "answer": "string",
  "rating": "integer (1-5)",
  "comments": "string (optional)"
}
```

### HealthResponse
```json
{
  "status": "string",
  "timestamp": "string (ISO format)",
  "services": {
    "service_name": "string (healthy or unhealthy)"
  }
}
```

## Integration Examples

### Example: Sending a Chat Request

```javascript
// JavaScript/Fetch example
async function sendChatRequest(question, sessionId) {
  const response = await fetch('http://localhost:8000/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: question,
      session_id: sessionId
    })
  });
  
  return await response.json();
}
```

### Example: Uploading a Document

```javascript
// JavaScript/Fetch example
async function uploadDocument(file, token) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:8000/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
}
```

### Example: Retrieving Chat History

```javascript
// JavaScript/Fetch example
async function getChatHistory(sessionId) {
  const response = await fetch(`http://localhost:8000/history/${sessionId}`, {
    method: 'GET'
  });
  
  return await response.json();
}
```