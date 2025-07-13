/**
 * @fileOverview Core types for the multi-agent framework
 */

import { z } from 'zod';

// Base request/response schemas
export const BaseRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string().optional(),
  timestamp: z.number(),
  context: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const BaseResponseSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  success: z.boolean(),
  timestamp: z.number(),
  processingTime: z.number(),
  agentId: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type BaseRequest = z.infer<typeof BaseRequestSchema>;
export type BaseResponse = z.infer<typeof BaseResponseSchema>;

// Agent capability definitions
export interface AgentCapability {
  intent: string;
  description: string;
  inputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
  examples: Array<{ input: any; output: any }>;
  confidence: number; // 0-1 how confident this agent is for this intent
}

export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  category: AgentCategory;
  capabilities: AgentCapability[];
  dependencies?: string[];
  resourceRequirements: ResourceRequirements;
  status: AgentStatus;
}

export enum AgentCategory {
  CONTENT_ANALYSIS = 'content_analysis',
  WRITING_SUPPORT = 'writing_support', 
  KNOWLEDGE = 'knowledge',
  UTILITY = 'utility',
  ORCHESTRATION = 'orchestration'
}

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

export interface ResourceRequirements {
  maxTokens: number;
  estimatedLatency: number; // milliseconds
  memoryUsage: number; // MB
  costPerRequest: number; // USD
}

// Intent classification
export interface Intent {
  name: string;
  confidence: number;
  extractedEntities: Record<string, any>;
  context: Record<string, any>;
}

export interface IntentClassificationResult {
  primaryIntent: Intent;
  secondaryIntents: Intent[];
  ambiguous: boolean;
  confidence: number;
}

// Agent execution context
export interface ExecutionContext {
  requestId: string;
  userId: string;
  sessionId?: string;
  parentAgentId?: string;
  depth: number; // for preventing infinite recursion
  sharedState: Record<string, any>;
  constraints: ExecutionConstraints;
}

export interface ExecutionConstraints {
  maxExecutionTime: number; // milliseconds
  maxTokens: number;
  maxCost: number; // USD
  allowSubAgents: boolean;
  retryCount: number;
}

// Multi-agent coordination
export interface AgentTask {
  id: string;
  agentId: string;
  input: any;
  dependencies: string[]; // other task IDs
  priority: TaskPriority;
  status: TaskStatus;
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running', 
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  tasks: AgentTask[];
  executionPlan: ExecutionPlan;
  status: WorkflowStatus;
}

export interface ExecutionPlan {
  parallel: string[][]; // arrays of task IDs that can run in parallel
  sequential: string[]; // task IDs that must run sequentially
  conditional: Array<{
    condition: string;
    ifTrue: string[];
    ifFalse: string[];
  }>;
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  COMPLETED = 'completed', 
  FAILED = 'failed',
  PAUSED = 'paused'
}

// Monitoring and analytics
export interface AgentMetrics {
  agentId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  averageTokens: number;
  totalCost: number;
  lastActivity: Date;
  errorRate: number;
  qualityScore: number;
}

export interface SystemMetrics {
  totalAgents: number;
  activeAgents: number;
  totalRequests: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  systemLoad: number;
  errorRate: number;
  costPerHour: number;
}

// Configuration
export interface FrameworkConfig {
  openai: {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  orchestrator: {
    intentClassificationModel: string;
    maxConcurrentTasks: number;
    defaultTimeout: number;
    retryPolicy: RetryPolicy;
  };
  monitoring: {
    enableMetrics: boolean;
    enableLogging: boolean;
    logLevel: LogLevel;
    metricsInterval: number;
  };
  security: {
    enableRateLimit: boolean;
    requestsPerMinute: number;
    enableAuth: boolean;
    allowedOrigins: string[];
  };
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn', 
  ERROR = 'error'
}

// Specific request types for different tools
export const NewspaperAnalysisRequestSchema = BaseRequestSchema.extend({
  type: z.literal('newspaper_analysis'),
  data: z.object({
    sourceText: z.string().min(100).max(50000),
    analysisType: z.enum(['comprehensive', 'summary', 'questions', 'critical']),
    examType: z.string().default('UPSC Civil Services'),
    outputLanguage: z.string().default('English'),
    sourceUrl: z.string().url().optional(),
  })
});

export const QuizGenerationRequestSchema = BaseRequestSchema.extend({
  type: z.literal('quiz_generation'),
  data: z.object({
    topic: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    questionCount: z.number().min(1).max(50),
    questionType: z.enum(['mcq', 'true_false', 'short_answer']),
    syllabus: z.string().optional(),
  })
});

export const WritingEvaluationRequestSchema = BaseRequestSchema.extend({
  type: z.literal('writing_evaluation'),
  data: z.object({
    text: z.string().min(50),
    evaluationType: z.enum(['essay', 'answer', 'summary']),
    criteria: z.array(z.string()).optional(),
    targetWordCount: z.number().optional(),
  })
});

export const MockInterviewRequestSchema = BaseRequestSchema.extend({
  type: z.literal('mock_interview'),
  data: z.object({
    interviewType: z.enum(['personality', 'technical', 'current_affairs']),
    duration: z.number().min(5).max(60), // minutes
    background: z.string().optional(),
    focusAreas: z.array(z.string()).optional(),
  })
});

export type NewspaperAnalysisRequest = z.infer<typeof NewspaperAnalysisRequestSchema>;
export type QuizGenerationRequest = z.infer<typeof QuizGenerationRequestSchema>;
export type WritingEvaluationRequest = z.infer<typeof WritingEvaluationRequestSchema>;
export type MockInterviewRequest = z.infer<typeof MockInterviewRequestSchema>;

// Union type for all request types
export type AgentRequest = NewspaperAnalysisRequest | QuizGenerationRequest | WritingEvaluationRequest | MockInterviewRequest;

// Response schemas
export const NewspaperAnalysisResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    summary: z.string().optional(),
    relevanceScore: z.number().min(0).max(1),
    questions: z.array(z.object({
      type: z.enum(['prelims', 'mains']),
      question: z.string(),
      options: z.array(z.string()).optional(),
      difficulty: z.number().min(1).max(10),
      explanation: z.string().optional(),
    })).optional(),
    keyEntities: z.array(z.object({
      name: z.string(),
      type: z.string(),
      importance: z.number().min(0).max(1),
    })).optional(),
    syllabusTopic: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional()
});

export type NewspaperAnalysisResponse = z.infer<typeof NewspaperAnalysisResponseSchema>;

// Error types
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public agentId: string,
    public retryable: boolean = false,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class OrchestratorError extends Error {
  constructor(
    message: string,
    public code: string,
    public phase: 'intent_classification' | 'agent_selection' | 'execution' | 'coordination',
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'OrchestratorError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any,
    public schema: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}