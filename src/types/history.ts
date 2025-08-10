// src/types/history.ts
export interface HistoryItem {
  id: string;
  fileName: string;
  analysisResult: any; // Would normally be AnalysisResult from task types
  createdAt: string;
  shareCount?: number;
  lastSharedAt?: string | null;
  isPublic: boolean;
  password?: string | null;
  expiresAt?: string | null;
}

export interface HistoryStats {
  totalItems: number;
  sharedItems: number;
  totalShares: number;
  mostSharedItem?: HistoryItem;
}