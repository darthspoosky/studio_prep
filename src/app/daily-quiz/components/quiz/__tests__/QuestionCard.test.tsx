import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionCard } from '../QuestionCard';
import { useQuizSession } from '../QuizSessionContext';

// Mock the quiz session context
jest.mock('../QuizSessionContext', () => ({
  useQuizSession: jest.fn()
}));

const mockUseQuizSession = useQuizSession as jest.MockedFunction<typeof useQuizSession>;

const mockQuestion = {
  id: 'q1',
  question: 'What is the capital of India?',
  options: ['New Delhi', 'Mumbai', 'Kolkata', 'Chennai'],
  correctAnswer: 'A',
  explanation: 'New Delhi is the capital of India',
  subject: 'Geography',
  difficulty: 'easy' as const,
  tags: ['geography', 'capitals', 'india']
};

const mockSession = {
  id: 'test-session',
  userId: 'test-user',
  quizType: 'free-daily',
  questions: [mockQuestion],
  timeLimit: 900,
  startTime: new Date(),
  currentQuestionIndex: 0,
  answers: [null],
  bookmarked: [false],
  completed: false,
  metadata: {
    difficulty: 'easy',
    subject: 'General Studies',
    tier: 'free',
    maxQuestions: 1
  }
};

const defaultMockContext = {
  currentQuestion: mockQuestion,
  session: mockSession,
  selectAnswer: jest.fn(),
  toggleBookmark: jest.fn(),
  isSubmitting: false,
  lastSubmissionResult: null,
  timeRemaining: 900,
  isLastQuestion: true,
  answeredCount: 0,
  progress: 50,
  goToQuestion: jest.fn(),
  nextQuestion: jest.fn(),
  previousQuestion: jest.fn(),
  completeQuiz: jest.fn(),
  saveProgress: jest.fn()
};

