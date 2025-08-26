// src/types/task.ts

export interface TaskItem {
  id: string;
  content: string;
  completed: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'none';
  estimatedTime: number | null;
  deadline: string | null; // ISO 8601 string format
  createdAt: string;      // ISO 8601 string format
  updatedAt: string;      // ISO 8601 string format
  assignee?: string;
  tags?: string[];
  groupName?: string; // Denormalized for easier access in the UI
  groupId: string; // Added groupId to TaskItem
}

export interface TaskGroup {
  id: string;
  name: string;
  expanded: boolean; // Added expanded property
  tasks: TaskItem[]; // This should be an array of TaskItems
}

export interface AnalysisSummary {
  projectDescription: string;
  milestones: string[];
  resources: string[];
}

export interface AnalysisResult {
  analysisId: string;
  totalTasks: number;
  groups: TaskGroup[];
  summary: AnalysisSummary | null;
}

// New type for a full history document from Firestore
export interface HistoryItem {
    id: string;
    title: string; 
    fileName: string; 
    analysisResult: AnalysisResult;
    createdAt:any; // Firestore Timestamp format
    shareCount: number;
    tags: string[];
    metadata: Record<string, any>;
    userId: string;    
    isFavorite?: boolean;
    shareId?: string; // ✅ FIXED: Added optional shareId property
}