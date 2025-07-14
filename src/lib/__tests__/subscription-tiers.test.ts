import { 
  SUBSCRIPTION_PLANS, 
  isFeatureAvailable, 
  getFeatureLimit, 
  SubscriptionTier 
} from '../subscription-tiers';

describe('Subscription Tiers', () => {
  describe('SUBSCRIPTION_PLANS', () => {
    it('should have all required tiers', () => {
      const expectedTiers: SubscriptionTier[] = [
        'free', 'foundation', 'practice', 'mains', 'interview', 'elite'
      ];
      
      expectedTiers.forEach(tier => {
        expect(SUBSCRIPTION_PLANS[tier]).toBeDefined();
        expect(SUBSCRIPTION_PLANS[tier].price).toBeDefined();
        expect(SUBSCRIPTION_PLANS[tier].features).toBeDefined();
      });
    });

    it('should have increasing prices from free to elite', () => {
      const tiers: SubscriptionTier[] = ['free', 'foundation', 'practice', 'mains', 'interview', 'elite'];
      
      for (let i = 0; i < tiers.length - 1; i++) {
        const currentTier = tiers[i];
        const nextTier = tiers[i + 1];
        
        expect(SUBSCRIPTION_PLANS[currentTier].price.monthly)
          .toBeLessThanOrEqual(SUBSCRIPTION_PLANS[nextTier].price.monthly);
      }
    });
  });

  describe('isFeatureAvailable', () => {
    it('should check feature availability for free tier', () => {
      expect(isFeatureAvailable('free', 'progressTracking')).toBe(true);
      expect(isFeatureAvailable('free', 'performanceAnalytics')).toBe(false);
      expect(isFeatureAvailable('free', 'writingPracticeAccess')).toBe(false);
    });

    it('should check feature availability for foundation tier', () => {
      expect(isFeatureAvailable('foundation', 'progressTracking')).toBe(true);
      expect(isFeatureAvailable('foundation', 'performanceAnalytics')).toBe(true);
      expect(isFeatureAvailable('foundation', 'writingPracticeAccess')).toBe(false);
    });

    it('should check feature availability for elite tier', () => {
      expect(isFeatureAvailable('elite', 'progressTracking')).toBe(true);
      expect(isFeatureAvailable('elite', 'performanceAnalytics')).toBe(true);
      expect(isFeatureAvailable('elite', 'writingPracticeAccess')).toBe(true);
      expect(isFeatureAvailable('elite', 'interviewAccess')).toBe(true);
      expect(isFeatureAvailable('elite', 'humanCoaching')).toBe(true);
    });
  });

  describe('getFeatureLimit', () => {
    it('should return correct limits for free tier', () => {
      expect(getFeatureLimit('free', 'dailyQuizQuestions')).toBe(5);
      expect(getFeatureLimit('free', 'dailyCurrentAffairs')).toBe(2);
      expect(getFeatureLimit('free', 'dailyAnswerLimit')).toBe(0);
      expect(getFeatureLimit('free', 'dailyInterviewSessions')).toBe(0);
    });

    it('should return correct limits for foundation tier', () => {
      expect(getFeatureLimit('foundation', 'dailyQuizQuestions')).toBe(25);
      expect(getFeatureLimit('foundation', 'dailyCurrentAffairs')).toBe(5);
      expect(getFeatureLimit('foundation', 'dailyAnswerLimit')).toBe(0);
      expect(getFeatureLimit('foundation', 'dailyInterviewSessions')).toBe(0);
    });

    it('should return unlimited for elite tier', () => {
      expect(getFeatureLimit('elite', 'dailyQuizQuestions')).toBe(-1);
      expect(getFeatureLimit('elite', 'dailyCurrentAffairs')).toBe(-1);
      expect(getFeatureLimit('elite', 'dailyAnswerLimit')).toBe(-1);
      expect(getFeatureLimit('elite', 'dailyInterviewSessions')).toBe(-1);
    });
  });
});