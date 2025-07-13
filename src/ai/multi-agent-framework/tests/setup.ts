/**
 * @fileOverview Test setup for Multi-Agent Framework
 */

import 'openai/shims/node';
import { jest } from '@jest/globals';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';

// Global test configuration
beforeAll(() => {
  // Suppress console logs during tests unless DEBUG is set
  if (!process.env.DEBUG) {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  }
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Utility functions for tests
export const createMockRequest = (type: string, data: any) => ({
  id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  userId: 'test_user',
  timestamp: Date.now(),
  type,
  data
});

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createMockOpenAIResponse = (content: any) => ({
  choices: [{
    message: {
      content: typeof content === 'string' ? content : JSON.stringify(content)
    }
  }],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 200,
    total_tokens: 300
  }
});

// Mock fetch for API tests
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;