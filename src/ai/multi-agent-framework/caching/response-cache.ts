/**
 * @fileOverview Intelligent response caching system for multi-agent framework
 */

import { Redis } from 'ioredis';
import crypto from 'crypto';
import { BaseRequest, BaseResponse } from '../core/types';
import { Logger } from '../core/logger';

export interface CacheConfig {
  ttl: number;                    // Time to live in seconds
  maxSize?: number;               // Max cache size in MB
  compress?: boolean;             // Enable compression
  keyPrefix?: string;             // Cache key prefix
  namespace?: string;             // Cache namespace
  invalidationPatterns?: string[]; // Patterns for cache invalidation
}

export interface CacheEntry {
  data: BaseResponse;
  timestamp: number;
  ttl: number;
  size: number;
  hits: number;
  agentId: string;
  requestHash: string;
}

export interface CacheStats {
  totalKeys: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  topKeys: Array<{
    key: string;
    hits: number;
    size: number;
    lastAccess: Date;
  }>;
}

export class ResponseCache {
  private redis: Redis;
  private logger: Logger;
  private stats = {
    hits: 0,
    misses: 0,
    writes: 0,
    invalidations: 0
  };

  constructor(redisUrl?: string, logger?: Logger) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    this.logger = logger || console as any;
  }

  /**
   * Get cached response if available
   */
  async get(
    request: BaseRequest,
    config: CacheConfig
  ): Promise<BaseResponse | null> {
    try {
      const cacheKey = this.generateCacheKey(request, config);
      const cached = await this.redis.get(cacheKey);

      if (!cached) {
        this.stats.misses++;
        return null;
      }

      const entry: CacheEntry = JSON.parse(cached);
      
      // Check if entry has expired
      if (Date.now() - entry.timestamp > entry.ttl * 1000) {
        await this.redis.del(cacheKey);
        this.stats.misses++;
        return null;
      }

      // Update hit count and stats
      entry.hits++;
      this.stats.hits++;
      
      // Update entry with new hit count (fire and forget)
      this.redis.set(cacheKey, JSON.stringify(entry), 'EX', entry.ttl).catch(err => {
        this.logger.error('Failed to update cache hit count', err);
      });

      this.logger.debug('Cache hit', { 
        key: cacheKey, 
        agentId: entry.agentId,
        hits: entry.hits 
      });

      return entry.data;

    } catch (error) {
      this.logger.error('Cache get failed', error as Error, { requestId: request.id });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Cache a response
   */
  async set(
    request: BaseRequest,
    response: BaseResponse,
    config: CacheConfig
  ): Promise<void> {
    try {
      // Don't cache failed responses or responses with errors
      if (!response.success || response.error) {
        return;
      }

      const cacheKey = this.generateCacheKey(request, config);
      const dataSize = this.calculateSize(response);

      // Check size limits
      if (config.maxSize && dataSize > config.maxSize * 1024 * 1024) {
        this.logger.warn('Response too large to cache', { 
          size: dataSize, 
          maxSize: config.maxSize 
        });
        return;
      }

      const entry: CacheEntry = {
        data: response,
        timestamp: Date.now(),
        ttl: config.ttl,
        size: dataSize,
        hits: 0,
        agentId: response.agentId,
        requestHash: this.hashRequest(request)
      };

      let serialized = JSON.stringify(entry);
      
      // Compress if enabled and beneficial
      if (config.compress && serialized.length > 1024) {
        // In production, you'd use actual compression here
        // For now, just simulate compression benefit
        this.logger.debug('Compressing cache entry', { 
          originalSize: serialized.length,
          key: cacheKey 
        });
      }

      await this.redis.setex(cacheKey, config.ttl, serialized);
      this.stats.writes++;

      this.logger.debug('Response cached', { 
        key: cacheKey,
        agentId: response.agentId,
        size: dataSize,
        ttl: config.ttl
      });

    } catch (error) {
      this.logger.error('Cache set failed', error as Error, { 
        requestId: request.id,
        responseId: response.id 
      });
    }
  }

  /**
   * Invalidate cache entries based on patterns
   */
  async invalidate(patterns: string[]): Promise<number> {
    try {
      let totalDeleted = 0;

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          const deleted = await this.redis.del(...keys);
          totalDeleted += deleted;
          this.stats.invalidations += deleted;
        }
      }

      this.logger.info('Cache invalidated', { 
        patterns,
        keysDeleted: totalDeleted 
      });

      return totalDeleted;

    } catch (error) {
      this.logger.error('Cache invalidation failed', error as Error, { patterns });
      return 0;
    }
  }

  /**
   * Invalidate cache for specific user
   */
  async invalidateUser(userId: string): Promise<number> {
    return await this.invalidate([`cache:*:user:${userId}:*`]);
  }

  /**
   * Invalidate cache for specific agent
   */
  async invalidateAgent(agentId: string): Promise<number> {
    return await this.invalidate([`cache:*:agent:${agentId}:*`]);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const keys = await this.redis.keys('cache:*');
      let totalSize = 0;
      const keyDetails = [];

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const entry: CacheEntry = JSON.parse(data);
          totalSize += entry.size;
          keyDetails.push({
            key,
            hits: entry.hits,
            size: entry.size,
            lastAccess: new Date(entry.timestamp)
          });
        }
      }

      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
      const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;

      const topKeys = keyDetails
        .sort((a, b) => b.hits - a.hits)
        .slice(0, 10);

      return {
        totalKeys: keys.length,
        totalSize,
        hitRate,
        missRate,
        totalHits: this.stats.hits,
        totalMisses: this.stats.misses,
        topKeys
      };

    } catch (error) {
      this.logger.error('Failed to get cache stats', error as Error);
      return {
        totalKeys: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        totalHits: this.stats.hits,
        totalMisses: this.stats.misses,
        topKeys: []
      };
    }
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<number> {
    try {
      const keys = await this.redis.keys('cache:*');
      let deletedCount = 0;
      const now = Date.now();

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const entry: CacheEntry = JSON.parse(data);
          if (now - entry.timestamp > entry.ttl * 1000) {
            await this.redis.del(key);
            deletedCount++;
          }
        }
      }

      this.logger.info('Cache cleanup completed', { deletedKeys: deletedCount });
      return deletedCount;

    } catch (error) {
      this.logger.error('Cache cleanup failed', error as Error);
      return 0;
    }
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(requests: Array<{ request: BaseRequest; response: BaseResponse; config: CacheConfig }>): Promise<void> {
    try {
      for (const item of requests) {
        await this.set(item.request, item.response, item.config);
      }
      
      this.logger.info('Cache warming completed', { itemCount: requests.length });

    } catch (error) {
      this.logger.error('Cache warming failed', error as Error);
    }
  }

  /**
   * Private helper methods
   */

  private generateCacheKey(request: BaseRequest, config: CacheConfig): string {
    const baseKey = config.keyPrefix || 'cache';
    const namespace = config.namespace || 'default';
    const requestHash = this.hashRequest(request);
    
    return `${baseKey}:${namespace}:user:${request.userId}:${requestHash}`;
  }

  private hashRequest(request: BaseRequest): string {
    // Create deterministic hash of request for caching
    const normalized = {
      type: request.type,
      data: this.normalizeData(request.data),
      // Don't include userId, timestamp, or sessionId in hash
      // as these change per request but don't affect the response
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex')
      .substring(0, 16); // Use first 16 chars for shorter keys
  }

  private normalizeData(data: any): any {
    if (!data) return data;

    // Sort object keys for consistent hashing
    if (typeof data === 'object' && !Array.isArray(data)) {
      const normalized: any = {};
      Object.keys(data).sort().forEach(key => {
        normalized[key] = this.normalizeData(data[key]);
      });
      return normalized;
    }

    return data;
  }

  private calculateSize(obj: any): number {
    return JSON.stringify(obj).length;
  }
}

