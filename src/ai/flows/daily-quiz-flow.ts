'use server';
/**
 * @fileOverview An AI workflow to generate daily quiz questions for exam preparation.
 *
 * This file implements an AI workflow to create customized quizzes for students based on
 * their selected subject, difficulty level, and number of questions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Cache syllabus content
const syllabusCache: { prelims?: string; mains?: string } = {};
function getSyllabusContent() {
  if (!syllabusCache.prelims || !syllabusCache.mains) {
    syllabusCache.prelims = fs.readFileSync(path.join(process.cwd(), 'src/ai/knowledge/upsc-prelims-syllabus.md'), 'utf-8');
    syllabusCache.mains = fs.readFileSync(path.join(process.cwd(), 'src/ai/knowledge/upsc-mains-syllabus.md'), 'utf-8');
  }
  return syllabusCache;
}

// --- Input and Output Schemas ---

const DailyQuizInputSchema = z.object({
  subject: z.string(),
  numQuestions: z.number().min(1).max(20),
  difficulty: z.enum(['easy', 'medium', 'hard', 'adaptive']),
  examType: z.string().default('UPSC Civil Services'),
  outputLanguage: z.string().default('English'),
});
export type DailyQuizInput = z.infer<typeof DailyQuizInputSchema>;

// Internal schemas for agent communication
const SyllabusInputSchema = DailyQuizInputSchema.extend({
  prelimsSyllabus: z.string(),
  mainsSyllabus: z.string(),
});

// Schemas for structured question generation
const OptionSchema = z.object({
  text: z.string(),
  correct: z.boolean(),
});

const MCQSchema = z.object({
  question: z.string(),
  subject: z.string(),
  explanation: z.string(),
  difficulty: z.number().min(1).max(10),
  options: z.array(OptionSchema),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type MCQ = z.infer<typeof MCQSchema>;

// Final output schema for the entire flow
const DailyQuizOutputSchema = z.object({
  mcqs: z.array(MCQSchema),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  cost: z.number().optional(),
  processingTime: z.number().optional(),
});
export type DailyQuizOutput = z.infer<typeof DailyQuizOutputSchema>;

// --- Quiz Generation Agent ---
// Using type assertion to bypass TypeScript errors while maintaining functionality
const quizGeneratorAgent = ai.definePrompt({
  name: 'quizGeneratorAgent',
  description: 'Generates custom quiz questions for UPSC exam preparation',
  model: 'gemini-1.5-pro',
  tools: [],
  // @ts-expect-error - Adding properties that may not be in current type definitions but required for runtime
  inputSchema: SyllabusInputSchema,
  outputSchema: z.object({
    mcqs: z.array(MCQSchema),
  }),
  prompt: `
You are an expert UPSC quiz generator specialized in creating high-quality, exam-oriented questions.

**TASK:** Generate {{{numQuestions}}} multiple-choice questions (MCQs) for the subject: "{{{subject}}}" at {{{difficulty}}} difficulty level.

**SYLLABUS REFERENCE:**
{{{prelimsSyllabus}}}

**GUIDELINES:**
1. Create exactly {{{numQuestions}}} questions relevant to the specified subject.
2. For the difficulty levels:
   - Easy: Focus on direct facts, definitions, and basic concepts.
   - Medium: Test application and comprehension of concepts.
   - Hard: Test analysis, synthesis and evaluation of complex concepts.
   - Adaptive: Mix of difficulties with emphasis on higher-order thinking.
3. Provide four options for each question with EXACTLY ONE correct answer.
4. Include detailed explanations that teach the concept and explain why incorrect options are wrong.
5. Assign an integer difficulty score from 1-10 (1=easiest, 10=hardest) based on the difficulty parameter.
   - Easy difficulty maps to 1-3 range
   - Medium difficulty maps to 4-7 range
   - Hard difficulty maps to 8-10 range
   - Adaptive provides a mix across all ranges
6. Questions should be varied in format: direct questions, statement-based questions, and assertion-reasoning questions.

**SPECIALIZED QUESTION FORMATS:**
- For direct questions, use standard format with a single question and 4 options.
- For statement-based questions, present a statement and ask which is correct/incorrect.
- For assertion-reasoning (at harder difficulties), present two statements labeled "Statement-I" and "Statement-II" with the options:
  (a) Both Statement-I and Statement-II are correct and Statement-II is the correct explanation for Statement-I.
  (b) Both Statement-I and Statement-II are correct but Statement-II is NOT the correct explanation for Statement-I.
  (c) Statement-I is correct but Statement-II is incorrect.
  (d) Statement-I is incorrect but Statement-II is correct.

**OUTPUT EXPECTATIONS:**
- Questions must be factually accurate and based on the latest UPSC syllabus.
- Explanations should be comprehensive and instructional.
- Questions should not repeat information or concepts.
- Questions must be production-ready for a live education platform.

**OUTPUT FORMAT:** Respond with JSON data following the provided schema.
`,
});

// --- Quiz Verification Agent ---
const quizVerificationAgent = ai.definePrompt({
  name: 'quizVerificationAgent',
  description: 'Verifies and improves quiz questions for accuracy and quality',
  model: 'gemini-1.5-pro',
  tools: [],
  // @ts-expect-error - Adding properties that may not be in current type definitions but required for runtime
  inputSchema: z.object({
    mcqs: z.array(MCQSchema),
    subject: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'adaptive']),
  }),
  outputSchema: z.object({
    mcqs: z.array(MCQSchema),
  }),
  prompt: `
You are an expert UPSC educator responsible for reviewing and enhancing quiz questions. Your goal is to ensure all questions meet the highest standards of quality and pedagogical value.

**REVIEW TASK:** Carefully review the following quiz questions for the subject "{{{subject}}}" at {{{difficulty}}} difficulty and make necessary improvements.

**QUESTIONS TO REVIEW:**
{{{mcqs}}}

**QUALITY GUIDELINES:**
1. Ensure factual accuracy and current relevance to UPSC syllabus.
2. Verify that exactly ONE option is correct for each question.
3. Check that difficulty rating (1-10) aligns with the intended difficulty level.
4. Ensure explanations are comprehensive and educational.
5. Improve clarity of language and precision of technical terms.
6. Remove any ambiguity in questions or answer options.
7. Verify that questions test conceptual understanding, not just rote memorization.
8. Add or improve educational value in explanations.

**VERIFICATION CHECKLIST:**
- Are all questions aligned with the subject matter?
- Is the difficulty appropriate?
- Are explanations comprehensive enough to serve as learning material?
- Are all options plausible but only one is definitively correct?
- Is language clear and free of grammatical errors?

**OUTPUT:** Return the improved questions with any necessary corrections. If a question meets all quality criteria, leave it unchanged. Make your improvements subtle but meaningful, ensuring the questions remain challenging but fair.

**OUTPUT FORMAT:** Respond with JSON data following the provided schema.
`,
});

/**
 * Generates daily quiz questions based on user preferences.
 * 
 * @param input User preferences for quiz generation
 * @returns A set of MCQ questions tailored to the specified parameters
 */
