// src/services/shareService.ts
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { HistoryItem } from '@/types/history';

export const createPublicShareLink = async (historyId: string): Promise<string> => {
  try {
    const historyDocRef = doc(db, 'history', historyId);
    const historyDoc = await getDoc(historyDocRef);
    
    if (!historyDoc.exists()) {
      throw new Error('History item not found');
    }
    
    // Update sharing settings
    await updateDoc(historyDocRef, {
      'sharing.isPublic': true,
      'sharing.expiresAt': null,
      'sharing.password': null,
      updatedAt: serverTimestamp()
    });
    
    return `${window.location.origin}/public/checklist/${historyId}`;
  } catch (error) {
    console.error('Error creating public share link:', error);
    throw error;
  }
};

// Generate a shareable link for a checklist
export const generateShareLink = (id: string): string => {
  return `${window.location.origin}/share/${id}`;
};

// Increment the share count for analytics
export const incrementShareCount = async (id: string): Promise<void> => {
  try {
    const historyDocRef = doc(db, 'history', id);
    const historyDoc = await getDoc(historyDocRef);
    
    if (!historyDoc.exists()) {
      throw new Error('History item not found');
    }
    
    const currentData = historyDoc.data();
    const currentShareCount = currentData?.shareCount || 0;
    
    await updateDoc(historyDocRef, {
      shareCount: currentShareCount + 1,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error incrementing share count:', error);
    throw error;
  }
};

// Get shared checklist data
export const getSharedChecklist = async (id: string): Promise<HistoryItem | null> => {
  try {
    const historyDocRef = doc(db, 'history', id);
    const historyDoc = await getDoc(historyDocRef);
    
    if (!historyDoc.exists()) {
      return null;
    }
    
    const data = historyDoc.data();
    
    // Check if sharing is enabled
    if (!data?.sharing?.isPublic) {
      throw new Error('This checklist is not publicly shared');
    }
    
    return {
      id: historyDoc.id,
      ...data
    } as HistoryItem;
  } catch (error) {
    console.error('Error fetching shared checklist:', error);
    throw error;
  }
};