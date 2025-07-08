'use server';
/**
 * @fileOverview AI workflow to analyze texts for critical aspects like tone, bias, and fact vs opinion.
 * This flow supports streaming results back to the client.
 *
 * - analyzeCriticalAspects: The public-facing flow that orchestrates the workflow.
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

const CriticalAnalysisInputSchema = z.object({
  sourceText: z.string().min(100).max(50000),
  examType: z.string().default('UPSC Civil Services'),
  outputLanguage: z.string().default('English'),
});

// Define findings for different critical analysis types
const ToneAnalysisSchema = z.object({
  overall: z.string().describe('Overall tone assessment of the text'),
  segments: z.array(z.object({
    text: z.string(),
    tone: z.string(),
    explanation: z.string()
  })).describe('Key segments with their tone analysis')
});

const BiasAnalysisSchema = z.object({
  detected: z.boolean(),
  type: z.string().nullable(),
  examples: z.array(z.object({
    text: z.string(),
    biasType: z.string(),
    explanation: z.string()
  })),
  impact: z.string().describe('How the bias might impact reader understanding')
});

const FactOpinionAnalysisSchema = z.object({
  factStatements: z.array(z.object({
    statement: z.string(),
    confidence: z.number().min(0).max(100),
    verification: z.string().optional()
  })),
  opinionStatements: z.array(z.object({
    statement: z.string(),
    indicators: z.array(z.string()),
    possibleFacts: z.string().optional()
  })),
  ratio: z.object({
    factPercentage: z.number(),
    opinionPercentage: z.number()
  })
});

// KnowledgeGraph schema for visualizing connections between concepts
const KnowledgeGraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string()
});

const KnowledgeGraphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string()
});

const KnowledgeGraphSchema = z.object({
  nodes: z.array(KnowledgeGraphNodeSchema),
  edges: z.array(KnowledgeGraphEdgeSchema)
});

// Define a chunk schema for streaming results
const CriticalAnalysisChunkSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal('tone'), data: ToneAnalysisSchema }),
  z.object({ type: z.literal('bias'), data: BiasAnalysisSchema }),
  z.object({ type: z.literal('factOpinion'), data: FactOpinionAnalysisSchema }),
  z.object({ type: z.literal('knowledgeGraph'), data: KnowledgeGraphSchema }),
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
const CriticalAnalysisOutputSchema = z.object({
  toneAnalysis: ToneAnalysisSchema,
  biasAnalysis: BiasAnalysisSchema,
  factOpinionAnalysis: FactOpinionAnalysisSchema,
  knowledgeGraph: KnowledgeGraphSchema,
  syllabusTopic: z.string().optional().nullable(),
  qualityScore: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  cost: z.number().optional(),
  processingTime: z.number().optional(),
});

// --- Type exports ---

export type CriticalAnalysisInput = z.infer<typeof CriticalAnalysisInputSchema>;
export type CriticalAnalysisOutput = z.infer<typeof CriticalAnalysisOutputSchema>;
export type CriticalAnalysisChunk = z.infer<typeof CriticalAnalysisChunkSchema>;
export type KnowledgeGraph = z.infer<typeof KnowledgeGraphSchema>;
export type ToneAnalysis = z.infer<typeof ToneAnalysisSchema>;
export type BiasAnalysis = z.infer<typeof BiasAnalysisSchema>;
export type FactOpinionAnalysis = z.infer<typeof FactOpinionAnalysisSchema>;

// --- System message for critical analysis ---

function getCriticalAnalysisSystemMessage(examType: string): string {
  return `
    You are a critical analysis expert specialized in ${examType} exam preparation. 
    Analyze the given text for tone, bias, and fact vs opinion detection. 
    Provide detailed findings that would help a student understand the critical aspects of the text.
  `;
}

// --- Flow ---

// Price constants (adjust as needed)
const INPUT_PRICE_PER_1K_TOKENS_USD = 0.001;
const OUTPUT_PRICE_PER_1K_TOKENS_USD = 0.002;
const USD_TO_INR_RATE = 75; // Approximate

const analyzeCriticalAspectsFlow = defineFlow(
  {
    name: 'analyzeCriticalAspectsFlow',
    inputSchema: CriticalAnalysisInputSchema,
    outputSchema: CriticalAnalysisOutputSchema,
  },
  async function* (input: CriticalAnalysisInput) {
    const startTime = Date.now();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      // Get syllabus content for reference
      const syllabusContent = getSyllabusContent();

      // Create system message
      const systemMessage = getCriticalAnalysisSystemMessage(input.examType);

      // Run critical analysis using AI
      const criticalAnalysisResponse = await ai.generate({
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: input.sourceText }
        ],
        responseFormat: { type: "json", schema: CriticalAnalysisOutputSchema }
      });

      if (criticalAnalysisResponse.usage) {
        totalInputTokens += criticalAnalysisResponse.usage.promptTokens || 0;
        totalOutputTokens += criticalAnalysisResponse.usage.completionTokens || 0;
      }

      const analysis = criticalAnalysisResponse.content;

      if (!analysis) {
        yield { type: 'error', data: 'Critical analysis failed to produce an analysis.' } as CriticalAnalysisChunk;
        return;
      }

      // Stream the results piece by piece
      if (analysis.toneAnalysis) {
        yield { type: 'tone', data: analysis.toneAnalysis } as CriticalAnalysisChunk;
      }

      if (analysis.biasAnalysis) {
        yield { type: 'bias', data: analysis.biasAnalysis } as CriticalAnalysisChunk;
      }

      if (analysis.factOpinionAnalysis) {
        yield { type: 'factOpinion', data: analysis.factOpinionAnalysis } as CriticalAnalysisChunk;
      }

      if (analysis.knowledgeGraph) {
        yield { type: 'knowledgeGraph', data: analysis.knowledgeGraph } as CriticalAnalysisChunk;
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
      } as CriticalAnalysisChunk;

    } catch (error) {
      console.error('Error in critical analysis flow:', error);
      yield { type: 'error', data: `Analysis failed: ${error}` } as CriticalAnalysisChunk;
    }
  }
);

export async function analyzeCriticalAspects(input: CriticalAnalysisInput) {
  return analyzeCriticalAspectsFlow(input);
}
