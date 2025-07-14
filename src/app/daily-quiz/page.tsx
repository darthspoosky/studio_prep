'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, Lock, Star, Trophy, Target, TrendingUp, Users, Calendar, CheckCircle, Play, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// Stage-based quiz structure
const STAGE_CONFIGS = {
  FOUNDATION: {
    name: 'Foundation Building',
    description: 'Master the basics with NCERT and fundamental concepts',
    color: 'blue',
    duration: '15-20 min',
    questionCount: 10,
    difficulty: 'Easy-Medium',
    requiredFor: 'Building strong base knowledge'
  },
  PRACTICE: {
    name: 'Regular Practice',
    description: 'Daily practice with mixed difficulty questions',
    color: 'green', 
    duration: '20-25 min',
    questionCount: 15,
    difficulty: 'Medium',
    requiredFor: 'Consistent skill development'
  },
  TEST: {
    name: 'Test Mode',
    description: 'Timed tests simulating exam conditions',
    color: 'orange',
    duration: '30-40 min',
    questionCount: 25,
    difficulty: 'Medium-Hard',
    requiredFor: 'Exam readiness assessment'
  },
  ADVANCED: {
    name: 'Advanced Practice',
    description: 'Challenging questions for top performance',
    color: 'purple',
    duration: '45-60 min',
    questionCount: 40,
    difficulty: 'Hard',
    requiredFor: 'Achieving top ranks'
  }
};

// Freemium tier definitions
const QUIZ_CATEGORIES = [
  // FREE TIER (5 questions/day)
  {
    id: 'daily-free',
    title: 'Daily Free Questions',
    description: 'Get 5 free questions every day to start your UPSC journey',
    icon: <Star />,
    stage: 'FOUNDATION',
    isFree: true,
    questionLimit: 5,
    features: ['Basic explanations', 'Progress tracking', 'Daily streak'],
    href: '/daily-quiz/free-daily',
    priority: 1
  },
  
  // FOUNDATION TIER (₹99/month)
  {
    id: 'ncert-foundation',
    title: 'NCERT Foundation',
    description: 'Build strong fundamentals with NCERT-based questions',
    icon: <Target />,
    stage: 'FOUNDATION', 
    tier: 'foundation',
    features: ['Unlimited questions', 'Detailed explanations', 'Concept linking'],
    href: '/daily-quiz/ncert-foundation',
    priority: 2
  },
  {
    id: 'current-affairs-basic',
    title: 'Current Affairs Basics',
    description: 'Stay updated with simplified current affairs questions',
    icon: <Calendar />,
    stage: 'FOUNDATION',
    tier: 'foundation', 
    features: ['Weekly summaries', 'Important events', 'Basic analysis'],
    href: '/daily-quiz/current-affairs-basic',
    priority: 3
  },

  // PRACTICE TIER (₹199/month)
  {
    id: 'previous-year',
    title: 'Previous Year Questions',
    description: 'Master exam patterns with 10+ years of past papers',
    icon: <Clock />,
    stage: 'PRACTICE',
    tier: 'practice',
    features: ['Year-wise practice', 'Trend analysis', 'Difficulty progression'],
    href: '/daily-quiz/past-year',
    priority: 4
  },
  {
    id: 'subject-wise',
    title: 'Subject-wise Practice',
    description: 'Deep dive into specific subjects with targeted questions',
    icon: <TrendingUp />,
    stage: 'PRACTICE', 
    tier: 'practice',
    features: ['All GS papers', 'Topic-wise breakdown', 'Weakness identification'],
    href: '/daily-quiz/subject-wise',
    priority: 5
  },
  {
    id: 'current-affairs-advanced',
    title: 'Advanced Current Affairs',
    description: 'Comprehensive current affairs with analysis and perspectives',
    icon: <Calendar />,
    stage: 'PRACTICE',
    tier: 'practice',
    features: ['Deep analysis', 'Multiple perspectives', 'Mains integration'],
    href: '/daily-quiz/current-affairs-advanced', 
    priority: 6
  },

  // TEST TIER (₹299/month)
  {
    id: 'mock-prelims',
    title: 'Mock Prelims Tests',
    description: 'Full-length practice tests simulating actual exam conditions',
    icon: <Trophy />,
    stage: 'TEST',
    tier: 'test',
    features: ['100 questions', '2-hour timer', 'Detailed analysis', 'All India rank'],
    href: '/daily-quiz/mock-prelims',
    priority: 7
  },
  {
    id: 'adaptive-practice',
    title: 'Adaptive Practice',
    description: 'AI-powered questions that adapt to your skill level',
    icon: <Zap />,
    stage: 'TEST',
    tier: 'test', 
    features: ['AI difficulty adjustment', 'Personalized weak areas', 'Smart recommendations'],
    href: '/daily-quiz/adaptive',
    priority: 8
  },

  // ADVANCED TIER (₹499/month)
  {
    id: 'topper-questions',
    title: 'Topper Question Bank',
    description: 'Exclusive questions used by successful candidates',
    icon: <Star />,
    stage: 'ADVANCED',
    tier: 'advanced',
    features: ['Exclusive content', 'Topper strategies', 'Advanced concepts'],
    href: '/daily-quiz/topper-bank',
    priority: 9
  },
  {
    id: 'final-revision',
    title: 'Final Revision Series',
    description: 'Last-minute high-yield questions for exam success',
    icon: <CheckCircle />,
    stage: 'ADVANCED',
    tier: 'advanced',
    features: ['High-yield topics', 'Quick revision', 'Exam shortcuts'],
    href: '/daily-quiz/final-revision',
    priority: 10
  }
];

