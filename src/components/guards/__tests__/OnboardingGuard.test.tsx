import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { OnboardingGuard, useOnboardingStatus } from '../OnboardingGuard';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock the hooks
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useOnboarding');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseOnboarding = useOnboarding as jest.MockedFunction<typeof useOnboarding>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('OnboardingGuard', () => {
  const mockPush = jest.fn();
  const mockChildren = <div data-testid="protected-content">Protected Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn()
    } as any);
  });

  it('should render children when onboarding is completed', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user' } as any,
      loading: false
    });

    mockUseOnboarding.mockReturnValue({
      data: null,
      onboardingCompleted: true,
      currentStage: 'prelims',
      currentTier: 'free',
      loading: false,
      error: null,
      saveOnboardingStep: jest.fn(),
      completeOnboarding: jest.fn(),
      resetOnboarding: jest.fn(),
      refetch: jest.fn(),
      calculateUserStage: jest.fn(),
      getRecommendedTier: jest.fn(),
      isStepCompleted: jest.fn(),
      getProgressPercentage: jest.fn(),
      needsOnboarding: false,
      currentStep: 'completion',
      progressPercentage: 100
    });

    render(
      <OnboardingGuard>
        {mockChildren}
      </OnboardingGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should show onboarding required screen when not completed', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user' } as any,
      loading: false
    });

    mockUseOnboarding.mockReturnValue({
      data: null,
      onboardingCompleted: false,
      currentStage: 'assessment',
      currentTier: 'free',
      loading: false,
      error: null,
      saveOnboardingStep: jest.fn(),
      completeOnboarding: jest.fn(),
      resetOnboarding: jest.fn(),
      refetch: jest.fn(),
      calculateUserStage: jest.fn(),
      getRecommendedTier: jest.fn(),
      isStepCompleted: jest.fn(),
      getProgressPercentage: jest.fn(),
      needsOnboarding: true,
      currentStep: 'welcome',
      progressPercentage: 0
    });

    render(
      <OnboardingGuard>
        {mockChildren}
      </OnboardingGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to PrepTalk!')).toBeInTheDocument();
      expect(screen.getByText('Start Setup (3-4 minutes)')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should redirect to onboarding when needed', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user' } as any,
      loading: false
    });

    mockUseOnboarding.mockReturnValue({
      data: null,
      onboardingCompleted: false,
      currentStage: 'assessment',
      currentTier: 'free',
      loading: false,
      error: null,
      saveOnboardingStep: jest.fn(),
      completeOnboarding: jest.fn(),
      resetOnboarding: jest.fn(),
      refetch: jest.fn(),
      calculateUserStage: jest.fn(),
      getRecommendedTier: jest.fn(),
      isStepCompleted: jest.fn(),
      getProgressPercentage: jest.fn(),
      needsOnboarding: true,
      currentStep: 'welcome',
      progressPercentage: 0
    });

    render(
      <OnboardingGuard requiresOnboarding={true}>
        {mockChildren}
      </OnboardingGuard>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('should show loading state', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user' } as any,
      loading: true
    });

    mockUseOnboarding.mockReturnValue({
      data: null,
      onboardingCompleted: false,
      currentStage: 'assessment',
      currentTier: 'free',
      loading: true,
      error: null,
      saveOnboardingStep: jest.fn(),
      completeOnboarding: jest.fn(),
      resetOnboarding: jest.fn(),
      refetch: jest.fn(),
      calculateUserStage: jest.fn(),
      getRecommendedTier: jest.fn(),
      isStepCompleted: jest.fn(),
      getProgressPercentage: jest.fn(),
      needsOnboarding: false,
      currentStep: 'welcome',
      progressPercentage: 0
    });

    render(
      <OnboardingGuard>
        {mockChildren}
      </OnboardingGuard>
    );

    expect(screen.getByText('Loading your preparation journey...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user' } as any,
      loading: false
    });

    mockUseOnboarding.mockReturnValue({
      data: null,
      onboardingCompleted: false,
      currentStage: 'assessment',
      currentTier: 'free',
      loading: false,
      error: 'Failed to load onboarding data',
      saveOnboardingStep: jest.fn(),
      completeOnboarding: jest.fn(),
      resetOnboarding: jest.fn(),
      refetch: jest.fn(),
      calculateUserStage: jest.fn(),
      getRecommendedTier: jest.fn(),
      isStepCompleted: jest.fn(),
      getProgressPercentage: jest.fn(),
      needsOnboarding: false,
      currentStep: 'welcome',
      progressPercentage: 0
    });

    render(
      <OnboardingGuard>
        {mockChildren}
      </OnboardingGuard>
    );

    expect(screen.getByText('Error loading onboarding status')).toBeInTheDocument();
  });

  it('should show sign in prompt when user not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    });

    mockUseOnboarding.mockReturnValue({
      data: null,
      onboardingCompleted: false,
      currentStage: 'assessment',
      currentTier: 'free',
      loading: false,
      error: null,
      saveOnboardingStep: jest.fn(),
      completeOnboarding: jest.fn(),
      resetOnboarding: jest.fn(),
      refetch: jest.fn(),
      calculateUserStage: jest.fn(),
      getRecommendedTier: jest.fn(),
      isStepCompleted: jest.fn(),
      getProgressPercentage: jest.fn(),
      needsOnboarding: false,
      currentStep: 'welcome',
      progressPercentage: 0
    });

    render(
      <OnboardingGuard>
        {mockChildren}
      </OnboardingGuard>
    );

    expect(screen.getByText('Please sign in to continue')).toBeInTheDocument();
  });

  it('should render custom fallback when provided', async () => {
    const customFallback = <div data-testid="custom-fallback">Custom Onboarding Message</div>;

    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user' } as any,
      loading: false
    });

    mockUseOnboarding.mockReturnValue({
      data: null,
      onboardingCompleted: false,
      currentStage: 'assessment',
      currentTier: 'free',
      loading: false,
      error: null,
      saveOnboardingStep: jest.fn(),
      completeOnboarding: jest.fn(),
      resetOnboarding: jest.fn(),
      refetch: jest.fn(),
      calculateUserStage: jest.fn(),
      getRecommendedTier: jest.fn(),
      isStepCompleted: jest.fn(),
      getProgressPercentage: jest.fn(),
      needsOnboarding: true,
      currentStep: 'welcome',
      progressPercentage: 0
    });

    render(
      <OnboardingGuard fallback={customFallback}>
        {mockChildren}
      </OnboardingGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });
});

describe('useOnboardingStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct onboarding status', () => {
    mockUseOnboarding.mockReturnValue({
      data: null,
      onboardingCompleted: true,
      currentStage: 'prelims',
      currentTier: 'foundation',
      loading: false,
      error: null,
      saveOnboardingStep: jest.fn(),
      completeOnboarding: jest.fn(),
      resetOnboarding: jest.fn(),
      refetch: jest.fn(),
      calculateUserStage: jest.fn(),
      getRecommendedTier: jest.fn(),
      isStepCompleted: jest.fn(),
      getProgressPercentage: jest.fn(() => 100),
      needsOnboarding: false,
      currentStep: 'completion',
      progressPercentage: 100
    });

    const TestComponent = () => {
      const status = useOnboardingStatus();
      
      return (
        <div>
          <div data-testid="is-complete">{status.isOnboardingComplete.toString()}</div>
          <div data-testid="can-access-dashboard">{status.canAccessDashboard.toString()}</div>
          <div data-testid="progress">{status.progressPercentage}</div>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('is-complete')).toHaveTextContent('true');
    expect(screen.getByTestId('can-access-dashboard')).toHaveTextContent('true');
    expect(screen.getByTestId('progress')).toHaveTextContent('100');
  });
});