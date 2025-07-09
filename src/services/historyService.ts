
'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp, doc, getDoc, onSnapshot, limit, deleteDoc } from 'firebase/firestore';
import type { NewspaperAnalysisOutput, MCQ, MainsQuestion } from '@/ai/flows/newspaper-analysis-flow';

export interface HistoryEntry {
  id: string;
  userId: string;
  analysis: NewspaperAnalysisOutput;
  timestamp: Timestamp;
  articleUrl?: string; // Optional: to link back to the source
}

export type PrelimsQuestionWithContext = MCQ & {
    historyId: string;
    timestamp: Timestamp;
    articleUrl?: string;
};

export type MainsQuestionWithContext = MainsQuestion & {
    historyId: string;
    timestamp: Timestamp;
    articleUrl?: string;
};


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

// Fetches all history for a user.
async function getAllHistory(userId: string): Promise<HistoryEntry[]> {
  if (!db) {
    console.log("Firestore not initialized. Skipping getAllHistory.");
    return [];
  }
  
  const history: HistoryEntry[] = [];
  try {
    const q = query(collection(db, 'userHistory'), where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() } as HistoryEntry);
    });

    history.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

  } catch(error) {
      console.error("Error fetching all history: ", error);
      if ((error as any).code === 'permission-denied') {
          throw new Error("Could not read history due to a permission error. Please ensure your Firestore security rules allow 'list' operations on the 'userHistory' collection for authenticated users.");
      }
      throw error;
  }
  return history;
}

export async function getFullHistory(userId: string): Promise<HistoryEntry[]> {
    return getAllHistory(userId);
}


export async function getHistory(userId: string): Promise<HistoryEntry[]> {
  if (!db) {
    console.log("Firestore not initialized. Skipping getHistory.");
    return [];
  }
  const allHistory = await getAllHistory(userId);
  return allHistory.slice(0, 20);
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

export async function deleteHistoryEntry(id: string): Promise<void> {
    if (!db) {
      console.log("Firestore not initialized. Skipping deleteHistoryEntry.");
      return;
    }
    try {
      const docRef = doc(db, 'userHistory', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting history entry: ", error);
      throw new Error("Could not delete the analysis entry.");
    }
}

export async function getPrelimsQuestions(userId: string): Promise<PrelimsQuestionWithContext[]> {
    const allHistory = await getAllHistory(userId);
    const prelimsQuestions = allHistory.flatMap(entry => 
        (entry.analysis.prelims?.mcqs || []).map(mcq => ({
            ...mcq,
            historyId: entry.id,
            timestamp: entry.timestamp,
            articleUrl: entry.articleUrl
        }))
    );
    return prelimsQuestions;
}

export async function getRandomPrelimsQuestions(userId: string, count: number): Promise<PrelimsQuestionWithContext[]> {
    const allQuestions = await getPrelimsQuestions(userId);
    if (allQuestions.length === 0) {
        return [];
    }
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}


export async function getMainsQuestions(userId: string): Promise<MainsQuestionWithContext[]> {
    const allHistory = await getAllHistory(userId);
    const mainsQuestions = allHistory.flatMap(entry => 
        (entry.analysis.mains?.questions || []).map(question => ({
            ...question,
            historyId: entry.id,
            timestamp: entry.timestamp,
            articleUrl: entry.articleUrl
        }))
    );
    return mainsQuestions;
}

export async function getQuestionStats(userId:string) {
    const allHistory = await getAllHistory(userId);
    let prelimsCount = 0;
    let mainsCount = 0;
    allHistory.forEach(entry => {
        prelimsCount += entry.analysis.prelims?.mcqs?.length || 0;
        mainsCount += entry.analysis.mains?.questions?.length || 0;
    });
    return { prelimsCount, mainsCount };
}

// Sets up a real-time listener for history updates.
export function onHistoryUpdate(userId: string, callback: (history: HistoryEntry[]) => void) {
  if (!db) {
    console.log("Firestore not initialized. Skipping onHistoryUpdate.");
    return () => {}; // Return a no-op unsubscribe function
  }
  
  const q = query(
    collection(db, 'userHistory'), 
    where('userId', '==', userId), 
    orderBy('timestamp', 'desc'),
    limit(20) // Performance: only listen to the most recent 20 entries
  );
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const history: HistoryEntry[] = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() } as HistoryEntry);
    });
    callback(history);
  }, (error) => {
      console.error("Error listening to history updates: ", error);
  });

  return unsubscribe;
}
