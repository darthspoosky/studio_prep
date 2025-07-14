import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

interface SaveProgressRequest {
  sessionId: string;
  currentQuestionIndex: number;
  answers: (string | null)[];
  bookmarked: boolean[];
  timeRemaining: number;
}

async function validateSession(sessionId: string): Promise<boolean> {
  try {
    const sessionDoc = await db.collection('quizSessions').doc(sessionId).get();
    
    if (!sessionDoc.exists) {
      return false;
    }

    const sessionData = sessionDoc.data();
    return !sessionData?.completed;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

async function saveSessionProgress(
  sessionId: string,
  currentQuestionIndex: number,
  answers: (string | null)[],
  bookmarked: boolean[],
  timeRemaining: number
): Promise<void> {
  try {
    const updateData = {
      currentQuestionIndex,
      answers,
      bookmarked,
      timeRemaining,
      updatedAt: new Date(),
      lastProgressSave: new Date()
    };

    await db.collection('quizSessions').doc(sessionId).update(updateData);
  } catch (error) {
    console.error('Progress save error:', error);
    throw new Error('Failed to save progress');
  }
}

async function logProgressSave(sessionId: string): Promise<void> {
  try {
    // Log progress save for analytics (optional)
    await db.collection('progressLogs').add({
      sessionId,
      action: 'auto_save',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Progress logging error:', error);
    // Don't throw error for logging failures
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveProgressRequest = await request.json();
    const { sessionId, currentQuestionIndex, answers, bookmarked, timeRemaining } = body;

    // Validate required fields
    if (!sessionId || currentQuestionIndex === undefined || !answers || !bookmarked || timeRemaining === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate session exists and is not completed
    const isValidSession = await validateSession(sessionId);
    if (!isValidSession) {
      return NextResponse.json(
        { error: 'Invalid or completed session' },
        { status: 400 }
      );
    }

    // Validate data integrity
    if (answers.length !== bookmarked.length) {
      return NextResponse.json(
        { error: 'Answers and bookmarks arrays must have the same length' },
        { status: 400 }
      );
    }

    if (currentQuestionIndex < 0 || currentQuestionIndex >= answers.length) {
      return NextResponse.json(
        { error: 'Invalid current question index' },
        { status: 400 }
      );
    }

    if (timeRemaining < 0) {
      return NextResponse.json(
        { error: 'Invalid time remaining' },
        { status: 400 }
      );
    }

    // Save progress
    await saveSessionProgress(sessionId, currentQuestionIndex, answers, bookmarked, timeRemaining);

    // Log progress save asynchronously
    logProgressSave(sessionId)
      .catch(error => console.error('Progress logging failed:', error));

    return NextResponse.json({
      success: true,
      message: 'Progress saved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Save progress error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve current progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get session data
    const sessionDoc = await db.collection('quizSessions').doc(sessionId).get();
    
    if (!sessionDoc.exists) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sessionData = sessionDoc.data();
    
    // Return current progress
    const progress = {
      sessionId,
      currentQuestionIndex: sessionData?.currentQuestionIndex || 0,
      answers: sessionData?.answers || [],
      bookmarked: sessionData?.bookmarked || [],
      timeRemaining: sessionData?.timeRemaining || 0,
      completed: sessionData?.completed || false,
      totalQuestions: sessionData?.questions?.length || 0,
      lastProgressSave: sessionData?.lastProgressSave || null
    };

    return NextResponse.json(progress);

  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear saved progress (reset session)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Validate session exists and is not completed
    const isValidSession = await validateSession(sessionId);
    if (!isValidSession) {
      return NextResponse.json(
        { error: 'Invalid or completed session' },
        { status: 400 }
      );
    }

    // Get session to reset answers and bookmarks arrays
    const sessionDoc = await db.collection('quizSessions').doc(sessionId).get();
    const sessionData = sessionDoc.data();
    const questionCount = sessionData?.questions?.length || 0;

    // Reset progress
    const resetData = {
      currentQuestionIndex: 0,
      answers: new Array(questionCount).fill(null),
      bookmarked: new Array(questionCount).fill(false),
      timeRemaining: sessionData?.timeLimit || 0,
      updatedAt: new Date()
    };

    await db.collection('quizSessions').doc(sessionId).update(resetData);

    return NextResponse.json({
      success: true,
      message: 'Progress reset successfully'
    });

  } catch (error) {
    console.error('Reset progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}