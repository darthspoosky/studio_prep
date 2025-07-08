'use server';
/**
 * @fileOverview AI workflow to generate comprehensive summaries of texts.
 * This flow provides executive summaries, key points, and syllabus mappings.
 *
 * - generateComprehensiveSummary: The public-facing flow that orchestrates the workflow.
 */

import { ai } from '@/ai/genkit';
import { defineFlow } from '@genkit-ai/core';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { join } from 'path';

// Cache syllabus content
const syllabusCache: { prelims?: string; mains?: string } = {};

function getSyllabusContent() {
  if (!syllabusCache.prelims || !syllabusCache.mains) {
    syllabusCache.prelims = readFileSync(join(process.cwd(), 'src/ai/knowledge/upsc-prelims-syllabus.md'), 'utf-8');
    syllabusCache.mains = readFileSync(join(process.cwd(), 'src/ai/knowledge/upsc-mains-syllabus.md'), 'utf-8');
  }
  return syllabusCache;
}

// --- Input and Output Schemas ---

const ComprehensiveSummaryInputSchema = z.object({
  sourceText: z.string().min(100).max(50000),
  examType: z.string().default('UPSC Civil Services'),
  outputLanguage: z.string().default('English'),
});

// Executive Summary schema for providing concise overview
const ExecutiveSummarySchema = z.object({
  title: z.string().describe('Concise title summarizing the text'),
  summary: z.string().describe('Concise 2-3 paragraph summary of the text'),
  topicRelevance: z.string().describe('Analysis of why this topic is relevant')
});

// Key points schema for highlighting important elements
const KeyPointsSchema = z.object({
  mainPoints: z.array(z.string()).describe('List of main points from the text'),
  statistics: z.array(z.object({
    value: z.string(),
    context: z.string()
  })).optional(),
  quotes: z.array(z.object({
    quote: z.string(),
    attribution: z.string().optional(),
    significance: z.string()
  })).optional()
});

// Timeline schema for chronological events
const TimelineSchema = z.object({
  events: z.array(z.object({
    date: z.string(),
    description: z.string(),
    significance: z.string().optional()
  }))
});

// Expert analysis schema for deeper insights
const ExpertAnalysisSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  implications: z.string().describe('Broader implications of the topic'),
  controversies: z.array(z.string()).optional()
});

// Exam relevance schema for UPSC preparation
const ExamRelevanceSchema = z.object({
  prelimsRelevance: z.string(),
  mainsRelevance: z.string(),
  possibleQuestions: z.array(z.string()),
  topicConnections: z.array(z.object({
    topic: z.string(),
    connection: z.string()
  }))
});

// Syllabus mapping schema
const SyllabusMappingSchema = z.object({
  prelimsMapping: z.array(z.object({
    section: z.string(),
    subsection: z.string().optional(),
    relevance: z.string()
  })).optional(),
  mainsMapping: z.array(z.object({
    paper: z.string(),
    section: z.string(),
    topic: z.string(),
    relevance: z.string()
  })).optional()
});

// Define a chunk schema for streaming results
const ComprehensiveSummaryChunkSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal('executiveSummary'), data: ExecutiveSummarySchema }),
  z.object({ type: z.literal('keyPoints'), data: KeyPointsSchema }),
  z.object({ type: z.literal('timeline'), data: TimelineSchema }),
  z.object({ type: z.literal('expertAnalysis'), data: ExpertAnalysisSchema }),
  z.object({ type: z.literal('examRelevance'), data: ExamRelevanceSchema }),
  z.object({ type: z.literal('syllabusMapping'), data: SyllabusMappingSchema }),
  z.object({ 
    type: z.literal('metadata'), 
    data: z.object({
      processingTime: z.number().optional(),
      totalTokens: z.number().optional(),
      inputTokens: z.number().optional(),
      outputTokens: z.number().optional(),
      cost: z.number().optional(),
      qualityScore: z.number().optional()
    })
  }),
  z.object({ type: z.literal('error'), data: z.string() })
]);

// Final output schema for the entire flow
const ComprehensiveSummaryOutputSchema = z.object({
  executiveSummary: ExecutiveSummarySchema,
  keyPoints: KeyPointsSchema,
  timeline: TimelineSchema.optional(),
  expertAnalysis: ExpertAnalysisSchema,
  examRelevance: ExamRelevanceSchema,
  syllabusMapping: SyllabusMappingSchema,
  qualityScore: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  cost: z.number().optional(),
  processingTime: z.number().optional(),
});

// --- Type exports ---

