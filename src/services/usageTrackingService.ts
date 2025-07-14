import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SubscriptionTier } from '@/lib/subscription-tiers';
import { 
  validateQuizAccess,
  validateCurrentAffairsAccess,
  validateWritingAccess,
  validateInterviewAccess
} from '@/lib/subscription-tiers';

// Types
export interface UsageTracking {
  userId: string;
  date: string; // Format: YYYY-MM-DD
  
  // Daily usage counters
  dailyQuizQuestions: number;
  currentAffairsAnalysis: number;
  writingAnswers: number;
  interviewSessions: number;
  
  // Total usage
  totalQuizQuestions: number;
  totalAnalysis: number;
  totalAnswers: number;
  totalInterviews: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UsageValidationResult {
  allowed: boolean;
  remaining: number;
  message?: string;
  requiresUpgrade?: boolean;
  recommendedTier?: SubscriptionTier;
}

export type ToolType = 'quiz' | 'currentAffairs' | 'writing' | 'interview';

// Usage Tracking Service
export class UsageTrackingService {
  
  // Get today's date string
  private static getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Get usage document ID
  private static getUsageDocId(userId: string, date?: string): string {
    const dateStr = date || this.getTodayString();
    return `${userId}_${dateStr}`;
  }

  // Get current usage for user
  static async getCurrentUsage(userId: string, date?: string): Promise<UsageTracking> {
    try {
      const docId = this.getUsageDocId(userId, date);
      const usageDoc = await getDoc(doc(db, 'userUsageTracking', docId));
      
      if (usageDoc.exists()) {
        return usageDoc.data() as UsageTracking;
      }
      
      // Create new usage document if it doesn't exist
      const newUsage: UsageTracking = {
        userId,
        date: date || this.getTodayString(),
        dailyQuizQuestions: 0,
        currentAffairsAnalysis: 0,
        writingAnswers: 0,
        interviewSessions: 0,
        totalQuizQuestions: 0,
        totalAnalysis: 0,
        totalAnswers: 0,
        totalInterviews: 0,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      await setDoc(doc(db, 'userUsageTracking', docId), newUsage);
      return newUsage;
      
    } catch (error) {
      console.error('Error getting current usage:', error);
      throw error;
    }
  }

  // Validate access to a tool
  static async validateToolAccess(
    userId: string, 
    userTier: SubscriptionTier, 
    toolType: ToolType
  ): Promise<UsageValidationResult> {
    try {
      const usage = await this.getCurrentUsage(userId);
      
      switch (toolType) {
        case 'quiz':
          return validateQuizAccess(userTier, usage.dailyQuizQuestions);
          
        case 'currentAffairs':
          return validateCurrentAffairsAccess(userTier, usage.currentAffairsAnalysis);
          
        case 'writing':
          return validateWritingAccess(userTier, usage.writingAnswers);
          
        case 'interview':
          return validateInterviewAccess(userTier, usage.interviewSessions);
          
        default:
          return { allowed: false, remaining: 0, message: 'Invalid tool type' };
      }
    } catch (error) {
      console.error('Error validating tool access:', error);
      return { allowed: false, remaining: 0, message: 'Error validating access' };
    }
  }

  // Record usage for a tool
  static async recordUsage(
    userId: string, 
    toolType: ToolType, 
    amount: number = 1
  ): Promise<void> {
    try {
      const docId = this.getUsageDocId(userId);
      const usageRef = doc(db, 'userUsageTracking', docId);
      
      // Get current usage to check if document exists
      const currentUsage = await this.getCurrentUsage(userId);
      
      const updateData: Record<string, any> = {
        updatedAt: serverTimestamp()
      };
      
      switch (toolType) {
        case 'quiz':
          updateData.dailyQuizQuestions = increment(amount);
          updateData.totalQuizQuestions = increment(amount);
          break;
          
        case 'currentAffairs':
          updateData.currentAffairsAnalysis = increment(amount);
          updateData.totalAnalysis = increment(amount);
          break;
          
        case 'writing':
          updateData.writingAnswers = increment(amount);
          updateData.totalAnswers = increment(amount);
          break;
          
        case 'interview':
          updateData.interviewSessions = increment(amount);
          updateData.totalInterviews = increment(amount);
          break;
      }
      
      await updateDoc(usageRef, updateData);
      
    } catch (error) {
      console.error('Error recording usage:', error);
      throw error;
    }
  }

  // Get usage summary for analytics
  static async getUsageSummary(userId: string, days: number = 7): Promise<{
    totalDays: number;
    averageQuizQuestions: number;
    averageAnalysis: number;
    averageAnswers: number;
    averageInterviews: number;
    dailyBreakdown: UsageTracking[];
  }> {
    try {
      const dailyBreakdown: UsageTracking[] = [];
      const today = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          const usage = await this.getCurrentUsage(userId, dateStr);
          dailyBreakdown.push(usage);
        } catch (error) {
          // If no data for this day, add empty usage
          dailyBreakdown.push({
            userId,
            date: dateStr,
            dailyQuizQuestions: 0,
            currentAffairsAnalysis: 0,
            writingAnswers: 0,
            interviewSessions: 0,
            totalQuizQuestions: 0,
            totalAnalysis: 0,
            totalAnswers: 0,
            totalInterviews: 0,
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp
          });
        }
      }
      
      // Calculate averages
      const totalQuiz = dailyBreakdown.reduce((sum, day) => sum + day.dailyQuizQuestions, 0);
      const totalAnalysis = dailyBreakdown.reduce((sum, day) => sum + day.currentAffairsAnalysis, 0);
      const totalAnswers = dailyBreakdown.reduce((sum, day) => sum + day.writingAnswers, 0);
      const totalInterviews = dailyBreakdown.reduce((sum, day) => sum + day.interviewSessions, 0);
      
      return {
        totalDays: days,
        averageQuizQuestions: Math.round(totalQuiz / days * 100) / 100,
        averageAnalysis: Math.round(totalAnalysis / days * 100) / 100,
        averageAnswers: Math.round(totalAnswers / days * 100) / 100,
        averageInterviews: Math.round(totalInterviews / days * 100) / 100,
        dailyBreakdown: dailyBreakdown.reverse() // Most recent first
      };
      
    } catch (error) {
      console.error('Error getting usage summary:', error);
      throw error;
    }
  }

