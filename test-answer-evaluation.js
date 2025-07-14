// Test script for answer evaluation
const fs = require('fs');
const path = require('path');

async function testAnswerEvaluation() {
  console.log('🎯 Testing Answer Evaluation System');
  console.log('=====================================');
  
  // Check if the sample answer exists
  const answerPath = path.join(__dirname, 'Sample_answers', 'VisionIAS Toppers Answer Booklet Shakti Dubey.pdf');
  
  if (!fs.existsSync(answerPath)) {
    console.log('❌ Sample answer file not found!');
    return;
  }
  
  const stats = fs.statSync(answerPath);
  console.log(`📁 Answer file: ${path.basename(answerPath)}`);
  console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('\n🚀 Testing Answer Evaluation API...');
  console.log('Note: This is a PDF file, but our API expects image files.');
  console.log('In production, you would need to convert PDF pages to images first.');
  
  // Test API status
  try {
    const response = await fetch('http://localhost:9002/api/ai/evaluate-answer');
    const status = await response.json();
    
    console.log('\n✅ Answer Evaluation API Status:');
    console.log(`   Status: ${status.status}`);
    console.log(`   Handwriting OCR: ${status.capabilities.handwritingOCR}`);
    console.log(`   AI Evaluation: ${status.capabilities.aiEvaluation}`);
    console.log(`   Supported Formats: ${status.supportedFormats.join(', ')}`);
    console.log(`   Max File Size: ${status.maxFileSize}`);
    console.log(`   Supported Subjects: ${status.supportedSubjects.length} subjects`);
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the development server is running: npm run dev');
    }
  }
  
  console.log('\n📝 To test with actual answer evaluation:');
  console.log('1. Convert the PDF pages to individual image files (JPG/PNG)');
  console.log('2. Use the admin interface at: http://localhost:9002/admin/answer-evaluation');
  console.log('3. Upload image files with question text and model answers');
  
  console.log('\n🔍 Checking extraction results...');
  const extractionDir = path.join(__dirname, 'extraction_results');
  const evaluationDir = path.join(__dirname, 'evaluation_results');
  
  if (fs.existsSync(extractionDir)) {
    const extractionFiles = fs.readdirSync(extractionDir);
    console.log(`📁 Extraction results: ${extractionFiles.length} files`);
    extractionFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
  } else {
    console.log(`📁 No extraction results found (${extractionDir})`);
  }
  
  if (fs.existsSync(evaluationDir)) {
    const evaluationFiles = fs.readdirSync(evaluationDir);
    console.log(`📁 Evaluation results: ${evaluationFiles.length} files`);
    evaluationFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
  } else {
    console.log(`📁 No evaluation results found (${evaluationDir})`);
  }
}

// Check if we're in a Node.js environment with fetch
if (typeof fetch === 'undefined') {
  // For Node.js environments without fetch
  console.log('⚠️  Fetch not available. Testing file system only.');
  
  const answerPath = path.join(__dirname, 'Sample_answers', 'VisionIAS Toppers Answer Booklet Shakti Dubey.pdf');
  
  if (fs.existsSync(answerPath)) {
    const stats = fs.statSync(answerPath);
    console.log(`✅ Sample answer found: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log('📝 To use this for testing:');
    console.log('1. Convert PDF to images using a tool like pdf2pic or online converter');
    console.log('2. Upload images via the admin interface');
    console.log('3. Test with sample questions and model answers');
  } else {
    console.log('❌ Sample answer file not found');
  }
} else {
  testAnswerEvaluation();
}