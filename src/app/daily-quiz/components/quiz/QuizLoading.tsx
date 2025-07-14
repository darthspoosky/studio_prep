'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Brain, Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizLoadingProps {
  quizName: string;
  className?: string;
}

export const QuizLoading: React.FC<QuizLoadingProps> = ({
  quizName,
  className
}) => {
  const loadingSteps = [
    { icon: BookOpen, text: 'Analyzing your preferences...', delay: 0 },
    { icon: Brain, text: 'Generating personalized questions...', delay: 1000 },
    { icon: Target, text: 'Calibrating difficulty level...', delay: 2000 },
    { icon: Sparkles, text: 'Finalizing your quiz experience...', delay: 3000 }
  ];

  const [currentStep, setCurrentStep] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 100);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= loadingSteps.length - 1) return prev;
        return prev + 1;
      });
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className={cn("min-h-screen bg-gray-50 flex items-center justify-center", className)}>
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-8 text-center">
          {/* Main Loading Animation */}
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-2 bg-blue-50 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Quiz Name */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Preparing Your {quizName}
          </h2>
          
          <p className="text-gray-600 mb-6">
            We're creating a personalized quiz experience just for you
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
          </div>

          {/* Loading Steps */}
          <div className="space-y-3">
            {loadingSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-all duration-300",
                    isActive && "bg-blue-50 border border-blue-200",
                    isCompleted && "opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    isActive ? "bg-blue-500 text-white" : 
                    isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                  )}>
                    {isCompleted ? (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-blue-700" : 
                    isCompleted ? "text-green-700" : "text-gray-500"
                  )}>
                    {step.text}
                  </span>
                  
                  {isActive && (
                    <div className="flex space-x-1 ml-auto">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-yellow-800 mb-1">Pro Tip</p>
                <p className="text-xs text-yellow-700">
                  Take your time to read each question carefully. There's no rush - focus on accuracy over speed.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Skeleton loading for quiz components
export const QuizSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded mt-3 animate-pulse"></div>
      </div>

      {/* Question Card Skeleton */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="flex space-x-2">
                <div className="w-20 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-5 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-full h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Skeleton */}
      <div className="flex justify-between items-center">
        <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
};