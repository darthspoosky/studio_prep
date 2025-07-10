'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EnhancedCard } from '@/components/ui/enhanced-card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Here you would integrate with your error tracking service
    // e.g., Sentry, LogRocket, Bugsnag, etc.
    console.error('Reported error:', { error, errorInfo });
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo || undefined}
        />
      );
    }

    return this.props.children;
  }
}

// Default Error Fallback Component
function DefaultErrorFallback({ error, resetError, errorInfo }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <EnhancedCard className="max-w-2xl w-full p-8 text-center">
        <div className="space-y-6">
          {/* Error Icon */}
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          
          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Oops! Something went wrong
            </h1>
            <p className="text-muted-foreground">
              We've encountered an unexpected error. Our team has been notified and is working on a fix.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={resetError} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>

          {/* Contact Support */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              If this problem persists, please contact our support team
            </p>
            <Button variant="ghost" size="sm" asChild>
              <a href="mailto:support@preptalk.com" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Support
              </a>
            </Button>
          </div>

          {/* Error Details (Development Only) */}
          {isDevelopment && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                Error Details (Development)
              </summary>
              <div className="mt-4 p-4 bg-muted rounded-md text-xs overflow-auto">
                <div className="space-y-2">
                  <div>
                    <strong>Error:</strong>
                    <pre className="mt-1 whitespace-pre-wrap break-all">
                      {error.message}
                    </pre>
                  </div>
                  
                  {error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-all">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-all">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </details>
          )}
        </div>
      </EnhancedCard>
    </div>
  );
}

// Specialized Error Fallbacks
export function NetworkErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="text-center space-y-4 p-6">
      <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold">Network Error</h2>
        <p className="text-muted-foreground mt-2">
          Please check your internet connection and try again.
        </p>
      </div>
      
      <Button onClick={resetError}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}

export function ChunkLoadErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="text-center space-y-4 p-6">
      <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-blue-500" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold">Update Available</h2>
        <p className="text-muted-foreground mt-2">
          A new version is available. Please reload the page to get the latest features.
        </p>
      </div>
      
      <Button onClick={() => window.location.reload()}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Reload Page
      </Button>
    </div>
  );
}

// Higher-Order Component for Error Boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for manual error reporting
export function useErrorReporting() {
  const reportError = React.useCallback((error: Error, context?: string) => {
    console.error('Manual error report:', { error, context });
    
    // In production, you would send this to your error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { tags: { context } });
    }
  }, []);

  return { reportError };
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();
  
  static mark(name: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.performance.mark(name);
      this.marks.set(name, Date.now());
    }
  }
  
  static measure(name: string, startMark: string, endMark?: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        window.performance.measure(name, startMark, endMark);
        
        const measure = window.performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
          console.log(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
          return measure.duration;
        }
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
    
    // Fallback for environments without performance API
    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : Date.now();
    
    if (startTime && endTime) {
      const duration = endTime - startTime;
      console.log(`Performance: ${name} took ${duration}ms`);
      return duration;
    }
    
    return 0;
  }
  
  static clearMarks() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.performance.clearMarks();
    }
    this.marks.clear();
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor(name: string) {
  React.useEffect(() => {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    PerformanceMonitor.mark(startMark);
    
    return () => {
      PerformanceMonitor.mark(endMark);
      PerformanceMonitor.measure(name, startMark, endMark);
    };
  }, [name]);
}