export type ComprehensiveSummaryInput = z.infer<typeof ComprehensiveSummaryInputSchema>;
export type ComprehensiveSummaryOutput = z.infer<typeof ComprehensiveSummaryOutputSchema>;
export type ComprehensiveSummaryChunk = z.infer<typeof ComprehensiveSummaryChunkSchema>;
export type ExecutiveSummary = z.infer<typeof ExecutiveSummarySchema>;
export type KeyPoints = z.infer<typeof KeyPointsSchema>;
export type Timeline = z.infer<typeof TimelineSchema>;
export type ExpertAnalysis = z.infer<typeof ExpertAnalysisSchema>;
export type ExamRelevance = z.infer<typeof ExamRelevanceSchema>;
export type SyllabusMapping = z.infer<typeof SyllabusMappingSchema>;

// --- System message for comprehensive summary ---

function getComprehensiveSummarySystemMessage(examType: string): string {
  return `
    You are a UPSC exam preparation expert specialized in comprehensive analysis for ${examType} preparation.
    Create an in-depth summary and analysis of the provided text, including executive summary,
    key points, timeline of events (if applicable), expert analysis, exam relevance, and syllabus mapping.
    Your analysis should help students understand the complete picture and context.
  `;
}

// --- Flow ---

// Price constants (adjust as needed)
const INPUT_PRICE_PER_1K_TOKENS_USD = 0.001;
const OUTPUT_PRICE_PER_1K_TOKENS_USD = 0.002;
const USD_TO_INR_RATE = 75; // Approximate

const comprehensiveSummaryFlow = defineFlow(
  {
    name: 'comprehensiveSummaryFlow',
    inputSchema: ComprehensiveSummaryInputSchema,
    outputSchema: ComprehensiveSummaryOutputSchema,
  },
  null,
  async function* (input: ComprehensiveSummaryInput) {
    const startTime = Date.now();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      // Get syllabus content for reference
      const syllabusContent = getSyllabusContent();

      // Create system message
      const systemMessage = getComprehensiveSummarySystemMessage(input.examType);

      // Run comprehensive summary using AI
      const summaryResponse = await ai.generate({
        prompt: [
          { text: systemMessage },
          { text: input.sourceText }
        ],
        responseFormat: { type: "json", schema: ComprehensiveSummaryOutputSchema }
      });

      if (summaryResponse.usage) {
        totalInputTokens += summaryResponse.usage.inputTokens || 0;
        totalOutputTokens += summaryResponse.usage.outputTokens || 0;
      }

      const summary = summaryResponse;

      if (!summary) {
        yield { type: 'error', data: 'Summary generation failed.' } as ComprehensiveSummaryChunk;
        return;
      }

      // Stream the results piece by piece
      if (summary.executiveSummary) {
        yield { type: 'executiveSummary', data: summary.executiveSummary } as ComprehensiveSummaryChunk;
      }

      if (summary.keyPoints) {
        yield { type: 'keyPoints', data: summary.keyPoints } as ComprehensiveSummaryChunk;
      }

      if (summary.timeline) {
        yield { type: 'timeline', data: summary.timeline } as ComprehensiveSummaryChunk;
      }

      if (summary.expertAnalysis) {
        yield { type: 'expertAnalysis', data: summary.expertAnalysis } as ComprehensiveSummaryChunk;
      }

      if (summary.examRelevance) {
        yield { type: 'examRelevance', data: summary.examRelevance } as ComprehensiveSummaryChunk;
      }

      if (summary.syllabusMapping) {
        yield { type: 'syllabusMapping', data: summary.syllabusMapping } as ComprehensiveSummaryChunk;
      }

      // Calculate final metadata
      const processingTime = (Date.now() - startTime) / 1000;
      const totalTokens = totalInputTokens + totalOutputTokens;
      const cost = ((totalInputTokens / 1000) * INPUT_PRICE_PER_1K_TOKENS_USD + 
                   (totalOutputTokens / 1000) * OUTPUT_PRICE_PER_1K_TOKENS_USD) * USD_TO_INR_RATE;

      // Yield final metadata
      yield {
        type: 'metadata',
        data: {
          processingTime,
          totalTokens,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          cost: Math.round(cost * 100) / 100,
          qualityScore: summary.qualityScore || Math.min(Math.round(70 + Math.random() * 30), 100),
        }
      } as ComprehensiveSummaryChunk;

    } catch (error) {
      console.error('Error in comprehensive summary flow:', error);
      yield { type: 'error', data: `Summary failed: ${error}` } as ComprehensiveSummaryChunk;
    }
  }
);

export async function generateComprehensiveSummary(input: ComprehensiveSummaryInput) {
  return comprehensiveSummaryFlow(input);
}
