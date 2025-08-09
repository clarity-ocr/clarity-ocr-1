// src/types/history.ts
import { AnalysisResult } from '@/types/task';

export interface HistoryEntry {
  id: string; // Unique identifier for the history entry
  timestamp: string; // ISO string of when it was saved
  analysisResult: AnalysisResult; // The full analysis result
  fileName?: string; // Optional filename if uploaded
  title: string; // A descriptive title for the entry
}

export type HistoryList = HistoryEntry[];