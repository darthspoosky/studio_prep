/**
 * Real-time Writing Suggestions API
 * Provides quick suggestions while user is typing
 */

import { NextRequest, NextResponse } from 'next/server';
import { WritingEvaluationService } from '@/services/writingEvaluationService';
import { createAuthenticatedHandler, getRateLimitKey, rateLimit } from '@/lib/auth-middleware';
import { z } from 'zod';

async function handler(request: NextRequest) {
  // Rate limiting - 30 realtime suggestions per minute per user
  const rateLimitKey = getRateLimitKey(request);
  if (!rateLimit(rateLimitKey, 30, 60000)) {
    return NextResponse.json(
      { suggestions: [], error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {

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

function healthCheckHandler() {
  return NextResponse.json({
    service: 'realtime-suggestions',
    status: 'active',
    rateLimit: {
      maxRequests: 30,
      windowMs: 60000
    }
  });
}

export const POST = createAuthenticatedHandler(handler);
export const GET = createAuthenticatedHandler(healthCheckHandler);