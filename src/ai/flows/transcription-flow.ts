
import { defineFlow } from '@genkit-ai/flow';
import { googleAI } from '@genkit-ai/googleai';
import * as z from 'zod';

export const transcriptionFlow = defineFlow(
  {
    name: 'transcriptionFlow',
    inputSchema: z.any(), // Using any for now, will refine later
    outputSchema: z.object({ transcription: z.string() }),
  },
  async (audio) => {
    // Using the correct API for the model
    const model = googleAI().generativeModel('gemini-1.5-flash');
    const response = await model.generate({
        prompt: "Transcribe the following audio:",
        data: audio
    });

    return { transcription: response.text() };
  }
);

// No need to call startFlows() - it's handled by the @genkit-ai/next integration
