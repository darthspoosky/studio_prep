/**
 * @fileOverview Advanced rate limiting for multi-agent framework
 */

import { Redis } from 'ioredis';
import { AuthContext } from '../auth/auth-provider';

export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  maxTokens?: number;      // Max tokens per window
  maxCost?: number;        // Max cost per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (authContext: AuthContext) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  limitType: 'requests' | 'tokens' | 'cost';
  currentUsage: {
    requests: number;
    tokens: number;
    cost: number;
  };
}

export interface RateLimitEntry {
  requests: number;
  tokens: number;
  cost: number;
  windowStart: number;
  firstRequestTime: number;
}

export class RateLimiter {
  private redis: Redis;
  private defaultConfig: RateLimitConfig;

  constructor(redisUrl?: string) {
    // Initialize Redis connection
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    
    this.defaultConfig = {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 100,
      maxTokens: 50000,
      maxCost: 10.00,
      skipSuccessfulRequests: false,
      skipFailedRequests: true,
      keyGenerator: (authContext) => `rate_limit:${authContext.user?.userId || 'anonymous'}`
    };
  }

  /**
   * Check if request is allowed under rate limits
   */
  async checkRateLimit(
    authContext: AuthContext,
    estimatedTokens: number = 0,
    estimatedCost: number = 0,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = finalConfig.keyGenerator!(authContext);
    const now = Date.now();
    const windowStart = Math.floor(now / finalConfig.windowMs) * finalConfig.windowMs;

    try {
      // Get current usage from Redis
      const currentEntry = await this.getCurrentEntry(key, windowStart);
      
      // Calculate what usage would be after this request
      const newUsage = {
        requests: currentEntry.requests + 1,
        tokens: currentEntry.tokens + estimatedTokens,
        cost: currentEntry.cost + estimatedCost
      };

      // Check each limit type
      const requestLimit = this.checkLimit(newUsage.requests, finalConfig.maxRequests);
      const tokenLimit = finalConfig.maxTokens ? 
        this.checkLimit(newUsage.tokens, finalConfig.maxTokens) : { exceeded: false, remaining: Infinity };
      const costLimit = finalConfig.maxCost ? 
        this.checkLimit(newUsage.cost, finalConfig.maxCost) : { exceeded: false, remaining: Infinity };

      // Determine if any limit is exceeded
      let limitType: RateLimitResult['limitType'] = 'requests';
      let remaining = requestLimit.remaining;
      let exceeded = requestLimit.exceeded;

      if (tokenLimit.exceeded || tokenLimit.remaining < remaining) {
        limitType = 'tokens';
        remaining = tokenLimit.remaining;
        exceeded = tokenLimit.exceeded;
      }

      if (costLimit.exceeded || costLimit.remaining < remaining) {
        limitType = 'cost';
        remaining = costLimit.remaining;
        exceeded = costLimit.exceeded;
      }

      const resetTime = new Date(windowStart + finalConfig.windowMs);
      const retryAfter = exceeded ? Math.ceil((resetTime.getTime() - now) / 1000) : undefined;

      return {
        allowed: !exceeded,
        remaining: Math.max(0, remaining),
        resetTime,
        retryAfter,
        limitType,
        currentUsage: {
          requests: currentEntry.requests,
          tokens: currentEntry.tokens,
          cost: currentEntry.cost
        }
      };

    } catch (error) {
      console.error('Rate limit check failed:', error);
      // On error, allow request but log issue
      return {
        allowed: true,
        remaining: finalConfig.maxRequests,
        resetTime: new Date(windowStart + finalConfig.windowMs),
        limitType: 'requests',
        currentUsage: {
          requests: 0,
          tokens: 0,
          cost: 0
        }
      };
    }
  }

  /**
   * Record actual usage after request completion
   */
  async recordUsage(
    authContext: AuthContext,
    actualTokens: number,
    actualCost: number,
    success: boolean,
    config?: Partial<RateLimitConfig>
  ): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Skip recording based on config
    if ((success && finalConfig.skipSuccessfulRequests) ||
        (!success && finalConfig.skipFailedRequests)) {
      return;
    }

    const key = finalConfig.keyGenerator!(authContext);
    const now = Date.now();
    const windowStart = Math.floor(now / finalConfig.windowMs) * finalConfig.windowMs;

