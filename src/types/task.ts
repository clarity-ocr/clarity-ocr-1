export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  completed: boolean;
  category?: string;
  deadline?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface TaskGroup {
  category: string;
  tasks: Task[];
}

export interface AnalysisResult {
  groups: TaskGroup[];
  totalTasks: number;
  estimatedTime?: string;
  summary?: string;
}