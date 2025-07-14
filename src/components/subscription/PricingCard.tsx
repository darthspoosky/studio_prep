'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Crown, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubscriptionPlan, SubscriptionTier } from '@/lib/subscription-tiers';

interface PricingCardProps {
  plan: SubscriptionPlan;
  currentTier?: SubscriptionTier;
  userStage?: 'assessment' | 'prelims' | 'mains' | 'interview';
  onSelect: (tier: SubscriptionTier) => void;
  showYearly?: boolean;
}

const tierIcons = {
  free: <Target className="w-5 h-5" />,
  foundation: <Target className="w-5 h-5" />,
  practice: <Zap className="w-5 h-5" />,
  mains: <Star className="w-5 h-5" />,
  interview: <Crown className="w-5 h-5" />,
  elite: <Crown className="w-5 h-5" />
};

const tierColors = {
  free: 'border-gray-200 bg-gray-50',
  foundation: 'border-blue-200 bg-blue-50',
  practice: 'border-green-200 bg-green-50',
  mains: 'border-orange-200 bg-orange-50',
  interview: 'border-purple-200 bg-purple-50',
  elite: 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50'
};

const buttonColors = {
  free: 'bg-gray-600 hover:bg-gray-700',
  foundation: 'bg-blue-600 hover:bg-blue-700',
  practice: 'bg-green-600 hover:bg-green-700',
  mains: 'bg-orange-600 hover:bg-orange-700',
  interview: 'bg-purple-600 hover:bg-purple-700',
  elite: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
};

export function PricingCard({ 
  plan, 
  currentTier, 
  userStage, 
  onSelect, 
  showYearly = false 
}: PricingCardProps) {
  const isCurrentPlan = currentTier === plan.id;
  const isRecommended = plan.recommended || (userStage && plan.targetStage.includes(userStage));
  const isPopular = plan.popular;
  const isElite = plan.id === 'elite';
  
  const price = showYearly ? plan.price.yearly : plan.price.monthly;
  const monthlyEquivalent = showYearly ? Math.round(plan.price.yearly / 12) : plan.price.monthly;
  
  const savings = showYearly && plan.price.monthly > 0 ? 
    Math.round(((plan.price.monthly * 12 - plan.price.yearly) / (plan.price.monthly * 12)) * 100) : 0;

  return (
    <Card className={cn(
      'relative transition-all duration-300 hover:shadow-lg',
      tierColors[plan.id],
      isRecommended && 'ring-2 ring-primary ring-offset-2',
      isElite && 'border-2 border-yellow-300 shadow-lg'
    )}>
      {/* Badges */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex gap-2">
        {isRecommended && (
          <Badge className="bg-primary text-primary-foreground">
            Recommended
          </Badge>
        )}
        {isPopular && (
          <Badge variant="secondary">
            Most Popular
          </Badge>
        )}
        {isElite && (
          <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        )}
      </div>

      <CardHeader className="text-center space-y-4">
        {/* Icon */}
        <div className={cn(
          'w-16 h-16 mx-auto rounded-full flex items-center justify-center',
          plan.id === 'elite' ? 'bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-700' :
          plan.id === 'interview' ? 'bg-purple-100 text-purple-600' :
          plan.id === 'mains' ? 'bg-orange-100 text-orange-600' :
          plan.id === 'practice' ? 'bg-green-100 text-green-600' :
          plan.id === 'foundation' ? 'bg-blue-100 text-blue-600' :
          'bg-gray-100 text-gray-600'
        )}>
          {tierIcons[plan.id]}
        </div>

        {/* Plan Name */}
        <div>
          <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
          <CardDescription className="mt-2">{plan.description}</CardDescription>
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          {plan.price.monthly === 0 ? (
            <div className="text-3xl font-bold">Free</div>
          ) : (
            <>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold">₹{price}</span>
                <span className="text-muted-foreground">
                  /{showYearly ? 'year' : 'month'}
                </span>
              </div>
              
              {showYearly && savings > 0 && (
                <div className="text-sm text-green-600 font-medium">
                  Save {savings}% annually
                </div>
              )}
              
              {showYearly && plan.price.monthly > 0 && (
                <div className="text-sm text-muted-foreground">
                  ₹{monthlyEquivalent}/month when billed yearly
                </div>
              )}
            </>
          )}
        </div>

        {/* Target Stage */}
        <div className="flex flex-wrap gap-1 justify-center">
          {plan.targetStage.map((stage) => (
            <Badge key={stage} variant="outline" className="text-xs capitalize">
              {stage}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Benefits */}
        <div>
          <h4 className="font-semibold mb-3">What's included:</h4>
          <ul className="space-y-2">
            {plan.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Limitations (if any) */}
        {plan.limitations.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-muted-foreground">Limitations:</h4>
            <ul className="space-y-1">
              {plan.limitations.map((limitation, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {limitation}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA Button */}
        <div className="pt-4">
          {isCurrentPlan ? (
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          ) : (
            <Button 
              className={cn('w-full', buttonColors[plan.id])}
              onClick={() => onSelect(plan.id)}
            >
              {plan.cta}
            </Button>
          )}
        </div>

        {/* Stage Suitability */}
        {userStage && plan.targetStage.includes(userStage) && (
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              Perfect for your current stage
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PricingCard;