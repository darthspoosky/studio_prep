/**
 * Writing Evaluation API Route
 * Handles comprehensive writing analysis using OpenAI and Claude
 */

import { NextRequest, NextResponse } from 'next/server';
import { WritingEvaluationService } from '@/services/writingEvaluationService';
import { createAuthenticatedHandler, getRateLimitKey, rateLimit } from '@/lib/auth-middleware';
import { z } from 'zod';

async function handler(request: NextRequest) {
  // Rate limiting - 10 evaluations per minute per user
  const rateLimitKey = getRateLimitKey(request);
  if (!rateLimit(rateLimitKey, 10, 60000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {

    // Parse and validate request body
    const body = await request.json();
    
    const requestSchema = z.object({
      content: z.string().min(100, 'Answer must be at least 100 characters').max(10000, 'Answer too long'),
      questionText: z.string().min(10, 'Question text required'),
      examType: z.string().default('UPSC Mains'),
      subject: z.string().default('General Studies'),
      metadata: z.object({
        timeSpent: z.number().min(1),
        wordCount: z.number().min(1),
        keystrokes: z.number().min(1),
        pauses: z.array(z.number()),
        source: z.enum(['text', 'upload', 'ocr']).default('text')
      }).optional()
    });

    const validatedData = requestSchema.parse(body);

    // Initialize evaluation service
    const evaluationService = new WritingEvaluationService();

    // Perform evaluation
    const result = await evaluationService.evaluateWriting(validatedData);

    // Log usage for analytics (in production, use proper analytics service)
    console.log(`Evaluation completed for ${validatedData.examType} - Score: ${result.overallScore}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Writing evaluation API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Rate limit') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }

      if (error.message.includes('Invalid API key')) {
        return NextResponse.json(
          { error: 'Service configuration error' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Writing evaluation failed. Please try again.' },
      { status: 500 }
    );
  }
}

function healthCheckHandler(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    status: 'healthy',
    service: 'writing-evaluation',
    timestamp: new Date().toISOString(),
    models: {
      openai: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']
    }
  });
}

export const POST = createAuthenticatedHandler(handler);
export const GET = createAuthenticatedHandler(healthCheckHandler);