import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { QuizSessionProvider, useQuizSession } from '../QuizSessionContext';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock session data
const mockSession = {
  id: 'test-session-1',
  userId: 'test-user',
  quizType: 'free-daily',
  questions: [
    {
      id: 'q1',
      question: 'What is the capital of India?',
      options: ['New Delhi', 'Mumbai', 'Kolkata', 'Chennai'],
      correctAnswer: 'A',
      explanation: 'New Delhi is the capital of India',
      subject: 'geography',
      difficulty: 'easy' as const
    },
    {
      id: 'q2', 
      question: 'Who wrote the Indian Constitution?',
      options: ['Dr. B.R. Ambedkar', 'Mahatma Gandhi', 'Nehru', 'Patel'],
      correctAnswer: 'A',
      explanation: 'Dr. B.R. Ambedkar was the chief architect of the Indian Constitution',
      subject: 'polity',
      difficulty: 'medium' as const
    }
  ],
  timeLimit: 900, // 15 minutes
  startTime: new Date(),
  currentQuestionIndex: 0,
  answers: [null, null],
  bookmarked: [false, false],
  completed: false,
  metadata: {
    difficulty: 'easy',
    subject: 'General Studies',
    tier: 'free',
    maxQuestions: 2
  }
};

// Test component that uses the quiz session context
const TestComponent: React.FC = () => {
  const {
    session,
    currentQuestion,
    timeRemaining,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    toggleBookmark,
    completeQuiz,
    isSubmitting,
    lastSubmissionResult
  } = useQuizSession();

  return (
    <div>
      <div data-testid="current-question">{currentQuestion?.question}</div>
      <div data-testid="question-index">{session.currentQuestionIndex}</div>
      <div data-testid="time-remaining">{timeRemaining}</div>
      <div data-testid="is-submitting">{isSubmitting.toString()}</div>
      
      <button onClick={() => selectAnswer('A')} data-testid="select-answer-a">
        Select A
      </button>
      <button onClick={nextQuestion} data-testid="next-question">
        Next
      </button>
      <button onClick={previousQuestion} data-testid="previous-question">
        Previous
      </button>
      <button onClick={toggleBookmark} data-testid="toggle-bookmark">
        Bookmark
      </button>
      <button onClick={completeQuiz} data-testid="complete-quiz">
        Complete
      </button>
      
      {lastSubmissionResult && (
        <div data-testid="submission-result">
          {lastSubmissionResult.isCorrect ? 'Correct' : 'Incorrect'}
        </div>
      )}
    </div>
  );
};

const renderWithProvider = (session = mockSession) => {
  const mockOnSessionUpdate = jest.fn();
  return render(
    <QuizSessionProvider session={session} onSessionUpdate={mockOnSessionUpdate}>
      <TestComponent />
    </QuizSessionProvider>
  );
};

