'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const mockInterviewFlow = ai.defineFlow(
  {
    name: 'mockInterviewFlow',
    inputSchema: z.object({
      interviewType: z.string(),
      difficulty: z.string(),
      roleProfile: z.string().optional(),
      transcript: z.array(z.object({
          role: z.enum(['user', 'model']),
          content: z.string(),
      })).optional(),
      questionCount: z.number().default(0),
    }),
    outputSchema: z.object({
      question: z.string().optional(),
      feedback: z.string().optional(),
      isComplete: z.boolean(),
    }),
  },
  async (input) => {
    const { interviewType, difficulty, roleProfile, transcript, questionCount } = input;

    if (questionCount >= 5) { // Limit to 5 questions for MVP
      const { text } = await ai.generate({
        prompt: `Given the following interview transcript: "${JSON.stringify(transcript)}", provide a concise overall feedback on the candidate's performance, focusing on clarity, relevance, and structure.`,
      });
      return { feedback: text, isComplete: true };
    }

    let promptText: string;
    if (transcript && transcript.length > 0) {
      promptText = `This is an ongoing interview. The conversation so far is: ${JSON.stringify(transcript)}. Based on the last answer, ask the next follow-up question for a ${interviewType} exam at ${difficulty} level. Your response should contain ONLY the next question text.`;
    } else {
      promptText = `Act as an expert interviewer for a ${interviewType} exam at ${difficulty} level. ${roleProfile ? `The candidate's role profile is: ${roleProfile}.` : ''} Ask the first question. Your response should contain ONLY the question text.`;
    }

    const { text } = await ai.generate({
      prompt: promptText,
    });

    return {
      question: text,
      isComplete: false,
    };
  }
);
