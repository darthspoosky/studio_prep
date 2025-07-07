// Types for quiz data structures

export type Option = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  question: string;
  options: Option[];
  correctOptionId: string;
  explanation?: string;
  year?: number;
  subject?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  userAnswer?: string | null;
  metadata?: {
    source?: string;
    syllabusSectionId?: string;
    year?: number;
    [key: string]: any;
  };
};

export type QuizResults = {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  timeTaken: number; // in seconds
  accuracy: number; // percentage
  completedAt: Date;
};

export type QuestionSet = {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  metadata?: {
    source?: string;
    year?: number;
    syllabusSectionId?: string;
    difficulty?: string;
    [key: string]: any;
  };
};

export type QuizProgress = {
  currentQuestionIndex: number;
  answers: Record<string, string | null>;
  startTime: number; // timestamp when quiz started
  endTime?: number; // timestamp when quiz ended
  isPaused?: boolean;
  pausedTime?: number; // total time spent in paused state
};

export type SavedQuiz = {
  id: string;
  userId: string;
  questionSetId: string;
  progress: QuizProgress;
  results?: QuizResults;
  savedAt: Date;
  lastUpdated: Date;
  isCompleted: boolean;
};
