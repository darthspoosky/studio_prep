'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Icons
import {
  Clock, CheckCircle2, XCircle, Brain, Target, Trophy,
  Zap, BookOpen, BarChart3, Settings, Pause, Play,
  SkipForward, Flag, Lightbulb, TrendingUp, Award,
  Users, Calendar, Timer, Volume2, VolumeX, Accessibility,
  Eye, Keyboard, MousePointer, RefreshCw, Home
} from 'lucide-react';

// Enhanced Types
interface EnhancedQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  tags: string[];
  estimatedTime: number; // in seconds
  previouslyAnswered?: boolean;
  userAccuracy?: number; // percentage for this question type
  aiInsight?: string;
  relatedConcepts?: string[];
  source?: {
    year?: number;
    exam?: string;
    paper?: string;
  };
}

interface QuizConfiguration {
  difficulty: 'adaptive' | 'easy' | 'medium' | 'hard';
  subjects: string[];
  questionCount: number;
  timePerQuestion: number;
  mode: 'practice' | 'test' | 'adaptive' | 'speed';
  enableHints: boolean;
  enableExplanations: boolean;
  shuffleOptions: boolean;
  enableAudio: boolean;
  accessibilityMode: boolean;
  adaptiveAlgorithm: boolean;
}

interface QuizAnalytics {
  timeSpent: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  averageTimePerQuestion: number;
  subjectWisePerformance: Record<string, { correct: number; total: number }>;
  difficultyWisePerformance: Record<string, { correct: number; total: number }>;
  improvementAreas: string[];
  strengths: string[];
  nextRecommendations: string[];
  confidenceScore: number;
  learningVelocity: number;
}

interface UserPreferences {
  preferredDifficulty: string;
  studyTime: number;
  weakAreas: string[];
  strongAreas: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic';
  goals: {
    dailyQuestions: number;
    targetAccuracy: number;
    examDate?: Date;
  };
}

// Enhanced Quiz State Management
interface QuizState {
  currentQuestionIndex: number;
  questions: EnhancedQuestion[];
  answers: Record<string, string>;
  startTime: number;
  pausedTime: number;
  isPaused: boolean;
  isCompleted: boolean;
  timeRemaining: number;
  configuration: QuizConfiguration;
  analytics: Partial<QuizAnalytics>;
  userPreferences: UserPreferences;
  adaptiveInsights: {
    recommendedDifficulty: string;
    focusAreas: string[];
    estimatedReadiness: number;
  };
}

// Enhanced Accessibility Features
const AccessibilityPanel = ({ 
  onSettingsChange 
}: { 
  onSettingsChange: (settings: any) => void 
}) => {
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="h-5 w-5" />
          Accessibility Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Font Size: {fontSize}px</Label>
          <Slider
            value={[fontSize]}
            onValueChange={(value) => {
              setFontSize(value[0]);
              document.documentElement.style.fontSize = `${value[0]}px`;
            }}
            min={12}
            max={24}
            step={1}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="high-contrast">High Contrast Mode</Label>
          <Switch
            id="high-contrast"
            checked={highContrast}
            onCheckedChange={(checked) => {
              setHighContrast(checked);
              document.documentElement.classList.toggle('high-contrast', checked);
            }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="reduced-motion">Reduce Animations</Label>
          <Switch
            id="reduced-motion"
            checked={reducedMotion}
            onCheckedChange={(checked) => {
              setReducedMotion(checked);
              document.documentElement.classList.toggle('reduce-motion', checked);
            }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="screen-reader">Screen Reader Optimized</Label>
          <Switch
            id="screen-reader"
            checked={screenReaderMode}
            onCheckedChange={setScreenReaderMode}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// AI-Powered Adaptive Engine
class AdaptiveQuizEngine {
  private userHistory: any[] = [];
  private performanceModel: any = {};

  analyzeUserPerformance(answers: Record<string, string>, questions: EnhancedQuestion[]) {
    const analysis = {
      accuracy: 0,
      averageTime: 0,
      weakSubjects: [] as string[],
      strongSubjects: [] as string[],
      recommendedDifficulty: 'medium' as string,
      confidenceScore: 0
    };

    // Calculate accuracy
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] && q.options.find(opt => opt.id === answers[q.id])?.isCorrect) {
        correct++;
      }
    });
    analysis.accuracy = (correct / questions.length) * 100;

    // Analyze subject performance
    const subjectPerformance: Record<string, { correct: number; total: number }> = {};
    questions.forEach(q => {
      if (!subjectPerformance[q.subject]) {
        subjectPerformance[q.subject] = { correct: 0, total: 0 };
      }
      subjectPerformance[q.subject].total++;
      if (answers[q.id] && q.options.find(opt => opt.id === answers[q.id])?.isCorrect) {
        subjectPerformance[q.subject].correct++;
      }
    });

    // Determine weak and strong areas
    Object.entries(subjectPerformance).forEach(([subject, perf]) => {
      const accuracy = (perf.correct / perf.total) * 100;
      if (accuracy < 60) {
        analysis.weakSubjects.push(subject);
      } else if (accuracy > 80) {
        analysis.strongSubjects.push(subject);
      }
    });

    // Recommend difficulty based on performance
    if (analysis.accuracy > 85) {
      analysis.recommendedDifficulty = 'hard';
    } else if (analysis.accuracy < 60) {
      analysis.recommendedDifficulty = 'easy';
    }

    analysis.confidenceScore = Math.min(analysis.accuracy * 1.2, 100);

    return analysis;
  }

  generateAdaptiveQuestions(userPreferences: UserPreferences, previousPerformance: any) {
    // AI-powered question selection based on:
    // 1. User's weak areas
    // 2. Previous performance patterns
    // 3. Spaced repetition algorithm
    // 4. Difficulty progression
    
    return {
      questionIds: [],
      reasoning: "Questions selected based on your performance in recent sessions",
      focusAreas: userPreferences.weakAreas,
      estimatedDifficulty: 'medium'
    };
  }
}

