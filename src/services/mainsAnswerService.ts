
'use client';

import { db } from '@/lib/firebase';
import { collection, doc, setDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface MainsAnswer {
    id?: string;
    userId: string;
    historyId: string;
    question: string;
    answer: string;
    timestamp: Timestamp;
}

// Use setDoc with a custom ID to allow overwriting/updating an answer.
export async function saveMainsAnswer(userId: string, historyId: string, question: string, answer: string) {
  if (!db) {
    console.log("Firestore not initialized. Skipping saveMainsAnswer.");
    return;
  }
  
  // Create a reproducible ID for the answer document.
  const questionHash = btoa(unescape(encodeURIComponent(question))).substring(0, 20);
  const answerId = `${userId}_${historyId}_${questionHash}`;

  try {
    const answerRef = doc(db, 'mainsAnswers', answerId);
    await setDoc(answerRef, {
      userId,
      historyId,
      question,
      answer,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error saving mains answer: ", error);
    throw error;
  }
}

export async function getMainsAnswersForHistory(historyId: string): Promise<Record<string, string>> {
  if (!db) return {};
  
  const answers: Record<string, string> = {};
  try {
    const q = query(collection(db, 'mainsAnswers'), where('historyId', '==', historyId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      answers[data.question] = data.answer;
    });
    return answers;
  } catch (error) {
    console.error("Error fetching mains answers: ", error);
    return {};
  }
}
