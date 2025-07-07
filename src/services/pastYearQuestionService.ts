import { User } from 'firebase/auth';
import { Question, QuestionSet } from '../types/quiz';
import { doc, collection, getDoc, getDocs, setDoc, updateDoc, query, where, Timestamp, addDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

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

export type UserAnswer = {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timestamp: Date;
};

export type UserProgressData = {
  userId: string;
  yearProgress: YearProgress[];
  lastActiveDate?: Date;
  currentStreak?: number;
  bestStreak?: number;
  syllabusProgress?: Record<string, { attempted: number; correct: number; total: number }>;
  
  // Additional fields for performance metrics
  total: number;
  attempted: number;
  correct: number;
  accuracy?: number;
  weeklyPerformance?: Array<{ day: string; correct: number; total: number }>;
  recentImprovement?: number;
};

/**
 * Service for managing past year questions
 */
export default class PastYearQuestionService {
  /**
   * Gets the complete user progress data including streaks
   * @param userId The user ID
   * @returns Promise resolving to the complete user progress data
   */
  static async getUserProgressData(userId: string): Promise<UserProgressData | null> {
    try {
      if (!userId) return null;
      
      const userProgressRef = doc(db, 'userProgress', userId);
      const userProgressDoc = await getDoc(userProgressRef);
      
      if (userProgressDoc.exists()) {
        return userProgressDoc.data() as UserProgressData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user progress data:', error);
      return null;
    }
  }
  /**
   * Fetches questions by year
   * @param year The year to fetch questions for
   * @param userId The current user ID
   * @returns Promise resolving to an array of questions
   */
  static async fetchQuestionsByYear(year: number, userId?: string): Promise<QuestionSet> {
    try {
      // Get questions collection reference
      const questionsRef = collection(db, 'pastYearQuestions');
      const q = query(questionsRef, where('year', '==', year));
      
      try {
        // Try to fetch from database first
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const questions: Question[] = [];
          
          // Get user answers if userId is provided
          let userAnswers: Record<string, string> = {};
          if (userId) {
            const userAnswersRef = collection(db, 'userAnswers');
            const userAnswersQuery = query(userAnswersRef, where('userId', '==', userId));
            const userAnswersSnapshot = await getDocs(userAnswersQuery);
            
            userAnswersSnapshot.forEach(doc => {
              const data = doc.data();
              userAnswers[data.questionId] = data.answer;
            });
          }
          
          // Process questions and add user answers if available
          querySnapshot.forEach(doc => {
            const questionData = doc.data() as Question;
            questionData.id = doc.id;
            
            // Add user answer if available
            if (userId && userAnswers[questionData.id]) {
              questionData.userAnswer = userAnswers[questionData.id];
            }
            
            questions.push(questionData);
          });
          
          return {
            id: `py-set-${year}`,
            title: `UPSC ${year} Questions`,
            description: `Questions from UPSC Prelims ${year} examination`,
            questions,
            metadata: {
              source: 'past-year',
              year,
            },
          };
        }
      } catch (dbError) {
        console.error('Error fetching from database, falling back to mock data:', dbError);
      }
      
      // Fall back to mock data if database fetch fails or returns empty
      console.log('Using mock data for year', year);
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
      // Get questions collection reference
      const questionsRef = collection(db, 'pastYearQuestions');
      const q = query(questionsRef, where('metadata.syllabusSectionId', '==', sectionId));
      
      try {
        // Try to fetch from database first
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const questions: Question[] = [];
          
          // Get user answers if userId is provided
          let userAnswers: Record<string, string> = {};
          if (userId) {
            const userAnswersRef = collection(db, 'userAnswers');
            const userAnswersQuery = query(userAnswersRef, where('userId', '==', userId));
            const userAnswersSnapshot = await getDocs(userAnswersQuery);
            
            userAnswersSnapshot.forEach(doc => {
              const data = doc.data();
              userAnswers[data.questionId] = data.answer;
            });
          }
          
          // Process questions and add user answers if available
          querySnapshot.forEach(doc => {
            const questionData = doc.data() as Question;
            questionData.id = doc.id;
            
            // Add user answer if available
            if (userId && userAnswers[questionData.id]) {
              questionData.userAnswer = userAnswers[questionData.id];
            }
            
            questions.push(questionData);
          });
          
          // Get the section name
          let sectionName = sectionId;
          const allSections = await this.getAvailableSyllabusSections();
          
          // Look for the section in main sections and their children
          for (const section of allSections) {
            if (section.id === sectionId) {
              sectionName = section.name;
              break;
            }
            
            // Check children
            if (section.children) {
              const child = section.children.find(child => child.id === sectionId);
              if (child) {
                sectionName = child.name;
                break;
              }
            }
          }
          
          return {
            id: `py-section-${sectionId}`,
            title: `${sectionName} Questions`,
            description: `Questions from syllabus section ${sectionName}`,
            questions,
            metadata: {
              source: 'past-year',
              syllabusSectionId: sectionId,
            },
          };
        }
      } catch (dbError) {
        console.error('Error fetching from database, falling back to mock data:', dbError);
      }
      
      // Fall back to mock data if database fetch fails or returns empty
      console.log('Using mock data for section', sectionId);
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
      // Check if user progress document exists
      const userProgressRef = doc(db, 'userProgress', userId);
      const userProgressDoc = await getDoc(userProgressRef);
      
      if (userProgressDoc.exists()) {
        const userData = userProgressDoc.data() as UserProgressData;
        return userData.yearProgress || [];
      }
      
      // If no progress exists yet, initialize with available years but zero progress
      const years = await this.getAvailableYears();
      const yearProgress: YearProgress[] = years.map(year => ({
        year,
        total: 100, // Assuming 100 questions per year
        attempted: 0,
        correct: 0
      }));
      
      // Create initial user progress document
      await setDoc(userProgressRef, {
        userId,
        yearProgress,
        lastActiveDate: serverTimestamp(),
        currentStreak: 0,
        bestStreak: 0,
        syllabusProgress: {}
      });
      
      return yearProgress;
    } catch (error) {
      console.error('Error getting user year progress:', error);
      // Fall back to mock data if there's an error (e.g., when offline)
      const currentYear = new Date().getFullYear();
      return Array(10).fill(null).map((_, i) => ({
        year: currentYear - i,
        total: 100,
        attempted: 0,
        correct: 0
      }));
    }
  }

  /**
   * Updates the user's answer for a question
   * @param questionId The question ID
   * @param userId The user ID
   * @param answer The user's answer
   * @param questionData Additional question data for updating progress
   * @returns Promise resolving when the answer is updated
   */
  static async updateUserAnswer(
    questionId: string,
    userId: string,
    answer: string,
    questionData?: Question
  ): Promise<void> {
    try {
      if (!userId) {
        console.warn('No user ID provided for answer update');
        return;
      }
      
      // Reference to user progress document
      const userProgressRef = doc(db, 'userProgress', userId);
      
      // Reference to user answers collection
      const userAnswersRef = collection(db, 'userAnswers');
      
      // Check if the answer is correct
      const isCorrect = questionData ? questionData.correctOptionId === answer : false;
      
      // Add answer to user answers collection
      await addDoc(userAnswersRef, {
        userId,
        questionId,
        answer,
        isCorrect,
        timestamp: serverTimestamp(),
        questionMetadata: {
          year: questionData?.year,
          subject: questionData?.subject,
          topic: questionData?.topic,
          syllabusSection: questionData?.metadata?.syllabusSectionId
        }
      });
      
      // Get current user progress
      const userProgressDoc = await getDoc(userProgressRef);
      
      if (userProgressDoc.exists()) {
        const userData = userProgressDoc.data() as UserProgressData;
        
        // Update year progress if the question has a year
        if (questionData?.year) {
          const yearProgress = userData.yearProgress || [];
          const yearIndex = yearProgress.findIndex(yp => yp.year === questionData.year);
          
          if (yearIndex >= 0) {
            // Update existing year progress
            yearProgress[yearIndex].attempted += 1;
            if (isCorrect) {
              yearProgress[yearIndex].correct += 1;
            }
          } else {
            // Add new year progress
            yearProgress.push({
              year: questionData.year,
              total: 100, // Approximate total
              attempted: 1,
              correct: isCorrect ? 1 : 0
            });
          }
          
          // Update streak information
          const today = new Date();
          // Handle both Firebase Timestamp and JavaScript Date objects
          let lastActive: Date;
          if (userData.lastActiveDate) {
            // Check if lastActiveDate is a Firestore Timestamp
            const hasToDateMethod = !!(userData.lastActiveDate as any).toDate;
            if (hasToDateMethod) {
              lastActive = (userData.lastActiveDate as any).toDate();
            } else {
              lastActive = userData.lastActiveDate as Date;
            }
          } else {
            lastActive = new Date(0);
          }
          const isConsecutiveDay = 
            today.getDate() - lastActive.getDate() === 1 || 
            (today.getDate() === lastActive.getDate() && 
             today.getMonth() === lastActive.getMonth() && 
             today.getFullYear() === lastActive.getFullYear());
          
          let currentStreak = userData.currentStreak || 0;
          let bestStreak = userData.bestStreak || 0;
          
          if (isConsecutiveDay) {
            currentStreak += 1;
            bestStreak = Math.max(bestStreak, currentStreak);
          } else if (!isConsecutiveDay && 
                    today.getDate() !== lastActive.getDate()) {
            currentStreak = 1; // Reset streak but count today
          }
          
          // Update syllabus progress
          const syllabusProgress = userData.syllabusProgress || {};
          if (questionData?.metadata?.syllabusSectionId) {
            const sectionId = questionData.metadata.syllabusSectionId;
            if (!syllabusProgress[sectionId]) {
              syllabusProgress[sectionId] = { attempted: 0, correct: 0, total: 20 };
            }
            syllabusProgress[sectionId].attempted += 1;
            if (isCorrect) {
              syllabusProgress[sectionId].correct += 1;
            }
          }
          
          // Update user progress document
          await updateDoc(userProgressRef, {
            yearProgress,
            lastActiveDate: serverTimestamp(),
            currentStreak,
            bestStreak,
            syllabusProgress
          });
        }
      } else {
        // Initialize user progress if it doesn't exist
        const initialYearProgress: YearProgress[] = [];
        if (questionData?.year) {
          initialYearProgress.push({
            year: questionData.year,
            total: 100,
            attempted: 1,
            correct: isCorrect ? 1 : 0
          });
        }
        
        const syllabusProgress: Record<string, { attempted: number; correct: number; total: number }> = {};
        if (questionData?.metadata?.syllabusSectionId) {
          const sectionId = questionData.metadata.syllabusSectionId;
          syllabusProgress[sectionId] = { 
            attempted: 1, 
            correct: isCorrect ? 1 : 0, 
            total: 20 
          };
        }
        
        await setDoc(userProgressRef, {
          userId,
          yearProgress: initialYearProgress,
          lastActiveDate: serverTimestamp(),
          currentStreak: 1,
          bestStreak: 1,
          syllabusProgress
        });
      }
    } catch (error) {
      console.error('Error updating user answer:', error);
      // Don't throw the error to prevent app crashes during answer submission
      // but log it for debugging
    }
  }

  /**
   * Gets all available past years
   * @returns Promise resolving to an array of available years
   */
  static async getAvailableYears(): Promise<number[]> {
    try {
      // Try to get unique years from the database
      const questionsRef = collection(db, 'pastYearQuestions');
      
      try {
        const querySnapshot = await getDocs(questionsRef);
        
        if (!querySnapshot.empty) {
          const years = new Set<number>();
          
          querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.year && typeof data.year === 'number') {
              years.add(data.year);
            }
          });
          
          if (years.size > 0) {
            return Array.from(years).sort((a, b) => b - a); // Sort in descending order
          }
        }
      } catch (dbError) {
        console.error('Error fetching years from database, falling back to mock data:', dbError);
      }
      
      // Fall back to mock data if database fetch fails or returns empty
      const currentYear = new Date().getFullYear();
      const availableYears: number[] = [];

      // Generate years from current year back to 2010
      for (let i = 0; i < 10; i++) {
        availableYears.push(currentYear - i);
      }

      return availableYears;
    } catch (error) {
      console.error('Error getting available years:', error);
      // Return a safe default if there's an error
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 10 }, (_, i) => currentYear - i);
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
