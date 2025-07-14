

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Sparkles, FileText, Clock } from "lucide-react";
import EnhancedWritingEditor from "@/components/writing/EnhancedWritingEditor";
import EvaluationReport from "@/components/writing/EvaluationReport";
import { useEffect, useState, useRef } from "react";
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
  const [currentMode, setCurrentMode] = useState<'practice' | 'evaluation'>('practice');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("Discuss the role of technology in modern governance and its impact on citizen-state interaction.");
  const abortControllerRef = useRef<AbortController | null>(null);

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
  
  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmitAnswer = async (data: any) => {
    setIsLoading(true);
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/writing-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: data.content,
          questionText: currentQuestion,
          examType: 'UPSC Mains',
          subject: 'General Studies',
          metadata: data.metadata
        }),
        signal: abortControllerRef.current.signal
      });

      if (response.ok) {
        const result = await response.json();
        setEvaluationResult(result);
        setCurrentMode('evaluation');
        toast({
          title: "Evaluation Complete!",
          description: `Your answer has been evaluated. Score: ${result.overallScore}%`,
        });
      } else {
        throw new Error('Evaluation failed');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled, don't show error
        return;
      }
      console.error('Evaluation error:', error);
      toast({
        title: "Evaluation Failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryEvaluation = () => {
    setCurrentMode('practice');
    setEvaluationResult(null);
  };

  if (loading || !user) {
    return null;
  }

  return (
    <MainLayout
      leftSidebar={<LeftSidebar usageStats={usageStats} />}
      rightSidebar={<RightSidebar quizStats={quizStats} />}
    >
      {currentMode === 'practice' ? (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tighter">
              <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                AI Writing Coach
              </span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
              Get comprehensive AI evaluation with real-time suggestions, detailed feedback, and improvement roadmap.
            </p>
          </div>

          <EnhancedWritingEditor
            questionText={currentQuestion}
            examType="UPSC Mains"
            timeLimit={45}
            wordLimit={900}
            onSubmit={handleSubmitAnswer}
            onSaveDraft={(content) => {
              // In production, save to backend
              localStorage.setItem('writing_draft', content);
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleRetryEvaluation}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Write Another Answer
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-medium">Evaluation Complete</span>
            </div>
          </div>
          
          {evaluationResult && (
            <EvaluationReport
              evaluation={evaluationResult}
              onRetryEvaluation={handleRetryEvaluation}
              onDownloadReport={() => {
                toast({
                  title: "Download Started",
                  description: "Your evaluation report is being prepared.",
                });
              }}
              onShareReport={() => {
                toast({
                  title: "Link Copied",
                  description: "Evaluation report link copied to clipboard.",
                });
              }}
            />
          )}
        </div>
      )}
    </MainLayout>
  );
}
