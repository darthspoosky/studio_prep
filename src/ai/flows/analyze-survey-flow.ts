'use server';
/**
 * @fileOverview An AI flow to analyze user survey feedback.
 *
 * - analyzeSurvey - A function that handles the survey analysis.
 * - SurveyAnalysisInput - The input type for the analyzeSurvey function.
 * - SurveyAnalysisOutput - The return type for the analyzeSurvey function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SurveyAnalysisInputSchema = z.object({
  examType: z.string().describe('The type of exam the user is studying for.'),
  goal: z.string().describe("The user's primary goal for the exam."),
  studyTime: z.string().describe('The amount of time the user can dedicate to studying daily.'),
  frustrations: z.string().describe("The user's biggest frustrations with studying."),
  featureRequests: z.string().describe('Features the user would like to see in the app.'),
});
export type SurveyAnalysisInput = z.infer<typeof SurveyAnalysisInputSchema>;

const SurveyAnalysisOutputSchema = z.object({
  personalizedMessage: z
    .string()
    .describe('A personalized message thanking the user and acknowledging their feedback.'),
});
export type SurveyAnalysisOutput = z.infer<typeof SurveyAnalysisOutputSchema>;

export async function analyzeSurvey(input: SurveyAnalysisInput): Promise<SurveyAnalysisOutput> {
  return await analyzeSurveyFlow(input);
}

const surveyAnalysisPrompt = ai.definePrompt({
  name: 'surveyAnalysisPrompt',
  input: { schema: SurveyAnalysisInputSchema },
  output: { schema: SurveyAnalysisOutputSchema },
  prompt: `You are a friendly and encouraging product manager for PrepTalk, an AI-powered exam prep app. 
A user has just submitted survey feedback. Your task is to generate a short, personalized thank you message (2-3 sentences).

Acknowledge their specific frustrations and/or feature requests in a way that makes them feel heard and valued.
If possible, subtly reference their goal or study time to make the message feel even more personal.
Do not just repeat what they said. Instead, show empathy and connect their feedback to potential improvements.

Maintain a positive and forward-looking tone. End by saying how valuable their input is.

User's exam type: {{{examType}}}
User's goal: {{{goal}}}
Daily study time: {{{studyTime}}}
User's frustrations: "{{{frustrations}}}"
User's feature requests: "{{{featureRequests}}}"

Example Response:
"Thank you so much for your feedback! We hear you on the challenge of staying motivated—it's a tough one, especially when you're aiming for a top rank with limited study time. We're already exploring features like gamification to help. Your input is incredibly valuable as we build!"

Generate the personalized message now.`,
});


const analyzeSurveyFlow = ai.defineFlow(
  {
    name: 'analyzeSurveyFlow',
    inputSchema: SurveyAnalysisInputSchema,
    outputSchema: SurveyAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await surveyAnalysisPrompt(input);
    return output!;
  }
);
