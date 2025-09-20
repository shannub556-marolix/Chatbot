import { Bot } from "lucide-react";
import { Card } from "@/components/ui/card";

const TypingIndicator = () => {
  return (
    <div className="flex gap-3 max-w-4xl message-slide-in">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
      
      <div className="flex-1 max-w-md">
        <Card className="p-4 bg-chat-bot">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-muted-foreground/60 rounded-full typing-animation"></div>
            <div className="w-2 h-2 bg-muted-foreground/60 rounded-full typing-animation" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-muted-foreground/60 rounded-full typing-animation" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TypingIndicator;