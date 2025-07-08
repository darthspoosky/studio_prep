
import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const result = await textToSpeech(text);
    
    // Return the data URI directly
    return NextResponse.json({
      audio: result.media,
    });
  } catch (err) {
    console.error('TTS error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
