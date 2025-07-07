'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, FileText, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PastYearQuizSession from '@/app/daily-quiz/components/past-year/PastYearQuizSession';
import PastYearQuestionService from '@/services/pastYearQuestionService';
import { QuestionSet } from '@/types/quiz';

export default function YearDetailPage() {
  const params = useParams();
  const router = useRouter();
  const yearParam = params?.year as string;
  const year = parseInt(yearParam, 10);

  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startQuiz, setStartQuiz] = useState(false);

  useEffect(() => {
    if (!year || isNaN(year)) {
      setError('Invalid year specified');
      setLoading(false);
      return;
    }

    async function loadQuestions() {
      try {
        setLoading(true);
        const fetchedQuestionSet = await PastYearQuestionService.fetchQuestionsByYear(year);
        setQuestionSet(fetchedQuestionSet);
        setError(null);
      } catch (err) {
        console.error('Error loading questions:', err);
        setError('Failed to load questions for this year. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [year]);

  const handleQuizComplete = (results: {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    timeTaken: number;
  }) => {
    // In a real application, we would save these results to the user's history
    console.log('Quiz completed with results:', results);
    setStartQuiz(false);
  };

  const handleGoBack = () => {
    if (startQuiz) {
      setStartQuiz(false);
    } else {
      router.push('/daily-quiz/past-year');
    }
  };

  // Show quiz session if quiz has started
  if (startQuiz && questionSet) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Year Details
        </Button>
        
        <PastYearQuizSession
          questionSet={questionSet}
          onComplete={handleQuizComplete}
          onExit={handleGoBack}
        />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Question Bank
        </Button>
        
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !questionSet) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Question Bank
        </Button>
        
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTitle>Error Loading Questions</AlertTitle>
            <AlertDescription>
              {error || 'Failed to load questions. Please try again later.'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Question Bank
      </Button>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">UPSC {year} Questions</h1>
        <p className="text-gray-600 mb-8">
          Practice with authentic questions from the UPSC Civil Services Examination {year}.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>Question Set Overview</CardTitle>
            <CardDescription>Review the details before starting your practice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <FileText className="mr-3 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Content</h3>
                  <p className="text-gray-600">
                    {questionSet.questions.length} questions from UPSC {year} exam
                  </p>
                  <p className="text-gray-600 mt-1">
                    Covers all main sections of the UPSC Prelims syllabus
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="mr-3 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Estimated Time</h3>
                  <p className="text-gray-600">
                    {Math.ceil(questionSet.questions.length * 1.5)} minutes
                  </p>
                  <p className="text-gray-600 mt-1">
                    Average of 90 seconds per question
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <BarChart3 className="mr-3 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Difficulty</h3>
                  <p className="text-gray-600">
                    Original UPSC level difficulty
                  </p>
                  <p className="text-gray-600 mt-1">
                    Mixed question types from various subjects
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button size="lg" onClick={() => setStartQuiz(true)}>
              Start Practice Session
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-8 bg-yellow-50 border border-yellow-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Year-specific Insights
          </h2>
          <p className="text-gray-700 mb-3">
            The {year} UPSC Prelims exam had several notable characteristics:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Emphasized current affairs and environment-related topics</li>
            <li>Featured more questions on international relations than previous years</li>
            <li>Included several questions on economic policies and reforms</li>
            <li>Had a balanced mix of factual and conceptual questions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
