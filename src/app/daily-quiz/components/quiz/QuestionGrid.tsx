'use client';

import React from 'react';
import { useQuizSession } from './QuizSessionContext';
import { Button } from '@/components/ui/button';
import { 
  Flag, 
  CheckCircle, 
  Circle, 
  Clock 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionGridProps {
  className?: string;
  compact?: boolean;
  showLegend?: boolean;
}

export const QuestionGrid: React.FC<QuestionGridProps> = ({
  className,
  compact = false,
  showLegend = true
}) => {
  const {
    session,
    goToQuestion
  } = useQuizSession();

  const getQuestionStatus = (index: number) => {
    const isAnswered = session.answers[index] !== null;
    const isBookmarked = session.bookmarked[index];
    const isCurrent = index === session.currentQuestionIndex;

    if (isCurrent) return 'current';
    if (isAnswered) return 'answered';
    if (isBookmarked) return 'bookmarked';
    return 'unanswered';
  };

  const getQuestionIcon = (index: number) => {
    const status = getQuestionStatus(index);
    
    switch (status) {
      case 'current':
        return <Clock className="w-3 h-3" />;
      case 'answered':
        return <CheckCircle className="w-3 h-3" />;
      case 'bookmarked':
        return <Flag className="w-3 h-3" />;
      default:
        return <Circle className="w-3 h-3" />;
    }
  };

  const getQuestionClasses = (index: number) => {
    const status = getQuestionStatus(index);
    const baseClasses = "relative flex items-center justify-center font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1";
    
    if (compact) {
      const compactClasses = "w-8 h-8 text-xs rounded";
      
      switch (status) {
        case 'current':
          return cn(baseClasses, compactClasses, "bg-blue-500 text-white shadow-md");
        case 'answered':
          return cn(baseClasses, compactClasses, "bg-green-100 text-green-700 border border-green-300");
        case 'bookmarked':
          return cn(baseClasses, compactClasses, "bg-yellow-100 text-yellow-700 border border-yellow-300");
        default:
          return cn(baseClasses, compactClasses, "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200");
      }
    } else {
      const regularClasses = "w-10 h-10 text-sm rounded-lg";
      
      switch (status) {
        case 'current':
          return cn(baseClasses, regularClasses, "bg-blue-500 text-white shadow-lg ring-2 ring-blue-200");
        case 'answered':
          return cn(baseClasses, regularClasses, "bg-green-100 text-green-700 border-2 border-green-300");
        case 'bookmarked':
          return cn(baseClasses, regularClasses, "bg-yellow-100 text-yellow-700 border-2 border-yellow-300");
        default:
          return cn(baseClasses, regularClasses, "bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50");
      }
    }
  };

  const gridCols = compact ? 'grid-cols-8' : 'grid-cols-5 sm:grid-cols-8 lg:grid-cols-10';

  return (
    <div className={cn("space-y-4", className)}>
      {/* Question Grid */}
      <div className={cn("grid gap-2", gridCols)}>
        {session.questions.map((_, index) => {
          const status = getQuestionStatus(index);
          
          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => goToQuestion(index)}
              disabled={session.completed}
              className={getQuestionClasses(index)}
              title={`Question ${index + 1} - ${status}`}
            >
              {compact ? (
                <span>{index + 1}</span>
              ) : (
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-xs">{index + 1}</span>
                  {getQuestionIcon(index)}
                </div>
              )}
            </Button>
          );
        })}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Legend
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded flex items-center justify-center">
                <CheckCircle className="w-2 h-2 text-green-600" />
              </div>
              <span className="text-gray-600">Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center">
                <Flag className="w-2 h-2 text-yellow-600" />
              </div>
              <span className="text-gray-600">Bookmarked</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded flex items-center justify-center">
                <Clock className="w-2 h-2 text-white" />
              </div>
              <span className="text-gray-600">Current</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                <Circle className="w-2 h-2 text-gray-600" />
              </div>
              <span className="text-gray-600">Not answered</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="pt-3 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="font-medium text-gray-900">
              {session.answers.filter(a => a !== null).length}
            </div>
            <div className="text-gray-600">Answered</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {session.bookmarked.filter(Boolean).length}
            </div>
            <div className="text-gray-600">Bookmarked</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {session.questions.length - session.answers.filter(a => a !== null).length}
            </div>
            <div className="text-gray-600">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Subject-wise question grid for organized navigation
interface SubjectGridProps {
  className?: string;
}

export const SubjectGrid: React.FC<SubjectGridProps> = ({ className }) => {
  const { session, goToQuestion } = useQuizSession();

  // Group questions by subject
  const questionsBySubject = session.questions.reduce((acc, question, index) => {
    const subject = question.subject || 'General Studies';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push({ question, index });
    return acc;
  }, {} as Record<string, Array<{ question: any; index: number }>>);

  const getQuestionStatus = (index: number) => {
    const isAnswered = session.answers[index] !== null;
    const isBookmarked = session.bookmarked[index];
    const isCurrent = index === session.currentQuestionIndex;

    if (isCurrent) return 'current';
    if (isAnswered) return 'answered';
    if (isBookmarked) return 'bookmarked';
    return 'unanswered';
  };

  const getStatusClasses = (index: number) => {
    const status = getQuestionStatus(index);
    
    switch (status) {
      case 'current':
        return "bg-blue-500 text-white";
      case 'answered':
        return "bg-green-100 text-green-700 border border-green-300";
      case 'bookmarked':
        return "bg-yellow-100 text-yellow-700 border border-yellow-300";
      default:
        return "bg-gray-100 text-gray-600 border border-gray-300";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {Object.entries(questionsBySubject).map(([subject, questions]) => (
        <div key={subject} className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
            {subject}
          </h4>
          <div className="grid grid-cols-6 gap-1">
            {questions.map(({ index }) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => goToQuestion(index)}
                disabled={session.completed}
                className={cn(
                  "w-8 h-8 text-xs rounded transition-all duration-200",
                  getStatusClasses(index)
                )}
                title={`Question ${index + 1}`}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};