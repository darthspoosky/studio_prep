
import { NextRequest, NextResponse } from 'next/server';
import { run } from '@genkit-ai/flow';
import { transcriptionFlow } from '@/ai/flows/transcription-flow';
import { streamToBuffer } from '@/lib/utils';
import { createAuthenticatedHandler, getRateLimitKey, rateLimit } from '@/lib/auth-middleware';

// Audio file validation constants
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB
const SUPPORTED_AUDIO_TYPES = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/webm'];

async function handler(req: NextRequest) {
  // Rate limiting - 10 transcriptions per minute per user
  const rateLimitKey = getRateLimitKey(req);
  if (!rateLimit(rateLimitKey, 10, 60000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const audioStream = req.body;
    if (!audioStream) {
      return NextResponse.json({ error: 'Missing audio data' }, { status: 400 });
    }

    // Convert stream to buffer and validate
    const audioBuffer = await streamToBuffer(audioStream);
    
    if (audioBuffer.length === 0) {
      return NextResponse.json({ error: 'Empty audio file provided' }, { status: 400 });
    }

    if (audioBuffer.length > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: `Audio file too large. Maximum size is ${MAX_AUDIO_SIZE / (1024 * 1024)}MB` },
        { status: 413 }
      );
    }

    // Basic audio format validation (check for common audio headers)
    const isValidAudio = validateAudioFormat(audioBuffer);
    if (!isValidAudio) {
      return NextResponse.json(
        { error: 'Invalid audio format. Please upload a valid audio file.' },
        { status: 400 }
      );
    }

    const audioDataUri = `data:audio/wav;base64,${audioBuffer.toString('base64')}`;
    
    const result = await transcriptionFlow({ audioDataUri });
    const transcription = result?.transcription;

    if (!transcription || transcription.trim().length === 0) {
      return NextResponse.json(
        { error: 'No speech detected in the audio file' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      transcription,
      metadata: {
        audioSize: audioBuffer.length,
        processedAt: new Date().toISOString(),
        transcriptionLength: transcription.length
      }
    });
  } catch (err) {
    console.error('Transcription error:', err);
    
    // Don't expose internal errors
    return NextResponse.json(
      { error: 'Unable to process audio file. Please try again with a different audio file.' },
      { status: 500 }
    );
  }
}

function validateAudioFormat(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  
  // Check for common audio file signatures
  const header = buffer.subarray(0, 12);
  
  // WAV file signature
  if (header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WAVE') {
    return true;
  }
  
  // MP3 file signature
  if (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) {
    return true;
  }
  
  // M4A/MP4 file signature
  if (header.subarray(4, 8).toString() === 'ftyp') {
    return true;
  }
  
  // OGG file signature
  if (header.subarray(0, 4).toString() === 'OggS') {
    return true;
  }
  
  return false;
}

export const POST = createAuthenticatedHandler(handler);
