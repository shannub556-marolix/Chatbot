import { useState, useRef, useEffect } from "react";
import { Send, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import apiService from "@/lib/api";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  sources?: Array<{ filename: string; page?: number }>;
}

const ChatBox = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem('chatSessionId');
    if (saved) return saved;
    const newId = crypto.randomUUID();
    localStorage.setItem('chatSessionId', newId);
    return newId;
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);
  
  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!sessionId) return;
      
      try {
        setIsLoading(true);
        const historyData = await apiService.getChatHistory(sessionId);
        
        if (historyData.history && historyData.history.length > 0) {
          const formattedMessages: Message[] = historyData.history.map((item: any) => ({
            id: crypto.randomUUID(),
            text: item.message,
            isBot: item.role !== 'user',
            sources: item.sources || []
          }));
          
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Silently fail - we'll just start with an empty chat
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatHistory();
  }, [sessionId]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputValue,
      isBot: false,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await apiService.sendChatMessage(inputValue, sessionId);

      const botMessage: Message = {
        id: crypto.randomUUID(),
        text: response.answer,
        isBot: true,
        sources: response.sources || [],
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorMessage = "Sorry, I'm having trouble connecting to the server. Please try again.";
      
      if (error instanceof Error) {
        if ((error as any).code === 'ERR_NETWORK') {
          errorMessage = "Network error: Unable to connect to the server. Please check your connection.";
        } else if ((error as any).response) {
          errorMessage = `Server error: ${(error as any).response?.data?.error || 'Unknown error occurred'}`;
        }
      }

      const errorBotMessage: Message = {
        id: crypto.randomUUID(),
        text: errorMessage,
        isBot: true,
      };

      setMessages(prev => [...prev, errorBotMessage]);
      
      toast({
        title: "Connection Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    try {
      // Find the message and its corresponding question
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex < 0 || !messages[messageIndex].isBot) return;
      
      const questionMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;
      if (!questionMessage || questionMessage.isBot) return;
      
      await apiService.submitFeedback({
        session_id: sessionId,
        question: questionMessage.text,
        answer: messages[messageIndex].text,
        rating: feedback === 'positive' ? 5 : 1,
        comments: `User rated this response as ${feedback}`
      });

      toast({
        title: "Feedback Sent",
        description: "Thank you for your feedback!",
      });
    } catch (error) {
      console.error('Feedback error:', error);
      toast({
        title: "Feedback Error",
        description: "Unable to send feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const createNewSession = () => {
    const newId = crypto.randomUUID();
    localStorage.setItem('chatSessionId', newId);
    setSessionId(newId);
    setMessages([]);
    toast({
      title: "New Session Created",
      description: "Started a fresh conversation with a new session ID.",
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-chat-background">
        {messages.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-foreground text-lg sm:text-xl mb-2 font-medium">
              Welcome to Support Chat
            </div>
            <div className="text-muted-foreground text-sm sm:text-base">
              Ask me anything about our documentation and I'll help you find the answers.
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message.text}
            isBot={message.isBot}
            sources={message.sources}
            messageId={message.id}
            onFeedback={handleFeedback}
          />
        ))}
        
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <Card className="m-3 sm:m-4 p-3 sm:p-4 bg-card border shadow-sm">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 focus:ring-2 focus:ring-primary"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-3 sm:px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
          <div>Press Enter to send • Session ID: {sessionId.slice(0, 8)}...</div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={createNewSession} 
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> New Session
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ChatBox;