// Enhanced Question Component with Rich Features
const EnhancedQuestionCard = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  showExplanation,
  configuration,
  questionNumber,
  totalQuestions,
  timeRemaining,
  onHintRequest,
  onBookmark,
  isBookmarked
}: {
  question: EnhancedQuestion;
  selectedAnswer?: string;
  onAnswerSelect: (optionId: string) => void;
  showExplanation: boolean;
  configuration: QuizConfiguration;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  onHintRequest: () => void;
  onBookmark: () => void;
  isBookmarked: boolean;
}) => {
  const [audioEnabled, setAudioEnabled] = useState(configuration.enableAudio);
  const audioRef = useRef<HTMLAudioElement>(null);

  const readQuestionAloud = useCallback(() => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(question.question);
      utterance.rate = 0.8;
      utterance.voice = speechSynthesis.getVoices().find(voice => 
        voice.name.includes('female') || voice.name.includes('Google')
      ) || speechSynthesis.getVoices()[0];
      speechSynthesis.speak(utterance);
    }
  }, [question.question]);

  const correctOption = question.options.find(opt => opt.isCorrect);
  const selectedOption = question.options.find(opt => opt.id === selectedAnswer);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Question {questionNumber} of {totalQuestions}
            </Badge>
            <Badge variant={
              question.difficulty === 'easy' ? 'secondary' :
              question.difficulty === 'medium' ? 'default' : 'destructive'
            }>
              {question.difficulty}
            </Badge>
            <Badge variant="outline">{question.subject}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {configuration.enableAudio && (
              <Button
                variant="ghost"
                size="sm"
                onClick={readQuestionAloud}
                aria-label="Read question aloud"
              >
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onBookmark}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark question"}
            >
              <Flag className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            </Button>
            
            {configuration.enableHints && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onHintRequest}
                aria-label="Get hint"
              >
                <Lightbulb className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Est. {question.estimatedTime}s
            </span>
          </div>
          
          {question.previouslyAnswered && (
            <Badge variant="secondary" className="text-xs">
              Previously attempted
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h3 className="text-lg font-semibold leading-relaxed">
              {question.question}
            </h3>
          </div>

          <div className="grid gap-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option.id;
              const isCorrect = option.isCorrect;
              const showResult = showExplanation;

              return (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => !showExplanation && onAnswerSelect(option.id)}
                  disabled={showExplanation}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all duration-200",
                    "hover:border-primary/50 focus:border-primary focus:outline-none",
                    "focus:ring-2 focus:ring-primary/20",
                    !showResult && !isSelected && "border-border bg-card hover:bg-accent/50",
                    !showResult && isSelected && "border-primary bg-primary/10",
                    showResult && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                    showResult && !isCorrect && isSelected && "border-red-500 bg-red-50 dark:bg-red-950",
                    showResult && !isCorrect && !isSelected && "border-border bg-muted"
                  )}
                  aria-pressed={isSelected}
                  role="radio"
                  aria-checked={isSelected}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium",
                      !showResult && !isSelected && "border-muted-foreground",
                      !showResult && isSelected && "border-primary bg-primary text-primary-foreground",
                      showResult && isCorrect && "border-green-500 bg-green-500 text-white",
                      showResult && !isCorrect && isSelected && "border-red-500 bg-red-500 text-white"
                    )}>
                      {showResult && isCorrect && <CheckCircle2 className="h-4 w-4" />}
                      {showResult && !isCorrect && isSelected && <XCircle className="h-4 w-4" />}
                      {!showResult && (String.fromCharCode(65 + index))}
                    </div>
                    
                    <span className="flex-1 leading-relaxed">
                      {option.text}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
            >
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Explanation
              </h4>
              <p className="text-sm leading-relaxed">{question.explanation}</p>
              
              {question.relatedConcepts && question.relatedConcepts.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Related Concepts:</p>
                  <div className="flex flex-wrap gap-1">
                    {question.relatedConcepts.map((concept, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {question.aiInsight && (
                <div className="mt-3 p-3 rounded border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950">
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    AI Insight
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {question.aiInsight}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Enhanced Quiz Component
export default function EnhancedProductionQuiz() {
  const { user } = useAuth();
  const router = useRouter();
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfiguration, setShowConfiguration] = useState(true);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const adaptiveEngine = useRef(new AdaptiveQuizEngine());
  
  // Initialize quiz with enhanced configuration
  const initializeQuiz = useCallback(async (config: QuizConfiguration) => {
    setIsLoading(true);
    
    try {
      // In production, this would call the enhanced API
      const mockQuestions: EnhancedQuestion[] = [
        {
          id: '1',
          question: 'Which of the following statements about the Indian Constitution is correct?',
          options: [
            { id: 'a', text: 'It is the shortest constitution in the world', isCorrect: false },
            { id: 'b', text: 'It was adopted on 26th January 1950', isCorrect: false },
            { id: 'c', text: 'It has both rigid and flexible features', isCorrect: true },
            { id: 'd', text: 'It has only fundamental rights, not duties', isCorrect: false }
          ],
          explanation: 'The Indian Constitution is known for its unique blend of rigid and flexible features. Some provisions require a special majority for amendment (rigid), while others can be amended by simple majority (flexible).',
          difficulty: 'medium',
          subject: 'Polity',
          topic: 'Constitutional Framework',
          tags: ['Constitution', 'Amendments', 'Federal Structure'],
          estimatedTime: 90,
          aiInsight: 'This question tests your understanding of constitutional flexibility - a key concept for both Prelims and Mains.',
          relatedConcepts: ['Constitutional Amendments', 'Federal Structure', 'Parliamentary System']
        }
        // More mock questions would be here
      ];

      const newQuizState: QuizState = {
        currentQuestionIndex: 0,
        questions: mockQuestions,
        answers: {},
        startTime: Date.now(),
        pausedTime: 0,
        isPaused: false,
        isCompleted: false,
        timeRemaining: config.questionCount * config.timePerQuestion,
        configuration: config,
        analytics: {},
        userPreferences: {
          preferredDifficulty: config.difficulty,
          studyTime: 60,
          weakAreas: [],
          strongAreas: [],
          learningStyle: 'visual',
          goals: {
            dailyQuestions: 50,
            targetAccuracy: 80
          }
        },
        adaptiveInsights: {
          recommendedDifficulty: 'medium',
          focusAreas: [],
          estimatedReadiness: 75
        }
      };

      setQuizState(newQuizState);
      setShowConfiguration(false);
    } catch (error) {
      console.error('Failed to initialize quiz:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enhanced quiz completion with comprehensive analytics
  const completeQuiz = useCallback(async () => {
    if (!quizState) return;

    const analytics = adaptiveEngine.current.analyzeUserPerformance(
      quizState.answers, 
      quizState.questions
    );

    const finalAnalytics: QuizAnalytics = {
      timeSpent: Date.now() - quizState.startTime - quizState.pausedTime,
      correctAnswers: analytics.accuracy * quizState.questions.length / 100,
      totalQuestions: quizState.questions.length,
      accuracy: analytics.accuracy,
      averageTimePerQuestion: (Date.now() - quizState.startTime) / quizState.questions.length,
      subjectWisePerformance: {},
      difficultyWisePerformance: {},
      improvementAreas: analytics.weakSubjects,
      strengths: analytics.strongSubjects,
      nextRecommendations: [],
      confidenceScore: analytics.confidenceScore,
      learningVelocity: 0.75
    };

    setQuizState(prev => prev ? {
      ...prev,
      isCompleted: true,
      analytics: finalAnalytics
    } : null);
  }, [quizState]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showConfiguration) {
    return <QuizConfigurationPanel onStartQuiz={initializeQuiz} />;
  }

  if (!quizState) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Enhanced Header with Real-time Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  aria-label="Back to dashboard"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">Enhanced Quiz Mode</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Progress: {quizState.currentQuestionIndex + 1}/{quizState.questions.length}
                </div>
                
                <Progress 
                  value={((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100} 
                  className="w-32"
                />

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Quiz Settings</DialogTitle>
                    </DialogHeader>
                    <AccessibilityPanel onSettingsChange={() => {}} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quiz Content */}
        <AnimatePresence mode="wait">
          {!quizState.isCompleted ? (
            <EnhancedQuestionCard
              key={quizState.currentQuestionIndex}
              question={quizState.questions[quizState.currentQuestionIndex]}
              selectedAnswer={quizState.answers[quizState.questions[quizState.currentQuestionIndex]?.id]}
              onAnswerSelect={(optionId) => {
                setQuizState(prev => prev ? {
                  ...prev,
                  answers: {
                    ...prev.answers,
                    [prev.questions[prev.currentQuestionIndex].id]: optionId
                  }
                } : null);
              }}
              showExplanation={false}
              configuration={quizState.configuration}
              questionNumber={quizState.currentQuestionIndex + 1}
              totalQuestions={quizState.questions.length}
              timeRemaining={quizState.timeRemaining}
              onHintRequest={() => {}}
              onBookmark={() => {
                const questionId = quizState.questions[quizState.currentQuestionIndex].id;
                setBookmarkedQuestions(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(questionId)) {
                    newSet.delete(questionId);
                  } else {
                    newSet.add(questionId);
                  }
                  return newSet;
                });
              }}
              isBookmarked={bookmarkedQuestions.has(quizState.questions[quizState.currentQuestionIndex]?.id)}
            />
          ) : (
            <QuizCompletionAnalytics 
              analytics={quizState.analytics as QuizAnalytics}
              onRetakeQuiz={() => setShowConfiguration(true)}
              onGoToDashboard={() => router.push('/dashboard')}
            />
          )}
        </AnimatePresence>

        {/* Enhanced Navigation Controls */}
        {!quizState.isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (quizState.currentQuestionIndex > 0) {
                      setQuizState(prev => prev ? {
                        ...prev,
                        currentQuestionIndex: prev.currentQuestionIndex - 1
                      } : null);
                    }
                  }}
                  disabled={quizState.currentQuestionIndex === 0}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setQuizState(prev => prev ? {
                        ...prev,
                        isPaused: !prev.isPaused
                      } : null);
                    }}
                  >
                    {quizState.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={completeQuiz}
                  >
                    Submit Quiz
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
                      setQuizState(prev => prev ? {
                        ...prev,
                        currentQuestionIndex: prev.currentQuestionIndex + 1
                      } : null);
                    } else {
                      completeQuiz();
                    }
                  }}
                >
                  {quizState.currentQuestionIndex === quizState.questions.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Quiz Configuration Panel Component
const QuizConfigurationPanel = ({ 
  onStartQuiz 
}: { 
  onStartQuiz: (config: QuizConfiguration) => void 
}) => {
  const [config, setConfig] = useState<QuizConfiguration>({
    difficulty: 'adaptive',
    subjects: ['Polity', 'History', 'Geography'],
    questionCount: 20,
    timePerQuestion: 90,
    mode: 'practice',
    enableHints: true,
    enableExplanations: true,
    shuffleOptions: true,
    enableAudio: false,
    accessibilityMode: false,
    adaptiveAlgorithm: true
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6" />
                Enhanced Quiz Configuration
              </CardTitle>
              <CardDescription>
                Configure your personalized quiz experience with AI-powered adaptive learning
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
                  <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  {/* Basic configuration options */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Difficulty Level</Label>
                      <select 
                        className="w-full p-2 border rounded-lg"
                        value={config.difficulty}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          difficulty: e.target.value as any 
                        }))}
                      >
                        <option value="adaptive">🤖 Adaptive (AI-powered)</option>
                        <option value="easy">😊 Easy</option>
                        <option value="medium">😐 Medium</option>
                        <option value="hard">😰 Hard</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Quiz Mode</Label>
                      <select 
                        className="w-full p-2 border rounded-lg"
                        value={config.mode}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          mode: e.target.value as any 
                        }))}
                      >
                        <option value="practice">📚 Practice Mode</option>
                        <option value="test">⏰ Test Mode</option>
                        <option value="adaptive">🎯 Adaptive Learning</option>
                        <option value="speed">⚡ Speed Challenge</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Number of Questions: {config.questionCount}</Label>
                      <Slider
                        value={[config.questionCount]}
                        onValueChange={(value) => setConfig(prev => ({ 
                          ...prev, 
                          questionCount: value[0] 
                        }))}
                        min={5}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Time per Question: {config.timePerQuestion}s</Label>
                      <Slider
                        value={[config.timePerQuestion]}
                        onValueChange={(value) => setConfig(prev => ({ 
                          ...prev, 
                          timePerQuestion: value[0] 
                        }))}
                        min={30}
                        max={300}
                        step={15}
                        className="w-full"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  {/* Advanced options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-hints">Enable Hints & Tips</Label>
                      <Switch
                        id="enable-hints"
                        checked={config.enableHints}
                        onCheckedChange={(checked) => setConfig(prev => ({ 
                          ...prev, 
                          enableHints: checked 
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-explanations">Show Explanations</Label>
                      <Switch
                        id="enable-explanations"
                        checked={config.enableExplanations}
                        onCheckedChange={(checked) => setConfig(prev => ({ 
                          ...prev, 
                          enableExplanations: checked 
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="adaptive-algorithm">AI Adaptive Algorithm</Label>
                      <Switch
                        id="adaptive-algorithm"
                        checked={config.adaptiveAlgorithm}
                        onCheckedChange={(checked) => setConfig(prev => ({ 
                          ...prev, 
                          adaptiveAlgorithm: checked 
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="shuffle-options">Shuffle Answer Options</Label>
                      <Switch
                        id="shuffle-options"
                        checked={config.shuffleOptions}
                        onCheckedChange={(checked) => setConfig(prev => ({ 
                          ...prev, 
                          shuffleOptions: checked 
                        }))}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="accessibility" className="space-y-4">
                  <AccessibilityPanel onSettingsChange={() => {}} />
                </TabsContent>
              </Tabs>

              <div className="flex justify-center pt-6">
                <Button
                  onClick={() => onStartQuiz(config)}
                  size="lg"
                  className="px-8"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Start Enhanced Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

// Quiz Completion Analytics Component
const QuizCompletionAnalytics = ({
  analytics,
  onRetakeQuiz,
  onGoToDashboard
}: {
  analytics: QuizAnalytics;
  onRetakeQuiz: () => void;
  onGoToDashboard: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Quiz Completed!
          </CardTitle>
          <CardDescription>
            Here's your comprehensive performance analysis
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analytics.accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.correctAnswers}/{analytics.totalQuestions}
              </div>
              <div className="text-sm text-muted-foreground">Correct Answers</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(analytics.timeSpent / 1000)}s
              </div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {analytics.confidenceScore.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Confidence Score</div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Strengths
              </h3>
              <ul className="space-y-1">
                {analytics.strengths.map((strength, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {strength}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-500" />
                Areas for Improvement
              </h3>
              <ul className="space-y-1">
                {analytics.improvementAreas.map((area, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-orange-500" />
                    {area}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <Button onClick={onRetakeQuiz} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
            
            <Button onClick={onGoToDashboard}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};