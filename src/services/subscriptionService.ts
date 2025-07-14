import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SubscriptionTier, UserStage } from '@/lib/subscription-tiers';
import { isDevMode, getDevTier, hasDevFeature } from '@/lib/dev-mode';

// Types
export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  
  // Payment details
  paymentProvider: 'razorpay' | 'stripe' | 'none';
  subscriptionId: string;
  customerId: string;
  
  // Billing
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Trial information
  trialStart?: Timestamp;
  trialEnd?: Timestamp;
  isTrialUsed: boolean;
}

export interface UserProfile {
  currentTier: SubscriptionTier;
  subscriptionStatus: 'active' | 'cancelled' | 'expired' | 'past_due' | 'none';
  currentStage: UserStage;
  stageUpdatedAt: Timestamp;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: Timestamp;
  subscriptionHistory: {
    tier: string;
    startDate: Timestamp;
    endDate?: Timestamp;
    reason?: string;
  }[];
}

export interface OnboardingData {
  userId: string;
  completed: boolean;
  currentStep: string;
  assessmentAnswers: Record<string, string>;
  determinedStage: UserStage;
  goals: Record<string, string>;
  experience: Record<string, string>;
  preferences: Record<string, string | string[]>;
  recommendedTier: SubscriptionTier;
  completedAt?: Timestamp;
  createdAt: Timestamp;
}

// Subscription Service Class
export class SubscriptionService {
  
