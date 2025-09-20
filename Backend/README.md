# Chatbot Backend with FastAPI, Google Gemini Pro, Pinecone, and MongoDB

This is a FastAPI backend for a chatbot that uses Google Gemini Pro as the LLM, Pinecone for RAG (Retrieval Augmented Generation) with personal documents, and MongoDB Atlas for persistence.

## Features

- Document upload and processing (PDF, TXT, MD)
- Text chunking and embedding generation
- Vector storage in Pinecone
- Metadata storage in MongoDB
- Chat with context from personal documents
- Conversation memory and history
- Feedback collection

## Tech Stack

- FastAPI (Python 3.10+)
- Google Gemini 1.5 Flash (via Google Generative AI SDK)
- Google Text Embedding 004 (for embeddings)
- Pinecone (vector DB for embeddings)
- MongoDB Atlas (for persistence)

## API Endpoints

- **POST `/upload`**: Upload and process documents
- **POST `/chat`**: Chat with the bot
- **GET `/history/{session_id}`**: Get chat history
- **POST `/feedback`**: Submit feedback
- **GET `/health`**: Check service health

## Setup and Installation

### Prerequisites

- Python 3.10+
- Pinecone account
- MongoDB Atlas account
- Google API key (for Gemini 1.5 Flash and Text Embedding 004)

### Installation

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file based on `.env.example` and fill in your API keys and configuration

### Running the Application

```bash
python main.py
```

The API will be available at http://localhost:8000

### Docker

To build and run with Docker:

```bash
docker build -t chatbot-backend .
docker run -p 8000:8000 --env-file .env chatbot-backend
```

## API Usage

See the `examples/api_examples.json` file for detailed request and response examples for each endpoint.

## License

MIT