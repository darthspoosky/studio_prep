import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  writeBatch,
  arrayUnion
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types for Question Bank
export interface PrelimsQuestion {
  id: string;
  questionId: string;
  
  // Question Content
  question: string;
  questionType: 'MCQ' | 'MSQ' | 'Assertion-Reason' | 'Statement-Based';
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string[];
  explanation: string;
  
  // Classification
  year: number;
  paper: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'CSAT';
  questionNumber: number;
  
  // UPSC-Specific Tagging
  subject: string[];
  subtopics: string[];
  syllabusTopic: string[];
  difficultyLevel: 'Easy' | 'Medium' | 'Hard';
  conceptLevel: 'Basic' | 'Intermediate' | 'Advanced';
  
  // Analytics & Performance
  attemptCount: number;
  correctAttempts: number;
  averageTime: number;
  successRate: number;
  
  // Content Metadata
  source: string;
  verified: boolean;
  imageUrls: string[];
  references: string[];
  
  // AI Enhancement
  aiTags: string[];
  conceptGraph: string[];
  prerequisiteTopics: string[];
  
  // Management
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isActive: boolean;
  version: number;
}

export interface MainsQuestion {
  id: string;
  questionId: string;
  
  // Question Content
  question: string;
  questionType: 'Essay' | 'Analytical' | 'Case-Study' | 'Map-Based' | 'Diagram-Based';
  subParts: Array<{
    part: string;
    question: string;
    marks: number;
    expectedLength: number;
  }>;
  
  // Classification
  year: number;
  paper: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay';
  questionNumber: number;
  totalMarks: number;
  timeAllocation: number;
  
  // Content Analysis
  subject: string[];
  subtopics: string[];
  syllabusTopic: string[];
  difficultyLevel: 'Easy' | 'Medium' | 'Hard';
  conceptLevel: 'Basic' | 'Intermediate' | 'Advanced';
  
  // Answer Framework
  expectedApproach: string[];
  keyPoints: string[];
  commonMistakes: string[];
  gradingCriteria: Array<{
    criterion: string;
    weightage: number;
    description: string;
  }>;
  
  // Sample Answers
  modelAnswers: Array<{
    id: string;
    content: string;
    score: number;
    feedback: string;
    answerType: 'Excellent' | 'Good' | 'Average' | 'Poor';
  }>;
  
  // Current Affairs Linkage
  currentAffairsTopics: string[];
  recentDevelopments: Array<{
    topic: string;
    date: string;
    relevance: string;
  }>;
  
  // Analytics
  attemptCount: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  
  // AI Enhancement
  aiTags: string[];
  relatedQuestions: string[];
  practiceLevel: 'Foundation' | 'Intermediate' | 'Advanced';
  
  // Management
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isActive: boolean;
  version: number;
}

export interface QuestionSet {
  id: string;
  name: string;
  description: string;
  type: 'Full Paper' | 'Topic Wise' | 'Mock Test' | 'Custom Set';
  examType: 'Prelims' | 'Mains';
  
  questions: Array<{
    questionId: string;
    order: number;
    marks?: number;
  }>;
  
  metadata: {
    totalQuestions: number;
    totalMarks?: number;
    timeLimit: number;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
    subjects: string[];
  };
  
  settings: {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showExplanations: boolean;
    allowReview: boolean;
  };
  
  analytics: {
    attemptCount: number;
    averageScore: number;
    completionRate: number;
  };
  
  createdAt: Timestamp;
  createdBy: string;
  isPublic: boolean;
  isActive: boolean;
}

export interface UploadBatch {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
  
  status: 'Processing' | 'Completed' | 'Failed' | 'Partial';
  examType: 'Prelims' | 'Mains';
  year: number;
  paper?: string;
  
  stats: {
    totalRecords: number;
    processedRecords: number;
    successfulRecords: number;
    failedRecords: number;
  };
  
  errors: Array<{
    row: number;
    field: string;
    error: string;
    value: string;
  }>;
  
  validation: {
    duplicateQuestions: string[];
    missingFields: Array<{
      row: number;
      fields: string[];
    }>;
    formatErrors: Array<{
      row: number;
      field: string;
      expected: string;
      received: string;
    }>;
  };
  
  processingLog: Array<{
    timestamp: Timestamp;
    action: string;
    details: string;
  }>;
}

// Search and Filter Options
export interface QuestionSearchOptions {
  examType: 'Prelims' | 'Mains';
  years?: number[];
  papers?: string[];
  subjects?: string[];
  subtopics?: string[];
  difficultyLevel?: ('Easy' | 'Medium' | 'Hard')[];
  questionType?: string[];
  verified?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'year' | 'difficulty' | 'successRate' | 'attemptCount';
  sortOrder?: 'asc' | 'desc';
}

export class QuestionBankService {
  // === PRELIMS QUESTIONS ===
  
