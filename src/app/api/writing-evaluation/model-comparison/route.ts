/**
 * Model Answer Comparison API Route
 * Handles comparison between user answers and model answers
 */

import { NextRequest, NextResponse } from 'next/server';
import { ModelAnswerService } from '@/services/modelAnswerService';
import { z } from 'zod';

const comparisonRateLimit = new Map<string, { count: number; resetTime: number }>();
const COMPARISON_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
};

function checkComparisonRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = comparisonRateLimit.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    comparisonRateLimit.set(clientId, { count: 1, resetTime: now + COMPARISON_RATE_LIMIT.windowMs });
    return true;
  }

  if (clientData.count >= COMPARISON_RATE_LIMIT.maxRequests) {
    return false;
  }

  clientData.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    if (!checkComparisonRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for model comparison. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    const requestSchema = z.object({
      userAnswer: z.string().min(100, 'Answer must be at least 100 characters'),
      questionText: z.string().min(10, 'Question text required'),
      examType: z.string().default('UPSC Mains'),
      subject: z.string().default('General Studies'),
      generateModelAnswer: z.boolean().default(true)
    });

    const { userAnswer, questionText, examType, subject, generateModelAnswer } = requestSchema.parse(body);

    const modelAnswerService = new ModelAnswerService();

    // Generate or retrieve model answer
    let modelAnswer;
    if (generateModelAnswer) {
      modelAnswer = await modelAnswerService.generateModelAnswer(questionText, examType, subject);
    } else {
      // In production, this would search for existing model answers
      const similarAnswers = await modelAnswerService.findSimilarModelAnswers(questionText, examType);
      modelAnswer = similarAnswers[0];
      
      if (!modelAnswer) {
        modelAnswer = await modelAnswerService.generateModelAnswer(questionText, examType, subject);
      }
    }

    // Perform comparison
    const comparison = await modelAnswerService.compareWithModelAnswer(
      userAnswer, 
      modelAnswer, 
      questionText
    );

    // Generate improvement plan
    const improvementPlan = await modelAnswerService.generateImprovementPlan(
      comparison,
      'intermediate' // This would come from user profile in production
    );

    // Analyze peer performance
    const estimatedUserScore = Math.round(
      (comparison.similarity + (100 - comparison.coverageGap) + comparison.structuralAlignment) / 3
    );
    
    const peerAnalysis = await modelAnswerService.analyzePeerPerformance(
      estimatedUserScore,
      'q_comparison',
      examType
    );

    const response = {
      success: true,
      modelAnswer: {
        id: modelAnswer.id,
        content: modelAnswer.content,
        score: modelAnswer.score,
        structure: modelAnswer.structure,
        keywords: modelAnswer.keywords,
        authorType: modelAnswer.authorType
      },
      comparison,
      improvementPlan,
      peerAnalysis,
      estimatedScore: estimatedUserScore,
      metadata: {
        comparisonId: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        processedAt: new Date().toISOString(),
        processingTime: Date.now() - Date.now() // This would be calculated properly
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Model comparison API error:', error);

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
    }

    return NextResponse.json(
      { error: 'Model comparison failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'model-comparison',
    status: 'active',
    features: [
      'AI-generated model answers',
      'Detailed comparison analysis',
      'Improvement roadmap generation',
      'Peer performance benchmarking'
    ],
    rateLimit: COMPARISON_RATE_LIMIT
  });
}