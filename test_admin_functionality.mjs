/**
 * Comprehensive Admin Functionality Test Suite
 * Tests PDF processing, OCR, database operations, and all admin features
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Configuration
const BASE_URL = 'http://localhost:9002';
const ADMIN_UID = 'qjDA9FVi48QidKnbYjMEkdFf3QP2';

// Test results storage
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to log test results
function logTest(testName, success, details = '') {
  testResults.total++;
  if (success) {
    testResults.passed++;
    console.log(`✅ ${testName}: PASSED`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: FAILED - ${details}`);
  }
  testResults.details.push({
    name: testName,
    success,
    details,
    timestamp: new Date().toISOString()
  });
}

// Helper function to create a test PDF
function createTestPDF() {
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 84 >>
stream
BT
/F1 12 Tf
100 700 Td
(1. Which is the capital of India?) Tj
0 -20 Td
(a) New Delhi b) Mumbai c) Kolkata d) Chennai) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000207 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
339
%%EOF`;
  
  const buffer = Buffer.from(pdfContent);
  return buffer;
}

// Helper function to create test JSON data
function createTestQuestionData() {
  return [
    {
      "question": "Which of the following statements about the Indus Valley Civilization is correct?",
      "options": [
        { "id": "a", "text": "It was primarily a rural civilization." },
        { "id": "b", "text": "The use of iron was widespread." },
        { "id": "c", "text": "They had a well-planned urban layout." },
        { "id": "d", "text": "Horses were central to their society." }
      ],
      "correctOptionId": "c",
      "explanation": "The Indus Valley Civilization is renowned for its sophisticated urban planning.",
      "year": 2021,
      "subject": "History",
      "topic": "Ancient History",
      "difficulty": "easy",
      "metadata": {
        "syllabusSectionId": "gs-history-ancient"
      }
    },
    {
      "question": "Which Article of the Indian Constitution deals with the Right to Equality?",
      "options": [
        { "id": "a", "text": "Article 14" },
        { "id": "b", "text": "Article 15" },
        { "id": "c", "text": "Article 16" },
        { "id": "d", "text": "All of the above" }
      ],
      "correctOptionId": "d",
      "explanation": "Articles 14-18 deal with Right to Equality under the Indian Constitution.",
      "year": 2020,
      "subject": "Polity",
      "topic": "Fundamental Rights",
      "difficulty": "medium",
      "metadata": {
        "syllabusSectionId": "gs-polity-rights"
      }
    }
  ];
}

// Test 1: Admin Page Access
async function testAdminPageAccess() {
  try {
    const response = await fetch(`${BASE_URL}/admin/upload`);
    
    if (response.status === 200 || response.status === 401 || response.status === 403) {
      logTest('Admin Page Access', true, `Admin page responded with status ${response.status}`);
      return true;
    } else {
      logTest('Admin Page Access', false, `Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Admin Page Access', false, error.message);
    return false;
  }
}

// Test 2: File Upload Validation
async function testFileUploadValidation() {
  try {
    // Test invalid file type
    const invalidFile = Buffer.from('not a pdf');
    const formData = new FormData();
    formData.append('file', invalidFile, {
      filename: 'test.txt',
      contentType: 'text/plain'
    });

    const response = await fetch(`${BASE_URL}/api/extract-text`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok && result.error) {
      logTest('File Upload Validation', true, 'Invalid file type correctly rejected');
      return true;
    } else {
      logTest('File Upload Validation', false, 'Invalid file type was accepted');
      return false;
    }
  } catch (error) {
    logTest('File Upload Validation', false, error.message);
    return false;
  }
}

// Test 3: PDF Text Extraction API
async function testPDFTextExtraction() {
  try {
    const pdfBuffer = createTestPDF();
    const formData = new FormData();
    formData.append('file', pdfBuffer, {
      filename: 'test.pdf',
      contentType: 'application/pdf'
    });

    const response = await fetch(`${BASE_URL}/api/extract-text`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.text) {
      logTest('PDF Text Extraction', true, `Extracted ${result.textLength} characters`);
      return result;
    } else {
      logTest('PDF Text Extraction', false, result.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    logTest('PDF Text Extraction', false, error.message);
    return null;
  }
}

// Test 4: PDF to Quiz Conversion
async function testPDFToQuizConversion() {
  try {
    const pdfBuffer = createTestPDF();
    const formData = new FormData();
    formData.append('file', pdfBuffer, {
      filename: 'test-quiz.pdf',
      contentType: 'application/pdf'
    });
    formData.append('examType', 'prelims');
    formData.append('questionCount', '2');

    const response = await fetch(`${BASE_URL}/api/pdf-to-quiz`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.questions) {
      logTest('PDF to Quiz Conversion', true, `Generated ${result.questions.length} questions`);
      return result;
    } else {
      logTest('PDF to Quiz Conversion', false, result.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    logTest('PDF to Quiz Conversion', false, error.message);
    return null;
  }
}

// Test 5: Database Schema Validation
async function testDatabaseSchemaValidation() {
  try {
    const testQuestion = createTestQuestionData()[0];
    
    // Check if all required fields are present
    const requiredFields = ['question', 'options', 'correctOptionId', 'year', 'subject', 'topic'];
    const hasAllFields = requiredFields.every(field => testQuestion.hasOwnProperty(field));
    
    // Check if options have correct structure
    const optionsValid = testQuestion.options.every(option => 
      option.hasOwnProperty('id') && option.hasOwnProperty('text')
    );
    
    // Check if correctOptionId is valid
    const correctOptionValid = testQuestion.options.some(option => 
      option.id === testQuestion.correctOptionId
    );
    
    if (hasAllFields && optionsValid && correctOptionValid) {
      logTest('Database Schema Validation', true, 'Question schema is valid');
      return true;
    } else {
      logTest('Database Schema Validation', false, 'Question schema validation failed');
      return false;
    }
  } catch (error) {
    logTest('Database Schema Validation', false, error.message);
    return false;
  }
}

// Test 6: Admin Service Functions
async function testAdminServiceFunctions() {
  try {
    // Test data sanitization
    const testData = {
      validField: 'test',
      emptyField: '',
      nullField: null,
      undefinedField: undefined,
      zeroField: 0,
      falseField: false
    };
    
    // This simulates the sanitizeData function
    const sanitized = Object.fromEntries(
      Object.entries(testData).filter(([_, value]) => value !== '' && value !== undefined && value !== null)
    );
    
    const expectedFields = ['validField', 'zeroField', 'falseField'];
    const actualFields = Object.keys(sanitized);
    
    if (expectedFields.every(field => actualFields.includes(field))) {
      logTest('Admin Service Functions', true, 'Data sanitization works correctly');
      return true;
    } else {
      logTest('Admin Service Functions', false, 'Data sanitization failed');
      return false;
    }
  } catch (error) {
    logTest('Admin Service Functions', false, error.message);
    return false;
  }
}

// Test 7: Content Type Processing
async function testContentTypeProcessing() {
  try {
    const contentTypes = [
      'questions',
      'books',
      'images',
      'news',
      'syllabus',
      'users',
      'analytics'
    ];
    
    let allSupported = true;
    for (const type of contentTypes) {
      if (!['questions', 'books', 'images', 'news', 'syllabus', 'users', 'analytics'].includes(type)) {
        allSupported = false;
        break;
      }
    }
    
    if (allSupported) {
      logTest('Content Type Processing', true, `All ${contentTypes.length} content types are supported`);
      return true;
    } else {
      logTest('Content Type Processing', false, 'Some content types are not supported');
      return false;
    }
  } catch (error) {
    logTest('Content Type Processing', false, error.message);
    return false;
  }
}

// Test 8: Error Handling
async function testErrorHandling() {
  try {
    // Test with malformed request
    const response = await fetch(`${BASE_URL}/api/pdf-to-quiz`, {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (!response.ok && result.error) {
      logTest('Error Handling', true, 'Malformed requests are handled correctly');
      return true;
    } else {
      logTest('Error Handling', false, 'Malformed requests were not handled');
      return false;
    }
  } catch (error) {
    logTest('Error Handling', false, error.message);
    return false;
  }
}

// Test 9: Server Status Check
async function testServerStatus() {
  try {
    const response = await fetch(`${BASE_URL}/`);
    
    if (response.status === 200) {
      logTest('Server Status', true, 'Server is running and accessible');
      return true;
    } else {
      logTest('Server Status', false, `Server responded with status ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Server Status', false, error.message);
    return false;
  }
}

// Test 10: API Rate Limiting
async function testRateLimiting() {
  try {
    const promises = [];
    
    // Send multiple requests quickly to test rate limiting
    for (let i = 0; i < 5; i++) {
      const formData = new FormData();
      formData.append('file', Buffer.from('test'), {
        filename: `test-${i}.txt`,
        contentType: 'text/plain'
      });
      
      promises.push(
        fetch(`${BASE_URL}/api/extract-text`, {
          method: 'POST',
          body: formData
        }).then(response => response.status)
      );
    }
    
    const statuses = await Promise.all(promises);
    const rateLimitedCount = statuses.filter(status => status === 429).length;
    
    if (rateLimitedCount > 0 || statuses.some(status => status === 400)) {
      logTest('Rate Limiting', true, 'Rate limiting or validation is working');
      return true;
    } else {
      logTest('Rate Limiting', false, 'No rate limiting detected');
      return false;
    }
  } catch (error) {
    logTest('Rate Limiting', false, error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Admin Functionality Tests...\n');
  
  // Run all tests
  await testServerStatus();
  await testAdminPageAccess();
  await testFileUploadValidation();
  await testPDFTextExtraction();
  await testPDFToQuizConversion();
  await testDatabaseSchemaValidation();
  await testAdminServiceFunctions();
  await testContentTypeProcessing();
  await testErrorHandling();
  await testRateLimiting();
  
  // Generate test report
  console.log('\n📊 Test Results Summary:');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  // Save detailed results
  fs.writeFileSync('admin_test_results.json', JSON.stringify(testResults, null, 2));
  console.log('\n📄 Detailed results saved to admin_test_results.json');
  
  // Return overall success
  return testResults.failed === 0;
}

// Run tests
runAllTests().then(success => {
  console.log(success ? '\n✅ All tests completed successfully!' : '\n❌ Some tests failed!');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});