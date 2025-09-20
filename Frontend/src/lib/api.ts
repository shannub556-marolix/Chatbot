import axios from 'axios';

// Get the base URL from environment variables or use default
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API service functions
export const apiService = {
  /**
   * Send a chat message to the backend
   * @param question The user's question
   * @param sessionId The current session ID
   * @returns Promise with the chat response
   */
  sendChatMessage: async (question: string, sessionId: string) => {
    const response = await api.post('/chat', {
      question,
      session_id: sessionId
    });
    return response.data;
  },

  /**
   * Upload a document to be processed and indexed
   * @param file The file to upload
   * @returns Promise with the upload response
   */
  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get chat history for a specific session
   * @param sessionId The session ID to retrieve history for
   * @returns Promise with the chat history
   */
  getChatHistory: async (sessionId: string) => {
    const response = await api.get(`/history/${sessionId}`);
    return response.data;
  },

  /**
   * Submit feedback for a chat interaction
   * @param feedbackData The feedback data
   * @returns Promise with the feedback submission response
   */
  submitFeedback: async (feedbackData: {
    session_id: string;
    question: string;
    answer: string;
    rating: number;
    comments?: string;
  }) => {
    const response = await api.post('/feedback', feedbackData);
    return response.data;
  }
};

export default apiService;