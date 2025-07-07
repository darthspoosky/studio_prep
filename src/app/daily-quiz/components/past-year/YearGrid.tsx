import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import PastYearQuestionService, { YearProgress } from '@/services/pastYearQuestionService';
import { useAuth } from '@/hooks/useAuth';

export default function YearGrid() {
  const [years, setYears] = useState<YearProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    return 'bg-red-500';
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
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {years.map((yearData) => (
          <Card 
            key={yearData.year} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleYearSelect(yearData.year)}
          >
            <CardHeader>
              <CardTitle className="text-xl">{yearData.year} UPSC Prelims</CardTitle>
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
                    <span>Progress</span>
                    <span>{getCompletionPercentage(yearData.attempted, yearData.total)}%</span>
                  </div>
                  <Progress 
                    value={getCompletionPercentage(yearData.attempted, yearData.total)} 
                    className={yearData.attempted > 0 ? getProgressColor(yearData.correct, yearData.attempted) : ''}
                  />
                </div>
                
                {yearData.attempted > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Accuracy</span>
                    <span className={`font-medium ${
                      yearData.correct / yearData.attempted >= 0.7 
                        ? 'text-green-600' 
                        : yearData.correct / yearData.attempted >= 0.5 
                          ? 'text-yellow-600' 
                          : 'text-red-600'
                    }`}>
                      {yearData.attempted > 0 
                        ? `${Math.round((yearData.correct / yearData.attempted) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant={yearData.attempted > 0 ? "outline" : "default"}>
                {yearData.attempted > 0 ? 'Continue Practice' : 'Start Practice'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
