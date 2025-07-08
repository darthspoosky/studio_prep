
import { NextRequest, NextResponse } from 'next/server';
import { run } from '@genkit-ai/flow';
import { textToSpeechFlow } from '@/ai/flows/text-to-speech-flow';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const result = await run(textToSpeechFlow, text) as { media: string };
    
    // Return the data URI directly
    return NextResponse.json({
      audio: result.media,
    });
  } catch (err) {
    console.error('TTS error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
