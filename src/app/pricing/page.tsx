'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Check, Star, Users, TrendingUp, Award, Crown, Zap, Target, Shield, Headphones } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import PricingCard from '@/components/subscription/PricingCard';
import { SUBSCRIPTION_PLANS, SubscriptionTier, getRecommendedTier, UserStage } from '@/lib/subscription-tiers';
import Header from '@/components/layout/header';

// Success metrics for social proof
const SUCCESS_METRICS = [
  { icon: <Users className="w-5 h-5" />, value: '50,000+', label: 'Active Students' },
  { icon: <TrendingUp className="w-5 h-5" />, value: '3x', label: 'Higher Success Rate' },
  { icon: <Award className="w-5 h-5" />, value: '2,000+', label: 'Selections in 2024' },
  { icon: <Star className="w-5 h-5" />, value: '4.9/5', label: 'Student Rating' }
];

// Feature comparison matrix
const FEATURE_COMPARISON = [
  {
    category: 'Quiz Practice',
    features: [
      { name: 'Daily Questions', free: '5/day', foundation: '25/day', practice: 'Unlimited', mains: 'Unlimited', interview: 'Unlimited', elite: 'Unlimited' },
      { name: 'Previous Year Papers', free: '✗', foundation: '✓', practice: '✓', mains: '✓', interview: '✓', elite: '✓' },
      { name: 'Mock Tests', free: '✗', foundation: '✗', practice: '✓', mains: '✓', interview: '✓', elite: '✓' },
      { name: 'Adaptive Learning', free: '✗', foundation: '✗', practice: '✓', mains: '✓', interview: '✓', elite: '✓' }
    ]
  },
  {
    category: 'Current Affairs',
    features: [
      { name: 'Daily Analysis', free: '2/day', foundation: '5/day', practice: '10/day', mains: 'Unlimited', interview: 'Unlimited', elite: 'Unlimited' },
      { name: 'Multi-Language', free: '✗', foundation: '✓', practice: '✓', mains: '✓', interview: '✓', elite: '✓' },
      { name: 'Audio Summaries', free: '✗', foundation: '✓', practice: '✓', mains: '✓', interview: '✓', elite: '✓' },
      { name: 'Advanced Analysis', free: '✗', foundation: '✗', practice: '✓', mains: '✓', interview: '✓', elite: '✓' }
    ]
  },
  {
    category: 'Writing Practice',
    features: [
      { name: 'Answer Writing', free: '✗', foundation: '✗', practice: '✗', mains: '10/day', interview: 'Unlimited', elite: 'Unlimited' },
      { name: 'AI Evaluation', free: '✗', foundation: '✗', practice: '✗', mains: '✓', interview: '✓', elite: '✓' },
      { name: 'Expert Feedback', free: '✗', foundation: '✗', practice: '✗', mains: '✗', interview: '✓', elite: '✓' },
      { name: 'Peer Review', free: '✗', foundation: '✗', practice: '✗', mains: '✓', interview: '✓', elite: '✓' }
    ]
  },
  {
    category: 'Interview Prep',
    features: [
      { name: 'Mock Interviews', free: '✗', foundation: '✗', practice: '✗', mains: '✗', interview: '5/day', elite: 'Unlimited' },
      { name: 'Board Simulation', free: '✗', foundation: '✗', practice: '✗', mains: '✗', interview: '✗', elite: '✓' },
      { name: 'Video Analysis', free: '✗', foundation: '✗', practice: '✗', mains: '✗', interview: '✗', elite: '✓' },
      { name: 'Human Coaching', free: '✗', foundation: '✗', practice: '✗', mains: '✗', interview: '✗', elite: '✓' }
    ]
  }
];

// FAQ data
const FAQ_DATA = [
  {
    question: "How does the stage-based pricing work?",
    answer: "Our pricing is designed around the UPSC journey stages. Start with Foundation for Prelims, upgrade to Mains after qualification, and access Interview prep only when you reach that stage. This ensures you pay only for what you need at each step."
  },
  {
    question: "Can I upgrade or downgrade my plan anytime?",
    answer: "Yes! You can upgrade anytime to access more features. Downgrades are processed at the end of your current billing cycle. We'll prorate any payments fairly."
  },
  {
    question: "What happens if I don't qualify for the next stage?",
    answer: "No worries! You can continue with your current plan and retry. We also offer extended access and additional support to help you succeed in your next attempt."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 7-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team for a full refund, no questions asked."
  },
  {
    question: "Is there any discount for yearly plans?",
    answer: "Yes! Annual plans come with up to 17% savings compared to monthly billing. Plus, you get additional benefits like priority support and exclusive content."
  },
  {
    question: "What makes PrepTalk different from other platforms?",
    answer: "PrepTalk is the only platform designed specifically for each UPSC stage with AI-powered personalization, expert content curation, and a proven track record of 3x higher success rates among our users."
  }
];

