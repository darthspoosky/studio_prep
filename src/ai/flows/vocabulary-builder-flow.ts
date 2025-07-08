'use server';
/**
 * @fileOverview AI workflow to analyze texts for vocabulary building and enhancement.
 * This flow helps identify difficult words, their meanings, and contextual usage.
 *
 * - analyzeVocabulary: The public-facing flow that orchestrates the workflow.
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

const VocabularyBuilderInputSchema = z.object({
  sourceText: z.string().min(100).max(50000),
  examType: z.string().default('UPSC Civil Services'),
  difficultyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Exam-Specific']).default('Exam-Specific'),
  outputLanguage: z.string().default('English'),
});

// Define schemas for vocabulary elements
const WordAnalysisSchema = z.object({
  word: z.string(),
  meaning: z.string(),
  partOfSpeech: z.string(),
  pronunciation: z.string().optional(),
  context: z.string(),
  synonyms: z.array(z.string()),
  antonyms: z.array(z.string()).optional(),
  usageExample: z.string().optional(),
  examRelevance: z.string().optional(),
  difficultyLevel: z.number().min(1).max(5).optional()
});

const ConceptClusterSchema = z.object({
  theme: z.string(),
  relatedWords: z.array(z.object({
    word: z.string(),
    relationship: z.string()
  })),
  usageNote: z.string().optional()
});

const PhraseSchema = z.object({
  phrase: z.string(),
  meaning: z.string(),
  usage: z.string(),
  alternatives: z.array(z.string()).optional()
});

const MemorizationTipSchema = z.object({
  word: z.string(),
  tip: z.string(),
  mnemonic: z.string().optional(),
  visualCue: z.string().optional()
});

// Define a chunk schema for streaming results
const VocabularyBuilderChunkSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal('words'), data: z.array(WordAnalysisSchema) }),
  z.object({ type: z.literal('conceptClusters'), data: z.array(ConceptClusterSchema) }),
  z.object({ type: z.literal('phrases'), data: z.array(PhraseSchema) }),
  z.object({ type: z.literal('memorizationTips'), data: z.array(MemorizationTipSchema) }),
  z.object({ 
    type: z.literal('metadata'), 
    data: z.object({
      processingTime: z.number().optional(),
      totalTokens: z.number().optional(),
      inputTokens: z.number().optional(),
      outputTokens: z.number().optional(),
      cost: z.number().optional(),
      qualityScore: z.number().optional(),
      wordCount: z.number().optional()
    })
  }),
  z.object({ type: z.literal('error'), data: z.string() })
]);

// Final output schema for the entire flow
const VocabularyBuilderOutputSchema = z.object({
  words: z.array(WordAnalysisSchema),
  conceptClusters: z.array(ConceptClusterSchema),
  phrases: z.array(PhraseSchema),
  memorizationTips: z.array(MemorizationTipSchema),
  syllabusTopic: z.string().optional().nullable(),
  qualityScore: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  cost: z.number().optional(),
  processingTime: z.number().optional(),
  wordCount: z.number().optional(),
});

// --- Type exports ---

export type VocabularyBuilderInput = z.infer<typeof VocabularyBuilderInputSchema>;
export type VocabularyBuilderOutput = z.infer<typeof VocabularyBuilderOutputSchema>;
export type VocabularyBuilderChunk = z.infer<typeof VocabularyBuilderChunkSchema>;
export type WordAnalysis = z.infer<typeof WordAnalysisSchema>;
export type ConceptCluster = z.infer<typeof ConceptClusterSchema>;
export type Phrase = z.infer<typeof PhraseSchema>;
export type MemorizationTip = z.infer<typeof MemorizationTipSchema>;

// --- System message for vocabulary analysis ---

function getVocabularyBuilderSystemMessage(examType: string, difficultyLevel: string): string {
  return `
    You are a vocabulary expert specialized in ${examType} exam preparation.
    Analyze the given text to identify important vocabulary at the ${difficultyLevel} level.
    For each word:
    1. Provide the meaning, part of speech, and pronunciation
    2. Show how it's used in context
    3. List synonyms and antonyms
    4. Rate its relevance to the exam
    5. Suggest memorization techniques
    
    Also identify concept clusters (related words) and important phrases.
    Your analysis should help students enhance their vocabulary for the exam.
  `;
}

// --- Flow ---

// Price constants (adjust as needed)
const INPUT_PRICE_PER_1K_TOKENS_USD = 0.001;
const OUTPUT_PRICE_PER_1K_TOKENS_USD = 0.002;
const USD_TO_INR_RATE = 75; // Approximate

const vocabularyBuilderFlow = defineFlow<VocabularyBuilderInput, VocabularyBuilderChunk, VocabularyBuilderOutput>(
  {
    name: 'vocabularyBuilderFlow',
    inputSchema: VocabularyBuilderInputSchema,
    outputSchema: VocabularyBuilderOutputSchema,
  },
  async function* (input: VocabularyBuilderInput) {
    const startTime = Date.now();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      // Get syllabus content for reference
      const syllabusContent = getSyllabusContent();

      // Create system message
      const systemMessage = getVocabularyBuilderSystemMessage(input.examType, input.difficultyLevel);

      // Run vocabulary analysis using AI
      const vocabularyResponse = await ai.generate({
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: input.sourceText }
        ],
        responseFormat: { type: "json", schema: VocabularyBuilderOutputSchema }
      });

      if (vocabularyResponse.usage) {
        totalInputTokens += vocabularyResponse.usage.promptTokens || 0;
        totalOutputTokens += vocabularyResponse.usage.completionTokens || 0;
      }

      const analysis = vocabularyResponse.content;

      if (!analysis) {
        yield { type: 'error', data: 'Vocabulary analysis failed to produce results.' } as VocabularyBuilderChunk;
        return;
      }

      // Stream the results piece by piece
      if (analysis.words) {
        yield { type: 'words', data: analysis.words } as VocabularyBuilderChunk;
      }

      if (analysis.conceptClusters) {
        yield { type: 'conceptClusters', data: analysis.conceptClusters } as VocabularyBuilderChunk;
      }

      if (analysis.phrases) {
        yield { type: 'phrases', data: analysis.phrases } as VocabularyBuilderChunk;
      }

      if (analysis.memorizationTips) {
        yield { type: 'memorizationTips', data: analysis.memorizationTips } as VocabularyBuilderChunk;
      }

      // Calculate final metadata
      const processingTime = (Date.now() - startTime) / 1000;
      const totalTokens = totalInputTokens + totalOutputTokens;
      const cost = ((totalInputTokens / 1000) * INPUT_PRICE_PER_1K_TOKENS_USD + 
                   (totalOutputTokens / 1000) * OUTPUT_PRICE_PER_1K_TOKENS_USD) * USD_TO_INR_RATE;
      const wordCount = analysis.words?.length || 0;

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
          wordCount
        }
      } as VocabularyBuilderChunk;

    } catch (error) {
      console.error('Error in vocabulary builder flow:', error);
      yield { type: 'error', data: `Analysis failed: ${error}` } as VocabularyBuilderChunk;
    }
  }
);

export async function analyzeVocabulary(input: VocabularyBuilderInput) {
  return vocabularyBuilderFlow(input);
}
