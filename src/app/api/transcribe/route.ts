
import { NextRequest, NextResponse } from 'next/server';
import { run } from '@genkit-ai/flow';
import { transcriptionFlow } from '@/ai/flows/transcription-flow';
import { streamToBuffer } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const audioStream = req.body;
    if (!audioStream) {
      return NextResponse.json({ error: 'Missing audio data' }, { status: 400 });
    }

    const audioBuffer = await streamToBuffer(audioStream);

    // Use type assertion to handle the return type from the flow
    const result = await run(transcriptionFlow, {
        input: { data: audioBuffer, mimeType: 'audio/wav' }
    }) as { transcription: string };
    
    const { transcription } = result;

    return NextResponse.json({ transcription });
  } catch (err) {
    console.error('Transcription error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
