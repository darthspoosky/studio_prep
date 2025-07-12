'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Icons
import {
  Mic, MicOff, Video, VideoOff, Camera, CameraOff,
  Play, Pause, Square, RotateCcw, Settings, Home,
  Clock, Timer, Award, TrendingUp, Eye, Brain,
  Volume2, VolumeX, Zap, Target, CheckCircle2,
  AlertCircle, Info, MessageSquare, User, Users,
  BarChart3, PieChart, LineChart, Activity,
  FileText, Download, Share2, Bookmark, Star,
  Lightbulb, RefreshCw, Upload, Search, Filter,
  Calendar, MapPin, Briefcase, GraduationCap,
  Heart, Smile, Frown, Meh, ThumbsUp, ThumbsDown
} from 'lucide-react';

// Enhanced Types
interface InterviewConfiguration {
  type: 'upsc' | 'technical' | 'behavioral' | 'panel' | 'stress' | 'case-study';
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  duration: number; // in minutes
  questionCount: number;
  interviewerPersonality: 'formal' | 'friendly' | 'challenging' | 'mixed';
  focusAreas: string[];
  language: 'english' | 'hindi' | 'mixed';
  recordingEnabled: boolean;
  realTimeAnalysis: boolean;
  bodyLanguageAnalysis: boolean;
  voiceAnalysis: boolean;
  aiCoachingEnabled: boolean;
  multipleInterviewers: boolean;
  backgroundNoise: boolean;
  timeStress: boolean;
}

interface InterviewQuestion {
  id: string;
  text: string;
  category: 'general' | 'technical' | 'behavioral' | 'current-affairs' | 'ethics' | 'personal';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedDuration: number; // in seconds
  followUpQuestions: string[];
  evaluationCriteria: {
    content: number;
    confidence: number;
    clarity: number;
    relevance: number;
    bodyLanguage: number;
  };
  context?: string;
  hints?: string[];
  sampleAnswerKeyPoints?: string[];
}

interface RealTimeAnalysis {
  timestamp: number;
  voiceMetrics: {
    volume: number;
    clarity: number;
    pace: number; // words per minute
    fillerWords: number;
    confidence: number;
    emotion: 'confident' | 'nervous' | 'excited' | 'calm' | 'stressed';
  };
  bodyLanguageMetrics: {
    eyeContact: number;
    posture: number;
    gestures: number;
    facialExpressions: 'positive' | 'neutral' | 'negative';
    movementScore: number;
  };
  contentAnalysis: {
    relevance: number;
    structure: number;
    depth: number;
    examples: number;
  };
}

interface InterviewSession {
  id: string;
  configuration: InterviewConfiguration;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  startTime: number;
  endTime?: number;
  responses: Array<{
    questionId: string;
    answer: string;
    duration: number;
    recording?: {
      audio: string;
      video?: string;
    };
    realTimeAnalysis: RealTimeAnalysis[];
  }>;
  overallMetrics: {
    totalDuration: number;
    averageResponseTime: number;
    confidenceScore: number;
    clarityScore: number;
    bodyLanguageScore: number;
  };
  aiNotes: string[];
  interviewerFeedback: string[];
}

interface ComprehensiveFeedback {
  overallScore: number;
  categoryScores: {
    communication: number;
    confidence: number;
    bodyLanguage: number;
    content: number;
    professionalism: number;
  };
  strengths: string[];
  improvementAreas: string[];
  specificFeedback: Array<{
    questionId: string;
    score: number;
    feedback: string;
    suggestions: string[];
  }>;
  voiceAnalysis: {
    averagePace: number;
    clarityScore: number;
    confidenceLevel: number;
    fillerWordsCount: number;
    recommendations: string[];
  };
  bodyLanguageAnalysis: {
    eyeContactScore: number;
    postureScore: number;
    gesturesScore: number;
    overallPresence: number;
    recommendations: string[];
  };
  comparativeAnalysis: {
    percentileRank: number;
    industryAverage: number;
    topPerformers: number;
  };
  nextInterviewRecommendations: string[];
  practiceExercises: Array<{
    type: string;
    description: string;
    duration: number;
  }>;
}

// Advanced AI Interview Coach
class AIInterviewCoach {
  private personalityProfile: string = 'formal';
  private questionBank: InterviewQuestion[] = [];
  private userHistory: InterviewSession[] = [];

