'use server';
/**
 * @fileOverview AI workflow to generate vocabulary enhancement content for study materials.
 * Simplified version without streaming or token counting.
 *
 * - generateVocabularyContent: The public-facing function that orchestrates the workflow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// --- Input and Output Schemas ---

const VocabularyBuilderInputSchema = z.object({
  sourceText: z.string().min(100).max(50000),
  examType: z.string().default('UPSC Civil Services'),
  outputLanguage: z.string().default('English'),
  complexity: z.enum(['Basic', 'Intermediate', 'Advanced']).default('Intermediate'),
});

// Define schemas for vocabulary components
const VocabularyTermSchema = z.object({
  term: z.string(),
  definition: z.string(),
  usage: z.string(),
  synonyms: z.array(z.string()).optional(),
  antonyms: z.array(z.string()).optional()
});

const ConceptClusterSchema = z.object({
  centralTerm: z.string(),
  relatedTerms: z.array(z.string()),
  relationship: z.string()
});

const UsefulPhraseSchema = z.object({
  phrase: z.string(),
  meaning: z.string(),
  context: z.string(),
  exampleUsage: z.string()
});

const MemorizationTipSchema = z.object({
  term: z.string(),
  tip: z.string(),
  mnemonic: z.string().optional()
});

// Final output schema for the entire flow
const VocabularyBuilderOutputSchema = z.object({
  keyTerms: z.array(VocabularyTermSchema),
  conceptClusters: z.array(ConceptClusterSchema),
  usefulPhrases: z.array(UsefulPhraseSchema),
  memorizationTips: z.array(MemorizationTipSchema),
  overallThemes: z.array(z.string())
});

// --- Type exports ---

export type VocabularyBuilderInput = z.infer<typeof VocabularyBuilderInputSchema>;
export type VocabularyBuilderOutput = z.infer<typeof VocabularyBuilderOutputSchema>;
export type VocabularyTerm = z.infer<typeof VocabularyTermSchema>;
export type ConceptCluster = z.infer<typeof ConceptClusterSchema>;
export type UsefulPhrase = z.infer<typeof UsefulPhraseSchema>;
export type MemorizationTip = z.infer<typeof MemorizationTipSchema>;

// --- System message for vocabulary builder ---

function getVocabularyBuilderSystemMessage(examType: string, complexity: string): string {
  return `
    You are a vocabulary enhancement expert specialized in ${examType} exam preparation.
    Create vocabulary enrichment content at ${complexity} complexity level from the provided text.
    Include:
    - Important terms with definitions and usage
    - Concept clusters showing related terms
    - Useful phrases that demonstrate sophisticated language
    - Memorization tips to help learn challenging vocabulary
    
    Your output should help students expand their vocabulary and use more precise, 
    sophisticated language in their exam answers.
  `;
}

/**
 * Generates vocabulary enrichment content from the provided text
 * @param input The input containing sourceText and preferences
 * @returns Structured vocabulary content
 */
export async function generateVocabularyContent(input: VocabularyBuilderInput): Promise<VocabularyBuilderOutput> {
  try {
    // Create system message
    const systemMessage = getVocabularyBuilderSystemMessage(input.examType, input.complexity);

    // Generate the vocabulary content using AI
    const vocabResponse = await ai.generate({
      prompt: [
        { text: systemMessage },
        { text: input.sourceText }
      ],
      output: { format: "json", schema: VocabularyBuilderOutputSchema }
    });

    // Return the vocabulary content directly
    return vocabResponse.output as VocabularyBuilderOutput;
  } catch (error) {
    console.error('Error in vocabulary builder generation:', error);
    throw new Error(`Failed to generate vocabulary content: ${error}`);
  }
}
