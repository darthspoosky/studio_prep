'use client';

import React, { useReducer, useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Play,
  Square,
  Pause,
  Clock,
  User,
  Settings,
  Volume2,
  Download,
  Share2,
  RefreshCw,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Target,
  TrendingUp,
  BarChart3,
  Award,
  Camera,
  ArrowRight,
  Home
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EnhancedCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/enhanced-card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { glassmorphism } from '@/lib/design-system';
import MobileLayout from '@/components/layout/mobile-layout';

// Types
interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedDuration: number; // in seconds
  hints?: string[];
  followUpQuestions?: string[];
}

interface InterviewConfig {
  type: 'technical' | 'behavioral' | 'mixed';
  duration: number; // in minutes
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  enableVideo: boolean;
  enableAudio: boolean;
}

interface InterviewResponse {
  questionId: string;
  audioBlob?: Blob;
  videoBlob?: Blob;
  transcript?: string;
  duration: number;
  startTime: Date;
  endTime: Date;
}

interface InterviewFeedback {
  questionId: string;
  score: number; // 0-100
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  keyPoints: string[];
}

interface InterviewState {
  status: 'idle' | 'setup' | 'preparing' | 'active' | 'paused' | 'completed' | 'reviewing' | 'error';
  config: InterviewConfig | null;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  responses: InterviewResponse[];
  feedback: InterviewFeedback[];
  sessionDuration: number;
  startTime: Date | null;
  endTime: Date | null;
  currentRecording: {
    isRecording: boolean;
    startTime: Date | null;
    mediaRecorder: MediaRecorder | null;
  };
  mediaStream: MediaStream | null;
  error: string | null;
  countdown: number | null;
}

type InterviewAction =
  | { type: 'SET_CONFIG'; payload: InterviewConfig }
  | { type: 'LOAD_QUESTIONS'; payload: InterviewQuestion[] }
  | { type: 'START_INTERVIEW' }
  | { type: 'PAUSE_INTERVIEW' }
  | { type: 'RESUME_INTERVIEW' }
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING'; payload: InterviewResponse }
  | { type: 'NEXT_QUESTION' }
  | { type: 'COMPLETE_INTERVIEW' }
  | { type: 'SET_MEDIA_STREAM'; payload: MediaStream }
  | { type: 'SET_COUNTDOWN'; payload: number | null }
  | { type: 'TICK_TIMER' }
  | { type: 'ADD_FEEDBACK'; payload: InterviewFeedback }
  | { type: 'RESET_INTERVIEW' }
  | { type: 'SET_ERROR'; payload: string };

const initialState: InterviewState = {
  status: 'idle',
  config: null,
  questions: [],
  currentQuestionIndex: 0,
  responses: [],
  feedback: [],
  sessionDuration: 0,
  startTime: null,
  endTime: null,
  currentRecording: {
    isRecording: false,
    startTime: null,
    mediaRecorder: null,
  },
  mediaStream: null,
  error: null,
  countdown: null,
};