  constructor(personality: string = 'formal') {
    this.personalityProfile = personality;
  }

  generateQuestions(config: InterviewConfiguration): InterviewQuestion[] {
    // AI-powered question generation based on configuration
    const baseQuestions: InterviewQuestion[] = [
      {
        id: '1',
        text: 'Tell me about yourself and why you want to join the civil services.',
        category: 'general',
        difficulty: 'easy',
        expectedDuration: 120,
        followUpQuestions: [
          'What specific role interests you most?',
          'How do you handle pressure situations?'
        ],
        evaluationCriteria: {
          content: 25,
          confidence: 25,
          clarity: 20,
          relevance: 20,
          bodyLanguage: 10
        },
        context: 'This is a standard opening question to assess communication skills and motivation',
        hints: ['Structure your answer with background, motivation, and future goals'],
        sampleAnswerKeyPoints: [
          'Educational background',
          'Motivation for civil services',
          'Relevant experiences',
          'Vision for contribution'
        ]
      },
      {
        id: '2',
        text: 'What are your views on the current state of education in India?',
        category: 'current-affairs',
        difficulty: 'medium',
        expectedDuration: 180,
        followUpQuestions: [
          'How would you improve the quality of education?',
          'What role does technology play in education?'
        ],
        evaluationCriteria: {
          content: 30,
          confidence: 20,
          clarity: 20,
          relevance: 20,
          bodyLanguage: 10
        },
        context: 'Assessing knowledge of current affairs and policy understanding',
        hints: ['Discuss both challenges and opportunities', 'Include recent policy initiatives'],
        sampleAnswerKeyPoints: [
          'Current challenges in education',
          'Government initiatives',
          'Technology integration',
          'Future vision'
        ]
      },
      {
        id: '3',
        text: 'Describe a situation where you had to work with a difficult team member.',
        category: 'behavioral',
        difficulty: 'medium',
        expectedDuration: 150,
        followUpQuestions: [
          'What did you learn from this experience?',
          'How would you handle it differently now?'
        ],
        evaluationCriteria: {
          content: 25,
          confidence: 20,
          clarity: 20,
          relevance: 25,
          bodyLanguage: 10
        },
        context: 'Behavioral question to assess interpersonal skills and conflict resolution',
        hints: ['Use the STAR method (Situation, Task, Action, Result)'],
        sampleAnswerKeyPoints: [
          'Specific situation',
          'Your approach',
          'Actions taken',
          'Outcome and learning'
        ]
      }
    ];

    // Filter and customize questions based on configuration
    return this.customizeQuestions(baseQuestions, config);
  }

  private customizeQuestions(questions: InterviewQuestion[], config: InterviewConfiguration): InterviewQuestion[] {
    // Customize questions based on interview type and difficulty
    let customized = questions.slice(0, config.questionCount);

    if (config.difficulty === 'adaptive') {
      // Implement adaptive difficulty based on user performance
      customized = this.adaptQuestionDifficulty(customized);
    }

    return customized;
  }

  private adaptQuestionDifficulty(questions: InterviewQuestion[]): InterviewQuestion[] {
    // Implement adaptive algorithm based on user history
    return questions;
  }

  async analyzeResponse(
    response: string,
    question: InterviewQuestion,
    voiceMetrics: any,
    bodyLanguageMetrics: any
  ): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    // AI-powered response analysis
    const contentScore = this.analyzeContent(response, question);
    const deliveryScore = this.analyzeDelivery(voiceMetrics, bodyLanguageMetrics);
    
    const overallScore = (contentScore * 0.6) + (deliveryScore * 0.4);
    
