'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PenTool, Target, Clock, CheckCircle, TrendingUp, BookOpen, FileText, Lock, Star, Zap, Users, Award, Edit3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// Writing Practice Modes for Different Stages
const WRITING_MODES = {
  FOUNDATION: {
    name: 'Foundation Writing',
    description: 'Learn basic answer writing structure and format',
    color: 'blue',
    features: [
      'Guided templates',
      'Structure hints',
      'Basic evaluation',
      'Writing guidelines',
      '150-word answers'
    ],
    targetUsers: 'New to Mains preparation',
    duration: '20-30 minutes',
    complexity: 'Beginner',
    wordLimits: [150, 200, 250],
    questionTypes: ['Basic concepts', 'Simple factual', 'Definition-based']
  },
  MAINS_PRACTICE: {
    name: 'Mains Practice Mode',
    description: 'Regular practice for Mains qualified candidates',
    color: 'green', 
    features: [
      'Standard answer formats',
      'Detailed evaluation',
      'Peer comparison',
      'Expert feedback',
      '250-word answers'
    ],
    targetUsers: 'Mains qualified candidates',
    duration: '45-60 minutes',
    complexity: 'Intermediate',
    wordLimits: [250, 400, 500],
    questionTypes: ['Analytical', 'Policy-based', 'Current affairs']
  },
  ADVANCED_MAINS: {
    name: 'Advanced Mains',
    description: 'High-quality answers for top performance',
    color: 'orange',
    features: [
      'Advanced evaluation',
      'Model answers',
      'Topper strategies',
      'Time management',
      '400-word answers'
    ],
    targetUsers: 'Experienced candidates targeting top ranks',
    duration: '60-90 minutes', 
    complexity: 'Advanced',
    wordLimits: [400, 500, 750],
    questionTypes: ['Complex analytical', 'Multi-dimensional', 'Case studies']
  },
  ESSAY_PRACTICE: {
    name: 'Essay Writing',
    description: 'Essay paper preparation with diverse topics',
    color: 'purple',
    features: [
      'Essay structure',
      'Philosophical insights',
      'Creative expression',
      'Time-bound practice',
      '1000-word essays'
    ],
    targetUsers: 'All Mains candidates',
    duration: '90-120 minutes',
    complexity: 'Advanced',
    wordLimits: [1000, 1200, 1500],
    questionTypes: ['Philosophical', 'Social', 'Economic', 'Ethical']
  }
};

// Access Control for Different Stages
const ACCESS_CONTROL = {
  prelims: {
    allowedModes: [], // Writing practice not relevant for Prelims
    message: 'Writing practice unlocks after Prelims qualification'
  },
  mains: {
    allowedModes: ['FOUNDATION', 'MAINS_PRACTICE'],
    dailyLimit: 5,
    features: ['Basic evaluation', 'Standard templates']
  },
  mainsPlus: {
    allowedModes: ['FOUNDATION', 'MAINS_PRACTICE', 'ADVANCED_MAINS'],
    dailyLimit: 10, 
    features: ['Advanced evaluation', 'Model answers', 'Peer review']
  },
  interview: {
    allowedModes: ['FOUNDATION', 'MAINS_PRACTICE', 'ADVANCED_MAINS', 'ESSAY_PRACTICE'],
    dailyLimit: -1, // Unlimited
    features: ['All features', 'Expert review', 'Essay practice']
  }
};

// Question Categories for Mains
const QUESTION_CATEGORIES = [
  {
    id: 'gs1',
    name: 'GS Paper 1',
    subjects: ['History', 'Geography', 'Art & Culture', 'Society'],
    color: 'blue',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Indian Heritage, History, Society and Geography'
  },
  {
    id: 'gs2', 
    name: 'GS Paper 2',
    subjects: ['Polity', 'Governance', 'Constitution', 'International Relations'],
    color: 'green',
    icon: <Target className="w-5 h-5" />,
    description: 'Governance, Constitution, Polity, Social Justice and International Relations'
  },
  {
    id: 'gs3',
    name: 'GS Paper 3',
    subjects: ['Economy', 'Technology', 'Environment', 'Security'],
    color: 'orange', 
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'Technology, Economic Development, Biodiversity, Environment, Security'
  },
  {
    id: 'gs4',
    name: 'GS Paper 4',
    subjects: ['Ethics', 'Integrity', 'Aptitude'],
    color: 'purple',
    icon: <Award className="w-5 h-5" />,
    description: 'Ethics, Integrity and Aptitude'
  },
  {
    id: 'essay',
    name: 'Essay Paper',
    subjects: ['Philosophy', 'Social Issues', 'Current Topics'],
    color: 'pink',
    icon: <Edit3 className="w-5 h-5" />,
    description: 'Essay Writing on diverse topics'
  }
];