const TIER_COLORS = {
  blue: 'bg-blue-500 text-blue-50',
  green: 'bg-green-500 text-green-50', 
  orange: 'bg-orange-500 text-orange-50',
  purple: 'bg-purple-500 text-purple-50'
};

const STAGE_COLORS = {
  FOUNDATION: 'border-blue-200 bg-blue-50/50',
  PRACTICE: 'border-green-200 bg-green-50/50', 
  TEST: 'border-orange-200 bg-orange-50/50',
  ADVANCED: 'border-purple-200 bg-purple-50/50'
};

interface UserProgress {
  dailyStreak: number;
  totalQuestions: number;
  accuracy: number;
  currentStage: keyof typeof STAGE_CONFIGS;
  tier: 'free' | 'foundation' | 'practice' | 'test' | 'advanced';
  dailyQuestionsUsed: number;
  stageProgress: {
    FOUNDATION: number;
    PRACTICE: number; 
    TEST: number;
    ADVANCED: number;
  };
}

// Mock user data - replace with actual API call
const useUserProgress = (): UserProgress => {
  const [progress, setProgress] = useState<UserProgress>({
    dailyStreak: 7,
    totalQuestions: 145,
    accuracy: 68,
    currentStage: 'FOUNDATION',
    tier: 'free',
    dailyQuestionsUsed: 3,
    stageProgress: {
      FOUNDATION: 45,
      PRACTICE: 12,
      TEST: 0, 
      ADVANCED: 0
    }
  });

  return progress;
};

