// Development mode configuration for bypassing subscription restrictions

export const DEV_MODE = {
  enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true',
  adminUsers: [
    'bhardwajupmanyu@gmail.com', // Primary admin
    'darthspooky@admin.com',
    'admin@preptalk.com',
    'dev@preptalk.com'
  ],
  features: {
    bypassSubscription: true,
    bypassUsageLimits: true,
    bypassOnboarding: true,
    adminAccess: true,
    unlimitedQuestions: true,
    unlimitedCurrentAffairs: true,
    unlimitedWriting: true,
    unlimitedInterviews: true,
    accessAllTools: true,
    viewMetrics: true,
    manageContent: true
  }
};

// Check if user is in dev mode
export function isDevMode(userEmail?: string | null): boolean {
  if (!DEV_MODE.enabled) return false;
  if (!userEmail) return false;
  return DEV_MODE.adminUsers.includes(userEmail.toLowerCase());
}

// Check if dev mode feature is enabled
export function hasDevFeature(feature: keyof typeof DEV_MODE.features, userEmail?: string | null): boolean {
  return DEV_MODE.enabled && isDevMode(userEmail) && DEV_MODE.features[feature];
}

// Override subscription tier for dev users
export function getDevTier(userEmail?: string | null): 'elite' | null {
  return isDevMode(userEmail) ? 'elite' : null;
}

// Override usage limits for dev users
export function getDevUsageLimit(toolType: string, userEmail?: string | null): number {
  return isDevMode(userEmail) ? -1 : 0; // -1 means unlimited
}

// Dev mode banner component props
export function getDevModeBanner(userEmail?: string | null) {
  if (!isDevMode(userEmail)) return null;
  
  return {
    show: true,
    message: '🚀 DEV MODE: All features unlocked for development',
    type: 'info' as const
  };
}

export default DEV_MODE;