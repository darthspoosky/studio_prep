import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Initialize Firebase with default data if needed
export async function initializeFirebaseData() {
  if (!db) {
    console.log('Firebase not initialized, skipping data initialization');
    return false;
  }

  try {
    // Check if global usage data exists
    const globalRef = doc(db, 'toolUsage', 'global');
    const globalSnap = await getDoc(globalRef);
    
    if (!globalSnap.exists()) {
      // Initialize with default usage data
      await setDoc(globalRef, {
        dailyQuiz: 156,
        newspaperAnalysis: 342,
        mockInterview: 89,
        writingPractice: 67
      });
      console.log('✅ Initialized Firebase with default usage data');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase data:', error);
    return false;
  }
}

// Test Firebase connection
export async function testFirebaseConnection(): Promise<boolean> {
  if (!db) {
    console.log('❌ Firebase not initialized');
    return false;
  }

  try {
    const testRef = doc(db, 'test', 'connection');
    await setDoc(testRef, { 
      timestamp: new Date().toISOString(),
      test: true 
    });
    console.log('✅ Firebase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
}