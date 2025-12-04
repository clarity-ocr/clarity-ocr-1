import { Timestamp } from 'firebase/firestore';

// --- ENUMS & UNIONS ---

export type ProcessingStatus = 
  | 'queued' 
  | 'processing' 
  | 'extracting_tasks' 
  | 'completed' 
  | 'error';

export type DocType = 'invoice' | 'receipt' | 'contract' | 'report' | 'handwritten' | 'other';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

// --- CORE INTERFACES ---

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members: {
    [userId: string]: 'admin' | 'editor' | 'viewer';
  };
  createdAt: Timestamp;
  plan: 'free' | 'pro' | 'enterprise';
  storageUsed: number; // bytes
}

export interface ClarityDocument {
  id: string;
  workspaceId: string;
  uploaderId: string;
  name: string;
  fileUrl: string; // Firebase Storage URL
  thumbnailUrl?: string; 
  fileType: string; // 'application/pdf', 'image/png', etc.
  fileSize: number; // bytes
  docType: DocType;
  
  // OCR Data
  processingStatus: ProcessingStatus;
  ocrConfidence: number; // 0-100
  extractedText: string; // Full raw text
  pageCount: number;
  language: string; // 'eng', 'hin', 'tam', etc.
  
  // Metadata
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  errorMsg?: string;
}

export interface ClarityTask {
  id: string;
  workspaceId: string;
  documentId?: string; // Link back to source doc
  creatorId: string;
  assigneeId?: string;
  
  // Content
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  
  // AI/Extraction Data
  confidenceScore: number; // 0-100
  sourceTextSnippet?: string; // The specific text in doc this task came from
  
  // Dates
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  
  // Meta
  tags: string[];
  commentsCount: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  pages: {
    pageNumber: number;
    text: string;
  }[];
}