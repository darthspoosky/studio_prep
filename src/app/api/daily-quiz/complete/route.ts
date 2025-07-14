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

interface CompletionRequest {
  sessionId: string;
  finalAnswers?: (string | null)[];
  timeTaken?: number;
}

interface QuizResults {
  score: number;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  subjectWiseResults: { [subject: string]: { correct: number; total: number } };
  recommendations: string[];
  detailedResults: {
    questionId: string;
    isCorrect: boolean;
    selectedAnswer: string;
    correctAnswer: string;
    timeSpent: number;
  }[];
}

async function validateAndGetSession(sessionId: string): Promise<any> {
  try {
    const sessionDoc = await db.collection('quizSessions').doc(sessionId).get();
    
    if (!sessionDoc.exists) {
      throw new Error('Quiz session not found');
    }

    const sessionData = sessionDoc.data();
    
    if (sessionData?.completed) {
      // If already completed, return existing results
      const existingResults = await getExistingResults(sessionId);
      if (existingResults) {
        return { sessionData, existingResults };
      }
    }

    return { sessionData };
  } catch (error) {
    console.error('Session validation error:', error);
    throw error;
  }
}

async function getExistingResults(sessionId: string): Promise<QuizResults | null> {
  try {
    const resultDoc = await db.collection('quizResults').doc(sessionId).get();
    return resultDoc.exists ? resultDoc.data() as QuizResults : null;
  } catch (error) {
    console.error('Error fetching existing results:', error);
    return null;
  }
}

async function calculateResults(sessionData: any): Promise<QuizResults> {
  const { questions, answers, userId, quizType, startTime } = sessionData;
  const endTime = new Date();
  const timeTaken = Math.floor((endTime.getTime() - startTime.toDate().getTime()) / 1000);

  let correctAnswers = 0;
  const subjectWiseResults: { [subject: string]: { correct: number; total: number } } = {};
  const detailedResults: QuizResults['detailedResults'] = [];

  // Calculate scores and subject-wise results
  questions.forEach((question: any, index: number) => {
    const userAnswer = answers[index];
    const isCorrect = userAnswer === question.correctAnswer;
    
    if (isCorrect) {
      correctAnswers++;
    }

    // Track subject-wise performance
    const subject = question.subject || 'General Studies';
    if (!subjectWiseResults[subject]) {
      subjectWiseResults[subject] = { correct: 0, total: 0 };
    }
    subjectWiseResults[subject].total++;
    if (isCorrect) {
      subjectWiseResults[subject].correct++;
    }

    // Add to detailed results
    detailedResults.push({
      questionId: question.id,
      isCorrect,
      selectedAnswer: userAnswer || 'Not answered',
      correctAnswer: question.correctAnswer,
      timeSpent: sessionData.timeSpent?.[index] || 0
    });
  });

  const totalQuestions = questions.length;
  const answeredQuestions = answers.filter((answer: any) => answer !== null).length;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const accuracy = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;

  // Generate personalized recommendations
  const recommendations = generateRecommendations(
    score,
    accuracy,
    subjectWiseResults,
    quizType,
    timeTaken
  );

  return {
    score,
    accuracy,
    totalQuestions,
    correctAnswers,
    timeTaken,
    subjectWiseResults,
    recommendations,
    detailedResults
  };
}

function generateRecommendations(
  score: number,
  accuracy: number,
  subjectWiseResults: { [subject: string]: { correct: number; total: number } },
  quizType: string,
  timeTaken: number
): string[] {
  const recommendations: string[] = [];

  // Score-based recommendations
  if (score >= 80) {
    recommendations.push('Excellent performance! You\'re well-prepared for this topic.');
    recommendations.push('Consider attempting harder difficulty levels to further challenge yourself.');
  } else if (score >= 60) {
    recommendations.push('Good work! Focus on areas where you scored lower to improve further.');
    recommendations.push('Review explanations for incorrect answers to strengthen your understanding.');
  } else {
    recommendations.push('Focus on understanding fundamental concepts in your weak areas.');
    recommendations.push('Consider taking more practice quizzes to build confidence.');
  }

  // Subject-wise recommendations
  const weakSubjects = Object.entries(subjectWiseResults)
    .filter(([_, result]) => (result.correct / result.total) < 0.6)
    .map(([subject, _]) => subject);

  if (weakSubjects.length > 0) {
    recommendations.push(`Pay special attention to: ${weakSubjects.join(', ')}`);
  }

  // Time-based recommendations
  const averageTimePerQuestion = timeTaken / Object.keys(subjectWiseResults).length;
  if (averageTimePerQuestion > 120) { // More than 2 minutes per question
    recommendations.push('Practice time management. Try to spend less time per question.');
  } else if (averageTimePerQuestion < 30) { // Less than 30 seconds per question
    recommendations.push('Take more time to carefully read and analyze each question.');
  }

  // Quiz type specific recommendations
  switch (quizType) {
    case 'free-daily':
      recommendations.push('Keep up the daily practice routine for consistent improvement.');
      break;
    case 'mock-prelims':
      recommendations.push('Focus on speed and accuracy for the actual Prelims exam.');
      break;
    case 'current-affairs-basic':
    case 'current-affairs-advanced':
      recommendations.push('Stay updated with recent developments and practice connecting current events to static knowledge.');
      break;
  }

  return recommendations.slice(0, 5); // Limit to 5 recommendations
}

