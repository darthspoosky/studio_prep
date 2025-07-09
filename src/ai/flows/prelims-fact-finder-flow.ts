'use server';
/**
 * @fileOverview AI workflow to extract key factual information for UPSC Prelims exam preparation.
 * Simplified version without streaming or token counting.
 *
 * - generatePrelimsFacts: The public-facing function that orchestrates the workflow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// --- Input and Output Schemas ---

const PrelimsFactFinderInputSchema = z.object({
  sourceText: z.string().min(100).max(50000),
  examType: z.string().default('UPSC Civil Services'),
  outputLanguage: z.string().default('English'),
});

// Define schemas for prelims fact components
const NameSchema = z.object({
  name: z.string(),
  category: z.string(),
  context: z.string(),
  importance: z.string()
});

const DateSchema = z.object({
  date: z.string(),
  event: z.string(),
  significance: z.string()
});

const PlaceSchema = z.object({
  place: z.string(),
  location: z.string().optional(),
  significance: z.string()
});

const SchemeSchema = z.object({
  name: z.string(),
  ministry: z.string().optional(),
  objective: z.string(),
  keyFeatures: z.array(z.string())
});

const StatisticSchema = z.object({
  value: z.string(),
  context: z.string(),
  relevance: z.string()
});

// Final output schema for the entire flow
const PrelimsFactFinderOutputSchema = z.object({
  keyNames: z.array(NameSchema),
  importantDates: z.array(DateSchema),
  significantPlaces: z.array(PlaceSchema),
  mentionedSchemes: z.array(SchemeSchema),
  notableStatistics: z.array(StatisticSchema),
  overallAssessment: z.string()
});

// --- Type exports ---

export type PrelimsFactFinderInput = z.infer<typeof PrelimsFactFinderInputSchema>;
export type PrelimsFactFinderOutput = z.infer<typeof PrelimsFactFinderOutputSchema>;
export type Name = z.infer<typeof NameSchema>;
export type Date = z.infer<typeof DateSchema>;
export type Place = z.infer<typeof PlaceSchema>;
export type Scheme = z.infer<typeof SchemeSchema>;
export type Statistic = z.infer<typeof StatisticSchema>;

// --- System message for prelims fact finder ---

function getPrelimsFactFinderSystemMessage(examType: string): string {
  return `
    You are a UPSC Prelims exam fact extraction expert specialized in ${examType}.
    Extract key factual information from the provided text that would be valuable for Prelims exam preparation.
    Focus specifically on:
    - Important names (people, organizations, committees, etc.)
    - Significant dates and events
    - Notable places and locations
    - Government schemes and programs
    - Statistical data and figures
    
    Provide concise, accurate information organized in a way that's easy to memorize for exam purposes.
    Each fact should include context and significance for the exam.
  `;
}

/**
 * Generates prelims facts from the provided text
 * @param input The input containing sourceText and preferences
 * @returns Structured prelims factual information
 */
export async function generatePrelimsFacts(input: PrelimsFactFinderInput): Promise<PrelimsFactFinderOutput> {
  try {
    // Create system message
    const systemMessage = getPrelimsFactFinderSystemMessage(input.examType);

    // Generate the facts using AI
    const factsResponse = await ai.generate({
      prompt: [
        { text: systemMessage },
        { text: input.sourceText }
      ],
      output: { format: "json", schema: PrelimsFactFinderOutputSchema }
    });

    // Return the facts directly
    return factsResponse.output as PrelimsFactFinderOutput;
  } catch (error) {
    console.error('Error in prelims fact finder generation:', error);
    throw new Error(`Failed to extract prelims facts: ${error}`);
  }
}
