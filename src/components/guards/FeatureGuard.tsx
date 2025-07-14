'use client';

import React, { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Star, Zap, Crown, Users, Clock } from 'lucide-react';
import { SubscriptionTier } from '@/lib/subscription-tiers';
import { ToolType } from '@/services/usageTrackingService';

interface FeatureGuardProps {
  children: ReactNode;
  feature?: string;
  toolType?: ToolType;
  requiredTier?: SubscriptionTier;
  requiredStage?: 'prelims' | 'mains' | 'interview';
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  customMessage?: string;
}

// Default blocked content component
const BlockedContent = ({ 
  reason, 
  requiredTier, 
  currentTier, 
  onUpgrade, 
  customMessage,
  remaining 
}: {
  reason: 'tier' | 'usage' | 'stage';
  requiredTier?: SubscriptionTier;
  currentTier?: SubscriptionTier;
  onUpgrade?: () => void;
  customMessage?: string;
  remaining?: number;
}) => {
  const getIcon = () => {
    if (requiredTier === 'elite') return <Crown className="w-8 h-8 text-yellow-600" />;
    if (requiredTier === 'interview') return <Users className="w-8 h-8 text-purple-600" />;
    if (requiredTier === 'mains') return <Star className="w-8 h-8 text-orange-600" />;
    return <Lock className="w-8 h-8 text-gray-600" />;
  };

  const getTitle = () => {
    if (reason === 'usage') return 'Daily Limit Reached';
    if (reason === 'stage') return 'Feature Not Available';
    return 'Premium Feature';
  };

  const getMessage = () => {
    if (customMessage) return customMessage;
    
    if (reason === 'usage') {
      return remaining !== undefined && remaining === 0 
        ? 'You\'ve used all your daily allowance for this feature. Upgrade for unlimited access or try again tomorrow.'
        : 'You\'re approaching your daily limit. Upgrade for unlimited access.';
    }
    
    if (reason === 'stage') {
      return 'This feature is available for candidates who have reached the appropriate preparation stage.';
    }
    
    return `This feature requires ${requiredTier} tier or higher. Upgrade to unlock all features.`;
  };

  const getUpgradeText = () => {
    if (reason === 'usage') return 'Upgrade for Unlimited';
    if (requiredTier === 'elite') return 'Go Elite';
    if (requiredTier === 'interview') return 'Unlock Interview Prep';
    if (requiredTier === 'mains') return 'Upgrade to Mains';
    return 'Upgrade Now';
  };

  return (
    <Card className="max-w-md mx-auto text-center p-8">
      <CardContent className="space-y-6">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          {getIcon()}
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-2">{getTitle()}</h3>
          <p className="text-muted-foreground">{getMessage()}</p>
        </div>

        {requiredTier && currentTier && (
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Current:</span>
              <Badge variant="outline">{currentTier.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Required:</span>
              <Badge>{requiredTier.toUpperCase()}</Badge>
            </div>
          </div>
        )}

        {onUpgrade && (
          <Button onClick={onUpgrade} className="w-full">
            <Zap className="w-4 h-4 mr-2" />
            {getUpgradeText()}
          </Button>
        )}

        {reason === 'usage' && !onUpgrade && (
          <div className="text-sm text-muted-foreground">
            <Clock className="w-4 h-4 inline mr-1" />
            Reset tomorrow at midnight
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Usage limit warning component
const UsageLimitWarning = ({ 
  toolType, 
  remaining, 
  onUpgrade 
}: {
  toolType: ToolType;
  remaining: number;
  onUpgrade?: () => void;
}) => {
  if (remaining === -1 || remaining > 2) return null;

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {remaining === 0 
                ? 'Daily limit reached' 
                : `${remaining} ${toolType === 'quiz' ? 'questions' : 'uses'} remaining today`
              }
            </span>
          </div>
          {onUpgrade && (
            <Button size="sm" variant="outline" onClick={onUpgrade}>
              Upgrade
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Main FeatureGuard component
export function FeatureGuard({
  children,
  feature,
  toolType,
  requiredTier,
  requiredStage,
  fallback,
  showUpgradePrompt = true,
  customMessage
}: FeatureGuardProps) {
  const { 
    subscription, 
    profile, 
    loading: subscriptionLoading, 
    upgradeSubscription,
    currentTier,
    currentStage 
  } = useSubscription();
  
  const { 
    canUseTool, 
    getRemainingUsage, 
    loading: usageLoading 
  } = useUsageTracking();

  // Show loading state
  if (subscriptionLoading || usageLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle upgrade action
  const handleUpgrade = async () => {
    if (!requiredTier) return;
    
    try {
      await upgradeSubscription(requiredTier);
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  // Check stage requirement
  if (requiredStage && currentStage !== requiredStage) {
    const stageMessages = {
      prelims: 'This feature is available during Prelims preparation',
      mains: 'This feature unlocks after Prelims qualification',
      interview: 'This feature is exclusive to Interview qualified candidates'
    };

    if (fallback) return <>{fallback}</>;
    
    return (
      <BlockedContent
        reason="stage"
        customMessage={customMessage || stageMessages[requiredStage]}
        onUpgrade={showUpgradePrompt ? handleUpgrade : undefined}
      />
    );
  }

  // Check tier requirement
  if (requiredTier) {
    const tierOrder: SubscriptionTier[] = ['free', 'foundation', 'practice', 'mains', 'interview', 'elite'];
    const currentTierIndex = tierOrder.indexOf(currentTier);
    const requiredTierIndex = tierOrder.indexOf(requiredTier);
    
    if (currentTierIndex < requiredTierIndex) {
      if (fallback) return <>{fallback}</>;
      
      return (
        <BlockedContent
          reason="tier"
          requiredTier={requiredTier}
          currentTier={currentTier}
          customMessage={customMessage}
          onUpgrade={showUpgradePrompt ? handleUpgrade : undefined}
        />
      );
    }
  }

  // Check tool usage limits
  if (toolType) {
    const canUse = canUseTool(toolType);
    const remaining = getRemainingUsage(toolType);
    
    if (!canUse) {
      if (fallback) return <>{fallback}</>;
      
      return (
        <BlockedContent
          reason="usage"
          remaining={remaining}
          customMessage={customMessage}
          onUpgrade={showUpgradePrompt ? handleUpgrade : undefined}
        />
      );
    }

    // Show warning if approaching limit
    if (remaining !== -1 && remaining <= 2) {
      return (
        <>
          <UsageLimitWarning
            toolType={toolType}
            remaining={remaining}
            onUpgrade={showUpgradePrompt ? handleUpgrade : undefined}
          />
          {children}
        </>
      );
    }
  }

  // Check custom feature
  if (feature) {
    // This would need to be implemented based on your feature checking logic
    // For now, assume feature is available
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Higher-order component for feature gating
export function withFeatureGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<FeatureGuardProps, 'children'>
) {
  return function GuardedComponent(props: P) {
    return (
      <FeatureGuard {...guardProps}>
        <Component {...props} />
      </FeatureGuard>
    );
  };
}

// Hook for checking feature access
export function useFeatureAccess() {
  const { hasFeature, currentTier, currentStage } = useSubscription();
  const { canUseTool, getRemainingUsage } = useUsageTracking();

  const checkAccess = (options: {
    feature?: string;
    toolType?: ToolType;
    requiredTier?: SubscriptionTier;
    requiredStage?: 'prelims' | 'mains' | 'interview';
  }) => {
    const { feature, toolType, requiredTier, requiredStage } = options;

    // Check stage requirement
    if (requiredStage && currentStage !== requiredStage) {
      return {
        allowed: false,
        reason: 'stage' as const,
        message: `Requires ${requiredStage} stage`
      };
    }

    // Check tier requirement
    if (requiredTier) {
      const tierOrder: SubscriptionTier[] = ['free', 'foundation', 'practice', 'mains', 'interview', 'elite'];
      const currentTierIndex = tierOrder.indexOf(currentTier);
      const requiredTierIndex = tierOrder.indexOf(requiredTier);
      
      if (currentTierIndex < requiredTierIndex) {
        return {
          allowed: false,
          reason: 'tier' as const,
          message: `Requires ${requiredTier} tier`,
          currentTier,
          requiredTier
        };
      }
    }

    // Check tool usage
    if (toolType && !canUseTool(toolType)) {
      return {
        allowed: false,
        reason: 'usage' as const,
        message: 'Daily limit reached',
        remaining: getRemainingUsage(toolType)
      };
    }

    // Check custom feature
    if (feature && !hasFeature(feature)) {
      return {
        allowed: false,
        reason: 'feature' as const,
        message: `Feature ${feature} not available`
      };
    }

    return {
      allowed: true,
      reason: null,
      message: 'Access granted'
    };
  };

  return { checkAccess };
}

export default FeatureGuard;