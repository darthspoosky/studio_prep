import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { isDevMode } from '@/lib/dev-mode';
import * as XLSX from 'xlsx';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
}

async function verifyAuthToken(request: NextRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

// Prelims template data
const PRELIMS_TEMPLATE = [
  {
    'Question ID': 'UPSC-2023-GS1-Q1',
    'Question': 'Which of the following is the largest planet in our solar system?',
    'Question Type': 'MCQ',
    'Option A': 'Earth',
    'Option B': 'Jupiter',
    'Option C': 'Saturn',
    'Option D': 'Mars',
    'Correct Answer': 'B',
    'Explanation': 'Jupiter is the largest planet in our solar system by both mass and volume.',
    'Year': 2023,
    'Paper': 'GS1',
    'Question Number': 1,
    'Subject': 'Geography, Science',
    'Subtopics': 'Solar System, Planetary Science',
    'Syllabus Topic': 'Geography - Physical Geography',
    'Difficulty Level': 'Easy',
    'Concept Level': 'Basic',
    'Source': 'UPSC Official',
    'Verified': 'true',
    'Image URLs': '',
    'References': 'NCERT Geography Class 6'
  }
];

// Mains template data
const MAINS_TEMPLATE = [
  {
    'Question ID': 'UPSC-2023-GS1-Q1',
    'Question': 'Discuss the impact of climate change on agricultural productivity in India. Suggest measures to mitigate these impacts.',
    'Question Type': 'Analytical',
    'Sub Parts': JSON.stringify([
      { part: 'a', question: 'Analyze the impact of climate change on agricultural productivity', marks: 10, expectedLength: 150 },
      { part: 'b', question: 'Suggest mitigation measures', marks: 15, expectedLength: 200 }
    ]),
    'Year': 2023,
    'Paper': 'GS1',
    'Question Number': 1,
    'Total Marks': 25,
    'Time Allocation': 30,
    'Subject': 'Geography, Agriculture',
    'Subtopics': 'Climate Change, Agricultural Geography',
    'Syllabus Topic': 'Geography - Economic Geography',
    'Difficulty Level': 'Medium',
    'Concept Level': 'Intermediate',
    'Expected Approach': 'Introduction, Analysis, Conclusion',
    'Key Points': 'Temperature rise, Precipitation changes, Crop yield variations, Adaptation strategies',
    'Common Mistakes': 'Not linking climate data with agricultural impact, Missing policy suggestions',
    'Current Affairs Topics': 'National Action Plan on Climate Change, Paris Agreement',
    'Practice Level': 'Intermediate'
  }
];

// GET /api/admin/templates - Download Excel templates
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const userAuth = await verifyAuthToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check dev mode access
    if (!isDevMode(userAuth.email)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const templateType = searchParams.get('type') as 'prelims' | 'mains';

    if (!templateType || !['prelims', 'mains'].includes(templateType)) {
      return NextResponse.json(
        { error: 'Invalid template type. Must be prelims or mains' },
        { status: 400 }
      );
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    let templateData;
    let fileName;
    
    if (templateType === 'prelims') {
      templateData = PRELIMS_TEMPLATE;
      fileName = 'UPSC_Prelims_Questions_Template.xlsx';
      
      // Create worksheet with template data
      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // Question ID
        { wch: 60 }, // Question
        { wch: 15 }, // Question Type
        { wch: 30 }, // Option A
        { wch: 30 }, // Option B
        { wch: 30 }, // Option C
        { wch: 30 }, // Option D
        { wch: 15 }, // Correct Answer
        { wch: 60 }, // Explanation
        { wch: 10 }, // Year
        { wch: 10 }, // Paper
        { wch: 15 }, // Question Number
        { wch: 30 }, // Subject
        { wch: 40 }, // Subtopics
        { wch: 40 }, // Syllabus Topic
        { wch: 15 }, // Difficulty Level
        { wch: 15 }, // Concept Level
        { wch: 20 }, // Source
        { wch: 10 }, // Verified
        { wch: 30 }, // Image URLs
        { wch: 40 }  // References
      ];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Prelims Questions');
      
    } else {
      templateData = MAINS_TEMPLATE;
      fileName = 'UPSC_Mains_Questions_Template.xlsx';
      
      // Create worksheet with template data
      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // Question ID
        { wch: 80 }, // Question
        { wch: 15 }, // Question Type
        { wch: 40 }, // Sub Parts
        { wch: 10 }, // Year
        { wch: 10 }, // Paper
        { wch: 15 }, // Question Number
        { wch: 15 }, // Total Marks
        { wch: 15 }, // Time Allocation
        { wch: 30 }, // Subject
        { wch: 40 }, // Subtopics
        { wch: 40 }, // Syllabus Topic
        { wch: 15 }, // Difficulty Level
        { wch: 15 }, // Concept Level
        { wch: 40 }, // Expected Approach
        { wch: 60 }, // Key Points
        { wch: 50 }, // Common Mistakes
        { wch: 50 }, // Current Affairs Topics
        { wch: 15 }  // Practice Level
      ];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Mains Questions');
    }
    
    // Add instructions sheet
    const instructions = [
      {
        'Field': 'Question ID',
        'Description': 'Unique identifier for the question (e.g., UPSC-2023-GS1-Q1)',
        'Required': 'Yes',
        'Format': 'Text'
      },
      {
        'Field': 'Question',
        'Description': 'The main question text',
        'Required': 'Yes',
        'Format': 'Text'
      },
      {
        'Field': 'Year',
        'Description': 'Exam year',
        'Required': 'Yes',
        'Format': 'Number (2020, 2021, etc.)'
      },
      {
        'Field': 'Paper',
        'Description': 'Paper name (GS1, GS2, GS3, GS4, CSAT, Essay)',
        'Required': 'Yes',
        'Format': 'Text'
      },
      {
        'Field': 'Subject',
        'Description': 'Subject areas (comma-separated)',
        'Required': 'Yes',
        'Format': 'Text (History, Geography, Polity)'
      },
      {
        'Field': 'Difficulty Level',
        'Description': 'Question difficulty',
        'Required': 'Yes',
        'Format': 'Easy, Medium, or Hard'
      }
    ];
    
    const instructionsWs = XLSX.utils.json_to_sheet(instructions);
    instructionsWs['!cols'] = [
      { wch: 20 },
      { wch: 60 },
      { wch: 10 },
      { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Return file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}