'use client';

import React from 'react';
import { useQuizSession } from './QuizSessionContext';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle, 
  SkipForward,
  RotateCcw 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizNavigationProps {
  onComplete: () => void;
  isCompleting?: boolean;
  className?: string;
}

export const QuizNavigation: React.FC<QuizNavigationProps> = ({
  onComplete,
  isCompleting = false,
  className
}) => {
  const {
    session,
    currentQuestion,
    nextQuestion,
    previousQuestion,
    toggleBookmark,
    isLastQuestion,
    answeredCount
  } = useQuizSession();

  const currentAnswer = session.answers[session.currentQuestionIndex];
  const isBookmarked = session.bookmarked[session.currentQuestionIndex];
  const canGoBack = session.currentQuestionIndex > 0;
  const canGoNext = session.currentQuestionIndex < session.questions.length - 1;
  const hasAnsweredCurrent = currentAnswer !== null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary Navigation */}
      <div className="flex items-center justify-between">
        {/* Previous Button */}
        <Button 
          variant="outline" 
          onClick={previousQuestion}
          disabled={!canGoBack || session.completed}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Center Actions */}
        <div className="flex items-center space-x-2">
          {/* Bookmark Button */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleBookmark}
            disabled={session.completed}
            className={cn(
              "flex items-center gap-2",
              isBookmarked && "text-yellow-500 hover:text-yellow-600"
            )}
          >
            <Flag className="w-4 h-4" />
            <span className="hidden md:inline">
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </span>
          </Button>

          {/* Clear Answer Button */}
          {hasAnsweredCurrent && !session.completed && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                // Clear current answer by setting it to null
                const newAnswers = [...session.answers];
                newAnswers[session.currentQuestionIndex] = null;
                // Note: This would need to be implemented in the context
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Clear</span>
            </Button>
          )}
        </div>

        {/* Next/Complete Button */}
        {isLastQuestion ? (
          <Button 
            onClick={onComplete}
            disabled={isCompleting || answeredCount === 0}
            className="flex items-center gap-2"
          >
            {isCompleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Completing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Complete Quiz</span>
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={nextQuestion}
            disabled={!canGoNext || session.completed}
            className="flex items-center gap-2"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center justify-between text-sm text-gray-600 px-1">
        <div className="flex items-center space-x-4">
          <span>
            Question {session.currentQuestionIndex + 1} of {session.questions.length}
          </span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{answeredCount} answered</span>
          </div>
          {session.bookmarked.filter(Boolean).length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>{session.bookmarked.filter(Boolean).length} bookmarked</span>
            </div>
          )}
        </div>

        {!isLastQuestion && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={nextQuestion}
            disabled={!canGoNext || session.completed}
            className="text-gray-500 hover:text-gray-700"
          >
            <SkipForward className="w-4 h-4 mr-1" />
            Skip
          </Button>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="px-1">
        <div className="flex space-x-1">
          {session.questions.map((_, index) => (
            <div
              key={index}
              className={cn(
                "flex-1 h-1 rounded-full transition-all duration-300",
                index === session.currentQuestionIndex
                  ? "bg-blue-500"
                  : session.answers[index] !== null
                  ? "bg-green-500"
                  : session.bookmarked[index]
                  ? "bg-yellow-500"
                  : "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Completion Warning */}
      {isLastQuestion && answeredCount < session.questions.length && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 text-yellow-600 mt-0.5">⚠️</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Incomplete Quiz
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                You have {session.questions.length - answeredCount} unanswered questions. 
                You can still complete the quiz, but consider reviewing them first.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact navigation for mobile
interface CompactNavigationProps {
  onComplete: () => void;
  isCompleting?: boolean;
  className?: string;
}

export const CompactNavigation: React.FC<CompactNavigationProps> = ({
  onComplete,
  isCompleting = false,
  className
}) => {
  const {
    session,
    nextQuestion,
    previousQuestion,
    isLastQuestion,
    answeredCount
  } = useQuizSession();

  const canGoBack = session.currentQuestionIndex > 0;
  const canGoNext = session.currentQuestionIndex < session.questions.length - 1;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <Button 
        variant="outline" 
        size="sm"
        onClick={previousQuestion}
        disabled={!canGoBack || session.completed}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="text-center">
        <div className="text-sm font-medium">
          {session.currentQuestionIndex + 1} / {session.questions.length}
        </div>
        <div className="text-xs text-gray-600">
          {answeredCount} answered
        </div>
      </div>

      {isLastQuestion ? (
        <Button 
          size="sm"
          onClick={onComplete}
          disabled={isCompleting || answeredCount === 0}
        >
          {isCompleting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
        </Button>
      ) : (
        <Button 
          variant="outline" 
          size="sm"
          onClick={nextQuestion}
          disabled={!canGoNext || session.completed}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};