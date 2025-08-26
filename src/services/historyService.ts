// src/services/historyService.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase'; // Make sure auth is exported from firebase.ts
import { HistoryItem, TaskItem, AnalysisResult } from '../types/task';

/**
 * Fetches a single history item by ID
 */
export const getHistoryItem = async (
  userId: string,
  historyId: string
): Promise<HistoryItem | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'history', historyId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...(docSnap.data() as Omit<HistoryItem, 'id'>)
      } as HistoryItem;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching history item:', error);
    throw new Error('Failed to fetch history item');
  }
};

/**
 * Creates a new history item
 */
export const createHistoryItem = async (
  userId: string,
  item: Omit<HistoryItem, 'id' | 'createdAt'>
): Promise<HistoryItem> => {
  try {
    const newItem = {
      ...item,
      createdAt: Timestamp.now()
    };
    
    const docRef = doc(collection(db, 'users', userId, 'history'));
    await setDoc(docRef, newItem);
    
    return {
      id: docRef.id,
      ...newItem
    } as HistoryItem;
  } catch (error) {
    console.error('Error creating history item:', error);
    throw new Error('Failed to create history item');
  }
};

/**
 * Updates an existing history item
 */
export const updateHistoryItem = async (
  userId: string,
  historyId: string,
  updates: Partial<Omit<HistoryItem, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'history', historyId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating history item:', error);
    throw new Error('Failed to update history item');
  }
};

/**
 * Deletes a history item
 */
export const deleteHistoryItem = async (
  userId: string,
  historyId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'history', historyId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting history item:', error);
    throw new Error('Failed to delete history item');
  }
};

/**
 * Fetches all history items for the current user
 * @returns Promise resolving to array of HistoryItem objects
 */
export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userId = user.uid;
    const historyRef = collection(db, 'users', userId, 'history');

    const q = query(historyRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const items: HistoryItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<HistoryItem, 'id'>;
      items.push({
        id: doc.id,
        ...data
      } as HistoryItem);
    });

    return items;
  } catch (error) {
    console.error('Error fetching history:', error);
    throw new Error('Failed to fetch history');
  }
};

/**
 * Fetches paginated history items for a user
 */
export const getUserHistoryWithPagination = async (
  userId: string,
  lastDoc: DocumentSnapshot | null,
  pageSize: number = 10
): Promise<{ items: HistoryItem[]; lastDoc: DocumentSnapshot | null }> => {
  try {
    const historyRef = collection(db, 'users', userId, 'history');
    
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];
    
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    const q = query(historyRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const items: HistoryItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...(doc.data() as Omit<HistoryItem, 'id'>)
      } as HistoryItem);
    });
    
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    
    return { items, lastDoc: newLastDoc };
  } catch (error) {
    console.error('Error fetching history:', error);
    throw new Error('Failed to fetch history');
  }
};

/**
 * Updates the status of a specific task in a history item
 */
export const updateTaskStatusInDb = async (
  userId: string,
  historyId: string,
  taskId: string,
  completed: boolean
): Promise<void> => {
  try {
    const historyItem = await getHistoryItem(userId, historyId);
    if (!historyItem) {
      throw new Error('History item not found');
    }
    
    const updatedGroups = historyItem.analysisResult.groups.map(group => ({
      ...group,
      tasks: group.tasks.map(task => 
        task.id === taskId 
          ? { ...task, completed, updatedAt: new Date().toISOString() } 
          : task
      )
    }));
    
    await updateHistoryItem(userId, historyId, { 
      analysisResult: {
        ...historyItem.analysisResult,
        groups: updatedGroups
      }
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    throw new Error('Failed to update task status');
  }
};

/**
 * Updates the content of a specific task in a history item
 */
export const updateTaskContentInDb = async (
  userId: string,
  historyId: string,
  taskId: string,
  content: string
): Promise<void> => {
  try {
    const historyItem = await getHistoryItem(userId, historyId);
    if (!historyItem) {
      throw new Error('History item not found');
    }
    
    const updatedGroups = historyItem.analysisResult.groups.map(group => ({
      ...group,
      tasks: group.tasks.map(task => 
        task.id === taskId 
          ? { ...task, content, updatedAt: new Date().toISOString() } 
          : task
      )
    }));
    
    await updateHistoryItem(userId, historyId, { 
      analysisResult: {
        ...historyItem.analysisResult,
        groups: updatedGroups
      }
    });
  } catch (error) {
    console.error('Error updating task content:', error);
    throw new Error('Failed to update task content');
  }
};

/**
 * Adds a new task to a history item
 */
export const addTaskToDb = async (
  userId: string,
  historyId: string,
  groupId: string,
  task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TaskItem> => {
  try {
    const historyItem = await getHistoryItem(userId, historyId);
    if (!historyItem) {
      throw new Error('History item not found');
    }
    
    const newTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      groupId,
      ...task
    };
    
    const updatedGroups = historyItem.analysisResult.groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          tasks: [...group.tasks, newTask]
        };
      }
      return group;
    });
    
    await updateHistoryItem(userId, historyId, { 
      analysisResult: {
        ...historyItem.analysisResult,
        groups: updatedGroups
      }
    });
    
    return newTask;
  } catch (error) {
    console.error('Error adding task:', error);
    throw new Error('Failed to add task');
  }
};

/**
 * Deletes a task from a history item
 */
export const deleteTaskFromDb = async (
  userId: string,
  historyId: string,
  taskId: string
): Promise<void> => {
  try {
    const historyItem = await getHistoryItem(userId, historyId);
    if (!historyItem) {
      throw new Error('History item not found');
    }
    
    const updatedGroups = historyItem.analysisResult.groups.map(group => ({
      ...group,
      tasks: group.tasks.filter(task => task.id !== taskId)
    }));
    
    await updateHistoryItem(userId, historyId, { 
      analysisResult: {
        ...historyItem.analysisResult,
        groups: updatedGroups
      }
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task');
  }
};

/**
 * Adds a new history item with analysis result to the user's history
 */
export const addToHistory = async (
  result: AnalysisResult,
  fileName: string = 'Untitled Document'
): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userId = user.uid;

    const historyItemData: Omit<HistoryItem, 'id' | 'createdAt'> = {
      title: fileName,
      fileName, // Optional, if used
      analysisResult: result,
      shareCount: 0,
      tags: [],
      metadata: {},
      userId
    };

    const newHistoryItem = await createHistoryItem(userId, historyItemData);
    return newHistoryItem.id;
  } catch (error) {
    console.error('Error adding to history:', error);
    throw new Error('Failed to save analysis result to history');
  }
};