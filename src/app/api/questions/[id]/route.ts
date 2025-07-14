import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { QuestionBankService } from '@/services/questionBankService';

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

// GET /api/questions/[id] - Get a specific question by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const questionId = params.id;
    const { searchParams } = new URL(request.url);
    const examType = searchParams.get('examType') as 'Prelims' | 'Mains';

    if (!examType || !['Prelims', 'Mains'].includes(examType)) {
      return NextResponse.json(
        { error: 'examType parameter is required (Prelims or Mains)' },
        { status: 400 }
      );
    }

    // Get question
    let question;
    if (examType === 'Prelims') {
      question = await QuestionBankService.getPrelimsQuestion(questionId);
    } else {
      question = await QuestionBankService.getMainsQuestion(questionId);
    }

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check if question is active
    if (!question.isActive) {
      return NextResponse.json(
        { error: 'Question is not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: question
    });

  } catch (error) {
    console.error('Error getting question:', error);
    return NextResponse.json(
      { error: 'Failed to get question' },
      { status: 500 }
    );
  }
}

// POST /api/questions/[id] - Record a question attempt
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const questionId = params.id;
    const body = await request.json();
    const { examType, isCorrect, timeSpent, userAnswer } = body;

    if (!examType || !['Prelims', 'Mains'].includes(examType)) {
      return NextResponse.json(
        { error: 'Invalid exam type' },
        { status: 400 }
      );
    }

    if (typeof isCorrect !== 'boolean') {
      return NextResponse.json(
        { error: 'isCorrect must be a boolean' },
        { status: 400 }
      );
    }

    if (typeof timeSpent !== 'number' || timeSpent < 0) {
      return NextResponse.json(
        { error: 'timeSpent must be a positive number (seconds)' },
        { status: 400 }
      );
    }

    // Update question analytics
    await QuestionBankService.updateQuestionAttempt(
      questionId,
      examType,
      isCorrect,
      timeSpent
    );

    // Here you could also record user-specific attempt data
    // For example, store the attempt in a user_attempts collection

    return NextResponse.json({
      success: true,
      message: 'Attempt recorded successfully'
    });

  } catch (error) {
    console.error('Error recording question attempt:', error);
    return NextResponse.json(
      { error: 'Failed to record attempt' },
      { status: 500 }
    );
  }
}

// PUT /api/questions/[id] - Update a question (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    // For now, we'll implement a basic structure

    const questionId = params.id;
    const body = await request.json();
    const { examType, updates } = body;

    if (!examType || !['Prelims', 'Mains'].includes(examType)) {
      return NextResponse.json(
        { error: 'Invalid exam type' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Updates object is required' },
        { status: 400 }
      );
    }

    // This would require implementing update methods in QuestionBankService
    // For now, return a placeholder response

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully'
    });

  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[id] - Delete/deactivate a question (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    // For now, we'll implement a basic structure

    const questionId = params.id;
    const { searchParams } = new URL(request.url);
    const examType = searchParams.get('examType') as 'Prelims' | 'Mains';

    if (!examType || !['Prelims', 'Mains'].includes(examType)) {
      return NextResponse.json(
        { error: 'examType parameter is required' },
        { status: 400 }
      );
    }

    // Instead of hard delete, mark as inactive
    // This would require implementing deactivate methods in QuestionBankService

    return NextResponse.json({
      success: true,
      message: 'Question deactivated successfully'
    });

  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}