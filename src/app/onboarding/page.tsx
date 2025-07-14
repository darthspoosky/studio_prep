'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowRight, 
  ArrowLeft, 
  Target, 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Star,
  Clock,
  Award,
  Lightbulb,
  Brain,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Onboarding steps configuration
const ONBOARDING_STEPS = [
  'welcome',
  'assessment', 
  'goals',
  'experience',
  'preferences',
  'plan',
  'completion'
] as const;

type OnboardingStep = typeof ONBOARDING_STEPS[number];

// Assessment questions for stage determination
const ASSESSMENT_QUESTIONS = [
  {
    id: 'upsc_knowledge',
    question: 'How familiar are you with the UPSC exam structure?',
    options: [
      { value: 'beginner', label: 'Complete beginner - just starting to explore', weight: 1 },
      { value: 'basic', label: 'Basic idea - know about Prelims, Mains, Interview', weight: 2 },
      { value: 'intermediate', label: 'Good understanding - have studied the syllabus', weight: 3 },
      { value: 'advanced', label: 'Very familiar - have attempted before', weight: 4 }
    ]
  },
  {
    id: 'preparation_time',
    question: 'How long have you been preparing for UPSC?',
    options: [
      { value: 'not_started', label: 'Haven\'t started serious preparation yet', weight: 1 },
      { value: 'few_months', label: 'Few months of preparation', weight: 2 },
      { value: 'one_year', label: 'Around 1 year of preparation', weight: 3 },
      { value: 'multiple_years', label: '2+ years of preparation', weight: 4 }
    ]
  },
  {
    id: 'current_focus',
    question: 'What are you currently focusing on?',
    options: [
      { value: 'foundation', label: 'Building foundation with NCERT and basics', weight: 1 },
      { value: 'prelims', label: 'Prelims preparation - MCQs and current affairs', weight: 2 },
      { value: 'mains', label: 'Mains preparation - answer writing', weight: 3 },
      { value: 'interview', label: 'Interview preparation', weight: 4 }
    ]
  },
  {
    id: 'mock_tests',
    question: 'How many full-length mock tests have you attempted?',
    options: [
      { value: 'none', label: 'None yet', weight: 1 },
      { value: 'few', label: '1-5 mock tests', weight: 2 },
      { value: 'regular', label: '5-15 mock tests', weight: 3 },
      { value: 'extensive', label: '15+ mock tests', weight: 4 }
    ]
  }
];

// Goals configuration
const PREPARATION_GOALS = [
  {
    id: 'timeline',
    title: 'Target Exam Year',
    options: [
      { value: '2025', label: 'UPSC 2025', recommended: false },
      { value: '2026', label: 'UPSC 2026', recommended: true },
      { value: '2027', label: 'UPSC 2027', recommended: false },
      { value: 'flexible', label: 'Flexible timeline', recommended: false }
    ]
  },
  {
    id: 'services',
    title: 'Preferred Services',
    options: [
      { value: 'ias', label: 'Indian Administrative Service (IAS)' },
      { value: 'ips', label: 'Indian Police Service (IPS)' },
      { value: 'ifs', label: 'Indian Foreign Service (IFS)' },
      { value: 'other_central', label: 'Other Central Services' },
      { value: 'undecided', label: 'Still exploring options' }
    ]
  }
];

// Experience configuration
const EXPERIENCE_QUESTIONS = [
  {
    id: 'educational_background',
    question: 'Educational Background',
    type: 'select',
    options: [
      'Engineering',
      'Medical',
      'Liberal Arts',
      'Commerce',
      'Science',
      'Law',
      'Management',
      'Other'
    ]
  },
  {
    id: 'work_experience',
    question: 'Work Experience',
    type: 'select',
    options: [
      'Student (No work experience)',
      'Less than 2 years',
      '2-5 years',
      '5-10 years',
      'More than 10 years'
    ]
  },
  {
    id: 'optional_subject',
    question: 'Preferred Optional Subject (if decided)',
    type: 'select',
    options: [
      'Not decided yet',
      'Geography',
      'History',
      'Political Science',
      'Public Administration',
      'Sociology',
      'Psychology',
      'Philosophy',
      'Literature (English)',
      'Literature (Hindi)',
      'Literature (Regional)',
      'Economics',
      'Law',
      'Medical Science',
      'Engineering',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Botany',
      'Zoology',
      'Other'
    ]
  }
];

