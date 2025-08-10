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
  Clock,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromFile, OcrResult, getFileTypeInfo, estimateProcessingTime } from '@/services/ocrService';
import { motion, AnimatePresence } from "framer-motion";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [processingStartTime, setProcessingStartTime] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    const sizes = ['KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i - 1]}`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getFileIcon = (fileName: string) => {
    const info = getFileTypeInfo(fileName);
    const iconMap: { [key: string]: JSX.Element } = {
      'FileImage': <FileImage className="w-5 h-5 text-purple-600" />,
      'FileText': <FileText className="w-5 h-5 text-blue-600" />,
      'FileCode': <FileCode className="w-5 h-5 text-green-600" />,
      'File': <File className="w-5 h-5 text-red-600" />
    };
    return iconMap[info.icon] || <Type className="w-5 h-5 text-gray-600" />;
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setFileName(null);
    setFileSize(null);
    setOcrResult(null);
    setUploadProgress(0);
    setErrorDetails(null);
    setEstimatedTime(0);
    setProcessingStartTime(0);
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
    return null;
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

      // Set initial state
      setUploadStatus("processing");
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
      setUploadProgress(0);
      setProcessingStartTime(Date.now());
      
      // Estimate processing time
      const estimatedSeconds = estimateProcessingTime(file);
      setEstimatedTime(estimatedSeconds);
      
      const fileTypeInfo = getFileTypeInfo(file.name);
      
      toast({
        title: "Processing file...",
        description: `Analyzing ${fileTypeInfo.type} - ${file.name} (${formatFileSize(file.size)})`,
      });
      
      // Use the enhanced text extraction service with progress tracking
      const result = await extractTextFromFile(file, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      
      setOcrResult(result);
      
      // Validate extracted content
      if (!result.text || result.text.trim().length < 10) {
        throw new Error("Could not extract enough readable text from the file. The file might be corrupted, password-protected, or contain mostly non-text content.");
      }
      
      // Send extracted text to AI analysis
      await onAnalyze(result.text, file.name);
      setUploadStatus("success");
      
      const actualProcessingTime = result.processingTime ? (result.processingTime / 1000).toFixed(1) : 'N/A';
      
      toast({
        title: "File processed successfully!",
        description: `Extracted ${result.text.length.toLocaleString()} characters in ${actualProcessingTime}s (${result.confidence}% confidence)`,
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
          description: `Processing ${textInput.trim().length.toLocaleString()} characters...`,
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

  // Calculate elapsed time
  const elapsedTime = processingStartTime > 0 ? Math.round((Date.now() - processingStartTime) / 1000) : 0;

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
        <p className="text-gray-600 mt-2">Upload documents up to 50MB or paste text for instant analysis</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            Secure Processing
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Zap className="w-4 h-4" />
            Fast OCR
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <File className="w-4 h-4" />
            50MB Support
          </div>
        </div>
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
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Instant</span>
          </div>
          
          <Textarea
            placeholder="Paste text here to analyze (minimum 10 characters)..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="min-h-[150px] mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {textInput.length > 0 && `${textInput.length.toLocaleString()} characters`}
            </span>
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                onClick={handleTextAnalyze}
                disabled={!textInput.trim() || textInput.trim().length < 10 || isAnalyzing}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2"
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
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Upload className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Upload Document</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Max 50MB</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Fast OCR</span>
            </div>
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
            disabled={isAnalyzing || uploadStatus === 'processing'}
            className="hidden"
          />
          
          {/* Drag & Drop Area */}
          <motion.div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragging 
                ? 'border-blue-500 bg-blue-50 scale-105' 
                : uploadStatus === 'error'
                ? 'border-red-300 bg-red-50'
                : uploadStatus === 'success'
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isAnalyzing && uploadStatus !== 'processing' && document.getElementById('file-upload')?.click()}
            whileHover={{ scale: uploadStatus === 'processing' ? 1 : 1.02 }}
            whileTap={{ scale: uploadStatus === 'processing' ? 1 : 0.98 }}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <motion.div
                animate={{ 
                  y: uploadStatus === 'processing' ? [0, -10, 0] : [0, -10, 0],
                  rotate: uploadStatus === 'processing' ? 0 : [0, 5, 0, -5, 0],
                  scale: uploadStatus === 'success' ? [1, 1.2, 1] : 1
                }}
                transition={{ 
                  duration: uploadStatus === 'processing' ? 2 : 2, 
                  repeat: uploadStatus === 'processing' ? Infinity : Infinity,
                  repeatType: "reverse"
                }}
              >
                <div className={`p-3 rounded-full ${
                  uploadStatus === 'error' 
                    ? 'bg-red-100' 
                    : uploadStatus === 'success'
                    ? 'bg-green-100'
                    : uploadStatus === 'processing'
                    ? 'bg-blue-100'
                    : 'bg-gradient-to-r from-blue-100 to-purple-100'
                }`}>
                  {uploadStatus === 'error' ? (
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  ) : uploadStatus === 'success' ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : uploadStatus === 'processing' ? (
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-blue-600" />
                  )}
                </div>
              </motion.div>
              
              <div>
                <p className="font-medium text-gray-700">
                  {uploadStatus === 'error' 
                    ? 'Upload failed - Click to try again' 
                    : uploadStatus === 'success'
                    ? 'File processed successfully!'
                    : uploadStatus === 'processing'
                    ? 'Processing your file...'
                    : 'Drag & drop your file here'
                  }
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {uploadStatus === 'error' 
                    ? 'or click to select a different file' 
                    : uploadStatus === 'processing'
                    ? `${uploadProgress}% complete${estimatedTime > 0 ? ` • ~${Math.max(0, estimatedTime - elapsedTime)}s remaining` : ''}`
                    : uploadStatus === 'success'
                    ? 'Ready for analysis!'
                    : 'or click to browse files'
                  }
                </p>
              </div>
              
              {uploadStatus !== 'processing' && (
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <File className="w-3 h-3" /> PDF
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <FileText className="w-3 h-3" /> DOCX
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <FileCode className="w-3 h-3" /> TXT/MD
                  </span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <FileImage className="w-3 h-3" /> Images
                  </span>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Upload Progress Bar */}
          <AnimatePresence>
            {uploadStatus === 'processing' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Processing Progress</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-600">{uploadProgress}%</span>
                    {estimatedTime > 0 && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {elapsedTime}s / ~{estimatedTime}s
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 h-3 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {/* Animated shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* File Information Display */}
          <AnimatePresence>
            {(fileName || uploadStatus !== 'idle') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 p-4 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      uploadStatus === 'success' 
                        ? 'bg-green-100' 
                        : uploadStatus === 'error'
                        ? 'bg-red-100'
                        : 'bg-gray-100'
                    }`}>
                      {fileName ? getFileIcon(fileName) : <File className="w-5 h-5 text-gray-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{fileName || 'Processing...'}</p>
                      {fileSize && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">{fileSize}</span>
                          {fileName && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                              {getFileTypeInfo(fileName).type}
                            </span>
                          )}
                        </div>
                      )}
                      {ocrResult && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3" /> 
                            {ocrResult.confidence}% confidence
                          </span>
                          {ocrResult.pages && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              {ocrResult.pages} page{ocrResult.pages !== 1 ? 's' : ''}
                            </span>
                          )}
                          {ocrResult.processingTime && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {(ocrResult.processingTime / 1000).toFixed(1)}s
                            </span>
                          )}
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {ocrResult.text.length.toLocaleString()} chars
                          </span>
                        </div>
                      )}
                      {uploadStatus === 'error' && errorDetails && (
                        <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span className="flex-1">{errorDetails}</span>
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
                    <motion.button 
                      onClick={resetUpload}
                      className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                      title="Clear file"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
      
      {/* Features & Security Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
      >
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <h4 className="font-medium text-blue-800 mb-1">Secure Processing</h4>
          <p className="text-sm text-blue-600">Files processed locally and securely deleted after analysis</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <Zap className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <h4 className="font-medium text-green-800 mb-1">Fast OCR Engine</h4>
          <p className="text-sm text-green-600">Advanced OCR with image optimization for accurate text extraction</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <File className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <h4 className="font-medium text-purple-800 mb-1">Large File Support</h4>
          <p className="text-sm text-purple-600">Process documents up to 50MB with progress tracking</p>
        </div>
      </motion.div>
      
      {/* Footer Note */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center text-sm text-gray-500 mt-6 p-4 bg-gray-50 rounded-lg"
      >
        <p className="font-medium mb-1">🔒 Privacy First</p>
        <p>All files are processed client-side when possible. We don't store your documents after analysis.</p>
        <p className="mt-2 text-xs">Supported formats: PDF, DOCX, TXT, MD, JPG, PNG, GIF, BMP, TIFF, WebP</p>
      </motion.div>
    </div>
  );
};