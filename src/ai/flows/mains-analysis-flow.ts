'use server';
/**
 * @fileOverview AI workflow to analyze texts for UPSC Mains examination preparation.
 * This flow focuses on extracting arguments, keywords, viewpoints, and practice questions.
 * Simplified version without streaming or token counting.
 *
 * - generateMainsAnalysis: The public-facing function that orchestrates the workflow.
 */

import { ai } from '@/ai/genkit';
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

// Final output schema for the entire flow
const MainsAnalysisOutputSchema = z.object({
  arguments: z.array(ArgumentSchema),
  keywords: z.array(KeywordSchema),
  viewpoints: z.array(ViewpointSchema),
  answerFrameworks: z.array(AnswerFrameworkSchema),
  practiceQuestions: z.array(PracticeQuestionSchema),
  syllabusTopic: z.string().optional().nullable(),
  overallAssessment: z.string()
});

// --- Type exports ---

export type MainsAnalysisInput = z.infer<typeof MainsAnalysisInputSchema>;
export type MainsAnalysisOutput = z.infer<typeof MainsAnalysisOutputSchema>;
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
    6. An overall assessment of the content's relevance to ${examType} Mains preparation
    
    Your analysis should help UPSC aspirants prepare comprehensive answers for the Mains examination.
  `;
}

/**
 * Generates comprehensive Mains examination analysis from the provided text
 * @param input The input containing sourceText and preferences
 * @returns Structured analysis for UPSC Mains preparation
 */
export async function generateMainsAnalysis(input: MainsAnalysisInput): Promise<MainsAnalysisOutput> {
  try {
    // Get syllabus content for reference (can be used in future enhancements)
    const syllabusContent = getSyllabusContent();
    
    // Create system message
    const systemMessage = getMainsAnalysisSystemMessage(input.examType, input.paperFocus);

    // Generate the mains analysis using AI
    const mainsAnalysisResponse = await ai.generate({
      prompt: [
        { text: systemMessage },
        { text: input.sourceText }
      ],
      output: { format: "json", schema: MainsAnalysisOutputSchema }
    });

    // Return the mains analysis directly
    return mainsAnalysisResponse.output as MainsAnalysisOutput;
  } catch (error) {
    console.error('Error in mains analysis generation:', error);
    throw new Error(`Failed to generate mains analysis: ${error}`);
  }
}