// Mock user data - replace with actual user context
const useUserData = () => {
  const [userData, setUserData] = useState({
    currentTier: 'free' as SubscriptionTier,
    currentStage: 'prelims' as UserStage,
    isLoggedIn: false
  });

  return userData;
};

export default function PricingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userData = useUserData();
  const [showYearly, setShowYearly] = useState(false);
  const [selectedStage, setSelectedStage] = useState<UserStage>(userData.currentStage);

  const handlePlanSelect = (tier: SubscriptionTier) => {
    // Handle plan selection - integrate with payment gateway
    console.log('Selected plan:', tier);
    toast({
      title: "Redirecting to Payment",
      description: `Setting up ${SUBSCRIPTION_PLANS[tier].name} subscription...`,
    });
    // Implement payment integration here
  };

  const recommendedTier = getRecommendedTier(selectedStage);
  const stageBasedPlans = Object.values(SUBSCRIPTION_PLANS).filter(
    plan => plan.targetStage.includes(selectedStage) || plan.id === 'free'
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
        {/* Header */}
        <div className="text-center mb-16">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tighter mb-4">
            Choose Your UPSC Success Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stage-based pricing designed for your UPSC journey. Pay only for what you need at each step.
          </p>
        </div>

        {/* Success Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {SUCCESS_METRICS.map((metric, index) => (
            <Card key={index} className="text-center p-6">
              <CardContent className="space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto text-primary">
                  {metric.icon}
                </div>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="text-sm text-muted-foreground">{metric.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stage Selection */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">Select Your Preparation Stage</h2>
            <p className="text-muted-foreground">Choose your current stage to see relevant plans</p>
          </div>
          
          <Tabs value={selectedStage} onValueChange={(value) => setSelectedStage(value as UserStage)} className="max-w-2xl mx-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
              <TabsTrigger value="prelims">Prelims</TabsTrigger>
              <TabsTrigger value="mains">Mains</TabsTrigger>
              <TabsTrigger value="interview">Interview</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${!showYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <Switch
            checked={showYearly}
            onCheckedChange={setShowYearly}
          />
          <span className={`text-sm ${showYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
            Yearly
          </span>
          {showYearly && (
            <Badge variant="secondary" className="ml-2">
              Save up to 17%
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {stageBasedPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              currentTier={userData.currentTier}
              userStage={selectedStage}
              onSelect={handlePlanSelect}
              showYearly={showYearly}
            />
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">Compare All Features</h2>
            <p className="text-muted-foreground">See exactly what's included in each plan</p>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Features</th>
                    <th className="text-center p-4 font-semibold">Free</th>
                    <th className="text-center p-4 font-semibold">Foundation</th>
                    <th className="text-center p-4 font-semibold">Practice</th>
                    <th className="text-center p-4 font-semibold">Mains</th>
                    <th className="text-center p-4 font-semibold">Interview</th>
                    <th className="text-center p-4 font-semibold">Elite</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_COMPARISON.map((category) => (
                    <React.Fragment key={category.category}>
                      <tr className="bg-muted/50">
                        <td colSpan={7} className="p-4 font-semibold text-sm">
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-4 text-sm">{feature.name}</td>
                          <td className="p-4 text-center text-sm">{feature.free}</td>
                          <td className="p-4 text-center text-sm">{feature.foundation}</td>
                          <td className="p-4 text-center text-sm">{feature.practice}</td>
                          <td className="p-4 text-center text-sm">{feature.mains}</td>
                          <td className="p-4 text-center text-sm">{feature.interview}</td>
                          <td className="p-4 text-center text-sm">{feature.elite}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {FAQ_DATA.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Ready to Start Your UPSC Journey?</h3>
                <p className="text-muted-foreground">
                  Join thousands of successful candidates who chose PrepTalk for their UPSC preparation.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => handlePlanSelect('free')}>
                  <Target className="w-4 h-4 mr-2" />
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" onClick={() => handlePlanSelect(recommendedTier)}>
                  <Zap className="w-4 h-4 mr-2" />
                  Get Recommended Plan
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>7-day money back guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4" />
                  <span>24/7 support</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}