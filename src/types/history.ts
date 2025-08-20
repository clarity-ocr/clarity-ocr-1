// src/types/history.ts
import { AnalysisResult } from './task';

export interface SharingSettings {
  isPublic: boolean;
  password?: string | null;
  expiresAt?: string | null;
  lastSharedAt?: string | null;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  analysisResult: AnalysisResult;
  createdAt: string;
  updatedAt?: string;
  shareCount?: number;
  sharing?: SharingSettings;
}

export interface HistoryStats {
  totalItems: number;
  sharedItems: number;
  totalShares: number;
  mostSharedItem?: HistoryItem;
}