    try {
      await this.incrementUsage(key, windowStart, 1, actualTokens, actualCost, finalConfig.windowMs);
    } catch (error) {
      console.error('Failed to record rate limit usage:', error);
    }
  }

  /**
   * Get current usage for a user
   */
  async getCurrentUsage(
    authContext: AuthContext,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitEntry> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = finalConfig.keyGenerator!(authContext);
    const now = Date.now();
    const windowStart = Math.floor(now / finalConfig.windowMs) * finalConfig.windowMs;

    return await this.getCurrentEntry(key, windowStart);
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  async resetUserLimits(
    userId: string,
    config?: Partial<RateLimitConfig>
  ): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = `rate_limit:${userId}`;
    
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Failed to reset user limits:', error);
    }
  }

  /**
   * Get rate limit stats for monitoring
   */
  async getStats(timeRange: { start: Date; end: Date }): Promise<{
    totalUsers: number;
    limitExceeded: {
      requests: number;
      tokens: number;
      cost: number;
    };
    topUsers: Array<{
      userId: string;
      requests: number;
      tokens: number;
      cost: number;
    }>;
  }> {
    try {
      // This would require more sophisticated tracking in production
      // For now, return basic stats
      const keys = await this.redis.keys('rate_limit:*');
      
      return {
        totalUsers: keys.length,
        limitExceeded: {
          requests: 0,
          tokens: 0,
          cost: 0
        },
        topUsers: []
      };

    } catch (error) {
      console.error('Failed to get rate limit stats:', error);
      return {
        totalUsers: 0,
        limitExceeded: { requests: 0, tokens: 0, cost: 0 },
        topUsers: []
      };
    }
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<void> {
    try {
      const keys = await this.redis.keys('rate_limit:*');
      const now = Date.now();
      
      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const entry: RateLimitEntry = JSON.parse(data);
          // Remove entries older than 24 hours
          if (now - entry.windowStart > 24 * 60 * 60 * 1000) {
            await this.redis.del(key);
          }
        }
      }
    } catch (error) {
      console.error('Rate limit cleanup failed:', error);
    }
  }

  /**
   * Private helper methods
   */

  private async getCurrentEntry(key: string, windowStart: number): Promise<RateLimitEntry> {
    const data = await this.redis.get(key);
    
    if (!data) {
      return {
        requests: 0,
        tokens: 0,
        cost: 0,
        windowStart,
        firstRequestTime: Date.now()
      };
    }

    const entry: RateLimitEntry = JSON.parse(data);
    
    // Check if we're in a new window
    if (entry.windowStart !== windowStart) {
      return {
        requests: 0,
        tokens: 0,
        cost: 0,
        windowStart,
        firstRequestTime: Date.now()
      };
    }

    return entry;
  }

  private async incrementUsage(
    key: string,
    windowStart: number,
    requests: number,
    tokens: number,
    cost: number,
    ttlMs: number
  ): Promise<void> {
    const currentEntry = await this.getCurrentEntry(key, windowStart);
    
    const newEntry: RateLimitEntry = {
      requests: currentEntry.requests + requests,
      tokens: currentEntry.tokens + tokens,
      cost: currentEntry.cost + cost,
      windowStart,
      firstRequestTime: currentEntry.firstRequestTime || Date.now()
    };

    // Set with TTL slightly longer than window to handle edge cases
    const ttlSeconds = Math.ceil(ttlMs / 1000) + 60;
    await this.redis.setex(key, ttlSeconds, JSON.stringify(newEntry));
  }

  private checkLimit(current: number, max: number): { exceeded: boolean; remaining: number } {
    return {
      exceeded: current > max,
      remaining: Math.max(0, max - current)
    };
  }
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  // Free tier - more restrictive
  free: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    maxTokens: 25000,
    maxCost: 2.00
  },
  
  // Premium tier - moderate limits
  premium: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 500,
    maxTokens: 250000,
    maxCost: 25.00
  },
  
  // Enterprise tier - high limits
  enterprise: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 2000,
    maxTokens: 1000000,
    maxCost: 100.00
  },
  
  // Per-minute burst protection
  burst: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    maxTokens: 10000,
    maxCost: 5.00
  }
} as const;

/**
 * Rate limiter middleware factory
 */
export function createRateLimitMiddleware(
  rateLimiter: RateLimiter,
  config?: Partial<RateLimitConfig>
) {
  return async (authContext: AuthContext, estimatedTokens: number = 0, estimatedCost: number = 0) => {
    const result = await rateLimiter.checkRateLimit(authContext, estimatedTokens, estimatedCost, config);
    
    if (!result.allowed) {
      throw new Error(`Rate limit exceeded: ${result.limitType} limit reached. Try again in ${result.retryAfter} seconds.`);
    }
    
    return result;
  };
}

// Singleton instance
export const rateLimiter = new RateLimiter();