'use client';

import React, { useReducer, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  RefreshCw,
  BookOpen,
  Target,
  Trophy,
  Pause,
  Play,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Flag,
  BarChart3,
  Home
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EnhancedCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/enhanced-card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { glassmorphism } from '@/lib/design-system';
import MobileLayout from '@/components/layout/mobile-layout';

// Types
interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source?: string;
  image?: string;
}

interface QuizConfig {
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount: number;
  timePerQuestion: number;
  showExplanation: boolean;
}

interface QuizState {
  status: 'idle' | 'loading' | 'active' | 'paused' | 'completed' | 'reviewing' | 'error';
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: (number | null)[];
  timeRemaining: number;
  score: number;
  config: QuizConfig | null;
  startTime: Date | null;
  endTime: Date | null;
  error: string | null;
}

type QuizAction = 
  | { type: 'SET_CONFIG'; payload: QuizConfig }
  | { type: 'LOAD_QUESTIONS'; payload: Question[] }
  | { type: 'START_QUIZ' }
  | { type: 'PAUSE_QUIZ' }
  | { type: 'RESUME_QUIZ' }
  | { type: 'ANSWER_QUESTION'; payload: { index: number; answer: number } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'TICK_TIMER' }
  | { type: 'COMPLETE_QUIZ' }
  | { type: 'RESET_QUIZ' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'ENTER_REVIEW_MODE' };

const initialState: QuizState = {
  status: 'idle',
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: [],
  timeRemaining: 0,
  score: 0,
  config: null,
  startTime: null,
  endTime: null,
  error: null,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    
    case 'LOAD_QUESTIONS':
      return { 
        ...state, 
        questions: action.payload,
        userAnswers: new Array(action.payload.length).fill(null),
        timeRemaining: (state.config?.timePerQuestion || 60) * 60, // Convert to seconds
        status: 'active',
        startTime: new Date()
      };
    
    case 'PAUSE_QUIZ':
      return { ...state, status: 'paused' };
    
    case 'RESUME_QUIZ':
      return { ...state, status: 'active' };
    
    case 'ANSWER_QUESTION':
      const newAnswers = [...state.userAnswers];
      newAnswers[action.payload.index] = action.payload.answer;
      return { ...state, userAnswers: newAnswers };
    
    case 'NEXT_QUESTION':
      return { 
        ...state, 
        currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.questions.length - 1) 
      };
    
    case 'PREVIOUS_QUESTION':
      return { 
        ...state, 
        currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0) 
      };
    
    case 'TICK_TIMER':
      const newTime = Math.max(0, state.timeRemaining - 1);
      return { 
        ...state, 
        timeRemaining: newTime,
        ...(newTime === 0 && { status: 'completed', endTime: new Date() })
      };
    
    case 'COMPLETE_QUIZ':
      const score = state.userAnswers.reduce((total, answer, index) => {
        return total + (answer === state.questions[index]?.correctAnswer ? 1 : 0);
      }, 0);
      
      return { 
        ...state, 
        status: 'completed',
        score,
        endTime: new Date()
      };
    
    case 'ENTER_REVIEW_MODE':
      return { ...state, status: 'reviewing' };
    
    case 'RESET_QUIZ':
      return initialState;
    
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.payload };
    
    default:
      return state;
  }
}

// Mock data for demonstration
const mockQuestions: Question[] = [
  {
    id: '1',
    question: 'Which of the following is the capital of India?',
    options: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'],
    correctAnswer: 1,
    explanation: 'Delhi is the capital of India and serves as the seat of the Government of India.',
    category: 'Geography',
    difficulty: 'easy',
    source: 'NCERT Class 6'
  },
  {
    id: '2',
    question: 'The Indian Constitution was adopted on which date?',
    options: ['26 January 1950', '15 August 1947', '26 November 1949', '2 October 1947'],
    correctAnswer: 2,
    explanation: 'The Indian Constitution was adopted on 26 November 1949, and it came into effect on 26 January 1950.',
    category: 'Polity',
    difficulty: 'medium',
    source: 'Constitutional History'
  },
  {
    id: '3',
    question: 'Which river is known as the Ganga of the South?',
    options: ['Godavari', 'Krishna', 'Kaveri', 'Narmada'],
    correctAnswer: 0,
    explanation: 'The Godavari is often referred to as the Ganga of the South due to its length and cultural significance.',
    category: 'Geography',
    difficulty: 'medium',
    source: 'Indian Geography'
  },
];