describe('QuizSessionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Initial State', () => {
    it('should provide initial session data', () => {
      renderWithProvider();
      
      expect(screen.getByTestId('current-question')).toHaveTextContent('What is the capital of India?');
      expect(screen.getByTestId('question-index')).toHaveTextContent('0');
      expect(screen.getByTestId('time-remaining')).toHaveTextContent('900');
      expect(screen.getByTestId('is-submitting')).toHaveTextContent('false');
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => render(<TestComponent />)).toThrow(
        'useQuizSession must be used within a QuizSessionProvider'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Answer Selection', () => {
    it('should handle answer selection correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isCorrect: true,
          explanation: 'New Delhi is the capital of India'
        })
      } as Response);

      renderWithProvider();
      
      const selectButton = screen.getByTestId('select-answer-a');
      
      await act(async () => {
        fireEvent.click(selectButton);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/daily-quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-session-1',
          questionIndex: 0,
          selectedAnswer: 'A',
          timeSpent: 0
        })
      });

      await waitFor(() => {
        expect(screen.getByTestId('submission-result')).toHaveTextContent('Correct');
      });
    });

    it('should handle submission errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithProvider();
      
      const selectButton = screen.getByTestId('select-answer-a');
      
      await act(async () => {
        fireEvent.click(selectButton);
      });

      // Should not crash and should reset submitting state
      expect(screen.getByTestId('is-submitting')).toHaveTextContent('false');
    });

    it('should prevent multiple submissions while submitting', async () => {
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      renderWithProvider();
      
      const selectButton = screen.getByTestId('select-answer-a');
      
      await act(async () => {
        fireEvent.click(selectButton);
        fireEvent.click(selectButton); // Second click should be ignored
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation', () => {
    it('should navigate to next question', () => {
      renderWithProvider();
      
      const nextButton = screen.getByTestId('next-question');
      
      act(() => {
        fireEvent.click(nextButton);
      });

      expect(screen.getByTestId('question-index')).toHaveTextContent('1');
      expect(screen.getByTestId('current-question')).toHaveTextContent('Who wrote the Indian Constitution?');
    });

    it('should navigate to previous question', () => {
      const sessionWithSecondQuestion = {
        ...mockSession,
        currentQuestionIndex: 1
      };
      
      renderWithProvider(sessionWithSecondQuestion);
      
      const prevButton = screen.getByTestId('previous-question');
      
      act(() => {
        fireEvent.click(prevButton);
      });

      expect(screen.getByTestId('question-index')).toHaveTextContent('0');
    });

    it('should not navigate beyond boundaries', () => {
      renderWithProvider();
      
      const prevButton = screen.getByTestId('previous-question');
      
      act(() => {
        fireEvent.click(prevButton);
      });

      // Should stay at index 0
      expect(screen.getByTestId('question-index')).toHaveTextContent('0');
    });
  });

  describe('Bookmark Functionality', () => {
    it('should toggle bookmark state', () => {
      const mockOnSessionUpdate = jest.fn();
      
      render(
        <QuizSessionProvider session={mockSession} onSessionUpdate={mockOnSessionUpdate}>
          <TestComponent />
        </QuizSessionProvider>
      );
      
      const bookmarkButton = screen.getByTestId('toggle-bookmark');
      
      act(() => {
        fireEvent.click(bookmarkButton);
      });

      expect(mockOnSessionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          bookmarked: [true, false]
        })
      );
    });
  });

  describe('Quiz Completion', () => {
    it('should complete quiz and return results', async () => {
      const mockResults = {
        score: 85,
        accuracy: 85,
        totalQuestions: 2,
        correctAnswers: 1,
        timeTaken: 300,
        subjectWiseResults: {},
        recommendations: [],
        detailedResults: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      } as Response);

      renderWithProvider();
      
      const completeButton = screen.getByTestId('complete-quiz');
      
      await act(async () => {
        fireEvent.click(completeButton);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/daily-quiz/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: 'test-session-1',
          finalAnswers: [null, null],
          timeTaken: 900
        })
      });
    });

    it('should handle completion errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Completion failed'));

      renderWithProvider();
      
      const completeButton = screen.getByTestId('complete-quiz');
      
      await act(async () => {
        fireEvent.click(completeButton);
      });

      // Should handle error gracefully - exact behavior depends on implementation
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Progress Saving', () => {
    it('should auto-save progress every 30 seconds', async () => {
      jest.useFakeTimers();
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      renderWithProvider();

      // Fast-forward 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/daily-quiz/save-progress', 
          expect.objectContaining({
            method: 'POST'
          })
        );
      });

      jest.useRealTimers();
    });
  });

  describe('Timer Functionality', () => {
    it('should decrement time remaining', () => {
      jest.useFakeTimers();
      
      renderWithProvider();
      
      expect(screen.getByTestId('time-remaining')).toHaveTextContent('900');
      
      // Fast-forward 1 second  
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('time-remaining')).toHaveTextContent('899');
      
      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle completed session', () => {
      const completedSession = {
        ...mockSession,
        completed: true
      };
      
      renderWithProvider(completedSession);
      
      const selectButton = screen.getByTestId('select-answer-a');
      
      act(() => {
        fireEvent.click(selectButton);
      });

      // Should not make API call for completed session
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle empty questions array', () => {
      const emptySession = {
        ...mockSession,
        questions: [],
        answers: [],
        bookmarked: []
      };
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => renderWithProvider(emptySession)).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });
});