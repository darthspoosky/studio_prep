// Stage-based subscription tiers for UPSC preparation

export type SubscriptionTier = 'free' | 'foundation' | 'practice' | 'mains' | 'interview' | 'elite';

export type UserStage = 'assessment' | 'prelims' | 'mains' | 'interview';

export interface SubscriptionFeatures {
  // Quiz System
  dailyQuizQuestions: number;
  previousYearQuestions: boolean;
  subjectWisePractice: boolean;
  mockTests: boolean;
  adaptiveLearning: boolean;
  unlimitedQuizzes: boolean;
  
  // Current Affairs
  dailyCurrentAffairs: number;
  multiLanguageSupport: boolean;
  audioSummaries: boolean;
  advancedAnalysis: boolean;
  
  // Writing Practice
  writingPracticeAccess: boolean;
  dailyAnswerLimit: number;
  aiEvaluation: boolean;
  expertFeedback: boolean;
  peerReview: boolean;
  
  // Interview Preparation
  interviewAccess: boolean;
  dailyInterviewSessions: number;
  fullBoardSimulation: boolean;
  videoAnalysis: boolean;
  humanCoaching: boolean;
  
  // General Features
  progressTracking: boolean;
  performanceAnalytics: boolean;
  studyPlanGeneration: boolean;
  prioritySupport: boolean;
  offlineAccess: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  targetStage: UserStage[];
  features: SubscriptionFeatures;
  limitations: string[];
  benefits: string[];
  cta: string;
  popular?: boolean;
  recommended?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free Starter',
    description: 'Perfect for exploring UPSC preparation',
    price: {
      monthly: 0,
      yearly: 0,
      currency: 'INR'
    },
    targetStage: ['assessment', 'prelims'],
    features: {
      dailyQuizQuestions: 5,
      previousYearQuestions: false,
      subjectWisePractice: false,
      mockTests: false,
      adaptiveLearning: false,
      unlimitedQuizzes: false,
      
      dailyCurrentAffairs: 2,
      multiLanguageSupport: false,
      audioSummaries: false,
      advancedAnalysis: false,
      
      writingPracticeAccess: false,
      dailyAnswerLimit: 0,
      aiEvaluation: false,
      expertFeedback: false,
      peerReview: false,
      
      interviewAccess: false,
      dailyInterviewSessions: 0,
      fullBoardSimulation: false,
      videoAnalysis: false,
      humanCoaching: false,
      
      progressTracking: true,
      performanceAnalytics: false,
      studyPlanGeneration: false,
      prioritySupport: false,
      offlineAccess: false
    },
    limitations: [
      '5 questions per day',
      'Basic current affairs only',
      'No writing practice',
      'No interview preparation',
      'Limited analytics'
    ],
    benefits: [
      'Daily practice questions',
      'Basic progress tracking',
      'Foundation concepts',
      'Community access'
    ],
    cta: 'Start Free'
  },

  foundation: {
    id: 'foundation',
    name: 'Foundation Builder',
    description: 'Build strong fundamentals for UPSC preparation',
    price: {
      monthly: 99,
      yearly: 999,
      currency: 'INR'
    },
    targetStage: ['prelims'],
    features: {
      dailyQuizQuestions: 25,
      previousYearQuestions: true,
      subjectWisePractice: true,
      mockTests: false,
      adaptiveLearning: false,
      unlimitedQuizzes: false,
      
      dailyCurrentAffairs: 5,
      multiLanguageSupport: true,
      audioSummaries: true,
      advancedAnalysis: false,
      
      writingPracticeAccess: false,
      dailyAnswerLimit: 0,
      aiEvaluation: false,
      expertFeedback: false,
      peerReview: false,
      
      interviewAccess: false,
      dailyInterviewSessions: 0,
      fullBoardSimulation: false,
      videoAnalysis: false,
      humanCoaching: false,
      
      progressTracking: true,
      performanceAnalytics: true,
      studyPlanGeneration: true,
      prioritySupport: false,
      offlineAccess: false
    },
    limitations: [
      'Prelims focused only',
      'No mock tests',
      'No writing practice',
      'Basic analytics'
    ],
    benefits: [
      '25 daily questions',
      'Previous year papers',
      'Subject-wise practice',
      'Multi-language support',
      'Audio summaries',
      'Detailed analytics'
    ],
    cta: 'Build Foundation',
    popular: true
  },

  practice: {
    id: 'practice',
    name: 'Practice Pro',
    description: 'Comprehensive preparation for serious aspirants',
    price: {
      monthly: 199,
      yearly: 1999,
      currency: 'INR'
    },
    targetStage: ['prelims'],
    features: {
      dailyQuizQuestions: -1, // Unlimited
      previousYearQuestions: true,
      subjectWisePractice: true,
      mockTests: true,
      adaptiveLearning: true,
      unlimitedQuizzes: true,
      
      dailyCurrentAffairs: 10,
      multiLanguageSupport: true,
      audioSummaries: true,
      advancedAnalysis: true,
      
      writingPracticeAccess: false,
      dailyAnswerLimit: 0,
      aiEvaluation: false,
      expertFeedback: false,
      peerReview: false,
      
      interviewAccess: false,
      dailyInterviewSessions: 0,
      fullBoardSimulation: false,
      videoAnalysis: false,
      humanCoaching: false,
      
      progressTracking: true,
      performanceAnalytics: true,
      studyPlanGeneration: true,
      prioritySupport: true,
      offlineAccess: true
    },
    limitations: [
      'Prelims focused',
      'No writing practice',
      'No interview preparation'
    ],
    benefits: [
      'Unlimited questions',
      'Full mock tests',
      'Adaptive learning',
      'Advanced current affairs',
      'Comprehensive analytics',
      'Priority support',
      'Offline access'
    ],
    cta: 'Go Pro'
  },

  mains: {
    id: 'mains',
    name: 'Mains Mastery',
    description: 'Complete preparation for Mains qualified candidates',
    price: {
      monthly: 499,
      yearly: 4999,
      currency: 'INR'
    },
    targetStage: ['mains'],
    features: {
      dailyQuizQuestions: -1,
      previousYearQuestions: true,
      subjectWisePractice: true,
      mockTests: true,
      adaptiveLearning: true,
      unlimitedQuizzes: true,
      
      dailyCurrentAffairs: -1,
      multiLanguageSupport: true,
      audioSummaries: true,
      advancedAnalysis: true,
      
      writingPracticeAccess: true,
      dailyAnswerLimit: 10,
      aiEvaluation: true,
      expertFeedback: false,
      peerReview: true,
      
      interviewAccess: false,
      dailyInterviewSessions: 0,
      fullBoardSimulation: false,
      videoAnalysis: false,
      humanCoaching: false,
      
      progressTracking: true,
      performanceAnalytics: true,
      studyPlanGeneration: true,
      prioritySupport: true,
      offlineAccess: true
    },
    limitations: [
      'No expert feedback for writing',
      'No interview preparation'
    ],
    benefits: [
      'All Prelims features',
      'Answer writing practice',
      'AI-powered evaluation',
      'Peer review system',
      'Mains-specific current affairs',
      'Advanced study plans'
    ],
    cta: 'Master Mains',
    recommended: true
  },

  interview: {
    id: 'interview',
    name: 'Interview Ready',
    description: 'Exclusive preparation for interview qualified candidates',
    price: {
      monthly: 999,
      yearly: 9999,
      currency: 'INR'
    },
    targetStage: ['interview'],
    features: {
      dailyQuizQuestions: -1,
      previousYearQuestions: true,
      subjectWisePractice: true,
      mockTests: true,
      adaptiveLearning: true,
      unlimitedQuizzes: true,
      
      dailyCurrentAffairs: -1,
      multiLanguageSupport: true,
      audioSummaries: true,
      advancedAnalysis: true,
      
      writingPracticeAccess: true,
      dailyAnswerLimit: -1,
      aiEvaluation: true,
      expertFeedback: true,
      peerReview: true,
      
      interviewAccess: true,
      dailyInterviewSessions: 5,
      fullBoardSimulation: false,
      videoAnalysis: false,
      humanCoaching: false,
      
      progressTracking: true,
      performanceAnalytics: true,
      studyPlanGeneration: true,
      prioritySupport: true,
      offlineAccess: true
    },
    limitations: [
      'Basic interview simulation only',
      'No video analysis',
      'No human coaching'
    ],
    benefits: [
      'All previous features',
      'Mock interview practice',
      'Expert writing feedback',
      'Unlimited writing practice',
      'Interview-focused current affairs',
      'Personality development'
    ],
    cta: 'Ace Interview'
  },

  elite: {
    id: 'elite',
    name: 'Elite Success',
    description: 'Premium coaching for top rank aspirants',
    price: {
      monthly: 1999,
      yearly: 19999,
      currency: 'INR'
    },
    targetStage: ['interview'],
    features: {
      dailyQuizQuestions: -1,
      previousYearQuestions: true,
      subjectWisePractice: true,
      mockTests: true,
      adaptiveLearning: true,
      unlimitedQuizzes: true,
      
      dailyCurrentAffairs: -1,
      multiLanguageSupport: true,
      audioSummaries: true,
      advancedAnalysis: true,
      
      writingPracticeAccess: true,
      dailyAnswerLimit: -1,
      aiEvaluation: true,
      expertFeedback: true,
      peerReview: true,
      
      interviewAccess: true,
      dailyInterviewSessions: -1,
      fullBoardSimulation: true,
      videoAnalysis: true,
      humanCoaching: true,
      
      progressTracking: true,
      performanceAnalytics: true,
      studyPlanGeneration: true,
      prioritySupport: true,
      offlineAccess: true
    },
    limitations: [],
    benefits: [
      'All features included',
      'Full board simulation',
      'Video analysis & feedback',
      'Human expert coaching',
      'Unlimited everything',
      'Success mentoring',
      'Topper strategies',
      '24/7 priority support'
    ],
    cta: 'Join Elite'
  }
};

