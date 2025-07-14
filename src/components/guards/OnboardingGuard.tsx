'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingGuardProps {
  children: ReactNode;
  requiresOnboarding?: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
}

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-muted-foreground">Loading your preparation journey...</p>
    </div>
  </div>
);

// Onboarding required component
const OnboardingRequired = ({ onStart }: { onStart: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    <div className="max-w-md text-center space-y-6 p-8">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-2">Welcome to PrepTalk!</h2>
        <p className="text-muted-foreground">
          Let's personalize your UPSC preparation journey. This quick setup will help us understand your goals and current level.
        </p>
      </div>

      <button
        onClick={onStart}
        className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        Start Setup (3-4 minutes)
      </button>
      
      <p className="text-xs text-muted-foreground">
        You can complete this later, but we recommend doing it now for the best experience.
      </p>
    </div>
  </div>
);

export function OnboardingGuard({
  children,
  requiresOnboarding = true,
  redirectTo = '/onboarding',
  fallback
}: OnboardingGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    onboardingCompleted,
    needsOnboarding,
    loading: onboardingLoading,
    error
  } = useOnboarding();

  // Redirect to onboarding if needed
  useEffect(() => {
    if (!authLoading && !onboardingLoading && user && needsOnboarding && requiresOnboarding) {
      router.push(redirectTo);
    }
  }, [user, needsOnboarding, requiresOnboarding, authLoading, onboardingLoading, router, redirectTo]);

  // Show loading while checking auth and onboarding status
  if (authLoading || onboardingLoading) {
    return <LoadingScreen />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">Error loading onboarding status</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please sign in to continue</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show onboarding required screen if needed
  if (needsOnboarding && requiresOnboarding) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <OnboardingRequired
        onStart={() => router.push(redirectTo)}
      />
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Higher-order component for onboarding guard
export function withOnboardingGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps?: Omit<OnboardingGuardProps, 'children'>
) {
  return function GuardedComponent(props: P) {
    return (
      <OnboardingGuard {...guardProps}>
        <Component {...props} />
      </OnboardingGuard>
    );
  };
}

// Hook for onboarding status
export function useOnboardingStatus() {
  const {
    onboardingCompleted,
    needsOnboarding,
    currentStage,
    progressPercentage,
    loading
  } = useOnboarding();

  return {
    isOnboardingComplete: onboardingCompleted,
    needsOnboarding,
    currentStage,
    progressPercentage,
    loading,
    
    // Helper methods
    shouldShowOnboarding: needsOnboarding,
    canAccessDashboard: onboardingCompleted,
    
    // Progress helpers
    isAssessmentComplete: progressPercentage >= 25,
    isGoalsComplete: progressPercentage >= 50,
    isExperienceComplete: progressPercentage >= 75,
    isPreferencesComplete: progressPercentage >= 100
  };
}

export default OnboardingGuard;