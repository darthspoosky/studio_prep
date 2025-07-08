
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';

export interface MockInterviewConfig {
    interviewType: string;
    difficulty: string;
    roleProfile?: string;
}

export interface MockInterviewSession {
    id: string;
    userId: string;
    config: MockInterviewConfig;
    status: 'initializing' | 'in-progress' | 'completed' | 'error';
    createdAt: Timestamp;
    completedAt?: Timestamp;
    finalReport?: string; // This could be a summary or a link to a detailed report
    questionsAndAnswers?: Array<{ question: string; answer: string; feedback: string; }>;
}

// Function to create a new mock interview session
export async function createMockInterviewSession(userId: string, config: MockInterviewConfig): Promise<string> {
  if (!db) {
    throw new Error("Firestore not initialized.");
  }

  try {
    const docRef = await addDoc(collection(db, 'mockInterviewSessions'), {
      userId,
      config,
      status: 'initializing',
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating mock interview session: ", error);
    throw new Error('Failed to create a new session.');
  }
}

// Function to update a session with the final report
export async function updateMockInterviewSession(sessionId: string, updates: Partial<Omit<MockInterviewSession, 'id' | 'userId' | 'config' | 'createdAt'>>) {
    if (!db) {
        throw new Error("Firestore not initialized.");
    }

    try {
        const sessionRef = doc(db, 'mockInterviewSessions', sessionId);
        // This now correctly only applies the specific updates passed to it.
        await updateDoc(sessionRef, updates);
    } catch (error) {
        console.error("Error updating mock interview session: ", error);
        throw new Error('Failed to update the session.');
    }
}


// Function to retrieve a specific mock interview session
export async function getMockInterviewSession(sessionId: string): Promise<MockInterviewSession | null> {
  if (!db) return null;

  try {
    const sessionRef = doc(db, 'mockInterviewSessions', sessionId);
    const docSnap = await getDoc(sessionRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as MockInterviewSession;
    } else {
      console.log("No such session found!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching mock interview session: ", error);
    return null;
  }
}

// Function to get all mock interview sessions for a user
export async function getUserMockInterviewHistory(userId: string): Promise<MockInterviewSession[]> {
  if (!db) return [];

  try {
    const q = query(
        collection(db, 'mockInterviewSessions'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MockInterviewSession));
  } catch (error) {
    console.error("Error fetching user mock interview history: ", error);
    return [];
  }
}
