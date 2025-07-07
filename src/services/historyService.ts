import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import type { NewspaperAnalysisOutput } from '@/ai/flows/newspaper-analysis-flow';

export interface HistoryEntry {
  id: string;
  userId: string;
  analysis: NewspaperAnalysisOutput;
  timestamp: Timestamp;
  articleUrl?: string; // Optional: to link back to the source
}

export async function addHistory(userId: string, analysis: NewspaperAnalysisOutput, articleUrl?: string) {
  if (!db) {
    console.log("Firestore not initialized. Skipping addHistory.");
    return null;
  }
  try {
    const docRef = await addDoc(collection(db, 'userHistory'), {
      userId,
      analysis,
      timestamp: new Date(),
      articleUrl,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding history document: ", error);
    if ((error as any).code === 'permission-denied') {
        throw new Error("Could not save analysis to your history due to a permission error. This can happen when creating your first history entry. Please update your Firestore security rules as per the documentation to allow 'create' operations on the 'userHistory' collection.");
    }
    throw error;
  }
}

export async function getHistory(userId: string): Promise<HistoryEntry[]> {
  if (!db) {
    console.log("Firestore not initialized. Skipping getHistory.");
    return [];
  }
  
  const history: HistoryEntry[] = [];
  try {
    const q = query(
        collection(db, 'userHistory'), 
        where('userId', '==', userId), 
        orderBy('timestamp', 'desc'), 
        limit(20)
    );
    
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() } as HistoryEntry);
    });
  } catch(error) {
      console.error("Error fetching history: ", error);
  }
  return history;
}


export async function getHistoryEntry(id: string): Promise<HistoryEntry | null> {
  if (!db) {
    console.log("Firestore not initialized. Skipping getHistoryEntry.");
    return null;
  }
  try {
    const docRef = doc(db, 'userHistory', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as HistoryEntry;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching history entry: ", error);
    return null;
  }
}
