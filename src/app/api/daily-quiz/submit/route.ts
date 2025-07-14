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

interface SubmissionRequest {
  sessionId: string;
  questionIndex: number;
  selectedAnswer: string;
  timeSpent: number;
}

interface SubmissionResponse {
  isCorrect: boolean;
  explanation: string;
  correctAnswer: string;
  success: boolean;
}

async function validateSession(sessionId: string): Promise<any> {
  try {
    const sessionDoc = await db.collection('quizSessions').doc(sessionId).get();
    
    if (!sessionDoc.exists) {
      throw new Error('Quiz session not found');
    }

    const sessionData = sessionDoc.data();
    
    if (sessionData?.completed) {
      throw new Error('Quiz session already completed');
    }

    return sessionData;
  } catch (error) {
    console.error('Session validation error:', error);
    throw error;
  }
}

async function updateSessionAnswer(
  sessionId: string,
  questionIndex: number,
  selectedAnswer: string,
  timeSpent: number
): Promise<void> {
  try {
    const sessionRef = db.collection('quizSessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    
    if (!sessionDoc.exists) {
      throw new Error('Session not found');
    }

    const sessionData = sessionDoc.data();
    const answers = [...(sessionData?.answers || [])];
    answers[questionIndex] = selectedAnswer;

    await sessionRef.update({
      answers,
      updatedAt: new Date(),
      [`timeSpent.${questionIndex}`]: timeSpent
    });
  } catch (error) {
    console.error('Answer update error:', error);
    throw new Error('Failed to update answer');
  }
}

async function logSubmission(
  sessionId: string,
  questionIndex: number,
  selectedAnswer: string,
  isCorrect: boolean,
  timeSpent: number
): Promise<void> {
  try {
    await db.collection('quizSubmissions').add({
      sessionId,
      questionIndex,
      selectedAnswer,
      isCorrect,
      timeSpent,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Submission logging error:', error);
    // Don't throw error for logging failures
  }
}

async function getQuestionFeedback(
  question: any,
  selectedAnswer: string
): Promise<{ isCorrect: boolean; explanation: string }> {
  const isCorrect = selectedAnswer === question.correctAnswer;
  
  // In a real implementation, you might want to enhance explanations
  // based on the selected answer vs correct answer
  let explanation = question.explanation || 'No explanation available.';
  
  if (!isCorrect) {
    explanation = `The correct answer is ${question.correctAnswer}. ${explanation}`;
  }

  return { isCorrect, explanation };
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmissionRequest = await request.json();
    const { sessionId, questionIndex, selectedAnswer, timeSpent } = body;

    // Validate required fields
    if (!sessionId || questionIndex === undefined || !selectedAnswer || timeSpent === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate session
    const sessionData = await validateSession(sessionId);
    
    // Validate question index
    if (questionIndex < 0 || questionIndex >= sessionData.questions.length) {
      return NextResponse.json(
        { error: 'Invalid question index' },
        { status: 400 }
      );
    }

    // Get the current question
    const currentQuestion = sessionData.questions[questionIndex];
    
    // Check if answer is valid (A, B, C, or D)
    if (!['A', 'B', 'C', 'D'].includes(selectedAnswer)) {
      return NextResponse.json(
        { error: 'Invalid answer format' },
        { status: 400 }
      );
    }

    // Update session with the answer
    await updateSessionAnswer(sessionId, questionIndex, selectedAnswer, timeSpent);
    
    // Get feedback for the answer
    const { isCorrect, explanation } = await getQuestionFeedback(currentQuestion, selectedAnswer);
    
    // Log the submission for analytics
    await logSubmission(sessionId, questionIndex, selectedAnswer, isCorrect, timeSpent);

    // Prepare response
    const response: SubmissionResponse = {
      isCorrect,
      explanation,
      correctAnswer: currentQuestion.correctAnswer,
      success: true
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Answer submission error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('not found') ? 404 : 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

// Helper endpoint to get submission history for a session
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get all submissions for this session
    const submissionsSnapshot = await db
      .collection('quizSubmissions')
      .where('sessionId', '==', sessionId)
      .orderBy('questionIndex')
      .get();

    const submissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ submissions });

  } catch (error) {
    console.error('Submission history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}