'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Clock, Target, Trophy, Zap, Star, ChevronLeft, ChevronRight,
  Play, Settings, BarChart3, FileQuestion, CheckCircle2, XCircle,
  AlertTriangle, BookOpen, Lightbulb, Timer, Award, TrendingUp
} from 'lucide-react';

// Interfaces matching our backend framework
interface GeneratedQuestion {
  id: string;
  questionText: string;
  type: 'mcq' | 'descriptive' | 'case_study' | 'match_following' | 'assertion_reason';
  examType: 'prelims' | 'mains';
  difficulty: number;
  marks: number;
  timeToSolve: number;
  topicTags: Array<{
    topicId: string;
    topicName: string;
    relevance: number;
  }>;
  options?: Array<{
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
  correctAnswer: string;
  explanation: string;
  hint?: string;
  source: {
    type: 'generated' | 'previous_year' | 'adapted';
    year?: number;
    reference?: string;
  };
  bloom: {
    level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
    skills: string[];
  };
  analytics: {
    predictedDifficulty: number;
    discriminationIndex: number;
    conceptualDepth: number;
    crossTopicConnections: string[];
  };
}

interface TestConfiguration {
  id: string;
  name: string;
  type: 'adaptive' | 'topic_focused' | 'mixed' | 'mock_exam' | 'revision' | 'weak_area';
  examType: 'prelims' | 'mains' | 'both';
  topics: Array<{
    topicId: string;
    weightage: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
    questionCount: number;
  }>;
  constraints: {
    totalQuestions: number;
    timeLimit: number;
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
    };
    questionTypes: {
      mcq: number;
      descriptive: number;
      caseStudy: number;
      currentAffairs: number;
    };
    includeImages: boolean;
    includePreviousYear: boolean;
    maxRepeats: number;
  };
  adaptiveSettings: {
    adjustDifficulty: boolean;
    focusWeakAreas: boolean;
    includeStrengths: boolean;
    learningStyle: 'visual' | 'textual' | 'mixed';
    progressiveComplexity: boolean;
  };
}

interface TestSession {
  id: string;
  configurationId: string;
  questions: GeneratedQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, {
    answer: string;
    timeSpent: number;
    confidence: number;
    flagged: boolean;
  }>;
  startTime: Date;
  endTime?: Date;
  timeRemaining: number;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'submitted';
  analytics: {
    accuracy: number;
    averageTimePerQuestion: number;
    difficultyProgression: number[];
    topicPerformance: Record<string, number>;
  };
}

interface AdaptiveTestGeneratorProps {
  userId: string;
  className?: string;
}

