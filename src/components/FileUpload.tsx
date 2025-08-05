import { useState, useCallback } from 'react';
import { Upload, FileText, Image, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onAnalyze: (content: string, fileName?: string) => void;
  isAnalyzing: boolean;
}

export const FileUpload = ({ onAnalyze, isAnalyzing }: FileUploadProps) => {
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onAnalyze(content, file.name);
        toast({
          title: "File uploaded successfully!",
          description: `Processing ${file.name}...`
        });
      }
    };

    // Handle different file types (simplified for demo)
    if (file.type.includes('text') || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      // For demo purposes, we'll simulate processing other file types
      onAnalyze(`Demo content from ${file.name}`, file.name);
      toast({
        title: "File simulated!",
        description: "In production, this would use OCR and document parsing."
      });
    }
  };

  const handleTextAnalyze = () => {
    if (textInput.trim()) {
      onAnalyze(textInput, 'Pasted Text');
      toast({
        title: "Text analyzed!",
        description: "Extracting tasks from your content..."
      });
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.includes('image') || fileName.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return <Image className="w-6 h-6" />;
    } else if (fileName.includes('pdf') || fileName.includes('doc')) {
      return <FileText className="w-6 h-6" />;
    }
    return <File className="w-6 h-6" />;
  };

  return (
    <div className="space-y-6">
      {/* Text Input Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Paste Your Content</h3>
        <Textarea
          placeholder="Paste meeting notes, instructions, syllabus, or any document content here..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          className="min-h-32 resize-none"
        />
        <Button 
          onClick={handleTextAnalyze}
          disabled={!textInput.trim() || isAnalyzing}
          className="mt-4 gradient-primary text-white"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Analyze Text
            </>
          )}
        </Button>
      </Card>

      {/* File Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Upload Document</h3>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
          <p className="text-sm text-muted-foreground mb-4">
            Supports PDF, DOCX, TXT, images, and more
          </p>
          
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
          />
          
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isAnalyzing}
          >
            Choose File
          </Button>
        </div>

        {/* Supported Formats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            PDF, DOCX
          </div>
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            JPG, PNG
          </div>
          <div className="flex items-center gap-2">
            <File className="w-4 h-4" />
            TXT, CSV
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            OCR Ready
          </div>
        </div>
      </Card>
    </div>
  );
};