'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizSession } from './QuizSessionContext';
import { QuestionCard } from './QuestionCard';
import { QuizTimer } from './QuizTimer';
import { ProgressBar } from './ProgressBar';
import { QuizNavigation } from './QuizNavigation';
import { QuestionGrid } from './QuestionGrid';
import { QuizResults } from './QuizResults';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft, 
  Clock, 
  Flag,
  BookOpen,
  Grid3X3,
  Eye,
  EyeOff 
} from 'lucide-react';

interface QuizSessionLayoutProps {
  onComplete: () => void;
  onTimeUp: () => void;
  onError: (error: string) => void;
}

export const QuizSessionLayout: React.FC<QuizSessionLayoutProps> = ({
  onComplete,
  onTimeUp,
  onError
}) => {
  const router = useRouter();
  const {
    session,
    currentQuestion,
    timeRemaining,
    isLastQuestion,
    answeredCount,
    progress,
    completeQuiz,
    lastSubmissionResult
  } = useQuizSession();

  // UI State
  const [showExplanation, setShowExplanation] = useState(false);
  const [showNavigationGrid, setShowNavigationGrid] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleTimeUp();
    }
  }, [timeRemaining]);

  // Show explanation when answer is submitted
  useEffect(() => {
    if (lastSubmissionResult) {
      setShowExplanation(true);
    }
  }, [lastSubmissionResult]);

  // Handle quiz completion
  const handleCompleteQuiz = async () => {
    if (isCompleting) return;

    setIsCompleting(true);
    try {
      const results = await completeQuiz();
      if (results) {
        setQuizResults(results);
        onComplete();
      } else {
        onError('Failed to complete quiz. Please try again.');
      }
    } catch (error) {
      onError('An error occurred while completing the quiz.');
    } finally {
      setIsCompleting(false);
    }
  };

  // Handle time up
  const handleTimeUp = async () => {
    await handleCompleteQuiz();
    onTimeUp();
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get quiz title from session
  const getQuizTitle = (): string => {
    const titleMap: { [key: string]: string } = {
      'free-daily': 'Daily Free Questions',
      'ncert-foundation': 'NCERT Foundation',
      'past-year': 'Previous Year Questions',
      'subject-wise': 'Subject-wise Practice',
      'current-affairs-basic': 'Current Affairs Basics',
      'current-affairs-advanced': 'Advanced Current Affairs',
      'mock-prelims': 'Mock Prelims Test',
      'adaptive': 'Adaptive Practice',
      'topper-bank': 'Topper Question Bank',
      'final-revision': 'Final Revision Series'
    };
    return titleMap[session.quizType] || 'Quiz Practice';
  };

  // Show results if completed
  if (quizResults) {
    return (
      <QuizResults 
        results={quizResults} 
        session={session}
        onRetakeQuiz={() => router.push('/daily-quiz')}
        onViewDashboard={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/daily-quiz')}
                className="flex items-center"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="ml-1 hidden sm:inline">Back</span>
              </Button>
              <div>
                <h1 className="font-semibold text-lg">{getQuizTitle()}</h1>
                <p className="text-sm text-gray-600">
                  Question {session.currentQuestionIndex + 1} of {session.questions.length}
                </p>
              </div>
            </div>

            {/* Right: Timer and progress info */}
            <div className="flex items-center space-x-4">
              <QuizTimer 
                timeRemaining={timeRemaining}
                className="hidden sm:flex"
              />
              <Badge variant="outline" className="hidden md:inline-flex">
                {answeredCount}/{session.questions.length} answered
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNavigationGrid(!showNavigationGrid)}
                className="lg:hidden"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <ProgressBar 
            progress={progress} 
            className="mt-3"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Quiz Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Mobile Timer */}
            <div className="sm:hidden">
              <QuizTimer timeRemaining={timeRemaining} />
            </div>

            {/* Question Card */}
            <QuestionCard />

            {/* Explanation Alert */}
            {showExplanation && lastSubmissionResult && (
              <Alert className="border-blue-200 bg-blue-50">
                <BookOpen className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {lastSubmissionResult.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowExplanation(false)}
                        className="h-6 px-2"
                      >
                        <EyeOff className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong>Explanation:</strong> {lastSubmissionResult.explanation}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Show explanation button when answer selected but hidden */}
            {!showExplanation && lastSubmissionResult && (
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExplanation(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Show Explanation
                </Button>
              </div>
            )}

            {/* Navigation */}
            <QuizNavigation 
              onComplete={handleCompleteQuiz}
              isCompleting={isCompleting}
            />
          </div>

          {/* Sidebar - Navigation Grid */}
          <div className={`lg:block ${showNavigationGrid ? 'block' : 'hidden'}`}>
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Navigation</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNavigationGrid(false)}
                    className="lg:hidden h-6 w-6 p-0"
                  >
                    <EyeOff className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <QuestionGrid />
                
                {/* Legend */}
                <div className="mt-4 space-y-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                    <span>Bookmarked</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                    <span>Not answered</span>
                  </div>
                </div>

                {/* Quiz Info */}
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subject:</span>
                    <span className="font-medium">{session.metadata.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-medium capitalize">{session.metadata.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};