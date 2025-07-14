'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Mic, Video, Users, Brain, Award, Clock, Lock, Star, Crown, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// Interview Preparation Stages
const INTERVIEW_STAGES = {
  BASIC_PREPARATION: {
    name: 'Basic Interview Skills',
    description: 'Foundation skills for interview confidence',
    color: 'blue',
    features: [
      'Basic communication training',
      'Common question practice',
      'Confidence building',
      'Body language basics',
      'Mock panel (1 interviewer)'
    ],
    duration: '20-30 minutes',
    interviewers: 1,
    questionTypes: ['Personal background', 'Basic current affairs', 'Simple analytical'],
    targetUsers: 'Interview beginners',
    accessLevel: 'interview_basic'
  },
  PERSONALITY_DEVELOPMENT: {
    name: 'Personality Assessment',
    description: 'Comprehensive personality test simulation',
    color: 'green',
    features: [
      'DAF-based questions',
      'Hobby exploration',
      'Leadership scenarios',
      'Ethical dilemmas',
      'Mock panel (2-3 interviewers)'
    ],
    duration: '45-60 minutes',
    interviewers: 3,
    questionTypes: ['DAF analysis', 'Hobbies & interests', 'Opinion formation', 'Ethical scenarios'],
    targetUsers: 'Interview qualified candidates',
    accessLevel: 'interview_premium'
  },
  BOARD_SIMULATION: {
    name: 'Full Board Simulation',
    description: 'Complete UPSC board experience',
    color: 'purple',
    features: [
      'Full 5-member board',
      'Real-time evaluation',
      'Video analysis',
      'Expert feedback',
      'Multiple rounds'
    ],
    duration: '60-90 minutes',
    interviewers: 5,
    questionTypes: ['Comprehensive', 'Multi-disciplinary', 'Stress testing', 'Administrative'],
    targetUsers: 'Final interview candidates',
    accessLevel: 'interview_elite'
  },
  TOPPER_COACHING: {
    name: 'Elite Coaching',
    description: 'Personalized coaching by successful candidates',
    color: 'gold',
    features: [
      'Human expert mentors',
      'Personalized strategy',
      'Live coaching sessions',
      'Success blueprints',
      'Final preparation'
    ],
    duration: '90-120 minutes',
    interviewers: 'Human experts',
    questionTypes: ['Customized', 'Trend-based', 'Advanced analytical', 'Leadership'],
    targetUsers: 'Top performers seeking excellence',
    accessLevel: 'interview_topper'
  }
};

// Board Member Personas for Different Stages
const BOARD_PERSONAS = {
  BASIC: [
    { name: 'Dr. Chairperson', role: 'Friendly & Encouraging', specialty: 'General questions' }
  ],
  STANDARD: [
    { name: 'Dr. Chairperson', role: 'Balanced', specialty: 'Overall assessment' },
    { name: 'Member 1', role: 'Technical Expert', specialty: 'Optional subject' },
    { name: 'Member 2', role: 'Current Affairs', specialty: 'Recent developments' }
  ],
  FULL_BOARD: [
    { name: 'Dr. Chairperson', role: 'Leadership Assessment', specialty: 'Administrative acumen' },
    { name: 'Member 1', role: 'Subject Expert', specialty: 'Optional subject depth' },
    { name: 'Member 2', role: 'Current Affairs', specialty: 'Contemporary issues' },
    { name: 'Member 3', role: 'Behavioral Analyst', specialty: 'Personality & ethics' },
    { name: 'Member 4', role: 'Stress Tester', specialty: 'Pressure handling' }
  ]
};

// Access Control for Interview Stages
const INTERVIEW_ACCESS = {
  prelims: {
    allowedStages: [],
    message: 'Interview preparation unlocks after Mains qualification'
  },
  mains: {
    allowedStages: [],
    message: 'Interview preparation unlocks after Mains qualification'
  },
  interview: {
    allowedStages: ['BASIC_PREPARATION', 'PERSONALITY_DEVELOPMENT'],
    sessionsPerDay: 3,
    features: ['AI interviews', 'Basic feedback', 'Standard evaluation']
  },
  interviewPremium: {
    allowedStages: ['BASIC_PREPARATION', 'PERSONALITY_DEVELOPMENT', 'BOARD_SIMULATION'],
    sessionsPerDay: 5,
    features: ['All AI features', 'Video analysis', 'Advanced feedback', 'Board simulation']
  },
  interviewElite: {
    allowedStages: ['BASIC_PREPARATION', 'PERSONALITY_DEVELOPMENT', 'BOARD_SIMULATION', 'TOPPER_COACHING'],
    sessionsPerDay: -1, // Unlimited
    features: ['All features', 'Human coaching', 'Personalized strategy', 'Success mentoring']
  }
};