function interviewReducer(state: InterviewState, action: InterviewAction): InterviewState {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.payload, status: 'setup' };
    
    case 'LOAD_QUESTIONS':
      return { 
        ...state, 
        questions: action.payload,
        status: 'preparing',
        startTime: new Date()
      };
    
    case 'START_INTERVIEW':
      return { ...state, status: 'active' };
    
    case 'PAUSE_INTERVIEW':
      return { ...state, status: 'paused' };
    
    case 'RESUME_INTERVIEW':
      return { ...state, status: 'active' };
    
    case 'START_RECORDING':
      return {
        ...state,
        currentRecording: {
          isRecording: true,
          startTime: new Date(),
          mediaRecorder: state.currentRecording.mediaRecorder,
        }
      };
    
    case 'STOP_RECORDING':
      return {
        ...state,
        responses: [...state.responses, action.payload],
        currentRecording: {
          isRecording: false,
          startTime: null,
          mediaRecorder: null,
        }
      };
    
    case 'NEXT_QUESTION':
      return { 
        ...state, 
        currentQuestionIndex: state.currentQuestionIndex + 1
      };
    
    case 'COMPLETE_INTERVIEW':
      return { 
        ...state, 
        status: 'completed',
        endTime: new Date()
      };
    
    case 'SET_MEDIA_STREAM':
      return { ...state, mediaStream: action.payload };
    
    case 'SET_COUNTDOWN':
      return { ...state, countdown: action.payload };
    
    case 'TICK_TIMER':
      return { ...state, sessionDuration: state.sessionDuration + 1 };
    
    case 'ADD_FEEDBACK':
      return { 
        ...state, 
        feedback: [...state.feedback, action.payload]
      };
    
    case 'RESET_INTERVIEW':
      return { ...initialState };
    
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.payload };
    
    default:
      return state;
  }
}

// Mock data
const mockQuestions: InterviewQuestion[] = [
  {
    id: '1',
    question: 'Tell me about yourself and why you want to join the civil services.',
    category: 'Personal Background',
    difficulty: 'easy',
    expectedDuration: 120,
    hints: ['Talk about your educational background', 'Mention your motivation', 'Keep it concise and relevant'],
  },
  {
    id: '2',
    question: 'What do you think are the major challenges facing India\'s education system today?',
    category: 'Social Issues',
    difficulty: 'medium',
    expectedDuration: 180,
    hints: ['Consider access and quality issues', 'Think about rural-urban divide', 'Mention technology integration'],
    followUpQuestions: ['How would you address the teacher shortage in rural areas?'],
  },
  {
    id: '3',
    question: 'How would you handle a situation where you need to implement an unpopular but necessary policy?',
    category: 'Administrative Skills',
    difficulty: 'hard',
    expectedDuration: 240,
    hints: ['Focus on communication strategies', 'Mention stakeholder engagement', 'Consider long-term benefits'],
  },
];

