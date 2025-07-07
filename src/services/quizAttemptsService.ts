
'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, doc, setDoc, orderBy } from 'firebase/firestore';

export interface QuizAttempt {
    userId: string;
    historyId: string;
    question: string;
    selectedOption: string;
    isCorrect: boolean;
    timestamp: Timestamp;
    subject?: string; 
    difficulty?: number;
}

// Using setDoc with a custom ID to prevent duplicate attempts for the same question
export async function saveQuizAttempt(userId: string, historyId: string, question: string, selectedOption: string, isCorrect: boolean, subject?: string, difficulty?: number) {
  if (!db) {
    console.log("Firestore not initialized. Skipping saveQuizAttempt.");
    return;
  }
  
  const questionHash = btoa(unescape(encodeURIComponent(question))).substring(0, 20);
  const attemptId = `${userId}_${historyId}_${questionHash}`;

  try {
    const attemptRef = doc(db, 'quizAttempts', attemptId);
    await setDoc(attemptRef, {
      userId,
      historyId,
      question,
      selectedOption,
      isCorrect,
      subject: subject || 'General',
      difficulty: difficulty || 5,
      timestamp: new Date(),
    }, { merge: true }); // Use merge to avoid overwriting old attempts completely
  } catch (error) {
    console.error("Error saving quiz attempt: ", error);
  }
}

export async function getQuizAttemptsForHistory(userId: string, historyId: string): Promise<{[question: string]: string}> {
  if (!db) return {};
  
  const attempts: {[question: string]: string} = {};
  try {
    const q = query(collection(db, 'quizAttempts'), where('userId', '==', userId), where('historyId', '==', historyId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      attempts[data.question] = data.selectedOption;
    });
    return attempts;
  } catch (error) {
    console.error("Error fetching quiz attempts: ", error);
    return {};
  }
}

export async function getAllUserAttempts(userId: string): Promise<{[question: string]: string}> {
  if (!db) return {};
  
  const attempts: {[question: string]: string} = {};
  const allAttempts: any[] = []; 

  try {
    // Removed orderBy to prevent needing a composite index. Sorting is now done on the client.
    const q = query(collection(db, 'quizAttempts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      allAttempts.push(doc.data());
    });
    
    // Sort client-side by timestamp, most recent first
    allAttempts.sort((a,b) => b.timestamp.toMillis() - a.timestamp.toMillis());

    // Populate the attempts object, ensuring only the most recent attempt for each question is stored.
    allAttempts.forEach(data => {
        if (!attempts[data.question]) {
            attempts[data.question] = data.selectedOption;
        }
    });

    return attempts;
  } catch (error) {
    console.error("Error fetching all user quiz attempts: ", error);
    if ((error as any).code === 'permission-denied') {
        throw new Error("Could not read quiz attempts due to a permission error. This usually happens when a Firestore index is missing. Please check your browser's developer console for a link to create the required index.");
    }
    return {};
  }
}

export interface UserQuizStats {
    totalAttempted: number;
    totalCorrect: number;
    accuracy: number;
}

export async function getUserQuizStats(userId: string): Promise<UserQuizStats> {
  if (!db) return { totalAttempted: 0, totalCorrect: 0, accuracy: 0 };
  
  try {
    const q = query(collection(db, 'quizAttempts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const uniqueQuestions = new Map<string, { isCorrect: boolean }>();
    
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Store the most recent attempt for each unique question
        uniqueQuestions.set(data.question, { isCorrect: data.isCorrect });
    });

    const totalAttempted = uniqueQuestions.size;
    let totalCorrect = 0;

    uniqueQuestions.forEach(attempt => {
        if (attempt.isCorrect) {
            totalCorrect++;
        }
    });

    const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

    return { totalAttempted, totalCorrect, accuracy };
  } catch (error) {
    console.error("Error fetching user quiz stats: ", error);
    return { totalAttempted: 0, totalCorrect: 0, accuracy: 0 };
  }
}
