import { DEV_MODE } from '../dev-mode';

// Simple integration test for dev mode configuration
describe('Dev Mode Configuration', () => {
  describe('admin users list', () => {
    it('should include all expected admin emails', () => {
      const expectedAdmins = [
        'bhardwajupmanyu@gmail.com',
        'darthspooky@admin.com',
        'admin@preptalk.com',
        'dev@preptalk.com'
      ];

      expectedAdmins.forEach(email => {
        expect(DEV_MODE.adminUsers).toContain(email);
      });
    });

    it('should have primary admin as first in list', () => {
      expect(DEV_MODE.adminUsers[0]).toBe('bhardwajupmanyu@gmail.com');
    });
  });

  describe('features configuration', () => {
    it('should have all required dev features enabled', () => {
      const requiredFeatures = [
        'bypassSubscription',
        'bypassUsageLimits', 
        'bypassOnboarding',
        'adminAccess',
        'unlimitedQuestions',
        'unlimitedCurrentAffairs',
        'unlimitedWriting',
        'unlimitedInterviews',
        'accessAllTools',
        'viewMetrics',
        'manageContent'
      ];

      requiredFeatures.forEach(feature => {
        expect(DEV_MODE.features[feature as keyof typeof DEV_MODE.features]).toBe(true);
      });
    });
  });

  describe('configuration structure', () => {
    it('should have valid structure', () => {
      expect(DEV_MODE).toHaveProperty('enabled');
      expect(DEV_MODE).toHaveProperty('adminUsers');
      expect(DEV_MODE).toHaveProperty('features');
      expect(Array.isArray(DEV_MODE.adminUsers)).toBe(true);
      expect(typeof DEV_MODE.features).toBe('object');
    });

    it('should have boolean feature flags', () => {
      Object.values(DEV_MODE.features).forEach(value => {
        expect(typeof value).toBe('boolean');
      });
    });
  });
});