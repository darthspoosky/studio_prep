
'use server';
/**
 * @fileOverview An AI workflow to extract quiz questions from a PDF document.
 * 
 * - pdfToQuizFlow: The public-facing function that orchestrates the workflow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { type Question } from '@/types/quiz';

// --- Input and Output Schemas ---

const PDFToQuizInputSchema = z.object({
  pdfDataUri: z.string().describe("A PDF file encoded as a data URI. Expected format: 'data:application/pdf;base64,<encoded_data>'."),
  examType: z.string().default('UPSC Prelims').describe("The type of exam the questions are for, e.g., 'UPSC Prelims', 'RBI Grade B'."),
  questionCount: z.number().min(1).max(50).default(10).describe("The desired number of questions to extract."),
});

const OptionSchema = z.object({
  id: z.string().describe("A unique identifier for the option (e.g., 'a', 'b', 'c', 'd')."),
  text: z.string().describe("The text content of the option."),
});

const QuestionSchema = z.object({
  id: z.string().describe("A unique ID for the question, derived from its content hash if possible."),
  question: z.string().describe("The main text of the question."),
  options: z.array(OptionSchema).describe("An array of possible answers."),
  correctOptionId: z.string().describe("The ID of the correct option."),
  explanation: z.string().optional().describe("A detailed explanation for the correct answer."),
  subject: z.string().optional().describe("The subject of the question (e.g., 'History', 'Polity')."),
  topic: z.string().optional().describe("A more specific topic within the subject."),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe("The difficulty level of the question."),
  year: z.number().optional().describe("The year the question appeared in an exam, if available."),
  metadata: z.record(z.any()).optional().describe("Any other relevant metadata."),
});

const PDFToQuizOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe("An array of structured question objects extracted from the PDF."),
});

// --- Type exports ---
export type PDFToQuizInput = z.infer<typeof PDFToQuizInputSchema>;
export type PDFToQuizOutput = z.infer<typeof PDFToQuizOutputSchema>;


// --- Main AI Flow Definition ---

export const pdfToQuizFlow = ai.defineFlow(
  {
    name: 'pdfToQuizFlow',
    inputSchema: PDFToQuizInputSchema,
    outputSchema: PDFToQuizOutputSchema,
  },
  async (input) => {
    const { pdfDataUri, examType, questionCount } = input;
    
    // Define the prompt for the Gemini model
    const prompt = `
      You are an expert AI specializing in educational content extraction. Your task is to analyze the provided PDF document and extract multiple-choice questions (MCQs) suitable for the ${examType} exam.

      **Instructions:**
      1.  **Analyze the PDF**: The PDF is provided as a media object. Carefully parse its content, including text and layout, to identify distinct MCQs.
      2.  **Extract Questions**: Identify and extract up to ${questionCount} questions. For each question, you must extract:
          *   The full question text.
          *   All associated options (e.g., A, B, C, D).
          *   The correct answer.
          *   The detailed explanation, if provided.
      3.  **Handle Formatting**: Questions may be numbered. Options might be labeled with letters (a, b, c, d) or numbers (1, 2, 3, 4). Correctly identify and separate these components.
      4.  **Determine the Correct Option**: The correct answer might be indicated by bold text, an asterisk, or a separate answer key section. Deduce the correct option and map it to its corresponding ID.
      5.  **Assign Metadata**: If possible, infer the 'subject', 'topic', and 'year' from the context in the PDF. If not available, these fields can be omitted.
      6.  **Generate Unique IDs**: Create a unique ID for each question (e.g., based on a hash of the question text) and for each option.
      7.  **Format Output**: Structure the extracted data into a valid JSON object that strictly conforms to the provided output schema. The root of the JSON should be an object with a single key "questions", which is an array of question objects.

      **PDF for Analysis:**
      {{media url=pdfDataUri}}
    `;
    
    // Generate the structured data using the AI model
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-pro',
      prompt: [
        { text: prompt },
        { media: { url: pdfDataUri } },
      ],
      output: {
        format: 'json',
        schema: PDFToQuizOutputSchema,
      },
      config: {
          temperature: 0.1, // Lower temperature for more predictable, structured output
      }
    });

    if (!output || !output.questions) {
      throw new Error('The AI failed to extract any questions from the PDF.');
    }
    
    // Ensure the output is an array before returning
    const questions = Array.isArray(output.questions) ? output.questions : [];

    return { questions };
  }
);