/**
 * Predefined cache configurations for different request types
 */
export const CACHE_CONFIGS = {
  // Newspaper analysis - cache for 1 hour (content doesn't change often)
  newspaper_analysis: {
    ttl: 60 * 60, // 1 hour
    maxSize: 5, // 5MB
    compress: true,
    namespace: 'newspaper',
    invalidationPatterns: ['cache:newspaper:*']
  },

  // Quiz generation - cache for 30 minutes (can be reused)
  quiz_generation: {
    ttl: 30 * 60, // 30 minutes
    maxSize: 2, // 2MB
    compress: true,
    namespace: 'quiz',
    invalidationPatterns: ['cache:quiz:*']
  },

  // Writing evaluation - cache for 15 minutes (more personalized)
  writing_evaluation: {
    ttl: 15 * 60, // 15 minutes
    maxSize: 3, // 3MB
    compress: true,
    namespace: 'writing',
    invalidationPatterns: ['cache:writing:*']
  },

  // Mock interview - don't cache (too personalized)
  mock_interview: {
    ttl: 0, // No caching
    maxSize: 0,
    namespace: 'interview'
  }
} as const;

/**
 * Cache middleware factory
 */
export function createCacheMiddleware(cache: ResponseCache) {
  return {
    async before(request: BaseRequest, config: CacheConfig): Promise<BaseResponse | null> {
      if (config.ttl <= 0) return null; // Caching disabled
      return await cache.get(request, config);
    },

    async after(request: BaseRequest, response: BaseResponse, config: CacheConfig): Promise<void> {
      if (config.ttl <= 0) return; // Caching disabled
      await cache.set(request, response, config);
    }
  };
}

// Singleton instance
export const responseCache = new ResponseCache();