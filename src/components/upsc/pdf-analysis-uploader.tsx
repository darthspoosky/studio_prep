'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Eye, Brain, CheckCircle2, AlertCircle,
  Download, Share, Calendar, BookOpen, BarChart3, Target,
  Clock, Zap, TrendingUp, FileQuestion, X, RefreshCw
} from 'lucide-react';

// Interfaces matching our backend framework
interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface ExtractedQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  options?: string[];
  marks: number;
  difficulty: number;
  topics: string[];
  syllabusTags: string[];
  bloomLevel: string;
  conceptualDepth: number;
  relevanceScore: number;
}

interface PDFProcessingResult {
  fileId: string;
  filename: string;
  year: number;
  paper: 'prelims' | 'mains';
  processingTime: number;
  totalQuestions: number;
  extractedQuestions: ExtractedQuestion[];
  analytics: {
    difficultyDistribution: Record<string, number>;
    topicDistribution: Record<string, number>;
    bloomDistribution: Record<string, number>;
    averageDifficulty: number;
    uniqueTopics: number;
  };
  trendAnalysis: {
    repeatedTopics: string[];
    emergingTopics: string[];
    hottestTopics: string[];
    patternInsights: string[];
  };
  metadata: {
    totalPages: number;
    confidenceScore: number;
    ocrQuality: number;
    processingNotes: string[];
  };
}

interface PDFAnalysisUploaderProps {
  userId: string;
  className?: string;
  onAnalysisComplete?: (result: PDFProcessingResult) => void;
}

