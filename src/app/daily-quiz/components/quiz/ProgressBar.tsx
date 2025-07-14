'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  gradient?: boolean;
  segmented?: boolean;
  totalSegments?: number;
  completedSegments?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  showPercentage = false,
  size = 'md',
  animated = true,
  gradient = false,
  segmented = false,
  totalSegments = 10,
  completedSegments = 0
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.max(0, Math.min(100, progress));

  const getHeightClass = () => {
    switch (size) {
      case 'sm': return 'h-1';
      case 'lg': return 'h-3';
      default: return 'h-2';
    }
  };

  const getProgressColor = () => {
    if (gradient) {
      return 'bg-gradient-to-r from-blue-500 via-purple-500 to-green-500';
    }
    
    if (normalizedProgress < 25) return 'bg-red-500';
    if (normalizedProgress < 50) return 'bg-orange-500';
    if (normalizedProgress < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (segmented) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex space-x-1">
          {Array.from({ length: totalSegments }, (_, index) => (
            <div
              key={index}
              className={cn(
                "flex-1 rounded-full transition-all duration-300",
                getHeightClass(),
                index < completedSegments 
                  ? getProgressColor()
                  : 'bg-gray-200'
              )}
            />
          ))}
        </div>
        {showPercentage && (
          <div className="flex justify-between text-xs text-gray-600">
            <span>{completedSegments}/{totalSegments}</span>
            <span>{Math.round((completedSegments / totalSegments) * 100)}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className={cn(
        "w-full bg-gray-200 rounded-full overflow-hidden",
        getHeightClass()
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            getProgressColor(),
            animated && "transition-transform"
          )}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
      
      {showPercentage && (
        <div className="flex justify-between text-xs text-gray-600">
          <span>Progress</span>
          <span>{Math.round(normalizedProgress)}%</span>
        </div>
      )}
    </div>
  );
};

// Enhanced progress bar with additional info
interface DetailedProgressBarProps {
  current: number;
  total: number;
  answered: number;
  bookmarked?: number;
  className?: string;
  showStats?: boolean;
}

export const DetailedProgressBar: React.FC<DetailedProgressBarProps> = ({
  current,
  total,
  answered,
  bookmarked = 0,
  className,
  showStats = true
}) => {
  const progress = (current / total) * 100;
  const answeredPercentage = (answered / total) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Main Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          {/* Total progress background */}
          <div
            className="h-full bg-blue-200 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
          {/* Answered questions overlay */}
          <div
            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${answeredPercentage}%` }}
          />
        </div>
        
        {/* Current position indicator */}
        <div
          className="absolute top-0 w-0.5 h-2 bg-blue-600 transition-all duration-300"
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* Stats */}
      {showStats && (
        <div className="flex justify-between items-center text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Question {current} of {total}</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{answered} answered</span>
            </div>
            {bookmarked > 0 && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{bookmarked} bookmarked</span>
              </div>
            )}
          </div>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
};

// Circular progress component
interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
  color?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  showPercentage = true,
  color = '#3b82f6'
}) => {
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-700">
            {Math.round(normalizedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};