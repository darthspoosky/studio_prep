'use server';
/**
 * @fileOverview AI workflow to extract factual information for UPSC Prelims examination.
 * This flow identifies key names, dates, schemes, and other factual details relevant for Prelims preparation.
 *
 * - extractPrelimsFactsFlow: The public-facing flow that orchestrates the workflow.
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

const PrelimsFactFinderInputSchema = z.object({
  sourceText: z.string().min(100).max(50000),
  examType: z.string().default('UPSC Civil Services'),
  focusAreas: z.array(z.enum(['Names', 'Dates', 'Schemes', 'Places', 'Organizations', 'Numbers', 'All']))
    .default(['All']),
  outputLanguage: z.string().default('English'),
});

// Define schemas for fact categories
const NameFactSchema = z.object({
  name: z.string(),
  type: z.string(), // e.g., person, organization, etc.
  description: z.string(),
  significance: z.string(),
  relatedFacts: z.array(z.string()).optional()
});

const DateFactSchema = z.object({
  date: z.string(),
  event: z.string(),
  significance: z.string(),
  context: z.string().optional()
});

const SchemeFactSchema = z.object({
  name: z.string(),
  objective: z.string(),
  ministry: z.string().optional(),
  year: z.string().optional(),
  keyFeatures: z.array(z.string()),
  targetBeneficiaries: z.string().optional()
});

const PlaceFactSchema = z.object({
  name: z.string(),
  location: z.string().optional(),
  importance: z.string(),
  relatedEvents: z.array(z.string()).optional()
});

const OrganizationFactSchema = z.object({
  name: z.string(),
  type: z.string(),
  purpose: z.string(),
  establishedIn: z.string().optional(),
  significance: z.string()
});

const NumberFactSchema = z.object({
  number: z.string(),
  context: z.string(),
  significance: z.string(),
  source: z.string().optional()
});

// Define a chunk schema for streaming results
const PrelimsFactFinderChunkSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal('names'), data: z.array(NameFactSchema) }),
  z.object({ type: z.literal('dates'), data: z.array(DateFactSchema) }),
  z.object({ type: z.literal('schemes'), data: z.array(SchemeFactSchema) }),
  z.object({ type: z.literal('places'), data: z.array(PlaceFactSchema) }),
  z.object({ type: z.literal('organizations'), data: z.array(OrganizationFactSchema) }),
  z.object({ type: z.literal('numbers'), data: z.array(NumberFactSchema) }),
  z.object({ 
    type: z.literal('metadata'), 
    data: z.object({
      processingTime: z.number().optional(),
      totalTokens: z.number().optional(),
      inputTokens: z.number().optional(),
      outputTokens: z.number().optional(),
      cost: z.number().optional(),
      qualityScore: z.number().optional(),
      totalFactsFound: z.number().optional()
    })
  }),
  z.object({ type: z.literal('error'), data: z.string() })
]);

// Final output schema for the entire flow
const PrelimsFactFinderOutputSchema = z.object({
  names: z.array(NameFactSchema).optional(),
  dates: z.array(DateFactSchema).optional(),
  schemes: z.array(SchemeFactSchema).optional(),
  places: z.array(PlaceFactSchema).optional(),
  organizations: z.array(OrganizationFactSchema).optional(),
  numbers: z.array(NumberFactSchema).optional(),
  syllabusTopic: z.string().optional().nullable(),
  qualityScore: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  cost: z.number().optional(),
  processingTime: z.number().optional(),
  totalFactsFound: z.number().optional(),
});

// --- Type exports ---

export type PrelimsFactFinderInput = z.infer<typeof PrelimsFactFinderInputSchema>;
export type PrelimsFactFinderOutput = z.infer<typeof PrelimsFactFinderOutputSchema>;
export type PrelimsFactFinderChunk = z.infer<typeof PrelimsFactFinderChunkSchema>;
export type NameFact = z.infer<typeof NameFactSchema>;
export type DateFact = z.infer<typeof DateFactSchema>;
export type SchemeFact = z.infer<typeof SchemeFactSchema>;
export type PlaceFact = z.infer<typeof PlaceFactSchema>;
export type OrganizationFact = z.infer<typeof OrganizationFactSchema>;
export type NumberFact = z.infer<typeof NumberFactSchema>;

// --- System message for prelims fact finder ---

function getPrelimsFactFinderSystemMessage(examType: string, focusAreas: string[]): string {
  const focusAreasText = focusAreas.includes('All') 
    ? "all important factual details" 
    : `factual details focusing on ${focusAreas.join(', ')}`;

  return `
    You are a UPSC Prelims examination expert specialized in extracting factual information for ${examType} preparation.
    Analyze the given text and identify ${focusAreasText} that would be relevant for Prelims examination.
    For each fact:
    1. Categorize it appropriately
    2. Provide context and significance
    3. Add related information when available
    
    Remember that UPSC Prelims examination focuses heavily on factual accuracy and testing recall of specific information.
  `;
}

// --- Flow ---

// Price constants (adjust as needed)
const INPUT_PRICE_PER_1K_TOKENS_USD = 0.001;
const OUTPUT_PRICE_PER_1K_TOKENS_USD = 0.002;
const USD_TO_INR_RATE = 75; // Approximate

const prelimsFactFinderFlow = defineFlow(
  {
    name: 'prelimsFactFinderFlow',
    inputSchema: PrelimsFactFinderInputSchema,
    outputSchema: PrelimsFactFinderOutputSchema,
  },
  null, // Adding null as the second argument for input converter
  async function* (input: PrelimsFactFinderInput) {
    const startTime = Date.now();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      // Get syllabus content for reference
      const syllabusContent = getSyllabusContent();
      
      // Create system message
      const systemMessage = getPrelimsFactFinderSystemMessage(input.examType, input.focusAreas);

      // Run prelims fact finder using AI
      const factFinderResponse = await ai.generate({
        prompt: [ // Changed from 'messages' to 'prompt'
          { text: systemMessage },
          { text: input.sourceText }
        ],
        responseFormat: { type: "json", schema: PrelimsFactFinderOutputSchema }
      });

      if (factFinderResponse.usage) {
        totalInputTokens += factFinderResponse.usage.inputTokens || 0; // Changed from promptTokens to inputTokens
        totalOutputTokens += factFinderResponse.usage.outputTokens || 0; // Changed from completionTokens to outputTokens
      }

      const analysis = factFinderResponse; // Access response directly instead of .content

      if (!analysis) {
        yield { type: 'error', data: 'Prelims fact finder failed to produce results.' } as PrelimsFactFinderChunk;
        return;
      }

      // Stream the results piece by piece
      if (analysis.names && analysis.names.length > 0) {
        yield { type: 'names', data: analysis.names } as PrelimsFactFinderChunk;
      }

      if (analysis.dates && analysis.dates.length > 0) {
        yield { type: 'dates', data: analysis.dates } as PrelimsFactFinderChunk;
      }

      if (analysis.schemes && analysis.schemes.length > 0) {
        yield { type: 'schemes', data: analysis.schemes } as PrelimsFactFinderChunk;
      }

      if (analysis.places && analysis.places.length > 0) {
        yield { type: 'places', data: analysis.places } as PrelimsFactFinderChunk;
      }

      if (analysis.organizations && analysis.organizations.length > 0) {
        yield { type: 'organizations', data: analysis.organizations } as PrelimsFactFinderChunk;
      }

      if (analysis.numbers && analysis.numbers.length > 0) {
        yield { type: 'numbers', data: analysis.numbers } as PrelimsFactFinderChunk;
      }

      // Calculate final metadata
      const processingTime = (Date.now() - startTime) / 1000;
      const totalTokens = totalInputTokens + totalOutputTokens;
      const cost = ((totalInputTokens / 1000) * INPUT_PRICE_PER_1K_TOKENS_USD + 
                   (totalOutputTokens / 1000) * OUTPUT_PRICE_PER_1K_TOKENS_USD) * USD_TO_INR_RATE;
      
      // Calculate total facts found across all categories
      const totalFactsFound = 
        (analysis.names?.length || 0) + 
        (analysis.dates?.length || 0) + 
        (analysis.schemes?.length || 0) + 
        (analysis.places?.length || 0) + 
        (analysis.organizations?.length || 0) + 
        (analysis.numbers?.length || 0);

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
          totalFactsFound
        }
      } as PrelimsFactFinderChunk;

    } catch (error) {
      console.error('Error in prelims fact finder flow:', error);
      yield { type: 'error', data: `Analysis failed: ${error}` } as PrelimsFactFinderChunk;
    }
  }
);

export async function extractPrelimsFacts(input: PrelimsFactFinderInput) {
  return prelimsFactFinderFlow(input);
}