// Helper functions for subscription management
export function getSubscriptionPlan(tier: SubscriptionTier): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[tier];
}

export function isFeatureAvailable(
  userTier: SubscriptionTier, 
  feature: keyof SubscriptionFeatures
): boolean {
  const plan = getSubscriptionPlan(userTier);
  return plan.features[feature] as boolean;
}

export function getFeatureLimit(
  userTier: SubscriptionTier, 
  feature: keyof SubscriptionFeatures
): number {
  const plan = getSubscriptionPlan(userTier);
  const value = plan.features[feature];
  return typeof value === 'number' ? value : 0;
}

export function canUpgradeTo(
  currentTier: SubscriptionTier, 
  targetTier: SubscriptionTier
): boolean {
  const tierOrder: SubscriptionTier[] = ['free', 'foundation', 'practice', 'mains', 'interview', 'elite'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const targetIndex = tierOrder.indexOf(targetTier);
  return targetIndex > currentIndex;
}

export function getRecommendedTier(userStage: UserStage): SubscriptionTier {
  switch (userStage) {
    case 'assessment':
    case 'prelims':
      return 'foundation';
    case 'mains':
      return 'mains';
    case 'interview':
      return 'interview';
    default:
      return 'free';
  }
}

export function getTierProgress(tier: SubscriptionTier): number {
  const tierOrder: SubscriptionTier[] = ['free', 'foundation', 'practice', 'mains', 'interview', 'elite'];
  const index = tierOrder.indexOf(tier);
  return ((index + 1) / tierOrder.length) * 100;
}

// Usage validation functions
export function validateQuizAccess(
  userTier: SubscriptionTier,
  questionsUsedToday: number
): { allowed: boolean; remaining: number; message?: string } {
  const dailyLimit = getFeatureLimit(userTier, 'dailyQuizQuestions');
  
  if (dailyLimit === -1) {
    return { allowed: true, remaining: -1 };
  }
  
  const remaining = Math.max(0, dailyLimit - questionsUsedToday);
  const allowed = remaining > 0;
  
  return {
    allowed,
    remaining,
    message: allowed ? undefined : `Daily limit of ${dailyLimit} questions reached. Upgrade for unlimited access.`
  };
}

export function validateCurrentAffairsAccess(
  userTier: SubscriptionTier,
  analysisUsedToday: number
): { allowed: boolean; remaining: number; message?: string } {
  const dailyLimit = getFeatureLimit(userTier, 'dailyCurrentAffairs');
  
  if (dailyLimit === -1) {
    return { allowed: true, remaining: -1 };
  }
  
  const remaining = Math.max(0, dailyLimit - analysisUsedToday);
  const allowed = remaining > 0;
  
  return {
    allowed,
    remaining,
    message: allowed ? undefined : `Daily limit of ${dailyLimit} analysis reached. Upgrade for unlimited access.`
  };
}

export function validateWritingAccess(
  userTier: SubscriptionTier,
  answersWrittenToday: number
): { allowed: boolean; remaining: number; message?: string } {
  if (!isFeatureAvailable(userTier, 'writingPracticeAccess')) {
    return {
      allowed: false,
      remaining: 0,
      message: 'Writing practice is available for Mains qualified candidates. Upgrade to access.'
    };
  }
  
  const dailyLimit = getFeatureLimit(userTier, 'dailyAnswerLimit');
  
  if (dailyLimit === -1) {
    return { allowed: true, remaining: -1 };
  }
  
  const remaining = Math.max(0, dailyLimit - answersWrittenToday);
  const allowed = remaining > 0;
  
  return {
    allowed,
    remaining,
    message: allowed ? undefined : `Daily limit of ${dailyLimit} answers reached. Upgrade for unlimited practice.`
  };
}

export function validateInterviewAccess(
  userTier: SubscriptionTier,
  sessionsToday: number
): { allowed: boolean; remaining: number; message?: string } {
  if (!isFeatureAvailable(userTier, 'interviewAccess')) {
    return {
      allowed: false,
      remaining: 0,
      message: 'Interview preparation is available for interview qualified candidates only.'
    };
  }
  
  const dailyLimit = getFeatureLimit(userTier, 'dailyInterviewSessions');
  
  if (dailyLimit === -1) {
    return { allowed: true, remaining: -1 };
  }
  
  const remaining = Math.max(0, dailyLimit - sessionsToday);
  const allowed = remaining > 0;
  
  return {
    allowed,
    remaining,
    message: allowed ? undefined : `Daily limit of ${dailyLimit} sessions reached. Upgrade for unlimited interviews.`
  };
}