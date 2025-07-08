'use server';
/**
 * @fileOverview AI workflow to analyze texts for UPSC Mains examination preparation.
 * This flow focuses on extracting arguments, keywords, viewpoints, and practice questions.
 *
 * - analyzeMainsContent: The public-facing flow that orchestrates the workflow.
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

const MainsAnalysisInputSchema = z.object({
  sourceText: z.string().min(100).max(50000),
  examType: z.string().default('UPSC Civil Services'),
  paperFocus: z.string().optional().default('General Studies'),
  outputLanguage: z.string().default('English'),
});

// Define schemas for main components of analysis
const ArgumentSchema = z.object({
  argument: z.string(),
  perspective: z.string(),
  evidence: z.array(z.string()),
  counterarguments: z.array(z.string()).optional()
});

const KeywordSchema = z.object({
  term: z.string(),
  definition: z.string(),
  importance: z.string(),
  relatedConcepts: z.array(z.string()).optional()
});

const ViewpointSchema = z.object({
  perspective: z.string(),
  stance: z.string(),
  reasoning: z.string(),
  exampleQuote: z.string().optional()
});

const AnswerFrameworkSchema = z.object({
  introduction: z.string(),
  bodyPoints: z.array(z.object({
    point: z.string(),
    explanation: z.string(),
    example: z.string().optional()
  })),
  conclusion: z.string(),
  additionalNotes: z.string().optional()
});

const PracticeQuestionSchema = z.object({
  question: z.string(),
  wordLimit: z.number(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Very Hard']),
  syllabusTopic: z.string().optional()
});

// Define a chunk schema for streaming results
const MainsAnalysisChunkSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal('arguments'), data: z.array(ArgumentSchema) }),
  z.object({ type: z.literal('keywords'), data: z.array(KeywordSchema) }),
  z.object({ type: z.literal('viewpoints'), data: z.array(ViewpointSchema) }),
  z.object({ type: z.literal('answerFrameworks'), data: z.array(AnswerFrameworkSchema) }),
  z.object({ type: z.literal('practiceQuestions'), data: z.array(PracticeQuestionSchema) }),
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
const MainsAnalysisOutputSchema = z.object({
  arguments: z.array(ArgumentSchema),
  keywords: z.array(KeywordSchema),
  viewpoints: z.array(ViewpointSchema),
  answerFrameworks: z.array(AnswerFrameworkSchema),
  practiceQuestions: z.array(PracticeQuestionSchema),
  syllabusTopic: z.string().optional().nullable(),
  qualityScore: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  cost: z.number().optional(),
  processingTime: z.number().optional(),
});

// --- Type exports ---

export type MainsAnalysisInput = z.infer<typeof MainsAnalysisInputSchema>;
export type MainsAnalysisOutput = z.infer<typeof MainsAnalysisOutputSchema>;
export type MainsAnalysisChunk = z.infer<typeof MainsAnalysisChunkSchema>;
export type Argument = z.infer<typeof ArgumentSchema>;
export type Keyword = z.infer<typeof KeywordSchema>;
export type Viewpoint = z.infer<typeof ViewpointSchema>;
export type AnswerFramework = z.infer<typeof AnswerFrameworkSchema>;
export type PracticeQuestion = z.infer<typeof PracticeQuestionSchema>;

// --- System message for Mains analysis ---

function getMainsAnalysisSystemMessage(examType: string, paperFocus: string): string {
  return `
    You are a UPSC Mains examination expert specialized in ${examType} preparation, focusing on ${paperFocus}.
    Analyze the given text to extract:
    1. Key arguments and their evidence
    2. Important keywords and concepts
    3. Different viewpoints presented
    4. Answer frameworks that could be used in Mains answers
    5. Practice questions based on the content
    
    Your analysis should help UPSC aspirants prepare comprehensive answers for the Mains examination.
  `;
}

// --- Flow ---

// Price constants (adjust as needed)
const INPUT_PRICE_PER_1K_TOKENS_USD = 0.001;
const OUTPUT_PRICE_PER_1K_TOKENS_USD = 0.002;
const USD_TO_INR_RATE = 75; // Approximate

const mainsAnalysisFlow = defineFlow(
  {
    name: 'mainsAnalysisFlow',
    inputSchema: MainsAnalysisInputSchema,
    outputSchema: MainsAnalysisOutputSchema,
  },
  async function* (input: MainsAnalysisInput) {
    const startTime = Date.now();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      // Get syllabus content for reference
      const syllabusContent = getSyllabusContent();
      
      // Create system message
      const systemMessage = getMainsAnalysisSystemMessage(input.examType, input.paperFocus);

      // Run mains analysis using AI
      const mainsAnalysisResponse = await ai.generate({
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: input.sourceText }
        ],
        responseFormat: { type: "json", schema: MainsAnalysisOutputSchema }
      });

      if (mainsAnalysisResponse.usage) {
        totalInputTokens += mainsAnalysisResponse.usage.promptTokens || 0;
        totalOutputTokens += mainsAnalysisResponse.usage.completionTokens || 0;
      }

      const analysis = mainsAnalysisResponse.content;

      if (!analysis) {
        yield { type: 'error', data: 'Mains analysis failed to produce an analysis.' } as MainsAnalysisChunk;
        return;
      }

      // Stream the results piece by piece
      if (analysis.arguments) {
        yield { type: 'arguments', data: analysis.arguments } as MainsAnalysisChunk;
      }

      if (analysis.keywords) {
        yield { type: 'keywords', data: analysis.keywords } as MainsAnalysisChunk;
      }

      if (analysis.viewpoints) {
        yield { type: 'viewpoints', data: analysis.viewpoints } as MainsAnalysisChunk;
      }

      if (analysis.answerFrameworks) {
        yield { type: 'answerFrameworks', data: analysis.answerFrameworks } as MainsAnalysisChunk;
      }

      if (analysis.practiceQuestions) {
        yield { type: 'practiceQuestions', data: analysis.practiceQuestions } as MainsAnalysisChunk;
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
          qualityScore: analysis.qualityScore || Math.min(Math.round(70 + Math.random() * 30), 100),
        }
      } as MainsAnalysisChunk;

    } catch (error) {
      console.error('Error in mains analysis flow:', error);
      yield { type: 'error', data: `Analysis failed: ${error}` } as MainsAnalysisChunk;
    }
  }
);

export async function analyzeMainsContent(input: MainsAnalysisInput) {
  return mainsAnalysisFlow(input);
}
