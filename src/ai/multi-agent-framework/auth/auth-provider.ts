/**
 * @fileOverview Authentication provider for multi-agent framework
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'premium';
  subscription: {
    type: 'free' | 'premium' | 'enterprise';
    expiresAt?: Date;
    features: string[];
  };
  usage: {
    requestsThisMonth: number;
    maxRequestsPerMonth: number;
    tokensUsedThisMonth: number;
    maxTokensPerMonth: number;
  };
}

export interface AuthContext {
  user: UserSession | null;
  isAuthenticated: boolean;
  hasPermission: (feature: string) => boolean;
  remainingRequests: number;
  rateLimitStatus: {
    remaining: number;
    resetTime: Date;
    limitType: 'requests' | 'tokens' | 'none';
  };
}

export class AuthProvider {
  /**
   * Extract user session from Next.js request
   */
  async extractUserFromRequest(req: NextRequest): Promise<UserSession | null> {
    try {
      // Try NextAuth session first
      const session = await getServerSession(authOptions);
      
      if (session?.user) {
        return await this.buildUserSession(session.user);
      }

      // Try JWT token from headers
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        return await this.extractUserFromJWT(token);
      }

      // Try API key
      const apiKey = req.headers.get('x-api-key');
      if (apiKey) {
        return await this.extractUserFromApiKey(apiKey);
      }

      return null;

    } catch (error) {
      console.error('Failed to extract user from request:', error);
      return null;
    }
  }

  /**
   * Build complete user session from basic user info
   */
  private async buildUserSession(user: any): Promise<UserSession> {
    // In real implementation, fetch from database
    // This is a simplified version
    return {
      userId: user.id || user.email,
      email: user.email,
      name: user.name || user.email,
      role: this.determineUserRole(user),
      subscription: await this.getUserSubscription(user.id),
      usage: await this.getUserUsage(user.id)
    };
  }

  /**
   * Extract user from JWT token
   */
  private async extractUserFromJWT(token: string): Promise<UserSession | null> {
    try {
      const secret = process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(token, secret) as any;
      
      return await this.buildUserSession({
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name
      });

    } catch (error) {
      console.error('Invalid JWT token:', error);
      return null;
    }
  }

  /**
   * Extract user from API key
   */
  private async extractUserFromApiKey(apiKey: string): Promise<UserSession | null> {
    try {
      // In real implementation, lookup API key in database
      // This is a simplified version for demo
      if (apiKey.startsWith('sk-upsc-')) {
        const userId = apiKey.split('-')[2];
        return await this.buildUserSession({
          id: userId,
          email: `${userId}@api.upsc.app`,
          name: `API User ${userId}`
        });
      }

      return null;

    } catch (error) {
      console.error('Invalid API key:', error);
      return null;
    }
  }

  /**
   * Create authentication context
   */
  async createAuthContext(req: NextRequest): Promise<AuthContext> {
    const user = await this.extractUserFromRequest(req);
    
    if (!user) {
      return {
        user: null,
        isAuthenticated: false,
        hasPermission: () => false,
        remainingRequests: 0,
        rateLimitStatus: {
          remaining: 0,
          resetTime: new Date(),
          limitType: 'none'
        }
      };
    }

    const rateLimitStatus = this.calculateRateLimit(user);

    return {
      user,
      isAuthenticated: true,
      hasPermission: (feature: string) => this.checkPermission(user, feature),
      remainingRequests: user.usage.maxRequestsPerMonth - user.usage.requestsThisMonth,
      rateLimitStatus
    };
  }

  /**
   * Check if user has permission for a feature
   */
  private checkPermission(user: UserSession, feature: string): boolean {
    // Admin has all permissions
    if (user.role === 'admin') {
      return true;
    }

    // Check subscription features
    return user.subscription.features.includes(feature);
  }

  /**
   * Calculate rate limit status
   */
  private calculateRateLimit(user: UserSession): AuthContext['rateLimitStatus'] {
    const requestsRemaining = user.usage.maxRequestsPerMonth - user.usage.requestsThisMonth;
    const tokensRemaining = user.usage.maxTokensPerMonth - user.usage.tokensUsedThisMonth;

    // Determine limiting factor
    const requestLimited = requestsRemaining <= 0;
    const tokenLimited = tokensRemaining <= 0;

    if (requestLimited) {
      return {
        remaining: 0,
        resetTime: this.getMonthReset(),
        limitType: 'requests'
      };
    }

    if (tokenLimited) {
      return {
        remaining: 0,
        resetTime: this.getMonthReset(),
        limitType: 'tokens'
      };
    }

    return {
      remaining: Math.min(requestsRemaining, tokensRemaining),
      resetTime: this.getMonthReset(),
      limitType: 'none'
    };
  }

  /**
   * Validate request permissions
   */
  async validateRequest(authContext: AuthContext, requiredFeature?: string): Promise<{
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
  }> {
    if (!authContext.isAuthenticated) {
      return {
        allowed: false,
        reason: 'Authentication required'
      };
    }

    // Check rate limits
    if (authContext.rateLimitStatus.limitType !== 'none') {
      return {
        allowed: false,
        reason: `${authContext.rateLimitStatus.limitType} limit exceeded`,
        upgradeRequired: authContext.user?.subscription.type === 'free'
      };
    }

    // Check feature permissions
    if (requiredFeature && !authContext.hasPermission(requiredFeature)) {
      return {
        allowed: false,
        reason: `Feature '${requiredFeature}' not available in your plan`,
        upgradeRequired: true
      };
    }

    return { allowed: true };
  }

  /**
   * Update user usage after successful request
   */
  async updateUsage(
    userId: string, 
    tokensUsed: number, 
    cost: number
  ): Promise<void> {
    try {
      // In real implementation, update database
      // This would increment monthly counters
      console.log(`Updated usage for ${userId}: ${tokensUsed} tokens, $${cost}`);
      
    } catch (error) {
      console.error('Failed to update user usage:', error);
    }
  }

  /**
   * Private helper methods
   */

  private determineUserRole(user: any): UserSession['role'] {
    // Logic to determine user role
    if (user.email?.endsWith('@admin.upsc.app')) {
      return 'admin';
    }
    if (user.subscription?.type === 'premium' || user.subscription?.type === 'enterprise') {
      return 'premium';
    }
    return 'student';
  }

  private async getUserSubscription(userId: string): Promise<UserSession['subscription']> {
    // In real implementation, fetch from database
    // This is simplified for demo
    return {
      type: 'free',
      features: [
        'newspaper_analysis',
        'basic_quiz_generation'
      ]
    };
  }

  private async getUserUsage(userId: string): Promise<UserSession['usage']> {
    // In real implementation, fetch from database
    // This is simplified for demo
    return {
      requestsThisMonth: 45,
      maxRequestsPerMonth: 100,
      tokensUsedThisMonth: 15000,
      maxTokensPerMonth: 50000
    };
  }

  private getMonthReset(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
}