describe('QuestionCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuizSession.mockReturnValue(defaultMockContext);
  });

  describe('Rendering', () => {
    it('should render question text correctly', () => {
      render(<QuestionCard />);
      
      expect(screen.getByText('What is the capital of India?')).toBeInTheDocument();
    });

    it('should render all options', () => {
      render(<QuestionCard />);
      
      expect(screen.getByText('New Delhi')).toBeInTheDocument();
      expect(screen.getByText('Mumbai')).toBeInTheDocument();
      expect(screen.getByText('Kolkata')).toBeInTheDocument();
      expect(screen.getByText('Chennai')).toBeInTheDocument();
    });

    it('should display subject and difficulty badges', () => {
      render(<QuestionCard />);
      
      expect(screen.getByText('Geography')).toBeInTheDocument();
      expect(screen.getByText('Easy')).toBeInTheDocument();
    });

    it('should display tags when present', () => {
      render(<QuestionCard />);
      
      expect(screen.getByText('geography')).toBeInTheDocument();
      expect(screen.getByText('capitals')).toBeInTheDocument();
      expect(screen.getByText('india')).toBeInTheDocument();
    });

    it('should render bookmark button', () => {
      render(<QuestionCard />);
      
      const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
      expect(bookmarkButton).toBeInTheDocument();
    });
  });

  describe('Option Selection', () => {
    it('should call selectAnswer when option is clicked', async () => {
      const mockSelectAnswer = jest.fn();
      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        selectAnswer: mockSelectAnswer
      });

      render(<QuestionCard />);
      
      const option = screen.getByText('New Delhi').closest('button');
      fireEvent.click(option!);

      expect(mockSelectAnswer).toHaveBeenCalledWith('A');
    });

    it('should highlight selected option', () => {
      const sessionWithAnswer = {
        ...mockSession,
        answers: ['A']
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        session: sessionWithAnswer
      });

      render(<QuestionCard />);
      
      const selectedOption = screen.getByText('New Delhi').closest('button');
      expect(selectedOption).toHaveClass('bg-blue-100', 'border-blue-500');
    });

    it('should disable options when submitting', () => {
      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        isSubmitting: true
      });

      render(<QuestionCard />);
      
      const option = screen.getByText('New Delhi').closest('button');
      expect(option).toBeDisabled();
    });

    it('should disable options when quiz is completed', () => {
      const completedSession = {
        ...mockSession,
        completed: true
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        session: completedSession
      });

      render(<QuestionCard />);
      
      const option = screen.getByText('New Delhi').closest('button');
      expect(option).toBeDisabled();
    });
  });

  describe('Explanation Display', () => {
    it('should show explanation when answer is submitted and correct', () => {
      const submissionResult = {
        isCorrect: true,
        explanation: 'New Delhi is the capital of India'
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        lastSubmissionResult: submissionResult
      });

      render(<QuestionCard />);
      
      expect(screen.getByText('✅ Correct!')).toBeInTheDocument();
      expect(screen.getByText(/New Delhi is the capital of India/)).toBeInTheDocument();
    });

    it('should show explanation when answer is incorrect', () => {
      const submissionResult = {
        isCorrect: false,
        explanation: 'New Delhi is the capital of India'
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        lastSubmissionResult: submissionResult
      });

      render(<QuestionCard />);
      
      expect(screen.getByText('❌ Incorrect')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument(); // Correct answer
    });

    it('should allow hiding explanation', () => {
      const submissionResult = {
        isCorrect: true,
        explanation: 'New Delhi is the capital of India'
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        lastSubmissionResult: submissionResult
      });

      render(<QuestionCard />);
      
      const hideButton = screen.getByRole('button', { name: /hide/i });
      fireEvent.click(hideButton);

      expect(screen.queryByText(/New Delhi is the capital of India/)).not.toBeInTheDocument();
    });

    it('should show "Show Explanation" button when explanation is hidden', () => {
      const submissionResult = {
        isCorrect: true,
        explanation: 'New Delhi is the capital of India'
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        lastSubmissionResult: submissionResult
      });

      render(<QuestionCard />);
      
      // Hide explanation first
      const hideButton = screen.getByRole('button', { name: /hide/i });
      fireEvent.click(hideButton);

      // Should show "Show Explanation" button
      expect(screen.getByText('Show Explanation')).toBeInTheDocument();
    });
  });

  describe('Bookmark Functionality', () => {
    it('should call toggleBookmark when bookmark button is clicked', () => {
      const mockToggleBookmark = jest.fn();
      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        toggleBookmark: mockToggleBookmark
      });

      render(<QuestionCard />);
      
      const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
      fireEvent.click(bookmarkButton);

      expect(mockToggleBookmark).toHaveBeenCalled();
    });

    it('should highlight bookmark button when question is bookmarked', () => {
      const bookmarkedSession = {
        ...mockSession,
        bookmarked: [true]
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        session: bookmarkedSession
      });

      render(<QuestionCard />);
      
      const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
      expect(bookmarkButton).toHaveClass('text-yellow-500');
    });

    it('should disable bookmark button when quiz is completed', () => {
      const completedSession = {
        ...mockSession,
        completed: true
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        session: completedSession
      });

      render(<QuestionCard />);
      
      const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
      expect(bookmarkButton).toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('should show submitting state', () => {
      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        isSubmitting: true
      });

      render(<QuestionCard />);
      
      expect(screen.getByText('Submitting answer...')).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('should render image when present', () => {
      const questionWithImage = {
        ...mockQuestion,
        image: 'https://example.com/image.jpg'
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        currentQuestion: questionWithImage
      });

      render(<QuestionCard />);
      
      const image = screen.getByAltText('Question illustration');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should show fallback when image fails to load', () => {
      const questionWithImage = {
        ...mockQuestion,
        image: 'https://example.com/broken-image.jpg'
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        currentQuestion: questionWithImage
      });

      render(<QuestionCard />);
      
      const image = screen.getByAltText('Question illustration');
      
      // Simulate image load error
      fireEvent.error(image);

      expect(screen.getByText('Image could not be loaded')).toBeInTheDocument();
    });
  });

  describe('Difficulty Color Coding', () => {
    it('should apply correct color for easy difficulty', () => {
      render(<QuestionCard />);
      
      const difficultyBadge = screen.getByText('Easy');
      expect(difficultyBadge).toHaveClass('text-green-600');
    });

    it('should apply correct color for medium difficulty', () => {
      const mediumQuestion = {
        ...mockQuestion,
        difficulty: 'medium' as const
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        currentQuestion: mediumQuestion
      });

      render(<QuestionCard />);
      
      const difficultyBadge = screen.getByText('Medium');
      expect(difficultyBadge).toHaveClass('text-yellow-600');
    });

    it('should apply correct color for hard difficulty', () => {
      const hardQuestion = {
        ...mockQuestion,
        difficulty: 'hard' as const
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        currentQuestion: hardQuestion
      });

      render(<QuestionCard />);
      
      const difficultyBadge = screen.getByText('Hard');
      expect(difficultyBadge).toHaveClass('text-red-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing question gracefully', () => {
      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        currentQuestion: null as any
      });

      render(<QuestionCard />);
      
      expect(screen.getByText('No question available')).toBeInTheDocument();
    });

    it('should handle question without tags', () => {
      const questionWithoutTags = {
        ...mockQuestion,
        tags: undefined
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        currentQuestion: questionWithoutTags
      });

      expect(() => render(<QuestionCard />)).not.toThrow();
    });

    it('should handle question without source or year', () => {
      const basicQuestion = {
        ...mockQuestion,
        source: undefined,
        year: undefined
      };

      mockUseQuizSession.mockReturnValue({
        ...defaultMockContext,
        currentQuestion: basicQuestion
      });

      expect(() => render(<QuestionCard />)).not.toThrow();
    });
  });
});