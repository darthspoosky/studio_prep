import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'firebase-admin/auth';
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

interface QuizGenerationRequest {
  userId: string;
  quizType: string;
  difficulty: string;
  subject: string;
  maxQuestions: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  image?: string;
  source?: string;
  year?: number;
  tags?: string[];
}

// Quiz type configurations
const QUIZ_CONFIGS = {
  'free-daily': {
    questionPool: 'daily-questions',
    timeLimit: 15 * 60,
    allowedTiers: ['free', 'foundation', 'practice', 'mains', 'interview', 'elite']
  },
  'ncert-foundation': {
    questionPool: 'ncert-questions',
    timeLimit: 20 * 60,
    allowedTiers: ['foundation', 'practice', 'mains', 'interview', 'elite']
  },
  'past-year': {
    questionPool: 'past-year-questions',
    timeLimit: 25 * 60,
    allowedTiers: ['practice', 'mains', 'interview', 'elite']
  },
  'subject-wise': {
    questionPool: 'subject-questions',
    timeLimit: 30 * 60,
    allowedTiers: ['practice', 'mains', 'interview', 'elite']
  },
  'current-affairs-basic': {
    questionPool: 'current-affairs',
    timeLimit: 20 * 60,
    allowedTiers: ['foundation', 'practice', 'mains', 'interview', 'elite']
  },
  'current-affairs-advanced': {
    questionPool: 'current-affairs',
    timeLimit: 30 * 60,
    allowedTiers: ['practice', 'mains', 'interview', 'elite']
  },
  'mock-prelims': {
    questionPool: 'prelims-questions',
    timeLimit: 120 * 60,
    allowedTiers: ['mains', 'interview', 'elite']
  },
  'adaptive': {
    questionPool: 'adaptive-questions',
    timeLimit: 45 * 60,
    allowedTiers: ['interview', 'elite']
  },
  'topper-bank': {
    questionPool: 'topper-questions',
    timeLimit: 60 * 60,
    allowedTiers: ['elite']
  },
  'final-revision': {
    questionPool: 'revision-questions',
    timeLimit: 30 * 60,
    allowedTiers: ['elite']
  }
};

async function validateUserAccess(userId: string, quizType: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('userSubscriptions').doc(userId).get();
    
    if (!userDoc.exists) {
      // Free tier for new users
      return QUIZ_CONFIGS[quizType as keyof typeof QUIZ_CONFIGS]?.allowedTiers.includes('free') || false;
    }

    const userData = userDoc.data();
    const userTier = userData?.tier || 'free';
    const allowedTiers = QUIZ_CONFIGS[quizType as keyof typeof QUIZ_CONFIGS]?.allowedTiers || [];
    
    return allowedTiers.includes(userTier);
  } catch (error) {
    console.error('Access validation error:', error);
    return false;
  }
}

async function generateQuizQuestions(
  quizType: string,
  difficulty: string,
  subject: string,
  maxQuestions: number
): Promise<QuizQuestion[]> {
  try {
    const config = QUIZ_CONFIGS[quizType as keyof typeof QUIZ_CONFIGS];
    if (!config) {
      throw new Error('Invalid quiz type');
    }

    // Query questions from the appropriate collection
    let query = db.collection(config.questionPool)
      .where('difficulty', '==', difficulty)
      .limit(maxQuestions * 2); // Get more questions to ensure variety

    // Add subject filter if specified and not "General Studies"
    if (subject !== 'General Studies') {
      query = query.where('subject', '==', subject);
    }

    const questionsSnapshot = await query.get();
    const allQuestions = questionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuizQuestion));

    // Shuffle and select required number of questions
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, maxQuestions);

    // If we don't have enough questions, generate some mock questions
    if (selectedQuestions.length < maxQuestions) {
      const mockQuestions = await generateMockQuestions(
        maxQuestions - selectedQuestions.length,
        difficulty,
        subject,
        quizType
      );
      selectedQuestions.push(...mockQuestions);
    }

    return selectedQuestions;
  } catch (error) {
    console.error('Question generation error:', error);
    throw new Error('Failed to generate quiz questions');
  }
}

async function generateMockQuestions(
  count: number,
  difficulty: string,
  subject: string,
  quizType: string
): Promise<QuizQuestion[]> {
  // For demo purposes, generate mock questions
  // In production, this would use AI to generate questions
  const mockQuestions: QuizQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const questionId = `mock-${Date.now()}-${i}`;
    mockQuestions.push({
      id: questionId,
      question: `Sample ${difficulty} level question ${i + 1} for ${subject}. Which of the following is correct regarding this topic?`,
      options: [
        'Option A: This is the first possible answer',
        'Option B: This is the second possible answer', 
        'Option C: This is the third possible answer',
        'Option D: This is the fourth possible answer'
      ],
      correctAnswer: 'A',
      explanation: `This is a sample explanation for question ${i + 1}. In a real implementation, this would contain detailed reasoning and educational content.`,
      subject,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      tags: [quizType, difficulty, subject.toLowerCase().replace(' ', '-')]
    });
  }

  return mockQuestions;
}

async function createQuizSession(
  userId: string,
  quizType: string,
  questions: QuizQuestion[],
  timeLimit: number
): Promise<string> {
  try {
    const sessionData = {
      userId,
      quizType,
      questions,
      timeLimit,
      startTime: new Date(),
      currentQuestionIndex: 0,
      answers: new Array(questions.length).fill(null),
      bookmarked: new Array(questions.length).fill(false),
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const sessionRef = await db.collection('quizSessions').add(sessionData);
    return sessionRef.id;
  } catch (error) {
    console.error('Session creation error:', error);
    throw new Error('Failed to create quiz session');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: QuizGenerationRequest = await request.json();
    const { userId, quizType, difficulty, subject, maxQuestions } = body;

    // Validate required fields
    if (!userId || !quizType || !difficulty || !subject || !maxQuestions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate user access
    const hasAccess = await validateUserAccess(userId, quizType);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied for this quiz type' },
        { status: 403 }
      );
    }

    // Generate quiz questions
    const questions = await generateQuizQuestions(quizType, difficulty, subject, maxQuestions);
    
    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions available for the specified criteria' },
        { status: 404 }
      );
    }

    // Create quiz session
    const config = QUIZ_CONFIGS[quizType as keyof typeof QUIZ_CONFIGS];
    const sessionId = await createQuizSession(userId, quizType, questions, config.timeLimit);

    // Log quiz generation for analytics
    await db.collection('quizAnalytics').add({
      userId,
      quizType,
      difficulty,
      subject,
      questionCount: questions.length,
      sessionId,
      timestamp: new Date()
    });

    return NextResponse.json({
      sessionId,
      questions,
      timeLimit: config.timeLimit,
      success: true
    });

  } catch (error) {
    console.error('Quiz generation error:', error);
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