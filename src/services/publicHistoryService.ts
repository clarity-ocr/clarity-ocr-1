// src/services/publicHistoryService.ts
import { AnalysisResult } from '@/types/task';

export interface PublicHistoryItem {
  id: string;
  fileName: string;
  analysisResult: AnalysisResult;
  createdAt: Date;
}

export const getPublicHistoryItem = async (id: string): Promise<PublicHistoryItem> => {
  try {
    // Simulate API call - replace with actual implementation
    const response = await fetch(`/api/public/history/${id}`);
    const data = await response.json();
    
    // Type assertion to match expected shape
    return {
      id: data.id,
      fileName: data.fileName,
      analysisResult: data.analysisResult,
      createdAt: new Date(data.createdAt)
    };
  } catch (error) {
    console.error('Error fetching public history item:', error);
    throw error;
  }
};