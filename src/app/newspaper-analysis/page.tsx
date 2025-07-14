'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Newspaper, Target, BookOpen, Lightbulb, Clock, Lock, Star, Zap, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Stage-based Current Affairs Configuration
const STAGE_MODES = {
  FOUNDATION: {
    name: 'Foundation Current Affairs',
    description: 'Simplified analysis focusing on basic understanding',
    color: 'blue',
    features: [
      'Simple language explanations',
      'Basic concept linking', 
      'Key facts highlighting',
      'Simple MCQs (5-10)',
      'Basic timeline'
    ],
    duration: '10-15 minutes',
    complexity: 'Basic',
    target: 'New aspirants building base knowledge'
  },
  PRACTICE: {
    name: 'Regular Practice Mode',
    description: 'Comprehensive analysis for consistent preparation',
    color: 'green',
    features: [
      'Detailed analysis',
      'Multiple perspectives',
      'Moderate MCQs (10-15)',
      'Short mains questions',
      'Cross-topic connections'
    ],
    duration: '20-30 minutes', 
    complexity: 'Intermediate',
    target: 'Regular preparation and skill building'
  },
  MAINS_FOCUSED: {
    name: 'Mains Preparation',
    description: 'Deep analysis for answer writing practice',
    color: 'orange',
    features: [
      'Multi-dimensional analysis',
      'Government policy context',
      'Detailed mains questions',
      'Essay topics',
      'Administrative perspectives'
    ],
    duration: '30-45 minutes',
    complexity: 'Advanced',
    target: 'Mains qualified candidates'
  },
  INTERVIEW_READY: {
    name: 'Interview Preparation', 
    description: 'Opinion formation and current issues discussion',
    color: 'purple',
    features: [
      'Balanced viewpoints',
      'Ethical dimensions',
      'Policy critique',
      'Contemporary relevance',
      'Interview questions'
    ],
    duration: '45-60 minutes',
    complexity: 'Expert',
    target: 'Interview qualified candidates'
  }
};

// Freemium Access Control
const ACCESS_TIERS = {
  free: {
    dailyLimit: 2,
    modes: ['FOUNDATION'],
    features: ['Basic analysis', 'Simple MCQs']
  },
  foundation: {
    dailyLimit: 5,
    modes: ['FOUNDATION', 'PRACTICE'],
    features: ['All foundation features', 'Detailed analysis', 'More questions']
  },
  practice: {
    dailyLimit: 10, 
    modes: ['FOUNDATION', 'PRACTICE', 'MAINS_FOCUSED'],
    features: ['All practice features', 'Mains questions', 'Essay topics']
  },
  premium: {
    dailyLimit: -1, // Unlimited
    modes: ['FOUNDATION', 'PRACTICE', 'MAINS_FOCUSED', 'INTERVIEW_READY'],
    features: ['All features', 'Interview prep', 'Expert analysis']
  }
};

const INPUT_METHODS = [
  {
    id: 'url',
    title: 'Article URL',
    description: 'Paste link from news websites',
    icon: <Newspaper className="w-5 h-5" />,
    placeholder: 'https://example.com/article...',
    inputType: 'url'
  },
  {
    id: 'text',
    title: 'Copy-Paste Text',
    description: 'Paste article content directly',
    icon: <BookOpen className="w-5 h-5" />,
    placeholder: 'Paste your article content here...',
    inputType: 'textarea'
  },
  {
    id: 'topic',
    title: 'Topic Research',
    description: 'Research any current affairs topic',
    icon: <Lightbulb className="w-5 h-5" />,
    placeholder: 'Enter topic: e.g., "Digital India Initiative"',
    inputType: 'text'
  }
];

interface UserProgress {
  tier: keyof typeof ACCESS_TIERS;
  currentStage: keyof typeof STAGE_MODES;
  dailyAnalysisUsed: number;
  totalAnalysisCount: number;
  preferredLanguage: string;
}

// Mock user progress - replace with actual API
const useUserProgress = (): UserProgress => {
  return {
    tier: 'free',
    currentStage: 'FOUNDATION', 
    dailyAnalysisUsed: 1,
    totalAnalysisCount: 12,
    preferredLanguage: 'English'
  };
};

