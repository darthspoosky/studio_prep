'use client';

import React, { useState } from 'react';
import { useQuizSession } from './QuizSessionContext';
import { QuestionCard } from './QuestionCard';
import { QuizTimer } from './QuizTimer';
import { ProgressBar } from './ProgressBar';
import { QuizNavigation, CompactNavigation } from './QuizNavigation';
import { QuestionGrid } from './QuestionGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  ChevronLeft, 
  Grid3X3, 
  Clock, 
  Flag,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileQuizLayoutProps {
  onComplete: () => void;
  onTimeUp: () => void;
  onError: (error: string) => void;
  onGoBack: () => void;
}

export const MobileQuizLayout: React.FC<MobileQuizLayoutProps> = ({
  onComplete,
  onTimeUp,
  onError,
  onGoBack
}) => {
  const {
    session,
    timeRemaining,
    answeredCount,
    progress
  } = useQuizSession();

  const [showNavigationPanel, setShowNavigationPanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Back button and title */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onGoBack}
              className="p-2 h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-sm truncate">{getQuizTitle()}</h1>
              <p className="text-xs text-gray-600">
                Q{session.currentQuestionIndex + 1}/{session.questions.length}
              </p>
            </div>
          </div>

          {/* Right: Timer and menu */}
          <div className="flex items-center space-x-2">
            <QuizTimer 
              timeRemaining={timeRemaining}
              size="sm"
              onTimeUp={onTimeUp}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 h-8 w-8"
            >
              {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2">
          <ProgressBar 
            progress={progress} 
            size="sm"
          />
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-10">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Answered</span>
                <span className="font-medium">{answeredCount}/{session.questions.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Bookmarked</span>
                <span className="font-medium">{session.bookmarked.filter(Boolean).length}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNavigationPanel(true);
                  setShowMobileMenu(false);
                }}
                className="w-full"
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Question Overview
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 pb-20">
        <QuestionCard />
      </div>

      {/* Floating Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
        <CompactNavigation 
          onComplete={onComplete}
          className="w-full"
        />
      </div>

      {/* Navigation Panel Sheet */}
      <Sheet open={showNavigationPanel} onOpenChange={setShowNavigationPanel}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Question Navigation</SheetTitle>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto">
            <QuestionGrid compact={true} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// Responsive wrapper that chooses layout based on screen size
interface ResponsiveQuizLayoutProps {
  onComplete: () => void;
  onTimeUp: () => void;
  onError: (error: string) => void;
  onGoBack: () => void;
}

export const ResponsiveQuizLayout: React.FC<ResponsiveQuizLayoutProps> = (props) => {
  return (
    <>
      {/* Mobile Layout (hidden on larger screens) */}
      <div className="block lg:hidden">
        <MobileQuizLayout {...props} />
      </div>
      
      {/* Desktop Layout (hidden on mobile) */}
      <div className="hidden lg:block">
        {/* Import and use the existing QuizSessionLayout for desktop */}
        <div className="min-h-screen bg-gray-50">
          {/* Desktop layout content would go here */}
          {/* For now, we'll use the existing QuizSessionLayout */}
        </div>
      </div>
    </>
  );
};