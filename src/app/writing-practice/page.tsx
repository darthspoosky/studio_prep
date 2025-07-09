

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Layout Imports
import MainLayout from '@/app/dashboard/components/layout/MainLayout';
import LeftSidebar from '@/app/dashboard/components/layout/LeftSidebar';
import RightSidebar from '@/app/dashboard/components/layout/RightSidebar';
import MobileHeader from '@/app/dashboard/components/layout/MobileHeader';
import { UserNav } from '@/components/layout/user-nav';
import { getUserUsage, type UsageStats } from '@/services/usageService';
import { getUserQuizStats, type UserQuizStats } from '@/services/quizAttemptsService';

interface ExtendedUserQuizStats extends UserQuizStats {
    streak: number;
    improvement: number;
}

export default function WritingPracticePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Layout-related state
  const [quizStats, setQuizStats] = useState<ExtendedUserQuizStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
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
  }, [user, loading, router]);

  const handleFeedback = () => {
    setIsLoading(true);
    // Simulate API call while feature is in development
    setTimeout(() => {
      toast({
        title: "Coming Soon!",
        description: "Our AI writing coach is getting ready. This feature is coming soon!",
      });
      setIsLoading(false);
    }, 1000);
  };

  if (loading || !user) {
    return null;
  }

  return (
    <MainLayout
      leftSidebar={<LeftSidebar usageStats={usageStats} />}
      rightSidebar={<RightSidebar quizStats={quizStats} />}
    >
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
                <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tighter">
                <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                    Writing Practice
                </span>
                </h1>
                <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                Improve your essays with AI-guided suggestions on structure, clarity, and grammar.
                </p>
            </div>

            <Card className="glassmorphic shadow-2xl shadow-primary/10">
                <CardHeader>
                    <CardTitle>Get Essay Feedback</CardTitle>
                    <CardDescription>Submit your essay and our AI will provide detailed feedback.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="essay-type">Writing Task Type</Label>
                        <Select>
                            <SelectTrigger id="essay-type" className="md:w-1/2">
                                <SelectValue placeholder="Select a writing task type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="upsc-essay">UPSC Mains Essay</SelectItem>
                                <SelectItem value="precis-writing">Précis Writing</SelectItem>
                                <SelectItem value="argument-essay">Argumentative Essay (State PSCs)</SelectItem>
                                <SelectItem value="report-writing">Report Writing</SelectItem>
                                <SelectItem value="ssc-descriptive">English Descriptive Paper (SSC/Bank)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="essay-text">Your Essay</Label>
                        <Textarea id="essay-text" placeholder="Paste your full essay, précis, or report here..." className="h-96 bg-background/50 dark:bg-background/20 focus:bg-background" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button size="lg" onClick={handleFeedback} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <Sparkles className="w-5 h-5" />
                        )}
                        {isLoading ? "Getting Feedback..." : "Get Feedback"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </MainLayout>
  );
}
