"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Footer from "@/components/landing/footer";
import Header from "@/components/layout/header";
import Link from "next/link";
import { ArrowLeft, Loader2, Bot, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function MockInterviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleStart = () => {
    setIsLoading(true);
    // Simulate API call while feature is in development
    setTimeout(() => {
      toast({
        title: "Coming Soon!",
        description: "The mock interview feature is being fine-tuned. It'll be available shortly!",
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
                Mock Interview
            </span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                Practice with our AI interviewer to get real-time feedback on your answers, tone, and pacing.
            </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Configuration */}
            <div className="lg:col-span-1">
                <Card className="glassmorphic shadow-2xl shadow-primary/10">
                    <CardHeader>
                        <CardTitle>Configure Your Interview</CardTitle>
                        <CardDescription>Set up the parameters for your practice session.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="interview-type">Interview Type</Label>
                            <Select>
                                <SelectTrigger id="interview-type">
                                    <SelectValue placeholder="Select an interview type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="personality-test">Personality Test (UPSC Style)</SelectItem>
                                    <SelectItem value="technical-interview">Technical Interview (IBPS, RBI)</SelectItem>
                                    <SelectItem value="situational-judgement">Situational Judgement Test</SelectItem>
                                    <SelectItem value="hr-round">General HR Round</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role-profile">Paste Exam / Role Profile (Optional)</Label>
                            <Textarea id="role-profile" placeholder="For a more tailored experience, paste the exam notification details or role profile here..." className="h-24" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="difficulty">Difficulty Level</Label>
                            <Select>
                                <SelectTrigger id="difficulty">
                                    <SelectValue placeholder="Select a difficulty level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Beginner</SelectItem>
                                    <SelectItem value="medium">Intermediate</SelectItem>
                                    <SelectItem value="hard">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full" onClick={handleStart} disabled={isLoading}>
                            {isLoading && <Loader2 className="animate-spin" />}
                            {isLoading ? "Configuring Session..." : "Start Interview"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            
            {/* Right Column: AI Interviewer View */}
            <div className="lg:col-span-2">
                 <div className="relative aspect-video w-full glassmorphic rounded-lg shadow-2xl shadow-primary/10 flex flex-col items-center justify-center p-8 overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 -z-10"></div>
                    <Bot className="w-24 h-24 text-primary/30 mb-4 animate-pulse" />
                    <h3 className="font-headline text-2xl text-foreground">Your AI Interviewer is Ready</h3>
                    <p className="text-muted-foreground mt-2 text-center">Your camera and microphone will be activated once the session starts.</p>
                     <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-md p-2 bg-black/30 text-white text-sm">
                        <Video className="w-5 h-5" />
                        <span>PrepTalk AI</span>
                    </div>
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
