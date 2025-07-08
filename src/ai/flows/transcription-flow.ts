'use server';
import { ai } from '@/ai/genkit';
import * as z from 'zod';

export const transcriptionFlow = ai.defineFlow(
  {
    name: 'transcriptionFlow',
    inputSchema: z.object({
      audioDataUri: z.string().describe("Audio to be transcribed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
    }),
    outputSchema: z.object({
      transcription: z.string()
    }),
  },
  async ({ audioDataUri }) => {
    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-pro',
      prompt: [
        { text: "Transcribe the following audio precisely." },
        { media: { url: audioDataUri } },
      ],
    });

    return { transcription: text };
  }
);
