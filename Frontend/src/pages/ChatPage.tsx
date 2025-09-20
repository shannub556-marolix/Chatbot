import ChatBox from "@/components/ChatBox";
import Navbar from "@/components/Navbar";

const ChatPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-[calc(100vh-4rem)]">
        <ChatBox />
      </div>
    </div>
  );
};

export default ChatPage;