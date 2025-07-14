import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ToolType } from '@/services/usageTrackingService';
import { SubscriptionTier } from '@/lib/subscription-tiers';
import { useToast } from '@/hooks/use-toast';

// Types
interface UsageData {
  dailyQuizQuestions: number;
  currentAffairsAnalysis: number;
  writingAnswers: number;
  interviewSessions: number;
  totalQuizQuestions: number;
  totalAnalysis: number;
  totalAnswers: number;
  totalInterviews: number;
}

interface UsageSummary {
  totalDays: number;
  averageQuizQuestions: number;
  averageAnalysis: number;
  averageAnswers: number;
  averageInterviews: number;
  dailyBreakdown: UsageData[];
}

interface UsageLimits {
  warnings: string[];
  suggestions: string[];
  shouldPromptUpgrade: boolean;
}

interface UsageStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

interface ValidationResult {
  allowed: boolean;
  remaining: number;
  message?: string;
  requiresUpgrade?: boolean;
}

interface UsageTrackingState {
  currentUsage: UsageData | null;
  summary: UsageSummary | null;
  limits: UsageLimits | null;
  streak: UsageStreak | null;
  userTier: SubscriptionTier;
  loading: boolean;
  error: string | null;
}

// Usage tracking hook
export function useUsageTracking(autoRefresh: boolean = true) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<UsageTrackingState>({
    currentUsage: null,
    summary: null,
    limits: null,
    streak: null,
    userTier: 'free',
    loading: true,
    error: null
  });

  // Fetch usage data
  const fetchUsageData = useCallback(async (days: number = 7) => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false, error: 'User not authenticated' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const token = await user.getIdToken();
      const response = await fetch(`/api/subscription/usage?days=${days}`, {
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
        currentUsage: result.currentUsage,
        summary: result.summary,
        limits: result.limits,
        streak: result.streak,
        userTier: result.userTier,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching usage data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch usage data'
      }));
    }
  }, [user]);

  // Validate tool access
  const validateToolAccess = useCallback(async (
    toolType: ToolType
  ): Promise<ValidationResult> => {
    if (!user) {
      return { allowed: false, remaining: 0, message: 'User not authenticated' };
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/subscription/usage/validate', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ toolType })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        allowed: result.allowed,
        remaining: result.remaining,
        message: result.message,
        requiresUpgrade: result.requiresUpgrade
      };

    } catch (error) {
      console.error('Error validating tool access:', error);
      return {
        allowed: false,
        remaining: 0,
        message: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }, [user]);

  // Record usage
  const recordUsage = useCallback(async (
    toolType: ToolType,
    amount: number = 1
  ): Promise<{ success: boolean; remaining: number; message?: string }> => {
    if (!user) {
      return { success: false, remaining: 0, message: 'User not authenticated' };
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/subscription/usage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ toolType, amount })
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle usage limit reached
        if (response.status === 403) {
          toast({
            title: "Usage Limit Reached",
            description: result.message || 'Daily limit exceeded',
            variant: "destructive"
          });
        }
        return {
          success: false,
          remaining: result.remaining || 0,
          message: result.message
        };
      }

      // Refresh usage data after successful recording
      if (autoRefresh) {
        fetchUsageData();
      }

      return {
        success: true,
        remaining: result.remaining,
        message: result.message
      };

    } catch (error) {
      console.error('Error recording usage:', error);
      const message = error instanceof Error ? error.message : 'Failed to record usage';
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });

      return { success: false, remaining: 0, message };
    }
  }, [user, fetchUsageData, autoRefresh, toast]);

  // Check if user can use a tool
  const canUseTool = useCallback((toolType: ToolType): boolean => {
    if (!state.currentUsage) return false;

    // This is a simplified check - the actual validation should be done server-side
    // But we can provide quick client-side feedback
    const usage = state.currentUsage;
    const tier = state.userTier;

    // Basic limits based on tier (should match server-side logic)
    const limits = {
      free: { quiz: 5, currentAffairs: 2, writing: 0, interview: 0 },
      foundation: { quiz: 25, currentAffairs: 5, writing: 0, interview: 0 },
      practice: { quiz: -1, currentAffairs: 10, writing: 0, interview: 0 },
      mains: { quiz: -1, currentAffairs: -1, writing: 10, interview: 0 },
      interview: { quiz: -1, currentAffairs: -1, writing: -1, interview: 5 },
      elite: { quiz: -1, currentAffairs: -1, writing: -1, interview: -1 }
    };

    const tierLimits = limits[tier];
    if (!tierLimits) return false;

    switch (toolType) {
      case 'quiz':
        return tierLimits.quiz === -1 || usage.dailyQuizQuestions < tierLimits.quiz;
      case 'currentAffairs':
        return tierLimits.currentAffairs === -1 || usage.currentAffairsAnalysis < tierLimits.currentAffairs;
      case 'writing':
        return tierLimits.writing === -1 || usage.writingAnswers < tierLimits.writing;
      case 'interview':
        return tierLimits.interview === -1 || usage.interviewSessions < tierLimits.interview;
      default:
        return false;
    }
  }, [state.currentUsage, state.userTier]);

  // Get remaining usage for a tool
  const getRemainingUsage = useCallback((toolType: ToolType): number => {
    if (!state.currentUsage) return 0;

    const usage = state.currentUsage;
    const tier = state.userTier;

    // Basic limits (should match server-side logic)
    const limits = {
      free: { quiz: 5, currentAffairs: 2, writing: 0, interview: 0 },
      foundation: { quiz: 25, currentAffairs: 5, writing: 0, interview: 0 },
      practice: { quiz: -1, currentAffairs: 10, writing: 0, interview: 0 },
      mains: { quiz: -1, currentAffairs: -1, writing: 10, interview: 0 },
      interview: { quiz: -1, currentAffairs: -1, writing: -1, interview: 5 },
      elite: { quiz: -1, currentAffairs: -1, writing: -1, interview: -1 }
    };

    const tierLimits = limits[tier];
    if (!tierLimits) return 0;

    switch (toolType) {
      case 'quiz':
        return tierLimits.quiz === -1 ? -1 : Math.max(0, tierLimits.quiz - usage.dailyQuizQuestions);
      case 'currentAffairs':
        return tierLimits.currentAffairs === -1 ? -1 : Math.max(0, tierLimits.currentAffairs - usage.currentAffairsAnalysis);
      case 'writing':
        return tierLimits.writing === -1 ? -1 : Math.max(0, tierLimits.writing - usage.writingAnswers);
      case 'interview':
        return tierLimits.interview === -1 ? -1 : Math.max(0, tierLimits.interview - usage.interviewSessions);
      default:
        return 0;
    }
  }, [state.currentUsage, state.userTier]);

  // Get usage percentage for a tool
  const getUsagePercentage = useCallback((toolType: ToolType): number => {
    if (!state.currentUsage) return 0;

    const usage = state.currentUsage;
    const tier = state.userTier;

    const limits = {
      free: { quiz: 5, currentAffairs: 2, writing: 0, interview: 0 },
      foundation: { quiz: 25, currentAffairs: 5, writing: 0, interview: 0 },
      practice: { quiz: -1, currentAffairs: 10, writing: 0, interview: 0 },
      mains: { quiz: -1, currentAffairs: -1, writing: 10, interview: 0 },
      interview: { quiz: -1, currentAffairs: -1, writing: -1, interview: 5 },
      elite: { quiz: -1, currentAffairs: -1, writing: -1, interview: -1 }
    };

    const tierLimits = limits[tier];
    if (!tierLimits) return 0;

    switch (toolType) {
      case 'quiz':
        return tierLimits.quiz === -1 ? 0 : (usage.dailyQuizQuestions / tierLimits.quiz) * 100;
      case 'currentAffairs':
        return tierLimits.currentAffairs === -1 ? 0 : (usage.currentAffairsAnalysis / tierLimits.currentAffairs) * 100;
      case 'writing':
        return tierLimits.writing === -1 ? 0 : (usage.writingAnswers / tierLimits.writing) * 100;
      case 'interview':
        return tierLimits.interview === -1 ? 0 : (usage.interviewSessions / tierLimits.interview) * 100;
      default:
        return 0;
    }
  }, [state.currentUsage, state.userTier]);

  // Initial data fetch
  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  return {
    // State
    currentUsage: state.currentUsage,
    summary: state.summary,
    limits: state.limits,
    streak: state.streak,
    userTier: state.userTier,
    loading: state.loading,
    error: state.error,
    
    // Actions
    validateToolAccess,
    recordUsage,
    refetch: fetchUsageData,
    
    // Utilities
    canUseTool,
    getRemainingUsage,
    getUsagePercentage,
    
    // Computed properties
    hasWarnings: state.limits?.warnings.length || 0 > 0,
    shouldPromptUpgrade: state.limits?.shouldPromptUpgrade || false,
    isNearLimit: (toolType: ToolType) => {
      const remaining = getRemainingUsage(toolType);
      return remaining !== -1 && remaining <= 2;
    }
  };
}

export default useUsageTracking;