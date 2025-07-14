// Simple Firebase connection test
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

console.log('🔥 Testing Firebase Configuration...');
console.log('=====================================');

// Check environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let configComplete = true;

console.log('📋 Environment Variables Check:');
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${key}: Missing`);
    configComplete = false;
  }
});

console.log('\n🎯 Overall Status:');
if (configComplete) {
  console.log('✅ Firebase configuration is complete');
  console.log('🚀 Firebase should work properly with your application');
} else {
  console.log('❌ Firebase configuration is incomplete');
  console.log('💡 Check your .env.local file for missing variables');
}

console.log('\n📝 Expected file structure:');
console.log('.env.local should contain:');
console.log('NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key');
console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain');
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id');
console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket');
console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id');
console.log('NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id');