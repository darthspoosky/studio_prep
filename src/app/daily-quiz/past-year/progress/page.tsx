'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart2, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ProgressOverview from '@/app/daily-quiz/components/past-year/ProgressOverview';
import SyllabusSectionProgress from '@/app/daily-quiz/components/past-year/SyllabusSectionProgress';
import PastYearQuestionService, { YearProgress, UserProgressData } from '@/services/pastYearQuestionService';
import { useAuth } from '@/contexts/AuthContext';

export default function ProgressPage() {
  const [yearProgress, setYearProgress] = useState<YearProgress[]>([]);
  const [userProgressData, setUserProgressData] = useState<UserProgressData | null>(null);
  const [sectionNameMap, setSectionNameMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true);
        
        // Load syllabus section names
        try {
          const syllabusData = await PastYearQuestionService.getAvailableSyllabusSections();
          const nameMap: Record<string, string> = {};
          
          syllabusData.forEach((section: {
            id: string;
            name: string;
            children?: Array<{id: string; name: string}>;
          }) => {
            nameMap[section.id] = section.name;
            
            // Also add subsection names if they exist
            if (section.children) {
              section.children.forEach((subsection: {id: string; name: string}) => {
                nameMap[subsection.id] = subsection.name;
              });
            }
          });
          
          setSectionNameMap(nameMap);
        } catch (error) {
          console.error('Error loading syllabus sections:', error);
          // Continue with empty map as fallback
        }
        
        // If user is logged in, fetch their actual progress
        if (user?.uid) {
          const [yearData, fullProgressData] = await Promise.all([
            PastYearQuestionService.getUserYearProgress(user.uid),
            PastYearQuestionService.getUserProgressData(user.uid)
          ]);
          
          setYearProgress(yearData);
          setUserProgressData(fullProgressData);
        } else {
          // Generate demo data for non-logged in users
          const currentYear = new Date().getFullYear();
          const demoProgress: YearProgress[] = [];
          
          for (let i = 0; i < 10; i++) {
            const year = currentYear - i;
            const total = 100;
            const attempted = Math.floor(Math.random() * total);
            const correct = Math.floor(Math.random() * attempted);
            
            demoProgress.push({
              year,
              total,
              attempted,
              correct
            });
          }
          
          setYearProgress(demoProgress);
          
          // Create demo syllabus progress data
          const demoSyllabusProgress: Record<string, { attempted: number; correct: number; total: number }> = {
            'polity': { attempted: 45, correct: 32, total: 60 },
            'economy': { attempted: 30, correct: 18, total: 50 },
            'geography': { attempted: 25, correct: 20, total: 40 },
            'history': { attempted: 35, correct: 15, total: 55 },
            'science': { attempted: 15, correct: 10, total: 30 },
            'environment': { attempted: 20, correct: 16, total: 35 }
          };
          
          // Create properly structured UserProgressData for demo data
          setUserProgressData({
            userId: 'demo-user',
            total: 125, // Sum of all syllabusProgress totals
            attempted: 125,  // Sum of all syllabusProgress attempted
            correct: 79,  // Sum of all syllabusProgress correct
            currentStreak: 3,
            bestStreak: 14,
            lastActiveDate: new Date(),
            yearProgress: demoProgress,
            syllabusProgress: demoSyllabusProgress,
            accuracy: 63,  // (79/125)*100
            weeklyPerformance: [
              { day: 'Mon', correct: 10, total: 15 },
              { day: 'Tue', correct: 12, total: 18 },
              { day: 'Wed', correct: 15, total: 20 },
              { day: 'Thu', correct: 8, total: 12 },
              { day: 'Fri', correct: 14, total: 20 },
              { day: 'Sat', correct: 10, total: 20 },
              { day: 'Sun', correct: 10, total: 20 }
            ],
            recentImprovement: 8
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading progress data:', err);
        setError('Failed to load your progress data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadProgress();
  }, [user]);

  // Calculate some overall stats
  const totalQuestionsAttempted = yearProgress.reduce((sum, year) => sum + year.attempted, 0);
  const totalCorrectAnswers = yearProgress.reduce((sum, year) => sum + year.correct, 0);
  const avgAccuracy = totalQuestionsAttempted > 0 
    ? Math.round((totalCorrectAnswers / totalQuestionsAttempted) * 100) 
    : 0;
  
  // Use streak data from backend if available, otherwise use mock data
  const currentStreak = userProgressData?.currentStreak || 3;
  const bestStreak = userProgressData?.bestStreak || 14;

  const handleGoBack = () => {
    router.push('/daily-quiz/past-year');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Question Bank
        </Button>
        
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-1/3 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-8 w-1/4 mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </Card>
            ))}
          </div>
          
          <Card className="p-6">
            <Skeleton className="h-6 w-1/4 mb-4" />
            <Skeleton className="h-80 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Question Bank
        </Button>
        
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTitle>Error Loading Progress</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Question Bank
      </Button>
      
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Your Progress</h1>
        <p className="text-gray-600 mb-8">
          Track your performance and see your improvement over time
        </p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="overview" className="flex items-center">
              <BarChart2 className="mr-2 h-4 w-4" /> Performance Overview
            </TabsTrigger>
            <TabsTrigger value="by-topic" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" /> Topic Analysis
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <ProgressOverview
              yearProgress={yearProgress}
              currentStreak={currentStreak}
              bestStreak={bestStreak}
              totalQuestionsAttempted={totalQuestionsAttempted}
              avgAccuracy={avgAccuracy}
            />
          </TabsContent>
          
          <TabsContent value="by-topic" className="mt-0">
            <SyllabusSectionProgress 
              userProgressData={userProgressData}
              sectionNameMap={sectionNameMap}
            />
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Study Tips Based on Your Performance</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Focus on questions from years where your accuracy is below 60%.</li>
            <li>Review explanations for questions you got wrong to understand the concepts better.</li>
            <li>Aim for at least 15 minutes of practice every day to build a consistent streak.</li>
            <li>Try to complete all questions from recent years (2020-2022) as they reflect current patterns.</li>
            <li>Use the syllabus browser to target specific topics where you need improvement.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
