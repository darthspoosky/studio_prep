import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionTier, UserStage } from '@/lib/subscription-tiers';
import { useToast } from '@/hooks/use-toast';

// Types
interface OnboardingData {
  completed: boolean;
  currentStep: string;
  assessmentAnswers: Record<string, string>;
  determinedStage: UserStage;
  goals: Record<string, string>;
  experience: Record<string, string>;
  preferences: Record<string, string | string[]>;
  recommendedTier: SubscriptionTier;
}

interface OnboardingState {
  data: OnboardingData | null;
  onboardingCompleted: boolean;
  currentStage: UserStage;
  currentTier: SubscriptionTier;
  loading: boolean;
  error: string | null;
}

// Assessment questions weight mapping
const ASSESSMENT_WEIGHTS = {
  upsc_knowledge: {
    beginner: 1,
    basic: 2,
    intermediate: 3,
    advanced: 4
  },
  preparation_time: {
    not_started: 1,
    few_months: 2,
    one_year: 3,
    multiple_years: 4
  },
  current_focus: {
    foundation: 1,
    prelims: 2,
    mains: 3,
    interview: 4
  },
  mock_tests: {
    none: 1,
    few: 2,
    regular: 3,
    extensive: 4
  }
};

// Onboarding hook
export function useOnboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<OnboardingState>({
    data: null,
    onboardingCompleted: false,
    currentStage: 'assessment',
    currentTier: 'free',
    loading: true,
    error: null
  });

  // Fetch onboarding data
  const fetchOnboardingData = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false, error: 'User not authenticated' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const token = await user.getIdToken();
      const response = await fetch('/api/onboarding', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      setState({
        data: result.onboarding,
        onboardingCompleted: result.onboardingCompleted,
        currentStage: result.currentStage,
        currentTier: result.currentTier,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching onboarding data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch onboarding data'
      }));
    }
  }, [user]);

  // Save onboarding step
  const saveOnboardingStep = useCallback(async (
    step: string,
    data: Record<string, any>,
    completed: boolean = false
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          step,
          data,
          completed
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update local state
      setState(prev => ({
        ...prev,
        data: prev.data ? { ...prev.data, currentStep: step, ...data } : null
      }));

      return { success: true, message: result.message };

    } catch (error) {
      console.error('Error saving onboarding step:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save onboarding step';
      
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, message: errorMessage };
    }
  }, [user, toast]);

  // Calculate user stage from assessment answers
  const calculateUserStage = useCallback((answers: Record<string, string>): UserStage => {
    let totalWeight = 0;
    let answerCount = 0;

    Object.entries(answers).forEach(([questionId, answer]) => {
      const weights = ASSESSMENT_WEIGHTS[questionId as keyof typeof ASSESSMENT_WEIGHTS];
      if (weights && weights[answer as keyof typeof weights]) {
        totalWeight += weights[answer as keyof typeof weights];
        answerCount++;
      }
    });

    if (answerCount === 0) return 'assessment';

    const averageWeight = totalWeight / answerCount;

    if (averageWeight <= 1.5) return 'prelims';
    if (averageWeight <= 2.5) return 'prelims';
    if (averageWeight <= 3.5) return 'mains';
    return 'interview';
  }, []);

  // Get recommended tier based on stage
  const getRecommendedTier = useCallback((stage: UserStage): SubscriptionTier => {
    switch (stage) {
      case 'assessment':
      case 'prelims':
        return 'foundation';
      case 'mains':
        return 'mains';
      case 'interview':
        return 'interview';
      default:
        return 'foundation';
    }
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(async (
    finalData: {
      assessmentAnswers: Record<string, string>;
      goals: Record<string, string>;
      experience: Record<string, string>;
      preferences: Record<string, string | string[]>;
    }
  ): Promise<{ success: boolean; message?: string; determinedStage?: UserStage; recommendedTier?: SubscriptionTier }> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      // Calculate stage and recommended tier
      const determinedStage = calculateUserStage(finalData.assessmentAnswers);
      const recommendedTier = getRecommendedTier(determinedStage);

      const token = await user.getIdToken();
      const response = await fetch('/api/onboarding', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...finalData,
          determinedStage,
          recommendedTier
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update local state
      setState(prev => ({
        ...prev,
        onboardingCompleted: true,
        currentStage: determinedStage,
        data: prev.data ? { 
          ...prev.data, 
          completed: true,
          determinedStage,
          recommendedTier,
          ...finalData
        } : null
      }));

      toast({
        title: "Onboarding Complete!",
        description: `Your preparation journey is now personalized for ${determinedStage} stage`,
      });

      return { 
        success: true, 
        message: result.message,
        determinedStage,
        recommendedTier
      };

    } catch (error) {
      console.error('Error completing onboarding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete onboarding';
      
      toast({
        title: "Completion Failed",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, message: errorMessage };
    }
  }, [user, calculateUserStage, getRecommendedTier, toast]);

  // Reset onboarding (for testing or re-onboarding)
  const resetOnboarding = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      // This would require a backend endpoint to reset onboarding
      // For now, just clear local state
      setState(prev => ({
        ...prev,
        data: null,
        onboardingCompleted: false,
        currentStage: 'assessment'
      }));

      toast({
        title: "Onboarding Reset",
        description: "You can now go through the onboarding process again",
      });

      return { success: true, message: 'Onboarding reset successfully' };

    } catch (error) {
      console.error('Error resetting onboarding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset onboarding';
      
      return { success: false, message: errorMessage };
    }
  }, [user, toast]);

  // Check if onboarding step is completed
  const isStepCompleted = useCallback((step: string): boolean => {
    if (!state.data) return false;
    
    switch (step) {
      case 'assessment':
        return Object.keys(state.data.assessmentAnswers || {}).length >= 4;
      case 'goals':
        return Object.keys(state.data.goals || {}).length >= 1;
      case 'experience':
        return Object.keys(state.data.experience || {}).length >= 2;
      case 'preferences':
        return Object.keys(state.data.preferences || {}).length >= 2;
      default:
        return false;
    }
  }, [state.data]);

  // Get onboarding progress percentage
  const getProgressPercentage = useCallback((): number => {
    if (!state.data) return 0;
    
    const steps = ['assessment', 'goals', 'experience', 'preferences'];
    const completedSteps = steps.filter(step => isStepCompleted(step)).length;
    
    return (completedSteps / steps.length) * 100;
  }, [state.data, isStepCompleted]);

  // Initial data fetch
  useEffect(() => {
    fetchOnboardingData();
  }, [fetchOnboardingData]);

  return {
    // State
    data: state.data,
    onboardingCompleted: state.onboardingCompleted,
    currentStage: state.currentStage,
    currentTier: state.currentTier,
    loading: state.loading,
    error: state.error,
    
    // Actions
    saveOnboardingStep,
    completeOnboarding,
    resetOnboarding,
    refetch: fetchOnboardingData,
    
    // Utilities
    calculateUserStage,
    getRecommendedTier,
    isStepCompleted,
    getProgressPercentage,
    
    // Computed properties
    needsOnboarding: !state.onboardingCompleted,
    currentStep: state.data?.currentStep || 'welcome',
    progressPercentage: getProgressPercentage()
  };
}

export default useOnboarding;