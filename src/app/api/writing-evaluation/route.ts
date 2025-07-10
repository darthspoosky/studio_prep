/**
 * Writing Evaluation API Route
 * Handles comprehensive writing analysis using OpenAI and Claude
 */

import { NextRequest, NextResponse } from 'next/server';
import { WritingEvaluationService } from '@/services/writingEvaluationService';
import { z } from 'zod';

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
};

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }

  if (clientData.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  clientData.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

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

export async function GET(request: NextRequest) {
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