/**
 * @fileOverview Comprehensive performance tests for multi-agent framework
 */

import { jest } from '@jest/globals';
import { MultiAgentFramework } from '../core/framework';
import { createMockRequest, createMockOpenAIResponse } from './setup';
import { performance } from 'perf_hooks';

// Mock global fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Multi-Agent Framework Performance Tests', () => {
  let framework: MultiAgentFramework;
  
  beforeAll(async () => {
    framework = new MultiAgentFramework({
      enableCaching: true,
      enableQualityTracking: true,
      enableRateLimiting: false, // Disable for performance testing
      logger: console as any
    });
    
    await framework.initialize();
  });

  afterAll(async () => {
    await framework.shutdown();
  });

  describe('Response Time Performance', () => {
    test('should process newspaper analysis request within 2 seconds', async () => {
      const request = createMockRequest('newspaper_analysis', {
        sourceText: 'Sample newspaper article for testing response time...',
        analysisType: 'comprehensive'
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockOpenAIResponse({
          upscRelevanceScore: 85,
          qualityScore: 90,
          prelims: { mcqs: [{ question: 'Test question?', options: ['A', 'B', 'C', 'D'], correct: 0 }] }
        })
      } as Response);

      const startTime = performance.now();
      const response = await framework.processRequest(request);
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      
      expect(response.success).toBe(true);
      expect(responseTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(response.processingTime).toBeLessThan(2000);
    });

    test('should process quiz generation request within 1.5 seconds', async () => {
      const request = createMockRequest('quiz_generation', {
        topic: 'Indian Constitution',
        difficulty: 'medium',
        count: 5
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockOpenAIResponse({
          questions: Array(5).fill(null).map((_, i) => ({
            question: `Question ${i + 1}`,
            options: ['A', 'B', 'C', 'D'],
            correct: 0
          }))
        })
      } as Response);

      const startTime = performance.now();
      const response = await framework.processRequest(request);
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      
      expect(response.success).toBe(true);
      expect(responseTime).toBeLessThan(1500);
    });
  });

  describe('Throughput Performance', () => {
    test('should handle 10 concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const requests = Array(concurrentRequests).fill(null).map((_, i) => 
        createMockRequest('newspaper_analysis', {
          sourceText: `Article ${i + 1} content for concurrent testing...`,
          analysisType: 'summary'
        })
      );

      // Mock all responses
      for (let i = 0; i < concurrentRequests; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockOpenAIResponse({
            upscRelevanceScore: 80 + i,
            qualityScore: 85 + i
          })
        } as Response);
      }

      const startTime = performance.now();
      const responses = await Promise.all(
        requests.map(request => framework.processRequest(request))
      );
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const averageResponseTime = totalTime / concurrentRequests;
      
      expect(responses).toHaveLength(concurrentRequests);
      expect(responses.every(r => r.success)).toBe(true);
      expect(averageResponseTime).toBeLessThan(3000); // Average should be under 3 seconds
      expect(totalTime).toBeLessThan(10000); // Total should be under 10 seconds
    });

    test('should maintain performance under load (50 requests)', async () => {
      const loadRequests = 50;
      const batchSize = 10;
      const batches = Math.ceil(loadRequests / batchSize);
      
      const allResponseTimes: number[] = [];
      
      for (let batch = 0; batch < batches; batch++) {
        const batchRequests = Array(batchSize).fill(null).map((_, i) => 
          createMockRequest('quiz_generation', {
            topic: `Topic ${batch}-${i}`,
            difficulty: 'easy',
            count: 3
          })
        );

        // Mock batch responses
        for (let i = 0; i < batchSize; i++) {
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => createMockOpenAIResponse({
              questions: Array(3).fill({ question: 'Q', options: ['A', 'B', 'C', 'D'], correct: 0 })
            })
          } as Response);
        }

        const batchStartTime = performance.now();
        const batchResponses = await Promise.all(
          batchRequests.map(request => framework.processRequest(request))
        );
        const batchEndTime = performance.now();
        
        const batchTime = batchEndTime - batchStartTime;
        const avgBatchResponseTime = batchTime / batchSize;
        allResponseTimes.push(avgBatchResponseTime);
        
        expect(batchResponses.every(r => r.success)).toBe(true);
        expect(avgBatchResponseTime).toBeLessThan(4000); // Should not degrade significantly
      }
      
      // Check for performance degradation across batches
      const firstBatchTime = allResponseTimes[0];
      const lastBatchTime = allResponseTimes[allResponseTimes.length - 1];
      const degradationRatio = lastBatchTime / firstBatchTime;
      
      expect(degradationRatio).toBeLessThan(2.0); // Should not be more than 2x slower
    });
  });

  describe('Memory Performance', () => {
    test('should not have significant memory leaks during processing', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process multiple requests to test for memory leaks
      for (let i = 0; i < 20; i++) {
        const request = createMockRequest('newspaper_analysis', {
          sourceText: `Memory test article ${i} with substantial content to test memory usage patterns...`.repeat(10),
          analysisType: 'summary'
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockOpenAIResponse({
            upscRelevanceScore: 75,
            qualityScore: 80
          })
        } as Response);

        await framework.processRequest(request);
        
        // Force garbage collection periodically
        if (i % 5 === 0 && global.gc) {
          global.gc();
        }
      }
      
      // Force final garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseRatio = memoryIncrease / initialMemory;
      
      // Memory should not increase by more than 50%
      expect(memoryIncreaseRatio).toBeLessThan(0.5);
    });
  });

  describe('Cache Performance', () => {
    test('should show significant performance improvement with caching', async () => {
      const request = createMockRequest('newspaper_analysis', {
        sourceText: 'Cache performance test article content...',
        analysisType: 'comprehensive'
      });

      // First request (cache miss)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockOpenAIResponse({
          upscRelevanceScore: 88,
          qualityScore: 92
        })
      } as Response);

      const firstStartTime = performance.now();
      const firstResponse = await framework.processRequest(request);
      const firstEndTime = performance.now();
      const firstResponseTime = firstEndTime - firstStartTime;

      expect(firstResponse.success).toBe(true);

      // Second request (cache hit) - same request data
      const secondStartTime = performance.now();
      const secondResponse = await framework.processRequest(request);
      const secondEndTime = performance.now();
      const secondResponseTime = secondEndTime - secondStartTime;

      expect(secondResponse.success).toBe(true);
      
      // Cache hit should be significantly faster (at least 5x)
      const performanceImprovement = firstResponseTime / secondResponseTime;
      expect(performanceImprovement).toBeGreaterThan(5);
      expect(secondResponseTime).toBeLessThan(100); // Should be very fast
    });
  });

  describe('Rate Limiting Performance', () => {
    test('should enforce rate limits without significant overhead', async () => {
      // Enable rate limiting for this test
      const rateLimitedFramework = new MultiAgentFramework({
        enableRateLimiting: true,
        rateLimitConfig: {
          windowMs: 60000,
          maxRequests: 5, // Low limit for testing
          maxTokens: 10000
        },
        logger: console as any
      });
      
      await rateLimitedFramework.initialize();

      const requests = Array(7).fill(null).map((_, i) => 
        createMockRequest('quiz_generation', {
          topic: `Rate limit test ${i}`,
          difficulty: 'easy',
          count: 2
        })
      );

      // Mock responses for successful requests
      for (let i = 0; i < 5; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockOpenAIResponse({
            questions: Array(2).fill({ question: 'Q', options: ['A', 'B', 'C', 'D'], correct: 0 })
          })
        } as Response);
      }

      const startTime = performance.now();
      const responses = await Promise.allSettled(
        requests.map(request => rateLimitedFramework.processRequest(request))
      );
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const successfulRequests = responses.filter(r => r.status === 'fulfilled').length;
      const rejectedRequests = responses.filter(r => r.status === 'rejected').length;
      
      expect(successfulRequests).toBe(5); // Should allow 5 requests
      expect(rejectedRequests).toBe(2); // Should reject 2 requests
      expect(totalTime).toBeLessThan(5000); // Rate limiting should not add significant overhead
      
      await rateLimitedFramework.shutdown();
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle errors gracefully without performance degradation', async () => {
      const errorRequests = Array(10).fill(null).map((_, i) => 
        createMockRequest('newspaper_analysis', {
          sourceText: `Error test article ${i}`,
          analysisType: 'comprehensive'
        })
      );

      // Mock error responses
      for (let i = 0; i < 10; i++) {
        mockFetch.mockRejectedValueOnce(new Error('Simulated API error'));
      }

      const startTime = performance.now();
      const responses = await Promise.allSettled(
        errorRequests.map(request => framework.processRequest(request))
      );
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const averageErrorHandlingTime = totalTime / errorRequests.length;
      
      // All requests should be handled (even if they fail)
      expect(responses).toHaveLength(10);
      
      // Error handling should be fast
      expect(averageErrorHandlingTime).toBeLessThan(1000);
      
      // Should have proper error responses
      responses.forEach(response => {
        expect(response.status).toBe('fulfilled');
        if (response.status === 'fulfilled') {
          expect(response.value.success).toBe(false);
          expect(response.value.error).toBeDefined();
        }
      });
    });
  });

  describe('Scalability Benchmarks', () => {
    test('should maintain linear performance scaling', async () => {
      const testSizes = [5, 10, 20];
      const performanceMetrics: Array<{ size: number; timePerRequest: number }> = [];
      
      for (const size of testSizes) {
        const requests = Array(size).fill(null).map((_, i) => 
          createMockRequest('quiz_generation', {
            topic: `Scalability test ${i}`,
            difficulty: 'medium',
            count: 3
          })
        );

        // Mock responses
        for (let i = 0; i < size; i++) {
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => createMockOpenAIResponse({
              questions: Array(3).fill({ question: 'Q', options: ['A', 'B', 'C', 'D'], correct: 0 })
            })
          } as Response);
        }

        const startTime = performance.now();
        const responses = await Promise.all(
          requests.map(request => framework.processRequest(request))
        );
        const endTime = performance.now();
        
        const totalTime = endTime - startTime;
        const timePerRequest = totalTime / size;
        
        performanceMetrics.push({ size, timePerRequest });
        
        expect(responses.every(r => r.success)).toBe(true);
      }
      
      // Check that performance scales reasonably
      const smallScale = performanceMetrics[0];
      const largeScale = performanceMetrics[performanceMetrics.length - 1];
      const scalingRatio = largeScale.timePerRequest / smallScale.timePerRequest;
      
      // Performance should not degrade more than 2x when scale increases 4x
      expect(scalingRatio).toBeLessThan(2.0);
    });
  });

  describe('Resource Utilization', () => {
    test('should efficiently utilize system resources', async () => {
      const startCpuUsage = process.cpuUsage();
      const startTime = performance.now();
      
      // Process a batch of diverse requests
      const mixedRequests = [
        createMockRequest('newspaper_analysis', { sourceText: 'Article 1', analysisType: 'summary' }),
        createMockRequest('quiz_generation', { topic: 'Topic 1', difficulty: 'easy', count: 3 }),
        createMockRequest('writing_evaluation', { essay: 'Essay content 1', examType: 'mains' }),
        createMockRequest('newspaper_analysis', { sourceText: 'Article 2', analysisType: 'comprehensive' }),
        createMockRequest('quiz_generation', { topic: 'Topic 2', difficulty: 'hard', count: 5 })
      ];

      // Mock all responses
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => createMockOpenAIResponse({ upscRelevanceScore: 80 }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => createMockOpenAIResponse({ questions: [] }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => createMockOpenAIResponse({ score: 85 }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => createMockOpenAIResponse({ upscRelevanceScore: 90 }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => createMockOpenAIResponse({ questions: [] }) } as Response);

      const responses = await Promise.all(
        mixedRequests.map(request => framework.processRequest(request))
      );
      
      const endTime = performance.now();
      const endCpuUsage = process.cpuUsage(startCpuUsage);
      
      const totalTime = endTime - startTime;
      const cpuTimeMs = (endCpuUsage.user + endCpuUsage.system) / 1000;
      const cpuEfficiency = cpuTimeMs / totalTime;
      
      expect(responses.every(r => r.success)).toBe(true);
      expect(cpuEfficiency).toBeLessThan(0.8); // Should not use more than 80% CPU time
      expect(totalTime).toBeLessThan(8000); // Should complete within 8 seconds
    });
  });
});