export function AdaptiveTestGenerator({ userId, className }: AdaptiveTestGeneratorProps) {
  const [currentView, setCurrentView] = useState<'configure' | 'test' | 'results'>('configure');
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testConfig, setTestConfig] = useState<Partial<TestConfiguration>>({
    type: 'adaptive',
    examType: 'prelims',
    constraints: {
      totalQuestions: 25,
      timeLimit: 30,
      difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
      questionTypes: { mcq: 80, descriptive: 10, caseStudy: 5, currentAffairs: 5 },
      includeImages: false,
      includePreviousYear: true,
      maxRepeats: 2
    },
    adaptiveSettings: {
      adjustDifficulty: true,
      focusWeakAreas: true,
      includeStrengths: false,
      learningStyle: 'mixed',
      progressiveComplexity: true
    }
  });

  const glassmorphicStyles = {
    card: "relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg",
    container: "relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
  };

  // Mock questions for demo
  const mockQuestions: GeneratedQuestion[] = [
    {
      id: '1',
      questionText: 'Which of the following is the correct constitutional provision for the amendment of the Indian Constitution?',
      type: 'mcq',
      examType: 'prelims',
      difficulty: 6,
      marks: 2,
      timeToSolve: 2,
      topicTags: [
        { topicId: 'gs2_polity_constitution', topicName: 'Constitutional Amendments', relevance: 95 }
      ],
      options: [
        { text: 'Article 356', isCorrect: false, explanation: 'This is about President\'s rule' },
        { text: 'Article 368', isCorrect: true, explanation: 'Correct! Article 368 deals with constitutional amendments' },
        { text: 'Article 370', isCorrect: false, explanation: 'This was about special status to J&K' },
        { text: 'Article 372', isCorrect: false, explanation: 'This is about continuance of existing laws' }
      ],
      correctAnswer: 'Article 368',
      explanation: 'Article 368 provides the procedure for constitutional amendments, including simple majority, special majority, and special majority with state ratification.',
      hint: 'Think about the article that deals with changing the Constitution itself.',
      source: { type: 'generated' },
      bloom: { level: 'remember', skills: ['factual recall', 'constitutional knowledge'] },
      analytics: {
        predictedDifficulty: 6,
        discriminationIndex: 0.75,
        conceptualDepth: 7,
        crossTopicConnections: ['fundamental rights', 'dpsp']
      }
    },
    {
      id: '2',
      questionText: 'Consider the following statements about the Directive Principles of State Policy:\n1. They are justiciable in nature\n2. They guide the state in policy-making\n3. They are enforceable by courts\n4. They complement Fundamental Rights\n\nWhich of the statements given above are correct?',
      type: 'mcq',
      examType: 'prelims',
      difficulty: 7,
      marks: 2,
      timeToSolve: 3,
      topicTags: [
        { topicId: 'gs2_polity_dpsp', topicName: 'Directive Principles', relevance: 90 }
      ],
      options: [
        { text: '1, 2 and 3 only', isCorrect: false },
        { text: '2 and 4 only', isCorrect: true },
        { text: '1, 3 and 4 only', isCorrect: false },
        { text: '1, 2, 3 and 4', isCorrect: false }
      ],
      correctAnswer: '2 and 4 only',
      explanation: 'DPSPs are non-justiciable (not enforceable by courts) but guide state policy and complement Fundamental Rights.',
      source: { type: 'adapted', year: 2022 },
      bloom: { level: 'understand', skills: ['comprehension', 'analysis'] },
      analytics: {
        predictedDifficulty: 7,
        discriminationIndex: 0.68,
        conceptualDepth: 8,
        crossTopicConnections: ['fundamental rights', 'constitution']
      }
    }
  ];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testSession?.status === 'in_progress' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit test when time runs out
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testSession?.status, timeRemaining]);

  const startTest = async () => {
    setLoading(true);
    
    // Mock test generation
    const newSession: TestSession = {
      id: `test_${Date.now()}`,
      configurationId: 'config_1',
      questions: mockQuestions,
      currentQuestionIndex: 0,
      answers: {},
      startTime: new Date(),
      timeRemaining: (testConfig.constraints?.timeLimit || 30) * 60,
      status: 'in_progress',
      analytics: {
        accuracy: 0,
        averageTimePerQuestion: 0,
        difficultyProgression: [],
        topicPerformance: {}
      }
    };
    
    setTestSession(newSession);
    setTimeRemaining(newSession.timeRemaining);
    setCurrentView('test');
    setLoading(false);
  };

  const handleAnswerSubmit = (questionId: string, answer: string) => {
    if (!testSession) return;
    
    setTestSession(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: {
            answer,
            timeSpent: 120, // Mock time spent
            confidence: 7,
            flagged: false
          }
        }
      };
    });
  };

  const navigateQuestion = (direction: 'next' | 'prev') => {
    if (!testSession) return;
    
    setTestSession(prev => {
      if (!prev) return prev;
      
      const newIndex = direction === 'next' 
        ? Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1)
        : Math.max(prev.currentQuestionIndex - 1, 0);
      
      return { ...prev, currentQuestionIndex: newIndex };
    });
  };

  const handleSubmitTest = () => {
    if (!testSession) return;
    
    setTestSession(prev => {
      if (!prev) return prev;
      
      const accuracy = Object.keys(prev.answers).length > 0 
        ? (Object.values(prev.answers).filter((answer, index) => {
            const question = prev.questions[index];
            return question && answer.answer === question.correctAnswer;
          }).length / Object.keys(prev.answers).length) * 100
        : 0;
      
      return {
        ...prev,
        status: 'completed',
        endTime: new Date(),
        analytics: {
          ...prev.analytics,
          accuracy
        }
      };
    });
    
    setCurrentView('results');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = testSession?.questions[testSession.currentQuestionIndex];
  const currentAnswer = testSession?.answers[currentQuestion?.id || ''];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={glassmorphicStyles.container}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-400" />
                Adaptive Test Generator
              </h2>
              <p className="text-foreground/70 mt-1">
                AI-powered test generation with adaptive difficulty
              </p>
            </div>
            
            {currentView === 'test' && testSession && (
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-400">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-foreground/70">Time Remaining</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Configuration View */}
      {currentView === 'configure' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className={glassmorphicStyles.card}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Test Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Settings */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Test Type</Label>
                    <Select 
                      value={testConfig.type} 
                      onValueChange={(value: any) => setTestConfig(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adaptive">Adaptive Test</SelectItem>
                        <SelectItem value="topic_focused">Topic Focused</SelectItem>
                        <SelectItem value="mixed">Mixed Topics</SelectItem>
                        <SelectItem value="mock_exam">Mock Exam</SelectItem>
                        <SelectItem value="revision">Revision Test</SelectItem>
                        <SelectItem value="weak_area">Weak Area Focus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Exam Type</Label>
                    <Select 
                      value={testConfig.examType} 
                      onValueChange={(value: any) => setTestConfig(prev => ({ ...prev, examType: value }))}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prelims">Prelims</SelectItem>
                        <SelectItem value="mains">Mains</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Number of Questions</Label>
                    <div className="mt-2">
                      <Slider
                        value={[testConfig.constraints?.totalQuestions || 25]}
                        onValueChange={([value]) => setTestConfig(prev => ({
                          ...prev,
                          constraints: { ...prev.constraints!, totalQuestions: value }
                        }))}
                        max={100}
                        min={5}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-foreground/60 mt-1">
                        <span>5</span>
                        <span className="font-medium">{testConfig.constraints?.totalQuestions || 25}</span>
                        <span>100</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Time Limit (minutes)</Label>
                    <div className="mt-2">
                      <Slider
                        value={[testConfig.constraints?.timeLimit || 30]}
                        onValueChange={([value]) => setTestConfig(prev => ({
                          ...prev,
                          constraints: { ...prev.constraints!, timeLimit: value }
                        }))}
                        max={180}
                        min={10}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-foreground/60 mt-1">
                        <span>10</span>
                        <span className="font-medium">{testConfig.constraints?.timeLimit || 30}</span>
                        <span>180</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Adaptive Settings</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="adjustDifficulty"
                          checked={testConfig.adaptiveSettings?.adjustDifficulty}
                          onCheckedChange={(checked) => setTestConfig(prev => ({
                            ...prev,
                            adaptiveSettings: { ...prev.adaptiveSettings!, adjustDifficulty: !!checked }
                          }))}
                        />
                        <Label htmlFor="adjustDifficulty" className="text-sm">Adjust difficulty based on performance</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="focusWeakAreas"
                          checked={testConfig.adaptiveSettings?.focusWeakAreas}
                          onCheckedChange={(checked) => setTestConfig(prev => ({
                            ...prev,
                            adaptiveSettings: { ...prev.adaptiveSettings!, focusWeakAreas: !!checked }
                          }))}
                        />
                        <Label htmlFor="focusWeakAreas" className="text-sm">Focus on weak areas</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includePreviousYear"
                          checked={testConfig.constraints?.includePreviousYear}
                          onCheckedChange={(checked) => setTestConfig(prev => ({
                            ...prev,
                            constraints: { ...prev.constraints!, includePreviousYear: !!checked }
                          }))}
                        />
                        <Label htmlFor="includePreviousYear" className="text-sm">Include previous year questions</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="progressiveComplexity"
                          checked={testConfig.adaptiveSettings?.progressiveComplexity}
                          onCheckedChange={(checked) => setTestConfig(prev => ({
                            ...prev,
                            adaptiveSettings: { ...prev.adaptiveSettings!, progressiveComplexity: !!checked }
                          }))}
                        />
                        <Label htmlFor="progressiveComplexity" className="text-sm">Progressive complexity</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Difficulty Distribution</Label>
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Easy</span>
                          <span>{testConfig.constraints?.difficultyDistribution.easy}%</span>
                        </div>
                        <Slider
                          value={[testConfig.constraints?.difficultyDistribution.easy || 30]}
                          onValueChange={([value]) => {
                            const remaining = 100 - value;
                            const medium = Math.min(testConfig.constraints?.difficultyDistribution.medium || 50, remaining);
                            const hard = remaining - medium;
                            setTestConfig(prev => ({
                              ...prev,
                              constraints: { 
                                ...prev.constraints!, 
                                difficultyDistribution: { easy: value, medium, hard }
                              }
                            }));
                          }}
                          max={70}
                          min={10}
                          step={5}
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Medium</span>
                          <span>{testConfig.constraints?.difficultyDistribution.medium}%</span>
                        </div>
                        <Progress value={testConfig.constraints?.difficultyDistribution.medium} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Hard</span>
                          <span>{testConfig.constraints?.difficultyDistribution.hard}%</span>
                        </div>
                        <Progress value={testConfig.constraints?.difficultyDistribution.hard} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="bg-white/20" />
              
              <div className="flex justify-end">
                <Button 
                  onClick={startTest} 
                  disabled={loading}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                >
                  {loading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Test
                </Button>
              </div>
            </CardContent>
          </div>
        </motion.div>
      )}

      {/* Test Taking View */}
      {currentView === 'test' && testSession && currentQuestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Progress Bar */}
          <div className={glassmorphicStyles.card}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Question {testSession.currentQuestionIndex + 1} of {testSession.questions.length}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(timeRemaining)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {currentQuestion.marks} marks
                  </span>
                </div>
              </div>
              <Progress 
                value={((testSession.currentQuestionIndex + 1) / testSession.questions.length) * 100} 
                className="h-2"
              />
            </div>
          </div>

          {/* Question Card */}
          <div className={glassmorphicStyles.card}>
            <div className="p-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white/10 border-white/20">
                    {currentQuestion.type.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="bg-white/10 border-white/20">
                    Difficulty: {currentQuestion.difficulty}/10
                  </Badge>
                  {currentQuestion.source.type === 'previous_year' && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      PYQ {currentQuestion.source.year}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-foreground/70">
                  Estimated time: {currentQuestion.timeToSolve} min
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <h3 className="text-lg font-medium leading-relaxed whitespace-pre-line">
                  {currentQuestion.questionText}
                </h3>
              </div>

              {/* Options (for MCQ) */}
              {currentQuestion.type === 'mcq' && currentQuestion.options && (
                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((option, index) => {
                    const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                    const isSelected = currentAnswer?.answer === option.text;
                    
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                            : 'bg-white/5 border-white/20 hover:bg-white/10'
                        }`}
                        onClick={() => handleAnswerSubmit(currentQuestion.id, option.text)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                            isSelected ? 'border-blue-400 bg-blue-400 text-black' : 'border-white/40'
                          }`}>
                            {optionLabel}
                          </div>
                          <div className="flex-1">{option.text}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Topic Tags */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.topicTags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-white/5 border-white/10 text-xs">
                      {tag.topicName}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => navigateQuestion('prev')}
                  disabled={testSession.currentQuestionIndex === 0}
                  className="bg-white/10 border-white/20"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {testSession.currentQuestionIndex === testSession.questions.length - 1 ? (
                    <Button
                      onClick={handleSubmitTest}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Submit Test
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigateQuestion('next')}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results View */}
      {currentView === 'results' && testSession && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Results Summary */}
          <div className={glassmorphicStyles.card}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {Math.round(testSession.analytics.accuracy)}%
                  </div>
                  <div className="text-sm text-foreground/70">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {Object.keys(testSession.answers).length}
                  </div>
                  <div className="text-sm text-foreground/70">Attempted</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {Math.round(((testSession.endTime?.getTime() || Date.now()) - testSession.startTime.getTime()) / 60000)}
                  </div>
                  <div className="text-sm text-foreground/70">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-400">
                    {Math.round(testSession.analytics.accuracy / 10)}
                  </div>
                  <div className="text-sm text-foreground/70">Performance</div>
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button onClick={() => setCurrentView('configure')}>
                  Take Another Test
                </Button>
                <Button variant="outline" className="bg-white/10 border-white/20">
                  View Detailed Analysis
                </Button>
              </div>
            </CardContent>
          </div>
        </motion.div>
      )}
    </div>
  );
}