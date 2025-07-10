/**
 * Test script for the mock interview service
 * 
 * This script tests the end-to-end functionality of the mock interview service
 * without requiring a full UI or API route setup.
 * 
 * SETUP REQUIRED BEFORE RUNNING:
 * 1. Create a .env.local file at the project root with the following API keys:
 *    - OPENAI_API_KEY=your_openai_api_key
 *    - ANTHROPIC_API_KEY=your_anthropic_api_key (optional, will fallback to OpenAI)
 * 
 * To run: npm run test:mock-interview
 */

// Import and configure dotenv to load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import {
  createMockInterviewSession,
  getMockInterviewSession,
  updateMockInterviewWithAnswer,
  MockInterviewConfig,
  MockInterviewError,
} from '../services/mockInterviewService';

// Test configuration
const TEST_USER_ID = 'test-user-123';
const TEST_CONFIG: MockInterviewConfig = {
  interviewType: 'technical',
  difficulty: 'medium',
  roleProfile: 'Senior Software Engineer specializing in React and TypeScript',
};

// Sample answers for testing
const TEST_ANSWERS = [
  'I have over 5 years of experience with React and TypeScript. I\'ve worked on large-scale applications and led teams in implementing complex frontend architectures.',
  'I prefer using Context API for simpler state management needs and Redux for more complex applications. I also have experience with Zustand and Jotai for specific use cases.',
  'In my previous role, I implemented a performance optimization that reduced our bundle size by 35% and improved load times by over 40%. I achieved this by code splitting, lazy loading, and implementing proper memoization strategies.',
  'My approach to solving complex problems is to break them down into smaller, manageable pieces. I start by understanding the requirements thoroughly, planning the architecture, and then implementing iteratively with frequent testing.',
  'I stay updated with the latest trends by following tech blogs, participating in open source projects, attending conferences, and experimenting with new technologies in side projects.'
];

/**
 * Run the complete interview flow test
 */
async function runInterviewTest() {
  console.log('\n🎯 STARTING MOCK INTERVIEW TEST\n');
  
  try {
    // Step 1: Create a new interview session
    console.log('📝 Creating new interview session...');
    const sessionId = await createMockInterviewSession(TEST_USER_ID, TEST_CONFIG);
    console.log(`✅ Session created successfully: ${sessionId}\n`);
    
    // Step 2: Get the session to view the first question
    console.log('🔍 Retrieving session details...');
    const session = await getMockInterviewSession(sessionId);
    console.log(`✅ Session status: ${session.status}`);
    if (session.questionsAndAnswers.length > 0) {
      console.log(`❓ First question: ${session.questionsAndAnswers[0].question}\n`);
    }
    
    // Step 3: Go through a series of Q&A
    console.log('🔄 Starting interview Q&A flow...');
    
    for (let i = 0; i < TEST_ANSWERS.length; i++) {
      const answer = TEST_ANSWERS[i];
      console.log(`\n👤 Submitting answer ${i + 1}...`);
      
      const result = await updateMockInterviewWithAnswer(sessionId, answer);
      
      if (result.isComplete) {
        console.log('🏁 Interview completed!');
        console.log(`📊 Final feedback: ${result.feedback}`);
        break;
      } else {
        console.log(`❓ Next question: ${result.question}`);
      }
    }
    
    // Step 4: Verify final session state
    console.log('\n🔍 Verifying final session state...');
    const finalSession = await getMockInterviewSession(sessionId);
    console.log(`✅ Final status: ${finalSession.status}`);
    console.log(`✅ Questions asked: ${finalSession.questionsAndAnswers.length}`);
    console.log(`✅ Final report available: ${!!finalSession.finalReport}`);
    
    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY 🎉\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    if (error instanceof MockInterviewError) {
      console.error(`Error type: ${error.name}`);
      console.error(`Error message: ${error.message}`);
    } else {
      console.error('Unexpected error:', error);
    }
    process.exit(1);
  }
}

// Run the test
runInterviewTest()
  .then(() => {
    console.log('Test script execution completed.');
  })
  .catch(error => {
    console.error('Unhandled error in test script:', error);
    process.exit(1);
  });
