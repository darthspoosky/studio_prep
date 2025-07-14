// Test script for 2025 UPSC Prelims Question Paper
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function test2025PDF() {
  console.log('🎯 Testing 2025 UPSC Prelims Question Paper');
  console.log('===============================================');
  
  // File path
  const pdfPath = path.join(__dirname, 'Prelims QP', '2025.pdf');
  
  console.log(`📁 File path: ${pdfPath}`);
  
  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    console.log('❌ File not found!');
    return;
  }
  
  // Get file stats
  const stats = fs.statSync(pdfPath);
  console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📅 Last modified: ${stats.mtime.toLocaleDateString()}`);
  
  // Test API endpoint by uploading the file
  console.log('\n🚀 Testing file upload to API...');
  
  try {
    const FormData = require('form-data');
    const fetch = require('node-fetch');
    
    const form = new FormData();
    const fileBuffer = fs.readFileSync(pdfPath);
    form.append('files', fileBuffer, '2025.pdf');
    form.append('extractText', 'true');
    form.append('extractQuestions', 'true');
    form.append('confidenceThreshold', '0.8');
    
    console.log('📤 Uploading file to API endpoint...');
    
    const response = await fetch('http://localhost:9002/api/ai/extract-questions-advanced', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('\n✅ Upload successful!');
    console.log(`📋 Processing ID: ${result.processId}`);
    console.log(`📁 Files processed: ${result.results.length}`);
    
    // Display results for each file
    result.results.forEach((fileResult, index) => {
      console.log(`\n📄 File ${index + 1}: ${fileResult.originalName}`);
      console.log(`   Status: ${fileResult.status}`);
      console.log(`   File size: ${(fileResult.size / 1024).toFixed(2)} KB`);
      
      if (fileResult.extractedContent) {
        console.log(`   Text length: ${fileResult.extractedContent.text?.length || 0} characters`);
        console.log(`   Pages: ${fileResult.extractedContent.pageCount || 'N/A'}`);
      }
      
      if (fileResult.questions && fileResult.questions.length > 0) {
        console.log(`   ✅ Questions extracted: ${fileResult.questions.length}`);
        
        // Show first few questions
        console.log('\n   📝 Sample Questions:');
        fileResult.questions.slice(0, 3).forEach((q, i) => {
          console.log(`   ${i + 1}. ${q.question?.substring(0, 100)}...`);
          console.log(`      Subject: ${q.subject || 'Unknown'}`);
          console.log(`      Confidence: ${q.confidence || 'N/A'}`);
        });
        
        if (fileResult.questions.length > 3) {
          console.log(`   ... and ${fileResult.questions.length - 3} more questions`);
        }
      } else {
        console.log(`   ⚠️  No questions extracted`);
      }
      
      if (fileResult.error) {
        console.log(`   ❌ Error: ${fileResult.error}`);
      }
    });
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the development server is running: npm run dev');
    }
  }
}

// Check if required dependencies are available
try {
  require('form-data');
  require('node-fetch');
  test2025PDF();
} catch (error) {
  console.log('❌ Missing dependencies. Installing...');
  console.log('Run: npm install form-data node-fetch');
}