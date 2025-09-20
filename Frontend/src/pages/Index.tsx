import { Link } from "react-router-dom";
import { MessageSquare, Upload, ArrowRight, Bot, FileText, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Smart Customer Support
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get instant answers from your documentation using AI-powered chat. 
              Upload your docs and let our bot help your customers 24/7.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/chat">
              <Button size="lg" className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Start Chatting
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/upload">
              <Button size="lg" variant="outline" className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Documents
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Powerful Features
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Intelligent Chat
              </h3>
              <p className="text-muted-foreground">
                AI-powered responses with source citations from your uploaded documents.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mb-4">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Document Upload
              </h3>
              <p className="text-muted-foreground">
                Support for PDF, Markdown, and text files with easy drag-and-drop upload.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-success/10 rounded-lg mb-4">
                <Zap className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Real-time Feedback
              </h3>
              <p className="text-muted-foreground">
                Thumbs up/down feedback system to continuously improve responses.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to get started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Upload your first document and start providing intelligent customer support.
          </p>
          <Link to="/upload">
            <Button size="lg" className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Your First Document
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
