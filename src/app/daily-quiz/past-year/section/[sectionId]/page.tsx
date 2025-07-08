'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, BarChart3, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PastYearQuizSession from '@/app/daily-quiz/components/past-year/PastYearQuizSession';
import PastYearQuestionService from '@/services/pastYearQuestionService';
import { QuestionSet } from '@/types/quiz';

export default function SyllabusDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params?.sectionId as string;

  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [sectionInfo, setSectionInfo] = useState<{id: string; name: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startQuiz, setStartQuiz] = useState(false);

  useEffect(() => {
    if (!sectionId) {
      setError('Invalid syllabus section specified');
      setLoading(false);
      return;
    }

    async function loadSectionData() {
      try {
        setLoading(true);

        // First, get the section info
        const allSections = await PastYearQuestionService.getAvailableSyllabusSections();
        let foundSection = null;

        // Look for the section in main sections and their children
        for (const section of allSections) {
          if (section.id === sectionId) {
            foundSection = { id: section.id, name: section.name };
            break;
          }
          
          // Check children
          if (section.children) {
            const child = section.children.find(child => child.id === sectionId);
            if (child) {
              foundSection = { id: child.id, name: child.name };
              break;
            }
          }
        }

        if (!foundSection) {
          throw new Error('Syllabus section not found');
        }

        setSectionInfo(foundSection);
        
        // Then get the questions for this section
        const fetchedQuestionSet = await PastYearQuestionService.fetchQuestionsBySyllabusSection(sectionId);
        setQuestionSet(fetchedQuestionSet);
        setError(null);
      } catch (err) {
        console.error('Error loading syllabus section:', err);
        setError('Failed to load questions for this syllabus section. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadSectionData();
  }, [sectionId]);

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
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Section Details
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
  if (error || !questionSet || !sectionInfo) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Question Bank
        </Button>
        
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTitle>Error Loading Section</AlertTitle>
            <AlertDescription>
              {error || 'Failed to load syllabus section. Please try again later.'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Helper function to get syllabus section description
  const getSectionDescription = (id: string) => {
    // Map section IDs to descriptions
    const descriptions: Record<string, string> = {
      'gs-current-events': 'Questions covering recent national and international developments, including political, economic, social, and environmental events.',
      'gs-history': 'Questions on ancient, medieval, and modern Indian history, as well as the Indian National Movement.',
      'gs-geography': 'Questions on physical, social, and economic geography of India and the World.',
      'gs-polity': 'Questions on Indian constitution, political system, governance structures, and rights issues.',
      'gs-economy': 'Questions on economic development, social issues, poverty, inclusion, and social sector initiatives.',
      'gs-environment': 'Questions on environmental ecology, biodiversity, climate change, and related topics.',
      'gs-science': 'Questions on general science topics that don\'t require specialized knowledge.',
      'csat': 'Questions testing comprehension, reasoning, analytical ability, and basic numeracy.'
    };
    
    // If we have a specific description, return it, otherwise return a generic one
    if (descriptions[id]) {
      return descriptions[id];
    }
    
    // For child sections, try to match with parent
    for (const parentKey in descriptions) {
      if (id.startsWith(parentKey)) {
        return `Specific questions related to the ${id.replace(parentKey + '-', '').replace(/-/g, ' ')} aspect of ${descriptions[parentKey].toLowerCase()}`;
      }
    }
    
    return 'Questions from past UPSC examinations related to this syllabus section.';
  };

  // Get years represented in this question set
  const yearsRepresented = Array.from(
    new Set(questionSet.questions.map(q => q.year).filter(Boolean))
  ).sort((a, b) => b - a); // Sort in descending order (most recent first)

  // Main content
  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Question Bank
      </Button>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <BookOpen className="mr-3 text-blue-500" size={28} />
          {sectionInfo.name}
        </h1>
        <p className="text-gray-600 mb-6">
          {getSectionDescription(sectionInfo.id)}
        </p>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Past Year Questions</CardTitle>
                <CardDescription>Practice questions from UPSC exams spanning multiple years</CardDescription>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                {questionSet.questions.length} Questions
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {/* Years covered */}
              <div>
                <h3 className="font-medium mb-2">Years Covered</h3>
                <div className="flex flex-wrap gap-2">
                  {yearsRepresented.map(year => (
                    <Badge key={year} variant="outline">
                      {year}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />
              
              {/* Question distribution */}
              <div>
                <h3 className="font-medium mb-3">Sample Questions</h3>
                <div className="space-y-3">
                  {questionSet.questions.slice(0, 3).map((question, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm">{question.question}</p>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        {question.year && (
                          <span className="mr-3">Year: {question.year}</span>
                        )}
                        {question.topic && (
                          <span>Topic: {question.topic}</span>
                        )}
                      </div>
                    </div>
                  ))}
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
        
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 flex items-center">
            <Info className="mr-2 text-blue-600" size={20} />
            Study Tips for {sectionInfo.name}
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Focus on understanding fundamental concepts rather than rote memorization.</li>
            <li>Study this topic in connection with related topics for a holistic understanding.</li>
            <li>Pay attention to recent developments and their implications.</li>
            <li>Make concise notes with diagrams and flowcharts for better retention.</li>
            <li>Regularly revise past year questions to understand the examination pattern.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
