
'use client';

import { db } from '@/lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import type { Question } from '@/types/quiz';

/**
 * Uploads an array of past year questions to Firestore in a single batch.
 * @param questions An array of Question objects to upload.
 * @returns The number of questions successfully prepared for upload.
 */
export async function uploadBulkPastYearQuestions(questions: Question[]): Promise<number> {
  if (!db) {
    throw new Error("Firestore not initialized.");
  }

  const batch = writeBatch(db);
  const questionsCollection = collection(db, 'pastYearQuestions');

  questions.forEach(question => {
    const questionRef = doc(questionsCollection); // Create a new document with a unique ID
    batch.set(questionRef, question);
  });

  try {
    await batch.commit();
    return questions.length;
  } catch (error) {
    console.error("Error committing batch upload:", error);
    throw new Error("Failed to upload questions to the database.");
  }
}