export function PDFAnalysisUploader({ userId, className, onAnalysisComplete }: PDFAnalysisUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processingResults, setProcessingResults] = useState<PDFProcessingResult[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [selectedPaper, setSelectedPaper] = useState<'prelims' | 'mains'>('prelims');
  const [isProcessing, setIsProcessing] = useState(false);

  const glassmorphicStyles = {
    card: "relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg",
    container: "relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: `file_${Date.now()}_${Math.random()}`,
      file,
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach(uploadedFile => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === uploadedFile.id 
                ? { ...f, status: 'processing', progress: 0 }
                : f
            )
          );
          processFile(uploadedFile);
        }
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, progress }
              : f
          )
        );
      }, 200);
    });
  }, []);

  const processFile = async (uploadedFile: UploadedFile) => {
    setIsProcessing(true);
    
    // Simulate AI processing
    let progress = 0;
    const processingInterval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(processingInterval);
        completeProcessing(uploadedFile);
      }
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, progress }
            : f
        )
      );
    }, 300);
  };

  const completeProcessing = (uploadedFile: UploadedFile) => {
    // Mock processing result
    const mockResult: PDFProcessingResult = {
      fileId: uploadedFile.id,
      filename: uploadedFile.file.name,
      year: parseInt(selectedYear),
      paper: selectedPaper,
      processingTime: 45,
      totalQuestions: 25,
      extractedQuestions: [
        {
          id: 'q1',
          questionNumber: 1,
          questionText: 'Which of the following constitutional provisions deals with the amendment of the Constitution?',
          options: ['Article 356', 'Article 368', 'Article 370', 'Article 372'],
          marks: 2,
          difficulty: 6,
          topics: ['Constitution', 'Amendments'],
          syllabusTags: ['gs2_polity_constitution'],
          bloomLevel: 'Remember',
          conceptualDepth: 7,
          relevanceScore: 92
        },
        {
          id: 'q2',
          questionNumber: 2,
          questionText: 'Consider the following statements about the Directive Principles of State Policy...',
          options: ['1, 2 and 3 only', '2 and 4 only', '1, 3 and 4 only', '1, 2, 3 and 4'],
          marks: 2,
          difficulty: 8,
          topics: ['DPSP', 'Constitution'],
          syllabusTags: ['gs2_polity_dpsp'],
          bloomLevel: 'Understand',
          conceptualDepth: 8,
          relevanceScore: 88
        }
      ],
      analytics: {
        difficultyDistribution: { 'Easy': 20, 'Medium': 60, 'Hard': 20 },
        topicDistribution: { 'Polity': 40, 'History': 25, 'Geography': 20, 'Economics': 15 },
        bloomDistribution: { 'Remember': 30, 'Understand': 40, 'Apply': 20, 'Analyze': 10 },
        averageDifficulty: 6.5,
        uniqueTopics: 45
      },
      trendAnalysis: {
        repeatedTopics: ['Constitution', 'Fundamental Rights', 'Governance'],
        emergingTopics: ['Digital India', 'Climate Change', 'Space Technology'],
        hottestTopics: ['Constitution', 'Current Affairs', 'Economic Survey'],
        patternInsights: [
          'Constitutional questions increased by 15% compared to last year',
          'Environment topics showing upward trend',
          'Static portions from History declining'
        ]
      },
      metadata: {
        totalPages: 24,
        confidenceScore: 92,
        ocrQuality: 95,
        processingNotes: [
          'High quality scan detected',
          'All questions extracted successfully',
          'Some diagrams required manual verification'
        ]
      }
    };

    setUploadedFiles(prev => 
      prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'completed', progress: 100 }
          : f
      )
    );

    setProcessingResults(prev => [...prev, mockResult]);
    setIsProcessing(false);
    
    if (onAnalysisComplete) {
      onAnalysisComplete(mockResult);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setProcessingResults(prev => prev.filter(r => r.fileId !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={glassmorphicStyles.container}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-purple-400" />
                PDF Analysis & Question Extraction
              </h2>
              <p className="text-foreground/70 mt-1">
                Upload UPSC question papers for AI-powered analysis and question extraction
              </p>
            </div>
            
            <Badge variant="outline" className="bg-white/10 border-white/20 px-3 py-1">
              <Brain className="h-4 w-4 mr-1" />
              AI Powered
            </Badge>
          </div>

          {/* Configuration */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Exam Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="bg-white/10 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Paper Type</Label>
              <Select value={selectedPaper} onValueChange={(value: any) => setSelectedPaper(value)}>
                <SelectTrigger className="bg-white/10 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prelims">Prelims</SelectItem>
                  <SelectItem value="mains">Mains</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <div className="text-sm text-foreground/70">
                Configure paper details before upload
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={glassmorphicStyles.card}
      >
        <div className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragActive 
                ? 'border-blue-400 bg-blue-400/10' 
                : 'border-white/30 hover:border-white/50 hover:bg-white/5'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-foreground/50" />
            <h3 className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop PDFs here...' : 'Upload UPSC Question Papers'}
            </h3>
            <p className="text-foreground/60 mb-4">
              Drag and drop PDF files or click to browse
            </p>
            <p className="text-sm text-foreground/50">
              Supports: PDF files • Max size: 50MB per file
            </p>
          </div>
        </div>
      </motion.div>

      {/* Uploaded Files */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={glassmorphicStyles.card}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Processing Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadedFiles.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-purple-400" />
                      <div>
                        <h4 className="font-medium">{file.file.name}</h4>
                        <p className="text-sm text-foreground/60">
                          {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`bg-white/10 border-white/20 ${
                        file.status === 'completed' ? 'text-green-400' :
                        file.status === 'error' ? 'text-red-400' :
                        file.status === 'processing' ? 'text-blue-400' : 'text-amber-400'
                      }`}>
                        {file.status === 'uploading' && <Upload className="h-3 w-3 mr-1" />}
                        {file.status === 'processing' && <Brain className="h-3 w-3 mr-1" />}
                        {file.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {file.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        {file.status === 'uploading' ? 'Uploading...' :
                         file.status === 'processing' ? 'AI Processing...' :
                         file.status === 'completed' ? 'Completed' : 'Error'}
                      </span>
                      <span>{Math.round(file.progress)}%</span>
                    </div>
                    <Progress value={file.progress} className="h-2" />
                  </div>
                  
                  {file.status === 'processing' && (
                    <div className="mt-3 text-sm text-foreground/60">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Extracting questions and analyzing content...
                      </div>
                    </div>
                  )}
                  
                  {file.error && (
                    <div className="mt-3 text-sm text-red-400">
                      Error: {file.error}
                    </div>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Results */}
      <AnimatePresence>
        {processingResults.map((result, index) => (
          <motion.div
            key={result.fileId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={glassmorphicStyles.card}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  Analysis Complete: {result.filename}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{result.totalQuestions}</div>
                  <div className="text-sm text-foreground/70">Questions Extracted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{result.metadata.confidenceScore}%</div>
                  <div className="text-sm text-foreground/70">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{result.analytics.uniqueTopics}</div>
                  <div className="text-sm text-foreground/70">Unique Topics</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{result.analytics.averageDifficulty}</div>
                  <div className="text-sm text-foreground/70">Avg Difficulty</div>
                </div>
              </div>

              <Separator className="bg-white/20" />

              {/* Topic Distribution */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Topic Distribution
                </h4>
                <div className="space-y-3">
                  {Object.entries(result.analytics.topicDistribution).map(([topic, percentage]) => (
                    <div key={topic}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{topic}</span>
                        <span>{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-white/20" />

              {/* Trend Analysis */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trend Analysis
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-green-400 mb-2">Hot Topics</h5>
                    <div className="space-y-1">
                      {result.trendAnalysis.hottestTopics.map((topic, i) => (
                        <Badge key={i} variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400 mr-1 mb-1">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-blue-400 mb-2">Emerging Topics</h5>
                    <div className="space-y-1">
                      {result.trendAnalysis.emergingTopics.map((topic, i) => (
                        <Badge key={i} variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 mr-1 mb-1">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-amber-400 mb-2">Repeated Topics</h5>
                    <div className="space-y-1">
                      {result.trendAnalysis.repeatedTopics.map((topic, i) => (
                        <Badge key={i} variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400 mr-1 mb-1">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/20" />

              {/* Pattern Insights */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  AI Insights
                </h4>
                <ul className="space-y-2">
                  {result.trendAnalysis.patternInsights.map((insight, i) => (
                    <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator className="bg-white/20" />

              {/* Sample Questions */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileQuestion className="h-4 w-4" />
                  Sample Extracted Questions
                </h4>
                <div className="space-y-3">
                  {result.extractedQuestions.slice(0, 2).map((question, i) => (
                    <div key={question.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="bg-white/10 border-white/20 text-xs">
                          Question {question.questionNumber}
                        </Badge>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-white/10 border-white/20 text-xs">
                            {question.marks} marks
                          </Badge>
                          <Badge variant="outline" className="bg-white/10 border-white/20 text-xs">
                            Difficulty: {question.difficulty}/10
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm mb-3">{question.questionText}</p>
                      <div className="flex flex-wrap gap-1">
                        {question.topics.map((topic, j) => (
                          <Badge key={j} variant="outline" className="bg-white/5 border-white/10 text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {result.extractedQuestions.length > 2 && (
                  <div className="text-center mt-4">
                    <Button variant="outline" className="bg-white/10 border-white/20">
                      View All {result.totalQuestions} Questions
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty State */}
      {uploadedFiles.length === 0 && processingResults.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${glassmorphicStyles.card} text-center py-12`}
        >
          <Brain className="h-12 w-12 mx-auto text-purple-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Ready for AI Analysis</h3>
          <p className="text-foreground/60 mb-4">
            Upload UPSC question papers to extract questions, analyze trends, and get insights
          </p>
          <div className="flex justify-center gap-4 text-sm text-foreground/60">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              OCR Text Extraction
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Topic Classification
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trend Analysis
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}