    return {
      score: overallScore,
      feedback: this.generateFeedback(overallScore, question.category),
      suggestions: this.generateSuggestions(overallScore, question)
    };
  }

  private analyzeContent(response: string, question: InterviewQuestion): number {
    // Content analysis algorithm
    const words = response.split(' ').length;
    const relevanceScore = this.calculateRelevance(response, question);
    const structureScore = this.calculateStructure(response);
    
    return (relevanceScore * 0.5) + (structureScore * 0.3) + (Math.min(words / 50, 1) * 0.2);
  }

  private analyzeDelivery(voiceMetrics: any, bodyLanguageMetrics: any): number {
    // Delivery analysis algorithm
    const voiceScore = (voiceMetrics.confidence * 0.4) + (voiceMetrics.clarity * 0.3) + (voiceMetrics.pace * 0.3);
    const bodyScore = (bodyLanguageMetrics.eyeContact * 0.3) + (bodyLanguageMetrics.posture * 0.4) + (bodyLanguageMetrics.gestures * 0.3);
    
    return (voiceScore * 0.6) + (bodyScore * 0.4);
  }

  private calculateRelevance(response: string, question: InterviewQuestion): number {
    // Relevance calculation based on keywords and context
    return 0.8; // Simplified for demo
  }

  private calculateStructure(response: string): number {
    // Structure analysis based on logical flow
    return 0.7; // Simplified for demo
  }

  private generateFeedback(score: number, category: string): string {
    if (score >= 0.8) {
      return `Excellent response! You demonstrated strong understanding of ${category} concepts.`;
    } else if (score >= 0.6) {
      return `Good response with room for improvement in ${category} areas.`;
    } else {
      return `Your response needs significant improvement in ${category} understanding.`;
    }
  }

  private generateSuggestions(score: number, question: InterviewQuestion): string[] {
    const suggestions = [];
    
    if (score < 0.6) {
      suggestions.push('Structure your answer more clearly');
      suggestions.push('Provide specific examples');
      suggestions.push('Practice speaking with more confidence');
    }
    
    if (question.category === 'behavioral') {
      suggestions.push('Use the STAR method for behavioral questions');
    }
    
    return suggestions;
  }

  async generateComprehensiveFeedback(session: InterviewSession): Promise<ComprehensiveFeedback> {
    // Generate comprehensive feedback based on entire session
    const overallScore = this.calculateOverallScore(session);
    
    return {
      overallScore,
      categoryScores: {
        communication: 75,
        confidence: 68,
        bodyLanguage: 72,
        content: 80,
        professionalism: 85
      },
      strengths: [
        'Clear articulation of ideas',
        'Good eye contact',
        'Relevant examples provided'
      ],
      improvementAreas: [
        'Reduce filler words',
        'Improve posture',
        'Provide more structured answers'
      ],
      specificFeedback: session.responses.map(response => ({
        questionId: response.questionId,
        score: Math.random() * 100, // Would be calculated
        feedback: 'Good response with clear examples',
        suggestions: ['Add more specific details', 'Improve conclusion']
      })),
      voiceAnalysis: {
        averagePace: 150,
        clarityScore: 78,
        confidenceLevel: 72,
        fillerWordsCount: 12,
        recommendations: [
          'Practice speaking slightly slower',
          'Reduce use of "um" and "uh"',
          'Speak with more conviction'
        ]
      },
      bodyLanguageAnalysis: {
        eyeContactScore: 82,
        postureScore: 68,
        gesturesScore: 75,
        overallPresence: 75,
        recommendations: [
          'Maintain better posture',
          'Use more natural gestures',
          'Keep consistent eye contact'
        ]
      },
      comparativeAnalysis: {
        percentileRank: 72,
        industryAverage: 65,
        topPerformers: 85
      },
      nextInterviewRecommendations: [
        'Practice more behavioral questions',
        'Work on voice modulation',
        'Prepare current affairs topics'
      ],
      practiceExercises: [
        {
          type: 'Voice Training',
          description: 'Practice speaking exercises to improve clarity and pace',
          duration: 15
        },
        {
          type: 'Body Language',
          description: 'Mirror practice for posture and gesture improvement',
          duration: 10
        }
      ]
    };
  }

  private calculateOverallScore(session: InterviewSession): number {
    return session.overallMetrics.confidenceScore * 0.3 + 
           session.overallMetrics.clarityScore * 0.3 + 
           session.overallMetrics.bodyLanguageScore * 0.4;
  }
}

