
import { NextRequest, NextResponse } from 'next/server';
import { run } from '@genkit-ai/flow';
import { textToSpeechFlow } from '@/ai/flows/text-to-speech-flow';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    // @ts-expect-error - Flow typing issue with run function
    const result = await run(textToSpeechFlow, { input: { text } });
    // Type assertion to handle the response structure
    const typedResult = result as { audio: Buffer, text: string };
    
    // Return both text and base64-encoded audio for client-side usage
    return NextResponse.json({
      text: typedResult.text || text, // Use original text as fallback if result.text is undefined
      audio: typedResult.audio.toString('base64')
    });
  } catch (err) {
    console.error('TTS error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
