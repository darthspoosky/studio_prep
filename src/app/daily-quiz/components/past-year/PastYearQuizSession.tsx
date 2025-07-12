
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, X, Clock, AlertTriangle, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Question, QuestionSet } from '@/types/quiz';
import { useAuth } from '@/contexts/AuthContext';
import PastYearQuestionService from '@/services/pastYearQuestionService';
import { cn } from '@/lib/utils';

interface PastYearQuizSessionProps {
  questionSet: QuestionSet;
  onComplete?: (results: {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    timeTaken: number;
  }) => void;
  onExit?: () => void;
}

type QuizState = 'in-progress' | 'review' | 'completed';

export default function PastYearQuizSession({ 
  questionSet, 
  onComplete,
  onExit
}: PastYearQuizSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | null>>({});
  const [quizState, setQuizState] = useState<QuizState>('in-progress');
  const [startTime] = useState<number>(Date.now());
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize userAnswers with existing answers if available, or null values
    const initialAnswers: Record<string, string | null> = {};
    questionSet.questions.forEach(q => {
      // If the question has a user answer from previous attempts, use it
      initialAnswers[q.id] = q.userAnswer || null;
    });
    setUserAnswers(initialAnswers);

    // Start the timer
    timerIntervalRef.current = setInterval(() => {
      setTimeTaken(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Fetch user progress data if logged in
    const abortController = new AbortController();
    const fetchProgressData = async () => {
      if (user?.uid) {
        try {
          await PastYearQuestionService.getUserProgressData(user.uid);
          // We don't need to do anything with this yet, but it ensures
          // the user progress document exists for later updates
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error fetching user progress data:', error);
          }
        }
      }
    };

    fetchProgressData();

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      abortController.abort();
    };
  }, [questionSet, startTime, user]);

  const currentQuestion = questionSet.questions[currentQuestionIndex];

  const handleAnswer = async (questionId: string, optionId: string) => {
    const newAnswers = { ...userAnswers, [questionId]: optionId };
    setUserAnswers(newAnswers);

    // Find the complete question data for this ID
    const questionData = questionSet.questions.find(q => q.id === questionId);

    // Save answer to backend if user is logged in
    if (user?.uid && questionData) {
      try {
        // Pass the complete question data for better progress tracking
        await PastYearQuestionService.updateUserAnswer(questionId, user.uid, optionId, questionData);
      } catch (error) {
        console.error('Error saving answer:', error);
        // Continue anyway, we have the answer in local state
      }
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questionSet.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setShowExplanation(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
      setShowExplanation(false);
    }
  };

  const handleFinish = () => {
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Save any unanswered questions as skipped
    if (user?.uid) {
      // Find any questions that haven't been answered yet
      const skippedQuestions = questionSet.questions.filter(q => !userAnswers[q.id]);
      
      // Mark them as skipped in the database
      skippedQuestions.forEach(question => {
        PastYearQuestionService.updateUserAnswer(
          question.id,
          user.uid,
          'skipped',  // Special value to indicate skipped
          question
        ).catch(error => console.error('Error marking skipped question:', error));
      });
    }
    
    // Switch to review state
    setQuizState('review');
  };

  const handleCompleteReview = () => {
    setQuizState('completed');
    
    // Calculate results
    const results = calculateResults();
    
    // Update user streak data on quiz completion if user is logged in
    if (user?.uid) {
      try {
        // We use a dummy update to trigger streak calculation
        // This ensures the streak is updated when the quiz is completed
        const lastQuestion = questionSet.questions[questionSet.questions.length - 1];
        if (lastQuestion) {
          const answer = userAnswers[lastQuestion.id] || '';
          PastYearQuestionService.updateUserAnswer(
            lastQuestion.id,
            user.uid,
            answer,
            lastQuestion
          );
        }
      } catch (error) {
        console.error('Error updating streak data:', error);
      }
    }
    
    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete(results);
    }
  };

  const calculateResults = () => {
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    questionSet.questions.forEach(question => {
      const userAnswer = userAnswers[question.id];
      if (userAnswer === null) {
        skippedCount++;
      } else if (userAnswer === question.correctOptionId) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    return {
      totalQuestions: questionSet.questions.length,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      skippedQuestions: skippedCount,
      timeTaken,
    };
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${secs}s`;
  };

  const getProgressPercentage = (): number => {
    const answeredCount = Object.values(userAnswers).filter(ans => ans !== null).length;
    return Math.round((answeredCount / questionSet.questions.length) * 100);
  };

  const renderQuestionStatus = (question: Question, index: number) => {
    const userAnswer = userAnswers[question.id];
    
    // Current question
    if (index === currentQuestionIndex) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
          {index + 1}
        </div>
      );
    }
    
    // Answered correctly
    if (userAnswer === question.correctOptionId) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
          <Check size={16} />
        </div>
      );
    }
    
    // Answered incorrectly
    if (userAnswer !== null && userAnswer !== question.correctOptionId) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
          <X size={16} />
        </div>
      );
    }
    
    // Not answered
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600">
        {index + 1}
      </div>
    );
  };

  // Review screen showing all questions with correct/incorrect status
  if (quizState === 'review') {
    const results = calculateResults();
    
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Quiz Review</CardTitle>
          <div className="flex justify-between items-center mt-4">
            <Badge variant="outline" className="px-3 py-1">
              <Clock size={16} className="mr-1" />
              Time: {formatTime(timeTaken)}
            </Badge>
            <div className="flex space-x-4">
              <Badge variant="secondary" className="px-3 py-1">
                Total: {results.totalQuestions}
              </Badge>
              <Badge variant="default" className="bg-green-100 text-green-800 px-3 py-1">
                Correct: {results.correctAnswers}
              </Badge>
              <Badge variant="destructive" className="px-3 py-1">
                Wrong: {results.incorrectAnswers}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                Skipped: {results.skippedQuestions}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {questionSet.questions.map((question, index) => {
              const userAnswer = userAnswers[question.id];
              const isCorrect = userAnswer === question.correctOptionId;
              const isSkipped = userAnswer === null;
              
              return (
                <div 
                  key={question.id} 
                  className={cn(
                    "p-4 rounded-lg border",
                    isCorrect ? "border-green-200 bg-green-50" : 
                    isSkipped ? "border-gray-200 bg-gray-50" : 
                    "border-red-200 bg-red-50"
                  )}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {isCorrect ? (
                        <Check className="text-green-600" size={20} />
                      ) : isSkipped ? (
                        <AlertTriangle className="text-amber-500" size={20} />
                      ) : (
                        <X className="text-red-600" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {index + 1}. {question.question}
                      </p>
                      
                      <div className="ml-4 mt-2">
                        {question.options.map(option => (
                          <div key={option.id} className="flex items-center my-1">
                            <div 
                              className={cn(
                                "w-4 h-4 rounded-full mr-2",
                                option.id === question.correctOptionId ? "bg-green-500" : 
                                option.id === userAnswer && option.id !== question.correctOptionId ? "bg-red-500" : 
                                "bg-gray-200"
                              )}
                            />
                            <span 
                              className={cn(
                                option.id === question.correctOptionId ? "font-medium text-green-700" : 
                                option.id === userAnswer && option.id !== question.correctOptionId ? "font-medium text-red-700" : 
                                ""
                              )}
                            >
                              {option.text}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {question.explanation && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                          <p className="font-medium flex items-center mb-1">
                            <Info size={16} className="mr-1" /> Explanation:
                          </p>
                          <p>{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onExit}>
            Exit
          </Button>
          <Button onClick={handleCompleteReview}>
            Complete Review
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Final completion screen
  if (quizState === 'completed') {
    const results = calculateResults();
    const score = Math.round((results.correctAnswers / results.totalQuestions) * 100);
    
    return (
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Quiz Completed!</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="my-6">
            <div className="text-5xl font-bold mb-2 text-blue-600">{score}%</div>
            <p className="text-gray-500">Your Score</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 text-2xl font-bold">{results.correctAnswers}</div>
              <p className="text-sm">Correct</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-red-600 text-2xl font-bold">{results.incorrectAnswers}</div>
              <p className="text-sm">Incorrect</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-gray-600 text-2xl font-bold">{results.skippedQuestions}</div>
              <p className="text-sm">Skipped</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 text-2xl font-bold">{formatTime(results.timeTaken)}</div>
              <p className="text-sm">Time</p>
            </div>
          </div>

          <Alert>
            <AlertTitle>Keep practicing!</AlertTitle>
            <AlertDescription>
              Regular practice with past year questions is key to UPSC success.
            </AlertDescription>
          </Alert>
        </CardContent>
        
        <CardFooter className="justify-center">
          <Button onClick={onExit} className="w-full">
            Return to Question Bank
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Quiz in progress - showing questions
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="px-3 py-1">
            Question {currentQuestionIndex + 1} of {questionSet.questions.length}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Clock size={16} className="mr-1" />
            Time: {formatTime(timeTaken)}
          </Badge>
        </div>
        
        <div className="mt-4">
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Question */}
          <div>
            <h3 className="text-xl font-semibold mb-4">
              {currentQuestion.question}
            </h3>
            
            {/* Year and topic information */}
            <div className="flex flex-wrap gap-2 mb-4">
              {currentQuestion.year && (
                <Badge variant="secondary">
                  Year: {currentQuestion.year}
                </Badge>
              )}
              {currentQuestion.subject && (
                <Badge variant="outline">
                  {currentQuestion.subject}
                </Badge>
              )}
              {currentQuestion.topic && (
                <Badge variant="outline">
                  {currentQuestion.topic}
                </Badge>
              )}
            </div>
            
            {/* Options */}
            <RadioGroup 
              value={userAnswers[currentQuestion.id] || ''} 
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
            >
              <div className="grid gap-3">
                {currentQuestion.options.map(option => (
                  <div 
                    key={option.id}
                    className={cn(
                      "flex items-center rounded-lg border p-4 cursor-pointer transition-colors",
                      userAnswers[currentQuestion.id] === option.id ? 
                        "bg-blue-50 border-blue-200" : 
                        "hover:bg-gray-50"
                    )}
                    onClick={() => handleAnswer(currentQuestion.id, option.id)}
                  >
                    <RadioGroupItem 
                      value={option.id} 
                      id={`option-${option.id}`} 
                      className="mr-3"
                    />
                    <Label 
                      htmlFor={`option-${option.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            
            {/* Explanation (shown only after answering) */}
            {userAnswers[currentQuestion.id] !== null && showExplanation && currentQuestion.explanation && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="font-medium flex items-center mb-1">
                  <Info size={16} className="mr-1" /> Explanation:
                </p>
                <p>{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="mr-1" size={16} /> Previous
          </Button>
          
          {userAnswers[currentQuestion.id] !== null && !showExplanation && (
            <Button 
              variant="secondary" 
              onClick={() => setShowExplanation(true)}
            >
              Show Explanation
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {currentQuestionIndex < questionSet.questions.length - 1 ? (
            <Button onClick={handleNext}>
              Next <ChevronRight className="ml-1" size={16} />
            </Button>
          ) : (
            <Button onClick={handleFinish}>
              Finish Quiz
            </Button>
          )}
        </div>
      </CardFooter>
      
      {/* Question navigation dots */}
      <div className="px-6 pb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {questionSet.questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => {
                setCurrentQuestionIndex(index);
                setShowExplanation(false);
              }}
              className="focus:outline-none"
            >
              {renderQuestionStatus(question, index)}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