const StageCard = ({ stage, mode, isAccessible, isRecommended, userTier, onSelect }: {
  stage: keyof typeof STAGE_MODES;
  mode: typeof STAGE_MODES[keyof typeof STAGE_MODES];
  isAccessible: boolean;
  isRecommended: boolean;
  userTier: keyof typeof ACCESS_TIERS;
  onSelect: (stage: keyof typeof STAGE_MODES) => void;
}) => {
  const tierInfo = ACCESS_TIERS[userTier];
  
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
          <Target className={cn(
            'w-8 h-8 rounded-lg p-1.5',
            `bg-${mode.color}-100 text-${mode.color}-600`
          )} />
          {!isAccessible && <Lock className="w-4 h-4 text-muted-foreground" />}
        </div>
        <CardTitle className="text-lg">{mode.name}</CardTitle>
        <CardDescription>{mode.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <div className="font-medium">{mode.duration}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Level:</span>
            <div className="font-medium">{mode.complexity}</div>
          </div>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">Features:</span>
          <ul className="mt-2 space-y-1">
            {mode.features.slice(0, 3).map((feature, idx) => (
              <li key={idx} className="text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            {mode.target}
          </div>
        </div>
      </CardContent>

      <div className="p-6 pt-0">
        {isAccessible ? (
          <Button 
            className="w-full" 
            onClick={() => onSelect(stage)}
          >
            Select This Mode
            <ChevronRight className="w-4 h-4 ml-2" />
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

const InputMethodCard = ({ method, isSelected, onSelect }: {
  method: typeof INPUT_METHODS[0];
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => {
  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200',
        isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
      )}
      onClick={() => onSelect(method.id)}
    >
      <CardHeader className="text-center">
        <div className={cn(
          'w-12 h-12 rounded-lg mx-auto flex items-center justify-center',
          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
          {method.icon}
        </div>
        <CardTitle className="text-base">{method.title}</CardTitle>
        <CardDescription className="text-sm">{method.description}</CardDescription>
      </CardHeader>
    </Card>
  );
};

export default function NewspaperAnalysisRevamped() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userProgress = useUserProgress();
  
  const [selectedStage, setSelectedStage] = useState<keyof typeof STAGE_MODES | null>(null);
  const [selectedInputMethod, setSelectedInputMethod] = useState<string>('url');
  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState(userProgress.preferredLanguage);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const tierInfo = ACCESS_TIERS[userProgress.tier];
  const canUseToday = userProgress.dailyAnalysisUsed < tierInfo.dailyLimit || tierInfo.dailyLimit === -1;

  const handleStageSelect = (stage: keyof typeof STAGE_MODES) => {
    setSelectedStage(stage);
  };

  const handleAnalyze = async () => {
    if (!selectedStage || !inputValue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a mode and provide input",
        variant: "destructive"
      });
      return;
    }

    if (!canUseToday) {
      toast({
        title: "Daily Limit Reached", 
        description: "Upgrade your plan for more daily analysis",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Implementation of analysis API call
      // This would connect to the existing newspaper analysis flow
      // but with stage-specific parameters
      
      console.log('Analyzing with:', {
        stage: selectedStage,
        input: inputValue,
        method: selectedInputMethod,
        language
      });
      
      // Navigate to results page with parameters
      // router.push(`/newspaper-analysis/results?stage=${selectedStage}&method=${selectedInputMethod}`);
      
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedMethod = INPUT_METHODS.find(m => m.id === selectedInputMethod);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{userProgress.dailyAnalysisUsed}/{tierInfo.dailyLimit === -1 ? '∞' : tierInfo.dailyLimit} used today</span>
              </div>
              <Badge variant="secondary">{userProgress.tier.toUpperCase()}</Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl font-bold mb-4">
            AI-Powered Current Affairs Analysis
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform news articles into UPSC-ready knowledge with stage-specific analysis designed for your preparation level.
          </p>
        </div>

        {/* Stage Selection */}
        {!selectedStage ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Choose Your Preparation Mode</h2>
              <p className="text-muted-foreground">
                Select the analysis depth that matches your current preparation stage
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(STAGE_MODES).map(([stage, mode]) => {
                const isAccessible = tierInfo.modes.includes(stage as keyof typeof STAGE_MODES);
                const isRecommended = stage === userProgress.currentStage;
                
                return (
                  <StageCard
                    key={stage}
                    stage={stage as keyof typeof STAGE_MODES}
                    mode={mode}
                    isAccessible={isAccessible}
                    isRecommended={isRecommended}
                    userTier={userProgress.tier}
                    onSelect={handleStageSelect}
                  />
                );
              })}
            </div>

            {/* Upgrade CTA for limited users */}
            {userProgress.tier === 'free' && (
              <Card className="max-w-2xl mx-auto p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="text-center space-y-4">
                  <Star className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="text-xl font-semibold">Unlock Advanced Analysis</h3>
                  <p className="text-muted-foreground">
                    Get unlimited daily analysis, all preparation modes, and advanced features with our premium plans.
                  </p>
                  <Button size="lg">
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Input Form */
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Selected Stage Info */}
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    {STAGE_MODES[selectedStage].name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {STAGE_MODES[selectedStage].description}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedStage(null)}
                >
                  Change Mode
                </Button>
              </div>
            </Card>

            {/* Input Method Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4">How would you like to provide the content?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {INPUT_METHODS.map((method) => (
                  <InputMethodCard
                    key={method.id}
                    method={method}
                    isSelected={selectedInputMethod === method.id}
                    onSelect={setSelectedInputMethod}
                  />
                ))}
              </div>
            </div>

            {/* Input Form */}
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {selectedMethod?.title}
                  </label>
                  {selectedMethod?.inputType === 'textarea' ? (
                    <Textarea
                      placeholder={selectedMethod.placeholder}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      rows={8}
                      className="resize-none"
                    />
                  ) : (
                    <Input
                      type={selectedMethod?.inputType || 'text'}
                      placeholder={selectedMethod?.placeholder}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                  )}
                </div>

                {/* Language Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Analysis Language</label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Tamil">Tamil</SelectItem>
                        <SelectItem value="Bengali">Bengali</SelectItem>
                        <SelectItem value="Telugu">Telugu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <div className="text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Expected duration: {STAGE_MODES[selectedStage].duration}
                    </div>
                  </div>
                </div>

                {/* Analysis Button */}
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleAnalyze}
                  disabled={!inputValue.trim() || isAnalyzing || !canUseToday}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : !canUseToday ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Daily Limit Reached
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Start Analysis
                    </>
                  )}
                </Button>

                {/* Usage Info */}
                <div className="text-center text-sm text-muted-foreground">
                  Analysis will consume 1 of your daily credits
                  {tierInfo.dailyLimit !== -1 && (
                    <span> ({tierInfo.dailyLimit - userProgress.dailyAnalysisUsed} remaining today)</span>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}