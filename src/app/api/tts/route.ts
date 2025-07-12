
import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { createAuthenticatedHandler, getRateLimitKey, rateLimit } from '@/lib/auth-middleware';
import { z } from 'zod';

// Input validation schema
const inputSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000, 'Text too long - maximum 5000 characters'),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional().default('alloy'),
  speed: z.number().min(0.25).max(4.0).optional().default(1.0),
  format: z.enum(['mp3', 'opus', 'aac', 'flac']).optional().default('mp3')
});

async function handler(req: NextRequest) {
  // Rate limiting - 20 TTS requests per minute per user
  const rateLimitKey = getRateLimitKey(req);
  if (!rateLimit(rateLimitKey, 20, 60000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    
    const inputValidation = inputSchema.safeParse(body);
    if (!inputValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input parameters',
          details: inputValidation.error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }

    const { text, voice, speed, format } = inputValidation.data;

    // Additional text content validation
    if (text.trim().length === 0) {
      return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 });
    }

    // Check for potentially harmful content patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /<script/i,
      /data:text\/html/i,
      /vbscript:/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(text))) {
      return NextResponse.json({ error: 'Invalid text content' }, { status: 400 });
    }

    const result = await textToSpeech(text, { voice, speed, format });
    
    if (!result.media) {
      return NextResponse.json(
        { error: 'Failed to generate audio. Please try again.' },
        { status: 500 }
      );
    }
    
    // Return the data URI with metadata
    return NextResponse.json({
      audio: result.media,
      metadata: {
        textLength: text.length,
        voice: voice,
        speed: speed,
        format: format,
        processedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('TTS error:', err);
    
    // Don't expose internal errors
    return NextResponse.json(
      { error: 'Unable to generate speech. Please try again with different text.' },
      { status: 500 }
    );
  }
}

export const POST = createAuthenticatedHandler(handler);
