
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
    const audioDataUri = `data:audio/wav;base64,${audioBuffer.toString('base64')}`;
    
    const { transcription } = await run(transcriptionFlow, { audioDataUri });

    return NextResponse.json({ transcription });
  } catch (err) {
    console.error('Transcription error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
