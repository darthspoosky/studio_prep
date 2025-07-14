import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { QuestionBankService, QuestionSearchOptions } from '@/services/questionBankService';

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

async function verifyAuthToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

// GET /api/questions - Search and retrieve questions
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse search parameters
    const examType = searchParams.get('examType') as 'Prelims' | 'Mains';
    const years = searchParams.get('years')?.split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y));
    const papers = searchParams.get('papers')?.split(',').map(p => p.trim()).filter(p => p);
    const subjects = searchParams.get('subjects')?.split(',').map(s => s.trim()).filter(s => s);
    const subtopics = searchParams.get('subtopics')?.split(',').map(s => s.trim()).filter(s => s);
    const difficultyLevel = searchParams.get('difficultyLevel')?.split(',').map(d => d.trim()).filter(d => d) as ('Easy' | 'Medium' | 'Hard')[];
    const questionType = searchParams.get('questionType')?.split(',').map(t => t.trim()).filter(t => t);
    const verified = searchParams.get('verified') === 'true' ? true : searchParams.get('verified') === 'false' ? false : undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') as 'year' | 'difficulty' | 'successRate' | 'attemptCount';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc';

    // Validate required parameters
    if (!examType || !['Prelims', 'Mains'].includes(examType)) {
      return NextResponse.json(
        { error: 'Invalid or missing examType. Must be Prelims or Mains' },
        { status: 400 }
      );
    }

    // Build search options
    const searchOptions: QuestionSearchOptions = {
      examType,
      years,
      papers,
      subjects,
      subtopics,
      difficultyLevel,
      questionType,
      verified,
      limit: Math.min(limit, 100), // Cap at 100 questions per request
      offset,
      sortBy,
      sortOrder
    };

    // Search questions
    let questions;
    if (examType === 'Prelims') {
      questions = await QuestionBankService.searchPrelimsQuestions(searchOptions);
    } else {
      questions = await QuestionBankService.searchMainsQuestions(searchOptions);
    }

    return NextResponse.json({
      success: true,
      data: questions,
      count: questions.length,
      searchOptions: {
        examType,
        years,
        papers,
        subjects,
        subtopics,
        difficultyLevel,
        verified,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('Error searching questions:', error);
    return NextResponse.json(
      { error: 'Failed to search questions' },
      { status: 500 }
    );
  }
}

// POST /api/questions - Create a new question (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // This would require admin access check
    // For now, allowing any authenticated user to add questions in dev mode

    const body = await request.json();
    const { examType, questionData } = body;

    if (!examType || !['Prelims', 'Mains'].includes(examType)) {
      return NextResponse.json(
        { error: 'Invalid exam type' },
        { status: 400 }
      );
    }

    if (!questionData) {
      return NextResponse.json(
        { error: 'Question data is required' },
        { status: 400 }
      );
    }

    // Add creator information
    const enrichedQuestionData = {
      ...questionData,
      createdBy: userId,
      attemptCount: 0,
      correctAttempts: 0,
      averageTime: 0,
      successRate: 0,
      isActive: true,
      version: 1
    };

    // Create question
    let questionId;
    if (examType === 'Prelims') {
      questionId = await QuestionBankService.createPrelimsQuestion(enrichedQuestionData);
    } else {
      questionId = await QuestionBankService.createMainsQuestion(enrichedQuestionData);
    }

    return NextResponse.json({
      success: true,
      questionId,
      message: 'Question created successfully'
    });

  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}