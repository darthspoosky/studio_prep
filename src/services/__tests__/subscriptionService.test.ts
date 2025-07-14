import { SubscriptionService, UserSubscription, UserProfile, OnboardingData } from '../subscriptionService';
import { SubscriptionTier, UserStage } from '@/lib/subscription-tiers';

// Mock Firebase
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn()
        }))
      }))
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' }))
    }
  }))
}));

describe('SubscriptionService', () => {
  const mockUserId = 'test-user-123';
  const mockEmail = 'test@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSubscription', () => {
    it('should return null for non-existent subscription', async () => {
      const mockDoc = {
        exists: false,
        data: () => null
      };

      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore().collection().doc().get.mockResolvedValue(mockDoc);

      const result = await SubscriptionService.getUserSubscription(mockUserId);
      expect(result).toBeNull();
    });

    it('should return subscription data when exists', async () => {
      const mockSubscriptionData = {
        tier: 'foundation',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        billingCycle: 'monthly',
        amount: 99,
        currency: 'INR'
      };

      const mockDoc = {
        exists: true,
        data: () => mockSubscriptionData
      };

      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore().collection().doc().get.mockResolvedValue(mockDoc);

      const result = await SubscriptionService.getUserSubscription(mockUserId);
      expect(result).toEqual(expect.objectContaining({
        tier: 'foundation',
        status: 'active'
      }));
    });
  });

  describe('createSubscription', () => {
    it('should create new subscription with correct data', async () => {
      const mockSet = jest.fn().mockResolvedValue(undefined);
      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore().collection().doc().set = mockSet;

      await SubscriptionService.createSubscription(
        mockUserId,
        'foundation',
        'monthly',
        99,
        'INR'
      );

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUserId,
        tier: 'foundation',
        billingCycle: 'monthly',
        amount: 99,
        currency: 'INR',
        status: 'active'
      }));
    });
  });

  describe('initializeUserProfile', () => {
    it('should create user profile with default values', async () => {
      const mockSet = jest.fn().mockResolvedValue(undefined);
      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore().collection().doc().set = mockSet;

      await SubscriptionService.initializeUserProfile(mockUserId, mockEmail);

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        uid: mockUserId,
        email: mockEmail,
        currentTier: 'free',
        currentStage: 'assessment',
        onboardingCompleted: false
      }));
    });
  });

  describe('updateSubscriptionTier', () => {
    it('should update subscription tier correctly', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore().collection().doc().update = mockUpdate;

      await SubscriptionService.updateSubscriptionTier(mockUserId, 'mains');

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        tier: 'mains'
      }));
    });
  });

  describe('completeOnboarding', () => {
    it('should complete onboarding and update profile', async () => {
      const mockOnboardingData: OnboardingData = {
        userId: mockUserId,
        completed: true,
        currentStep: 'completion',
        assessmentAnswers: { q1: 'answer1' },
        determinedStage: 'prelims',
        goals: { goal1: 'value1' },
        experience: { exp1: 'value1' },
        preferences: { pref1: 'value1' },
        recommendedTier: 'foundation',
        createdAt: new Date()
      };

      const mockSet = jest.fn().mockResolvedValue(undefined);
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore().collection().doc().set = mockSet;
      getFirestore().collection().doc().update = mockUpdate;

      await SubscriptionService.completeOnboarding(mockUserId, mockOnboardingData);

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        completed: true,
        determinedStage: 'prelims'
      }));

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        onboardingCompleted: true,
        currentStage: 'prelims'
      }));
    });
  });
});