import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import PastYearQuestionService, { YearProgress } from '@/services/pastYearQuestionService';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, MinusCircle, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function YearGrid() {
  const [years, setYears] = useState<YearProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<{[key: number]: boolean}>({});
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function loadYears() {
      try {
        setLoading(true);
        // Get available years with progress if user is logged in
        if (user?.uid) {
          const yearProgress = await PastYearQuestionService.getUserYearProgress(user.uid);
          setYears(yearProgress);
          
          // Check for recent activity (mock implementation - in real app would check timestamps)
          const userProgressData = await PastYearQuestionService.getUserProgressData(user.uid);
          if (userProgressData) {
            const lastActiveDate = userProgressData.lastActiveDate;
            if (lastActiveDate) {
              const now = new Date();
              const daysSinceActive = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 3600 * 24));
              
              // Mark years with recent activity (last 3 days)
              const recentActivityMap: {[key: number]: boolean} = {};
              yearProgress.forEach(yp => {
                // This is a placeholder - in a real implementation you would check the actual
                // activity timestamps for each year's questions
                if (daysSinceActive <= 3 && yp.attempted > 0) {
                  recentActivityMap[yp.year] = true;
                }
              });
              setRecentActivity(recentActivityMap);
            }
          }
        } else {
          // Just get available years without progress for non-logged in users
          const availableYears = await PastYearQuestionService.getAvailableYears();
          const yearData = availableYears.map(year => ({
            year,
            total: 100, // Placeholder
            attempted: 0,
            correct: 0,
          }));
          setYears(yearData);
        }
        setError(null);
      } catch (err) {
        setError('Failed to load past year questions. Please try again.');
        console.error('Error loading years:', err);
      } finally {
        setLoading(false);
      }
    }

    loadYears();
  }, [user]);

  const handleYearSelect = (year: number) => {
    router.push(`/daily-quiz/past-year/year/${year}`);
  };

  // Calculate the completion percentage for the progress bar
  const getCompletionPercentage = (attempted: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((attempted / total) * 100);
  };

  // Get the color based on the correct percentage
  const getProgressColor = (correct: number, attempted: number): string => {
    if (attempted === 0) return 'bg-gray-200';
    const percentage = (correct / attempted) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  // Get status icon based on progress and accuracy
  const getStatusIcon = (yearData: YearProgress) => {
    const { attempted, total, correct } = yearData;
    
    if (attempted === 0) {
      return <Clock className="h-5 w-5 text-slate-400" />;
    }
    
    const completionPercentage = (attempted / total) * 100;
    const accuracyPercentage = (correct / attempted) * 100;
    
    if (completionPercentage >= 90) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (accuracyPercentage >= 70) {
      return <TrendingUp className="h-5 w-5 text-emerald-500" />;
    } else if (accuracyPercentage < 40) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <MinusCircle className="h-5 w-5 text-amber-500" />;
    }
  };
  
  // Get descriptive status text
  const getStatusText = (yearData: YearProgress): string => {
    const { attempted, total, correct } = yearData;
    
    if (attempted === 0) {
      return "Not started";
    }
    
    const completionPercentage = (attempted / total) * 100;
    const accuracyPercentage = (correct / attempted) * 100;
    
    if (completionPercentage >= 90) {
      return "Completed";
    } else if (accuracyPercentage >= 70) {
      return "Good progress";
    } else if (accuracyPercentage < 40) {
      return "Needs improvement";
    } else {
      return "In progress";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {years.map((yearData) => (
            <Card 
              key={yearData.year} 
              className={`hover:shadow-lg transition-all cursor-pointer ${recentActivity[yearData.year] ? 'ring-2 ring-blue-400' : ''}`}
              onClick={() => handleYearSelect(yearData.year)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">{yearData.year} UPSC Prelims</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        {getStatusIcon(yearData)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getStatusText(yearData)}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription>
                  {yearData.attempted > 0 
                    ? `You've attempted ${yearData.attempted} out of ${yearData.total} questions` 
                    : 'Start practicing questions from this year'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Progress</span>
                      <span className="font-medium">{getCompletionPercentage(yearData.attempted, yearData.total)}%</span>
                    </div>
                    <div className="relative pt-1">
                      <Progress 
                        value={getCompletionPercentage(yearData.attempted, yearData.total)} 
                        className={yearData.attempted > 0 ? `h-2.5 ${getProgressColor(yearData.correct, yearData.attempted)}` : 'h-2.5'}
                      />
                      {yearData.attempted > 0 && (
                        <div className="mt-2 flex justify-between text-xs text-gray-600">
                          <span>{yearData.attempted} attempted</span>
                          <span>{yearData.total - yearData.attempted} remaining</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {yearData.attempted > 0 && (
                    <div className="mt-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Accuracy</span>
                        <Badge className={`${yearData.correct / yearData.attempted >= 0.7 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : yearData.correct / yearData.attempted >= 0.5 
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' 
                              : 'bg-red-100 text-red-800 hover:bg-red-100'}`}>
                          {yearData.attempted > 0 
                            ? `${Math.round((yearData.correct / yearData.attempted) * 100)}%` 
                            : '0%'}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          <span>{yearData.correct} correct</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="h-3 w-3 rounded-full bg-red-500"></div>
                          <span>{yearData.attempted - yearData.correct} incorrect</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {recentActivity[yearData.year] && (
                    <div className="mt-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        Recent activity
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={yearData.attempted > 0 ? "outline" : "default"}
                >
                  {yearData.attempted > 0 ? 'Continue Practice' : 'Start Practice'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