interface InterviewStats {
  tier: keyof typeof INTERVIEW_ACCESS;
  currentStage: 'prelims' | 'mains' | 'interview';
  totalSessions: number;
  averageScore: number;
  sessionsToday: number;
  confidenceLevel: number;
  strongAreas: string[];
  improvementAreas: string[];
  lastSessionFeedback: {
    score: number;
    highlights: string[];
    improvements: string[];
    date: string;
  };
}

// Mock interview stats
const useInterviewStats = (): InterviewStats => {
  return {
    tier: 'interview',
    currentStage: 'interview',
    totalSessions: 8,
    averageScore: 7.8,
    sessionsToday: 1,
    confidenceLevel: 75,
    strongAreas: ['Communication', 'Current Affairs', 'Technical Knowledge'],
    improvementAreas: ['Body Language', 'Stress Management'],
    lastSessionFeedback: {
      score: 8.2,
      highlights: ['Excellent subject knowledge', 'Clear communication', 'Good analytical skills'],
      improvements: ['Improve eye contact', 'Reduce nervous gestures', 'Be more concise'],
      date: '2024-01-15'
    }
  };
};

const InterviewStageCard = ({ stage, stageConfig, isAccessible, isRecommended, onSelect }: {
  stage: keyof typeof INTERVIEW_STAGES;
  stageConfig: typeof INTERVIEW_STAGES[keyof typeof INTERVIEW_STAGES];
  isAccessible: boolean;
  isRecommended: boolean;
  onSelect: (stage: keyof typeof INTERVIEW_STAGES) => void;
}) => {
  const getIconForStage = (stageName: string) => {
    if (stageName.includes('BASIC')) return <Target className="w-6 h-6" />;
    if (stageName.includes('PERSONALITY')) return <Brain className="w-6 h-6" />;
    if (stageName.includes('BOARD')) return <Users className="w-6 h-6" />;
    if (stageName.includes('TOPPER')) return <Crown className="w-6 h-6" />;
    return <Mic className="w-6 h-6" />;
  };

  return (
    <Card className={cn(
      'relative cursor-pointer transition-all duration-300 hover:shadow-lg',
      isAccessible ? 'hover:border-primary' : 'opacity-60',
      isRecommended && 'ring-2 ring-primary ring-offset-2'
    )}>
      {isRecommended && (
        <Badge className="absolute -top-2 -right-2 bg-primary">
          Best For You
        </Badge>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            `bg-${stageConfig.color}-100 text-${stageConfig.color}-600`
          )}>
            {getIconForStage(stage)}
          </div>
          {!isAccessible && <Lock className="w-4 h-4 text-muted-foreground" />}
        </div>
        <CardTitle className="text-lg">{stageConfig.name}</CardTitle>
        <CardDescription>{stageConfig.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <div className="font-medium">{stageConfig.duration}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Panel Size:</span>
            <div className="font-medium">{stageConfig.interviewers} members</div>
          </div>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">Key Features:</span>
          <ul className="mt-2 space-y-1">
            {stageConfig.features.slice(0, 3).map((feature, idx) => (
              <li key={idx} className="text-sm flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">Question Types:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {stageConfig.questionTypes.slice(0, 2).map((type, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            {stageConfig.targetUsers}
          </div>
        </div>
      </CardContent>

      <div className="p-6 pt-0">
        {isAccessible ? (
          <Button className="w-full" onClick={() => onSelect(stage)}>
            <Mic className="w-4 h-4 mr-2" />
            Start Interview
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

const ConfidenceTracker = ({ level }: { level: number }) => {
  const getConfidenceLabel = (level: number) => {
    if (level < 40) return { label: 'Building', color: 'red' };
    if (level < 70) return { label: 'Growing', color: 'yellow' };
    if (level < 85) return { label: 'Confident', color: 'green' };
    return { label: 'Excellent', color: 'emerald' };
  };

  const { label, color } = getConfidenceLabel(level);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Interview Confidence</span>
        <span className={`font-medium text-${color}-600`}>{label}</span>
      </div>
      <Progress value={level} className="h-2" />
      <div className="text-xs text-muted-foreground text-right">{level}%</div>
    </div>
  );
};

export default function MockInterviewRevamped() {
  const { user } = useAuth();
  const { toast } = useToast();
  const interviewStats = useInterviewStats();
  
  const [selectedStage, setSelectedStage] = useState<keyof typeof INTERVIEW_STAGES | null>(null);

  // Check access permissions
  const accessControl = INTERVIEW_ACCESS[interviewStats.tier];
  const canAccessInterview = interviewStats.currentStage === 'interview';
  const sessionsLeft = accessControl.sessionsPerDay === -1 ? 
    Infinity : accessControl.sessionsPerDay - interviewStats.sessionsToday;

  const handleStageSelect = (stage: keyof typeof INTERVIEW_STAGES) => {
    if (sessionsLeft <= 0) {
      toast({
        title: "Daily Limit Reached",
        description: "Upgrade your plan for more interview sessions",
        variant: "destructive"
      });
      return;
    }
    setSelectedStage(stage);
    // Navigate to interview configuration
    console.log('Starting interview session:', stage);
  };

  if (!canAccessInterview) {
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
                <Mic className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold">Interview Preparation Locked</h2>
              <p className="text-muted-foreground">
                Interview preparation is exclusively for candidates who have qualified Mains. 
                Focus on your {interviewStats.currentStage === 'prelims' ? 'Prelims' : 'Mains'} preparation first!
              </p>
              <Button asChild>
                <Link href={interviewStats.currentStage === 'prelims' ? '/daily-quiz' : '/writing-practice'}>
                  {interviewStats.currentStage === 'prelims' ? 'Start Prelims Practice' : 'Continue Mains Practice'}
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
                <Mic className="w-4 h-4" />
                <span>{interviewStats.sessionsToday}/{accessControl.sessionsPerDay === -1 ? '∞' : accessControl.sessionsPerDay} sessions today</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>{interviewStats.averageScore.toFixed(1)}/10 avg score</span>
              </div>
              <Badge variant="secondary">{interviewStats.tier.toUpperCase()}</Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-headline text-4xl font-bold mb-4">
            Mock Interview Preparation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Practice with AI-powered interview panels designed to simulate the actual UPSC interview experience.
          </p>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interviewStats.totalSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold">{interviewStats.averageScore}/10</div>
                <Progress value={interviewStats.averageScore * 10} className="flex-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Strong Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {interviewStats.strongAreas.slice(0, 2).map((area) => (
                  <Badge key={area} variant="default" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confidence Level</CardTitle>
            </CardHeader>
            <CardContent>
              <ConfidenceTracker level={interviewStats.confidenceLevel} />
            </CardContent>
          </Card>
        </div>

        {/* Last Session Feedback */}
        {interviewStats.lastSessionFeedback && (
          <Card className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-green-800">Recent Performance</h3>
                <Badge variant="default" className="bg-green-600">
                  {interviewStats.lastSessionFeedback.score}/10
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Strengths
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {interviewStats.lastSessionFeedback.highlights.map((highlight, idx) => (
                      <li key={idx} className="text-green-600">• {highlight}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Areas to Improve
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {interviewStats.lastSessionFeedback.improvements.map((improvement, idx) => (
                      <li key={idx} className="text-orange-600">• {improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interview Stage Selection */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Choose Interview Type</h2>
            <p className="text-muted-foreground">
              Select the interview format that matches your preparation needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(INTERVIEW_STAGES).map(([stage, stageConfig]) => {
              const isAccessible = accessControl.allowedStages.includes(stage as keyof typeof INTERVIEW_STAGES);
              const isRecommended = interviewStats.totalSessions < 5 && stage === 'BASIC_PREPARATION' ||
                                  interviewStats.totalSessions >= 5 && interviewStats.totalSessions < 15 && stage === 'PERSONALITY_DEVELOPMENT';
              
              return (
                <InterviewStageCard
                  key={stage}
                  stage={stage as keyof typeof INTERVIEW_STAGES}
                  stageConfig={stageConfig}
                  isAccessible={isAccessible}
                  isRecommended={isRecommended}
                  onSelect={handleStageSelect}
                />
              );
            })}
          </div>

          {/* Session Limit Warning */}
          {sessionsLeft <= 1 && sessionsLeft > 0 && (
            <Card className="max-w-2xl mx-auto p-6 bg-yellow-50 border-yellow-200">
              <CardContent className="text-center space-y-4">
                <Clock className="w-12 h-12 text-yellow-600 mx-auto" />
                <h3 className="text-xl font-semibold">Limited Sessions Remaining</h3>
                <p className="text-muted-foreground">
                  You have {sessionsLeft} interview session{sessionsLeft > 1 ? 's' : ''} left today. 
                  Make it count or upgrade for unlimited practice!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Upgrade CTA */}
          {interviewStats.tier === 'interview' && (
            <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="text-center space-y-4">
                <Crown className="w-16 h-16 text-purple-600 mx-auto" />
                <h3 className="text-2xl font-bold">Unlock Elite Interview Training</h3>
                <p className="text-muted-foreground">
                  Get access to full board simulation, video analysis, human expert coaching, and unlimited practice sessions.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  <Badge variant="secondary">Video Analysis</Badge>
                  <Badge variant="secondary">Human Coaching</Badge>
                  <Badge variant="secondary">Unlimited Sessions</Badge>
                  <Badge variant="secondary">Success Mentoring</Badge>
                </div>
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Star className="w-4 h-4 mr-2" />
                  Upgrade to Elite Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}