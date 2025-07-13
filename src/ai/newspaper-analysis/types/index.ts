/**
 * @fileOverview Core types for modular newspaper analysis system
 */

import { z } from 'zod';

// Input schemas
export const NewspaperAnalysisInputSchema = z.object({
  sourceText: z.string().min(100).max(50000),
  examType: z.string().default('UPSC Civil Services'),
  analysisFocus: z.string(),
  outputLanguage: z.string().default('English'),
});

export type NewspaperAnalysisInput = z.infer<typeof NewspaperAnalysisInputSchema>;

// Question schemas
export const OptionSchema = z.object({
  text: z.string(),
  correct: z.boolean().optional(),
});

export const MCQSchema = z.object({
  question: z.string(),
  subject: z.string().optional(),
  explanation: z.string().optional(),
  difficulty: z.number().min(1).max(10).optional(),
  options: z.array(OptionSchema),
  syllabusTopic: z.string().optional(),
  questionType: z.enum(['multiple-statement', 'assertion-reason', 'matching-pairs', 'direct']).optional(),
  upscPattern: z.boolean().optional(),
  qualityScore: z.number().min(0).max(1).optional(),
});

export type MCQ = z.infer<typeof MCQSchema>;

export const MainsQuestionSchema = z.object({
  question: z.string(),
  guidance: z.string().optional(),
  difficulty: z.number().min(1).max(10).optional(),
  syllabusTopic: z.string().optional(),
  directive: z.enum(['Discuss', 'Critically analyze', 'Examine', 'Evaluate', 'Comment']).optional(),
  wordLimit: z.number().optional(),
  qualityScore: z.number().min(0).max(1).optional(),
});

export type MainsQuestion = z.infer<typeof MainsQuestionSchema>;

// Knowledge Graph schemas
export const KnowledgeGraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["Person", "Organization", "Location", "Policy", "Concept", "Date", "Statistic"]),
  verified: z.boolean().optional(),
});

export const KnowledgeGraphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string().min(3).max(40),
  confidence: z.number().min(0).max(1).optional(),
});

export const KnowledgeGraphSchema = z.object({
  nodes: z.array(KnowledgeGraphNodeSchema),
  edges: z.array(KnowledgeGraphEdgeSchema),
});

export type KnowledgeGraph = z.infer<typeof KnowledgeGraphSchema>;

// Analysis output schema
export const NewspaperAnalysisOutputSchema = z.object({
  summary: z.string().optional(),
  prelims: z.object({ mcqs: z.array(MCQSchema) }),
  mains: z.object({ questions: z.array(MainsQuestionSchema) }).optional(),
  knowledgeGraph: KnowledgeGraphSchema.optional(),
  syllabusTopic: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  qualityScore: z.number().optional(),
  questionsCount: z.number().optional(),
  upscRelevanceScore: z.number().min(0).max(1).optional(),
  timelineRelevance: z.boolean().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  cost: z.number().optional(),
  processingTime: z.number().optional(),
});

export type NewspaperAnalysisOutput = z.infer<typeof NewspaperAnalysisOutputSchema>;

// Agent-specific schemas
export const RelevanceAnalysisSchema = z.object({
  isRelevant: z.boolean(),
  syllabusTopic: z.string().nullable(),
  reasoning: z.string().optional(),
  confidenceScore: z.number().min(0).max(1),
  timelineRelevance: z.boolean(),
  examUtility: z.number().min(0).max(1),
  subjectAreas: z.array(z.string()),
});

export type RelevanceAnalysis = z.infer<typeof RelevanceAnalysisSchema>;

// Quality metrics
export interface QualityMetrics {
  upscPatternCompliance: number;
  difficultyCalibration: number;
  explanationQuality: number;
  syllabusAlignment: number;
  factualAccuracy: number;
  overallScore: number;
}

// Processing context
export interface ProcessingContext {
  startTime: number;
  inputTokens: number;
  outputTokens: number;
  agentCalls: Array<{
    agent: string;
    duration: number;
    tokens: number;
    success: boolean;
  }>;
}

// Error types
export class NewspaperAnalysisError extends Error {
  constructor(
    message: string,
    public code: string,
    public stage: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'NewspaperAnalysisError';
  }
}

// Streaming chunk types
export const NewspaperAnalysisChunkSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal('summary'), data: z.string() }),
  z.object({ type: z.literal('prelims'), data: MCQSchema }),
  z.object({ type: z.literal('mains'), data: MainsQuestionSchema }),
  z.object({ type: z.literal('knowledgeGraph'), data: KnowledgeGraphSchema }),
  z.object({ type: z.literal('metadata'), data: z.object({
    syllabusTopic: z.string().optional().nullable(),
    qualityScore: z.number().optional(),
    tags: z.array(z.string()).optional(),
    questionsCount: z.number().optional(),
    totalTokens: z.number().optional(),
    cost: z.number().optional()
  }) }),
  z.object({ type: z.literal('error'), data: z.string() }),
  z.object({ type: z.literal('progress'), data: z.object({
    stage: z.string(),
    progress: z.number().min(0).max(100)
  }) }),
]);

export type NewspaperAnalysisChunk = z.infer<typeof NewspaperAnalysisChunkSchema>;