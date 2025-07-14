import { UsageTrackingService, ToolType } from '../usageTrackingService';
import { SubscriptionTier } from '@/lib/subscription-tiers';

// Mock Firebase
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn()
      }))
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' })),
      increment: jest.fn((val) => ({ _methodName: 'increment', _value: val }))
    }
  }))
}));

describe('UsageTrackingService', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateToolAccess', () => {
    it('should allow access for unlimited tier', async () => {
      const result = await UsageTrackingService.validateToolAccess(
        mockUserId,
        'elite',
        'quiz'
      );

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
    });

    it('should deny access when daily limit reached', async () => {
      // Mock current usage at limit
      const mockDoc = {
        exists: true,
        data: () => ({
          dailyQuizQuestions: 5,
          date: new Date().toISOString().split('T')[0]
        })
      };

      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore().collection().doc().get.mockResolvedValue(mockDoc);

      const result = await UsageTrackingService.validateToolAccess(
        mockUserId,
        'free',
        'quiz'
      );

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should allow access when under daily limit', async () => {
      // Mock current usage under limit
      const mockDoc = {
        exists: true,
        data: () => ({
          dailyQuizQuestions: 3,
          date: new Date().toISOString().split('T')[0]
        })
      };

      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore().collection().doc().get.mockResolvedValue(mockDoc);

      const result = await UsageTrackingService.validateToolAccess(
        mockUserId,
        'free',
        'quiz'
      );

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should deny access for tier-restricted tools', async () => {
      const result = await UsageTrackingService.validateToolAccess(
        mockUserId,
        'free',
        'writing'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Tier does not have access to this tool');
    });
  });

  describe('recordUsage', () => {
    it('should record usage successfully', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore().collection().doc().update = mockUpdate;

      const result = await UsageTrackingService.recordUsage(
        mockUserId,
        'quiz',
        2
      );

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        dailyQuizQuestions: expect.objectContaining({ _methodName: 'increment' }),
        totalQuizQuestions: expect.objectContaining({ _methodName: 'increment' })
      }));
    });
  });

  describe('getDailyUsage', () => {
    it('should return current daily usage', async () => {
      const mockUsageData = {
        dailyQuizQuestions: 3,
        currentAffairsAnalysis: 1,
        writingAnswers: 0,
        interviewSessions: 0,
        date: new Date().toISOString().split('T')[0]
      };

      const mockDoc = {
        exists: true,
        data: () => mockUsageData
      };

      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore().collection().doc().get.mockResolvedValue(mockDoc);

      const result = await UsageTrackingService.getDailyUsage(mockUserId);

      expect(result).toEqual(expect.objectContaining({
        dailyQuizQuestions: 3,
        currentAffairsAnalysis: 1
      }));
    });

    it('should return zero usage for new user', async () => {
      const mockDoc = {
        exists: false,
        data: () => null
      };

      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore().collection().doc().get.mockResolvedValue(mockDoc);

      const result = await UsageTrackingService.getDailyUsage(mockUserId);

      expect(result).toEqual(expect.objectContaining({
        dailyQuizQuestions: 0,
        currentAffairsAnalysis: 0,
        writingAnswers: 0,
        interviewSessions: 0
      }));
    });
  });

  describe('getUsageLimits', () => {
    it('should return correct limits for free tier', () => {
      const limits = UsageTrackingService.getUsageLimits('free');

      expect(limits).toEqual({
        dailyQuizQuestions: 5,
        currentAffairsAnalysis: 2,
        writingAnswers: 0,
        interviewSessions: 0
      });
    });

    it('should return unlimited for elite tier', () => {
      const limits = UsageTrackingService.getUsageLimits('elite');

      expect(limits).toEqual({
        dailyQuizQuestions: -1,
        currentAffairsAnalysis: -1,
        writingAnswers: -1,
        interviewSessions: -1
      });
    });
  });
});