// Singleton instance
export const authProvider = new AuthProvider();

/**
 * Utility function to get auth context from request
 */
export async function getAuthContext(req: NextRequest): Promise<AuthContext> {
  return await authProvider.createAuthContext(req);
}

/**
 * Feature flags for different subscription tiers
 */
export const FEATURES = {
  NEWSPAPER_ANALYSIS: 'newspaper_analysis',
  ADVANCED_QUIZ: 'advanced_quiz_generation',
  MOCK_INTERVIEW: 'mock_interview',
  WRITING_EVALUATION: 'writing_evaluation',
  BULK_OPERATIONS: 'bulk_operations',
  EXPORT_DATA: 'export_data',
  PRIORITY_SUPPORT: 'priority_support',
  CUSTOM_PROMPTS: 'custom_prompts'
} as const;

/**
 * Subscription tier configurations
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    features: [
      FEATURES.NEWSPAPER_ANALYSIS,
      FEATURES.ADVANCED_QUIZ
    ],
    limits: {
      requestsPerMonth: 100,
      tokensPerMonth: 50000
    }
  },
  premium: {
    features: [
      FEATURES.NEWSPAPER_ANALYSIS,
      FEATURES.ADVANCED_QUIZ,
      FEATURES.MOCK_INTERVIEW,
      FEATURES.WRITING_EVALUATION,
      FEATURES.EXPORT_DATA
    ],
    limits: {
      requestsPerMonth: 1000,
      tokensPerMonth: 500000
    }
  },
  enterprise: {
    features: Object.values(FEATURES),
    limits: {
      requestsPerMonth: 10000,
      tokensPerMonth: 2000000
    }
  }
};