import { useState, useCallback, useEffect } from "react";
import { Upload, File, X, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const UploadForm = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [password, setPassword] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentFileToUpload, setCurrentFileToUpload] = useState<UploadedFile | null>(null);
  const { toast } = useToast();
  
  // Set admin token in localStorage when component mounts
  useEffect(() => {
    // Using the environment variable or a default admin token
    const adminToken = import.meta.env.VITE_ADMIN_TOKEN || "admin-token-123";
    localStorage.setItem('authToken', adminToken);
  }, []);

  const addFiles = useCallback((fileList: FileList) => {
    // Only take the first file
    if (fileList.length === 0) return;
    
    const file = fileList[0];
    const newFile = {
      file,
      id: crypto.randomUUID(),
      status: 'pending' as const,
      progress: 0,
    };

    // Validate file type
    const allowedTypes = ['.pdf', '.md', '.txt'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(extension)) {
      toast({
        title: "Invalid File Type",
        description: "Only PDF, MD, and TXT files are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Replace any existing files
    setFiles([newFile]);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  }, [addFiles]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const uploadFile = async (uploadFile: UploadedFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { ...f, status: 'uploading', progress: 0 }
        : f
    ));

    try {
      // Verify password against environment variable
      const correctPassword = import.meta.env.VITE_YOUR_PASSWORD || "Password@123";
      
      if (password !== correctPassword) {
        throw new Error("Incorrect password. Please try again.");
      }
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles(prev => {
          const file = prev.find(f => f.id === uploadFile.id);
          if (file && file.status === 'uploading' && file.progress < 90) {
            return prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, progress: Math.min(f.progress + 10, 90) }
                : f
            );
          }
          return prev;
        });
      }, 300);
      
      const response = await apiService.uploadDocument(uploadFile.file);
      
      clearInterval(progressInterval);

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'success', progress: 100 }
          : f
      ));

      toast({
        title: "Upload Successful",
        description: `${uploadFile.file.name} has been uploaded successfully.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = "Upload failed. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
        if ((error as any).code === 'ERR_NETWORK') {
          errorMessage = "Network error: Unable to connect to the server.";
        } else if ((error as any).response) {
          errorMessage = (error as any).response?.data?.error || "Server error occurred.";
        }
      }

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const initiateUpload = (file: UploadedFile) => {
    setCurrentFileToUpload(file);
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordSubmit = () => {
    if (currentFileToUpload) {
      uploadFile(currentFileToUpload);
      setIsPasswordDialogOpen(false);
      setPassword("");
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return <File className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'uploading':
        return <Lock className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="p-6">
        <div className="flex flex-col gap-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center ${isDragOver ? 'border-primary bg-primary/5' : 'border-border'}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-medium">Drag and drop your file</h3>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse (PDF, MD, TXT)
              </p>
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Select File
              </Button>
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                onChange={handleFileInput}
                accept=".pdf,.md,.txt"
              />
            </div>
          </div>

          {files.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">File to Upload</h3>
              </div>
              
              <div className="flex flex-col gap-2">
                {files.map(file => (
                  <div 
                    key={file.id} 
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {getFileIcon(file.file.name)}
                      <span className="font-medium truncate max-w-[200px]">
                        {file.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(file.file.size / 1024)} KB)
                      </span>
                      {getStatusIcon(file.status)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="w-24" />
                      )}
                      
                      {file.status === 'error' && (
                        <span className="text-xs text-destructive max-w-[200px] truncate">
                          {file.error}
                        </span>
                      )}
                      
                      {file.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => initiateUpload(file)}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {file.status !== 'uploading' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Password to Upload</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UploadForm;