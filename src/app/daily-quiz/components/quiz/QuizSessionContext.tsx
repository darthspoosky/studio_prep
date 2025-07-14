'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { QuizSessionData, QuizQuestion } from '../../session/[type]/page';

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

interface QuizSessionContextType {
  session: QuizSessionData;
  currentQuestion: QuizQuestion;
  timeRemaining: number;
  isLastQuestion: boolean;
  answeredCount: number;
  progress: number;
  
  // Actions
  selectAnswer: (answer: string) => Promise<void>;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  toggleBookmark: () => void;
  completeQuiz: () => Promise<QuizResults | null>;
  saveProgress: () => Promise<void>;
  
  // State
  isSubmitting: boolean;
  lastSubmissionResult: { isCorrect: boolean; explanation: string } | null;
}

const QuizSessionContext = createContext<QuizSessionContextType | null>(null);

export const useQuizSession = () => {
  const context = useContext(QuizSessionContext);
  if (!context) {
    throw new Error('useQuizSession must be used within a QuizSessionProvider');
  }
  return context;
};

interface QuizSessionProviderProps {
  session: QuizSessionData;
  onSessionUpdate: (session: QuizSessionData) => void;
  children: React.ReactNode;
}

export const QuizSessionProvider: React.FC<QuizSessionProviderProps> = ({
  session: initialSession,
  onSessionUpdate,
  children
}) => {
  const [session, setSession] = useState(initialSession);
  const [timeRemaining, setTimeRemaining] = useState(initialSession.timeLimit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<{ isCorrect: boolean; explanation: string } | null>(null);

  // Update parent when session changes
  useEffect(() => {
    onSessionUpdate(session);
  }, [session, onSessionUpdate]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(saveProgress, 30000);
    return () => clearInterval(interval);
  }, [session]);

  // Derived values
  const currentQuestion = session.questions[session.currentQuestionIndex];
  const isLastQuestion = session.currentQuestionIndex === session.questions.length - 1;
  const answeredCount = session.answers.filter(a => a !== null).length;
  const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;

  // Select answer for current question
  const selectAnswer = useCallback(async (answer: string) => {
    if (isSubmitting || session.completed) return;

    setIsSubmitting(true);
    setLastSubmissionResult(null);

    try {
      // Update local state immediately
      const newAnswers = [...session.answers];
      newAnswers[session.currentQuestionIndex] = answer;
      
      const updatedSession = { ...session, answers: newAnswers };
      setSession(updatedSession);

      // Submit to backend
      const response = await fetch('/api/daily-quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          questionIndex: session.currentQuestionIndex,
          selectedAnswer: answer,
          timeSpent: session.timeLimit - timeRemaining
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLastSubmissionResult({
          isCorrect: result.isCorrect,
          explanation: result.explanation
        });
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      // Revert local state on error
      setSession(session);
    } finally {
      setIsSubmitting(false);
    }
  }, [session, timeRemaining, isSubmitting]);

  // Navigation functions
  const goToQuestion = useCallback((index: number) => {
    if (index < 0 || index >= session.questions.length || session.completed) return;
    
    setSession(prev => ({ 
      ...prev, 
      currentQuestionIndex: index 
    }));
    setLastSubmissionResult(null);
  }, [session.questions.length, session.completed]);

  const nextQuestion = useCallback(() => {
    goToQuestion(session.currentQuestionIndex + 1);
  }, [goToQuestion, session.currentQuestionIndex]);

  const previousQuestion = useCallback(() => {
    goToQuestion(session.currentQuestionIndex - 1);
  }, [goToQuestion, session.currentQuestionIndex]);

  // Toggle bookmark for current question
  const toggleBookmark = useCallback(() => {
    if (session.completed) return;

    const newBookmarked = [...session.bookmarked];
    newBookmarked[session.currentQuestionIndex] = !newBookmarked[session.currentQuestionIndex];
    
    setSession(prev => ({ ...prev, bookmarked: newBookmarked }));
  }, [session.completed, session.currentQuestionIndex, session.bookmarked]);

  // Save progress to backend
  const saveProgress = useCallback(async () => {
    try {
      await fetch('/api/daily-quiz/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          currentQuestionIndex: session.currentQuestionIndex,
          answers: session.answers,
          bookmarked: session.bookmarked,
          timeRemaining
        })
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [session.id, session.currentQuestionIndex, session.answers, session.bookmarked, timeRemaining]);

  // Complete quiz and get results
  const completeQuiz = useCallback(async (): Promise<QuizResults | null> => {
    if (session.completed) return null;

    try {
      // Mark session as completed
      setSession(prev => ({ ...prev, completed: true }));

      // Submit completion to backend
      const response = await fetch('/api/daily-quiz/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: session.id,
          finalAnswers: session.answers,
          timeTaken: session.timeLimit - timeRemaining
        })
      });

      if (response.ok) {
        const results: QuizResults = await response.json();
        return results;
      } else {
        throw new Error('Failed to complete quiz');
      }
    } catch (error) {
      console.error('Failed to complete quiz:', error);
      // Revert completion state on error
      setSession(prev => ({ ...prev, completed: false }));
      return null;
    }
  }, [session, timeRemaining]);

  const contextValue: QuizSessionContextType = {
    session,
    currentQuestion,
    timeRemaining,
    isLastQuestion,
    answeredCount,
    progress,
    selectAnswer,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    toggleBookmark,
    completeQuiz,
    saveProgress,
    isSubmitting,
    lastSubmissionResult
  };

  return (
    <QuizSessionContext.Provider value={contextValue}>
      {children}
    </QuizSessionContext.Provider>
  );
};