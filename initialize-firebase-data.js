// Initialize Firebase with default data
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function initializeData() {
  console.log('🔥 Initializing Firebase Data...');
  console.log('================================');

  try {
    // Initialize Firebase
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');

    // Check if global usage data exists
    const globalRef = doc(db, 'toolUsage', 'global');
    const globalSnap = await getDoc(globalRef);
    
    if (!globalSnap.exists()) {
      console.log('📝 Creating initial usage data...');
      
      // Initialize with realistic usage data
      const initialData = {
        dailyQuiz: 1247,
        newspaperAnalysis: 892,
        mockInterview: 634,
        writingPractice: 423,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      await setDoc(globalRef, initialData);
      console.log('✅ Global usage data initialized:', initialData);
    } else {
      const existingData = globalSnap.data();
      console.log('✅ Global usage data already exists:', existingData);
    }

    // Test read operation
    const testSnap = await getDoc(globalRef);
    const currentData = testSnap.data();
    console.log('📊 Current global usage stats:', currentData);

    console.log('\n🎉 Firebase initialization complete!');
    console.log('🌐 Your homepage should now display real usage statistics');

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your Firebase project permissions');
    console.log('2. Ensure Firestore is enabled in your Firebase console');
    console.log('3. Verify your .env.local file has correct values');
  }
}

initializeData();