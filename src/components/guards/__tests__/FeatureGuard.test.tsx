import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { FeatureGuard, useFeatureAccess } from '../FeatureGuard';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageTracking } from '@/hooks/useUsageTracking';

// Mock the hooks
jest.mock('@/hooks/useSubscription');
jest.mock('@/hooks/useUsageTracking');

const mockUseSubscription = useSubscription as jest.MockedFunction<typeof useSubscription>;
const mockUseUsageTracking = useUsageTracking as jest.MockedFunction<typeof useUsageTracking>;

describe('FeatureGuard', () => {
  const mockChildren = <div data-testid="protected-content">Protected Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when user has access', async () => {
    mockUseSubscription.mockReturnValue({
      subscription: null,
      profile: null,
      loading: false,
      error: null,
      upgradeSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      refetch: jest.fn(),
      hasFeature: jest.fn(() => true),
      getDaysUntilExpiry: jest.fn(),
      isActive: false,
      isPending: false,
      isCancelled: false,
      willCancelAtPeriodEnd: false,
      currentTier: 'foundation',
      currentStage: 'prelims'
    });

    mockUseUsageTracking.mockReturnValue({
      currentUsage: null,
      summary: null,
      limits: null,
      streak: null,
      userTier: 'foundation',
      loading: false,
      error: null,
      validateToolAccess: jest.fn(),
      recordUsage: jest.fn(),
      refetch: jest.fn(),
      canUseTool: jest.fn(() => true),
      getRemainingUsage: jest.fn(() => 10),
      getUsagePercentage: jest.fn(() => 20),
      hasWarnings: false,
      shouldPromptUpgrade: false,
      isNearLimit: jest.fn(() => false)
    });

    render(
      <FeatureGuard requiredTier="foundation">
        {mockChildren}
      </FeatureGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should block access when tier requirement not met', async () => {
    mockUseSubscription.mockReturnValue({
      subscription: null,
      profile: null,
      loading: false,
      error: null,
      upgradeSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      refetch: jest.fn(),
      hasFeature: jest.fn(() => false),
      getDaysUntilExpiry: jest.fn(),
      isActive: false,
      isPending: false,
      isCancelled: false,
      willCancelAtPeriodEnd: false,
      currentTier: 'free',
      currentStage: 'prelims'
    });

    mockUseUsageTracking.mockReturnValue({
      currentUsage: null,
      summary: null,
      limits: null,
      streak: null,
      userTier: 'free',
      loading: false,
      error: null,
      validateToolAccess: jest.fn(),
      recordUsage: jest.fn(),
      refetch: jest.fn(),
      canUseTool: jest.fn(() => true),
      getRemainingUsage: jest.fn(() => 5),
      getUsagePercentage: jest.fn(() => 0),
      hasWarnings: false,
      shouldPromptUpgrade: false,
      isNearLimit: jest.fn(() => false)
    });

    render(
      <FeatureGuard requiredTier="foundation">
        {mockChildren}
      </FeatureGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Premium Feature')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should block access when usage limit reached', async () => {
    mockUseSubscription.mockReturnValue({
      subscription: null,
      profile: null,
      loading: false,
      error: null,
      upgradeSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      refetch: jest.fn(),
      hasFeature: jest.fn(() => true),
      getDaysUntilExpiry: jest.fn(),
      isActive: false,
      isPending: false,
      isCancelled: false,
      willCancelAtPeriodEnd: false,
      currentTier: 'free',
      currentStage: 'prelims'
    });

    mockUseUsageTracking.mockReturnValue({
      currentUsage: null,
      summary: null,
      limits: null,
      streak: null,
      userTier: 'free',
      loading: false,
      error: null,
      validateToolAccess: jest.fn(),
      recordUsage: jest.fn(),
      refetch: jest.fn(),
      canUseTool: jest.fn(() => false),
      getRemainingUsage: jest.fn(() => 0),
      getUsagePercentage: jest.fn(() => 100),
      hasWarnings: false,
      shouldPromptUpgrade: false,
      isNearLimit: jest.fn(() => false)
    });

    render(
      <FeatureGuard toolType="quiz">
        {mockChildren}
      </FeatureGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Daily Limit Reached')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    mockUseSubscription.mockReturnValue({
      subscription: null,
      profile: null,
      loading: true,
      error: null,
      upgradeSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      refetch: jest.fn(),
      hasFeature: jest.fn(() => true),
      getDaysUntilExpiry: jest.fn(),
      isActive: false,
      isPending: false,
      isCancelled: false,
      willCancelAtPeriodEnd: false,
      currentTier: 'free',
      currentStage: 'prelims'
    });

    mockUseUsageTracking.mockReturnValue({
      currentUsage: null,
      summary: null,
      limits: null,
      streak: null,
      userTier: 'free',
      loading: false,
      error: null,
      validateToolAccess: jest.fn(),
      recordUsage: jest.fn(),
      refetch: jest.fn(),
      canUseTool: jest.fn(() => true),
      getRemainingUsage: jest.fn(() => 5),
      getUsagePercentage: jest.fn(() => 0),
      hasWarnings: false,
      shouldPromptUpgrade: false,
      isNearLimit: jest.fn(() => false)
    });

    render(
      <FeatureGuard>
        {mockChildren}
      </FeatureGuard>
    );

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('should render custom fallback when provided', async () => {
    const customFallback = <div data-testid="custom-fallback">Custom Blocked Message</div>;

    mockUseSubscription.mockReturnValue({
      subscription: null,
      profile: null,
      loading: false,
      error: null,
      upgradeSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      refetch: jest.fn(),
      hasFeature: jest.fn(() => false),
      getDaysUntilExpiry: jest.fn(),
      isActive: false,
      isPending: false,
      isCancelled: false,
      willCancelAtPeriodEnd: false,
      currentTier: 'free',
      currentStage: 'prelims'
    });

    mockUseUsageTracking.mockReturnValue({
      currentUsage: null,
      summary: null,
      limits: null,
      streak: null,
      userTier: 'free',
      loading: false,
      error: null,
      validateToolAccess: jest.fn(),
      recordUsage: jest.fn(),
      refetch: jest.fn(),
      canUseTool: jest.fn(() => true),
      getRemainingUsage: jest.fn(() => 5),
      getUsagePercentage: jest.fn(() => 0),
      hasWarnings: false,
      shouldPromptUpgrade: false,
      isNearLimit: jest.fn(() => false)
    });

    render(
      <FeatureGuard requiredTier="foundation" fallback={customFallback}>
        {mockChildren}
      </FeatureGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });
});

describe('useFeatureAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return access granted for valid tier', () => {
    mockUseSubscription.mockReturnValue({
      subscription: null,
      profile: null,
      loading: false,
      error: null,
      upgradeSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      refetch: jest.fn(),
      hasFeature: jest.fn(() => true),
      getDaysUntilExpiry: jest.fn(),
      isActive: false,
      isPending: false,
      isCancelled: false,
      willCancelAtPeriodEnd: false,
      currentTier: 'foundation',
      currentStage: 'prelims'
    });

    mockUseUsageTracking.mockReturnValue({
      currentUsage: null,
      summary: null,
      limits: null,
      streak: null,
      userTier: 'foundation',
      loading: false,
      error: null,
      validateToolAccess: jest.fn(),
      recordUsage: jest.fn(),
      refetch: jest.fn(),
      canUseTool: jest.fn(() => true),
      getRemainingUsage: jest.fn(() => 10),
      getUsagePercentage: jest.fn(() => 20),
      hasWarnings: false,
      shouldPromptUpgrade: false,
      isNearLimit: jest.fn(() => false)
    });

    const TestComponent = () => {
      const { checkAccess } = useFeatureAccess();
      const result = checkAccess({ requiredTier: 'foundation' });
      
      return (
        <div data-testid="access-result">
          {result.allowed ? 'Access Granted' : result.message}
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByText('Access Granted')).toBeInTheDocument();
  });

  it('should return access denied for insufficient tier', () => {
    mockUseSubscription.mockReturnValue({
      subscription: null,
      profile: null,
      loading: false,
      error: null,
      upgradeSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      refetch: jest.fn(),
      hasFeature: jest.fn(() => false),
      getDaysUntilExpiry: jest.fn(),
      isActive: false,
      isPending: false,
      isCancelled: false,
      willCancelAtPeriodEnd: false,
      currentTier: 'free',
      currentStage: 'prelims'
    });

    mockUseUsageTracking.mockReturnValue({
      currentUsage: null,
      summary: null,
      limits: null,
      streak: null,
      userTier: 'free',
      loading: false,
      error: null,
      validateToolAccess: jest.fn(),
      recordUsage: jest.fn(),
      refetch: jest.fn(),
      canUseTool: jest.fn(() => true),
      getRemainingUsage: jest.fn(() => 5),
      getUsagePercentage: jest.fn(() => 0),
      hasWarnings: false,
      shouldPromptUpgrade: false,
      isNearLimit: jest.fn(() => false)
    });

    const TestComponent = () => {
      const { checkAccess } = useFeatureAccess();
      const result = checkAccess({ requiredTier: 'foundation' });
      
      return (
        <div data-testid="access-result">
          {result.allowed ? 'Access Granted' : result.message}
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByText('Requires foundation tier')).toBeInTheDocument();
  });
});