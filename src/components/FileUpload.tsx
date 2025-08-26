// src/components/FileUpload.tsx

// REMOVED: Unused 'useNavigate' import.
import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  extractTextFromFile, 
  OcrResult, 
  getFileTypeInfo, 
  estimateProcessingTime 
} from '@/services/ocrService';
import { motion, AnimatePresence } from "framer-motion";
// REMOVED: import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface FileUploadProps {
  onAnalyze: (content: string, fileName?: string) => Promise<void>;
  isAnalyzing: boolean;
  // This 'progress' prop is passed from Index.tsx but wasn't declared here.
  // It's used for the progress bar animation during the AI analysis step.
  progress?: number; 
}

export const FileUpload = ({ onAnalyze, isAnalyzing, progress }: FileUploadProps) => {
  const [textInput, setTextInput] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [processingStartTime, setProcessingStartTime] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  // REMOVED: const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.uid;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) return `File size exceeds the 50MB limit.`;
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.md', '.jpg', '.jpeg', '.png'];
    if (!allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      return `Unsupported file type. Please use: ${allowedExtensions.join(', ')}`;
    }
    return null;
  };

  const handleFileUpload = async (uploadedFile: File) => {
    resetUpload();
    
    try {
      const validationError = validateFile(uploadedFile);
      if (validationError) throw new Error(validationError);

      setUploadStatus("processing");
      setFileName(uploadedFile.name);
      setFileSize(formatFileSize(uploadedFile.size));
      setProcessingStartTime(Date.now());
      setEstimatedTime(estimateProcessingTime(uploadedFile));
      
      const result = await extractTextFromFile(uploadedFile, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      
      setOcrResult(result);
      
      if (!result.text || result.text.trim().length < 10) {
        throw new Error("Could not extract enough readable text from the file.");
      }
      
      // This is the key: just call the parent's function.
      await onAnalyze(result.text, uploadedFile.name);
      
      if (userId) {
        try {
          await addDoc(collection(db, `users/${userId}/tasks`), {
            fileName: uploadedFile.name,
            fileSize: uploadedFile.size,
            confidence: result.confidence ?? null,
            pages: result.pages ?? null,
            processingTime: result.processingTime ?? null,
            timestamp: Date.now(),
            content: result.text.substring(0, 1500),
          });
        } catch (firestoreError) {
          console.error("Firestore Write Error:", firestoreError);
          toast({ title: "Note", description: "Could not save to your history." });
        }
      }
      
      setUploadStatus("success");
      
      // The navigation is now handled by the parent component (Index.tsx)
      // REMOVED: The setTimeout and navigate() call that was causing the 404.
      
    } catch (error: any)
    {
      console.error("File Upload & Analysis Error:", error);
      setUploadStatus("error");
      setErrorDetails(error.message || "An unknown error occurred.");
      toast({
        title: "Processing Failed",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleTextAnalyze = async () => {
    if (textInput.trim().length < 10) {
      toast({ title: "Text is too short", variant: "destructive" });
      return;
    }
    // Just call the parent function. Do not navigate from here.
    await onAnalyze(textInput.trim(), 'Pasted Text');
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setFileName(null);
    setFileSize(null);
    setOcrResult(null);
    setUploadProgress(0);
    setErrorDetails(null);
    setProcessingStartTime(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const elapsedTime = processingStartTime > 0 ? Math.round((Date.now() - processingStartTime) / 1000) : 0;
  // Use the 'isAnalyzing' prop passed down from the parent for consistent state
  const isProcessing = uploadStatus === 'processing' || isAnalyzing;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg">Analyze from Text</h3>
          </div>
          <Textarea
            placeholder="Or paste your text here..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="min-h-[120px] mb-3 focus-visible:ring-blue-500"
            disabled={isProcessing}
          />
          <div className="flex justify-end">
            <Button onClick={handleTextAnalyze} disabled={!textInput.trim() || isProcessing}>
              {isAnalyzing && !fileName ? 'Analyzing...' : 'Analyze Text'}
            </Button>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-lg">Upload Document</h3>
            </div>
            <div className="flex gap-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Max 50MB</span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            disabled={isProcessing}
            className="hidden"
          />
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-300 ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            }`}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]); }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            {/* UI States */}
            {uploadStatus === 'idle' && ( <> <Upload className="w-10 h-10 text-gray-400 mx-auto" /> <p className="mt-2 font-medium text-gray-700">Drop your file here or <span className="text-blue-600">browse</span></p> <p className="text-sm text-gray-500">PDF, DOCX, PNG, JPG</p> </> )}
            {uploadStatus === 'processing' && !isAnalyzing && ( <> <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto"></div> <p className="mt-2 font-medium text-gray-700">Processing...</p> <p className="text-sm text-gray-500">{uploadProgress}% complete • ~{Math.max(0, estimatedTime - elapsedTime)}s remaining</p> </> )}
            {isAnalyzing && ( <> <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600 mx-auto"></div> <p className="mt-2 font-medium text-gray-700">Analyzing Content...</p> <p className="text-sm text-gray-500">This can take a moment.</p> </> )}
            {uploadStatus === 'success' && ( <> <CheckCircle className="w-10 h-10 text-green-600 mx-auto" /> <p className="mt-2 font-medium text-green-700">Success! Redirecting...</p> </> )}
            {uploadStatus === 'error' && ( <> <AlertCircle className="w-10 h-10 text-red-600 mx-auto" /> <p className="mt-2 font-medium text-red-700">Upload Failed</p> <p className="text-sm text-gray-500">Please try another file.</p> </> )}
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {(uploadStatus !== 'idle' && fileName) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg"><FileText className="w-5 h-5 text-blue-600" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate" title={fileName}>{fileName}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                      <span>{fileSize}</span>
                      <span className="bg-gray-200 px-1.5 py-0.5 rounded">{getFileTypeInfo(fileName).type}</span>
                    </div>
                  </div>
                  <button onClick={resetUpload} disabled={isProcessing} className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-200"><X className="w-4 h-4" /></button>
                </div>
                {/* Progress bar for OCR and AI analysis */}
                {(uploadStatus === 'processing' || isAnalyzing) && (
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${isAnalyzing ? progress : uploadProgress}%` }}></div>
                  </div>
                )}
                {ocrResult && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{ocrResult.confidence}% confidence</span>
                    {ocrResult.pages && (<span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">{ocrResult.pages} page{ocrResult.pages !== 1 ? 's' : ''}</span>)}
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{ocrResult.text.length.toLocaleString()} chars</span>
                  </div>
                )}
                {uploadStatus === 'error' && errorDetails && (
                  <p className="mt-2 text-sm text-red-600">{errorDetails}</p>
                )}
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};