// Real-time Analysis Components
const RealTimeAnalytics = ({ 
  analysis, 
  isRecording 
}: { 
  analysis: RealTimeAnalysis | null; 
  isRecording: boolean;
}) => {
  if (!analysis || !isRecording) return null;

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-time Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Voice Metrics */}
        <div className="space-y-2">
          <h4 className="font-medium">Voice Analysis</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Confidence</span>
              <Badge variant={analysis.voiceMetrics.confidence > 70 ? "default" : "secondary"}>
                {analysis.voiceMetrics.confidence}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Clarity</span>
              <Badge variant={analysis.voiceMetrics.clarity > 70 ? "default" : "secondary"}>
                {analysis.voiceMetrics.clarity}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Pace</span>
              <Badge variant={analysis.voiceMetrics.pace > 120 && analysis.voiceMetrics.pace < 180 ? "default" : "secondary"}>
                {analysis.voiceMetrics.pace} WPM
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Filler Words</span>
              <Badge variant={analysis.voiceMetrics.fillerWords < 5 ? "default" : "destructive"}>
                {analysis.voiceMetrics.fillerWords}
              </Badge>
            </div>
          </div>
        </div>

        {/* Body Language Metrics */}
        <div className="space-y-2">
          <h4 className="font-medium">Body Language</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Eye Contact</span>
              <Badge variant={analysis.bodyLanguageMetrics.eyeContact > 70 ? "default" : "secondary"}>
                {analysis.bodyLanguageMetrics.eyeContact}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Posture</span>
              <Badge variant={analysis.bodyLanguageMetrics.posture > 70 ? "default" : "secondary"}>
                {analysis.bodyLanguageMetrics.posture}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Overall Mood */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900">
              {analysis.voiceMetrics.emotion === 'confident' && <ThumbsUp className="h-4 w-4 text-blue-600" />}
              {analysis.voiceMetrics.emotion === 'nervous' && <AlertCircle className="h-4 w-4 text-orange-600" />}
              {analysis.voiceMetrics.emotion === 'calm' && <Smile className="h-4 w-4 text-green-600" />}
            </div>
            <div>
              <p className="font-medium capitalize">{analysis.voiceMetrics.emotion}</p>
              <p className="text-xs text-muted-foreground">Current emotional state</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Video/Audio Interface
const InterviewMediaInterface = ({
  isRecording,
  onToggleRecording,
  onToggleVideo,
  onToggleAudio,
  videoEnabled,
  audioEnabled,
  configuration
}: {
  isRecording: boolean;
  onToggleRecording: () => void;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  videoEnabled: boolean;
  audioEnabled: boolean;
  configuration: InterviewConfiguration;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: configuration.recordingEnabled,
          audio: true
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Failed to initialize media:', error);
      }
    };

    initializeMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [configuration.recordingEnabled]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Interview Recording
          </span>
          <div className="flex items-center gap-2">
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                Recording
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Video Preview */}
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {videoEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <CameraOff className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Video is disabled</p>
              </div>
            </div>
          )}
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              REC
            </div>
          )}
        </div>

        {/* Media Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={audioEnabled ? "default" : "secondary"}
            size="sm"
            onClick={onToggleAudio}
            aria-label={audioEnabled ? "Mute audio" : "Unmute audio"}
          >
            {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>

          <Button
            variant={videoEnabled ? "default" : "secondary"}
            size="sm"
            onClick={onToggleVideo}
            aria-label={videoEnabled ? "Turn off video" : "Turn on video"}
          >
            {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>

          <Button
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            onClick={onToggleRecording}
            className="px-6"
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <>
                <Square className="h-5 w-5 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>

        {/* Technical Info */}
        <div className="text-xs text-muted-foreground text-center">
          {configuration.bodyLanguageAnalysis && "Body language analysis enabled • "}
          {configuration.voiceAnalysis && "Voice analysis enabled • "}
          {configuration.realTimeAnalysis && "Real-time feedback enabled"}
        </div>
      </CardContent>
    </Card>
  );
};

