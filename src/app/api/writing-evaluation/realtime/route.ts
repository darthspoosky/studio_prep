/**
 * Real-time Writing Suggestions API
 * Provides quick suggestions while user is typing
 */

import { NextRequest, NextResponse } from 'next/server';
import { WritingEvaluationService } from '@/services/writingEvaluationService';
import { z } from 'zod';

const realtimeRateLimit = new Map<string, { count: number; resetTime: number }>();
const REALTIME_RATE_LIMIT = {
  maxRequests: 30, // Higher limit for real-time features
  windowMs: 60 * 1000, // 1 minute
};

function checkRealtimeRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = realtimeRateLimit.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    realtimeRateLimit.set(clientId, { count: 1, resetTime: now + REALTIME_RATE_LIMIT.windowMs });
    return true;
  }

  if (clientData.count >= REALTIME_RATE_LIMIT.maxRequests) {
    return false;
  }

  clientData.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for real-time requests
    const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    if (!checkRealtimeRateLimit(clientId)) {
      return NextResponse.json(
        { suggestions: [], error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    const requestSchema = z.object({
      content: z.string().min(20).max(5000),
      context: z.string().min(10),
      questionText: z.string().optional(),
      examType: z.string().default('UPSC Mains'),
    });

    const { content, context, questionText, examType } = requestSchema.parse(body);

    // Quick validation - don't process if content is too short
    if (content.length < 50) {
      return NextResponse.json({ suggestions: [] });
    }

    const evaluationService = new WritingEvaluationService();
    const suggestions = await evaluationService.getRealtimeSuggestions(
      content, 
      context || questionText || `${examType} answer`
    );

    return NextResponse.json({ 
      suggestions,
      timestamp: new Date().toISOString(),
      contentLength: content.length
    });

  } catch (error) {
    console.error('Realtime suggestions error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { suggestions: [], error: 'Invalid request' },
        { status: 400 }
      );
    }

    // For real-time features, fail gracefully
    return NextResponse.json({ 
      suggestions: [],
      error: 'Suggestions temporarily unavailable'
    });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'realtime-suggestions',
    status: 'active',
    rateLimit: REALTIME_RATE_LIMIT
  });
}