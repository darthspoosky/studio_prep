'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Icons
import {
  PenLine, Clock, BarChart3, Target, Lightbulb, BookOpen,
  Save, Share2, Download, History, Settings, Brain, 
  Zap, Award, TrendingUp, Eye, EyeOff, Volume2, VolumeX,
  FileText, Search, Sparkles, Users, MessageSquare,
  CheckCircle2, AlertCircle, Info, Timer, Palette,
  Type, AlignLeft, Bold, Italic, Underline, List,
  RotateCcw, RotateCw, Home, RefreshCw, Upload,
  Mic, MicOff, Languages, Accessibility, Keyboard
} from 'lucide-react';

// Enhanced Types
interface WritingPrompt {
  id: string;
  title: string;
  description: string;
  category: 'mains' | 'essay' | 'ethics' | 'current-affairs';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in minutes
  wordLimit: number;
  context?: string;
  keywords: string[];
  scoringCriteria: {
    content: number;
    structure: number;
    language: number;
    presentation: number;
  };
  sampleAnswer?: string;
  expertTips?: string[];
  relatedTopics?: string[];
}

interface WritingSession {
  id: string;
  promptId: string;
  content: string;
  startTime: number;
  endTime?: number;
  wordCount: number;
  timeSpent: number;
  autoSaves: Array<{ timestamp: number; content: string }>;
  realTimeMetrics: {
    wpm: number;
    keystrokesPerMinute: number;
    pauseCount: number;
    averagePauseLength: number;
    backspaceCount: number;
    activeWritingTime: number;
  };
  aiSuggestions: Array<{
    timestamp: number;
    type: 'grammar' | 'style' | 'structure' | 'content';
    suggestion: string;
    accepted: boolean;
  }>;
  collaborativeNotes?: Array<{
    timestamp: number;
    userId: string;
    type: 'comment' | 'suggestion' | 'highlight';
    content: string;
    position: { start: number; end: number };
  }>;
}

interface ComprehensiveFeedback {
  overallScore: number;
  detailedScores: {
    content: number;
    structure: number;
    language: number;
    presentation: number;
    creativity: number;
    relevance: number;
  };
  strengths: string[];
  improvements: string[];
  specificSuggestions: Array<{
    type: 'grammar' | 'style' | 'structure' | 'content';
    issue: string;
    suggestion: string;
    position?: { start: number; end: number };
    severity: 'low' | 'medium' | 'high';
  }>;
  grammarCheck: Array<{
    error: string;
    correction: string;
    position: { start: number; end: number };
    type: 'spelling' | 'grammar' | 'punctuation';
  }>;
  plagiarismCheck: {
    score: number;
    sources: Array<{
      text: string;
      source: string;
      similarity: number;
    }>;
  };
  vocabularyAnalysis: {
    level: 'basic' | 'intermediate' | 'advanced';
    uniqueWords: number;
    complexityScore: number;
    suggestions: string[];
  };
  structureAnalysis: {
    paragraphCount: number;
    averageSentenceLength: number;
    transitionQuality: number;
    logicalFlow: number;
  };
  comparativeAnalysis: {
    percentileRank: number;
    averageScore: number;
    topPerformers: number;
  };
  nextSteps: string[];
  estimatedImprovementTime: number;
}

interface WritingConfiguration {
  mode: 'practice' | 'test' | 'collaborative' | 'guided';
  aiAssistance: 'none' | 'minimal' | 'moderate' | 'comprehensive';
  realTimeFeedback: boolean;
  grammarCheck: boolean;
  plagiarismCheck: boolean;
  voiceToText: boolean;
  collaborativeMode: boolean;
  timeTracking: boolean;
  autoSave: boolean;
  darkMode: boolean;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  accessibility: {
    screenReader: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
    keyboardNavigation: boolean;
  };
}

// Advanced AI Writing Assistant
class AIWritingAssistant {
  private context: string = '';
  private userHistory: WritingSession[] = [];

