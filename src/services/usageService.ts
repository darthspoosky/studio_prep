import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, increment, writeBatch } from 'firebase/firestore';

export interface UsageStats {
  newspaperAnalysis?: number;
  mockInterview?: number;
  dailyQuiz?: number;
  writingPractice?: number;
}

// Function to increment usage for a specific tool for a user and globally
export async function incrementToolUsage(userId: string, tool: keyof UsageStats) {
  if (!db) {
    console.log("Firestore not initialized. Skipping incrementToolUsage.");
    return;
  }
  
  const batch = writeBatch(db);

  // Increment global stats
  const globalRef = doc(db, 'toolUsage', 'global');
  batch.set(globalRef, { [tool]: increment(1) }, { merge: true });

  // Increment user-specific stats
  const userRef = doc(db, 'toolUsage', userId);
  batch.set(userRef, { [tool]: increment(1) }, { merge: true });
  
  try {
    await batch.commit();
  } catch (error) {
    console.error("Error incrementing tool usage: ", error);
  }
}

// Function to get global usage stats
export async function getGlobalUsage(): Promise<UsageStats> {
  if (!db) {
    console.log("Firestore not initialized. Skipping getGlobalUsage.");
    return {};
  }

  try {
    const docRef = doc(db, 'toolUsage', 'global');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as UsageStats) : {};
  } catch (error) {
      console.error("Error fetching global usage: ", error);
      return {};
  }
}

// Function to get user-specific usage stats
export async function getUserUsage(userId: string): Promise<UsageStats> {
  if (!db) {
    console.log("Firestore not initialized. Skipping getUserUsage.");
    return {};
  }

  try {
    const docRef = doc(db, 'toolUsage', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as UsageStats) : {};
  } catch(error) {
      console.error("Error fetching user usage: ", error);
      return {};
  }
}