const StageProgressCard = ({ stage, config, progress, isActive }: {
  stage: keyof typeof STAGE_CONFIGS;
  config: typeof STAGE_CONFIGS[keyof typeof STAGE_CONFIGS];
  progress: number;
  isActive: boolean;
}) => {
  return (
    <Card className={cn(
      'transition-all duration-200',
      isActive ? STAGE_COLORS[stage] + ' ring-2 ring-offset-2' : 'bg-gray-50',
      progress > 0 ? 'hover:shadow-md' : 'opacity-60'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{config.name}</CardTitle>
          {isActive && <Badge variant="secondary" className="text-xs">Current</Badge>}
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">{config.description}</p>
        <div className="mt-2 text-xs text-muted-foreground">
          {progress}% Complete • {config.questionCount} questions
        </div>
      </CardContent>
    </Card>
  );
};

const QuizCategoryCard = ({ category, userProgress, onUpgrade }: {
  category: typeof QUIZ_CATEGORIES[0];
  userProgress: UserProgress;
  onUpgrade: (tier: string) => void;
}) => {
  const stageConfig = STAGE_CONFIGS[category.stage];
  const isAccessible = category.isFree || 
    (category.tier === 'foundation' && ['foundation', 'practice', 'test', 'advanced'].includes(userProgress.tier)) ||
    (category.tier === 'practice' && ['practice', 'test', 'advanced'].includes(userProgress.tier)) ||
    (category.tier === 'test' && ['test', 'advanced'].includes(userProgress.tier)) ||
    (category.tier === 'advanced' && userProgress.tier === 'advanced');
  
  const showDailyLimit = category.isFree && userProgress.dailyQuestionsUsed >= category.questionLimit!;

  return (
    <Card className={cn(
      'flex flex-col transition-all duration-300 hover:shadow-lg',
      !isAccessible && 'opacity-75',
      STAGE_COLORS[category.stage]
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            TIER_COLORS[stageConfig.color as keyof typeof TIER_COLORS]
          )}>
            {React.cloneElement(category.icon as React.ReactElement, { className: 'w-6 h-6' })}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={category.isFree ? 'secondary' : 'default'} className="text-xs">
              {category.isFree ? 'FREE' : category.tier?.toUpperCase()}
            </Badge>
            {!isAccessible && <Lock className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
        <CardTitle className="text-lg">{category.title}</CardTitle>
        <CardDescription>{category.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-grow">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{stageConfig.duration}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4" />
            <span>{stageConfig.difficulty}</span>
          </div>
          {category.questionLimit && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{userProgress.dailyQuestionsUsed}/{category.questionLimit} used today</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Features:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {category.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        {!isAccessible ? (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onUpgrade(category.tier || 'foundation')}
          >
            <Lock className="w-4 h-4 mr-2" />
            Upgrade to Access
          </Button>
        ) : showDailyLimit ? (
          <Button variant="outline" className="w-full" disabled>
            Daily Limit Reached
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href={category.href}>
              <Play className="w-4 h-4 mr-2" />
              Start Practice
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default function DailyQuizRevamped() {
  const { user } = useAuth();
  const userProgress = useUserProgress();
  const [selectedStage, setSelectedStage] = useState<keyof typeof STAGE_CONFIGS>(userProgress.currentStage);

  const handleUpgrade = (tier: string) => {
    // Implement upgrade flow
    console.log('Upgrading to:', tier);
    // Redirect to pricing page or show upgrade modal
  };

  const filteredCategories = QUIZ_CATEGORIES
    .filter(cat => selectedStage === 'FOUNDATION' || cat.stage === selectedStage)
    .sort((a, b) => a.priority - b.priority);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* User Progress Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-headline text-3xl font-bold">Your Quiz Journey</h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>{userProgress.dailyStreak} day streak</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span>{userProgress.accuracy}% accuracy</span>
              </div>
            </div>
          </div>

          {/* Stage Progress */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(STAGE_CONFIGS).map(([stage, config]) => (
              <StageProgressCard
                key={stage}
                stage={stage as keyof typeof STAGE_CONFIGS}
                config={config}
                progress={userProgress.stageProgress[stage as keyof typeof STAGE_CONFIGS]}
                isActive={stage === userProgress.currentStage}
              />
            ))}
          </div>
        </div>

        {/* Stage Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {Object.entries(STAGE_CONFIGS).map(([stage, config]) => (
              <Button
                key={stage}
                variant={selectedStage === stage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStage(stage as keyof typeof STAGE_CONFIGS)}
                className="transition-all duration-200"
              >
                {config.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Quiz Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <QuizCategoryCard
              key={category.id}
              category={category}
              userProgress={userProgress}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>

        {/* Upgrade CTA for free users */}
        {userProgress.tier === 'free' && (
          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="space-y-4">
                <h3 className="text-2xl font-bold">Ready to Accelerate Your Preparation?</h3>
                <p className="text-muted-foreground">
                  Unlock unlimited questions, detailed explanations, and advanced analytics to boost your UPSC success rate.
                </p>
                <Button size="lg" className="mt-4" onClick={() => handleUpgrade('foundation')}>
                  <Star className="w-4 h-4 mr-2" />
                  Upgrade to Foundation Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}