  // Get user's current subscription
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'userSubscriptions', userId));
      if (subscriptionDoc.exists()) {
        return subscriptionDoc.data() as UserSubscription;
      }
      return null;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  }

  // Create new subscription
  static async createSubscription(
    userId: string, 
    tier: SubscriptionTier,
    billingCycle: 'monthly' | 'yearly' = 'monthly',
    paymentDetails?: {
      provider: 'razorpay' | 'stripe';
      subscriptionId: string;
      customerId: string;
      amount: number;
    }
  ): Promise<UserSubscription> {
    try {
      const now = serverTimestamp();
      const endDate = new Date();
      
      // Calculate end date based on billing cycle
      if (billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const subscription: UserSubscription = {
        userId,
        tier,
        status: 'active',
        currentPeriodStart: now as Timestamp,
        currentPeriodEnd: Timestamp.fromDate(endDate),
        cancelAtPeriodEnd: false,
        
        paymentProvider: paymentDetails?.provider || 'none',
        subscriptionId: paymentDetails?.subscriptionId || tier === 'free' ? 'free' : '',
        customerId: paymentDetails?.customerId || '',
        
        billingCycle,
        amount: paymentDetails?.amount || 0,
        currency: 'INR',
        
        createdAt: now as Timestamp,
        updatedAt: now as Timestamp,
        isTrialUsed: false
      };

      // Save subscription
      await setDoc(doc(db, 'userSubscriptions', userId), subscription);
      
      // Update user profile
      await this.updateUserProfile(userId, {
        currentTier: tier,
        subscriptionStatus: 'active'
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Update subscription tier
  static async updateSubscriptionTier(
    userId: string, 
    newTier: SubscriptionTier,
    paymentDetails?: {
      provider: 'razorpay' | 'stripe';
      subscriptionId: string;
      amount: number;
    }
  ): Promise<void> {
    try {
      const subscriptionRef = doc(db, 'userSubscriptions', userId);
      const updateData: Partial<UserSubscription> = {
        tier: newTier,
        updatedAt: serverTimestamp() as Timestamp
      };

      if (paymentDetails) {
        updateData.paymentProvider = paymentDetails.provider;
        updateData.subscriptionId = paymentDetails.subscriptionId;
        updateData.amount = paymentDetails.amount;
      }

      await updateDoc(subscriptionRef, updateData);
      
      // Update user profile
      await this.updateUserProfile(userId, {
        currentTier: newTier
      });

      // Add to subscription history
      await this.addToSubscriptionHistory(userId, newTier, 'upgrade');
      
    } catch (error) {
      console.error('Error updating subscription tier:', error);
      throw error;
    }
  }

  // Cancel subscription
  static async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    try {
      const updateData: Partial<UserSubscription> = {
        cancelAtPeriodEnd,
        updatedAt: serverTimestamp() as Timestamp
      };

      if (!cancelAtPeriodEnd) {
        updateData.status = 'cancelled';
        updateData.currentPeriodEnd = serverTimestamp() as Timestamp;
      }

      await updateDoc(doc(db, 'userSubscriptions', userId), updateData);
      
      if (!cancelAtPeriodEnd) {
        await this.updateUserProfile(userId, {
          subscriptionStatus: 'cancelled',
          currentTier: 'free'
        });
        
        await this.addToSubscriptionHistory(userId, 'free', 'cancellation');
      }
      
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Check if subscription is active and valid
  static async isSubscriptionActive(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;

      const now = new Date();
      const endDate = subscription.currentPeriodEnd.toDate();
      
      return subscription.status === 'active' && now <= endDate;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  // Get expired subscriptions (for cleanup job)
  static async getExpiredSubscriptions(): Promise<UserSubscription[]> {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, 'userSubscriptions'),
        where('status', '==', 'active'),
        where('currentPeriodEnd', '<=', now)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as UserSubscription);
    } catch (error) {
      console.error('Error getting expired subscriptions:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const profileRef = doc(db, 'userProfiles', userId);
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Add to subscription history
  private static async addToSubscriptionHistory(
    userId: string, 
    tier: SubscriptionTier, 
    reason: string
  ): Promise<void> {
    try {
      const profileDoc = await getDoc(doc(db, 'userProfiles', userId));
      if (profileDoc.exists()) {
        const profile = profileDoc.data() as UserProfile;
        const history = profile.subscriptionHistory || [];
        
        // End previous subscription in history
        if (history.length > 0 && !history[history.length - 1].endDate) {
          history[history.length - 1].endDate = serverTimestamp() as Timestamp;
        }
        
        // Add new subscription to history
        history.push({
          tier,
          startDate: serverTimestamp() as Timestamp,
          reason
        });

        await updateDoc(doc(db, 'userProfiles', userId), {
          subscriptionHistory: history
        });
      }
    } catch (error) {
      console.error('Error adding to subscription history:', error);
      // Don't throw - this is not critical
    }
  }

  // Onboarding methods
  static async saveOnboardingData(data: Partial<OnboardingData>): Promise<void> {
    try {
      const onboardingRef = doc(db, 'userOnboarding', data.userId!);
      await setDoc(onboardingRef, {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      throw error;
    }
  }

  static async completeOnboarding(
    userId: string, 
    finalData: OnboardingData
  ): Promise<void> {
    try {
      // Save complete onboarding data
      await setDoc(doc(db, 'userOnboarding', userId), {
        ...finalData,
        completed: true,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update user profile
      await this.updateUserProfile(userId, {
        currentStage: finalData.determinedStage,
        onboardingCompleted: true,
        onboardingCompletedAt: serverTimestamp() as Timestamp,
        stageUpdatedAt: serverTimestamp() as Timestamp
      });

      // Create initial subscription if recommended tier is not free
      if (finalData.recommendedTier !== 'free') {
        // Don't auto-create paid subscription, just update the recommendation
        await this.updateUserProfile(userId, {
          // Store recommended tier for later upgrade prompts
        });
      }
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  static async getOnboardingData(userId: string): Promise<OnboardingData | null> {
    try {
      const onboardingDoc = await getDoc(doc(db, 'userOnboarding', userId));
      if (onboardingDoc.exists()) {
        return onboardingDoc.data() as OnboardingData;
      }
      return null;
    } catch (error) {
      console.error('Error getting onboarding data:', error);
      throw error;
    }
  }

  // Stage progression
  static async updateUserStage(userId: string, newStage: UserStage): Promise<void> {
    try {
      await this.updateUserProfile(userId, {
        currentStage: newStage,
        stageUpdatedAt: serverTimestamp() as Timestamp
      });
    } catch (error) {
      console.error('Error updating user stage:', error);
      throw error;
    }
  }

  // Utility methods
  static async getUserProfile(userId: string, userEmail?: string): Promise<UserProfile | null> {
    try {
      const profileDoc = await getDoc(doc(db, 'userProfiles', userId));
      let profile: UserProfile | null = null;
      
      if (profileDoc.exists()) {
        profile = profileDoc.data() as UserProfile;
      }
      
      // Dev mode override - upgrade to elite tier
      if (profile && isDevMode(userEmail || profile.email)) {
        return {
          ...profile,
          currentTier: 'elite',
          subscriptionStatus: 'active',
          currentStage: 'interview' // Highest stage for full access
        };
      }
      
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Initialize user (called on first login)
  static async initializeUser(userId: string, email: string): Promise<void> {
    try {
      // Check if user already exists
      const existingProfile = await this.getUserProfile(userId);
      if (existingProfile) {
        return; // User already initialized
      }

      // Create user profile
      const profile: Partial<UserProfile> = {
        currentTier: 'free',
        subscriptionStatus: 'none',
        currentStage: 'assessment',
        stageUpdatedAt: serverTimestamp() as Timestamp,
        onboardingCompleted: false,
        subscriptionHistory: []
      };

      await setDoc(doc(db, 'userProfiles', userId), {
        ...profile,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create free subscription
      await this.createSubscription(userId, 'free');

    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    }
  }
}

export default SubscriptionService;