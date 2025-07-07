// Define interfaces for the dashboard widget components
export interface UserProgressData {
  userId: string;
  total: number;
  attempted: number;
  correct: number;
  currentStreak?: number;
  bestStreak?: number;
  lastActiveDate?: Date;
  yearProgress: YearProgress[];
  syllabusProgress?: Record<string, SyllabusProgress>;
  accuracy?: number;
  weeklyPerformance?: Array<{ day: string; correct: number; total: number }>;
  recentImprovement?: number;
}

export interface YearProgress {
  year: number;
  attempted: number;
  correct: number;
  total: number;
}

export interface SyllabusProgress {
  attempted: number;
  correct: number;
  total: number;
  lastAttempted?: Date;
}

// Type for section data
export interface SyllabusSection {
  id: string;
  name: string;
  children?: SyllabusSection[];
}
