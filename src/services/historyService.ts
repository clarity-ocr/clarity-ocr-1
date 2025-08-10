// src/services/historyService.ts
import { HistoryItem } from '@/types/history';
import { AnalysisResult } from '@/types/task';

// Generate a unique ID for sharing
export const generateShareId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Generate a shareable link
export const generateShareableLink = (id: string): string => {
  return `${window.location.origin}/shared/${id}`;
};

// Add to history with sharing capabilities
export const addToHistory = async (
  analysisResult: AnalysisResult, 
  fileName: string
): Promise<string | null> => {
  try {
    const shareId = generateShareId();
    const historyItem: HistoryItem = {
      id: shareId,
      fileName,
      analysisResult,
      createdAt: new Date().toISOString(),
      shareCount: 0,
      lastSharedAt: null,
      isPublic: true, // Default to public
      password: null, // No password by default
      expiresAt: null, // No expiration by default
    };
    
    // Get existing history
    const existingHistory = getHistoryFromStorage();
    
    // Add new item
    const updatedHistory = [historyItem, ...existingHistory];
    
    // Save to storage
    localStorage.setItem('clarity-history', JSON.stringify(updatedHistory));
    
    return shareId;
  } catch (error) {
    console.error('Error saving to history:', error);
    return null;
  }
};

// Update history item
export const updateHistoryItem = async (
  id: string,
  analysisResult: AnalysisResult
): Promise<void> => {
  try {
    const history = getHistoryFromStorage();
    const itemIndex = history.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
      history[itemIndex] = {
        ...history[itemIndex],
        analysisResult
      };
      localStorage.setItem('clarity-history', JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error updating history item:', error);
    throw error;
  }
};

// Get history item by share ID
export const getHistoryItem = async (id: string): Promise<HistoryItem | null> => {
  try {
    const history = getHistoryFromStorage();
    return history.find(item => item.id === id) || null;
  } catch (error) {
    console.error('Error fetching history item:', error);
    return null;
  }
};

// Get all history items
export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    return getHistoryFromStorage();
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
};

// Delete history item
export const deleteHistoryItem = async (id: string): Promise<void> => {
  try {
    const history = getHistoryFromStorage();
    const updatedHistory = history.filter(item => item.id !== id);
    localStorage.setItem('clarity-history', JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error deleting history item:', error);
    throw error;
  }
};

// Update sharing settings
export const updateSharingSettings = async (
  id: string,
  settings: {
    isPublic?: boolean;
    password?: string | null;
    expiresAt?: string | null;
  }
): Promise<void> => {
  try {
    const history = getHistoryFromStorage();
    const itemIndex = history.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
      history[itemIndex] = {
        ...history[itemIndex],
        ...settings
      };
      localStorage.setItem('clarity-history', JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error updating sharing settings:', error);
    throw error;
  }
};

// Increment share count
export const incrementShareCount = async (id: string): Promise<void> => {
  try {
    const history = getHistoryFromStorage();
    const itemIndex = history.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
      history[itemIndex] = {
        ...history[itemIndex],
        shareCount: (history[itemIndex].shareCount || 0) + 1,
        lastSharedAt: new Date().toISOString()
      };
      localStorage.setItem('clarity-history', JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error incrementing share count:', error);
  }
};

// Get history from local storage
const getHistoryFromStorage = (): HistoryItem[] => {
  try {
    const historyData = localStorage.getItem('clarity-history');
    return historyData ? JSON.parse(historyData) : [];
  } catch (error) {
    console.error('Error parsing history data:', error);
    return [];
  }
};