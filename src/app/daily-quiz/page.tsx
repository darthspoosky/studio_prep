

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Target, BarChart4, ChevronRight } from "lucide-react";
import QuizDashboardWidgets from "./components/widgets/QuizDashboardWidgets";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { MCQ } from "@/ai/flows/daily-quiz-flow";
import Link from 'next/link';

// Layout Imports
import MainLayout from '@/app/dashboard/components/layout/MainLayout';
import LeftSidebar from '@/app/dashboard/components/layout/LeftSidebar';
import RightSidebar from '@/app/dashboard/components/layout/RightSidebar';
import MobileHeader from '@/app/dashboard/components/layout/MobileHeader';
import { UserNav } from '@/components/layout/user-nav';
import { getUserUsage, type UsageStats } from '@/services/usageService';
import { getUserQuizStats, type UserQuizStats } from '@/services/quizAttemptsService';

// Define the types that might be missing
interface QuizAttempt {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  createdAt: Date;
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

interface ExtendedUserQuizStats extends UserQuizStats {
    streak: number;
    improvement: number;
}

export default function DailyQuizPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Component State
  const [isLoading, setIsLoading] = useState(false);

  // Layout-related state
  const [quizStats, setQuizStats] = useState<ExtendedUserQuizStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Load user stats for layout
  useEffect(() => {
    if (user?.uid) {
      const fetchStats = async () => {
        try {
          const [stats, usage] = await Promise.all([
            getUserQuizStats(user.uid),
            getUserUsage(user.uid)
          ]);
          setQuizStats({ ...stats, streak: 0, improvement: 0 }); // Add dummy data
          setUsageStats(usage);
        } catch (error) {
          console.error("Error fetching dashboard stats:", error);
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
    setIsLoading(true);
    toast({
        title: "Coming Soon!",
        description: "The full daily quiz feature is under development. In the meantime, check out the Past Year Question Bank!",
    });
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <MainLayout
      leftSidebar={<LeftSidebar usageStats={usageStats} />}
      rightSidebar={<RightSidebar quizStats={quizStats} />}
    >
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
            <div className="lg:col-span-1 space-y-6">
                <Card className="glassmorphic shadow-2xl shadow-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart4 className="w-5 h-5 text-primary" />
                            Your Progress
                        </CardTitle>
                        <CardDescription>Track your performance and focus areas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <QuizDashboardWidgets />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="link" size="sm" asChild>
                            <Link href="/daily-quiz/past-year/progress">
                                View Detailed Analytics
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </MainLayout>
  );
}
