"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Footer from "@/components/landing/footer";
import Header from "@/components/layout/header";
import Link from "next/link";
import { ArrowLeft, Loader2, Target, Flame, Timer, Award, Brain, Zap, 
         BookOpen, ChevronRight, CheckCircle, XCircle, HelpCircle, 
         BarChart4, Calendar, RefreshCcw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getUserQuizStats } from '@/services/quizAttemptsService';
import { getUserQuizStreak, createQuizSession, submitQuizAnswer, completeQuizSession, QuizSession as ServiceQuizSession } from '@/services/dailyQuizService';
import { incrementToolUsage } from '@/services/usageService';
import type { MCQ } from "@/ai/flows/daily-quiz-flow";

// Define the types that might be missing
interface QuizAttempt {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  createdAt: Date;
}

interface UsageStats {
  newspaperAnalysis?: number;
  mockInterview?: number;
  dailyQuiz?: number;
  writingPractice?: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: Array<{
    text: string;
    correct: boolean;
  }>;
  explanation: string;
  subject: string;
  difficulty: number;
}

interface QuizSession {
  id: string;
  userId: string;
  questions: QuizQuestion[];
  subject: string;
  difficulty: string;
  completed: boolean;
  score?: number;
  createdAt: Date;
}

interface QuizStreak {
  currentStreak: number;
  longestStreak: number;
  lastQuizDate: Date | null;
}

interface UserQuizStats {
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number;
}

// Constants for quiz configuration
const SUBJECTS = [
  { value: 'general-studies', label: 'General Studies (Polity, History, Geo)' },
  { value: 'quantitative-aptitude', label: 'Quantitative Aptitude (CSAT)' },
  { value: 'reasoning', label: 'Logical Reasoning & Data Interpretation' },
  { value: 'english', label: 'English & Comprehension' },
  { value: 'current-affairs', label: 'Current Affairs & GK' },
];

const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy" }, 
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "adaptive", label: "Adaptive (AI)" },
];

const QUESTION_COUNTS = [
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "15", label: "15" },
  { value: "20", label: "20" },
];

// Enums for quiz states
enum QuizState {
  CONFIG = 'CONFIG',
  LOADING = 'LOADING',
  ACTIVE = 'ACTIVE',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

// Question timer component
function QuestionTimer({ seconds, onComplete }: { seconds: number, onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, onComplete]);
  
  const percentage = (timeLeft / seconds) * 100;
  
  return (
    <div className="flex items-center gap-2 mb-4">
      <Timer className="h-4 w-4 text-primary" />
      <Progress value={percentage} className="w-full" />
      <span className="text-sm font-medium">{timeLeft}s</span>
    </div>
  );
}

