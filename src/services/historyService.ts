// src/services/historyService.ts
import { HistoryEntry, HistoryList } from '@/types/history';
import { AnalysisResult } from '@/types/task';

const HISTORY_KEY = 'clarityOcrHistory';
const MAX_HISTORY_ITEMS = 50; // Prevent unlimited growth

// Load history from localStorage
export const loadHistory = (): HistoryList => {
  try {
    const historyData = localStorage.getItem(HISTORY_KEY);
    if (historyData) {
      const parsedHistory: HistoryEntry[] = JSON.parse(historyData);
      // Ensure dates are Date objects if needed, or just strings
      return parsedHistory;
    }
  } catch (error) {
    console.error("[HistoryService] Failed to load history from localStorage:", error);
  }
  return [];
};

// Save history to localStorage
export const saveHistory = (history: HistoryList): void => {
  try {
    // Keep only the latest N items
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
    console.log("[HistoryService] History saved to localStorage.");
  } catch (error) {
    console.error("[HistoryService] Failed to save history to localStorage:", error);
    // Consider showing a toast notification to the user if critical
  }
};

// Add a new analysis result to history
export const addToHistory = (analysisResult: AnalysisResult, fileName?: string): void => {
  const newEntry: HistoryEntry = {
    id: generateUniqueId(), // Implement this helper function
    timestamp: new Date().toISOString(),
    analysisResult,
    fileName,
    title: fileName ? `Analysis of ${fileName}` : `Analysis ${new Date().toLocaleString()}`
  };

  const currentHistory = loadHistory();
  const updatedHistory = [newEntry, ...currentHistory]; // Add to the beginning (most recent first)
  saveHistory(updatedHistory);
  console.log("[HistoryService] Analysis added to history:", newEntry.id);
};

// Delete a specific history entry by ID
export const deleteFromHistory = (id: string): void => {
  const currentHistory = loadHistory();
  const updatedHistory = currentHistory.filter(entry => entry.id !== id);
  saveHistory(updatedHistory);
  console.log(`[HistoryService] Entry ${id} deleted from history.`);
};

// Clear all history
export const clearHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_KEY);
    console.log("[HistoryService] History cleared from localStorage.");
  } catch (error) {
    console.error("[HistoryService] Failed to clear history from localStorage:", error);
  }
};

// Helper function to generate a unique ID (simple version)
// For production, consider using UUID library
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Generate a shareable link for a specific history entry
// This assumes you'll have a route like /shared/:id
export const generateShareableLink = (entryId: string): string => {
  // Use the current origin (e.g., https://yourdomain.com)
  // and append the path to the shared view
  return `${window.location.origin}/shared/${entryId}`;
};