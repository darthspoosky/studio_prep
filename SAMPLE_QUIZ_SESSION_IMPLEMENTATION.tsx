// Sample Implementation: Complete Quiz Session Component
// File: src/app/daily-quiz/session/[type]/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  BookOpen,
  Trophy,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string; // 'A', 'B', 'C', 'D'
  explanation: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  image?: string;
}

interface QuizSession {
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
}

interface QuizResults {
  score: number;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  subjectWiseResults: { [subject: string]: { correct: number; total: number } };
  recommendations: string[];
}

type SessionState = 'loading' | 'active' | 'completed' | 'error' | 'timeUp';

// Main Quiz Session Component
export default function QuizSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const quizType = params.type as string;

  // State Management
  const [sessionState, setSessionState] = useState<SessionState>('loading');
  const [session, setSession] = useState<QuizSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Quiz Session
  const initializeQuiz = useCallback(async () => {
    try {
      setSessionState('loading');
      setError(null);

      const response = await fetch('/api/daily-quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          quizType,
          difficulty: getQuizDifficulty(quizType),
          subject: getQuizSubject(quizType)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const data = await response.json();
      const newSession: QuizSession = {
        ...data.session,
        answers: new Array(data.session.questions.length).fill(null),
        bookmarked: new Array(data.session.questions.length).fill(false),
      };

      setSession(newSession);
      setTimeRemaining(newSession.timeLimit);
      setSessionState('active');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
      setSessionState('error');
    }
  }, [user?.uid, quizType]);

  // Timer Effect
  useEffect(() => {
    if (sessionState !== 'active' || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setSessionState('timeUp');
          completeQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionState, timeRemaining]);

  // Submit Answer
  const submitAnswer = async (answerIndex: number) => {
    if (!session || sessionState !== 'active') return;

    const answer = String.fromCharCode(65 + answerIndex); // Convert 0,1,2,3 to A,B,C,D
    const newAnswers = [...session.answers];
    newAnswers[session.currentQuestionIndex] = answer;

    setSession(prev => ({ ...prev!, answers: newAnswers }));

    try {
      await fetch('/api/daily-quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          questionIndex: session.currentQuestionIndex,
          selectedAnswer: answer,
          timeSpent: session.timeLimit - timeRemaining
        })
      });
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  // Navigation
  const goToQuestion = (index: number) => {
    if (!session || index < 0 || index >= session.questions.length) return;
    setSession(prev => ({ ...prev!, currentQuestionIndex: index }));
    setShowExplanation(false);
  };

  const nextQuestion = () => {
    if (session) {
      goToQuestion(session.currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (session) {
      goToQuestion(session.currentQuestionIndex - 1);
    }
  };

  // Bookmark Question
  const toggleBookmark = () => {
    if (!session) return;
    const newBookmarked = [...session.bookmarked];
    newBookmarked[session.currentQuestionIndex] = !newBookmarked[session.currentQuestionIndex];
    setSession(prev => ({ ...prev!, bookmarked: newBookmarked }));
  };

  // Complete Quiz
  const completeQuiz = async () => {
    if (!session) return;

    try {
      const response = await fetch('/api/daily-quiz/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id })
      });

      if (response.ok) {
        const results = await response.json();
        setResults(results);
        setSessionState('completed');
      }
    } catch (err) {
      console.error('Failed to complete quiz:', err);
    }
  };

  // Helper Functions
  const getQuizDifficulty = (type: string): string => {
    const difficultyMap: { [key: string]: string } = {
      'free-daily': 'easy',
      'ncert-foundation': 'easy',
      'past-year': 'medium',
      'mock-prelims': 'hard',
      'adaptive': 'medium'
    };
    return difficultyMap[type] || 'medium';
  };

  const getQuizSubject = (type: string): string => {
    const subjectMap: { [key: string]: string } = {
      'current-affairs-basic': 'Current Affairs',
      'current-affairs-advanced': 'Current Affairs',
      'ncert-foundation': 'General Studies'
    };
    return subjectMap[type] || 'General Studies';
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuizTitle = (type: string): string => {
    const titleMap: { [key: string]: string } = {
      'free-daily': 'Daily Free Questions',
      'ncert-foundation': 'NCERT Foundation',
      'past-year': 'Previous Year Questions',
      'mock-prelims': 'Mock Prelims Test',
      'adaptive': 'Adaptive Practice'
    };
    return titleMap[type] || 'Quiz Practice';
  };

  // Loading State
  if (sessionState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Preparing Your Quiz</h3>
            <p className="text-gray-600">Generating personalized questions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State
  if (sessionState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quiz Loading Failed</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={initializeQuiz} className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => router.back()} className="w-full">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results State
  if (sessionState === 'completed' && results) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
              <p className="text-gray-600">Great job completing the {getQuizTitle(quizType)}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.score}%</div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.correctAnswers}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{results.totalQuestions}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{formatTime(results.timeTaken)}</div>
                  <div className="text-sm text-gray-600">Time</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Subject-wise Performance
                </h4>
                {Object.entries(results.subjectWiseResults).map(([subject, result]) => (
                  <div key={subject} className="flex justify-between items-center">
                    <span>{subject}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{result.correct}/{result.total}</span>
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div 
                          className="h-2 bg-blue-500 rounded" 
                          style={{ width: `${(result.correct / result.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {results.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-4 mt-6">
                <Button onClick={() => router.push('/daily-quiz')} className="flex-1">
                  Take Another Quiz
                </Button>
                <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1">
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Active Quiz State
  if (sessionState === 'active' && session) {
    const currentQuestion = session.questions[session.currentQuestionIndex];
    const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;
    const answeredCount = session.answers.filter(a => a !== null).length;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="font-semibold">{getQuizTitle(quizType)}</h1>
                  <p className="text-sm text-gray-600">
                    Question {session.currentQuestionIndex + 1} of {session.questions.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className={cn(
                    "font-mono text-sm",
                    timeRemaining < 300 && "text-red-500 font-bold"
                  )}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <Badge variant="outline">
                  {answeredCount}/{session.questions.length} answered
                </Badge>
              </div>
            </div>
            <Progress value={progress} className="mt-3" />
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="secondary">{currentQuestion.subject}</Badge>
                    <Badge variant="outline" className={cn(
                      currentQuestion.difficulty === 'easy' && 'text-green-600',
                      currentQuestion.difficulty === 'medium' && 'text-yellow-600',
                      currentQuestion.difficulty === 'hard' && 'text-red-600'
                    )}>
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-medium leading-relaxed">
                    {currentQuestion.question}
                  </h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleBookmark}
                  className={cn(
                    session.bookmarked[session.currentQuestionIndex] && "text-yellow-500"
                  )}
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {currentQuestion.image && (
                <div className="mb-6">
                  <img 
                    src={currentQuestion.image} 
                    alt="Question image" 
                    className="max-w-full h-auto rounded-lg mx-auto"
                  />
                </div>
              )}

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const optionLetter = String.fromCharCode(65 + index);
                  const isSelected = session.answers[session.currentQuestionIndex] === optionLetter;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => submitAnswer(index)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border-2 transition-all",
                        "hover:bg-blue-50 hover:border-blue-300",
                        isSelected 
                          ? "bg-blue-100 border-blue-500 shadow-sm" 
                          : "bg-white border-gray-200"
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <span className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium",
                          isSelected 
                            ? "bg-blue-500 text-white" 
                            : "bg-gray-100 text-gray-600"
                        )}>
                          {optionLetter}
                        </span>
                        <span className="flex-1">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {session.answers[session.currentQuestionIndex] && showExplanation && (
                <Alert className="mt-6">
                  <BookOpen className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Explanation:</strong> {currentQuestion.explanation}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={previousQuestion}
              disabled={session.currentQuestionIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              {session.answers[session.currentQuestionIndex] && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowExplanation(!showExplanation)}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {showExplanation ? 'Hide' : 'Show'} Explanation
                </Button>
              )}
              
              {session.currentQuestionIndex === session.questions.length - 1 ? (
                <Button onClick={completeQuiz} disabled={answeredCount === 0}>
                  Complete Quiz
                </Button>
              ) : (
                <Button onClick={nextQuestion}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Question Navigation Grid */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Question Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-2">
                {session.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={cn(
                      "w-8 h-8 rounded text-xs font-medium transition-all",
                      index === session.currentQuestionIndex
                        ? "bg-blue-500 text-white"
                        : session.answers[index]
                        ? "bg-green-100 text-green-700"
                        : session.bookmarked[index]
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                  <span>Bookmarked</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Current</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Initialize quiz on mount
  useEffect(() => {
    if (user) {
      initializeQuiz();
    }
  }, [user, initializeQuiz]);

  return null;
}