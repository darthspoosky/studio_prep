"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  FileText, 
  Save, 
  Send, 
  Lightbulb, 
  AlertCircle,
  CheckCircle,
  Upload,
  Zap
} from 'lucide-react';

interface WritingEditorProps {
  questionText: string;
  examType?: string;
  timeLimit?: number; // in minutes
  wordLimit?: number;
  onSubmit: (data: SubmissionData) => Promise<void>;
  onSaveDraft?: (content: string) => void;
}

interface SubmissionData {
  content: string;
  metadata: {
    timeSpent: number;
    wordCount: number;
    keystrokes: number;
    pauses: number[];
    source: 'text' | 'upload' | 'ocr';
  };
}

interface RealtimeSuggestion {
  text: string;
  type: 'structure' | 'content' | 'language';
  priority: 'high' | 'medium' | 'low';
}

export default function EnhancedWritingEditor({
  questionText,
  examType = 'UPSC Mains',
  timeLimit = 45,
  wordLimit = 900,
  onSubmit,
  onSaveDraft
}: WritingEditorProps) {
  // Content and UI state
  const [content, setContent] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Analytics state
  const [timeSpent, setTimeSpent] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const [pauses, setPauses] = useState<number[]>([]);
  const [lastTypingTime, setLastTypingTime] = useState(Date.now());
  const [wpm, setWpm] = useState(0);
  
  // Real-time suggestions
  const [suggestions, setSuggestions] = useState<RealtimeSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSuggestionRequestRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Timer management
  useEffect(() => {
    if (isStarted && timeSpent < timeLimit * 60) {
      timerRef.current = setTimeout(() => {
        setTimeSpent(prev => prev + 1);
        
        // Calculate WPM every 10 seconds
        if (timeSpent % 10 === 0 && timeSpent > 0) {
          setWpm(Math.round(wordCount / (timeSpent / 60)));
        }
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isStarted, timeSpent, timeLimit, wordCount]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Clean up timers
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
      // Abort any pending fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (content.length > 50 && onSaveDraft) {
      const saveTimeout = setTimeout(() => {
        onSaveDraft(content);
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(saveTimeout);
    }
  }, [content, onSaveDraft]);

  // Real-time suggestions with debouncing
  const fetchSuggestions = useCallback(async (text: string, abortSignal?: AbortSignal) => {
    if (text.length < 100 || !showSuggestions) return;
    
    const now = Date.now();
    if (now - lastSuggestionRequestRef.current < 5000) return; // Rate limit: once per 5 seconds
    
    lastSuggestionRequestRef.current = now;
    setIsLoadingSuggestions(true);

    try {
      const response = await fetch('/api/writing-evaluation/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          context: questionText,
          examType
        }),
        signal: abortSignal
      });

      if (response.ok) {
        const data = await response.json();
        const formattedSuggestions: RealtimeSuggestion[] = data.suggestions.map((s: string, index: number) => ({
          text: s,
          type: index === 0 ? 'structure' : index === 1 ? 'content' : 'language',
          priority: index === 0 ? 'high' : 'medium'
        }));
        setSuggestions(formattedSuggestions);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch suggestions:', error);
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [questionText, examType, showSuggestions]);

  // Handle content changes
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    
    if (!isStarted && newContent.trim().length > 0) {
      setIsStarted(true);
    }

    setContent(newContent);
    
    // Update analytics
    const words = newContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setKeystrokes(prev => prev + 1);
    
    // Track pauses
    const now = Date.now();
    if (now - lastTypingTime > 3000) {
      setPauses(prev => [...prev, now - lastTypingTime]);
    }
    setLastTypingTime(now);

    // Debounced suggestions with AbortController
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    suggestionTimeoutRef.current = setTimeout(() => {
      abortControllerRef.current = new AbortController();
      fetchSuggestions(newContent, abortControllerRef.current.signal);
    }, 3000);
  }, [isStarted, lastTypingTime, fetchSuggestions]);

  // Handle submission
  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const submissionData: SubmissionData = {
        content,
        metadata: {
          timeSpent,
          wordCount,
          keystrokes,
          pauses,
          source: 'text'
        }
      };

      await onSubmit(submissionData);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = (timeSpent / (timeLimit * 60)) * 100;
    if (percentage > 90) return 'text-red-500';
    if (percentage > 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getWordCountColor = () => {
    const percentage = (wordCount / wordLimit) * 100;
    if (percentage > 110) return 'text-red-500';
    if (percentage > 90) return 'text-yellow-500';
    return 'text-green-500';
  };

  const timeProgress = Math.min((timeSpent / (timeLimit * 60)) * 100, 100);
  const wordProgress = Math.min((wordCount / wordLimit) * 100, 100);
  const efficiency = keystrokes > 0 ? Math.round((wordCount * 5) / keystrokes * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Question Card */}
      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {examType} Question
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-4">{questionText}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              <Clock className="w-3 h-3 mr-1" />
              {timeLimit} minutes
            </Badge>
            <Badge variant="outline">
              <FileText className="w-3 h-3 mr-1" />
              {wordLimit} words
            </Badge>
            <Badge variant="outline">
              {examType}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="glassmorphic">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${getTimeColor()}`} />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className={`text-lg font-semibold ${getTimeColor()}`}>
                  {formatTime(timeSpent)}
                </p>
              </div>
            </div>
            <Progress value={timeProgress} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="glassmorphic">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className={`w-4 h-4 ${getWordCountColor()}`} />
              <div>
                <p className="text-sm text-muted-foreground">Words</p>
                <p className={`text-lg font-semibold ${getWordCountColor()}`}>
                  {wordCount}
                </p>
              </div>
            </div>
            <Progress value={wordProgress} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="glassmorphic">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">WPM</p>
              <p className="text-lg font-semibold text-blue-500">
                {wpm}
              </p>
            </div>
            <div className="mt-1">
              <Badge variant="outline" className="text-xs">
                {wpm > 40 ? 'Fast' : wpm > 20 ? 'Good' : 'Steady'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Efficiency</p>
              <p className="text-lg font-semibold text-purple-500">
                {efficiency}%
              </p>
            </div>
            <div className="mt-1">
              <Badge variant="outline" className="text-xs">
                {efficiency > 80 ? 'Excellent' : efficiency > 60 ? 'Good' : 'Fair'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Pauses</p>
              <p className="text-lg font-semibold text-orange-500">
                {pauses.filter(p => p > 5000).length}
              </p>
            </div>
            <div className="mt-1">
              <Badge variant="outline" className="text-xs">
                Long pauses
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Writing Area */}
        <div className="lg:col-span-2">
          <Card className="glassmorphic">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Answer</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-xs"
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                {showSuggestions ? 'Hide' : 'Show'} Suggestions
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                placeholder="Start writing your answer here. The timer will begin automatically..."
                className="min-h-[500px] resize-none bg-background/50 dark:bg-background/20 focus:bg-background border-0 text-base leading-relaxed"
                disabled={isSubmitting}
              />
              
              {/* Quick stats bar */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm text-muted-foreground">
                <div className="flex gap-4">
                  <span>{wordCount} words</span>
                  <span>{content.length} characters</span>
                  <span>{content.split('\n\n').filter(p => p.trim()).length} paragraphs</span>
                </div>
                <div className="flex gap-2">
                  {isStarted && (
                    <Badge variant="outline" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      Writing...
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions Panel */}
        <div className="lg:col-span-1">
          <Card className="glassmorphic sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Live Suggestions
                {isLoadingSuggestions && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showSuggestions ? (
                <p className="text-sm text-muted-foreground">
                  Suggestions are disabled. Click "Show Suggestions" to enable real-time feedback.
                </p>
              ) : suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {content.length < 100 
                    ? 'Start writing to get personalized suggestions...'
                    : 'Keep writing for more suggestions...'}
                </p>
              ) : (
                suggestions.map((suggestion, index) => (
                  <Alert key={index} className="glassmorphic border-l-4 border-l-primary">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {suggestion.text}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {suggestion.type}
                      </Badge>
                    </AlertDescription>
                  </Alert>
                ))
              )}
              
              {/* Writing tips */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-2">Quick Tips:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Aim for 3-4 main points</li>
                  <li>• Use specific examples</li>
                  <li>• Maintain formal tone</li>
                  <li>• Structure: Intro → Body → Conclusion</li>
                  <li>• Save time for conclusion</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <Card className="glassmorphic">
        <CardContent className="flex flex-col sm:flex-row gap-4 justify-between items-center p-6">
          <div className="flex gap-4">
            <Button variant="outline" disabled={!content.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button variant="outline" disabled={!content.trim()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </div>
          
          <Button 
            size="lg"
            onClick={handleSubmit} 
            disabled={isSubmitting || !content.trim() || content.length < 100}
            className="min-w-[200px]"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Evaluating...' : 'Submit for Evaluation'}
          </Button>
        </CardContent>
      </Card>

      {/* Warning for time/word limits */}
      {(timeProgress > 80 || wordProgress > 110) && (
        <Alert className="glassmorphic border-yellow-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {timeProgress > 80 && "Time is running out! "}
            {wordProgress > 110 && "You've exceeded the word limit. "}
            Consider finalizing your answer.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}