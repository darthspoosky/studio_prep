'use client';

import React, { useState } from 'react';
import { QuizSessionData } from '../../session/[type]/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  Star, 
  Award,
  BarChart3,
  CheckCircle,
  XCircle,
  Flag,
  RotateCcw,
  Share2,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizResults {
  score: number;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  subjectWiseResults: { [subject: string]: { correct: number; total: number } };
  recommendations: string[];
  detailedResults: {
    questionId: string;
    isCorrect: boolean;
    selectedAnswer: string;
    correctAnswer: string;
    timeSpent: number;
  }[];
}

interface QuizResultsProps {
  results: QuizResults;
  session: QuizSessionData;
  onRetakeQuiz: () => void;
  onViewDashboard: () => void;
  className?: string;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  results,
  session,
  onRetakeQuiz,
  onViewDashboard,
  className
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-500' };
    if (score >= 80) return { label: 'Very Good', color: 'bg-blue-500' };
    if (score >= 70) return { label: 'Good', color: 'bg-yellow-500' };
    if (score >= 60) return { label: 'Average', color: 'bg-orange-500' };
    return { label: 'Needs Improvement', color: 'bg-red-500' };
  };

  const scoreBadge = getScoreBadge(results.score);

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              {results.score >= 80 ? (
                <Trophy className="h-16 w-16 text-yellow-500" />
              ) : results.score >= 60 ? (
                <Award className="h-16 w-16 text-blue-500" />
              ) : (
                <Target className="h-16 w-16 text-gray-500" />
              )}
            </div>
            
            <CardTitle className="text-3xl mb-2">Quiz Completed!</CardTitle>
            <p className="text-gray-600 mb-4">
              Great job completing the {session.quizType.replace('-', ' ')} quiz
            </p>
            
            <div className="flex items-center justify-center space-x-2">
              <Badge className={cn("px-4 py-2 text-white", scoreBadge.color)}>
                {scoreBadge.label}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                {session.metadata.difficulty.charAt(0).toUpperCase() + session.metadata.difficulty.slice(1)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Main Results */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Score Card */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6 text-center">
              <div className={cn("text-4xl font-bold mb-2", getScoreColor(results.score))}>
                {results.score}%
              </div>
              <div className="text-sm text-gray-600 mb-4">Overall Score</div>
              <Progress value={results.score} className="mb-2" />
              <div className="text-xs text-gray-500">
                {results.correctAnswers} out of {results.totalQuestions} correct
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{results.correctAnswers}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">
                    {results.totalQuestions - results.correctAnswers}
                  </div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {formatTime(results.timeTaken)}
                  </div>
                  <div className="text-sm text-gray-600">Time Taken</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(results.accuracy)}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Detailed Results Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="subjects">By Subject</TabsTrigger>
                <TabsTrigger value="detailed">Questions</TabsTrigger>
                <TabsTrigger value="recommendations">Tips</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Performance Chart */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Performance Summary
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Score</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={results.score} className="w-24" />
                          <span className="font-medium">{results.score}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Speed</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={Math.min(100, (session.timeLimit / results.timeTaken) * 100)} className="w-24" />
                          <span className="text-sm">{formatTime(results.timeTaken)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Completion</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={(session.answers.filter(a => a !== null).length / results.totalQuestions) * 100} className="w-24" />
                          <span className="text-sm">{session.answers.filter(a => a !== null).length}/{results.totalQuestions}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Star className="w-5 h-5 mr-2" />
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      <Button onClick={onRetakeQuiz} className="w-full" variant="outline">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retake Quiz
                      </Button>
                      <Button onClick={onViewDashboard} className="w-full">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Dashboard
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Results
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Subject-wise Results Tab */}
              <TabsContent value="subjects" className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center mb-4">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Subject-wise Performance
                </h3>
                <div className="space-y-4">
                  {Object.entries(results.subjectWiseResults).map(([subject, result]) => {
                    const percentage = Math.round((result.correct / result.total) * 100);
                    return (
                      <Card key={subject}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{subject}</h4>
                            <Badge variant="outline">
                              {result.correct}/{result.total}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Progress value={percentage} className="flex-1" />
                            <span className={cn("font-medium text-sm", getScoreColor(percentage))}>
                              {percentage}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Detailed Questions Tab */}
              <TabsContent value="detailed" className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center mb-4">
                  <Target className="w-5 h-5 mr-2" />
                  Question-by-Question Analysis
                </h3>
                <div className="space-y-3">
                  {session.questions.map((question, index) => {
                    const isCorrect = session.answers[index] === question.correctAnswer;
                    const isBookmarked = session.bookmarked[index];
                    const userAnswer = session.answers[index];
                    
                    return (
                      <Card key={question.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Q{index + 1}</span>
                              {isCorrect ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              {isBookmarked && (
                                <Flag className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <Badge variant={isCorrect ? "default" : "destructive"}>
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                            {question.question}
                          </p>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Your answer: <span className="font-medium">{userAnswer || 'Not answered'}</span></div>
                            {!isCorrect && (
                              <div>Correct answer: <span className="font-medium text-green-600">{question.correctAnswer}</span></div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Recommendations Tab */}
              <TabsContent value="recommendations" className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center mb-4">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Personalized Recommendations
                </h3>
                <div className="space-y-3">
                  {results.recommendations.map((recommendation, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {recommendation}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};