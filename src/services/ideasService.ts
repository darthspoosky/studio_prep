import { Firestore, collection, addDoc, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Idea {
  id?: string;
  // Renamed 'idea' to 'featureRequests' for clarity
  featureRequests: string;
  author: string;
  role: string;
  avatar: string;
  glowColor: string;
  timestamp?: Timestamp;
  // All other survey fields are now stored, but optional for backward compatibility with initial data
  examType?: string;
  goal?: string;
  studyTime?: string;
  frustrations?: string;
}

export async function addIdea(idea: Omit<Idea, 'id'>) {
  if (!db) {
    console.log("Firestore not initialized. Skipping addIdea.");
    return null;
  }
  // Explicitly cast db to Firestore type
  const firestore = db as Firestore;
  try {
    const docRef = await addDoc(collection(firestore, 'ideas'), {
        ...idea,
        timestamp: Timestamp.now(),
    });
    return { id: docRef.id, ...idea };
  } catch (error) {
    console.error("Error adding idea: ", error);
    return null;
  }
}

// This function is for client-side use to setup a real-time listener.
export function onIdeasUpdate(callback: (ideas: Idea[]) => void) {
  if (!db) {
    console.log("Firestore not initialized. Skipping onIdeasUpdate.");
    // Return a no-op unsubscribe function
    return () => {};
  }
  
  // Explicitly cast db to Firestore type
  const firestore = db as Firestore;
  
  const q = query(collection(firestore, 'ideas'), orderBy('timestamp', 'desc'), limit(20));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const ideas: Idea[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      ideas.push({ id: doc.id, ...data } as Idea);
    });
    callback(ideas);
  }, (error: Error) => {
      console.error("Error listening to ideas collection: ", error);
  });

  return unsubscribe;
}