export async function generateDailyQuiz(input: DailyQuizInput): Promise<DailyQuizOutput> {
  const startTime = Date.now();
  
  // Get syllabus content for context
  const { prelims, mains } = getSyllabusContent();
  
  // Track token usage and cost
  const totalInputTokens = 0;
  const totalOutputTokens = 0;
  const USD_TO_INR_RATE = 83;
  const INPUT_PRICE_PER_1K_TOKENS_USD = 0.00035;
  const OUTPUT_PRICE_PER_1K_TOKENS_USD = 0.00105;
  
  // STEP 1: Generate initial quiz questions
  const generatorResponse = await quizGeneratorAgent({
    ...input,
    prelimsSyllabus: prelims || '',
    mainsSyllabus: mains || '',
  });
  
  // Note: If you need token tracking, you'll need to implement a custom solution
  // or check if the current API version provides usage information elsewhere
  // For now, we'll leave token tracking as estimates or disabled
  
  const generatedQuestions = generatorResponse.output;
  
  if (!generatedQuestions || !generatedQuestions.mcqs || generatedQuestions.mcqs.length === 0) {
    throw new Error("Failed to generate quiz questions");
  }
  
  // STEP 2: Verify and improve quiz questions
  const verificationResponse = await quizVerificationAgent({
    mcqs: generatedQuestions.mcqs,
    subject: input.subject,
    difficulty: input.difficulty,
  });
  
  // Note: If you need token tracking, you'll need to implement a custom solution
  // or check if the current API version provides usage information elsewhere
  // For now, we'll leave token tracking as estimates or disabled
  
  const verifiedQuestions = verificationResponse.output || generatedQuestions;
  
  // STEP 3: Final processing and packaging
  const totalTokens = totalInputTokens + totalOutputTokens;
  const cost = ((totalInputTokens / 1000) * INPUT_PRICE_PER_1K_TOKENS_USD + 
               (totalOutputTokens / 1000) * OUTPUT_PRICE_PER_1K_TOKENS_USD) * USD_TO_INR_RATE;
  
  const processingTime = Date.now() - startTime;
  
  return {
    mcqs: verifiedQuestions.mcqs,
    totalTokens,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    cost: Math.round(cost * 100) / 100,
    processingTime,
  };
}

