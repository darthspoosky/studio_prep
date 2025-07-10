'use server';

/**
 * @fileOverview AI workflow to generate comprehensive summaries of articles or texts.
 * Simplified version without streaming or token counting.
 *
 * - generateComprehensiveSummary: The public-facing function that orchestrates the workflow.
 */

import { ai } from '@/ai/genkit'; // Assuming '@/ai/genkit' correctly imports the GenKit AI instance
import { z } from 'zod';

// --- Input and Output Schemas ---
// Define the schema to use for both type inference and validation
const ComprehensiveSummaryInputSchema = z.object({
  sourceText: z.string().min(100).max(50000),
  examType: z.string().default('UPSC Civil Services'),
  outputLanguage: z.string().default('English'),
});

// Define schemas for summary components
const MainPointSchema = z.object({
  point: z.string(),
  explanation: z.string(),
  importance: z.string().optional(),
});

const KeyTermSchema = z.object({
  term: z.string(),
  definition: z.string(),
  context: z.string().optional(),
});

const ExaminationFocusSchema = z.object({
  area: z.string(),
  relevance: z.string(),
  potentialQuestions: z.array(z.string()).optional(),
});

// Final output schema for the entire flow
const ComprehensiveSummaryOutputSchema = z.object({
  mainPoints: z.array(MainPointSchema),
  keyTerms: z.array(KeyTermSchema),
  examinationFocus: z.array(ExaminationFocusSchema),
  conciseSummary: z.string(),
  syllabusTopic: z.string().optional().nullable(),
});

// --- Type exports ---
export type ComprehensiveSummaryInput = z.infer<typeof ComprehensiveSummaryInputSchema>;
export type ComprehensiveSummaryOutput = z.infer<typeof ComprehensiveSummaryOutputSchema>;
export type MainPoint = z.infer<typeof MainPointSchema>;
export type KeyTerm = z.infer<typeof KeyTermSchema>;
export type ExaminationFocus = z.infer<typeof ExaminationFocusSchema>;

// --- System message for comprehensive summary ---
function getComprehensiveSummarySystemMessage(examType: string): string {
  return `
    You are a comprehensive summary expert specialized in ${examType} exam preparation.
    Create a detailed yet concise summary of the provided text that would help a student understand and remember key points.
    Include main points, key terms, and areas of focus for examination.
    Your summary should be well-structured and highlight the most important information for exam preparation.
    Ensure the output is a valid JSON object conforming to the specified schema.
    The JSON object should have the following top-level keys: mainPoints, keyTerms, examinationFocus, conciseSummary, and syllabusTopic.
  `;
}

/**
 * Generates a comprehensive summary of the provided text
 * @param input The input containing sourceText and preferences
 * @returns A structured comprehensive summary
 */
export async function generateComprehensiveSummary(input: ComprehensiveSummaryInput): Promise<ComprehensiveSummaryOutput> {
  try {
    // Create system message
    const systemMessage = getComprehensiveSummarySystemMessage(input.examType);

    // Generate the summary using AI
    // Using responseFormat with a schema tells GenKit and the model
    // to structure the output as JSON conforming to the schema.
    // The responseFormat option should be within the 'config' object.
    const summaryResponse = await ai.generate({
      prompt: [
        { text: systemMessage },
        { text: `Source Text:\n\n${input.sourceText}\n\nOutput Language: ${input.outputLanguage}` }
      ],
      // Add model configuration here if needed, e.g., model: 'gemini-1.5-flash-latest'
      // model: 'gemini-1.5-flash-latest', // Example model configuration
      config: { // responseFormat should be inside the config object
        responseFormat: { type: "json", schema: ComprehensiveSummaryOutputSchema },
        // Other model config like temperature, maxOutputTokens, etc. can go here
      },
      // Add safety settings or other parameters if desired outside config
    });

    // Access the structured output. GenKit's ai.generate with responseFormat
    // should provide the parsed JSON directly via .output().
    const rawOutput = summaryResponse.output();

    // Validate the output against the Zod schema for runtime safety
    // This ensures the AI response structure is as expected.
    // Although GenKit with responseFormat+schema should handle this,
    // explicit parsing adds a layer of robustness.
    const validatedSummary = ComprehensiveSummaryOutputSchema.parse(rawOutput);

    // Return the validated summary
    return validatedSummary;

  } catch (error: unknown) {
    console.error('Error in comprehensive summary generation:', error);
    // Provide more specific error messages if possible
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      console.error('Zod validation error details:', error.errors);
      throw new Error(`Failed to parse AI response: Invalid structure. Details: ${error.message}`);
    } else if (error instanceof Error) {
      // Type guard to handle Error objects
      if (error.message.includes('API error')) {
        // Handle potential API errors from the AI provider
        throw new Error(`AI API error: ${error.message}`);
      } else {
        // Handle other Error objects
        throw new Error(`Failed to generate summary: ${error.message}`);
      }
    } else {
      // Handle non-Error objects
      throw new Error('Failed to generate summary: Unknown error');
    }
  }
}