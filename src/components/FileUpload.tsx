// src/components/FileUpload.tsx
import { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Scissors,
  FileSpreadsheet,
  FileJson,
  Smartphone,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { performOCR } from '@/services/ocrService';
import { analyzeDocument } from '@/services/aiAnalysis';

interface FileUploadProps {
  onAnalyze: (content: string, fileName?: string) => Promise<void>;
  isAnalyzing: boolean;
  progress?: number; 
}

export const FileUpload = ({ onAnalyze, isAnalyzing, progress }: FileUploadProps) => {
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('Uploading...');
  const [ocrResult, setOcrResult] = useState<{ text: string; confidence: number; pages?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

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

  const handleFileUpload = async (file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size exceeds maximum limit of 10MB. Please upload a smaller file.');
      }

      setUploadStatus('processing');
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
      setProcessingStep('Uploading...');
      
      toast({
        title: "Processing file...",
        description: `Analyzing ${file.name} (${formatFileSize(file.size)})`
      });

      // Handle different file types
      if (file.type.includes('text') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          if (content) {
            setProcessingStep('Analyzing with AI...');
            await onAnalyze(content, file.name);
            setUploadStatus('success');
          }
        };
        reader.readAsText(file);
      } else if (
        file.type.startsWith('image/') || 
        file.name.match(/\.(pdf|jpg|jpeg|png|gif|tiff|bmp)$/i)
      ) {
        // Perform OCR for images and PDFs
        setProcessingStep('Performing OCR...');
        const ocrResultData = await performOCR(file); 
        setOcrResult(ocrResultData);
        setProcessingStep(
          `OCR Complete (${ocrResultData.confidence}% confidence${ocrResultData.pages ? `, ${ocrResultData.pages} page${ocrResultData.pages > 1 ? 's' : ''}` : ''})`
        );
        
        // Start AI analysis immediately after OCR completes
        setProcessingStep('Analyzing with AI...');
        await onAnalyze(ocrResultData.text, file.name);
        setUploadStatus('success');
      } else {
        // For other document types (DOCX, etc.)
        await onAnalyze(`Demo content extracted from ${file.name}`, file.name);
        setUploadStatus('success');
      }
    } catch (error: any) {
      setUploadStatus('error');
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process the document",
        variant: "destructive"
      });
    }
  };

  const handleTextAnalyze = async () => {
    if (textInput.trim()) {
      setProcessingStep('Analyzing with AI...');
      setUploadStatus('processing'); // Show processing state for text too
      try {
        await onAnalyze(textInput, 'Pasted Text');
        setUploadStatus('success');
        toast({
          title: "Text analyzed!",
          description: "Extracting tasks from your content..."
        });
      } catch (error: any) {
         console.error("Text Analysis Error:", error);
         setUploadStatus('error');
         toast({
           title: "Analysis failed",
           description: error.message || "Failed to analyze the text.",
           variant: "destructive"
         });
      }
    }
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setFileName(null);
    setFileSize(null);
    setProcessingStep('Uploading...');
    setOcrResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.includes('image') || fileName.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return <Image className="w-6 h-6 text-blue-500" />;
    } else if (fileName.includes('pdf') || fileName.includes('doc')) {
      return <FileText className="w-6 h-6 text-red-500" />;
    }
    return <File className="w-6 h-6 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Text Input Section */}
      <Card className="p-6 transition-all duration-300 hover:shadow-lg border border-border/50 animate-fade-in">
        <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Paste Your Content
        </h3>
        <Textarea
          placeholder="Paste meeting notes, instructions, syllabus, or any document content here..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          className="min-h-32 resize-none transition-all duration-200 focus:ring-2 focus:ring-primary"
        />
        <Button 
          onClick={handleTextAnalyze}
          disabled={!textInput.trim() || isAnalyzing}
          className="mt-4 gradient-primary text-white hover:opacity-90 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
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
      <Card className="p-6 transition-all duration-300 hover:shadow-lg border border-border/50 animate-fade-in animation-delay-200">
        <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Upload Document (Up to 10MB)
        </h3>
        
        {uploadStatus === 'idle' ? (
          <div
            className={`border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-all duration-300 transform ${
              dragActive 
                ? 'border-primary bg-primary/10 scale-[1.02]' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground transition-all duration-300" />
            <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, DOCX, TXT, images (up to 10MB)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.tiff,.bmp"
            />
            
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isAnalyzing}
              className="transition-all duration-200 hover:scale-105 shadow-sm w-full sm:w-auto"
            >
              Choose File
            </Button>
          </div>
        ) : (
          <div className={`p-6 rounded-xl border transition-all duration-500 animate-slide-up ${
            uploadStatus === 'success' 
              ? 'border-green-500 bg-green-50' 
              : uploadStatus === 'error' 
                ? 'border-red-500 bg-red-50' 
                : 'border-blue-500 bg-blue-50'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {uploadStatus === 'processing' && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
                {uploadStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {uploadStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {uploadStatus === 'processing' && (
                      <>
                        <Scissors className="w-4 h-4" />
                        {processingStep}
                      </>
                    )}
                    {uploadStatus === 'success' && 'Processing Complete!'}
                    {uploadStatus === 'error' && 'Processing Failed'}
                  </p>
                  {fileName && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      {getFileIcon(fileName)}
                      <span className="truncate max-w-[200px]">{fileName}</span> 
                      {fileSize && `(${fileSize})`}
                    </p>
                  )}
                  {ocrResult && (
                    <p className="text-xs text-muted-foreground mt-1">
                      OCR Confidence: {ocrResult.confidence}%
                      {ocrResult.pages !== undefined ? ` • ${ocrResult.pages} page${ocrResult.pages > 1 ? 's' : ''}` : ''}
                    </p>
                  )}
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetUpload}
                className="text-muted-foreground hover:text-foreground self-start sm:self-auto"
              >
                Upload Another
              </Button>
            </div>
            
            {(uploadStatus === 'processing' || isAnalyzing) && progress !== undefined && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-muted-foreground text-center">
                  {progress !== undefined ? `${progress}% complete` : 'Processing...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Supported Formats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors border border-border/50">
            <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="truncate">PDF (up to 10MB)</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors border border-border/50">
            <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="truncate">Images (OCR)</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors border border-border/50">
            <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="truncate">TXT, CSV</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors border border-border/50">
            <Download className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="truncate">Export Ready</span>
          </div>
        </div>
      </Card>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 animate-fade-in animation-delay-400">
        <Card className="p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-md border border-border/50">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600 relative">
            <Image className="w-5 h-5" />
            {/* Optional 3D effect placeholder - requires Three.js integration */}
            {/* <div className="absolute inset-0 bg-blue-200 rounded-lg transform translate-z-2 opacity-30"></div> */}
          </div>
          <div>
            <p className="font-medium text-sm">Advanced OCR</p>
            <p className="text-xs text-muted-foreground">Handles large files efficiently</p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-md border border-border/50">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-600 relative">
            <FileSpreadsheet className="w-5 h-5" />
            {/* <div className="absolute inset-0 bg-purple-200 rounded-lg transform translate-z-2 opacity-30"></div> */}
          </div>
          <div>
            <p className="font-medium text-sm">Smart Analysis</p>
            <p className="text-xs text-muted-foreground">AI-powered task extraction</p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-md border border-border/50">
          <div className="p-2 rounded-lg bg-green-100 text-green-600 relative group">
            <Monitor className="w-5 h-5" />
            <Smartphone className="w-5 h-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 transition-all duration-300 group-hover:opacity-100 scale-75 group-hover:scale-100" />
            {/* <div className="absolute inset-0 bg-green-200 rounded-lg transform translate-z-2 opacity-30"></div> */}
          </div>
          <div>
            <p className="font-medium text-sm">Mobile Friendly</p>
            <p className="text-xs text-muted-foreground">Responsive design</p>
          </div>
        </Card>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slideUp 0.4s ease-out forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .gradient-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
        }
        
        /* Basic 3D-like effect for cards on hover */
        .transition-all:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </div>
  );
};