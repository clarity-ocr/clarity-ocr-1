import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { HistoryItem } from '@/types/task';

export const createPublicShareLink = async (historyItem: HistoryItem): Promise<string> => {
  if (historyItem.shareId) return historyItem.shareId;
  const publicDocRef = doc(db, 'publicChecklists', historyItem.id);
  const publicData = {
    originalOwnerId: historyItem.userId,
    originalDocId: historyItem.id,
    title: historyItem.title,
    fileName: historyItem.fileName,
    analysisResult: historyItem.analysisResult,
    createdAt: historyItem.createdAt,
    sharedAt: serverTimestamp(),
  };
  await setDoc(publicDocRef, publicData);
  const originalDocRef = doc(db, `users/${historyItem.userId}/history`, historyItem.id);
  await updateDoc(originalDocRef, { shareId: historyItem.id });
  return historyItem.id;
};

export const getPublicChecklist = async (shareId: string): Promise<any> => {
  const docRef = doc(db, 'publicChecklists', shareId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Public checklist not found.');
  return { id: docSnap.id, ...docSnap.data() };
};

// ✅ FIXED: Export the WhatsApp function
export const shareViaWhatsApp = async (shareLink: string, title: string) => {
    const text = encodeURIComponent(`Check out this project plan: ${title}\n\n${shareLink}`);
    // A simple prompt is used for demonstration. A real app might use a more sophisticated contact picker.
    const phoneNumber = prompt(`Enter the recipient's full phone number (including country code, e.g., +1...):`);
    if (phoneNumber) {
        window.open(`https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${text}`, '_blank');
    }
};