// src/types/dashboard.ts

export interface QuickStats {
    documentsUploaded: number;
    documentsTrend: number; // Percentage change
    tasksPending: number;
    tasksCompleted: number;
    storageUsed: number; // in MB
    storageLimit: number; // in MB
  }
  
  export interface ActivityLog {
    id: string;
    type: 'upload' | 'extraction' | 'task_update' | 'comment';
    user: string;
    userAvatar?: string;
    description: string;
    timestamp: Date;
    documentId?: string;
  }
  
  export interface UpcomingDeadline {
    id: string;
    title: string;
    dueDate: Date;
    priority: 'high' | 'medium' | 'low';
    documentName: string;
  }
  
  export interface RecentDocument {
    id: string;
    name: string;
    thumbnailUrl?: string; // If image
    uploadDate: Date;
    status: 'processing' | 'completed' | 'error';
    confidence: number;
  }