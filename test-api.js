// Simple test script to verify the advanced extraction API
const { spawn } = require('child_process');
const path = require('path');

// Start the Next.js development server
console.log('Starting Next.js development server...');
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Wait for server to start
setTimeout(async () => {
  try {
    console.log('\nTesting API endpoint...');
    
    // Test the GET endpoint
    const response = await fetch('http://localhost:9002/api/ai/extract-questions-advanced');
    const data = await response.json();
    
    console.log('✅ API Response:', JSON.stringify(data, null, 2));
    
    // Test environment variables
    console.log('\n🔧 Environment Check:');
    console.log('- GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? 'Configured' : 'Missing');
    console.log('- TEMP_FILE_DIRECTORY:', process.env.TEMP_FILE_DIRECTORY || 'Not configured');
    console.log('- MAX_FILE_SIZE:', process.env.MAX_FILE_SIZE || 'Not configured');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
  
  // Stop the server
  server.kill();
  process.exit(0);
}, 8000);

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});