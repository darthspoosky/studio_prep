'use client';

import { generateDailyQuiz, type MCQ } from '@/ai/flows/daily-quiz-flow';
import { db } from '@/lib/firebase';
import { Firestore } from 'firebase/firestore';
import { collection, addDoc, query, where, getDocs, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { saveQuizAttempt } from './quizAttemptsService';

export interface QuizSession {
  id?: string;
  userId: string;
  subject: string;
  difficulty: string;
  questions: MCQ[];
  createdAt: Date;
  completed: boolean;
  score?: number;
  totalQuestions: number;
}

export async function createQuizSession(
  userId: string, 
  subject: string, 
  difficulty: string,
  numQuestions: number
): Promise<QuizSession> {
  try {
    // Generate quiz questions using the AI flow
    const quizResult = await generateDailyQuiz({
      subject,
      numQuestions,
      // Cast the difficulty to the enum type expected by generateDailyQuiz
      difficulty: difficulty as 'easy' | 'medium' | 'hard' | 'adaptive',
      examType: 'UPSC Civil Services',
      outputLanguage: 'English'
    });
    
    // Create a new quiz session in Firestore
    const sessionData: QuizSession = {
      userId,
      subject,
      difficulty,
      questions: quizResult.mcqs,
      createdAt: new Date(),
      completed: false,
      totalQuestions: quizResult.mcqs.length
    };
    
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    // Explicitly cast db to Firestore type
    const firestore = db as Firestore;
    const sessionRef = await addDoc(collection(firestore, 'quizSessions'), sessionData);
    
    return {
      ...sessionData,
      id: sessionRef.id
    };
  } catch (error) {
    console.error('Error creating quiz session:', error);
    throw new Error('Failed to create quiz session');
  }
}

export async function getQuizSession(sessionId: string): Promise<QuizSession | null> {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    // Explicitly cast db to Firestore type
    const firestore = db as Firestore;
    const sessionDoc = await getDoc(doc(firestore, 'quizSessions', sessionId));
    
    if (sessionDoc.exists()) {
      const data = sessionDoc.data() as QuizSession;
      return {
        ...data,
        id: sessionDoc.id,
        createdAt: data.createdAt instanceof Timestamp ? 
          data.createdAt.toDate() : 
          data.createdAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching quiz session:', error);
    return null;
  }
}

export async function submitQuizAnswer(
  userId: string,
  sessionId: string,
  questionIndex: number,
  selectedOption: string
): Promise<{isCorrect: boolean}> {
  try {
    const session = await getQuizSession(sessionId);
    
    if (!session) {
      throw new Error('Quiz session not found');
    }
    
    const question = session.questions[questionIndex];
    if (!question) {
      throw new Error('Question not found');
    }
    
    const correctOption = question.options.find(opt => opt.correct);
    if (!correctOption) {
      throw new Error('No correct option found for question');
    }
    
    const isCorrect = correctOption.text === selectedOption;
    
    // Save the quiz attempt to the quizAttempts collection
    await saveQuizAttempt(
      userId,
      sessionId,
      question.question,
      selectedOption,
      isCorrect,
      question.subject,
      question.difficulty
    );
    
    return { isCorrect };
  } catch (error) {
    console.error('Error submitting quiz answer:', error);
    throw new Error('Failed to submit answer');
  }
}

export async function completeQuizSession(
  sessionId: string,
  score: number
): Promise<void> {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    // Explicitly cast db to Firestore type
    const firestore = db as Firestore;
    const sessionRef = doc(firestore, 'quizSessions', sessionId);
    await setDoc(sessionRef, {
      completed: true,
      score
    }, { merge: true });
  } catch (error) {
    console.error('Error completing quiz session:', error);
    throw new Error('Failed to complete quiz session');
  }
}

export async function getUserQuizHistory(userId: string): Promise<QuizSession[]> {
  try {
    const q = query(
      collection(db as Firestore, 'quizSessions'),
      where('userId', '==', userId),
      where('completed', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const sessions: QuizSession[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data() as QuizSession;
      sessions.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? 
          data.createdAt.toDate() : 
          data.createdAt
      });
    });
    
    // Sort by most recent first
    return sessions.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  } catch (error) {
    console.error('Error fetching user quiz history:', error);
    return [];
  }
}

export interface QuizStreak {
  currentStreak: number;
  longestStreak: number;
  lastQuizDate: Date | null;
}

export async function getUserQuizStreak(userId: string): Promise<QuizStreak> {
  try {
    const sessions = await getUserQuizHistory(userId);
    
    if (sessions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastQuizDate: null
      };
    }
    
    // Sort by date, oldest first
    const sortedSessions = [...sessions].sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
    
    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate: Date | null = null;
    
    // Group sessions by day
    const sessionsByDay = sortedSessions.reduce((acc, session) => {
      const dateKey = session.createdAt.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(session);
      return acc;
    }, {} as Record<string, QuizSession[]>);
    
    // Convert to array of dates
    const dates = Object.keys(sessionsByDay)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());
    
    // Calculate streaks
    currentStreak = 1; // Start with 1 for the first day
    let tempStreak = 1;
    
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i-1]);
      const currDate = new Date(dates[i]);
      
      // Check if dates are consecutive
      prevDate.setDate(prevDate.getDate() + 1);
      if (prevDate.toISOString().split('T')[0] === currDate.toISOString().split('T')[0]) {
        tempStreak++;
      } else {
        // Streak broken
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 1;
      }
    }
    
    // Update longest streak if the final tempStreak is the longest
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    
    currentStreak = tempStreak;
    lastDate = dates[dates.length - 1];
    
    // Check if current streak is still active (quiz taken today or yesterday)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastQuizDate = lastDate ? new Date(lastDate) : null;
    const lastQuizDateStr = lastQuizDate?.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastQuizDateStr !== todayStr && lastQuizDateStr !== yesterdayStr) {
      currentStreak = 0;
    }
    
    return {
      currentStreak,
      longestStreak,
      lastQuizDate
    };
  } catch (error) {
    console.error('Error calculating quiz streak:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastQuizDate: null
    };
  }
}
