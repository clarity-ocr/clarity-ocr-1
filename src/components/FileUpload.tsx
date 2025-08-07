// FileUpload.tsx
import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Image,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  File,
  X,
  FileImage,
  FileCode,
  Type,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromFile, OcrResult } from '@/services/ocrService';
import { motion, AnimatePresence } from "framer-motion";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

interface FileUploadProps {
  onAnalyze: (content: string, fileName?: string) => Promise<void>;
  isAnalyzing: boolean;
  progress?: number;
}

export const FileUpload = ({ onAnalyze, isAnalyzing }: FileUploadProps) => {
  const [textInput, setTextInput] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    const sizes = ['KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i - 1]}`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'].includes(ext || '')) {
      return <FileImage className="w-5 h-5 text-purple-600" />;
    } else if (['docx'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    } else if (['md', 'markdown'].includes(ext || '')) {
      return <FileCode className="w-5 h-5 text-green-600" />;
    } else if (['pdf'].includes(ext || '')) {
      return <File className="w-5 h-5 text-red-600" />;
    } else {
      return <Type className="w-5 h-5 text-gray-600" />;
    }
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setFileName(null);
    setFileSize(null);
    setOcrResult(null);
    setUploadProgress(0);
    setErrorDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    // Check file type
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.md', '.markdown', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidType) {
      return `File type not supported. Allowed types: ${allowedExtensions.join(', ')}`;
    }
    return null; // File is valid
  };

  const handleFileUpload = async (file: File) => {
    // Reset any existing file state before processing the new file
    resetUpload();
    
    try {
      // Validate file before processing
      const validationError = validateFile(file);
      if (validationError) {
        setUploadStatus('error');
        setErrorDetails(validationError);
        toast({
          title: "File Validation Failed",
          description: validationError,
          variant: "destructive",
        });
        return;
      }
      setUploadStatus("processing");
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
      setUploadProgress(0);
      
      toast({
        title: "Processing file...",
        description: `Analyzing ${file.name} (${formatFileSize(file.size)})`,
      });
      
      // Use the enhanced text extraction service
      const result = await extractTextFromFile(file, (progress) => {
        setUploadProgress(progress);
      });
      setOcrResult(result);
      
      // Validate extracted content
      if (!result.text || result.text.trim().length < 10) {
        throw new Error("Could not extract enough readable text from the file. The file might be corrupted, password-protected, or contain mostly images.");
      }
      
      // Send extracted text to AI analysis
      await onAnalyze(result.text, file.name);
      setUploadStatus("success");
      
      toast({
        title: "File processed successfully!",
        description: `Extracted ${result.text.length} characters of text for analysis.`,
      });
    } catch (error: any) {
      console.error("File Upload Error:", error);
      setUploadStatus("error");
      
      // Provide more specific error messages
      let errorMessage = "Failed to process the file.";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = "Network error occurred. Please check your connection and try again.";
      } else if (error.code === 'TIMEOUT') {
        errorMessage = "File processing timed out. The file might be too large or complex.";
      }
      
      setErrorDetails(errorMessage);
      
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleTextAnalyze = async () => {
    if (textInput.trim()) {
      try {
        // Validate text input
        if (textInput.trim().length < 10) {
          toast({
            title: "Text too short",
            description: "Please provide at least 10 characters of text to analyze.",
            variant: "destructive",
          });
          return;
        }
        await onAnalyze(textInput.trim(), 'Pasted Text');
        
        toast({
          title: "Text analyzed!",
          description: "Extracting tasks from your content...",
        });
      } catch (error: any) {
        console.error("Text Analysis Error:", error);
        toast({
          title: "Analysis Failed",
          description: error.message || "Failed to analyze the text. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Animation variants
  const cardVariants = {
    idle: { 
      y: 0, 
      rotateX: 0, 
      rotateY: 0,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.3 }
    },
    hover: { 
      y: -10, 
      rotateX: 5, 
      rotateY: 5,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.3 }
    },
    tap: { 
      scale: 0.98, 
      rotateX: 0, 
      rotateY: 0,
      transition: { duration: 0.1 }
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  const progressVariants = {
    initial: { width: 0 },
    animate: { width: `${uploadProgress}%` }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Document Intelligence Analyzer
        </h1>
        <p className="text-gray-600 mt-2">Upload documents or paste text to extract and analyze content</p>
      </motion.div>

      {/* Text Input Section */}
      <motion.div
        variants={cardVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
      >
        <Card className="p-6 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Analyze Text</h3>
          </div>
          
          <Textarea
            placeholder="Paste text here to analyze (minimum 10 characters)..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="min-h-[150px] mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              onClick={handleTextAnalyze}
              disabled={!textInput.trim() || textInput.trim().length < 10 || isAnalyzing}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Text
                </>
              )}
            </Button>
          </motion.div>
        </Card>
      </motion.div>

      {/* File Upload Section */}
      <motion.div
        variants={cardVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
      >
        <Card className="p-6 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Upload className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Upload Document</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Max 1MB</span>
          </div>
          
          {/* Hidden file input */}
          <input
            id="file-upload"
            type="file"
            ref={fileInputRef}
            accept=".pdf,.docx,.txt,.md,.markdown,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            disabled={isAnalyzing}
            className="hidden"
          />
          
          {/* Drag & Drop Area */}
          <motion.div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : uploadStatus === 'error'
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isAnalyzing && document.getElementById('file-upload')?.click()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <motion.div
                animate={{ 
                  y: uploadStatus === 'processing' ? 0 : [0, -10, 0],
                  rotate: uploadStatus === 'processing' ? 0 : [0, 5, 0, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: uploadStatus === 'processing' ? 0 : Infinity,
                  repeatType: "reverse"
                }}
              >
                <div className={`p-3 rounded-full ${
                  uploadStatus === 'error' 
                    ? 'bg-red-100' 
                    : 'bg-gradient-to-r from-blue-100 to-purple-100'
                }`}>
                  {uploadStatus === 'error' ? (
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  ) : (
                    <Upload className="w-8 h-8 text-blue-600" />
                  )}
                </div>
              </motion.div>
              
              <div>
                <p className="font-medium text-gray-700">
                  {uploadStatus === 'error' ? 'Upload failed - Click to try again' : 'Drag & drop your file here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {uploadStatus === 'error' ? 'or click to select a different file' : 'or click to browse files'}
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                  <File className="w-3 h-3" /> PDF
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                  <FileText className="w-3 h-3" /> DOCX
                </span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center gap-1">
                  <FileCode className="w-3 h-3" /> MD
                </span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center gap-1">
                  <FileImage className="w-3 h-3" /> Images
                </span>
              </div>
            </div>
          </motion.div>
          
          {/* Upload Progress */}
          <AnimatePresence>
            {uploadStatus === 'processing' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Processing...</span>
                  <span className="text-sm font-medium text-blue-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <motion.div
                    variants={progressVariants}
                    initial="initial"
                    animate="animate"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* File Info */}
          <AnimatePresence>
            {(fileName || uploadStatus !== 'idle') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {fileName ? getFileIcon(fileName) : <File className="w-5 h-5 text-gray-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 truncate max-w-xs">{fileName}</p>
                      {fileSize && <p className="text-sm text-gray-500">{fileSize}</p>}
                      {ocrResult && (
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Confidence: {ocrResult.confidence}%
                          </span>
                          {ocrResult.pages && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                              {ocrResult.pages} page(s)
                            </span>
                          )}
                        </div>
                      )}
                      {uploadStatus === 'error' && errorDetails && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {errorDetails}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2">
                    {uploadStatus === 'processing' && (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    )}
                    {uploadStatus === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {uploadStatus === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <button 
                      onClick={resetUpload}
                      className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200"
                      title="Clear file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
      
      {/* Footer Note */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-gray-500 mt-6"
      >
        <p>All files are processed securely. We don't store your documents after analysis.</p>
      </motion.div>
    </div>
  );
};