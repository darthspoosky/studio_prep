/**
 * @fileOverview Comprehensive tests for Multi-Agent Framework
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createMultiAgentFramework, MultiAgentFramework } from '../index';
import { NewspaperAnalysisRequest, QuizGenerationRequest } from '../core/types';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  isRelevant: true,
                  relevanceScore: 0.9,
                  syllabusTopic: 'GS Paper II - Governance',
                  reasoning: 'Test reasoning',
                  confidenceScore: 0.85,
                  timelineRelevant: true,
                  examUtility: 0.8,
                  subjectAreas: ['Polity', 'Governance']
                })
              }
            }],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 200,
              total_tokens: 300
            }
          })
        }
      }
    }))
  };
});

describe('Multi-Agent Framework', () => {
  let framework: MultiAgentFramework;

  beforeEach(async () => {
    framework = createMultiAgentFramework({
      openai: {
        apiKey: 'test-api-key'
      },
      monitoring: {
        enableLogging: false,
        enableMetrics: true
      }
    });
    
    await framework.start();
  });

  afterEach(async () => {
    await framework.shutdown();
  });

  describe('Framework Initialization', () => {
    test('should initialize successfully', () => {
      expect(framework).toBeDefined();
    });

    test('should have registered core agents', () => {
      const stats = framework.getStats();
      expect(stats.agents.totalAgents).toBeGreaterThan(0);
      expect(stats.agents.activeAgents).toBeGreaterThan(0);
    });

    test('should have orchestrator and registry', () => {
      const orchestrator = framework.getOrchestrator();
      const registry = framework.getAgentRegistry();
      
      expect(orchestrator).toBeDefined();
      expect(registry).toBeDefined();
    });
  });

  describe('Newspaper Analysis Agent', () => {
    test('should process newspaper analysis request', async () => {
      const request: NewspaperAnalysisRequest = {
        id: 'test_news_001',
        userId: 'test_user',
        timestamp: Date.now(),
        type: 'newspaper_analysis',
        data: {
          sourceText: 'The Supreme Court today delivered a landmark judgment on digital privacy rights. The court emphasized the importance of data protection in the digital age.',
          analysisType: 'comprehensive',
          examType: 'UPSC Civil Services',
          outputLanguage: 'English'
        }
      };

      const response = await framework.processRequest(request);
      
      expect(response.success).toBe(true);
      expect(response.agentId).toBe('newspaper_analysis_agent');
      expect(response.processingTime).toBeGreaterThan(0);
      expect(response.data).toBeDefined();
    });

    test('should handle invalid newspaper analysis request', async () => {
      const request: NewspaperAnalysisRequest = {
        id: 'test_news_002',
        userId: 'test_user',
        timestamp: Date.now(),
        type: 'newspaper_analysis',
        data: {
          sourceText: 'Too short', // Invalid - too short
          analysisType: 'comprehensive',
          examType: 'UPSC Civil Services',
          outputLanguage: 'English'
        }
      };

      await expect(framework.processRequest(request)).rejects.toThrow();
    });

    test('should return structured response format', async () => {
      const request: NewspaperAnalysisRequest = {
        id: 'test_news_003',
        userId: 'test_user',
        timestamp: Date.now(),
        type: 'newspaper_analysis',
        data: {
          sourceText: 'The government announced new economic policies focusing on digital infrastructure development. The initiative aims to boost technological adoption across various sectors.',
          analysisType: 'comprehensive',
          examType: 'UPSC Civil Services',
          outputLanguage: 'English'
        }
      };

      const response = await framework.processRequest(request);
      
      expect(response.data).toHaveProperty('relevanceScore');
      expect(response.data).toHaveProperty('syllabusTopic');
      expect(response.data).toHaveProperty('tags');
      expect(typeof response.data.relevanceScore).toBe('number');
    });
  });

  describe('Quiz Generation Agent', () => {
    test('should process quiz generation request', async () => {
      const request: QuizGenerationRequest = {
        id: 'test_quiz_001',
        userId: 'test_user',
        timestamp: Date.now(),
        type: 'quiz_generation',
        data: {
          topic: 'Indian Constitution',
          difficulty: 'medium',
          questionCount: 5,
          questionType: 'mcq'
        }
      };

      const response = await framework.processRequest(request);
      
      expect(response.success).toBe(true);
      expect(response.agentId).toBe('quiz_generation_agent');
      expect(response.data).toBeDefined();
    });

    test('should validate question count limits', async () => {
      const request: QuizGenerationRequest = {
        id: 'test_quiz_002',
        userId: 'test_user',
        timestamp: Date.now(),
        type: 'quiz_generation',
        data: {
          topic: 'Test Topic',
          difficulty: 'easy',
          questionCount: 100, // Invalid - too many
          questionType: 'mcq'
        }
      };

      await expect(framework.processRequest(request)).rejects.toThrow();
    });
  });

  describe('Agent Registry', () => {
    test('should maintain agent health status', async () => {
      const registry = framework.getAgentRegistry();
      const healthResults = await registry.performHealthCheck();
      
      expect(healthResults).toBeDefined();
      expect(healthResults.size).toBeGreaterThan(0);
      
      // All agents should be healthy in test environment
      for (const [agentId, isHealthy] of healthResults) {
        expect(isHealthy).toBe(true);
      }
    });

    test('should provide accurate statistics', () => {
      const registry = framework.getAgentRegistry();
      const stats = registry.getStats();
      
      expect(stats.totalAgents).toBeGreaterThan(0);
      expect(stats.activeAgents).toBeLessThanOrEqual(stats.totalAgents);
      expect(stats.agentsByCategory).toBeDefined();
      expect(stats.agentsByStatus).toBeDefined();
    });

    test('should find agents for specific intents', () => {
      const registry = framework.getAgentRegistry();
      
      const newspaperAgents = registry.findAgentsForIntent('newspaper_analysis');
      expect(newspaperAgents.length).toBeGreaterThan(0);
      expect(newspaperAgents[0].confidence).toBeGreaterThan(0);
      
      const quizAgents = registry.findAgentsForIntent('quiz_generation');
      expect(quizAgents.length).toBeGreaterThan(0);
      expect(quizAgents[0].confidence).toBeGreaterThan(0);
    });
  });

  describe('Orchestrator', () => {
    test('should route requests to appropriate agents', async () => {
      const orchestrator = framework.getOrchestrator();
      
      const newsRequest: NewspaperAnalysisRequest = {
        id: 'orchestrator_test_001',
        userId: 'test_user',
        timestamp: Date.now(),
        type: 'newspaper_analysis',
        data: {
          sourceText: 'Government policy article for testing orchestrator routing capabilities.',
          analysisType: 'summary',
          examType: 'UPSC Civil Services',
          outputLanguage: 'English'
        }
      };

      const response = await framework.processRequest(newsRequest);
      
      expect(response.agentId).toBe('newspaper_analysis_agent');
      expect(response.metadata?.orchestratorInfo).toBeDefined();
      expect(response.metadata?.orchestratorInfo?.intentClassification).toBeDefined();
    });

    test('should handle execution context properly', async () => {
      const request: NewspaperAnalysisRequest = {
        id: 'context_test_001',
        userId: 'test_user',
        sessionId: 'test_session',
        timestamp: Date.now(),
        type: 'newspaper_analysis',
        data: {
          sourceText: 'Test article for context validation in the multi-agent framework system.',
          analysisType: 'comprehensive',
          examType: 'UPSC Civil Services',
          outputLanguage: 'English'
        }
      };

      const response = await framework.processRequest(request);
      
      expect(response.requestId).toBe(request.id);
      expect(response.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed requests gracefully', async () => {
      const malformedRequest = {
        id: 'malformed_001',
        userId: 'test_user',
        timestamp: Date.now(),
        type: 'invalid_type', // Invalid type
        data: {}
      };

      await expect(framework.processRequest(malformedRequest as any)).rejects.toThrow();
    });

    test('should handle missing required fields', async () => {
      const incompleteRequest = {
        id: 'incomplete_001',
        userId: 'test_user',
        timestamp: Date.now(),
        type: 'newspaper_analysis',
        // Missing data field
      };

      await expect(framework.processRequest(incompleteRequest as any)).rejects.toThrow();
    });
  });

  describe('Performance Metrics', () => {
    test('should track processing times', async () => {
      const request: NewspaperAnalysisRequest = {
        id: 'perf_test_001',
        userId: 'test_user',
        timestamp: Date.now(),
        type: 'newspaper_analysis',
        data: {
          sourceText: 'Performance testing article to measure response times and system efficiency.',
          analysisType: 'summary',
          examType: 'UPSC Civil Services',
          outputLanguage: 'English'
        }
      };

      const startTime = Date.now();
      const response = await framework.processRequest(request);
      const endTime = Date.now();
      
      expect(response.processingTime).toBeGreaterThan(0);
      expect(response.processingTime).toBeLessThan(endTime - startTime + 100); // Allow 100ms tolerance
    });

    test('should provide system metrics', () => {
      const stats = framework.getStats();
      
      expect(stats.framework.initialized).toBe(true);
      expect(stats.framework.uptime).toBeGreaterThan(0);
      expect(stats.system.totalAgents).toBeGreaterThan(0);
      expect(stats.system.activeAgents).toBeGreaterThan(0);
    });
  });
});

describe('Individual Agent Tests', () => {
  describe('Base Agent Functionality', () => {
    test('should validate input schemas', async () => {
      const framework = createMultiAgentFramework({
        openai: { apiKey: 'test-key' }
      });
      
      await framework.start();
      
      const registry = framework.getAgentRegistry();
      const agents = registry.getActiveAgents();
      
      expect(agents.length).toBeGreaterThan(0);
      
      // Test capability checking
      const newsAgent = agents.find(a => a.getMetadata().id === 'newspaper_analysis_agent');
      expect(newsAgent).toBeDefined();
      
      const capability = newsAgent!.canHandle('newspaper_analysis', {
        sourceText: 'Valid test content',
        analysisType: 'comprehensive'
      });
      
      expect(capability.capable).toBe(true);
      expect(capability.confidence).toBeGreaterThan(0);
      
      await framework.shutdown();
    });
  });
});

describe('Integration Tests', () => {
  test('should handle concurrent requests', async () => {
    const framework = createMultiAgentFramework({
      openai: { apiKey: 'test-key' },
      orchestrator: { maxConcurrentTasks: 5 }
    });
    
    await framework.start();
    
    const requests = Array.from({ length: 3 }, (_, i) => ({
      id: `concurrent_${i}`,
      userId: 'test_user',
      timestamp: Date.now(),
      type: 'newspaper_analysis' as const,
      data: {
        sourceText: `Concurrent test article number ${i} for testing parallel processing capabilities.`,
        analysisType: 'summary' as const,
        examType: 'UPSC Civil Services',
        outputLanguage: 'English'
      }
    }));

    const promises = requests.map(req => framework.processRequest(req));
    const responses = await Promise.all(promises);
    
    expect(responses.length).toBe(3);
    responses.forEach(response => {
      expect(response.success).toBe(true);
      expect(response.processingTime).toBeGreaterThan(0);
    });
    
    await framework.shutdown();
  });

  test('should maintain state isolation between requests', async () => {
    const framework = createMultiAgentFramework({
      openai: { apiKey: 'test-key' }
    });
    
    await framework.start();
    
    const request1: NewspaperAnalysisRequest = {
      id: 'isolation_test_1',
      userId: 'user_1',
      timestamp: Date.now(),
      type: 'newspaper_analysis',
      data: {
        sourceText: 'First article about economic policy and its implications.',
        analysisType: 'comprehensive',
        examType: 'UPSC Civil Services',
        outputLanguage: 'English'
      }
    };

    const request2: NewspaperAnalysisRequest = {
      id: 'isolation_test_2',
      userId: 'user_2',
      timestamp: Date.now(),
      type: 'newspaper_analysis',
      data: {
        sourceText: 'Second article about technology and digital transformation.',
        analysisType: 'summary',
        examType: 'UPSC Civil Services',
        outputLanguage: 'Hindi'
      }
    };

    const [response1, response2] = await Promise.all([
      framework.processRequest(request1),
      framework.processRequest(request2)
    ]);
    
    expect(response1.requestId).toBe(request1.id);
    expect(response2.requestId).toBe(request2.id);
    expect(response1.requestId).not.toBe(response2.requestId);
    
    await framework.shutdown();
  });
});

// Performance benchmarks
describe('Performance Benchmarks', () => {
  test('should process requests within acceptable time limits', async () => {
    const framework = createMultiAgentFramework({
      openai: { apiKey: 'test-key' }
    });
    
    await framework.start();
    
    const request: NewspaperAnalysisRequest = {
      id: 'benchmark_001',
      userId: 'test_user',
      timestamp: Date.now(),
      type: 'newspaper_analysis',
      data: {
        sourceText: 'Benchmark test article to measure processing performance and response times within acceptable limits.',
        analysisType: 'comprehensive',
        examType: 'UPSC Civil Services',
        outputLanguage: 'English'
      }
    };

    const startTime = Date.now();
    const response = await framework.processRequest(request);
    const endTime = Date.now();
    
    const totalTime = endTime - startTime;
    
    // Should complete within 30 seconds (generous limit for test environment)
    expect(totalTime).toBeLessThan(30000);
    expect(response.success).toBe(true);
    
    await framework.shutdown();
  }, 35000); // 35 second timeout for this test
});