import { renderHook, waitFor } from '@testing-library/react';
import { useSubscription } from '../useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useRazorpayPayment } from '@/lib/payment/razorpay';
import { useToast } from '@/hooks/use-toast';

// Mock the dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/payment/razorpay');
jest.mock('@/hooks/use-toast');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRazorpayPayment = useRazorpayPayment as jest.MockedFunction<typeof useRazorpayPayment>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

// Mock fetch
global.fetch = jest.fn();

describe('useSubscription', () => {
  const mockToast = jest.fn();
  const mockInitiatePayment = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseToast.mockReturnValue({
      toast: mockToast
    });

    mockUseRazorpayPayment.mockReturnValue({
      initiatePayment: mockInitiatePayment,
      loading: false,
      error: null
    });

    (global.fetch as jest.Mock).mockClear();
  });

  it('should fetch subscription data on mount', async () => {
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    const mockSubscriptionData = {
      subscription: {
        tier: 'foundation',
        status: 'active',
        currentPeriodStart: '2024-01-01',
        currentPeriodEnd: '2024-02-01',
        cancelAtPeriodEnd: false,
        billingCycle: 'monthly',
        amount: 99,
        currency: 'INR'
      },
      profile: {
        currentTier: 'foundation',
        subscriptionStatus: 'active',
        currentStage: 'prelims',
        onboardingCompleted: true
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockSubscriptionData)
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.subscription).toEqual(mockSubscriptionData.subscription);
    expect(result.current.profile).toEqual(mockSubscriptionData.profile);
    expect(result.current.currentTier).toBe('foundation');
    expect(result.current.isActive).toBe(true);
  });

  it('should handle upgrade subscription for free tier', async () => {
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    // Mock initial fetch
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          subscription: null,
          profile: { currentTier: 'free' }
        })
      })
      // Mock upgrade API call
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          message: 'Subscription updated'
        })
      })
      // Mock refetch after upgrade
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          subscription: null,
          profile: { currentTier: 'free' }
        })
      });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const upgradeResult = await result.current.upgradeSubscription('free');

    expect(upgradeResult.success).toBe(true);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Subscription Updated",
      description: "Subscription updated"
    });
  });

  it('should handle upgrade subscription for paid tier', async () => {
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    // Mock successful payment
    mockInitiatePayment.mockResolvedValue({
      success: true
    });

    // Mock initial fetch and refetch
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          subscription: null,
          profile: { currentTier: 'free' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          subscription: { tier: 'foundation' },
          profile: { currentTier: 'foundation' }
        })
      });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const upgradeResult = await result.current.upgradeSubscription('foundation');

    expect(mockInitiatePayment).toHaveBeenCalledWith(
      'foundation',
      'monthly',
      'test-user-123',
      'test@example.com'
    );
    expect(upgradeResult.success).toBe(true);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Subscription Upgraded!",
      description: "Successfully upgraded to foundation plan"
    });
  });

  it('should handle payment failure', async () => {
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    // Mock failed payment
    mockInitiatePayment.mockResolvedValue({
      success: false,
      error: 'Payment failed'
    });

    // Mock initial fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        subscription: null,
        profile: { currentTier: 'free' }
      })
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const upgradeResult = await result.current.upgradeSubscription('foundation');

    expect(upgradeResult.success).toBe(false);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Payment Failed",
      description: "Payment failed",
      variant: "destructive"
    });
  });

  it('should cancel subscription', async () => {
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    // Mock initial fetch, cancel API, and refetch
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          subscription: { tier: 'foundation', status: 'active' },
          profile: { currentTier: 'foundation' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          message: 'Subscription cancelled'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          subscription: { tier: 'foundation', status: 'cancelled' },
          profile: { currentTier: 'foundation' }
        })
      });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const cancelResult = await result.current.cancelSubscription();

    expect(cancelResult.success).toBe(true);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Subscription Cancelled",
      description: "Subscription cancelled"
    });
  });

  it('should check feature availability', async () => {
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        subscription: null,
        profile: { currentTier: 'foundation' }
      })
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Test feature availability for foundation tier
    expect(result.current.hasFeature('basic-quiz')).toBe(true);
    expect(result.current.hasFeature('unlimited-quiz')).toBe(true);
    expect(result.current.hasFeature('human-coaching')).toBe(false);
  });

  it('should calculate days until expiry', async () => {
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    // Set expiry date to 5 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 5);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        subscription: {
          status: 'active',
          currentPeriodEnd: expiryDate.toISOString()
        },
        profile: { currentTier: 'foundation' }
      })
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const daysUntilExpiry = result.current.getDaysUntilExpiry();
    expect(daysUntilExpiry).toBe(5);
  });

  it('should handle unauthenticated user', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('User not authenticated');
    expect(result.current.subscription).toBeNull();
    expect(result.current.profile).toBeNull();
  });
});