// Study preferences
const STUDY_PREFERENCES = [
  {
    id: 'study_time',
    question: 'Daily study time availability',
    type: 'radio',
    options: [
      { value: '1-2', label: '1-2 hours/day' },
      { value: '3-4', label: '3-4 hours/day' },
      { value: '5-6', label: '5-6 hours/day' },
      { value: '7+', label: '7+ hours/day' }
    ]
  },
  {
    id: 'learning_style',
    question: 'Preferred learning methods',
    type: 'checkbox',
    options: [
      { value: 'visual', label: 'Visual content (diagrams, infographics)' },
      { value: 'audio', label: 'Audio content (podcasts, lectures)' },
      { value: 'interactive', label: 'Interactive quizzes and games' },
      { value: 'reading', label: 'Traditional reading and notes' },
      { value: 'practice', label: 'Practice tests and mock exams' }
    ]
  },
  {
    id: 'language_preference',
    question: 'Content language preference',
    type: 'radio',
    options: [
      { value: 'english', label: 'English' },
      { value: 'hindi', label: 'Hindi' },
      { value: 'bilingual', label: 'Both English and Hindi' }
    ]
  }
];

interface OnboardingData {
  assessmentAnswers: Record<string, string>;
  goals: Record<string, string>;
  experience: Record<string, string>;
  preferences: Record<string, string | string[]>;
  determinedStage: 'foundation' | 'prelims' | 'mains' | 'interview';
  recommendedPlan: string;
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    assessmentAnswers: {},
    goals: {},
    experience: {},
    preferences: {},
    determinedStage: 'foundation',
    recommendedPlan: 'foundation'
  });

  const currentStepIndex = ONBOARDING_STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100;

  // Calculate user stage based on assessment
  const calculateUserStage = (answers: Record<string, string>) => {
    let totalWeight = 0;
    let answerCount = 0;

    ASSESSMENT_QUESTIONS.forEach(question => {
      const answer = answers[question.id];
      if (answer) {
        const option = question.options.find(opt => opt.value === answer);
        if (option) {
          totalWeight += option.weight;
          answerCount++;
        }
      }
    });

    const averageWeight = answerCount > 0 ? totalWeight / answerCount : 1;

    if (averageWeight <= 1.5) return 'foundation';
    if (averageWeight <= 2.5) return 'prelims';
    if (averageWeight <= 3.5) return 'mains';
    return 'interview';
  };

  const handleNext = () => {
    if (currentStep === 'assessment') {
      const stage = calculateUserStage(onboardingData.assessmentAnswers);
      setOnboardingData(prev => ({ ...prev, determinedStage: stage }));
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < ONBOARDING_STEPS.length) {
      setCurrentStep(ONBOARDING_STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(ONBOARDING_STEPS[prevIndex]);
    }
  };

  const handleComplete = async () => {
    try {
      // Save onboarding data to backend
      console.log('Saving onboarding data:', onboardingData);
      
      toast({
        title: "Welcome to PrepTalk!",
        description: "Your personalized journey starts now.",
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateData = (section: keyof OnboardingData, data: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'assessment':
        return Object.keys(onboardingData.assessmentAnswers).length === ASSESSMENT_QUESTIONS.length;
      case 'goals':
        return Object.keys(onboardingData.goals).length >= 1;
      case 'experience':
        return Object.keys(onboardingData.experience).length >= 2;
      case 'preferences':
        return Object.keys(onboardingData.preferences).length >= 2;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Setup Your Journey</h1>
            <Badge variant="outline">
              Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Welcome Step */}
              {currentStep === 'welcome' && (
                <Card className="p-8 text-center">
                  <CardContent className="space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Star className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold">Welcome to PrepTalk!</h2>
                    <p className="text-lg text-muted-foreground">
                      Let's personalize your UPSC preparation journey. This will take just 3-4 minutes.
                    </p>
                    <div className="grid grid-cols-3 gap-4 pt-6">
                      <div className="text-center">
                        <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-sm font-medium">Assess Level</p>
                      </div>
                      <div className="text-center">
                        <Lightbulb className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium">Set Goals</p>
                      </div>
                      <div className="text-center">
                        <Zap className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <p className="text-sm font-medium">Start Learning</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assessment Step */}
              {currentStep === 'assessment' && (
                <Card className="p-8">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="flex items-center gap-2 justify-center">
                      <Brain className="w-6 h-6 text-primary" />
                      Quick Assessment
                    </CardTitle>
                    <CardDescription>
                      Help us understand your current preparation level
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {ASSESSMENT_QUESTIONS.map((question, index) => (
                      <div key={question.id} className="space-y-4">
                        <h3 className="font-semibold">{index + 1}. {question.question}</h3>
                        <RadioGroup
                          value={onboardingData.assessmentAnswers[question.id] || ''}
                          onValueChange={(value) => 
                            updateData('assessmentAnswers', { [question.id]: value })
                          }
                        >
                          {question.options.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={option.value} />
                              <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Goals Step */}
              {currentStep === 'goals' && (
                <Card className="p-8">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="flex items-center gap-2 justify-center">
                      <Target className="w-6 h-6 text-primary" />
                      Your Goals
                    </CardTitle>
                    <CardDescription>
                      Define your UPSC preparation objectives
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {PREPARATION_GOALS.map((goal) => (
                      <div key={goal.id} className="space-y-4">
                        <h3 className="font-semibold">{goal.title}</h3>
                        <RadioGroup
                          value={onboardingData.goals[goal.id] || ''}
                          onValueChange={(value) => 
                            updateData('goals', { [goal.id]: value })
                          }
                        >
                          {goal.options.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={option.value} />
                              <Label htmlFor={option.value} className="flex-1 cursor-pointer flex items-center gap-2">
                                {option.label}
                                {option.recommended && (
                                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                                )}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Experience Step */}
              {currentStep === 'experience' && (
                <Card className="p-8">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="flex items-center gap-2 justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                      Your Background
                    </CardTitle>
                    <CardDescription>
                      Tell us about your educational and professional background
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {EXPERIENCE_QUESTIONS.map((question) => (
                      <div key={question.id} className="space-y-2">
                        <Label className="text-sm font-medium">{question.question}</Label>
                        <Select
                          value={onboardingData.experience[question.id] || ''}
                          onValueChange={(value) => 
                            updateData('experience', { [question.id]: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {question.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Preferences Step */}
              {currentStep === 'preferences' && (
                <Card className="p-8">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="flex items-center gap-2 justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                      Study Preferences
                    </CardTitle>
                    <CardDescription>
                      Help us personalize your learning experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {STUDY_PREFERENCES.map((pref) => (
                      <div key={pref.id} className="space-y-4">
                        <h3 className="font-semibold">{pref.question}</h3>
                        
                        {pref.type === 'radio' && (
                          <RadioGroup
                            value={onboardingData.preferences[pref.id] as string || ''}
                            onValueChange={(value) => 
                              updateData('preferences', { [pref.id]: value })
                            }
                          >
                            {pref.options.map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.value} id={option.value} />
                                <Label htmlFor={option.value} className="cursor-pointer">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}

                        {pref.type === 'checkbox' && (
                          <div className="space-y-3">
                            {pref.options.map((option) => {
                              const currentValues = (onboardingData.preferences[pref.id] as string[]) || [];
                              return (
                                <div key={option.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={option.value}
                                    checked={currentValues.includes(option.value)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateData('preferences', { 
                                          [pref.id]: [...currentValues, option.value] 
                                        });
                                      } else {
                                        updateData('preferences', { 
                                          [pref.id]: currentValues.filter(v => v !== option.value) 
                                        });
                                      }
                                    }}
                                  />
                                  <Label htmlFor={option.value} className="cursor-pointer">
                                    {option.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Plan Recommendation Step */}
              {currentStep === 'plan' && (
                <Card className="p-8">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="flex items-center gap-2 justify-center">
                      <Award className="w-6 h-6 text-primary" />
                      Your Personalized Plan
                    </CardTitle>
                    <CardDescription>
                      Based on your responses, here's what we recommend
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="text-center space-y-4">
                        <Badge className="text-lg px-4 py-2">
                          {onboardingData.determinedStage.charAt(0).toUpperCase() + onboardingData.determinedStage.slice(1)} Stage
                        </Badge>
                        <h3 className="text-xl font-semibold">
                          {onboardingData.determinedStage === 'foundation' && "Foundation Building"}
                          {onboardingData.determinedStage === 'prelims' && "Prelims Preparation"}  
                          {onboardingData.determinedStage === 'mains' && "Mains Mastery"}
                          {onboardingData.determinedStage === 'interview' && "Interview Excellence"}
                        </h3>
                        <p className="text-muted-foreground">
                          {onboardingData.determinedStage === 'foundation' && "Perfect for building strong fundamentals with NCERT and basic concepts"}
                          {onboardingData.determinedStage === 'prelims' && "Ideal for serious Prelims preparation with comprehensive practice"}
                          {onboardingData.determinedStage === 'mains' && "Designed for Mains qualified candidates focusing on answer writing"}
                          {onboardingData.determinedStage === 'interview' && "Exclusive preparation for interview qualified candidates"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Your personalized features will include:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Stage-appropriate question difficulty</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Customized study schedule</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Progress tracking and analytics</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Personalized content recommendations</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Completion Step */}
              {currentStep === 'completion' && (
                <Card className="p-8 text-center">
                  <CardContent className="space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold">You're All Set!</h2>
                    <p className="text-lg text-muted-foreground">
                      Your personalized UPSC preparation journey is ready. Let's begin!
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-sm font-medium">Smart Schedule</p>
                        <p className="text-xs text-muted-foreground">Optimized for your availability</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium">Progress Tracking</p>
                        <p className="text-xs text-muted-foreground">Real-time performance insights</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 'welcome'}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {currentStep !== 'completion' ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="flex items-center gap-2"
              >
                Start Journey
                <Star className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}