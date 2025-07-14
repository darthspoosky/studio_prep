'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  ChevronLeft, 
  Wifi, 
  Server, 
  Clock,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizErrorProps {
  error: string | null;
  onRetry: () => void;
  onGoBack: () => void;
  className?: string;
  errorType?: 'network' | 'server' | 'timeout' | 'unauthorized' | 'unknown';
}

export const QuizError: React.FC<QuizErrorProps> = ({
  error,
  onRetry,
  onGoBack,
  className,
  errorType = 'unknown'
}) => {
  const getErrorDetails = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: Wifi,
          title: 'Connection Problem',
          description: 'Unable to connect to our servers. Please check your internet connection.',
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'server':
        return {
          icon: Server,
          title: 'Server Error',
          description: 'Our servers are experiencing issues. Please try again in a few moments.',
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'timeout':
        return {
          icon: Clock,
          title: 'Request Timeout',
          description: 'The request took too long to complete. Please try again.',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'unauthorized':
        return {
          icon: ShieldAlert,
          title: 'Access Denied',
          description: 'You don\'t have permission to access this quiz. Please check your subscription.',
          color: 'text-purple-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      default:
        return {
          icon: AlertTriangle,
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred while loading the quiz.',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const errorDetails = getErrorDetails();
  const Icon = errorDetails.icon;

  const getSuggestions = () => {
    switch (errorType) {
      case 'network':
        return [
          'Check your internet connection',
          'Try switching to a different network',
          'Disable VPN if you\'re using one'
        ];
      case 'server':
        return [
          'Wait a few minutes and try again',
          'Clear your browser cache',
          'Try using a different browser'
        ];
      case 'timeout':
        return [
          'Check your internet speed',
          'Close other applications using bandwidth',
          'Try again with a stable connection'
        ];
      case 'unauthorized':
        return [
          'Verify your subscription status',
          'Log out and log back in',
          'Contact support if the issue persists'
        ];
      default:
        return [
          'Refresh the page',
          'Clear your browser cache',
          'Try using a different browser'
        ];
    }
  };

  return (
    <div className={cn("min-h-screen bg-gray-50 flex items-center justify-center", className)}>
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center">
          <div className={cn(
            "w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center",
            errorDetails.bgColor,
            errorDetails.borderColor,
            "border-2"
          )}>
            <Icon className={cn("w-10 h-10", errorDetails.color)} />
          </div>
          
          <CardTitle className="text-xl text-gray-900">
            {errorDetails.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              {errorDetails.description}
            </p>
            
            {error && (
              <Alert className={cn(errorDetails.bgColor, errorDetails.borderColor)}>
                <AlertDescription className="text-sm">
                  <strong>Error Details:</strong> {error}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button variant="outline" onClick={onGoBack} className="w-full">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Troubleshooting Tips */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <HelpCircle className="w-4 h-4 mr-2" />
              Troubleshooting Tips
            </h4>
            <ul className="space-y-2">
              {getSuggestions().map((suggestion, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Support */}
          <div className={cn(
            "p-4 rounded-lg border",
            "bg-blue-50 border-blue-200"
          )}>
            <div className="text-center">
              <p className="text-sm text-blue-800 mb-2">
                Still having trouble?
              </p>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Inline error component for smaller errors
interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  onRetry,
  className
}) => {
  return (
    <Alert className={cn("border-red-200 bg-red-50", className)}>
      <AlertTriangle className="h-4 w-4 text-red-500" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-red-800">{message}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="text-red-600 hover:text-red-700">
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

// Network status indicator
export const NetworkStatus: React.FC<{ isOnline: boolean; className?: string }> = ({
  isOnline,
  className
}) => {
  if (isOnline) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm z-50",
      className
    )}>
      <div className="flex items-center justify-center space-x-2">
        <Wifi className="w-4 h-4" />
        <span>No internet connection. Please check your network.</span>
      </div>
    </div>
  );
};