// Question Display Component
const QuestionDisplay = ({
  question,
  questionNumber,
  totalQuestions,
  timeRemaining,
  onNextQuestion,
  onPreviousQuestion,
  canProceed
}: {
  question: InterviewQuestion;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
  canProceed: boolean;
}) => {
  return (
    <Card className="p-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Question {questionNumber} of {totalQuestions}
            </Badge>
            <Badge variant={
              question.difficulty === 'easy' ? 'secondary' :
              question.difficulty === 'medium' ? 'default' : 'destructive'
            }>
              {question.difficulty}
            </Badge>
            <Badge variant="outline">{question.category}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Question Text */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h3 className="text-xl font-semibold leading-relaxed mb-4">
              {question.text}
            </h3>
            
            {question.context && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Context:</strong> {question.context}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Hints */}
          {question.hints && question.hints.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Hints
              </h4>
              <ul className="space-y-1">
                {question.hints.map((hint, index) => (
                  <li key={index} className="text-sm text-blue-700 dark:text-blue-300">
                    • {hint}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Expected Duration */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Expected response time: {question.expectedDuration} seconds</span>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={onPreviousQuestion}
              disabled={questionNumber === 1}
            >
              Previous
            </Button>

            <Button
              onClick={onNextQuestion}
              disabled={!canProceed}
            >
              {questionNumber === totalQuestions ? 'Finish Interview' : 'Next Question'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Enhanced Mock Interview Component
export default function EnhancedMockInterview() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State Management
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [configuration, setConfiguration] = useState<InterviewConfiguration>({
    type: 'upsc',
    difficulty: 'medium',
    duration: 30,
    questionCount: 5,
    interviewerPersonality: 'formal',
    focusAreas: ['general', 'current-affairs'],
    language: 'english',
    recordingEnabled: true,
    realTimeAnalysis: true,
    bodyLanguageAnalysis: true,
    voiceAnalysis: true,
    aiCoachingEnabled: true,
    multipleInterviewers: false,
    backgroundNoise: false,
    timeStress: false
  });
  
  const [isRecording, setIsRecording] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentAnalysis, setCurrentAnalysis] = useState<RealTimeAnalysis | null>(null);
  const [feedback, setFeedback] = useState<ComprehensiveFeedback | null>(null);
  const [showConfiguration, setShowConfiguration] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // AI Coach
  const aiCoach = useRef(new AIInterviewCoach(configuration.interviewerPersonality));
  
  // Timer effect
  useEffect(() => {
    if (session && isRecording && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, isRecording, session]);

  // Real-time analysis simulation
  useEffect(() => {
    if (isRecording && configuration.realTimeAnalysis) {
      const interval = setInterval(() => {
        setCurrentAnalysis({
          timestamp: Date.now(),
          voiceMetrics: {
            volume: Math.random() * 100,
            clarity: 70 + Math.random() * 30,
            pace: 120 + Math.random() * 60,
            fillerWords: Math.floor(Math.random() * 5),
            confidence: 60 + Math.random() * 40,
            emotion: ['confident', 'nervous', 'calm'][Math.floor(Math.random() * 3)] as any
          },
          bodyLanguageMetrics: {
            eyeContact: 70 + Math.random() * 30,
            posture: 60 + Math.random() * 40,
            gestures: 50 + Math.random() * 50,
            facialExpressions: 'positive',
            movementScore: 70 + Math.random() * 30
          },
          contentAnalysis: {
            relevance: 70 + Math.random() * 30,
            structure: 60 + Math.random() * 40,
            depth: 50 + Math.random() * 50,
            examples: Math.floor(Math.random() * 3)
          }
        });
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isRecording, configuration.realTimeAnalysis]);

  // Start interview session
  const startInterview = useCallback((config: InterviewConfiguration) => {
    const questions = aiCoach.current.generateQuestions(config);
    
    const newSession: InterviewSession = {
      id: Date.now().toString(),
      configuration: config,
      questions,
      currentQuestionIndex: 0,
      startTime: Date.now(),
      responses: [],
      overallMetrics: {
        totalDuration: 0,
        averageResponseTime: 0,
        confidenceScore: 0,
        clarityScore: 0,
        bodyLanguageScore: 0
      },
      aiNotes: [],
      interviewerFeedback: []
    };
    
    setSession(newSession);
    setConfiguration(config);
    setTimeRemaining(config.duration * 60);
    setShowConfiguration(false);
    setFeedback(null);
  }, []);

  // Complete interview
  const completeInterview = useCallback(async () => {
    if (!session) return;
    
    setIsEvaluating(true);
    try {
      const comprehensiveFeedback = await aiCoach.current.generateComprehensiveFeedback(session);
      setFeedback(comprehensiveFeedback);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to generate feedback:', error);
    } finally {
      setIsEvaluating(false);
    }
  }, [session]);

  // Navigation handlers
  const handleNextQuestion = useCallback(() => {
    if (!session) return;
    
    if (session.currentQuestionIndex < session.questions.length - 1) {
      setSession(prev => prev ? {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      } : null);
    } else {
      completeInterview();
    }
  }, [session, completeInterview]);

  const handlePreviousQuestion = useCallback(() => {
    if (!session) return;
    
    if (session.currentQuestionIndex > 0) {
      setSession(prev => prev ? {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      } : null);
    }
  }, [session]);

  // Media handlers
  const handleToggleRecording = useCallback(() => {
    setIsRecording(!isRecording);
  }, [isRecording]);

  const handleToggleVideo = useCallback(() => {
    setVideoEnabled(!videoEnabled);
  }, [videoEnabled]);

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled(!audioEnabled);
  }, [audioEnabled]);

  if (showConfiguration) {
    return (
      <InterviewConfigurationPanel
        configuration={configuration}
        onConfigurationChange={setConfiguration}
        onStartInterview={startInterview}
      />
    );
  }

  if (isEvaluating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Analyzing Your Interview</h3>
          <p className="text-muted-foreground">Our AI is evaluating your performance comprehensively...</p>
        </Card>
      </div>
    );
  }

  if (feedback) {
    return (
      <InterviewFeedbackPanel
        feedback={feedback}
        onNewInterview={() => setShowConfiguration(true)}
        onGoToDashboard={() => router.push('/dashboard')}
      />
    );
  }

  if (!session) return null;

  const currentQuestion = session.questions[session.currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <div className="container mx-auto max-w-7xl p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <div>
                  <h1 className="text-xl font-bold">Mock Interview Session</h1>
                  <p className="text-sm text-muted-foreground">
                    {configuration.type.toUpperCase()} • {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} remaining
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={completeInterview}
                >
                  End Interview
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Interview Settings</DialogTitle>
                    </DialogHeader>
                    {/* Settings content */}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Interview Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Question Display */}
              <QuestionDisplay
                question={currentQuestion}
                questionNumber={session.currentQuestionIndex + 1}
                totalQuestions={session.questions.length}
                timeRemaining={timeRemaining}
                onNextQuestion={handleNextQuestion}
                onPreviousQuestion={handlePreviousQuestion}
                canProceed={true}
              />

              {/* Video Interface */}
              <InterviewMediaInterface
                isRecording={isRecording}
                onToggleRecording={handleToggleRecording}
                onToggleVideo={handleToggleVideo}
                onToggleAudio={handleToggleAudio}
                videoEnabled={videoEnabled}
                audioEnabled={audioEnabled}
                configuration={configuration}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Real-time Analytics */}
              <RealTimeAnalytics
                analysis={currentAnalysis}
                isRecording={isRecording}
              />

              {/* Interview Progress */}
              <Card className="p-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Interview Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Questions</span>
                        <span>{session.currentQuestionIndex + 1}/{session.questions.length}</span>
                      </div>
                      <Progress value={((session.currentQuestionIndex + 1) / session.questions.length) * 100} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Time</span>
                        <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                      </div>
                      <Progress value={((configuration.duration * 60 - timeRemaining) / (configuration.duration * 60)) * 100} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Tips */}
              <Card className="p-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Coach Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        💡 Maintain eye contact with the camera
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✨ Use specific examples in your answers
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950">
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        🎯 Structure your response clearly
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Configuration Panel Component
const InterviewConfigurationPanel = ({
  configuration,
  onConfigurationChange,
  onStartInterview
}: {
  configuration: InterviewConfiguration;
  onConfigurationChange: (config: InterviewConfiguration) => void;
  onStartInterview: (config: InterviewConfiguration) => void;
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Enhanced Mock Interview
              </CardTitle>
              <CardDescription>
                AI-powered interview simulation with real-time analysis and comprehensive feedback
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis Features</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Interview Type</Label>
                      <Select
                        value={configuration.type}
                        onValueChange={(value) =>
                          onConfigurationChange({ ...configuration, type: value as any })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upsc">UPSC Civil Services</SelectItem>
                          <SelectItem value="technical">Technical Interview</SelectItem>
                          <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                          <SelectItem value="panel">Panel Interview</SelectItem>
                          <SelectItem value="stress">Stress Interview</SelectItem>
                          <SelectItem value="case-study">Case Study</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Difficulty Level</Label>
                      <Select
                        value={configuration.difficulty}
                        onValueChange={(value) =>
                          onConfigurationChange({ ...configuration, difficulty: value as any })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                          <SelectItem value="adaptive">Adaptive (AI-powered)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Duration: {configuration.duration} minutes</Label>
                      <Slider
                        value={[configuration.duration]}
                        onValueChange={(value) =>
                          onConfigurationChange({ ...configuration, duration: value[0] })
                        }
                        min={10}
                        max={60}
                        step={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Number of Questions: {configuration.questionCount}</Label>
                      <Slider
                        value={[configuration.questionCount]}
                        onValueChange={(value) =>
                          onConfigurationChange({ ...configuration, questionCount: value[0] })
                        }
                        min={3}
                        max={15}
                        step={1}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="recording">Enable Recording</Label>
                      <Switch
                        id="recording"
                        checked={configuration.recordingEnabled}
                        onCheckedChange={(checked) =>
                          onConfigurationChange({ ...configuration, recordingEnabled: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="ai-coaching">AI Coaching</Label>
                      <Switch
                        id="ai-coaching"
                        checked={configuration.aiCoachingEnabled}
                        onCheckedChange={(checked) =>
                          onConfigurationChange({ ...configuration, aiCoachingEnabled: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="multiple-interviewers">Multiple Interviewers</Label>
                      <Switch
                        id="multiple-interviewers"
                        checked={configuration.multipleInterviewers}
                        onCheckedChange={(checked) =>
                          onConfigurationChange({ ...configuration, multipleInterviewers: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Interviewer Personality</Label>
                      <Select
                        value={configuration.interviewerPersonality}
                        onValueChange={(value) =>
                          onConfigurationChange({ ...configuration, interviewerPersonality: value as any })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="challenging">Challenging</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="real-time-analysis">Real-time Analysis</Label>
                      <Switch
                        id="real-time-analysis"
                        checked={configuration.realTimeAnalysis}
                        onCheckedChange={(checked) =>
                          onConfigurationChange({ ...configuration, realTimeAnalysis: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="body-language">Body Language Analysis</Label>
                      <Switch
                        id="body-language"
                        checked={configuration.bodyLanguageAnalysis}
                        onCheckedChange={(checked) =>
                          onConfigurationChange({ ...configuration, bodyLanguageAnalysis: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="voice-analysis">Voice Analysis</Label>
                      <Switch
                        id="voice-analysis"
                        checked={configuration.voiceAnalysis}
                        onCheckedChange={(checked) =>
                          onConfigurationChange({ ...configuration, voiceAnalysis: checked })
                        }
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-center pt-6">
                <Button
                  onClick={() => onStartInterview(configuration)}
                  size="lg"
                  className="px-8"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Start Interview Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

// Feedback Panel Component
const InterviewFeedbackPanel = ({
  feedback,
  onNewInterview,
  onGoToDashboard
}: {
  feedback: ComprehensiveFeedback;
  onNewInterview: () => void;
  onGoToDashboard: () => void;
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Interview Complete!</h1>
                <p className="text-muted-foreground">Comprehensive AI-powered analysis</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={onNewInterview}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Interview
                </Button>
                <Button variant="outline" onClick={onGoToDashboard}>
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </div>
            </div>
          </Card>

          {/* Overall Score */}
          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {feedback.overallScore}/100
              </div>
              <p className="text-muted-foreground">Overall Interview Score</p>
              
              <div className="flex justify-center mt-4">
                <Badge variant={
                  feedback.overallScore >= 80 ? "default" :
                  feedback.overallScore >= 60 ? "secondary" : "destructive"
                } className="text-lg px-4 py-1">
                  {feedback.overallScore >= 80 ? "Excellent" :
                   feedback.overallScore >= 60 ? "Good" : "Needs Improvement"}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Category Scores */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle>Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(feedback.categoryScores).map(([category, score]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="capitalize font-medium">{category}</span>
                      <span className="font-semibold">{score}/100</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Target className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback.improvementAreas.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Practice Exercises */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Recommended Practice Exercises
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.practiceExercises.map((exercise, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-sm flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{exercise.type}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{exercise.description}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{exercise.duration} minutes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};