export default function EnhancedDailyQuizPage() {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const { toast } = useToast();
  const { trackToolUsage } = useAppStore();
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.status === 'active' && state.timeRemaining > 0) {
      interval = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.status, state.timeRemaining]);
  
  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Clean up all timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  // Track tool usage
  useEffect(() => {
    if (state.status === 'active') {
      trackToolUsage('daily-quiz');
    }
  }, [state.status, trackToolUsage]);

  const handleStartQuiz = useCallback(async (config: QuizConfig) => {
    try {
      dispatch({ type: 'SET_CONFIG', payload: config });
      
      // In a real app, you would fetch questions from an API
      // For demo purposes, we'll use mock data
      const questionTimeout = setTimeout(() => {
        dispatch({ type: 'LOAD_QUESTIONS', payload: mockQuestions });
      }, 1000);
      
      timeoutRefs.current.push(questionTimeout);
      
    } catch (error) {
      console.error('Error starting quiz:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load questions' });
    }
  }, []);

  const handleAnswer = useCallback((answer: number) => {
    dispatch({ 
      type: 'ANSWER_QUESTION', 
      payload: { index: state.currentQuestionIndex, answer } 
    });
    
    // Auto-advance to next question after a short delay
    const advanceTimeout = setTimeout(() => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        dispatch({ type: 'NEXT_QUESTION' });
      } else {
        dispatch({ type: 'COMPLETE_QUIZ' });
      }
    }, 500);
    
    timeoutRefs.current.push(advanceTimeout);
  }, [state.currentQuestionIndex, state.questions.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <MobileLayout>
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {state.status === 'idle' && (
            <motion.div
              key="quiz-setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <QuizSetupScreen onStart={handleStartQuiz} />
            </motion.div>
          )}
          
          {state.status === 'loading' && (
            <motion.div
              key="quiz-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[400px]"
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading questions...</p>
              </div>
            </motion.div>
          )}
          
          {(state.status === 'active' || state.status === 'paused') && (
            <motion.div
              key="quiz-active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <QuizActiveScreen 
                state={state} 
                dispatch={dispatch}
                onAnswer={handleAnswer}
                formatTime={formatTime}
              />
            </motion.div>
          )}
          
          {state.status === 'completed' && (
            <motion.div
              key="quiz-completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <QuizCompletedScreen 
                state={state} 
                dispatch={dispatch}
                onRestart={() => dispatch({ type: 'RESET_QUIZ' })}
              />
            </motion.div>
          )}
          
          {state.status === 'reviewing' && (
            <motion.div
              key="quiz-review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <QuizReviewScreen 
                state={state} 
                dispatch={dispatch}
              />
            </motion.div>
          )}
          
          {state.status === 'error' && (
            <motion.div
              key="quiz-error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ErrorScreen 
                error={state.error} 
                onRetry={() => dispatch({ type: 'RESET_QUIZ' })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}

// Quiz Setup Screen Component
function QuizSetupScreen({ onStart }: { onStart: (config: QuizConfig) => void }) {
  const [config, setConfig] = React.useState<QuizConfig>({
    category: 'mixed',
    difficulty: 'mixed',
    questionCount: 10,
    timePerQuestion: 2,
    showExplanation: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Daily Quiz</h1>
        <p className="text-muted-foreground">Configure your practice session</p>
      </div>

      {/* Configuration Card */}
      <EnhancedCard className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Quiz Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select 
                  value={config.category}
                  onChange={(e) => setConfig(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="mixed">Mixed Topics</option>
                  <option value="history">History</option>
                  <option value="geography">Geography</option>
                  <option value="polity">Polity</option>
                  <option value="economy">Economy</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <select 
                  value={config.difficulty}
                  onChange={(e) => setConfig(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="mixed">Mixed</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Number of Questions</label>
                <select 
                  value={config.questionCount}
                  onChange={(e) => setConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Time per Question</label>
                <select 
                  value={config.timePerQuestion}
                  onChange={(e) => setConfig(prev => ({ ...prev, timePerQuestion: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value={1}>1 minute</option>
                  <option value={2}>2 minutes</option>
                  <option value={3}>3 minutes</option>
                  <option value={5}>5 minutes</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showExplanation"
              checked={config.showExplanation}
              onChange={(e) => setConfig(prev => ({ ...prev, showExplanation: e.target.checked }))}
            />
            <label htmlFor="showExplanation" className="text-sm">
              Show explanations after each question
            </label>
          </div>
        </div>
      </EnhancedCard>

      {/* Start Button */}
      <div className="text-center">
        <Button 
          onClick={() => onStart(config)}
          size="lg"
          className="px-8"
        >
          Start Quiz
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Quiz Active Screen Component
function QuizActiveScreen({ 
  state, 
  dispatch, 
  onAnswer, 
  formatTime 
}: {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  onAnswer: (answer: number) => void;
  formatTime: (seconds: number) => string;
}) {
  const currentQuestion = state.questions[state.currentQuestionIndex];
  const progress = ((state.currentQuestionIndex + 1) / state.questions.length) * 100;

  if (!currentQuestion) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/daily-quiz" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Daily Quiz</h1>
            <p className="text-sm text-muted-foreground">
              Question {state.currentQuestionIndex + 1} of {state.questions.length}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className={cn(
              "font-mono text-sm",
              state.timeRemaining < 60 && "text-red-500"
            )}>
              {formatTime(state.timeRemaining)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: state.status === 'active' ? 'PAUSE_QUIZ' : 'RESUME_QUIZ' })}
          >
            {state.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <EnhancedCard className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{currentQuestion.category}</Badge>
            <Badge variant="outline">{currentQuestion.difficulty}</Badge>
          </div>
          
          <h2 className="text-xl font-medium">
            {currentQuestion.question}
          </h2>
          
          {currentQuestion.image && (
            <img 
              src={currentQuestion.image} 
              alt="Question" 
              className="max-w-full h-auto rounded-lg"
            />
          )}
        </div>
      </EnhancedCard>

      {/* Options */}
      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
          >
            <Button
              variant="outline"
              className="w-full justify-start p-4 h-auto text-left"
              onClick={() => onAnswer(index)}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center text-sm">
                  {String.fromCharCode(65 + index)}
                </div>
                <span>{option}</span>
              </div>
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => dispatch({ type: 'PREVIOUS_QUESTION' })}
          disabled={state.currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <Button
          onClick={() => dispatch({ type: 'COMPLETE_QUIZ' })}
          variant="destructive"
        >
          <Flag className="h-4 w-4 mr-2" />
          End Quiz
        </Button>
        
        <Button
          onClick={() => dispatch({ type: 'NEXT_QUESTION' })}
          disabled={state.currentQuestionIndex === state.questions.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Quiz Completed Screen Component
function QuizCompletedScreen({ 
  state, 
  dispatch, 
  onRestart 
}: {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  onRestart: () => void;
}) {
  const accuracy = Math.round((state.score / state.questions.length) * 100);
  const timeTaken = state.startTime && state.endTime 
    ? Math.round((state.endTime.getTime() - state.startTime.getTime()) / 1000)
    : 0;

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Trophy className="h-10 w-10 text-primary" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold">Quiz Completed!</h1>
          <p className="text-muted-foreground mt-2">
            Great job! Here's how you performed
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EnhancedCard className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{state.score}/{state.questions.length}</div>
            <div className="text-sm text-muted-foreground">Correct Answers</div>
          </div>
        </EnhancedCard>
        
        <EnhancedCard className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{accuracy}%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
        </EnhancedCard>
        
        <EnhancedCard className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}</div>
            <div className="text-sm text-muted-foreground">Time Taken</div>
          </div>
        </EnhancedCard>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={() => dispatch({ type: 'ENTER_REVIEW_MODE' })}
          variant="outline"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Review Answers
        </Button>
        
        <Button onClick={onRestart}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Take Another Quiz
        </Button>
        
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Quiz Review Screen Component
function QuizReviewScreen({ 
  state, 
  dispatch 
}: {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Review Your Answers</h1>
        <p className="text-muted-foreground">
          Learn from your mistakes and understand the concepts better
        </p>
      </div>

      <div className="space-y-4">
        {state.questions.map((question, index) => {
          const userAnswer = state.userAnswers[index];
          const isCorrect = userAnswer === question.correctAnswer;
          
          return (
            <EnhancedCard key={question.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Question {index + 1}</Badge>
                  <Badge variant="outline">{question.category}</Badge>
                  {isCorrect ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                
                <h3 className="font-medium">{question.question}</h3>
                
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={cn(
                        "p-3 rounded-md border",
                        optIndex === question.correctAnswer && "bg-green-50 border-green-200",
                        optIndex === userAnswer && optIndex !== question.correctAnswer && "bg-red-50 border-red-200"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                        <span>{option}</span>
                        {optIndex === question.correctAnswer && (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                        {optIndex === userAnswer && optIndex !== question.correctAnswer && (
                          <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <span className="font-medium">Explanation</span>
                  </div>
                  <p className="text-sm">{question.explanation}</p>
                </div>
              </div>
            </EnhancedCard>
          );
        })}
      </div>

      <div className="text-center">
        <Button onClick={() => dispatch({ type: 'RESET_QUIZ' })}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Take Another Quiz
        </Button>
      </div>
    </div>
  );
}

// Error Screen Component
function ErrorScreen({ 
  error, 
  onRetry 
}: {
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="text-center space-y-4">
      <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
        <XCircle className="h-10 w-10 text-red-500" />
      </div>
      
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground mt-2">
          {error || 'An unexpected error occurred'}
        </p>
      </div>
      
      <Button onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}