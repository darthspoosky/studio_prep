"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  Target, 
  Clock,
  FileText,
  TrendingUp,
  Download,
  Share,
  BookOpen,
  Users,
  Award
} from 'lucide-react';

interface EvaluationReportProps {
  evaluation: EvaluationResult;
  onDownloadReport?: () => void;
  onShareReport?: () => void;
  onRetryEvaluation?: () => void;
}

interface EvaluationResult {
  id: string;
  overallScore: number;
  scores: {
    content: number;
    structure: number;
    language: number;
    presentation: number;
    timeManagement: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
    missingKeywords: string[];
  };
  analytics: {
    readabilityScore: number;
    vocabularyLevel: string;
    sentenceComplexity: string;
    paragraphStructure: string;
  };
  comparison: {
    peerPercentile: number;
    averageScore: number;
    topPerformerGap: number;
  };
  processingTime: number;
  createdAt: Date;
}

export default function EvaluationReport({
  evaluation,
  onDownloadReport,
  onShareReport,
  onRetryEvaluation
}: EvaluationReportProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getGradeFromScore = (score: number) => {
    if (score >= 90) return { grade: 'A+', description: 'Outstanding' };
    if (score >= 80) return { grade: 'A', description: 'Excellent' };
    if (score >= 70) return { grade: 'B+', description: 'Very Good' };
    if (score >= 60) return { grade: 'B', description: 'Good' };
    if (score >= 50) return { grade: 'C+', description: 'Satisfactory' };
    if (score >= 40) return { grade: 'C', description: 'Average' };
    return { grade: 'D', description: 'Needs Improvement' };
  };

  const gradeInfo = getGradeFromScore(evaluation.overallScore);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Evaluation Report</h1>
          <p className="text-muted-foreground">
            Comprehensive AI analysis • Generated {evaluation.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {onShareReport && (
            <Button variant="outline" onClick={onShareReport}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          )}
          {onDownloadReport && (
            <Button variant="outline" onClick={onDownloadReport}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}
          {onRetryEvaluation && (
            <Button onClick={onRetryEvaluation}>
              Re-evaluate
            </Button>
          )}
        </div>
      </div>

      {/* Overall Score Hero Section */}
      <Card className="glassmorphic">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Score Display */}
            <div className="text-center md:text-left">
              <div className={`text-6xl font-bold bg-gradient-to-r ${getScoreGradient(evaluation.overallScore)} bg-clip-text text-transparent`}>
                {evaluation.overallScore}
              </div>
              <div className="mt-2">
                <Badge className={`text-lg px-4 py-2 bg-gradient-to-r ${getScoreGradient(evaluation.overallScore)} text-white`}>
                  Grade {gradeInfo.grade}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">{gradeInfo.description}</p>
              </div>
            </div>

            {/* Comparison Stats */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Your Score</span>
                  <span className="font-medium">{evaluation.overallScore}%</span>
                </div>
                <Progress value={evaluation.overallScore} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Average Score</span>
                  <span className="text-muted-foreground">{evaluation.comparison.averageScore}%</span>
                </div>
                <Progress value={evaluation.comparison.averageScore} className="h-2 opacity-50" />
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  You scored better than <span className="font-semibold text-primary">{evaluation.comparison.peerPercentile}%</span> of test takers
                </p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{evaluation.comparison.peerPercentile}th</div>
                <div className="text-xs text-muted-foreground">Percentile</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-500/10">
                <Award className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{evaluation.feedback.strengths.length}</div>
                <div className="text-xs text-muted-foreground">Strengths</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Scores</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Score Breakdown */}
          <Card className="glassmorphic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(evaluation.scores).map(([category, score]) => (
                  <div key={category} className="text-center p-4 rounded-lg bg-background/50">
                    <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                      {score}
                    </div>
                    <div className="text-sm font-medium capitalize mt-1">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <Progress value={score} className="mt-2 h-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glassmorphic">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Top Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evaluation.feedback.strengths.slice(0, 3).map((strength, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{strength}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphic">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-5 h-5" />
                  Priority Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evaluation.feedback.improvements.slice(0, 3).map((improvement, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{improvement}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Detailed Scores Tab */}
        <TabsContent value="detailed" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(evaluation.scores).map(([category, score]) => (
              <Card key={category} className="glassmorphic">
                <CardHeader>
                  <CardTitle className="capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold">{score}%</span>
                      <Badge className={getScoreColor(score)}>
                        {getGradeFromScore(score).grade}
                      </Badge>
                    </div>
                    <Progress value={score} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      {score >= 80 && "Excellent performance in this area"}
                      {score >= 60 && score < 80 && "Good performance with room for improvement"}
                      {score < 60 && "Focus area for significant improvement"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card className="glassmorphic">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Strengths ({evaluation.feedback.strengths.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evaluation.feedback.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{strength}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Improvements */}
            <Card className="glassmorphic">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-5 h-5" />
                  Areas for Improvement ({evaluation.feedback.improvements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evaluation.feedback.improvements.map((improvement, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                      <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{improvement}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suggestions */}
          <Card className="glassmorphic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Lightbulb className="w-5 h-5" />
                Actionable Suggestions ({evaluation.feedback.suggestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evaluation.feedback.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Missing Keywords */}
          {evaluation.feedback.missingKeywords.length > 0 && (
            <Card className="glassmorphic">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <BookOpen className="w-5 h-5" />
                  Missing Key Concepts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {evaluation.feedback.missingKeywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-purple-600 border-purple-200">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language Analytics */}
            <Card className="glassmorphic">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Language Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Readability Score</span>
                    <span className="font-medium">{evaluation.analytics.readabilityScore}/100</span>
                  </div>
                  <Progress value={evaluation.analytics.readabilityScore} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Vocabulary Level</p>
                    <Badge variant="outline" className="mt-1">
                      {evaluation.analytics.vocabularyLevel}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sentence Complexity</p>
                    <Badge variant="outline" className="mt-1">
                      {evaluation.analytics.sentenceComplexity}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Paragraph Structure</p>
                  <p className="text-sm mt-1">{evaluation.analytics.paragraphStructure}</p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Comparison */}
            <Card className="glassmorphic">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                    <span className="text-sm">Your Score</span>
                    <span className="font-semibold text-lg">{evaluation.overallScore}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/30">
                    <span className="text-sm">Average Score</span>
                    <span className="font-medium text-muted-foreground">{evaluation.comparison.averageScore}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/30">
                    <span className="text-sm">Gap to Top Performers</span>
                    <span className="font-medium text-orange-600">-{evaluation.comparison.topPerformerGap}%</span>
                  </div>
                </div>

                <Alert className="bg-primary/5 border-primary/20">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    You're performing {evaluation.overallScore > evaluation.comparison.averageScore ? 'above' : 'below'} average. 
                    Focus on the improvement areas to reach the top percentile.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Processing Info */}
          <Card className="glassmorphic">
            <CardHeader>
              <CardTitle>Evaluation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Evaluation ID</p>
                  <p className="font-mono text-xs">{evaluation.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Processing Time</p>
                  <p>{(evaluation.processingTime / 1000).toFixed(2)}s</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Generated</p>
                  <p>{evaluation.createdAt.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">AI Models</p>
                  <p>GPT-4 + Claude</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}