async function saveResults(sessionId: string, results: QuizResults, sessionData: any): Promise<void> {
  try {
    const batch = db.batch();

    // Save quiz results
    const resultsRef = db.collection('quizResults').doc(sessionId);
    batch.set(resultsRef, {
      ...results,
      userId: sessionData.userId,
      quizType: sessionData.quizType,
      completedAt: new Date(),
      sessionId
    });

    // Update session as completed
    const sessionRef = db.collection('quizSessions').doc(sessionId);
    batch.update(sessionRef, {
      completed: true,
      completedAt: new Date(),
      finalScore: results.score
    });

    // Update user progress/stats
    const userStatsRef = db.collection('userStats').doc(sessionData.userId);
    const userStatsDoc = await userStatsRef.get();
    
    if (userStatsDoc.exists) {
      const currentStats = userStatsDoc.data();
      batch.update(userStatsRef, {
        totalQuizzes: (currentStats?.totalQuizzes || 0) + 1,
        totalQuestions: (currentStats?.totalQuestions || 0) + results.totalQuestions,
        totalCorrect: (currentStats?.totalCorrect || 0) + results.correctAnswers,
        averageScore: Math.round(((currentStats?.averageScore || 0) * (currentStats?.totalQuizzes || 0) + results.score) / ((currentStats?.totalQuizzes || 0) + 1)),
        lastQuizDate: new Date(),
        updatedAt: new Date()
      });
    } else {
      batch.set(userStatsRef, {
        totalQuizzes: 1,
        totalQuestions: results.totalQuestions,
        totalCorrect: results.correctAnswers,
        averageScore: results.score,
        lastQuizDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Results saving error:', error);
    throw new Error('Failed to save quiz results');
  }
}

async function updateUserProgress(userId: string, quizType: string, results: QuizResults): Promise<void> {
  try {
    // Update daily usage limits for free users
    const today = new Date().toISOString().split('T')[0];
    const usageRef = db.collection('dailyUsage').doc(`${userId}_${today}`);
    
    const usageDoc = await usageRef.get();
    const currentUsage = usageDoc.exists ? usageDoc.data() : {};
    
    await usageRef.set({
      ...currentUsage,
      userId,
      date: today,
      quizzesCompleted: (currentUsage?.quizzesCompleted || 0) + 1,
      questionsAnswered: (currentUsage?.questionsAnswered || 0) + results.totalQuestions,
      lastActivity: new Date()
    }, { merge: true });

    // Track quiz type usage
    const quizTypeUsageRef = db.collection('quizTypeUsage').doc(`${userId}_${quizType}`);
    const quizTypeDoc = await quizTypeUsageRef.get();
    const quizTypeUsage = quizTypeDoc.exists ? quizTypeDoc.data() : {};

    await quizTypeUsageRef.set({
      userId,
      quizType,
      totalAttempts: (quizTypeUsage?.totalAttempts || 0) + 1,
      totalQuestions: (quizTypeUsage?.totalQuestions || 0) + results.totalQuestions,
      totalCorrect: (quizTypeUsage?.totalCorrect || 0) + results.correctAnswers,
      bestScore: Math.max(quizTypeUsage?.bestScore || 0, results.score),
      lastAttempt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

  } catch (error) {
    console.error('User progress update error:', error);
    // Don't throw error for progress updates
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CompletionRequest = await request.json();
    const { sessionId, finalAnswers, timeTaken } = body;

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Validate and get session data
    const { sessionData, existingResults } = await validateAndGetSession(sessionId);

    // If already completed, return existing results
    if (existingResults) {
      return NextResponse.json(existingResults);
    }

    // Update final answers if provided
    if (finalAnswers) {
      await db.collection('quizSessions').doc(sessionId).update({
        answers: finalAnswers,
        updatedAt: new Date()
      });
      sessionData.answers = finalAnswers;
    }

    // Calculate results
    const results = await calculateResults(sessionData);

    // Save results and update session
    await saveResults(sessionId, results, sessionData);

    // Update user progress asynchronously
    updateUserProgress(sessionData.userId, sessionData.quizType, results)
      .catch(error => console.error('User progress update failed:', error));

    return NextResponse.json(results);

  } catch (error) {
    console.error('Quiz completion error:', error);
    
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
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get existing results
    const results = await getExistingResults(sessionId);
    
    if (!results) {
      return NextResponse.json(
        { error: 'Results not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Results retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}