  static async createPrelimsQuestion(questionData: Omit<PrelimsQuestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const questionRef = doc(collection(db, 'prelims_questions'));
      const now = serverTimestamp();
      
      const question: PrelimsQuestion = {
        ...questionData,
        id: questionRef.id,
        createdAt: now as Timestamp,
        updatedAt: now as Timestamp,
        version: 1
      };
      
      await setDoc(questionRef, question);
      return questionRef.id;
    } catch (error) {
      console.error('Error creating prelims question:', error);
      throw error;
    }
  }
  
  static async getPrelimsQuestion(questionId: string): Promise<PrelimsQuestion | null> {
    try {
      const questionDoc = await getDoc(doc(db, 'prelims_questions', questionId));
      if (questionDoc.exists()) {
        return questionDoc.data() as PrelimsQuestion;
      }
      return null;
    } catch (error) {
      console.error('Error getting prelims question:', error);
      throw error;
    }
  }
  
  static async searchPrelimsQuestions(searchOptions: QuestionSearchOptions): Promise<PrelimsQuestion[]> {
    try {
      let q = query(collection(db, 'prelims_questions'));
      
      // Apply filters
      if (searchOptions.years && searchOptions.years.length > 0) {
        q = query(q, where('year', 'in', searchOptions.years));
      }
      
      if (searchOptions.papers && searchOptions.papers.length > 0) {
        q = query(q, where('paper', 'in', searchOptions.papers));
      }
      
      if (searchOptions.subjects && searchOptions.subjects.length > 0) {
        q = query(q, where('subject', 'array-contains-any', searchOptions.subjects));
      }
      
      if (searchOptions.difficultyLevel && searchOptions.difficultyLevel.length > 0) {
        q = query(q, where('difficultyLevel', 'in', searchOptions.difficultyLevel));
      }
      
      if (searchOptions.verified !== undefined) {
        q = query(q, where('verified', '==', searchOptions.verified));
      }
      
      q = query(q, where('isActive', '==', true));
      
      // Apply sorting
      if (searchOptions.sortBy) {
        const sortOrder = searchOptions.sortOrder === 'desc' ? 'desc' : 'asc';
        q = query(q, orderBy(searchOptions.sortBy, sortOrder));
      }
      
      // Apply limit
      if (searchOptions.limit) {
        q = query(q, limit(searchOptions.limit));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as PrelimsQuestion);
    } catch (error) {
      console.error('Error searching prelims questions:', error);
      throw error;
    }
  }
  
  // === MAINS QUESTIONS ===
  
  static async createMainsQuestion(questionData: Omit<MainsQuestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const questionRef = doc(collection(db, 'mains_questions'));
      const now = serverTimestamp();
      
      const question: MainsQuestion = {
        ...questionData,
        id: questionRef.id,
        createdAt: now as Timestamp,
        updatedAt: now as Timestamp,
        version: 1
      };
      
      await setDoc(questionRef, question);
      return questionRef.id;
    } catch (error) {
      console.error('Error creating mains question:', error);
      throw error;
    }
  }
  
  static async getMainsQuestion(questionId: string): Promise<MainsQuestion | null> {
    try {
      const questionDoc = await getDoc(doc(db, 'mains_questions', questionId));
      if (questionDoc.exists()) {
        return questionDoc.data() as MainsQuestion;
      }
      return null;
    } catch (error) {
      console.error('Error getting mains question:', error);
      throw error;
    }
  }
  
  static async searchMainsQuestions(searchOptions: QuestionSearchOptions): Promise<MainsQuestion[]> {
    try {
      let q = query(collection(db, 'mains_questions'));
      
      // Apply filters similar to prelims
      if (searchOptions.years && searchOptions.years.length > 0) {
        q = query(q, where('year', 'in', searchOptions.years));
      }
      
      if (searchOptions.papers && searchOptions.papers.length > 0) {
        q = query(q, where('paper', 'in', searchOptions.papers));
      }
      
      if (searchOptions.subjects && searchOptions.subjects.length > 0) {
        q = query(q, where('subject', 'array-contains-any', searchOptions.subjects));
      }
      
      if (searchOptions.difficultyLevel && searchOptions.difficultyLevel.length > 0) {
        q = query(q, where('difficultyLevel', 'in', searchOptions.difficultyLevel));
      }
      
      q = query(q, where('isActive', '==', true));
      
      if (searchOptions.sortBy) {
        const sortOrder = searchOptions.sortOrder === 'desc' ? 'desc' : 'asc';
        q = query(q, orderBy(searchOptions.sortBy, sortOrder));
      }
      
      if (searchOptions.limit) {
        q = query(q, limit(searchOptions.limit));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as MainsQuestion);
    } catch (error) {
      console.error('Error searching mains questions:', error);
      throw error;
    }
  }
  
  // === BULK OPERATIONS ===
  
  static async bulkImportPrelimsQuestions(
    questions: Omit<PrelimsQuestion, 'id' | 'createdAt' | 'updatedAt'>[],
    userId: string
  ): Promise<{ successful: string[]; failed: Array<{ index: number; error: string }> }> {
    const successful: string[] = [];
    const failed: Array<{ index: number; error: string }> = [];
    
    // Process in batches of 500 (Firestore limit)
    const batchSize = 500;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchQuestions = questions.slice(i, i + batchSize);
      
      try {
        for (let j = 0; j < batchQuestions.length; j++) {
          const questionData = batchQuestions[j];
          const questionRef = doc(collection(db, 'prelims_questions'));
          const now = serverTimestamp();
          
          const question: PrelimsQuestion = {
            ...questionData,
            id: questionRef.id,
            createdAt: now as Timestamp,
            updatedAt: now as Timestamp,
            createdBy: userId,
            version: 1
          };
          
          batch.set(questionRef, question);
          successful.push(questionRef.id);
        }
        
        await batch.commit();
      } catch (error) {
        // Mark entire batch as failed
        for (let j = 0; j < batchQuestions.length; j++) {
          failed.push({
            index: i + j,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    
    return { successful, failed };
  }
  
  static async bulkImportMainsQuestions(
    questions: Omit<MainsQuestion, 'id' | 'createdAt' | 'updatedAt'>[],
    userId: string
  ): Promise<{ successful: string[]; failed: Array<{ index: number; error: string }> }> {
    const successful: string[] = [];
    const failed: Array<{ index: number; error: string }> = [];
    
    const batchSize = 500;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchQuestions = questions.slice(i, i + batchSize);
      
      try {
        for (let j = 0; j < batchQuestions.length; j++) {
          const questionData = batchQuestions[j];
          const questionRef = doc(collection(db, 'mains_questions'));
          const now = serverTimestamp();
          
          const question: MainsQuestion = {
            ...questionData,
            id: questionRef.id,
            createdAt: now as Timestamp,
            updatedAt: now as Timestamp,
            createdBy: userId,
            version: 1
          };
          
          batch.set(questionRef, question);
          successful.push(questionRef.id);
        }
        
        await batch.commit();
      } catch (error) {
        for (let j = 0; j < batchQuestions.length; j++) {
          failed.push({
            index: i + j,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    
    return { successful, failed };
  }
  
  // === QUESTION SETS ===
  
  static async createQuestionSet(setData: Omit<QuestionSet, 'id' | 'createdAt'>): Promise<string> {
    try {
      const setRef = doc(collection(db, 'question_sets'));
      const now = serverTimestamp();
      
      const questionSet: QuestionSet = {
        ...setData,
        id: setRef.id,
        createdAt: now as Timestamp
      };
      
      await setDoc(setRef, questionSet);
      return setRef.id;
    } catch (error) {
      console.error('Error creating question set:', error);
      throw error;
    }
  }
  
  static async getQuestionSet(setId: string): Promise<QuestionSet | null> {
    try {
      const setDoc = await getDoc(doc(db, 'question_sets', setId));
      if (setDoc.exists()) {
        return setDoc.data() as QuestionSet;
      }
      return null;
    } catch (error) {
      console.error('Error getting question set:', error);
      throw error;
    }
  }
  
  // === ANALYTICS ===
  
  static async updateQuestionAttempt(
    questionId: string,
    examType: 'Prelims' | 'Mains',
    isCorrect: boolean,
    timeSpent: number
  ): Promise<void> {
    try {
      const collection = examType === 'Prelims' ? 'prelims_questions' : 'mains_questions';
      const questionRef = doc(db, collection, questionId);
      const questionDoc = await getDoc(questionRef);
      
      if (questionDoc.exists()) {
        const question = questionDoc.data();
        const newAttemptCount = (question.attemptCount || 0) + 1;
        const newCorrectAttempts = (question.correctAttempts || 0) + (isCorrect ? 1 : 0);
        const newAverageTime = ((question.averageTime || 0) * (newAttemptCount - 1) + timeSpent) / newAttemptCount;
        const newSuccessRate = (newCorrectAttempts / newAttemptCount) * 100;
        
        await updateDoc(questionRef, {
          attemptCount: newAttemptCount,
          correctAttempts: newCorrectAttempts,
          averageTime: newAverageTime,
          successRate: newSuccessRate,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating question attempt:', error);
      throw error;
    }
  }
  
  // === UTILITY METHODS ===
  
  static async getQuestionsByYear(examType: 'Prelims' | 'Mains', year: number): Promise<(PrelimsQuestion | MainsQuestion)[]> {
    try {
      const collection = examType === 'Prelims' ? 'prelims_questions' : 'mains_questions';
      const q = query(
        collection(db, collection),
        where('year', '==', year),
        where('isActive', '==', true),
        orderBy('paper'),
        orderBy('questionNumber')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as PrelimsQuestion | MainsQuestion);
    } catch (error) {
      console.error('Error getting questions by year:', error);
      throw error;
    }
  }
  
  static async getQuestionsBySubject(examType: 'Prelims' | 'Mains', subject: string): Promise<(PrelimsQuestion | MainsQuestion)[]> {
    try {
      const collection = examType === 'Prelims' ? 'prelims_questions' : 'mains_questions';
      const q = query(
        collection(db, collection),
        where('subject', 'array-contains', subject),
        where('isActive', '==', true),
        orderBy('year', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as PrelimsQuestion | MainsQuestion);
    } catch (error) {
      console.error('Error getting questions by subject:', error);
      throw error;
    }
  }
}

export default QuestionBankService;