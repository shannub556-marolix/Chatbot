import UploadForm from "@/components/UploadForm";
import Navbar from "@/components/Navbar";

const UploadPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="py-8">
        <UploadForm />
      </div>
    </div>
  );
};

export default UploadPage;