import { 
  SUBSCRIPTION_PLANS, 
  validateQuizAccess, 
  validateCurrentAffairsAccess, 
  validateWritingAccess, 
  validateInterviewAccess 
} from '../lib/subscription-tiers';

describe('Integration Tests - Subscription System', () => {
  describe('Quiz Access Validation', () => {
    it('should validate quiz access for free tier', () => {
      const result = validateQuizAccess('free', 3);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should deny quiz access when limit reached', () => {
      const result = validateQuizAccess('free', 5);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.message).toContain('Daily limit of 5 questions reached');
    });

    it('should allow unlimited quiz access for elite tier', () => {
      const result = validateQuizAccess('elite', 100);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
    });
  });

  describe('Current Affairs Access Validation', () => {
    it('should validate current affairs access for foundation tier', () => {
      const result = validateCurrentAffairsAccess('foundation', 3);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should deny current affairs access when limit reached', () => {
      const result = validateCurrentAffairsAccess('foundation', 5);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.message).toContain('Daily limit of 5 analysis reached');
    });
  });

  describe('Writing Access Validation', () => {
    it('should deny writing access for free tier', () => {
      const result = validateWritingAccess('free', 0);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.message).toContain('Writing practice is available for Mains qualified candidates');
    });

    it('should allow writing access for mains tier', () => {
      const result = validateWritingAccess('mains', 5);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });

    it('should allow unlimited writing access for elite tier', () => {
      const result = validateWritingAccess('elite', 50);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
    });
  });

  describe('Interview Access Validation', () => {
    it('should deny interview access for foundation tier', () => {
      const result = validateInterviewAccess('foundation', 0);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.message).toContain('Interview preparation is available for interview qualified candidates only');
    });

    it('should allow interview access for interview tier', () => {
      const result = validateInterviewAccess('interview', 2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);
    });

    it('should allow unlimited interview access for elite tier', () => {
      const result = validateInterviewAccess('elite', 20);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
    });
  });

  describe('Subscription Plan Integrity', () => {
    it('should have valid price structure', () => {
      const tiers = Object.keys(SUBSCRIPTION_PLANS);
      
      tiers.forEach(tier => {
        const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS];
        expect(plan.price.monthly).toBeGreaterThanOrEqual(0);
        expect(plan.price.yearly).toBeGreaterThanOrEqual(0);
        expect(plan.price.currency).toBe('INR');
      });
    });

    it('should have stage-based feature progression', () => {
      // Free tier - basic features only
      expect(SUBSCRIPTION_PLANS.free.features.writingPracticeAccess).toBe(false);
      expect(SUBSCRIPTION_PLANS.free.features.interviewAccess).toBe(false);
      
      // Foundation tier - prelims focused
      expect(SUBSCRIPTION_PLANS.foundation.features.writingPracticeAccess).toBe(false);
      expect(SUBSCRIPTION_PLANS.foundation.features.performanceAnalytics).toBe(true);
      
      // Mains tier - writing practice enabled
      expect(SUBSCRIPTION_PLANS.mains.features.writingPracticeAccess).toBe(true);
      expect(SUBSCRIPTION_PLANS.mains.features.interviewAccess).toBe(false);
      
      // Interview tier - interview practice enabled
      expect(SUBSCRIPTION_PLANS.interview.features.interviewAccess).toBe(true);
      expect(SUBSCRIPTION_PLANS.interview.features.humanCoaching).toBe(false);
      
      // Elite tier - all features enabled
      expect(SUBSCRIPTION_PLANS.elite.features.humanCoaching).toBe(true);
      expect(SUBSCRIPTION_PLANS.elite.features.fullBoardSimulation).toBe(true);
    });
  });
});