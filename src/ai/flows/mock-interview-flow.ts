
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MockInterviewFlowInputSchema = z.object({
  interviewType: z.string(),
  difficulty: z.string(),
  roleProfile: z.string().optional(),
  transcript: z.array(z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
  })).optional().describe("The history of the conversation so far."),
  questionCount: z.number().default(0).describe("The number of questions already asked."),
});

const MockInterviewFlowOutputSchema = z.object({
  question: z.string().optional().nullable().describe("The next question to ask the user. Null if the interview is complete."),
  feedback: z.string().optional().nullable().describe("The final feedback for the user. Null if the interview is ongoing."),
  isComplete: z.boolean().describe("Whether the interview has concluded."),
});

const interviewAgent = ai.definePrompt({
    name: 'interviewAgent',
    input: { schema: MockInterviewFlowInputSchema },
    output: { schema: MockInterviewFlowOutputSchema },
    prompt: `You are an expert interviewer for a {{{interviewType}}} exam at {{{difficulty}}} level. Your goal is to conduct a mock interview.

This is the current state of the interview:
Transcript: {{{json transcript}}}
Question Count: {{{questionCount}}}
Role Profile: {{{roleProfile}}}

RULES:
1. If questionCount is 0, ask the first question based on the interview type and role profile. The question should be engaging and relevant.
2. If questionCount > 0, ask a relevant follow-up question based on the user's last answer in the transcript.
3. Keep questions concise and relevant.
4. If questionCount >= 5, the interview is complete. Set 'isComplete' to true. Instead of a 'question', provide a concise overall feedback on the candidate's performance in the 'feedback' field, focusing on clarity, relevance, and structure.
5. Your entire response MUST be a valid JSON object that strictly adheres to the provided output schema. Do not include any text or formatting outside of the JSON object.

Example for first question: { "question": "Thank you for joining. To start, could you walk me through your understanding of the role as described in the profile?", "feedback": null, "isComplete": false }
Example for final feedback: { "question": null, "feedback": "Overall, you demonstrated a good grasp of the subject matter. To improve, focus on structuring your answers more clearly using the STAR method.", "isComplete": true }
`,
});

export const mockInterviewFlow = ai.defineFlow(
  {
    name: 'mockInterviewFlow',
    inputSchema: MockInterviewFlowInputSchema,
    outputSchema: MockInterviewFlowOutputSchema,
  },
  async (input) => {
    const { output } = await interviewAgent(input);
    if (!output) {
        throw new Error("The AI agent failed to provide a valid response.");
    }
    // Ensure that if the interview is not complete, a question is returned.
    if (!output.isComplete && !output.question) {
        // Fallback question if AI fails to generate one
        output.question = "I seem to have lost my train of thought. Could you please summarize your last point?";
    }
    return output;
  }
);
