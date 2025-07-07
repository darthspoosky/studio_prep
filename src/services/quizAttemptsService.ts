
'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, doc, setDoc } from 'firebase/firestore';

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
  
  // Create a reproducible ID to prevent duplicate attempts for the same question by the same user on the same analysis.
  // This uses a simple hash and is not cryptographically secure, but sufficient for this purpose.
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
    });
  } catch (error) {
    console.error("Error saving quiz attempt: ", error);
  }
}

export async function getQuizAttemptsForHistory(historyId: string): Promise<{[question: string]: string}> {
  if (!db) return {};
  
  const attempts: {[question: string]: string} = {};
  try {
    const q = query(collection(db, 'quizAttempts'), where('historyId', '==', historyId));
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
    
    let totalAttempted = 0;
    let totalCorrect = 0;

    querySnapshot.forEach((doc) => {
        totalAttempted++;
        if (doc.data().isCorrect) {
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
