'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Image as ImageIcon, 
  Brain, 
  Download, 
  Copy, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  FileText,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtractedQuestion {
  questionId: string;
  questionNumber: number;
  subject: string;
  topic: string;
  questionText: {
    english: string;
    hindi?: string;
  };
  options: {
    a: { english: string; hindi?: string };
    b: { english: string; hindi?: string };
    c: { english: string; hindi?: string };
    d: { english: string; hindi?: string };
  };
  correctAnswer?: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  year?: number;
  source?: string;
}

interface ExtractionResult {
  success: boolean;
  examInfo?: {
    examName: string;
    paperName: string;
    paperCode?: string;
    duration?: number;
    maxMarks?: number;
    totalQuestions?: number;
  };
  questions: ExtractedQuestion[];
  confidence: number;
  processingTime: number;
  metadata?: any;
}

export default function QuestionExtractionPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setError(null);
      setExtractionResult(null);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (files) => {
      const file = files[0];
      if (file.errors[0]?.code === 'file-too-large') {
        setError('File too large. Maximum size is 10MB.');
      } else if (file.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload JPG, PNG, or WebP images.');
      } else {
        setError('Failed to upload file. Please try again.');
      }
    }
  });

  const extractQuestions = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', uploadedFile);
      formData.append('options', JSON.stringify({
        includeHindi: true,
        extractAnswers: true,
        classifySubjects: true
      }));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/ai/extract-questions', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract questions');
      }

      const result: ExtractionResult = await response.json();
      setExtractionResult(result);
      
    } catch (err) {
      console.error('Extraction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract questions');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadJSON = () => {
    if (!extractionResult) return;

    const dataStr = JSON.stringify(extractionResult, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `extracted-questions-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubjectColor = (subject: string) => {
    const colors = {
      history: 'bg-blue-100 text-blue-800',
      geography: 'bg-green-100 text-green-800',
      polity: 'bg-purple-100 text-purple-800',
      economics: 'bg-orange-100 text-orange-800',
      science: 'bg-cyan-100 text-cyan-800',
      environment: 'bg-emerald-100 text-emerald-800',
      current_affairs: 'bg-red-100 text-red-800',
      ethics: 'bg-pink-100 text-pink-800',
      governance: 'bg-indigo-100 text-indigo-800'
    };
    return colors[subject as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Question Extraction
        </h1>
        <p className="text-gray-600">
          Upload images of exam papers to automatically extract questions using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                )}
              >
                <input {...getInputProps()} />
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600">Drop the image here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag & drop an image here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports JPG, PNG, WebP (max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* File Info */}
              {uploadedFile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{uploadedFile.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Processing Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span className="text-sm text-gray-600">
                      Processing with AI...
                    </span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Extract Button */}
              <Button
                onClick={extractQuestions}
                disabled={!uploadedFile || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-spin" />
                    Extracting Questions...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Extract Questions
                  </>
                )}
              </Button>

              {/* Preview */}
              {previewUrl && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Preview:</h4>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-contain border rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          {extractionResult && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    Extraction Results
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      Confidence: {Math.round(extractionResult.confidence * 100)}%
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {extractionResult.processingTime}ms
                    </Badge>
                    <Button variant="outline" size="sm" onClick={downloadJSON}>
                      <Download className="w-4 h-4 mr-1" />
                      Download JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="questions" className="w-full">
                  <TabsList>
                    <TabsTrigger value="questions">
                      Questions ({extractionResult.questions.length})
                    </TabsTrigger>
                    <TabsTrigger value="exam-info">Exam Info</TabsTrigger>
                    <TabsTrigger value="raw-json">Raw JSON</TabsTrigger>
                  </TabsList>

                  <TabsContent value="questions" className="space-y-4">
                    {extractionResult.questions.map((question, index) => (
                      <Card key={question.questionId} className="border-l-4 border-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">Q{question.questionNumber}</Badge>
                              <Badge className={getSubjectColor(question.subject)}>
                                {question.subject}
                              </Badge>
                              {question.difficulty && (
                                <Badge className={getDifficultyColor(question.difficulty)}>
                                  {question.difficulty}
                                </Badge>
                              )}
                              {question.topic && (
                                <Badge variant="outline">{question.topic}</Badge>
                              )}
                            </div>
                            {question.correctAnswer && (
                              <Badge className="bg-green-100 text-green-800">
                                Answer: {question.correctAnswer}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Question:</h4>
                              <p className="text-gray-800">{question.questionText.english}</p>
                              {question.questionText.hindi && (
                                <p className="text-gray-600 text-sm mt-1 italic">
                                  {question.questionText.hindi}
                                </p>
                              )}
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Options:</h4>
                              <div className="grid grid-cols-1 gap-2">
                                {Object.entries(question.options).map(([key, option]) => (
                                  <div
                                    key={key}
                                    className={cn(
                                      "p-2 rounded border",
                                      question.correctAnswer === key.toUpperCase()
                                        ? "bg-green-50 border-green-300"
                                        : "bg-gray-50"
                                    )}
                                  >
                                    <span className="font-medium text-sm">
                                      {key.toUpperCase()}.
                                    </span>{' '}
                                    {option.english}
                                    {option.hindi && (
                                      <div className="text-sm text-gray-600 mt-1 italic">
                                        {option.hindi}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {question.explanation && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-1">Explanation:</h4>
                                <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                                  {question.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="exam-info">
                    {extractionResult.examInfo ? (
                      <Card>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900">Exam Name:</h4>
                              <p className="text-gray-800">{extractionResult.examInfo.examName}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Paper Name:</h4>
                              <p className="text-gray-800">{extractionResult.examInfo.paperName}</p>
                            </div>
                            {extractionResult.examInfo.paperCode && (
                              <div>
                                <h4 className="font-medium text-gray-900">Paper Code:</h4>
                                <p className="text-gray-800">{extractionResult.examInfo.paperCode}</p>
                              </div>
                            )}
                            {extractionResult.examInfo.duration && (
                              <div>
                                <h4 className="font-medium text-gray-900">Duration:</h4>
                                <p className="text-gray-800">{extractionResult.examInfo.duration} minutes</p>
                              </div>
                            )}
                            {extractionResult.examInfo.maxMarks && (
                              <div>
                                <h4 className="font-medium text-gray-900">Max Marks:</h4>
                                <p className="text-gray-800">{extractionResult.examInfo.maxMarks}</p>
                              </div>
                            )}
                            {extractionResult.examInfo.totalQuestions && (
                              <div>
                                <h4 className="font-medium text-gray-900">Total Questions:</h4>
                                <p className="text-gray-800">{extractionResult.examInfo.totalQuestions}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          No exam information detected in the image.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="raw-json">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Raw JSON Output:</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(extractionResult, null, 2))}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <Textarea
                          value={JSON.stringify(extractionResult, null, 2)}
                          readOnly
                          className="min-h-[400px] font-mono text-sm"
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}