  async analyzeText(text: string): Promise<Array<{
    type: 'grammar' | 'style' | 'structure' | 'content';
    suggestion: string;
    position?: { start: number; end: number };
    severity: 'low' | 'medium' | 'high';
  }>> {
    // Simulate AI analysis - in production, this would call OpenAI/Claude API
    const suggestions = [];

    // Grammar check
    if (text.includes('there') && text.includes('their')) {
      suggestions.push({
        type: 'grammar' as const,
        suggestion: 'Check usage of "there" vs "their"',
        severity: 'medium' as const
      });
    }

    // Style suggestions
    if (text.split(' ').length > 500) {
      suggestions.push({
        type: 'style' as const,
        suggestion: 'Consider breaking into smaller paragraphs for better readability',
        severity: 'low' as const
      });
    }

    // Structure analysis
    const sentences = text.split('.').filter(s => s.trim().length > 0);
    if (sentences.length > 0 && sentences[0].length < 50) {
      suggestions.push({
        type: 'structure' as const,
        suggestion: 'Consider a stronger opening sentence',
        severity: 'medium' as const
      });
    }

    return suggestions;
  }

  async generateContentSuggestions(prompt: string, currentText: string): Promise<string[]> {
    // AI-powered content suggestions based on prompt and current writing
    return [
      'Consider adding statistical data to support your argument',
      'Include a relevant case study or example',
      'Address potential counterarguments',
      'Add a forward-looking conclusion'
    ];
  }

  async checkPlagiarism(text: string): Promise<{
    score: number;
    sources: Array<{ text: string; source: string; similarity: number }>;
  }> {
    // Simulate plagiarism check
    return {
      score: 95, // 95% original
      sources: []
    };
  }

  async evaluateComprehensively(
    text: string, 
    prompt: WritingPrompt
  ): Promise<ComprehensiveFeedback> {
    // Comprehensive AI evaluation
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).length;
    
    return {
      overallScore: 78,
      detailedScores: {
        content: 80,
        structure: 75,
        language: 82,
        presentation: 70,
        creativity: 76,
        relevance: 85
      },
      strengths: [
        'Clear argumentation structure',
        'Good use of examples',
        'Appropriate vocabulary level'
      ],
      improvements: [
        'Strengthen the conclusion',
        'Add more transitional phrases',
        'Include recent data/statistics'
      ],
      specificSuggestions: await this.analyzeText(text),
      grammarCheck: [],
      plagiarismCheck: await this.checkPlagiarism(text),
      vocabularyAnalysis: {
        level: 'intermediate',
        uniqueWords: Math.floor(wordCount * 0.7),
        complexityScore: 6.5,
        suggestions: ['Use more varied sentence structures', 'Include domain-specific terminology']
      },
      structureAnalysis: {
        paragraphCount: text.split('\n\n').length,
        averageSentenceLength: wordCount / sentenceCount,
        transitionQuality: 7,
        logicalFlow: 8
      },
      comparativeAnalysis: {
        percentileRank: 78,
        averageScore: 65,
        topPerformers: 85
      },
      nextSteps: [
        'Practice writing stronger conclusions',
        'Study transition techniques',
        'Read high-scoring sample answers'
      ],
      estimatedImprovementTime: 2 // weeks
    };
  }
}

// Real-time Writing Analytics
const useWritingAnalytics = (content: string, startTime: number) => {
  const [analytics, setAnalytics] = useState({
    wordCount: 0,
    characterCount: 0,
    paragraphCount: 0,
    sentenceCount: 0,
    averageWordsPerSentence: 0,
    timeSpent: 0,
    wpm: 0,
    keystrokesPerMinute: 0,
    readabilityScore: 0
  });

  const lastUpdateTime = useRef(Date.now());
  const keystrokeCount = useRef(0);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    const timeSpent = (Date.now() - startTime) / 1000 / 60; // minutes
    const wpm = timeSpent > 0 ? words.length / timeSpent : 0;

    setAnalytics({
      wordCount: words.length,
      characterCount: content.length,
      paragraphCount: paragraphs.length,
      sentenceCount: sentences.length,
      averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
      timeSpent: Math.floor(timeSpent),
      wpm: Math.round(wpm),
      keystrokesPerMinute: keystrokeCount.current / Math.max(timeSpent, 1),
      readabilityScore: calculateReadabilityScore(words, sentences)
    });
  }, [content, startTime]);

  const trackKeystroke = useCallback(() => {
    keystrokeCount.current++;
  }, []);

  return { analytics, trackKeystroke };
};

