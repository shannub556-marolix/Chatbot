import { Bot, User, ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface Source {
  filename: string;
  page?: number;
}

interface MessageBubbleProps {
  message: string;
  isBot: boolean;
  sources?: Source[];
  messageId?: string;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
}

const MessageBubble = ({ message, isBot, sources, messageId, onFeedback }: MessageBubbleProps) => {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const handleFeedback = (type: 'positive' | 'negative') => {
    if (messageId && onFeedback) {
      setFeedback(type);
      onFeedback(messageId, type);
    }
  };

  return (
    <div className={`flex gap-3 w-full message-slide-in ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      )}

      <div className={`${isBot ? 'max-w-[85%] sm:max-w-[75%]' : 'max-w-[85%] sm:max-w-[60%]'}`}>
        <Card className={`p-3 sm:p-4 transition-smooth border shadow-sm ${
          isBot 
            ? 'bg-chat-bot text-chat-bot-foreground rounded-lg rounded-tl-sm' 
            : 'bg-chat-user text-chat-user-foreground rounded-lg rounded-tr-sm'
        }`}>
          <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
            {message}
          </div>
          
          {sources && sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground mb-2 font-medium">Sources:</div>
              <div className="flex flex-wrap gap-1">
                {sources.map((source, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 text-xs bg-secondary/50 px-2 py-1 rounded-md text-secondary-foreground"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{source.filename}</span>
                    {source.page && (
                      <span className="text-muted-foreground">
                        (p. {source.page})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isBot && messageId && onFeedback && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">Was this helpful?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('positive')}
                className={`h-6 w-6 p-0 ${
                  feedback === 'positive' 
                    ? 'text-success bg-success/10' 
                    : 'text-muted-foreground hover:text-success'
                }`}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('negative')}
                className={`h-6 w-6 p-0 ${
                  feedback === 'negative' 
                    ? 'text-destructive bg-destructive/10' 
                    : 'text-muted-foreground hover:text-destructive'
                }`}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </Card>
      </div>

      {!isBot && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;