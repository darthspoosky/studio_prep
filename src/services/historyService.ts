
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
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

    // Perform sorting in the application code after fetching.
    history.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

  } catch(error) {
      console.error("Error fetching all history: ", error);
      if ((error as any).code === 'permission-denied') {
          // This error message now points to a potential index issue that the user might have to create if Firestore prompts them.
          throw new Error("Could not read history due to a permission error. This usually happens when a Firestore index is missing. Please check your browser's developer console for a link to create the required index.");
      }
      throw error;
  }
  return history;
}


export async function getHistory(userId: string): Promise<HistoryEntry[]> {
  if (!db) {
    console.log("Firestore not initialized. Skipping getHistory.");
    return [];
  }
  const allHistory = await getAllHistory(userId);
  // Return the most recent 20 entries
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

export async function getPrelimsQuestions(userId: string): Promise<PrelimsQuestionWithContext[]> {
    const allHistory = await getAllHistory(userId);
    // Data from getAllHistory is now sorted chronologically
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

export async function getMainsQuestions(userId: string): Promise<MainsQuestionWithContext[]> {
    const allHistory = await getAllHistory(userId);
    // Data from getAllHistory is now sorted chronologically
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
