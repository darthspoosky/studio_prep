import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';

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
  try {
    const docRef = await addDoc(collection(db, 'ideas'), {
        ...idea,
        timestamp: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
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
  
  const q = query(collection(db, 'ideas'), orderBy('timestamp', 'desc'), limit(20));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const ideas: Idea[] = [];
    querySnapshot.forEach((doc) => {
      ideas.push({ id: doc.id, ...doc.data() } as Idea);
    });
    callback(ideas);
  }, (error) => {
      console.error("Error listening to ideas collection: ", error);
  });

  return unsubscribe;
}
