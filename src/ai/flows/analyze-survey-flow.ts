'use server';
/**
 * @fileOverview An AI flow to analyze user survey feedback and store valid ideas.
 *
 * - analyzeSurvey - A function that handles the survey analysis.
 * - SurveyAnalysisInput - The input type for the analyzeSurvey function.
 * - SurveyAnalysisOutput - The return type for the analyzeSurvey function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { addIdea } from '@/services/ideasService';

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
  const analysisPromise = analyzeSurveyFlow(input);

  // Don't wait for moderation to finish, but let it run in the background.
  // This makes the UI feel faster for the user.
  moderateAndStoreIdea(input).catch(console.error);
  
  return await analysisPromise;
}

async function moderateAndStoreIdea(input: SurveyAnalysisInput) {
  try {
    // Generate content using the AI model with safety settings
    // Content moderation happens through the safety settings configuration
    try {
      await ai.generate({
        // We pass the user-generated content directly as the prompt
        prompt: input.featureRequests,
        config: {
          // Use strict safety settings to block harmful content
          // The model will refuse to generate if the prompt is unsafe
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        },
      });
      
      // If we get here, content passed safety filters
      console.log('Idea passed content safety filter');
    } catch (error) {
      // If an error is thrown during generation, it's likely due to safety filters
      console.log('Idea rejected by content safety filter:', input.featureRequests);
      return;
    }
    
    // Generate a persona for the Idea Wall
    const role = `${input.examType} Student`;
    const author = `${input.goal.split(' ')[0]} Aspirant`;
    const avatar = author.split(' ').map(n => n[0]).join('') || 'U';
    
    // Simple way to cycle through a few colors
    const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(200 96% 87%)', 'hsl(300 96% 87%)', 'hsl(150 96% 87%)', 'hsl(50 96% 87%)'];
    const glowColor = colors[Math.floor(Math.random() * colors.length)];

    // If safe, add the idea to Firestore, now saving all survey inputs.
    await addIdea({
      ...input,
      author,
      role,
      avatar,
      glowColor,
    });
    
    console.log('Idea stored successfully:', input.featureRequests);

  } catch (error) {
    console.error('Error in moderateAndStoreIdea:', error);
  }
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
