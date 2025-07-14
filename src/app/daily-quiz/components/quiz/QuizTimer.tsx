'use client';

import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizTimerProps {
  timeRemaining: number; // in seconds
  className?: string;
  onTimeUp?: () => void;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const QuizTimer: React.FC<QuizTimerProps> = ({
  timeRemaining,
  className,
  onTimeUp,
  showIcon = true,
  size = 'md'
}) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Trigger blink animation for low time
  useEffect(() => {
    if (timeRemaining <= 300 && timeRemaining > 0) { // Last 5 minutes
      const interval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsBlinking(false);
    }
  }, [timeRemaining]);

  // Call onTimeUp when time reaches 0
  useEffect(() => {
    if (timeRemaining <= 0 && onTimeUp) {
      onTimeUp();
    }
  }, [timeRemaining, onTimeUp]);

  const getTimeColor = () => {
    if (timeRemaining <= 0) return 'text-red-600';
    if (timeRemaining <= 60) return 'text-red-500'; // Last minute
    if (timeRemaining <= 300) return 'text-orange-500'; // Last 5 minutes
    if (timeRemaining <= 600) return 'text-yellow-600'; // Last 10 minutes
    return 'text-gray-700';
  };

  const getBackgroundColor = () => {
    if (timeRemaining <= 0) return 'bg-red-50 border-red-200';
    if (timeRemaining <= 60) return 'bg-red-50 border-red-200';
    if (timeRemaining <= 300) return 'bg-orange-50 border-orange-200';
    if (timeRemaining <= 600) return 'bg-yellow-50 border-yellow-200';
    return 'bg-white border-gray-200';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-3 text-lg';
      default:
        return 'px-3 py-2 text-sm';
    }
  };

  return (
    <div className={cn(
      "flex items-center space-x-2 rounded-lg border font-mono font-medium transition-all duration-300",
      getBackgroundColor(),
      getSizeClasses(),
      isBlinking && timeRemaining <= 300 && "animate-pulse",
      className
    )}>
      {showIcon && (
        <div className="flex-shrink-0">
          {timeRemaining <= 60 ? (
            <AlertTriangle className={cn(
              "animate-pulse",
              size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4',
              getTimeColor()
            )} />
          ) : (
            <Clock className={cn(
              size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4',
              getTimeColor()
            )} />
          )}
        </div>
      )}
      
      <span className={cn(
        "font-mono",
        getTimeColor(),
        timeRemaining <= 60 && "font-bold"
      )}>
        {formatTime(timeRemaining)}
      </span>

      {timeRemaining <= 300 && timeRemaining > 0 && (
        <div className={cn(
          "w-1.5 h-1.5 rounded-full animate-pulse",
          timeRemaining <= 60 ? 'bg-red-500' : 'bg-orange-500'
        )} />
      )}
    </div>
  );
};

// Progress Circle Timer for visual countdown
interface CircularTimerProps {
  timeRemaining: number;
  totalTime: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showTime?: boolean;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  timeRemaining,
  totalTime,
  size = 60,
  strokeWidth = 4,
  className,
  showTime = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.max(0, Math.min(1, timeRemaining / totalTime));
  const strokeDashoffset = circumference * (1 - progress);

  const getStrokeColor = () => {
    const percentage = (timeRemaining / totalTime) * 100;
    if (percentage <= 10) return '#ef4444'; // red-500
    if (percentage <= 25) return '#f97316'; // orange-500
    if (percentage <= 50) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

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
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      
      {showTime && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-mono text-xs font-medium",
            timeRemaining <= 60 ? "text-red-600" : "text-gray-700"
          )}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      )}
    </div>
  );
};