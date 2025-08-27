import { doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc, increment, deleteField, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { HistoryItem } from '@/types/task';
import { v4 as uuidv4 } from 'uuid';

// ===================================================================================
// --- TYPES ---
// ===================================================================================

/**
 * Defines the structure for advanced sharing options.
 */
export interface ShareOptions {
  password?: string | null;
  expiresAt?: Date | null;
}

/**
 * A strongly-typed representation of the data stored in the public collection.
 * It's a subset of HistoryItem, containing only what is safe to be public.
 */
export interface PublicChecklist {
  id: string;
  originalOwnerUid: string;
  title: string;
  analysisResult: HistoryItem['analysisResult'];
  sharedAt: Timestamp;
  viewCount: number;
  password?: string | null;
  expiresAt?: Timestamp | null;
}


// ===================================================================================
// --- CORE SHARING LOGIC ---
// ===================================================================================

/**
 * Creates or updates a secure, public share link for a checklist.
 * Generates a new unique ID if one doesn't exist.
 * @param historyItem The original checklist item, must include the user's `uid`.
 * @param options Advanced options like password or expiration.
 * @returns The unique share ID.
 */
export const createOrUpdatePublicShareLink = async (
  historyItem: HistoryItem,
  options: ShareOptions = {}
): Promise<string> => {
  if (!historyItem.uid) {
    throw new Error("History item must include a user UID to be shared.");
  }

  // Use the existing shareId or generate a new, secure, non-guessable one.
  const shareId = historyItem.shareId || uuidv4();
  const publicDocRef = doc(db, 'publicChecklists', shareId);
  const originalDocRef = doc(db, `users/${historyItem.uid}/history`, historyItem.id);

  const publicData = {
    originalOwnerUid: historyItem.uid,
    title: historyItem.title,
    analysisResult: historyItem.analysisResult,
    sharedAt: serverTimestamp(),
    // Note: For real production, passwords should be hashed server-side.
    // Storing plain text passwords is not recommended.
    password: options.password || null, 
    expiresAt: options.expiresAt || null,
  };

  try {
    // Use setDoc with merge:true to create or update the public document
    await setDoc(publicDocRef, publicData, { merge: true });
    // Update the original document with the shareId
    await updateDoc(originalDocRef, { shareId: shareId });
    
    return shareId;
  } catch (error) {
    console.error("Error creating public share link:", error);
    throw new Error("Could not create share link. Please try again.");
  }
};

/**
 * Revokes a public share link, deleting the public document and unlinking it.
 * @param historyItem The original checklist item.
 */
export const revokePublicShareLink = async (historyItem: HistoryItem): Promise<void> => {
  if (!historyItem.shareId || !historyItem.uid) {
    console.log("No share link to revoke.");
    return;
  }

  const publicDocRef = doc(db, 'publicChecklists', historyItem.shareId);
  const originalDocRef = doc(db, `users/${historyItem.uid}/history`, historyItem.id);

  try {
    // Delete the public-facing document
    await deleteDoc(publicDocRef);
    // Remove the shareId field from the original user document
    await updateDoc(originalDocRef, { shareId: deleteField() });
  } catch (error) {
    console.error("Error revoking share link:", error);
    throw new Error("Could not revoke the share link. Please try again.");
  }
};

/**
 * Fetches a public checklist and increments its view count.
 * @param shareId The unique ID of the public checklist.
 * @returns The public checklist data.
 */
export const getPublicChecklist = async (shareId: string): Promise<PublicChecklist> => {
  const docRef = doc(db, 'publicChecklists', shareId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('This shared checklist does not exist or has been deleted.');
  }

  const data = docSnap.data() as Omit<PublicChecklist, 'id'>;

  // Check for expiration
  if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
    throw new Error('This share link has expired.');
  }
  
  // Atomically increment the view count without a race condition.
  // This is a "fire-and-forget" update for performance.
  updateDoc(docRef, { viewCount: increment(1) }).catch(err => console.error("Failed to increment view count", err));

  return { id: docSnap.id, ...data };
};


// ===================================================================================
// --- SOCIAL & NATIVE SHARING HELPERS ---
// ===================================================================================

/**
 * Attempts to use the native Web Share API for a seamless mobile experience.
 * @returns `true` if successful, `false` if the API is not available.
 */
export const nativeWebShare = async (shareLink: string, title: string): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: `Check out this checklist: ${title}`,
        url: shareLink,
      });
      return true; // Share was successful
    } catch (error) {
      console.error('Error using Web Share API:', error);
      return true; // User may have cancelled, but API was called.
    }
  }
  return false; // Web Share API not supported
};

/**
 * Opens the WhatsApp sharing dialog.
 */
export const shareViaWhatsApp = (shareLink: string, title: string) => {
  const message = `Check out this checklist: "${title}"\n\n${shareLink}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Opens the default email client with a pre-filled message.
 */
export const shareViaEmail = (shareLink: string, title: string) => {
  const subject = `Check out this checklist: ${title}`;
  const body = `I thought you might find this useful:\n\n${title}\n${shareLink}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
};

/**
 * Opens the Twitter "Web Intent" sharing dialog.
 */
export const shareViaTwitter = (shareLink: string, title: string) => {
  const text = `Check out this checklist: "${title}"`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`;
  window.open(twitterUrl, '_blank', 'noopener,noreferrer');
};