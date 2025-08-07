// src/types/task.ts

// More detailed priority levels
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'none';

// Standardized task status (can be extended)
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'cancelled' | 'on-hold' | 'backlog';

// Supported document types for analysis context
export type DocumentType =
  | 'general_document'
  | 'meeting_minutes'
  | 'project_plan'
  | 'email'
  | 'contract'
  | 'invoice'
  | 'resume'
  | 'research_paper'
  | 'manual'
  | 'unknown';

// --- Enhanced TaskItem Interface ---
export interface TaskItem {
  // --- Core Identifiers ---
  id: string; // Unique identifier for the task
  tempId?: string; // Temporary ID used before persistence (e.g., for drag-and-drop)

  // --- Content & Description ---
  content: string; // Main task description
  notes?: string; // Additional details or context
  category?: string; // Primary category (might be superseded by groups)
  tags: string[]; // Keywords for filtering/searching

  // --- Scheduling & Time Management ---
  priority: TaskPriority; // Urgency/Importance
  status: TaskStatus; // Current state of the task
  estimatedTime: number; // Estimated duration in minutes
  actualTimeSpent?: number; // Actual time tracked (in minutes)
  startDate?: string; // ISO 8601 date string (YYYY-MM-DD)
  deadline?: string; // ISO 8601 date string (YYYY-MM-DD) or relative (e.g., "end of week")
  completed: boolean; // Simple boolean for completion status (might be derived from status)

  // --- Assignment & Collaboration ---
  assignee?: string; // Person or team responsible
  reviewers?: string[]; // People who need to review this task
  stakeholders?: string[]; // People interested/affected by this task

  // --- Dependencies & Structure ---
  dependencies: string[]; // IDs of tasks this task depends on
  subtasks: TaskItem[]; // Nested subtasks
  parentId?: string; // ID of the parent task if this is a subtask

  // --- Metadata & Context ---
  createdAt: string; // ISO 8601 timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
  updatedAt?: string; // ISO 8601 timestamp
  completedAt?: string; // ISO 8601 timestamp
  sourceDocument?: string; // Name or ID of the source document
  sourceDocumentType?: DocumentType; // Type of the source document
  sourceDocumentPage?: number; // Page number in the source document (if applicable)
  chunkId?: number; // Internal ID of the text chunk from which this task was extracted (for AI analysis)

  // --- Advanced & Extensible ---
  projectId?: string; // Link to a project if part of one
  // Allows for custom key-value pairs for application-specific data
  customFields?: Record<string, string | number | boolean | null>;
  // Potentially add recurrence rules, attachments, links, etc.
}

// --- Enhanced TaskGroup Interface ---
export interface TaskGroup {
  id: string; // Unique identifier for the group
  name: string; // Display name of the group
  description: string; // Brief explanation of the group's purpose
  tasks: TaskItem[]; // List of tasks belonging to this group

  // --- UI/UX Enhancements ---
  color?: string; // Hex code or theme color for visual distinction
  order?: number; // Display order of groups
  isCollapsed?: boolean; // UI state for collapsing/expanding the group

  // --- Metadata ---
  createdAt?: string; // ISO 8601 timestamp
  updatedAt?: string; // ISO 8601 timestamp
}

// --- Enhanced AnalysisSummary Interface ---
export interface AnalysisSummary {
  // --- Core Project Info ---
  projectDescription: string; // A concise overview of the document/project
  objectives?: string[]; // Specific goals derived from the document
  scope?: string; // Defined boundaries or inclusions/exclusions

  // --- Planning Elements ---
  milestones: string[]; // Key deliverables or checkpoints
  resources: string[]; // People, tools, or materials mentioned/needed
  stakeholders?: string[]; // Individuals or groups involved or affected

  // --- Risk & Strategy ---
  risks: string[]; // Potential problems or obstacles identified
  recommendations: string[]; // Suggestions for next steps or actions

  // --- Metadata ---
  keyThemes?: string[]; // Recurring topics or ideas
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed'; // Overall tone (if analyzed)
}

// --- Enhanced ProcessingStats Interface ---
export interface ProcessingStats {
  // --- Core Metrics ---
  tokensUsed: number; // Total tokens consumed by the AI analysis
  processingTime: number; // Total time taken for analysis in milliseconds

  // --- Detailed Breakdown (Optional) ---
  tokensUsedByStep?: {
    taskExtraction?: number;
    categorization?: number;
    summarization?: number;
  };
  modelUsed?: string; // The AI model used for processing (e.g., 'llama3-70b-8192')
  apiCallsMade?: number; // Number of calls made to the AI service
  retries?: number; // Number of retries performed due to failures
}

// --- Main AnalysisResult Interface ---
export interface AnalysisResult {
  // --- Core Output ---
  totalTasks: number; // Count of unique tasks extracted/generated
  groups: TaskGroup[]; // Tasks organized into logical groups
  summary?: AnalysisSummary; // High-level overview and insights

  // --- Input Context ---
  fileName?: string; // Name of the file analyzed
  sourceDocumentType?: DocumentType; // Type of the document analyzed

  // --- Processing Metadata ---
  processedAt: string; // ISO 8601 timestamp when analysis finished
  processingStats?: ProcessingStats; // Detailed stats about the analysis run

  // --- Status & Outcome ---
  // These can provide context about the analysis result, especially for edge cases
  analysisOutcome?: 'success' | 'no_content' | 'no_tasks_found' | 'partial_failure' | 'failure';
  outcomeMessage?: string; // Human-readable message about the outcome
}