export default function EnhancedMockInterviewPage() {
  const [state, dispatch] = useReducer(interviewReducer, initialState);
  const { toast } = useToast();
  const { user, trackToolUsage } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.status === 'active') {
      interval = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.status]);

  // Media stream setup
  useEffect(() => {
    if (state.status === 'preparing' && state.config?.enableVideo) {
      setupMediaStream();
    }
    
    return () => {
      if (state.mediaStream) {
        state.mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [state.status, state.config]);

  // Track tool usage
  useEffect(() => {
    if (state.status === 'active') {
      trackToolUsage('mock-interview');
    }
  }, [state.status, trackToolUsage]);

  const setupMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: state.config?.enableVideo || false,
        audio: state.config?.enableAudio || false,
      });
      
      dispatch({ type: 'SET_MEDIA_STREAM', payload: stream });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to access camera/microphone' });
    }
  };

  const handleStartInterview = useCallback(async (config: InterviewConfig) => {
    try {
      dispatch({ type: 'SET_CONFIG', payload: config });
      
      // Load questions (in real app, this would be an API call)
      setTimeout(() => {
        dispatch({ type: 'LOAD_QUESTIONS', payload: mockQuestions });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting interview:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start interview' });
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!state.mediaStream) return;
    
    // Start countdown
    let count = 3;
    dispatch({ type: 'SET_COUNTDOWN', payload: count });
    
    const countdownInterval = setInterval(() => {
      count--;
      dispatch({ type: 'SET_COUNTDOWN', payload: count });
      
      if (count <= 0) {
        clearInterval(countdownInterval);
        dispatch({ type: 'SET_COUNTDOWN', payload: null });
        initiateRecording();
      }
    }, 1000);
  }, [state.mediaStream]);

  const initiateRecording = useCallback(() => {
    if (!state.mediaStream) return;
    
    const mediaRecorder = new MediaRecorder(state.mediaStream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });
    
    const chunks: BlobPart[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const response: InterviewResponse = {
        questionId: state.questions[state.currentQuestionIndex].id,
        videoBlob: blob,
        duration: Date.now() - (state.currentRecording.startTime?.getTime() || 0),
        startTime: state.currentRecording.startTime || new Date(),
        endTime: new Date(),
        transcript: 'Mock transcript for demonstration', // In real app, this would come from speech-to-text
      };
      
      dispatch({ type: 'STOP_RECORDING', payload: response });
      
      // Mock feedback generation
      setTimeout(() => {
        const feedback: InterviewFeedback = {
          questionId: response.questionId,
          score: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
          strengths: ['Clear communication', 'Good structure'],
          improvements: ['Could be more specific', 'Add more examples'],
          suggestions: ['Practice with more examples', 'Work on confidence'],
          keyPoints: ['Mentioned relevant policies', 'Good understanding of issues'],
        };
        
        dispatch({ type: 'ADD_FEEDBACK', payload: feedback });
      }, 2000);
    };
    
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    dispatch({ type: 'START_RECORDING' });
  }, [state.mediaStream, state.questions, state.currentQuestionIndex, state.currentRecording.startTime]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <MobileLayout>
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {state.status === 'idle' && (
            <motion.div
              key="interview-setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <InterviewSetupScreen onStart={handleStartInterview} />
            </motion.div>
          )}
          
          {state.status === 'setup' && (
            <motion.div
              key="interview-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[400px]"
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Preparing your interview session...</p>
              </div>
            </motion.div>
          )}
          
          {state.status === 'preparing' && (
            <motion.div
              key="camera-setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CameraSetupScreen 
                state={state} 
                dispatch={dispatch}
                videoRef={videoRef}
              />
            </motion.div>
          )}
          
          {(state.status === 'active' || state.status === 'paused') && (
            <motion.div
              key="interview-active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <InterviewActiveScreen 
                state={state} 
                dispatch={dispatch}
                videoRef={videoRef}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                formatTime={formatTime}
              />
            </motion.div>
          )}
          
          {state.status === 'completed' && (
            <motion.div
              key="interview-completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <InterviewCompletedScreen 
                state={state} 
                dispatch={dispatch}
                formatTime={formatTime}
              />
            </motion.div>
          )}
          
          {state.status === 'error' && (
            <motion.div
              key="interview-error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ErrorScreen 
                error={state.error} 
                onRetry={() => dispatch({ type: 'RESET_INTERVIEW' })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}

// Interview Setup Screen
function InterviewSetupScreen({ onStart }: { onStart: (config: InterviewConfig) => void }) {
  const [config, setConfig] = React.useState<InterviewConfig>({
    type: 'mixed',
    duration: 15,
    questionCount: 3,
    difficulty: 'medium',
    enableVideo: true,
    enableAudio: true,
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Mock Interview</h1>
        <p className="text-muted-foreground">
          Practice your interview skills with AI-powered feedback
        </p>
      </div>

      <EnhancedCard className="p-6">
        <CardHeader>
          <CardTitle>Interview Configuration</CardTitle>
          <CardDescription>
            Customize your mock interview experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Interview Type</label>
              <select 
                value={config.type}
                onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="technical">Technical Questions</option>
                <option value="behavioral">Behavioral Questions</option>
                <option value="mixed">Mixed (Recommended)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <select 
                value={config.duration}
                onChange={(e) => setConfig(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full p-2 border rounded-md"
              >
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Number of Questions</label>
              <select 
                value={config.questionCount}
                onChange={(e) => setConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                className="w-full p-2 border rounded-md"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={7}>7 Questions</option>
                <option value={10}>10 Questions</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty Level</label>
              <select 
                value={config.difficulty}
                onChange={(e) => setConfig(prev => ({ ...prev, difficulty: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableVideo"
                checked={config.enableVideo}
                onChange={(e) => setConfig(prev => ({ ...prev, enableVideo: e.target.checked }))}
              />
              <label htmlFor="enableVideo" className="text-sm">
                Enable video recording (recommended for better feedback)
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableAudio"
                checked={config.enableAudio}
                onChange={(e) => setConfig(prev => ({ ...prev, enableAudio: e.target.checked }))}
              />
              <label htmlFor="enableAudio" className="text-sm">
                Enable audio recording (required for speech analysis)
              </label>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      <div className="text-center">
        <Button 
          onClick={() => onStart(config)}
          size="lg"
          className="px-8"
          disabled={!config.enableAudio}
        >
          Start Interview
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {!config.enableAudio && (
          <p className="text-sm text-muted-foreground mt-2">
            Audio recording is required for the interview
          </p>
        )}
      </div>
    </div>
  );
}

// Camera Setup Screen
function CameraSetupScreen({ 
  state, 
  dispatch, 
  videoRef 
}: {
  state: InterviewState;
  dispatch: React.Dispatch<InterviewAction>;
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Camera & Audio Setup</h1>
        <p className="text-muted-foreground">
          Make sure your camera and microphone are working properly
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Preview */}
        <EnhancedCard className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Video Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              {!state.mediaStream && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <VideoOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Camera not available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </EnhancedCard>

        {/* Instructions */}
        <EnhancedCard className="p-6">
          <CardHeader>
            <CardTitle>Interview Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Good Lighting</p>
                  <p className="text-sm text-muted-foreground">
                    Face a window or light source for clear visibility
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Stable Internet</p>
                  <p className="text-sm text-muted-foreground">
                    Ensure a stable connection for uninterrupted recording
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Quiet Environment</p>
                  <p className="text-sm text-muted-foreground">
                    Choose a quiet space to minimize background noise
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Professional Setup</p>
                  <p className="text-sm text-muted-foreground">
                    Dress professionally and sit up straight
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      <div className="text-center">
        <Button 
          onClick={() => dispatch({ type: 'START_INTERVIEW' })}
          size="lg"
          disabled={!state.mediaStream}
        >
          Begin Interview
          <Play className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Interview Active Screen
function InterviewActiveScreen({ 
  state, 
  dispatch, 
  videoRef, 
  onStartRecording, 
  onStopRecording, 
  formatTime 
}: {
  state: InterviewState;
  dispatch: React.Dispatch<InterviewAction>;
  videoRef: React.RefObject<HTMLVideoElement>;
  onStartRecording: () => void;
  onStopRecording: () => void;
  formatTime: (seconds: number) => string;
}) {
  const currentQuestion = state.questions[state.currentQuestionIndex];
  const progress = ((state.currentQuestionIndex + 1) / state.questions.length) * 100;

  if (!currentQuestion) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Video Feed */}
      <div className="lg:col-span-2">
        <EnhancedCard className="overflow-hidden">
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Session Info Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm">
              <Clock className="w-4 h-4" />
              <span>{formatTime(state.sessionDuration)}</span>
            </div>
            
            {/* Recording Status */}
            {state.currentRecording.isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 text-white px-3 py-1.5 rounded-full text-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Recording</span>
              </div>
            )}
            
            {/* Countdown Overlay */}
            {state.countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="text-6xl font-bold text-white animate-pulse">
                  {state.countdown}
                </div>
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-center gap-4">
              {!state.currentRecording.isRecording ? (
                <Button
                  onClick={onStartRecording}
                  size="lg"
                  className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
                >
                  <Mic className="w-6 h-6" />
                </Button>
              ) : (
                <Button
                  onClick={onStopRecording}
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-16 h-16"
                >
                  <Square className="w-6 h-6" />
                </Button>
              )}
            </div>
          </div>
        </EnhancedCard>
      </div>
      
      {/* Right Column: Question & Progress */}
      <div className="space-y-4">
        {/* Progress */}
        <EnhancedCard className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Question {state.currentQuestionIndex + 1}/{state.questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </EnhancedCard>
        
        {/* Current Question */}
        <EnhancedCard className="p-6">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{currentQuestion.category}</Badge>
              <Badge variant="outline">{currentQuestion.difficulty}</Badge>
            </div>
            <CardTitle className="text-lg">Interview Question</CardTitle>
          </CardHeader>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/interviewer-avatar.png" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Interviewer</p>
                <p>{currentQuestion.question}</p>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-xs"
                  onClick={() => {/* Play audio */}}
                >
                  <Volume2 className="w-3 h-3 mr-1" />
                  Listen
                </Button>
              </div>
            </div>
            
            {currentQuestion.hints && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Hints</span>
                </div>
                <ul className="text-xs space-y-1">
                  {currentQuestion.hints.map((hint, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </EnhancedCard>
        
        {/* Controls */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => dispatch({ type: 'COMPLETE_INTERVIEW' })}
            className="flex-1"
          >
            End Interview
          </Button>
          
          {state.currentQuestionIndex < state.questions.length - 1 && (
            <Button 
              size="sm"
              onClick={() => dispatch({ type: 'NEXT_QUESTION' })}
              disabled={state.currentRecording.isRecording}
              className="flex-1"
            >
              Next
              <ChevronLeft className="w-4 h-4 ml-1 rotate-180" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Interview Completed Screen
function InterviewCompletedScreen({ 
  state, 
  dispatch, 
  formatTime 
}: {
  state: InterviewState;
  dispatch: React.Dispatch<InterviewAction>;
  formatTime: (seconds: number) => string;
}) {
  const averageScore = state.feedback.length > 0 
    ? Math.round(state.feedback.reduce((sum, f) => sum + f.score, 0) / state.feedback.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Interview Completed!</h1>
        <p className="text-muted-foreground mt-2">
          Great job! Here's your performance summary
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EnhancedCard className="p-6 text-center">
          <div className="text-2xl font-bold text-primary">{averageScore}/100</div>
          <div className="text-sm text-muted-foreground">Overall Score</div>
        </EnhancedCard>
        
        <EnhancedCard className="p-6 text-center">
          <div className="text-2xl font-bold text-primary">{state.responses.length}</div>
          <div className="text-sm text-muted-foreground">Questions Answered</div>
        </EnhancedCard>
        
        <EnhancedCard className="p-6 text-center">
          <div className="text-2xl font-bold text-primary">{formatTime(state.sessionDuration)}</div>
          <div className="text-sm text-muted-foreground">Total Duration</div>
        </EnhancedCard>
      </div>

      {/* Detailed Feedback */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Detailed Feedback</h2>
        {state.feedback.map((feedback, index) => {
          const question = state.questions.find(q => q.id === feedback.questionId);
          return (
            <EnhancedCard key={feedback.questionId} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Question {index + 1}</h3>
                  <Badge variant={feedback.score >= 80 ? 'default' : feedback.score >= 60 ? 'secondary' : 'destructive'}>
                    {feedback.score}/100
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">{question?.question}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                    <ul className="text-sm space-y-1">
                      {feedback.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-amber-600 mb-2">Areas for Improvement</h4>
                    <ul className="text-sm space-y-1">
                      {feedback.improvements.map((improvement, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertCircle className="h-3 w-3 text-amber-500 mt-1" />
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </EnhancedCard>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={() => dispatch({ type: 'RESET_INTERVIEW' })}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Practice Again
        </Button>
        
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
        
        <Button variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share Results
        </Button>
        
        <Button asChild>
          <Link href="/dashboard">
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Error Screen Component
function ErrorScreen({ 
  error, 
  onRetry 
}: {
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="text-center space-y-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground mt-2">
          {error || 'An unexpected error occurred'}
        </p>
      </div>
      
      <Button onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}