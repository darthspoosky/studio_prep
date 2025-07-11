/**
 * AI Providers Configuration
 * Centralized configuration for OpenAI, Claude, and Google Vision APIs
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// OpenAI Configuration
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Anthropic Configuration  
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Model configurations
export const AI_MODELS = {
  openai: {
    gpt4Turbo: 'gpt-4-turbo-preview',
    gpt4: 'gpt-4',
    gpt35Turbo: 'gpt-3.5-turbo',
  },
  anthropic: {
    claude3Sonnet: 'claude-3-5-sonnet-20241022',
    claude3Haiku: 'claude-3-haiku-20240307',
  },
  google: {
    vision: 'projects/your-project-id/locations/us-central1/endpoints/your-endpoint',
  }
} as const;

// Pricing configuration (tokens per dollar)
export const AI_PRICING = {
  openai: {
    'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
  },
  anthropic: {
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  }
} as const;

// Rate limiting configuration
export const RATE_LIMITS = {
  openai: {
    requestsPerMinute: 100,
    tokensPerMinute: 150000,
  },
  anthropic: {
    requestsPerMinute: 50,
    tokensPerMinute: 100000,
  }
} as const;

// Default parameters for different use cases
export const DEFAULT_PARAMS = {
  evaluation: {
    temperature: 0.3,
    maxTokens: 2000,
  },
  realtime: {
    temperature: 0.5,
    maxTokens: 500,
  },
  analysis: {
    temperature: 0.2,
    maxTokens: 3000,
  }
} as const;