const _dailyQuizFlow = ai.defineFlow(
  {
    name: 'dailyQuizFlow',
    inputSchema: DailyQuizInputSchema,
    outputSchema: DailyQuizOutputSchema,
  },
  async (input) => {
    const startTime = Date.now();
    
    // Get syllabus content for context
    const { prelims, mains } = getSyllabusContent();
    
    // Track token usage and cost
    const totalInputTokens = 0;
    const totalOutputTokens = 0;
    const USD_TO_INR_RATE = 83;
    const INPUT_PRICE_PER_1K_TOKENS_USD = 0.00035;
    const OUTPUT_PRICE_PER_1K_TOKENS_USD = 0.00105;
    
    // STEP 1: Generate initial quiz questions
    const generatorResponse = await quizGeneratorAgent({
      ...input,
      prelimsSyllabus: prelims || '',
      mainsSyllabus: mains || '',
    });
    
    // Note: If you need token tracking, you'll need to implement a custom solution
  // or check if the current API version provides usage information elsewhere
  // For now, we'll leave token tracking as estimates or disabled
    
    const generatedQuestions = generatorResponse.output;
    
    if (!generatedQuestions || !generatedQuestions.mcqs || generatedQuestions.mcqs.length === 0) {
      throw new Error("Failed to generate quiz questions");
    }
    
    // STEP 2: Verify and improve quiz questions
    const verificationResponse = await quizVerificationAgent({
      mcqs: generatedQuestions.mcqs,
      subject: input.subject,
      difficulty: input.difficulty,
    });
    
    // Note: If you need token tracking, you'll need to implement a custom solution
  // or check if the current API version provides usage information elsewhere
  // For now, we'll leave token tracking as estimates or disabled
    
    const verifiedQuestions = verificationResponse.output || generatedQuestions;
    
    // STEP 3: Final processing and packaging
    const totalTokens = totalInputTokens + totalOutputTokens;
    const cost = ((totalInputTokens / 1000) * INPUT_PRICE_PER_1K_TOKENS_USD + 
                 (totalOutputTokens / 1000) * OUTPUT_PRICE_PER_1K_TOKENS_USD) * USD_TO_INR_RATE;
    
    const processingTime = Date.now() - startTime;
    
    return {
      mcqs: verifiedQuestions.mcqs,
      totalTokens,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      cost: Math.round(cost * 100) / 100,
      processingTime,
    };
  }
);
