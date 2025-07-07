import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface UserProfile {
  examPreference?: string;
  // Can add more fields here in the future
  updatedAt?: any;
}

export async function updateUserProfile(userId: string, data: UserProfile) {
  if (!db) {
    console.log("Firestore not initialized. Skipping updateUserProfile.");
    return;
  }
  try {
    const userProfileRef = doc(db, 'userProfiles', userId);
    await setDoc(userProfileRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("Error updating user profile: ", error);
    throw error;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db) {
    console.log("Firestore not initialized. Skipping getUserProfile.");
    return null;
  }
  try {
    const userProfileRef = doc(db, 'userProfiles', userId);
    const docSnap = await getDoc(userProfileRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile: ", error);
    return null;
  }
}
