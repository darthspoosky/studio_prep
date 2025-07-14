import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionTier, UserStage } from '@/lib/subscription-tiers';
import { useRazorpayPayment } from '@/lib/payment/razorpay';
import { useToast } from '@/hooks/use-toast';

// Types
interface UserSubscription {
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'none';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
}

interface UserProfile {
  currentTier: SubscriptionTier;
  subscriptionStatus: 'active' | 'cancelled' | 'expired' | 'past_due' | 'none';
  currentStage: UserStage;
  onboardingCompleted: boolean;
}

interface SubscriptionData {
  subscription: UserSubscription | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

// Main subscription hook
export function useSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { initiatePayment } = useRazorpayPayment();
  
  const [data, setData] = useState<SubscriptionData>({
    subscription: null,
    profile: null,
    loading: true,
    error: null
  });

  // Fetch subscription data
  const fetchSubscriptionData = useCallback(async () => {
    if (!user) {
      setData(prev => ({ ...prev, loading: false, error: 'User not authenticated' }));
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const token = await user.getIdToken();
      const response = await fetch('/api/subscription/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      setData({
        subscription: result.subscription,
        profile: result.profile,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch subscription data'
      }));
    }
  }, [user]);

  // Upgrade subscription
  const upgradeSubscription = useCallback(async (
    targetTier: SubscriptionTier,
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      // For free tier, just update without payment
      if (targetTier === 'free') {
        const token = await user.getIdToken();
        const response = await fetch('/api/subscription/upgrade', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            targetTier,
            billingCycle
          })
        });

        const result = await response.json();
        
        if (result.success) {
          await fetchSubscriptionData(); // Refresh data
          toast({
            title: "Subscription Updated",
            description: result.message
          });
        }

        return result;
      }

      // For paid tiers, initiate payment
      const paymentResult = await initiatePayment(
        targetTier,
        billingCycle,
        user.uid,
        user.email || ''
      );

      if (paymentResult.success) {
        await fetchSubscriptionData(); // Refresh data
        toast({
          title: "Subscription Upgraded!",
          description: `Successfully upgraded to ${targetTier} plan`
        });
        
        return { success: true, message: 'Subscription upgraded successfully' };
      } else {
        toast({
          title: "Payment Failed",
          description: paymentResult.error || 'Payment could not be processed',
          variant: "destructive"
        });
        
        return { success: false, message: paymentResult.error };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upgrade failed';
      toast({
        title: "Upgrade Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { success: false, message: errorMessage };
    }
  }, [user, initiatePayment, fetchSubscriptionData, toast]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (
    cancelAtPeriodEnd: boolean = true
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cancelAtPeriodEnd })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchSubscriptionData(); // Refresh data
        toast({
          title: "Subscription Cancelled",
          description: result.message
        });
      } else {
        toast({
          title: "Cancellation Failed",
          description: result.message,
          variant: "destructive"
        });
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cancellation failed';
      toast({
        title: "Cancellation Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { success: false, message: errorMessage };
    }
  }, [user, fetchSubscriptionData, toast]);

  // Check if feature is available
  const hasFeature = useCallback((feature: string): boolean => {
    if (!data.profile) return false;
    
    // Import subscription tiers to check features
    // This is a simplified check - in reality, you'd import and use the actual feature checking logic
    const tier = data.profile.currentTier;
    
    // Basic feature availability based on tier
    const featureMap: Record<SubscriptionTier, string[]> = {
      free: ['basic-quiz', 'basic-current-affairs'],
      foundation: ['basic-quiz', 'unlimited-quiz', 'current-affairs', 'analytics'],
      practice: ['basic-quiz', 'unlimited-quiz', 'current-affairs', 'analytics', 'mock-tests'],
      mains: ['basic-quiz', 'unlimited-quiz', 'current-affairs', 'analytics', 'mock-tests', 'writing-practice'],
      interview: ['basic-quiz', 'unlimited-quiz', 'current-affairs', 'analytics', 'mock-tests', 'writing-practice', 'interview-practice'],
      elite: ['basic-quiz', 'unlimited-quiz', 'current-affairs', 'analytics', 'mock-tests', 'writing-practice', 'interview-practice', 'human-coaching']
    };

    return featureMap[tier]?.includes(feature) || false;
  }, [data.profile]);

  // Get days until subscription expires
  const getDaysUntilExpiry = useCallback((): number | null => {
    if (!data.subscription || data.subscription.status !== 'active') {
      return null;
    }

    const expiryDate = new Date(data.subscription.currentPeriodEnd);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }, [data.subscription]);

  // Initial data fetch
  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  return {
    // Data
    subscription: data.subscription,
    profile: data.profile,
    loading: data.loading,
    error: data.error,
    
    // Actions
    upgradeSubscription,
    cancelSubscription,
    refetch: fetchSubscriptionData,
    
    // Utilities
    hasFeature,
    getDaysUntilExpiry,
    
    // Computed properties
    isActive: data.subscription?.status === 'active',
    isPending: data.subscription?.status === 'past_due',
    isCancelled: data.subscription?.status === 'cancelled',
    willCancelAtPeriodEnd: data.subscription?.cancelAtPeriodEnd || false,
    currentTier: data.profile?.currentTier || 'free',
    currentStage: data.profile?.currentStage || 'assessment'
  };
}

export default useSubscription;