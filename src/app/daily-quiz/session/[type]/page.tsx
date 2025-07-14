'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { QuizSessionProvider } from '../../components/quiz/QuizSessionContext';
import { QuizSessionLayout } from '../../components/quiz/QuizSessionLayout';
import { QuizLoading } from '../../components/quiz/QuizLoading';
import { QuizError } from '../../components/quiz/QuizError';

// Types
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string; // 'A', 'B', 'C', 'D'
  explanation: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  image?: string;
  source?: string;
  year?: number;
  tags?: string[];
}

export interface QuizSessionData {
  id: string;
  userId: string;
  quizType: string;
  questions: QuizQuestion[];
  timeLimit: number; // in seconds
  startTime: Date;
  currentQuestionIndex: number;
  answers: (string | null)[];
  bookmarked: boolean[];
  completed: boolean;
  metadata: {
    difficulty: string;
    subject: string;
    tier: string;
    maxQuestions: number;
  };
}

type SessionState = 'loading' | 'active' | 'completed' | 'error' | 'timeUp' | 'unauthorized';

const QUIZ_TYPE_CONFIG = {
  'free-daily': {
    name: 'Daily Free Questions',
    timeLimit: 15 * 60, // 15 minutes
    maxQuestions: 5,
    difficulty: 'easy',
    subject: 'General Studies',
    tier: 'free'
  },
  'ncert-foundation': {
    name: 'NCERT Foundation',
    timeLimit: 20 * 60, // 20 minutes
    maxQuestions: 10,
    difficulty: 'easy',
    subject: 'General Studies',
    tier: 'foundation'
  },
  'past-year': {
    name: 'Previous Year Questions',
    timeLimit: 25 * 60, // 25 minutes
    maxQuestions: 15,
    difficulty: 'medium',
    subject: 'General Studies',
    tier: 'practice'
  },
  'subject-wise': {
    name: 'Subject-wise Practice',
    timeLimit: 30 * 60, // 30 minutes
    maxQuestions: 20,
    difficulty: 'medium',
    subject: 'General Studies',
    tier: 'practice'
  },
  'current-affairs-basic': {
    name: 'Current Affairs Basics',
    timeLimit: 20 * 60, // 20 minutes
    maxQuestions: 10,
    difficulty: 'easy',
    subject: 'Current Affairs',
    tier: 'foundation'
  },
  'current-affairs-advanced': {
    name: 'Advanced Current Affairs',
    timeLimit: 30 * 60, // 30 minutes
    maxQuestions: 15,
    difficulty: 'medium',
    subject: 'Current Affairs',
    tier: 'practice'
  },
  'mock-prelims': {
    name: 'Mock Prelims Test',
    timeLimit: 120 * 60, // 2 hours
    maxQuestions: 100,
    difficulty: 'hard',
    subject: 'General Studies',
    tier: 'test'
  },
  'adaptive': {
    name: 'Adaptive Practice',
    timeLimit: 45 * 60, // 45 minutes
    maxQuestions: 25,
    difficulty: 'medium',
    subject: 'General Studies',
    tier: 'test'
  },
  'topper-bank': {
    name: 'Topper Question Bank',
    timeLimit: 60 * 60, // 60 minutes
    maxQuestions: 40,
    difficulty: 'hard',
    subject: 'General Studies',
    tier: 'advanced'
  },
  'final-revision': {
    name: 'Final Revision Series',
    timeLimit: 30 * 60, // 30 minutes
    maxQuestions: 20,
    difficulty: 'medium',
    subject: 'General Studies',
    tier: 'advanced'
  }
};

export default function QuizSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const quizType = params.type as string;

  // State Management
  const [sessionState, setSessionState] = useState<SessionState>('loading');
  const [session, setSession] = useState<QuizSessionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get quiz configuration
  const quizConfig = QUIZ_TYPE_CONFIG[quizType as keyof typeof QUIZ_TYPE_CONFIG];

  // Initialize Quiz Session
  const initializeQuiz = useCallback(async () => {
    if (!user) {
      setSessionState('error');
      setError('Please log in to take a quiz');
      return;
    }

    if (!quizConfig) {
      setSessionState('error');
      setError('Invalid quiz type');
      return;
    }

    try {
      setSessionState('loading');
      setError(null);

      // Check user subscription tier access
      const hasAccess = await checkUserAccess(user.uid, quizConfig.tier);
      if (!hasAccess) {
        setSessionState('unauthorized');
        return;
      }

      // Generate quiz session
      const response = await fetch('/api/daily-quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          quizType,
          difficulty: quizConfig.difficulty,
          subject: quizConfig.subject,
          maxQuestions: quizConfig.maxQuestions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate quiz');
      }

      const data = await response.json();
      
      const newSession: QuizSessionData = {
        id: data.sessionId,
        userId: user.uid,
        quizType,
        questions: data.questions,
        timeLimit: quizConfig.timeLimit,
        startTime: new Date(),
        currentQuestionIndex: 0,
        answers: new Array(data.questions.length).fill(null),
        bookmarked: new Array(data.questions.length).fill(false),
        completed: false,
        metadata: {
          difficulty: quizConfig.difficulty,
          subject: quizConfig.subject,
          tier: quizConfig.tier,
          maxQuestions: quizConfig.maxQuestions
        }
      };

      setSession(newSession);
      setSessionState('active');

    } catch (err) {
      console.error('Quiz initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
      setSessionState('error');
    }
  }, [user, quizType, quizConfig]);

  // Check user access to quiz tier
  const checkUserAccess = async (userId: string, requiredTier: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/subscription/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, requiredTier })
      });
      
      if (response.ok) {
        const { hasAccess } = await response.json();
        return hasAccess;
      }
      
      return false;
    } catch (error) {
      console.error('Access check failed:', error);
      return false;
    }
  };

  // Initialize quiz on mount
  useEffect(() => {
    if (user) {
      initializeQuiz();
    }
  }, [user, initializeQuiz]);

  // Render states
  if (sessionState === 'loading') {
    return <QuizLoading quizName={quizConfig?.name || 'Quiz'} />;
  }

  if (sessionState === 'error') {
    return (
      <QuizError 
        error={error} 
        onRetry={initializeQuiz}
        onGoBack={() => router.push('/daily-quiz')}
      />
    );
  }

  if (sessionState === 'unauthorized') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m9-5.5V8a5 5 0 00-10 0v2.5M5 12h14l-1 7H6l-1-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Upgrade Required
            </h2>
            <p className="text-gray-600 mb-6">
              This quiz requires a {quizConfig?.tier} subscription or higher.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/pricing')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Subscription Plans
              </button>
              <button
                onClick={() => router.push('/daily-quiz')}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Quiz Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionState === 'active' && session) {
    return (
      <QuizSessionProvider session={session} onSessionUpdate={setSession}>
        <QuizSessionLayout 
          onComplete={() => setSessionState('completed')}
          onTimeUp={() => setSessionState('timeUp')}
          onError={(error) => {
            setError(error);
            setSessionState('error');
          }}
        />
      </QuizSessionProvider>
    );
  }

  return null;
}