export default function DailyQuizPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // Quiz configuration state
  const [subject, setSubject] = useState<string>('general-studies');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [numQuestions, setNumQuestions] = useState<string>('10');
  const [difficultyLevel, setDifficultyLevel] = useState<number>(2); // medium = 2
  
  // Quiz session state
  const [quizState, setQuizState] = useState<QuizState>(QuizState.CONFIG);
  const [quizSession, setQuizSession] = useState<ServiceQuizSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<Record<number, { selected: string, correct: boolean }>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [streakData, setStreakData] = useState<QuizStreak>({ currentStreak: 0, longestStreak: 0, lastQuizDate: null });
  const [quizStats, setQuizStats] = useState<UserQuizStats>({ totalAttempted: 0, totalCorrect: 0, accuracy: 0 });
  const [usageData, setUsageData] = useState<UsageStats>({ newspaperAnalysis: 0, mockInterview: 0, dailyQuiz: 0, writingPractice: 0 });
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);

  // Load user stats when the component mounts
  useEffect(() => {
    if (user?.uid) {
      const fetchStats = async () => {
        try {
          const stats = await getUserQuizStats(user.uid);
          setQuizStats(stats);
          
          const streak = await getUserQuizStreak(user.uid);
          setStreakData({
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            lastQuizDate: streak.lastQuizDate,
          });
        } catch (error) {
          console.error("Error fetching user stats:", error);
        }
      };
      
      fetchStats();
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  // Handler for starting a new quiz
  const handleStartQuiz = async () => {
    // Validation
    if (!subject || !difficulty || !numQuestions) {
      toast({
        title: "Missing Information",
        description: "Please select a subject, difficulty level, and number of questions.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setQuizState(QuizState.LOADING);
      
      // Record tool usage for this attempt
      if (user?.uid) {
        await incrementToolUsage(user.uid, "dailyQuiz");
      }
      
      // Create a new quiz session
      const session = await createQuizSession(
        user!.uid,
        subject,
        difficulty, // Use string difficulty as the API expects
        parseInt(numQuestions, 10) // Convert numQuestions to number
      );
      
      setQuizSession(session as ServiceQuizSession);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setSelectedAnswer("");
      setShowExplanation(false);
      
      // Set usage data for tracking
      if (session.questions[0]) {
        setUsageData({
          ...usageData,
          dailyQuiz: session.questions.reduce((acc, q) => acc + (q.explanation?.length || 0) / 4, 0),
        });
      }
      
      setQuizState(QuizState.ACTIVE);
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to generate quiz questions. Please try again.",
        variant: "destructive",
      });
      setQuizState(QuizState.ERROR);
    }
  };
  
  // Record a correct or incorrect answer
  const handleAnswerQuestion = async (selectedOption: string) => {
    if (!quizSession || currentQuestionIndex >= quizSession.questions.length) return;

    const currentQuestion = quizSession.questions[currentQuestionIndex];
    const correctOption = currentQuestion.options.find((opt: { text: string; correct: boolean }) => opt.correct);
    const isCorrect = correctOption?.text === selectedOption;

    // Update answers state
    setAnswers((prev: Record<number, { selected: string, correct: boolean }>) => ({
      ...prev,
      [currentQuestionIndex]: {
        selected: selectedOption,
        correct: isCorrect
      }
    }));
    
    try {
      // Save answer to database
      if (quizSession.id && user?.uid) {
        await submitQuizAnswer(
          user.uid, // First parameter should be userId
          quizSession.id,
          currentQuestionIndex,
          selectedOption
        );
      }
    } catch (error) {
      console.error("Error saving answer:", error);
    }
    
    setSelectedAnswer(selectedOption);
    setShowExplanation(true);
  };
  
  // Handler for moving to the next question
  const handleNextQuestion = () => {
    if (!quizSession) return;
    
    if (currentQuestionIndex < quizSession.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer("");
      setShowExplanation(false);
    } else {
      // Quiz completed
      completeQuiz();
    }
  };
  
  // Handler for completing the quiz
  const completeQuiz = async () => {
    if (!quizSession?.id) return;
    
    // Calculate score
    const correctAnswers = Object.values(answers).filter(a => a.correct).length;
    const score = Math.round((correctAnswers / Object.keys(answers).length) * 100);
    
    try {
      await completeQuizSession(quizSession.id, score);
      
      // Update quiz session with score
      setQuizSession(prev => prev ? {
        ...prev,
        completed: true,
        score
      } : null);
      
      setQuizState(QuizState.RESULTS);
      setIsResultsDialogOpen(true);
      
      // Refresh stats
      if (user?.uid) {
        const stats = await getUserQuizStats(user.uid);
        setQuizStats(stats);
        
        const streak = await getUserQuizStreak(user.uid);
        setStreakData({
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastQuizDate: streak.lastQuizDate,
        });
      }
    } catch (error) {
      console.error("Error completing quiz:", error);
      toast({
        title: "Error",
        description: "Failed to save quiz results. Your progress may not be recorded.",
        variant: "destructive",
      });
    }
  };
  
  // Reset the quiz to configuration state
  const resetQuiz = () => {
    setQuizState(QuizState.CONFIG);
    setQuizSession(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setAnswers({});
    setShowExplanation(false);
    setIsResultsDialogOpen(false);
  };
  
  // When user selects a difficulty level
  const handleDifficultyChange = (value: string) => {
    setDifficulty(value);
  };

  // When user selects a number of questions
  const handleQuestionCountChange = (value: string) => {
    setNumQuestions(value);
  };

  // Render functions for each quiz state
  const renderLoadingState = () => {
    return (
      <Card className="glassmorphic shadow-2xl shadow-primary/10 max-w-3xl mx-auto">
        <CardContent className="pt-10 pb-10">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">Generating your quiz</h3>
            <p className="text-muted-foreground">This may take a moment...</p>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderActiveState = () => {
    if (!quizSession) return null;
    
    const currentQuestion = quizSession.questions[currentQuestionIndex];
    if (!currentQuestion) return null;
    
    return (
          <div className="max-w-4xl mx-auto">
            <Card className="glassmorphic shadow-2xl shadow-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="mb-2">
                    {currentQuestion.subject}
                  </Badge>
                  <Badge variant="outline" className="mb-2">
                    Difficulty: {currentQuestion.difficulty}/10
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {quizSession.questions.length}
                  </span>
                  <div className="flex items-center">
                    <Progress 
                      value={((currentQuestionIndex + 1) / quizSession.questions.length) * 100} 
                      className="w-32 h-2"
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                {/* Question text */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">{currentQuestion.question}</h3>
                  
                  {/* Options */}
                  <RadioGroup 
                    value={selectedAnswer} 
                    onValueChange={showExplanation ? undefined : handleAnswerQuestion}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option: { text: string; correct: boolean }, idx: number) => {
                      const isSelected = selectedAnswer === option.text;
                      const isCorrect = option.correct;
                      const showResult = showExplanation;
                      
                      let optionClassName = "relative border-2 rounded-lg p-4 cursor-pointer transition-all";
                      
                      if (showResult) {
                        if (isSelected) {
                          optionClassName += isCorrect 
                            ? " border-green-500 bg-green-50 dark:bg-green-900/20" 
                            : " border-red-500 bg-red-50 dark:bg-red-900/20";
                        } else if (isCorrect) {
                          optionClassName += " border-green-500 bg-green-50 dark:bg-green-900/20";
                        } else {
                          optionClassName += " opacity-50";
                        }
                      } else {
                        optionClassName += isSelected 
                          ? " border-primary" 
                          : " border-muted-foreground/20 hover:border-muted-foreground/50";
                      }
                      
                      return (
                        <div key={idx} className={optionClassName}>
                          <RadioGroupItem 
                            value={option.text} 
                            id={`option-${idx}`} 
                            className="absolute left-4 top-4"
                            disabled={showExplanation}
                          />
                          <label 
                            htmlFor={`option-${idx}`} 
                            className="pl-7 block cursor-pointer"
                          >
                            {option.text}
                          </label>
                          
                          {/* Show correct/incorrect icons when explanation is visible */}
                          {showResult && (
                            <div className="absolute right-4 top-4">
                              {isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : isSelected ? (
                                <XCircle className="h-5 w-5 text-red-500" />
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
                
                {/* Explanation */}
                <AnimatePresence>
                  {showExplanation && currentQuestion.explanation && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6"
                    >
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="text-base flex items-center">
                            <Brain className="mr-2 h-4 w-4" /> Explanation
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2 text-sm">
                          <p className="text-muted-foreground">{currentQuestion.explanation}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={resetQuiz}
                >
                  Quit Quiz
                </Button>
                
                {showExplanation ? (
                  <Button onClick={handleNextQuestion}>
                    {currentQuestionIndex < quizSession.questions.length - 1 ? (
                      <>Next Question <ChevronRight className="ml-2 h-4 w-4" /></>
                    ) : (
                      <>Complete Quiz <CheckCircle className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    disabled={!selectedAnswer}
                    onClick={() => setShowExplanation(true)}
                  >
                    Check Answer
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        );
  };
  
  const renderResultsState = () => {
    if (!quizSession) return null;
    
    const totalQuestions = quizSession.questions.length;
    const correctAnswers = Object.values(answers).filter(a => a.correct).length;
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    return (
          <Card className="glassmorphic shadow-2xl shadow-primary/10 max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">
                <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                  Quiz Results
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-8">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl font-bold">{scorePercentage}%</span>
                  </div>
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="#e2e8f0" 
                      strokeWidth="8"
                    />
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="8"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * scorePercentage) / 100}
                      className="text-primary transform -rotate-90 origin-center"
                    />
                  </svg>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold">{correctAnswers}</p>
                    <p className="text-sm text-muted-foreground">Correct</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold">{totalQuestions - correctAnswers}</p>
                    <p className="text-sm text-muted-foreground">Incorrect</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold">{quizSession.difficulty}</p>
                    <p className="text-sm text-muted-foreground">Difficulty</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold">{totalQuestions}</p>
                    <p className="text-sm text-muted-foreground">Questions</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button variant="outline" onClick={resetQuiz}>
                <RefreshCcw className="mr-2 h-4 w-4" /> New Quiz
              </Button>
              <Button onClick={() => setIsResultsDialogOpen(true)}>
                <BarChart4 className="mr-2 h-4 w-4" /> View Analysis
              </Button>
            </CardFooter>
          </Card>
        );
  };

  const renderErrorState = () => {
    return (
      <Card className="glassmorphic shadow-2xl shadow-primary/10 max-w-3xl mx-auto">
        <CardContent className="pt-10 pb-10">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <XCircle className="h-12 w-12 text-red-500" />
            <h3 className="text-xl font-semibold">Something went wrong</h3>
            <p className="text-muted-foreground max-w-md">
              We couldn&apos;t generate your quiz questions. This might be due to a network issue or our AI service being temporarily unavailable.
            </p>
            <Button onClick={resetQuiz}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderConfigState = () => {
    return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Quiz Configuration */}
            <div className="lg:col-span-2">
              <Card className="glassmorphic shadow-2xl shadow-primary/10">
                <CardHeader>
                  <CardTitle>Set Up Your Quiz</CardTitle>
                  <CardDescription>Customize your quiz to focus on what you need.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map(item => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="num-questions">Number of Questions</Label>
                    <Select value={numQuestions} onValueChange={setNumQuestions}>
                      <SelectTrigger id="num-questions">
                        <SelectValue placeholder="Select number of questions" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUESTION_COUNTS.map(item => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select
                      value={difficulty}
                      onValueChange={handleDifficultyChange}
                    >
                      <SelectTrigger id="difficulty">
                        <SelectValue placeholder="Select a difficulty level" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map(item => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button size="lg" className="w-full" onClick={handleStartQuiz} disabled={quizState === QuizState.LOADING as QuizState}>
                    {quizState === QuizState.LOADING as QuizState ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Preparing Quiz...
                      </>
                    ) : (
                      <>Start Quiz</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
            {/* Right Column: Stats */}
            <div className="lg:col-span-1">
              <Card className="glassmorphic shadow-2xl shadow-primary/10">
                <CardHeader>
                  <CardTitle>Your Progress</CardTitle>
                  <CardDescription>Keep track of your stats.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center">
                    <Flame className="w-5 h-5 text-primary mr-3"/>
                    <span className="font-medium">Daily Streak</span>
                    <span className="ml-auto font-bold text-lg">{streakData.currentStreak} Days</span>
                  </div>
                   <div className="flex items-center">
                    <Target className="w-5 h-5 text-primary mr-3"/>
                    <span className="font-medium">Overall Accuracy</span>
                    <span className="ml-auto font-bold text-lg">{quizStats.accuracy}%</span>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Weekly Goal</Label>
                    <div className="flex items-center gap-3">
                      <Progress value={(quizStats.totalAttempted / 10) * 100} className="w-full" />
                      <span className="text-sm font-semibold">{quizStats.totalAttempted}/10</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
  };
  
  // Main render switch that calls the appropriate render function
  const renderQuizContent = () => {
    switch (quizState) {
      case QuizState.LOADING:
        return renderLoadingState();
      case QuizState.ACTIVE:
        return renderActiveState();
      case QuizState.RESULTS:
        return renderResultsState();
      case QuizState.ERROR:
        return renderErrorState();
      case QuizState.CONFIG:
      default:
        return renderConfigState();
    }
  };
  
  // Results dialog for detailed question review
  const ResultsDialog = () => {
    if (!quizSession) return null;
    
    return (
      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Detailed Quiz Analysis</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-6 -mr-6">
            <div className="space-y-6 pb-6">
              {quizSession.questions.map((question: any, idx: number) => {
                const answer = answers[idx];
                const isAnswered = !!answer;
                const isCorrect = answer?.correct;
                
                return (
                  <Card key={idx} className={cn(
                    "overflow-hidden border-l-4",
                    isAnswered 
                      ? isCorrect 
                        ? "border-l-green-500" 
                        : "border-l-red-500"
                      : "border-l-yellow-500"
                  )}>
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          Question {idx + 1}
                        </Badge>
                        {isAnswered && (
                          <Badge variant={isCorrect ? "outline" : "destructive"}>
                            {isCorrect ? "Correct" : "Incorrect"}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <p className="font-medium mb-3">{question.question}</p>
                      
                      <div className="space-y-2 mb-4">
                        {question.options.map((option: { text: string; correct: boolean }, optIdx: number) => {
                          let optionClass = "pl-3 border-l-2 py-1";
                          
                          if (answer?.selected === option.text) {
                            optionClass += option.correct 
                              ? " border-green-500" 
                              : " border-red-500";
                          } else if (option.correct) {
                            optionClass += " border-green-500";
                          } else {
                            optionClass += " border-gray-200 dark:border-gray-700";
                          }
                          
                          return (
                            <div key={optIdx} className={optionClass}>
                              {option.text}
                              {option.correct && (
                                <CheckCircle className="inline-block ml-2 h-4 w-4 text-green-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                        <p><strong>Explanation:</strong> {question.explanation}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="text-center mb-16">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tighter">
            <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
              Daily Quiz
            </span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            Sharpen your knowledge with quick, adaptive quizzes tailored to your exam and progress.
          </p>
        </div>

        {renderQuizContent()}
        <ResultsDialog />
      </main>
      <Footer />
    </div>
  );
}
