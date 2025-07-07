import { User } from 'firebase/auth';
import { Question, QuestionSet } from '@/types/quiz';

export type PastYearFilter = {
  year?: number;
  subject?: string;
  topic?: string;
  syllabusSectionId?: string;
};

export type YearProgress = {
  year: number;
  total: number;
  attempted: number;
  correct: number;
};

/**
 * Service for managing past year questions
 */
export default class PastYearQuestionService {
  /**
   * Fetches questions by year
   * @param year The year to fetch questions for
   * @param userId The current user ID
   * @returns Promise resolving to an array of questions
   */
  static async fetchQuestionsByYear(year: number, userId?: string): Promise<QuestionSet> {
    try {
      // TODO: Replace with actual API call to fetch from database
      // For now returning mock data
      const mockQuestions: Question[] = Array(10).fill(null).map((_, index) => ({
        id: `py-${year}-${index}`,
        question: `Sample past year question ${index + 1} from ${year}`,
        options: [
          { id: 'a', text: 'Option A' },
          { id: 'b', text: 'Option B' },
          { id: 'c', text: 'Option C' },
          { id: 'd', text: 'Option D' },
        ],
        correctOptionId: 'a',
        explanation: `This is an explanation for question ${index + 1}`,
        year,
        subject: 'General Studies',
        topic: 'Current Affairs',
        difficulty: 'medium',
        userAnswer: null,
      }));

      return {
        id: `py-set-${year}`,
        title: `UPSC ${year} Questions`,
        description: `Questions from UPSC Prelims ${year} examination`,
        questions: mockQuestions,
        metadata: {
          source: 'past-year',
          year,
        },
      };
    } catch (error) {
      console.error('Error fetching questions by year:', error);
      throw error;
    }
  }

  /**
   * Fetches questions by syllabus section
   * @param sectionId The syllabus section ID to fetch questions for
   * @param userId The current user ID
   * @returns Promise resolving to an array of questions
   */
  static async fetchQuestionsBySyllabusSection(
    sectionId: string,
    userId?: string
  ): Promise<QuestionSet> {
    try {
      // TODO: Replace with actual API call to fetch from database
      // For now returning mock data
      const mockQuestions: Question[] = Array(8).fill(null).map((_, index) => ({
        id: `py-section-${sectionId}-${index}`,
        question: `Sample question ${index + 1} from syllabus section ${sectionId}`,
        options: [
          { id: 'a', text: 'Option A' },
          { id: 'b', text: 'Option B' },
          { id: 'c', text: 'Option C' },
          { id: 'd', text: 'Option D' },
        ],
        correctOptionId: 'b',
        explanation: `This is an explanation for question ${index + 1} in syllabus section ${sectionId}`,
        year: 2020 + Math.floor(Math.random() * 3), // Random year between 2020-2022
        subject: sectionId.includes('gs') ? 'General Studies' : 'CSAT',
        topic: sectionId,
        difficulty: 'medium',
        userAnswer: null,
      }));

      return {
        id: `py-section-${sectionId}`,
        title: `${sectionId.toUpperCase()} Questions`,
        description: `Questions from syllabus section ${sectionId}`,
        questions: mockQuestions,
        metadata: {
          source: 'past-year',
          syllabusSectionId: sectionId,
        },
      };
    } catch (error) {
      console.error('Error fetching questions by syllabus section:', error);
      throw error;
    }
  }

  /**
   * Gets the user's progress by year
   * @param userId The user ID to get progress for
   * @returns Promise resolving to an array of year progress objects
   */
  static async getUserYearProgress(userId: string): Promise<YearProgress[]> {
    try {
      // TODO: Replace with actual API call to fetch from database
      // For now returning mock data
      const currentYear = new Date().getFullYear();
      const yearProgress: YearProgress[] = [];

      // Generate mock progress for past 10 years
      for (let i = 0; i < 10; i++) {
        const year = currentYear - i;
        const total = 100;
        const attempted = Math.floor(Math.random() * total);
        const correct = Math.floor(Math.random() * attempted);

        yearProgress.push({
          year,
          total,
          attempted,
          correct,
        });
      }

      return yearProgress;
    } catch (error) {
      console.error('Error fetching user year progress:', error);
      throw error;
    }
  }

  /**
   * Updates the user's answer for a question
   * @param questionId The question ID
   * @param userId The user ID
   * @param answer The user's answer
   * @returns Promise resolving when the answer is updated
   */
  static async updateUserAnswer(
    questionId: string,
    userId: string,
    answer: string
  ): Promise<void> {
    try {
      // TODO: Implement actual API call to update user answer in database
      console.log(`Updating answer for question ${questionId} by user ${userId} to ${answer}`);
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating user answer:', error);
      throw error;
    }
  }