  // Check if user is approaching limits
  static async checkUsageLimits(
    userId: string, 
    userTier: SubscriptionTier
  ): Promise<{
    warnings: string[];
    suggestions: string[];
    shouldPromptUpgrade: boolean;
  }> {
    try {
      const usage = await this.getCurrentUsage(userId);
      const warnings: string[] = [];
      const suggestions: string[] = [];
      let shouldPromptUpgrade = false;
      
      // Check quiz usage
      const quizValidation = validateQuizAccess(userTier, usage.dailyQuizQuestions);
      if (!quizValidation.allowed) {
        warnings.push('Daily quiz limit reached');
        shouldPromptUpgrade = true;
      } else if (quizValidation.remaining !== -1 && quizValidation.remaining <= 2) {
        warnings.push(`Only ${quizValidation.remaining} quiz questions remaining today`);
      }
      
      // Check current affairs usage
      const caValidation = validateCurrentAffairsAccess(userTier, usage.currentAffairsAnalysis);
      if (!caValidation.allowed) {
        warnings.push('Daily current affairs limit reached');
        shouldPromptUpgrade = true;
      } else if (caValidation.remaining !== -1 && caValidation.remaining <= 1) {
        warnings.push(`Only ${caValidation.remaining} current affairs analysis remaining today`);
      }
      
      // Check writing usage
      const writingValidation = validateWritingAccess(userTier, usage.writingAnswers);
      if (!writingValidation.allowed && userTier !== 'free') {
        warnings.push('Daily writing practice limit reached');
        shouldPromptUpgrade = true;
      } else if (writingValidation.remaining !== -1 && writingValidation.remaining <= 1) {
        warnings.push(`Only ${writingValidation.remaining} writing answers remaining today`);
      }
      
      // Check interview usage
      const interviewValidation = validateInterviewAccess(userTier, usage.interviewSessions);
      if (!interviewValidation.allowed && userTier !== 'free') {
        warnings.push('Daily interview practice limit reached');
        shouldPromptUpgrade = true;
      } else if (interviewValidation.remaining !== -1 && interviewValidation.remaining <= 1) {
        warnings.push(`Only ${interviewValidation.remaining} interview sessions remaining today`);
      }
      
      // Generate suggestions
      if (shouldPromptUpgrade) {
        suggestions.push('Upgrade your plan for unlimited access');
        suggestions.push('Consider yearly billing for maximum savings');
      }
      
      if (warnings.length === 0) {
        suggestions.push('Great progress today! Keep up the momentum');
      }
      
      return {
        warnings,
        suggestions,
        shouldPromptUpgrade
      };
      
    } catch (error) {
      console.error('Error checking usage limits:', error);
      return {
        warnings: ['Error checking usage limits'],
        suggestions: [],
        shouldPromptUpgrade: false
      };
    }
  }

  // Reset daily usage (called by cron job at midnight)
  static async resetDailyUsage(userId: string): Promise<void> {
    try {
      // This is handled automatically by creating new documents each day
      // No action needed as we use date-based document IDs
      console.log(`Daily usage auto-resets for user ${userId}`);
    } catch (error) {
      console.error('Error resetting daily usage:', error);
      throw error;
    }
  }

  // Get streak information
  static async getUsageStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
  }> {
    try {
      // This would require querying multiple days
      // For now, return mock data - implement with actual querying later
      const today = this.getTodayString();
      const usage = await this.getCurrentUsage(userId);
      
      const hasActivityToday = usage.dailyQuizQuestions > 0 || 
                              usage.currentAffairsAnalysis > 0 || 
                              usage.writingAnswers > 0 || 
                              usage.interviewSessions > 0;
      
      return {
        currentStreak: hasActivityToday ? 1 : 0, // Simplified for now
        longestStreak: 7, // Mock data
        lastActiveDate: hasActivityToday ? today : ''
      };
      
    } catch (error) {
      console.error('Error getting usage streak:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: ''
      };
    }
  }
}

// Middleware function for API routes
export async function validateUsageMiddleware(
  userId: string,
  userTier: SubscriptionTier,
  toolType: ToolType,
  amount: number = 1
): Promise<{
  success: boolean;
  message?: string;
  remaining?: number;
}> {
  try {
    // Validate access
    const validation = await UsageTrackingService.validateToolAccess(userId, userTier, toolType);
    
    if (!validation.allowed) {
      return {
        success: false,
        message: validation.message || 'Access denied',
        remaining: validation.remaining
      };
    }
    
    // Record usage
    await UsageTrackingService.recordUsage(userId, toolType, amount);
    
    return {
      success: true,
      remaining: validation.remaining === -1 ? -1 : Math.max(0, validation.remaining - amount)
    };
    
  } catch (error) {
    console.error('Error in usage middleware:', error);
    return {
      success: false,
      message: 'Error validating usage'
    };
  }
}

export default UsageTrackingService;