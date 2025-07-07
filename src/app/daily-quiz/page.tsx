"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Footer from "@/components/landing/footer";
import Header from "@/components/layout/header";
import Link from "next/link";
import { ArrowLeft, Loader2, Target, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function DailyQuizPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleStartQuiz = () => {
    setIsLoading(true);
    // Simulate API call while feature is in development
    setTimeout(() => {
      toast({
        title: "Coming Soon!",
        description: "The daily quiz feature is under development. Stay tuned!",
      });
      setIsLoading(false);
    }, 1000);
  };

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