  /**
   * Gets all available past years
   * @returns Promise resolving to an array of available years
   */
  static async getAvailableYears(): Promise<number[]> {
    try {
      // TODO: Replace with actual API call to fetch from database
      // For now returning mock data for the past 15 years
      const currentYear = new Date().getFullYear();
      return Array(15)
        .fill(null)
        .map((_, index) => currentYear - index)
        .filter(year => year >= 2000); // Only include years since 2000
    } catch (error) {
      console.error('Error fetching available years:', error);
      throw error;
    }
  }

  /**
   * Gets all available syllabus sections
   * @returns Promise resolving to an array of available syllabus sections
   */
  static async getAvailableSyllabusSections(): Promise<
    Array<{
      id: string;
      name: string;
      parentId?: string;
      children?: Array<{ id: string; name: string }>;
    }>
  > {
    try {
      // TODO: Replace with actual API call to fetch from database
      // For now returning mock data based on actual UPSC syllabus
      return [
        {
          id: 'gs-current-events',
          name: 'Current Events of National and International Importance',
          children: [
            { id: 'gs-current-events-national', name: 'National Current Events' },
            { id: 'gs-current-events-international', name: 'International Current Events' },
          ],
        },
        {
          id: 'gs-history',
          name: 'History of India and Indian National Movement',
          children: [
            { id: 'gs-history-ancient', name: 'Ancient Indian History' },
            { id: 'gs-history-medieval', name: 'Medieval Indian History' },
            { id: 'gs-history-modern', name: 'Modern Indian History' },
            { id: 'gs-history-national-movement', name: 'Indian National Movement' },
          ],
        },
        {
          id: 'gs-geography',
          name: 'Indian and World Geography',
          children: [
            { id: 'gs-geography-physical', name: 'Physical Geography' },
            { id: 'gs-geography-social', name: 'Social Geography' },
            { id: 'gs-geography-economic', name: 'Economic Geography' },
            { id: 'gs-geography-world', name: 'World Geography' },
          ],
        },
        {
          id: 'gs-polity',
          name: 'Indian Polity and Governance',
          children: [
            { id: 'gs-polity-constitution', name: 'Constitution' },
            { id: 'gs-polity-political-system', name: 'Political System' },
            { id: 'gs-polity-panchayati-raj', name: 'Panchayati Raj' },
            { id: 'gs-polity-public-policy', name: 'Public Policy' },
            { id: 'gs-polity-rights', name: 'Rights Issues' },
          ],
        },
        {
          id: 'gs-economy',
          name: 'Economic and Social Development',
          children: [
            { id: 'gs-economy-sustainable-dev', name: 'Sustainable Development' },
            { id: 'gs-economy-poverty', name: 'Poverty' },
            { id: 'gs-economy-inclusion', name: 'Inclusion' },
            { id: 'gs-economy-demographics', name: 'Demographics' },
            { id: 'gs-economy-social-sector', name: 'Social Sector Initiatives' },
          ],
        },
        {
          id: 'gs-environment',
          name: 'Environment, Ecology, Biodiversity, and Climate Change',
          children: [
            { id: 'gs-environment-ecology', name: 'Ecology' },
            { id: 'gs-environment-biodiversity', name: 'Biodiversity' },
            { id: 'gs-environment-climate', name: 'Climate Change' },
          ],
        },
        {
          id: 'gs-science',
          name: 'General Science',
          children: [
            { id: 'gs-science-physics', name: 'Physics' },
            { id: 'gs-science-chemistry', name: 'Chemistry' },
            { id: 'gs-science-biology', name: 'Biology' },
            { id: 'gs-science-tech', name: 'Technology' },
          ],
        },
        {
          id: 'csat',
          name: 'CSAT (Paper II)',
          children: [
            { id: 'csat-comprehension', name: 'Comprehension' },
            { id: 'csat-reasoning', name: 'Logical Reasoning and Analytical Ability' },
            { id: 'csat-decision-making', name: 'Decision Making and Problem Solving' },
            { id: 'csat-mental-ability', name: 'General Mental Ability' },
            { id: 'csat-numeracy', name: 'Basic Numeracy' },
            { id: 'csat-data-interpretation', name: 'Data Interpretation' },
          ],
        },
      ];
    } catch (error) {
      console.error('Error fetching available syllabus sections:', error);
      throw error;
    }
  }
}
