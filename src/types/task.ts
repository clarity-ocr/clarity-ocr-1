// src/types/task.ts
export interface TaskItem {
  id: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // in minutes
  deadline?: string;
  assignee?: string;
  completed: boolean;
  tags: string[];
  dependencies: string[];
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export interface TaskGroup {
  id: string;
  name: string;
  description: string;
  tasks: TaskItem[];
}

export interface AnalysisSummary {
  projectDescription: string;
  milestones: string[];
  resources: string[];
  risks: string[];
  recommendations: string[];
}

export interface ProcessingStats {
  tokensUsed: number;
  processingTime: number; // timestamp
}

export interface AnalysisResult {
  totalTasks: number;
  groups: TaskGroup[];
  summary?: AnalysisSummary;
  fileName?: string;
  processedAt: string;
  processingStats?: ProcessingStats;
}