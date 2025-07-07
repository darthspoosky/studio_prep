
'use client';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  documentId,
} from 'firebase/firestore';
import type { PrelimsQuestionWithContext } from './historyService';

// This is the data structure for a question saved to the user's wall.
export type SavedQuestion = PrelimsQuestionWithContext & {
  savedAt: Timestamp;
  userId: string;
  id?: string; // Added to support the id property when returning from Firestore
};

// Helper to create a unique, reproducible ID for a saved question document.
export function getSavedQuestionId(userId: string, question: PrelimsQuestionWithContext): string {
  // A question is unique based on its text content and the history entry it came from.
  const questionHash = btoa(unescape(encodeURIComponent(question.question))).substring(0, 30);
  return `${userId}_${question.historyId}_${questionHash}`;
}

export async function saveQuestion(userId: string, question: PrelimsQuestionWithContext): Promise<void> {
  if (!db) {
    console.error("Firestore not initialized. Skipping saveQuestion.");
    return;
  }
  const savedQuestionId = getSavedQuestionId(userId, question);
  const docRef = doc(db, 'savedQuestions', savedQuestionId);

  try {
    await setDoc(docRef, {
      ...question,
      userId: userId, // Ensure userId is part of the document data for rule validation
      savedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error saving question:", error);
    throw new Error("Failed to save question.");
  }
}

export async function unsaveQuestion(userId: string, question: PrelimsQuestionWithContext): Promise<void> {
  if (!db) {
    console.error("Firestore not initialized. Skipping unsaveQuestion.");
    return;
  }
  const savedQuestionId = getSavedQuestionId(userId, question);
  const docRef = doc(db, 'savedQuestions', savedQuestionId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error unsaving question:", error);
    throw new Error("Failed to unsave question.");
  }
}

export async function getSavedQuestions(userId: string): Promise<SavedQuestion[]> {
  if (!db) {
    console.log("Firestore not initialized. Skipping getSavedQuestions.");
    return [];
  }
  const savedQuestions: SavedQuestion[] = [];
  try {
    // Removed orderBy to prevent needing a composite index. Sorting is now done on the client.
    const q = query(
      collection(db, 'savedQuestions'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      // The doc.id is the reproducible ID we created.
      savedQuestions.push({ ...(doc.data() as SavedQuestion), id: doc.id });
    });
    
    // Sort the questions by saved date on the client side.
    savedQuestions.sort((a, b) => b.savedAt.toMillis() - a.savedAt.toMillis());

  } catch (error) {
    console.error("Error fetching saved questions:", error);
    if ((error as any).code === 'permission-denied') {
        throw new Error("Could not read your saved questions due to a permission error. Please check your Firestore security rules.");
    }
  }
  return savedQuestions;
}

// Fetches saved status for a list of question IDs for the current user.
export async function getSavedStatus(userId: string, questionIds: string[]): Promise<Set<string>> {
    if (!db || questionIds.length === 0) {
        return new Set();
    }
    const savedStatus = new Set<string>();
    
    // Firestore 'in' queries are limited to 30 items. We need to batch.
    const batches: string[][] = [];
    for (let i = 0; i < questionIds.length; i += 30) {
        batches.push(questionIds.slice(i, i + 30));
    }

    try {
        for (const batch of batches) {
             const q = query(
                collection(db, 'savedQuestions'),
                where('userId', '==', userId),
                where(documentId(), 'in', batch)
            );
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                savedStatus.add(doc.id);
            });
        }
    } catch (error) {
        console.error("Error fetching saved status:", error);
    }

    return savedStatus;
}
