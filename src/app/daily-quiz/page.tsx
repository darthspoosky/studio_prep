
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Footer from "@/components/landing/footer";
import Header from "@/components/layout/header";
import Link from "next/link";
import { ArrowLeft, Loader2, Target, Flame, CheckCircle, XCircle, Timer, Award, Brain, Zap, 
         BookOpen, ChevronRight, CheckCircle, XCircle, HelpCircle, 
         BarChart4, Calendar, RefreshCcw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getRandomPrelimsQuestions, type PrelimsQuestionWithContext } from "@/services/historyService";
import { saveQuizAttempt } from "@/services/quizAttemptsService";
import { cn } from "@/lib/utils";

type QuizState = "config" | "loading" | "active" | "results";

const FormattedQuestion = ({ text }: { text: string }) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) {
        return <p className="font-semibold leading-relaxed text-foreground">{text}</p>;
    }
    const firstStatementIndex = lines.findIndex(line => /^\d+\.\s/.test(line.trim()));
    if (firstStatementIndex === -1) {
        return <p className="font-semibold leading-relaxed text-foreground" style={{ whiteSpace: 'pre-line' }}>{text}</p>;
    }
    const preamble = lines.slice(0, firstStatementIndex).join('\n');
    let lastStatementIndex = firstStatementIndex;
    for (let i = firstStatementIndex + 1; i < lines.length; i++) {
        if (/^\d+\.\s/.test(lines[i].trim())) {
            lastStatementIndex = i;
        } else {
            break; 
        }
    }
    const statements = lines.slice(firstStatementIndex, lastStatementIndex + 1);
    const conclusion = lines.slice(lastStatementIndex + 1).join('\n');
    return (
        <div className="font-semibold leading-relaxed text-foreground">
            {preamble && <p className="mb-3" style={{ whiteSpace: 'pre-line' }}>{preamble}</p>}
            <ol className="list-decimal list-inside space-y-2 my-3">
                {statements.map((stmt, index) => (
                    <li key={index} className="pl-2">{stmt.trim().replace(/^\d+\.\s/, '')}</li>
                ))}
            </ol>
            {conclusion && <p className="mt-3" style={{ whiteSpace: 'pre-line' }}>{conclusion}</p>}
        </div>
    );
};

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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [quizState, setQuizState] = useState<QuizState>("config");
  const [questions, setQuestions] = useState<PrelimsQuestionWithContext[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [numQuestions, setNumQuestions] = useState("5");
  
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
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleStartQuiz = async () => {
    if (!user) return;
    setQuizState("loading");
    try {
      const fetchedQuestions = await getRandomPrelimsQuestions(user.uid, parseInt(numQuestions));
      if (fetchedQuestions.length < parseInt(numQuestions)) {
        toast({
          variant: "destructive",
          title: "Not enough questions!",
          description: `We could only find ${fetchedQuestions.length} questions. Please analyze more articles to build your question bank.`,
        });
        if (fetchedQuestions.length === 0) {
            setQuizState("config");
            return;
        }
      }
      setQuestions(fetchedQuestions);
      setScore(0);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setQuizState("active");
    } catch (error) {
      console.error(error);
      toast({
        title: "Coming Soon!",
        description: "The daily quiz feature is under development. Stay tuned!",
      });
      setIsLoading(false);
    }, 1000);
  };  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {

  if (loading || !user) {
    return null;
  }

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Quiz Configuration */}
            <div className="lg:col-span-2">
                <Card className="glassmorphic shadow-2xl shadow-primary/10">
                    <CardHeader>
                        <CardTitle>Set Up Your Quiz</CardTitle>
                        <CardDescription>Customize your quiz to focus on what you need.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Select>
                                <SelectTrigger id="subject">
                                    <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general-studies">General Studies (Polity, History, Geo)</SelectItem>
                                    <SelectItem value="quantitative-aptitude">Quantitative Aptitude (CSAT)</SelectItem>
                                    <SelectItem value="reasoning">Logical Reasoning & Data Interpretation</SelectItem>
                                    <SelectItem value="english">English & Comprehension</SelectItem>
                                    <SelectItem value="current-affairs">Current Affairs & GK</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="num-questions">Number of Questions</Label>
                            <Select>
                                <SelectTrigger id="num-questions">
                                    <SelectValue placeholder="Select number of questions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="15">15</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="difficulty">Difficulty Level</Label>
                            <Select>
                                <SelectTrigger id="difficulty">
                                    <SelectValue placeholder="Select a difficulty level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                    <SelectItem value="adaptive">Adaptive (AI)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full md:w-auto" onClick={handleStartQuiz} disabled={isLoading}>
                            {isLoading && <Loader2 className="animate-spin" />}
                            {isLoading ? "Preparing Quiz..." : "Start Quiz"}
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
                            <span className="ml-auto font-bold text-lg">5 Days</span>
                        </div>
                         <div className="flex items-center">
                            <Target className="w-5 h-5 text-primary mr-3"/>
                            <span className="font-medium">Overall Accuracy</span>
                            <span className="ml-auto font-bold text-lg">82%</span>
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-2 block">Weekly Goal</Label>
                            <div className="flex items-center gap-3">
                                <Progress value={70} className="w-full" />
                                <span className="text-sm font-semibold">7/10</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
