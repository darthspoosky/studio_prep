'use client';

import React, { useState } from 'react';
import { useQuizSession } from './QuizSessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Flag, 
  BookOpen, 
  Eye, 
  EyeOff, 
  Image as ImageIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const QuestionCard: React.FC = () => {
  const {
    currentQuestion,
    session,
    selectAnswer,
    toggleBookmark,
    isSubmitting,
    lastSubmissionResult
  } = useQuizSession();

  const [imageError, setImageError] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">No question available</div>
        </CardContent>
      </Card>
    );
  }

  const currentAnswer = session.answers[session.currentQuestionIndex];
  const isBookmarked = session.bookmarked[session.currentQuestionIndex];

  const handleAnswerSelect = async (optionIndex: number) => {
    if (isSubmitting || session.completed) return;
    
    const answer = String.fromCharCode(65 + optionIndex); // Convert 0,1,2,3 to A,B,C,D
    await selectAnswer(answer);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <Badge variant="secondary" className="font-medium">
                {currentQuestion.subject}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn("border", getDifficultyColor(currentQuestion.difficulty))}
              >
                {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
              </Badge>
              {currentQuestion.source && (
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.source}
                </Badge>
              )}
              {currentQuestion.year && (
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.year}
                </Badge>
              )}
            </div>
            
            <h2 className="text-lg font-medium leading-relaxed text-gray-900">
              {currentQuestion.question}
            </h2>
            
            {currentQuestion.tags && currentQuestion.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {currentQuestion.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs text-gray-500"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleBookmark}
            className={cn(
              "ml-4 flex-shrink-0",
              isBookmarked && "text-yellow-500 hover:text-yellow-600"
            )}
            disabled={session.completed}
          >
            <Flag className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Question Image */}
        {currentQuestion.image && !imageError && (
          <div className="mb-6">
            <img 
              src={currentQuestion.image} 
              alt="Question illustration" 
              className="max-w-full h-auto rounded-lg mx-auto shadow-sm"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        
        {/* Image Error Fallback */}
        {currentQuestion.image && imageError && (
          <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Image could not be loaded</p>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = currentAnswer === optionLetter;
            
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={isSubmitting || session.completed}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                  "hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isSelected 
                    ? "bg-blue-100 border-blue-500 shadow-sm" 
                    : "bg-white border-gray-200"
                )}
              >
                <div className="flex items-start space-x-3">
                  <span className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium",
                    isSelected 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {optionLetter}
                  </span>
                  <span className="flex-1 leading-relaxed">{option}</span>
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation Section */}
        {lastSubmissionResult && (
          <div className="mt-6">
            {showExplanation ? (
              <Alert className={cn(
                "border-2",
                lastSubmissionResult.isCorrect 
                  ? "border-green-200 bg-green-50" 
                  : "border-red-200 bg-red-50"
              )}>
                <BookOpen className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "font-medium",
                        lastSubmissionResult.isCorrect ? "text-green-700" : "text-red-700"
                      )}>
                        {lastSubmissionResult.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                        {!lastSubmissionResult.isCorrect && (
                          <span className="ml-2 text-sm">
                            Correct answer: {currentQuestion.correctAnswer}
                          </span>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowExplanation(false)}
                        className="h-6 px-2"
                      >
                        <EyeOff className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-sm leading-relaxed">
                      <strong>Explanation:</strong> {lastSubmissionResult.explanation}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExplanation(true)}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Show Explanation
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isSubmitting && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Submitting answer...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};