interface UserWritingStats {
  tier: keyof typeof ACCESS_CONTROL;
  currentStage: 'prelims' | 'mains' | 'interview';
  totalAnswers: number;
  averageScore: number;
  dailyAnswersWritten: number;
  streak: number;
  strongSubjects: string[];
  weakSubjects: string[];
  recentPerformance: {
    subject: string;
    score: number;
    date: string;
  }[];
}

// Mock user stats
const useUserWritingStats = (): UserWritingStats => {
  return {
    tier: 'mains',
    currentStage: 'mains',
    totalAnswers: 45,
    averageScore: 7.2,
    dailyAnswersWritten: 2,
    streak: 12,
    strongSubjects: ['Polity', 'Geography'],
    weakSubjects: ['Economy', 'Ethics'],
    recentPerformance: [
      { subject: 'History', score: 8.1, date: '2024-01-15' },
      { subject: 'Polity', score: 7.8, date: '2024-01-14' },
      { subject: 'Economy', score: 6.5, date: '2024-01-13' }
    ]
  };
};

const WritingModeCard = ({ mode, modeConfig, isAccessible, isRecommended, onSelect }: {
  mode: keyof typeof WRITING_MODES;
  modeConfig: typeof WRITING_MODES[keyof typeof WRITING_MODES];
  isAccessible: boolean;
  isRecommended: boolean;
  onSelect: (mode: keyof typeof WRITING_MODES) => void;
}) => {
  return (
    <Card className={cn(
      'relative cursor-pointer transition-all duration-300 hover:shadow-lg',
      isAccessible ? 'hover:border-primary' : 'opacity-60',
      isRecommended && 'ring-2 ring-primary ring-offset-2'
    )}>
      {isRecommended && (
        <Badge className="absolute -top-2 -right-2 bg-primary">
          Recommended
        </Badge>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <PenTool className={cn(
            'w-8 h-8 rounded-lg p-1.5',
            `bg-${modeConfig.color}-100 text-${modeConfig.color}-600`
          )} />
          {!isAccessible && <Lock className="w-4 h-4 text-muted-foreground" />}
        </div>
        <CardTitle className="text-lg">{modeConfig.name}</CardTitle>
        <CardDescription>{modeConfig.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <div className="font-medium">{modeConfig.duration}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Level:</span>
            <div className="font-medium">{modeConfig.complexity}</div>
          </div>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">Features:</span>
          <ul className="mt-2 space-y-1">
            {modeConfig.features.slice(0, 3).map((feature, idx) => (
              <li key={idx} className="text-sm flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            For: {modeConfig.targetUsers}
          </div>
        </div>
      </CardContent>

      <div className="p-6 pt-0">
        {isAccessible ? (
          <Button className="w-full" onClick={() => onSelect(mode)}>
            Start Writing
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            <Lock className="w-4 h-4 mr-2" />
            Upgrade Required
          </Button>
        )}
      </div>
    </Card>
  );
};

const SubjectCard = ({ category, onSelect }: {
  category: typeof QUESTION_CATEGORIES[0];
  onSelect: (category: string) => void;
}) => {
  return (
    <Card 
      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary"
      onClick={() => onSelect(category.id)}
    >
      <CardHeader>
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center mb-3',
          `bg-${category.color}-100 text-${category.color}-600`
        )}>
          {category.icon}
        </div>
        <CardTitle className="text-lg">{category.name}</CardTitle>
        <CardDescription>{category.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <span className="text-sm font-medium">Key Areas:</span>
          <div className="flex flex-wrap gap-1">
            {category.subjects.map((subject) => (
              <Badge key={subject} variant="secondary" className="text-xs">
                {subject}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function WritingPracticeRevamped() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userStats = useUserWritingStats();
  
  const [selectedMode, setSelectedMode] = useState<keyof typeof WRITING_MODES | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Check access permissions
  const accessControl = ACCESS_CONTROL[userStats.tier];
  const canAccessWriting = userStats.currentStage !== 'prelims';
  const dailyLimit = accessControl.dailyLimit;
  const canWriteToday = dailyLimit === -1 || userStats.dailyAnswersWritten < dailyLimit;

  const handleModeSelect = (mode: keyof typeof WRITING_MODES) => {
    setSelectedMode(mode);
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    // Navigate to writing interface with selected mode and subject
    console.log('Starting writing practice:', { mode: selectedMode, subject });
  };

  if (!canAccessWriting) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container mx-auto px-4 py-4">
            <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-lg p-8 text-center">
            <CardContent className="space-y-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <PenTool className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold">Writing Practice Coming Soon</h2>
              <p className="text-muted-foreground">
                Writing practice is designed for Mains qualified candidates. Focus on your Prelims preparation first!
              </p>
              <Button asChild>
                <Link href="/daily-quiz">
                  Start Prelims Practice
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{userStats.dailyAnswersWritten}/{dailyLimit === -1 ? '∞' : dailyLimit} answers today</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>{userStats.averageScore.toFixed(1)}/10 avg score</span>
              </div>
              <Badge variant="secondary">{userStats.tier.toUpperCase()}</Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Performance Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-3xl font-bold">Mains Writing Practice</h1>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <span>{userStats.streak} day streak</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span>{userStats.totalAnswers} total answers</span>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold">{userStats.averageScore}/10</div>
                  <Progress value={userStats.averageScore * 10} className="flex-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Strong Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {userStats.strongSubjects.map((subject) => (
                    <Badge key={subject} variant="default" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Need Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {userStats.weakSubjects.map((subject) => (
                    <Badge key={subject} variant="destructive" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mode Selection */}
        {!selectedMode ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Choose Your Writing Mode</h2>
              <p className="text-muted-foreground">
                Select the practice mode that matches your current preparation level
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(WRITING_MODES).map(([mode, modeConfig]) => {
                const isAccessible = accessControl.allowedModes.includes(mode as keyof typeof WRITING_MODES);
                const isRecommended = userStats.totalAnswers < 20 && mode === 'FOUNDATION' ||
                                    userStats.totalAnswers >= 20 && mode === 'MAINS_PRACTICE';
                
                return (
                  <WritingModeCard
                    key={mode}
                    mode={mode as keyof typeof WRITING_MODES}
                    modeConfig={modeConfig}
                    isAccessible={isAccessible}
                    isRecommended={isRecommended}
                    onSelect={handleModeSelect}
                  />
                );
              })}
            </div>

            {/* Daily Limit Warning */}
            {!canWriteToday && (
              <Card className="max-w-2xl mx-auto p-6 bg-yellow-50 border-yellow-200">
                <CardContent className="text-center space-y-4">
                  <Clock className="w-12 h-12 text-yellow-600 mx-auto" />
                  <h3 className="text-xl font-semibold">Daily Limit Reached</h3>
                  <p className="text-muted-foreground">
                    You've completed {userStats.dailyAnswersWritten} answers today. Upgrade for unlimited practice or come back tomorrow!
                  </p>
                  <Button variant="outline">
                    <Star className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Subject Selection */
          <div className="space-y-8">
            {/* Selected Mode Info */}
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    {WRITING_MODES[selectedMode].name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {WRITING_MODES[selectedMode].description}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Duration: {WRITING_MODES[selectedMode].duration}</span>
                    <span>Word limits: {WRITING_MODES[selectedMode].wordLimits.join(', ')} words</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedMode(null)}
                >
                  Change Mode
                </Button>
              </div>
            </Card>

            {/* Subject Selection */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Select Subject Area</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {QUESTION_CATEGORIES.map((category) => (
                  <SubjectCard
                    key={category.id}
                    category={category}
                    onSelect={handleSubjectSelect}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}