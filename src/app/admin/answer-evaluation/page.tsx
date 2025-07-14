'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileImage, CheckCircle, AlertCircle, BookOpen, TrendingUp } from 'lucide-react';

interface EvaluationResult {
  success: boolean;
  evaluation: any;
  metadata: any;
  error?: string;
}

export default function AnswerEvaluationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [subject, setSubject] = useState('');
  const [maxMarks, setMaxMarks] = useState('10');
  const [language, setLanguage] = useState('english');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const subjects = [
    'History', 'Geography', 'Polity', 'Economics', 'Science & Technology',
    'Environment', 'Current Affairs', 'Ethics', 'Public Administration',
    'Sociology', 'Philosophy', 'Literature'
  ];

  const handleFileChange = (selectedFile: File) => {
    if (selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
    } else {
      alert('Please select an image file (JPG, PNG, WebP)');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const evaluateAnswer = async () => {
    if (!file || !questionText || !subject) {
      alert('Please provide answer image, question text, and subject');
      return;
    }

    setIsEvaluating(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('answerImage', file);
      formData.append('questionText', questionText);
      formData.append('modelAnswer', modelAnswer);
      formData.append('subject', subject);
      formData.append('maxMarks', maxMarks);
      formData.append('language', language);

      const response = await fetch('/api/ai/evaluate-answer', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setResult(result);

    } catch (error) {
      setResult({
        success: false,
        error: `Evaluation failed: ${error}`,
        evaluation: null,
        metadata: null
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'bg-green-500';
      case 'B+':
      case 'B': return 'bg-blue-500';
      case 'C+':
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'F': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">AI Answer Evaluation System</h1>
        <p className="text-lg text-muted-foreground">
          Upload handwritten answers for comprehensive AI-powered evaluation and feedback
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Answer Evaluation Setup
          </CardTitle>
          <CardDescription>
            Upload a handwritten answer image and provide question details for evaluation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Answer Image</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? 'border-primary bg-primary/10' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-2">
                  <FileImage className="h-12 w-12 mx-auto text-green-500" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG, WebP up to 10MB
                    </p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
            </div>
          </div>

          {/* Question Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subj) => (
                    <SelectItem key={subj} value={subj}>
                      {subj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMarks">Maximum Marks</Label>
              <Input
                id="maxMarks"
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                min="1"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionText">Question Text</Label>
            <Textarea
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter the complete question text..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelAnswer">Model Answer (Optional)</Label>
            <Textarea
              id="modelAnswer"
              value={modelAnswer}
              onChange={(e) => setModelAnswer(e.target.value)}
              placeholder="Enter the ideal answer for comparison..."
              rows={4}
            />
          </div>

          <Button
            onClick={evaluateAnswer}
            disabled={!file || !questionText || !subject || isEvaluating}
            className="w-full"
            size="lg"
          >
            {isEvaluating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Evaluating Answer...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Evaluate Answer
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {result.success ? (
            <>
              {/* Evaluation Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Evaluation Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {result.evaluation.evaluation.awardedMarks}/{result.evaluation.evaluation.totalMarks}
                      </div>
                      <div className="text-sm text-muted-foreground">Marks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {result.evaluation.evaluation.percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Score</div>
                    </div>
                    <div className="text-center">
                      <Badge 
                        className={`text-lg px-4 py-2 ${getGradeColor(result.evaluation.evaluation.grade)} text-white`}
                      >
                        {result.evaluation.evaluation.grade}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">Grade</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {(result.evaluation.studentAnswer.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-muted-foreground">OCR Confidence</div>
                    </div>
                  </div>

                  <Progress 
                    value={result.evaluation.evaluation.percentage} 
                    className="h-3"
                  />
                </CardContent>
              </Card>

              {/* Extracted Text */}
              <Card>
                <CardHeader>
                  <CardTitle>Extracted Text</CardTitle>
                  <CardDescription>
                    Text extracted from handwritten answer using AI OCR
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{result.evaluation.studentAnswer.text}</p>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Readability Score: {(result.evaluation.studentAnswer.readabilityScore * 100).toFixed(0)}%
                  </div>
                </CardContent>
              </Card>

              {/* Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.evaluation.analysis.strengths.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Areas for Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.evaluation.analysis.weaknesses.map((weakness: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle>Improvement Suggestions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Immediate Improvements</h4>
                    <ul className="space-y-1">
                      {result.evaluation.suggestions.immediate.map((suggestion: string, index: number) => (
                        <li key={index} className="text-sm">• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Long-term Strategy</h4>
                    <ul className="space-y-1">
                      {result.evaluation.suggestions.longTerm.map((suggestion: string, index: number) => (
                        <li key={index} className="text-sm">• {suggestion}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recommended Resources</h4>
                    <ul className="space-y-1">
                      {result.evaluation.suggestions.resources.map((resource: string, index: number) => (
                        <li key={index} className="text-sm">• {resource}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Model Answer Comparison */}
              {result.evaluation.comparison.modelAnswer !== 'No model answer provided' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Model Answer Comparison</CardTitle>
                    <CardDescription>
                      Coverage: {result.evaluation.comparison.coveragePercentage}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Key Differences</h4>
                      <ul className="space-y-1">
                        {result.evaluation.comparison.keyDifferences.map((diff: string, index: number) => (
                          <li key={index} className="text-sm">• {diff}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Model Answer</h4>
                      <p className="text-sm whitespace-pre-wrap">{result.evaluation.comparison.modelAnswer}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {result.error || 'Evaluation failed. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}