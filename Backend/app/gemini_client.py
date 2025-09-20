import os
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Load environment variables
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-latest")

# Configure the Google Generative AI SDK
try:
    genai.configure(api_key=GOOGLE_API_KEY)
except Exception as e:
    print(f"Error configuring Google Generative AI SDK: {str(e)}")
    raise


class GeminiClient:
    """Client for interacting with Google Gemini API"""

    @staticmethod
    def generate_response(
        prompt: str,
        context: Optional[List[Dict[str, str]]] = None,
        retrieved_chunks: Optional[List[str]] = None,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Generate a response from Gemini

        Args:
            prompt: The user question
            context: Optional conversation history
            retrieved_chunks: Optional list of Pinecone retrieved texts
            temperature: Controls randomness (0.0 to 1.0)

        Returns:
            Dict containing formatted Gemini response
        """
        try:
            # Initialize the generative model
            model = genai.GenerativeModel(GEMINI_MODEL)

            # Build base instruction
            system_prompt = (
                "You are Shanmukha's AI assistant powered by Gemini.\n"
                "- Answer all general questions normally, just like Gemini would.\n"
                "- If the user asks about 'Busappagari Shanmukha' or his personal details/resume/projects, "
                "use the provided context.\n"
                "- Only use the personal context when it is relevant.\n"
                "- If no relevant info exists in context, answer from general knowledge."
            )

            # Merge Pinecone context
            if retrieved_chunks:
                context_text = "\n".join(retrieved_chunks)
                system_prompt += f"\n\nPersonal context:\n{context_text}"

            # Start chat history (⚠️ no 'system' role, instead mark as user for Gemini)
            history = [{"role": "user", "parts": [system_prompt]}]

            # Add previous conversation
            if context:
                for msg in context:
                    history.append({
                        "role": msg["role"],  # should be "user" or "model"
                        "parts": [msg["message"]]
                    })

            # Add latest user query
            history.append({"role": "user", "parts": [prompt]})

            # Generation config
            generation_config = {
                "temperature": temperature,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,
            }

            # Generate response
            response = model.generate_content(
                contents=history,
                generation_config=generation_config
            )

            return {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {"text": response.text}
                            ]
                        }
                    }
                ]
            }

        except Exception as e:
            return {"error": f"Error generating response: {str(e)}"}

    @staticmethod
    def extract_text_from_response(response: Dict[str, Any]) -> str:
        """Extract plain text from Gemini response"""
        try:
            if "error" in response:
                return f"Error: {response['error']}"
            return response["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            return f"Error extracting text from response: {str(e)}"