// Readability calculation
const calculateReadabilityScore = (words: string[], sentences: string[]) => {
  if (words.length === 0 || sentences.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = words.reduce((acc, word) => {
    return acc + countSyllables(word);
  }, 0) / words.length;
  
  // Simplified Flesch Reading Ease
  return Math.max(0, Math.min(100, 
    206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
  ));
};

const countSyllables = (word: string) => {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
};

// Enhanced Text Editor Component
const EnhancedTextEditor = ({
  content,
  onChange,
  onKeystroke,
  configuration,
  prompt,
  realTimeSuggestions,
  onSuggestionAccept
}: {
  content: string;
  onChange: (content: string) => void;
  onKeystroke: () => void;
  configuration: WritingConfiguration;
  prompt: WritingPrompt;
  realTimeSuggestions: any[];
  onSuggestionAccept: (suggestion: any) => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedText, setSelectedText] = useState('');

  // Voice-to-text functionality
  const toggleVoiceRecording = useCallback(() => {
    if ('speechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).speechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      
      if (!isVoiceRecording) {
        recognition.start();
        setIsVoiceRecording(true);
        
        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            onChange(content + ' ' + finalTranscript);
          }
        };
        
        recognition.onerror = () => {
          setIsVoiceRecording(false);
        };
      } else {
        recognition.stop();
        setIsVoiceRecording(false);
      }
    }
  }, [isVoiceRecording, content, onChange]);

  // Text formatting functions
  const formatText = useCallback((format: 'bold' | 'italic' | 'underline') => {
    if (textareaRef.current && selectedText) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      
      let formattedText = selectedText;
      switch (format) {
        case 'bold':
          formattedText = `**${selectedText}**`;
          break;
        case 'italic':
          formattedText = `*${selectedText}*`;
          break;
        case 'underline':
          formattedText = `__${selectedText}__`;
          break;
      }
      
      const newContent = content.substring(0, start) + formattedText + content.substring(end);
      onChange(newContent);
    }
  }, [selectedText, content, onChange]);

  useEffect(() => {
    const handleSelection = () => {
      if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        setSelectedText(content.substring(start, end));
        setCursorPosition(start);
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('select', handleSelection);
      textarea.addEventListener('keyup', handleSelection);
      textarea.addEventListener('mouseup', handleSelection);
      
      return () => {
        textarea.removeEventListener('select', handleSelection);
        textarea.removeEventListener('keyup', handleSelection);
        textarea.removeEventListener('mouseup', handleSelection);
      };
    }
  }, [content]);

  return (
    <div className="space-y-4">
      {/* Enhanced Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
        <div className="flex items-center gap-2">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 mr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText('bold')}
              disabled={!selectedText}
              aria-label="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText('italic')}
              disabled={!selectedText}
              aria-label="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText('underline')}
              disabled={!selectedText}
              aria-label="Underline"
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          {/* Voice Input */}
          {configuration.voiceToText && (
            <Button
              variant={isVoiceRecording ? "destructive" : "ghost"}
              size="sm"
              onClick={toggleVoiceRecording}
              aria-label={isVoiceRecording ? "Stop recording" : "Start voice input"}
            >
              {isVoiceRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}

          {/* AI Suggestions Indicator */}
          {realTimeSuggestions.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              {realTimeSuggestions.length} suggestions
            </Badge>
          )}
        </div>

        {/* Editor Settings */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label="Text settings">
            <Type className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Layout settings">
            <AlignLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            onChange(e.target.value);
            onKeystroke();
          }}
          placeholder={`Start writing your response to: "${prompt.title}"\n\nTip: Use the AI suggestions and real-time feedback to improve your writing as you go.`}
          className={cn(
            "min-h-[500px] resize-none font-mono leading-relaxed",
            configuration.darkMode && "bg-gray-900 text-gray-100",
            configuration.accessibility.highContrast && "bg-black text-yellow-400 border-yellow-400"
          )}
          style={{
            fontSize: `${configuration.fontSize}px`,
            fontFamily: configuration.fontFamily,
            lineHeight: configuration.lineHeight
          }}
          aria-label="Writing editor"
          aria-describedby="writing-instructions"
        />

        {/* Real-time Suggestions Overlay */}
        {realTimeSuggestions.length > 0 && configuration.realTimeFeedback && (
          <div className="absolute top-2 right-2 max-w-xs">
            <Card className="p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <div className="space-y-2">
                {realTimeSuggestions.slice(0, 3).map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="text-blue-700 dark:text-blue-300">{suggestion.suggestion}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 mt-1 text-xs"
                        onClick={() => onSuggestionAccept(suggestion)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <div id="writing-instructions" className="sr-only">
        Writing prompt: {prompt.description}. Time limit: {prompt.timeLimit} minutes. 
        Word limit: {prompt.wordLimit} words.
      </div>
    </div>
  );
};

// Real-time Analytics Panel
const RealTimeAnalytics = ({ 
  analytics, 
  prompt, 
  timeRemaining 
}: { 
  analytics: any; 
  prompt: WritingPrompt; 
  timeRemaining: number;
}) => {
  const progressPercentage = (analytics.wordCount / prompt.wordLimit) * 100;
  const timeUsedPercentage = ((prompt.timeLimit * 60 - timeRemaining) / (prompt.timeLimit * 60)) * 100;

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Real-time Analytics
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Word Count Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Word Count</span>
            <span>{analytics.wordCount}/{prompt.wordLimit}</span>
          </div>
          <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
          {progressPercentage > 100 && (
            <p className="text-xs text-red-500 mt-1">Exceeds word limit</p>
          )}
        </div>

        {/* Time Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Time Used</span>
            <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} remaining</span>
          </div>
          <Progress value={timeUsedPercentage} className="h-2" />
        </div>

        {/* Writing Speed */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Words/Min</p>
            <p className="font-semibold">{analytics.wpm}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sentences</p>
            <p className="font-semibold">{analytics.sentenceCount}</p>
          </div>
        </div>

        {/* Quality Indicators */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Readability Score</span>
            <Badge variant={
              analytics.readabilityScore > 70 ? "default" :
              analytics.readabilityScore > 50 ? "secondary" : "destructive"
            }>
              {Math.round(analytics.readabilityScore)}
            </Badge>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Avg Words/Sentence</span>
            <Badge variant={
              analytics.averageWordsPerSentence > 25 ? "destructive" :
              analytics.averageWordsPerSentence > 15 ? "secondary" : "default"
            }>
              {Math.round(analytics.averageWordsPerSentence)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Comprehensive Feedback Display
const FeedbackPanel = ({ 
  feedback, 
  onAcceptSuggestion 
}: { 
  feedback: ComprehensiveFeedback; 
  onAcceptSuggestion: (suggestion: any) => void;
}) => {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="p-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">
            {feedback.overallScore}/100
          </div>
          <p className="text-muted-foreground">Overall Score</p>
          
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

      {/* Detailed Scores */}
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle>Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(feedback.detailedScores).map(([key, score]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between">
                  <span className="capitalize font-medium">{key}</span>
                  <span className="font-semibold">{score}/100</span>
                </div>
                <Progress value={score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths and Improvements */}
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
              Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Specific Suggestions */}
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Specific Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {feedback.specificSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className={cn(
                  "p-1 rounded",
                  suggestion.severity === 'high' && "bg-red-100 text-red-600",
                  suggestion.severity === 'medium' && "bg-yellow-100 text-yellow-600",
                  suggestion.severity === 'low' && "bg-blue-100 text-blue-600"
                )}>
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{suggestion.issue}</p>
                  <p className="text-sm text-muted-foreground">{suggestion.suggestion}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAcceptSuggestion(suggestion)}
                >
                  Apply
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparative Analysis */}
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Comparative Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {feedback.comparativeAnalysis.percentileRank}%
              </div>
              <p className="text-sm text-muted-foreground">Percentile Rank</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {feedback.comparativeAnalysis.averageScore}
              </div>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {feedback.comparativeAnalysis.topPerformers}
              </div>
              <p className="text-sm text-muted-foreground">Top 10% Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {feedback.nextSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm">{step}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
            <p className="text-sm">
              <Clock className="h-4 w-4 inline mr-2" />
              Estimated improvement time: {feedback.estimatedImprovementTime} weeks with regular practice
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Enhanced Writing Practice Component
export default function EnhancedWritingPractice() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State Management
  const [currentPrompt, setCurrentPrompt] = useState<WritingPrompt | null>(null);
  const [content, setContent] = useState('');
  const [session, setSession] = useState<WritingSession | null>(null);
  const [feedback, setFeedback] = useState<ComprehensiveFeedback | null>(null);
  const [configuration, setConfiguration] = useState<WritingConfiguration>({
    mode: 'practice',
    aiAssistance: 'moderate',
    realTimeFeedback: true,
    grammarCheck: true,
    plagiarismCheck: true,
    voiceToText: true,
    collaborativeMode: false,
    timeTracking: true,
    autoSave: true,
    darkMode: false,
    fontSize: 16,
    fontFamily: 'Inter',
    lineHeight: 1.6,
    accessibility: {
      screenReader: false,
      highContrast: false,
      reducedMotion: false,
      keyboardNavigation: true
    }
  });
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [realTimeSuggestions, setRealTimeSuggestions] = useState<any[]>([]);
  const [showConfiguration, setShowConfiguration] = useState(true);
  
  // AI Assistant
  const aiAssistant = useRef(new AIWritingAssistant());
  
  // Analytics
  const startTime = useRef(Date.now());
  const { analytics, trackKeystroke } = useWritingAnalytics(content, startTime.current);

  // Sample prompts (in production, these would come from an API)
  const samplePrompts: WritingPrompt[] = [
    {
      id: '1',
      title: 'Role of Technology in Rural Development',
      description: 'Discuss the transformative potential of technology in addressing challenges faced by rural India. Analyze both opportunities and challenges.',
      category: 'mains',
      difficulty: 'medium',
      timeLimit: 60,
      wordLimit: 1000,
      context: 'Digital India initiative and rural development schemes',
      keywords: ['Digital India', 'Rural Development', 'Technology', 'Challenges', 'Opportunities'],
      scoringCriteria: {
        content: 30,
        structure: 25,
        language: 25,
        presentation: 20
      },
      expertTips: [
        'Include specific examples of successful tech implementations',
        'Address the digital divide challenge',
        'Discuss policy interventions needed'
      ],
      relatedTopics: ['Digital Infrastructure', 'Financial Inclusion', 'E-Governance']
    }
    // More prompts would be here...
  ];

  // Timer effect
  useEffect(() => {
    if (session && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && session) {
      handleSubmit();
    }
  }, [timeRemaining, session]);

  // Auto-save effect
  useEffect(() => {
    if (configuration.autoSave && session && content) {
      const autoSaveTimer = setTimeout(() => {
        setSession(prev => prev ? {
          ...prev,
          content,
          autoSaves: [
            ...prev.autoSaves,
            { timestamp: Date.now(), content }
          ]
        } : null);
      }, 5000);
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [content, configuration.autoSave, session]);

  // Real-time AI suggestions
  useEffect(() => {
    if (configuration.realTimeFeedback && content.length > 100) {
      const debounceTimer = setTimeout(async () => {
        try {
          const suggestions = await aiAssistant.current.analyzeText(content);
          setRealTimeSuggestions(suggestions);
        } catch (error) {
          console.error('Failed to get AI suggestions:', error);
        }
      }, 2000);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [content, configuration.realTimeFeedback]);

  // Start writing session
  const startSession = useCallback((prompt: WritingPrompt) => {
    const newSession: WritingSession = {
      id: Date.now().toString(),
      promptId: prompt.id,
      content: '',
      startTime: Date.now(),
      wordCount: 0,
      timeSpent: 0,
      autoSaves: [],
      realTimeMetrics: {
        wpm: 0,
        keystrokesPerMinute: 0,
        pauseCount: 0,
        averagePauseLength: 0,
        backspaceCount: 0,
        activeWritingTime: 0
      },
      aiSuggestions: []
    };
    
    setSession(newSession);
    setCurrentPrompt(prompt);
    setTimeRemaining(prompt.timeLimit * 60);
    setContent('');
    setFeedback(null);
    setShowConfiguration(false);
    startTime.current = Date.now();
  }, []);

  // Submit and evaluate
  const handleSubmit = useCallback(async () => {
    if (!session || !currentPrompt) return;
    
    setIsEvaluating(true);
    try {
      const comprehensiveFeedback = await aiAssistant.current.evaluateComprehensively(
        content,
        currentPrompt
      );
      setFeedback(comprehensiveFeedback);
    } catch (error) {
      console.error('Evaluation failed:', error);
    } finally {
      setIsEvaluating(false);
    }
  }, [session, currentPrompt, content]);

  // Accept AI suggestion
  const handleAcceptSuggestion = useCallback((suggestion: any) => {
    // In a real implementation, this would apply the suggestion to the text
    console.log('Accepting suggestion:', suggestion);
    
    // Remove the suggestion from the list
    setRealTimeSuggestions(prev => prev.filter(s => s !== suggestion));
  }, []);

  if (showConfiguration) {
    return (
      <WritingConfigurationPanel
        onStartSession={startSession}
        prompts={samplePrompts}
        configuration={configuration}
        onConfigurationChange={setConfiguration}
      />
    );
  }

  if (isEvaluating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Evaluating Your Response</h3>
          <p className="text-muted-foreground">Our AI is analyzing your writing comprehensively...</p>
        </Card>
      </div>
    );
  }

  if (feedback) {
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
                  <h1 className="text-2xl font-bold">Writing Evaluation Complete</h1>
                  <p className="text-muted-foreground">Comprehensive AI-powered analysis</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setFeedback(null);
                      setShowConfiguration(true);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    New Practice
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/dashboard')}>
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </div>
              </div>
            </Card>

            <FeedbackPanel 
              feedback={feedback} 
              onAcceptSuggestion={handleAcceptSuggestion}
            />
          </motion.div>
        </div>
      </div>
    );
  }

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
                  <h1 className="text-xl font-bold">{currentPrompt?.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {currentPrompt?.wordLimit} words • {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} remaining
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={content.trim().length === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Evaluation
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Writing Settings</DialogTitle>
                    </DialogHeader>
                    {/* Configuration options */}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Editor */}
            <div className="lg:col-span-2">
              {currentPrompt && (
                <EnhancedTextEditor
                  content={content}
                  onChange={setContent}
                  onKeystroke={trackKeystroke}
                  configuration={configuration}
                  prompt={currentPrompt}
                  realTimeSuggestions={realTimeSuggestions}
                  onSuggestionAccept={handleAcceptSuggestion}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {currentPrompt && (
                <RealTimeAnalytics
                  analytics={analytics}
                  prompt={currentPrompt}
                  timeRemaining={timeRemaining}
                />
              )}

              {/* Prompt Details */}
              {currentPrompt && (
                <Card className="p-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Prompt Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-1">Context</h4>
                      <p className="text-sm text-muted-foreground">{currentPrompt.context}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Key Topics</h4>
                      <div className="flex flex-wrap gap-1">
                        {currentPrompt.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {currentPrompt.expertTips && (
                      <div>
                        <h4 className="font-medium mb-2">Expert Tips</h4>
                        <ul className="space-y-1">
                          {currentPrompt.expertTips.map((tip, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                              <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Configuration Panel Component
const WritingConfigurationPanel = ({
  onStartSession,
  prompts,
  configuration,
  onConfigurationChange
}: {
  onStartSession: (prompt: WritingPrompt) => void;
  prompts: WritingPrompt[];
  configuration: WritingConfiguration;
  onConfigurationChange: (config: WritingConfiguration) => void;
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState<WritingPrompt | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenLine className="h-6 w-6" />
                Enhanced Writing Practice
              </CardTitle>
              <CardDescription>
                AI-powered writing coach with real-time feedback and comprehensive evaluation
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="prompts" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="prompts">Select Prompt</TabsTrigger>
                  <TabsTrigger value="settings">AI Settings</TabsTrigger>
                  <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
                </TabsList>

                <TabsContent value="prompts" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {prompts.map((prompt) => (
                      <Card
                        key={prompt.id}
                        className={cn(
                          "cursor-pointer transition-all duration-200 hover:shadow-md",
                          selectedPrompt?.id === prompt.id && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedPrompt(prompt)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{prompt.title}</CardTitle>
                            <Badge variant={
                              prompt.difficulty === 'easy' ? 'secondary' :
                              prompt.difficulty === 'medium' ? 'default' : 'destructive'
                            }>
                              {prompt.difficulty}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">
                            {prompt.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{prompt.timeLimit} minutes</span>
                            <span>{prompt.wordLimit} words</span>
                            <Badge variant="outline">{prompt.category}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {selectedPrompt && (
                    <div className="mt-6 flex justify-center">
                      <Button
                        onClick={() => onStartSession(selectedPrompt)}
                        size="lg"
                        className="px-8"
                      >
                        <Zap className="h-5 w-5 mr-2" />
                        Start Writing Session
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  {/* AI and writing settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="real-time-feedback">Real-time AI Feedback</Label>
                      <Switch
                        id="real-time-feedback"
                        checked={configuration.realTimeFeedback}
                        onCheckedChange={(checked) =>
                          onConfigurationChange({ ...configuration, realTimeFeedback: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="grammar-check">Grammar & Style Check</Label>
                      <Switch
                        id="grammar-check"
                        checked={configuration.grammarCheck}
                        onCheckedChange={(checked) =>
                          onConfigurationChange({ ...configuration, grammarCheck: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="voice-input">Voice-to-Text Input</Label>
                      <Switch
                        id="voice-input"
                        checked={configuration.voiceToText}
                        onCheckedChange={(checked) =>
                          onConfigurationChange({ ...configuration, voiceToText: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>AI Assistance Level</Label>
                      <select
                        className="w-full p-2 border rounded-lg"
                        value={configuration.aiAssistance}
                        onChange={(e) =>
                          onConfigurationChange({
                            ...configuration,
                            aiAssistance: e.target.value as any
                          })
                        }
                      >
                        <option value="none">No AI Assistance</option>
                        <option value="minimal">Minimal (Basic suggestions)</option>
                        <option value="moderate">Moderate (Balanced guidance)</option>
                        <option value="comprehensive">Comprehensive (Full AI coach)</option>
                      </select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="accessibility" className="space-y-4">
                  {/* Accessibility settings */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Font Size: {configuration.fontSize}px</Label>
                      <Slider
                        value={[configuration.fontSize]}
                        onValueChange={(value) =>
                          onConfigurationChange({ ...configuration, fontSize: value[0] })
                        }
                        min={12}
                        max={24}
                        step={1}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="high-contrast">High Contrast Mode</Label>
                      <Switch
                        id="high-contrast"
                        checked={configuration.accessibility.highContrast}
                        onCheckedChange={(checked) =>
                          onConfigurationChange({
                            ...configuration,
                            accessibility: { ...configuration.accessibility, highContrast: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="reduced-motion">Reduce Animations</Label>
                      <Switch
                        id="reduced-motion"
                        checked={configuration.accessibility.reducedMotion}
                        onCheckedChange={(checked) =>
                          onConfigurationChange({
                            ...configuration,
                            accessibility: { ...configuration.accessibility, reducedMotion: checked }
                          })
                        }
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};