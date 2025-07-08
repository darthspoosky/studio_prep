'use server';
/**
 * @fileOverview AI workflow to generate critical analysis of articles or texts.
 * Simplified version without streaming or token counting.
 *
 * - generateCriticalAnalysis: The public-facing function that orchestrates the workflow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// --- Input and Output Schemas ---

const CriticalAnalysisInputSchema = z.object({
  sourceText: z.string().min(100).max(50000),
  examType: z.string().default('UPSC Civil Services'),
  outputLanguage: z.string().default('English'),
});

// Define schemas for critical analysis components
const ToneAnalysisSchema = z.object({
  primaryTone: z.string(),
  tonalShifts: z.array(z.object({
    shift: z.string(),
    context: z.string()
  })).optional(),
  overallImpression: z.string()
});

const BiasAnalysisSchema = z.object({
  detectedBiases: z.array(z.object({
    biasType: z.string(),
    evidence: z.string(),
    impact: z.string()
  })),
  objectivityAssessment: z.string()
});

const ArgumentAnalysisSchema = z.object({
  strongArguments: z.array(z.object({
    argument: z.string(),
    strength: z.string()
  })),
  weakArguments: z.array(z.object({
    argument: z.string(),
    weakness: z.string()
  })),
  logicalFallacies: z.array(z.object({
    fallacy: z.string(),
    explanation: z.string()
  })).optional()
});

const FactOpinionSchema = z.object({
  keyFacts: z.array(z.string()),
  opinions: z.array(z.object({
    opinion: z.string(),
    basis: z.string()
  })),
  uncorroboratedClaims: z.array(z.string()).optional()
});

// Final output schema for the entire flow
const CriticalAnalysisOutputSchema = z.object({
  toneAnalysis: ToneAnalysisSchema,
  biasAnalysis: BiasAnalysisSchema,
  argumentAnalysis: ArgumentAnalysisSchema,
  factOpinionAnalysis: FactOpinionSchema,
  overallAssessment: z.string()
});

// --- Type exports ---

export type CriticalAnalysisInput = z.infer<typeof CriticalAnalysisInputSchema>;
export type CriticalAnalysisOutput = z.infer<typeof CriticalAnalysisOutputSchema>;
export type ToneAnalysis = z.infer<typeof ToneAnalysisSchema>;
export type BiasAnalysis = z.infer<typeof BiasAnalysisSchema>;
export type ArgumentAnalysis = z.infer<typeof ArgumentAnalysisSchema>;
export type FactOpinionAnalysis = z.infer<typeof FactOpinionSchema>;

// --- System message for critical analysis ---

function getCriticalAnalysisSystemMessage(examType: string): string {
  return `
    You are a critical analysis expert specialized in ${examType} exam preparation.
    Provide a detailed critical analysis of the given text, focusing on:
    - Tone analysis (formal/informal, persuasive/informative, etc.)
    - Bias identification (political, ideological, cultural biases)
    - Argument assessment (strength of arguments, logical fallacies)
    - Fact vs opinion differentiation
    
    Your analysis should help students develop critical thinking skills necessary for essay writing,
    answer evaluation, and comprehensive understanding of complex topics.
  `;
}

/**
 * Generates a critical analysis of the provided text
 * @param input The input containing sourceText and preferences
 * @returns A structured critical analysis
 */
export async function generateCriticalAnalysis(input: CriticalAnalysisInput): Promise<CriticalAnalysisOutput> {
  try {
    // Create system message
    const systemMessage = getCriticalAnalysisSystemMessage(input.examType);

    // Generate the analysis using AI
    const analysisResponse = await ai.generate({
      prompt: [
        { text: systemMessage },
        { text: input.sourceText }
      ],
      output: { format: "json", schema: CriticalAnalysisOutputSchema }
    });

    // Return the analysis directly
    return analysisResponse.output as CriticalAnalysisOutput;
  } catch (error) {
    console.error('Error in critical analysis generation:', error);
    throw new Error(`Failed to generate critical analysis: ${error}`);
  }
}
