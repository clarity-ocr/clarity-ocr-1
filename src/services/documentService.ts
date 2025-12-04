import { 
    ref, 
    uploadBytesResumable, 
    getDownloadURL,
    deleteObject 
  } from "firebase/storage";
  import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    serverTimestamp,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    deleteDoc,
    Timestamp
  } from "firebase/firestore";
  import { db, storage, auth } from "@/firebase";
  import { ClarityDocument, OCRResult } from "@/types/schema";
  import { runOCR } from "@/lib/ocrEngine";
  
  const COLLECTION_NAME = "documents";
  
  // --- Types ---
  export interface DocumentFilter {
    status?: 'queued' | 'processing' | 'completed' | 'error';
    dateRange?: 'today' | 'week' | 'month' | 'all';
  }
  
  /**
   * Upload and Process Logic (Preserved from Phase 2, ensures backward compatibility)
   */
  export const uploadAndProcessDocument = async (
    file: File, 
    tags: string[] = [],
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User must be logged in");
  
    // 1. Upload to Storage
    const storagePath = `workspaces/${user.uid}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);
  
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress / 2); 
        },
        (error) => reject(error),
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
  
            // 2. Create Firestore Record
            const docData: Partial<ClarityDocument> = {
              uploaderId: user.uid,
              workspaceId: user.uid, 
              name: file.name,
              fileUrl: downloadUrl,
              fileType: file.type,
              fileSize: file.size,
              docType: 'other', 
              processingStatus: 'processing',
              ocrConfidence: 0,
              extractedText: '',
              pageCount: 1,
              language: 'eng',
              tags: tags,
              createdAt: serverTimestamp() as Timestamp,
              updatedAt: serverTimestamp() as Timestamp,
            };
  
            const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
  
            // 3. Run OCR (Client-Side for MVP)
            if (onProgress) onProgress(60);
            
            try {
              const ocrResult: OCRResult = await runOCR(file);
              if (onProgress) onProgress(90);
  
              await updateDoc(doc(db, COLLECTION_NAME, docRef.id), {
                extractedText: ocrResult.text,
                ocrConfidence: ocrResult.confidence,
                pageCount: ocrResult.pages.length,
                processingStatus: 'completed', 
                updatedAt: serverTimestamp(),
              });
  
              if (onProgress) onProgress(100);
              resolve(docRef.id);
  
            } catch (ocrError: any) {
               console.error("OCR Failed:", ocrError);
               await updateDoc(doc(db, COLLECTION_NAME, docRef.id), {
                  processingStatus: 'error',
                  errorMsg: ocrError.message || "OCR Extraction Failed"
               });
               resolve(docRef.id); 
            }
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };
  
  /**
   * Fetch All Documents for User
   */
  export const getUserDocuments = async (userId: string, filter?: DocumentFilter): Promise<ClarityDocument[]> => {
    try {
      let q = query(
        collection(db, COLLECTION_NAME), 
        where("uploaderId", "==", userId),
        orderBy("createdAt", "desc")
      );
  
      if (filter?.status && filter.status !== 'all' as any) {
        q = query(q, where("processingStatus", "==", filter.status));
      }
  
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClarityDocument));
    } catch (error) {
      console.error("Error fetching documents:", error);
      return [];
    }
  };
  
  /**
   * Fetch Single Document
   */
  export const getDocument = async (id: string): Promise<ClarityDocument | null> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as ClarityDocument;
      }
      return null;
    } catch (error) {
      console.error("Error fetching document:", error);
      return null;
    }
  };
  
  /**
   * Delete Document (Firestore + Storage)
   */
  export const deleteDocument = async (document: ClarityDocument): Promise<void> => {
    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, COLLECTION_NAME, document.id));
      
      // 2. Delete from Storage (if URL exists)
      if (document.fileUrl) {
        const storageRef = ref(storage, document.fileUrl);
        await deleteObject(storageRef).catch(e => console.warn("Storage delete failed (might not exist):", e));
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  };
  
  /**
   * Update Document Metadata
   */
  export const updateDocumentMetadata = async (id: string, data: Partial<ClarityDocument>): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  };