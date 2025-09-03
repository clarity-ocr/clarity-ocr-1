// src/components/FileUpload.tsx

import {
  useState,
  useRef,
  useCallback,
  FC,
  useReducer,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react"; // Only used for the close button
import { collection, addDoc } from "firebase/firestore";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

// Custom Hooks & Contexts
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Services & Firebase
import { db } from "@/firebase";
import {
  extractTextFromFile,
  OcrResult,
  getFileTypeInfo,
  estimateProcessingTime,
} from "@/services/ocrService";

// --- Import the new 3D Icons ---
import {
    IconUpload,
    IconFileText,
    IconFileCode,
    IconFileImage,
    IconCheckCircle,
    IconAlertCircle,
    IconLoader
} from "@/components/ui/3d-icons"; // Assuming 3d-icons.tsx is in this path

// --- Constants ---
const ALLOWED_EXTENSIONS = [
  ".pdf", ".docx", ".txt", ".md", ".markdown",
  ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp",
];

// --- Type Definitions ---
interface FileUploadProps {
  onAnalyze: (content: string, fileName?: string) => Promise<void>;
  isAnalyzing: boolean;
  progress?: number;
}

interface State {
  uploadStatus: "idle" | "processing" | "success" | "error";
  fileInfo: { name: string; size: string; type: string; icon: ReactNode } | null;
  ocrResult: OcrResult | null;
  uploadProgress: number;
  errorDetails: string | null;
  estimatedTime: number;
  processingStartTime: number;
}

type Action =
  | { type: "RESET" }
  | { type: "START_PROCESSING"; payload: { fileInfo: State["fileInfo"]; estimatedTime: number } }
  | { type: "SET_PROGRESS"; payload: number }
  | { type: "SET_SUCCESS"; payload: OcrResult }
  | { type: "SET_ERROR"; payload: { errorDetails: string; fileInfo?: State["fileInfo"] } };

// --- Reducer for complex state management ---
const initialState: State = {
  uploadStatus: "idle",
  fileInfo: null,
  ocrResult: null,
  uploadProgress: 0,
  errorDetails: null,
  estimatedTime: 0,
  processingStartTime: 0,
};

function fileUploadReducer(state: State, action: Action): State {
  switch (action.type) {
    case "RESET":
      return initialState;
    case "START_PROCESSING":
      return {
        ...initialState,
        uploadStatus: "processing",
        fileInfo: action.payload.fileInfo,
        estimatedTime: action.payload.estimatedTime,
        processingStartTime: Date.now(),
      };
    case "SET_PROGRESS":
      return { ...state, uploadProgress: action.payload };
    case "SET_SUCCESS":
      return {
        ...state,
        uploadStatus: "success",
        ocrResult: action.payload,
        uploadProgress: 100,
      };
    case "SET_ERROR":
      return {
        ...state,
        uploadStatus: "error",
        errorDetails: action.payload.errorDetails,
        fileInfo: action.payload.fileInfo || state.fileInfo,
      };
    default:
      return state;
  }
}

// --- Helper Functions ---

/**
 * Maps a file type string from the service to its corresponding 3D icon component.
 */
const getIconForFileType = (iconName: string): ReactNode => {
  switch (iconName) {
    case "FileCode":
      return <IconFileCode className="w-8 h-8" />;
    case "FileImage":
      return <IconFileImage className="w-8 h-8" />;
    default:
      return <IconFileText className="w-8 h-8" />;
  }
};

/**
 * Formats a file size in bytes into a readable string (KB, MB, GB).
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// --- Main FileUpload Component ---
export const FileUpload: FC<FileUploadProps> = ({
  onAnalyze,
  isAnalyzing,
  progress = 0,
}) => {
  const [state, dispatch] = useReducer(fileUploadReducer, initialState);
  const {
    uploadStatus,
    fileInfo,
    ocrResult,
    uploadProgress,
    errorDetails,
    estimatedTime,
    processingStartTime,
  } = state;

  const [textInput, setTextInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const isProcessing = uploadStatus === "processing" || isAnalyzing;
  const elapsedTime =
    processingStartTime > 0
      ? Math.round((Date.now() - processingStartTime) / 1000)
      : 0;

  const resetState = useCallback(() => {
    dispatch({ type: "RESET" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const saveTaskToHistory = useCallback(
    async (uploadedFile: File, result: OcrResult) => {
      if (!user?.uid) return;
      try {
        await addDoc(collection(db, `users/${user.uid}/tasks`), {
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          fileType: result.fileType,
          confidence: result.confidence ?? null,
          pages: result.pages ?? null,
          processingTime: result.processingTime ?? null,
          timestamp: Date.now(),
          content: result.text.substring(0, 1500),
        });
      } catch (firestoreError) {
        console.error("Firestore Write Error:", firestoreError);
        toast({
          title: "Note",
          description: "Could not save this task to your history.",
          variant: "default",
        });
      }
    },
    [user, toast]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      resetState();
      
      const fileTypeInfo = getFileTypeInfo(file.name);
      const fileInfoPayload = {
        name: file.name,
        size: formatFileSize(file.size),
        type: fileTypeInfo.type,
        icon: getIconForFileType(fileTypeInfo.icon),
      };

      try {
        dispatch({
          type: "START_PROCESSING",
          payload: {
            fileInfo: fileInfoPayload,
            estimatedTime: Math.round(estimateProcessingTime(file)),
          },
        });

        const result = await extractTextFromFile(file, (p) =>
          dispatch({ type: "SET_PROGRESS", payload: Math.round(p) })
        );

        if (!result.text || result.text.trim().length < 10) {
          throw new Error("Could not extract enough readable text from the file.");
        }

        dispatch({ type: "SET_SUCCESS", payload: result });
        await onAnalyze(result.text, file.name);
        await saveTaskToHistory(file, result);

      } catch (error: any) {
        const errorMessage = error.message || "An unknown error occurred during processing.";
        dispatch({
          type: "SET_ERROR",
          payload: { errorDetails: errorMessage, fileInfo: fileInfoPayload },
        });
        toast({
          title: "Processing Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [resetState, onAnalyze, saveTaskToHistory, toast]
  );

  const handleTextAnalyze = async () => {
    if (textInput.trim().length < 10) {
      toast({
        title: "Text is too short",
        description: "Please enter at least 10 characters to analyze.",
        variant: "destructive",
      });
      return;
    }
    await onAnalyze(textInput.trim(), "Pasted Text");
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (isProcessing || !e.dataTransfer.files?.[0]) return;
      handleFileUpload(e.dataTransfer.files[0]);
    },
    [isProcessing, handleFileUpload]
  );

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Text Input Card */}
        <motion.div whileHover={{ scale: 1.02, y: -5 }}>
          <Card className="p-6 rounded-2xl shadow-lg flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <IconFileText className="w-10 h-10" />
              <h3 className="font-semibold text-xl text-gray-800">Analyze from Text</h3>
            </div>
            <Textarea
              placeholder="Or paste your text here to begin analysis..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="flex-grow min-h-[150px] mb-4 text-base bg-gray-50 focus-visible:ring-indigo-500"
              disabled={isProcessing}
            />
            <Button
              onClick={handleTextAnalyze}
              disabled={!textInput.trim() || isProcessing}
              size="lg"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {isAnalyzing && !fileInfo ? (
                <>
                  <IconLoader className="mr-2 h-5 w-5 animate-spin" /> Analyzing...
                </>
              ) : (
                "Analyze Text"
              )}
            </Button>
          </Card>
        </motion.div>

        {/* File Upload Card */}
        <motion.div whileHover={{ scale: 1.02, y: -5 }}>
          <Card className="p-6 rounded-2xl shadow-lg h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <IconUpload className="w-10 h-10" />
              <h3 className="font-semibold text-xl text-gray-800">Upload Document</h3>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              disabled={isProcessing}
              className="hidden"
              accept={ALLOWED_EXTENSIONS.join(",")}
            />
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300 flex flex-col justify-center items-center flex-grow
                ${isProcessing ? "cursor-not-allowed bg-gray-50" : "cursor-pointer"}
                ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 bg-white"}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              aria-live="polite"
            >
              <DropzoneContent
                isAnalyzing={isAnalyzing}
                uploadStatus={uploadStatus}
                uploadProgress={uploadProgress}
                estimatedTime={estimatedTime}
                elapsedTime={elapsedTime}
              />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* File Info & Progress Card */}
      <AnimatePresence>
        {fileInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="mt-6"
          >
            <Card className="p-4 rounded-2xl shadow-lg overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                  {fileInfo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate" title={fileInfo.name}>
                    {fileInfo.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                    <span>{fileInfo.size}</span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                    <span>{fileInfo.type}</span>
                  </div>
                </div>
                <button
                  onClick={resetState}
                  disabled={isProcessing}
                  className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(uploadStatus === "processing" || isAnalyzing) && (
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {isAnalyzing ? "AI Analysis" : "Text Extraction"}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {isAnalyzing ? progress : uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <motion.div
                      className="h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${isAnalyzing ? progress : uploadProgress}%` }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      style={{
                        backgroundColor: isAnalyzing ? "#8b5cf6" : "#4f46e5",
                      }}
                    />
                  </div>
                </div>
              )}

              {ocrResult && !isAnalyzing && uploadStatus === "success" && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Confidence: {ocrResult.confidence}%
                  </span>
                  {ocrResult.pages && (
                    <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      {ocrResult.pages} page{ocrResult.pages !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {ocrResult.text.length.toLocaleString()} characters
                  </span>
                </div>
              )}

              {uploadStatus === "error" && errorDetails && (
                <p className="mt-3 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md">
                  {errorDetails}
                </p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-Component for Dropzone Content ---
const DropzoneContent: FC<{
  isAnalyzing: boolean;
  uploadStatus: State["uploadStatus"];
  uploadProgress: number;
  estimatedTime: number;
  elapsedTime: number;
}> = ({
  isAnalyzing,
  uploadStatus,
  uploadProgress,
  estimatedTime,
  elapsedTime,
}) => {
  const iconSize = "w-20 h-20 mx-auto";

  if (isAnalyzing) {
    return (
      <>
        <IconLoader className={`${iconSize} animate-spin`} />
        <p className="mt-4 font-semibold text-gray-800">Analyzing Content...</p>
        <p className="text-sm text-gray-500">This may take just a moment.</p>
      </>
    );
  }
  switch (uploadStatus) {
    case "processing":
      return (
        <>
          <IconLoader className={`${iconSize} animate-spin`} />
          <p className="mt-4 font-semibold text-gray-800">Extracting Text...</p>
          <p className="text-sm text-gray-500">
            {uploadProgress}% complete • Est. ~{Math.max(0, estimatedTime - elapsedTime)}s left
          </p>
        </>
      );
    case "success":
      return (
        <>
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <IconCheckCircle className={iconSize} />
          </motion.div>
          <p className="mt-4 font-semibold text-green-700">Text Extracted</p>
          <p className="text-sm text-gray-500">Handing off to AI for analysis...</p>
        </>
      );
    case "error":
      return (
        <>
          <motion.div initial={{ scale: 0.5, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }}>
            <IconAlertCircle className={iconSize} />
          </motion.div>
          <p className="mt-4 font-semibold text-red-700">Processing Failed</p>
          <p className="text-sm text-gray-500">Please try another file.</p>
        </>
      );
    case "idle":
    default:
      return (
        <>
          <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
            <IconUpload className={iconSize} />
          </motion.div>
          <p className="mt-4 font-medium text-gray-700">
            Drop your file here or{" "}
            <span className="font-semibold text-indigo-600 cursor-pointer">browse</span>
          </p>
          <p className="text-sm text-gray-500">Max File Size: 50MB</p>
        </>
      );
  }
};