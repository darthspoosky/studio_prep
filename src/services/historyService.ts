import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
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
    return null;
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
