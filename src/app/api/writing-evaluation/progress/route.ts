/**
 * Progress Tracking API Route
 * Handles user writing progress analytics and improvement tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProgressTrackingService } from '@/services/progressTrackingService';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const querySchema = z.object({
      userId: z.string().min(1, 'User ID required'),
      timeframe: z.enum(['7d', '30d', '90d', 'all']).default('30d')
    });

    const { userId, timeframe } = querySchema.parse({
      userId: searchParams.get('userId'),
      timeframe: searchParams.get('timeframe') || '30d'
    });

    const progressService = new ProgressTrackingService();
    const analytics = await progressService.getProgressAnalytics(userId, timeframe);

    return NextResponse.json({
      success: true,
      analytics,
      metadata: {
        userId,
        timeframe,
        generatedAt: new Date().toISOString(),
        dataPoints: analytics.overallTrend.currentAverage > 0 ? 'sufficient' : 'limited'
      }
    });

  } catch (error) {
    console.error('Progress analytics API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch progress analytics. Please try again.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const sessionSchema = z.object({
      userId: z.string().min(1, 'User ID required'),
      questionId: z.string().min(1, 'Question ID required'),
      examType: z.string().min(1, 'Exam type required'),
      subject: z.string().min(1, 'Subject required'),
      score: z.number().min(0).max(100),
      detailedScores: z.object({
        content: z.number().min(0).max(100),
        structure: z.number().min(0).max(100),
        language: z.number().min(0).max(100),
        presentation: z.number().min(0).max(100),
        timeManagement: z.number().min(0).max(100)
      }),
      metadata: z.object({
        timeSpent: z.number().min(1),
        wordCount: z.number().min(1),
        difficulty: z.string(),
        source: z.enum(['text', 'upload', 'ocr'])
      })
    });

    const sessionData = sessionSchema.parse(body);

    const progressService = new ProgressTrackingService();
    const recordedSession = await progressService.recordWritingSession(sessionData);

    // Get updated analytics after recording
    const updatedAnalytics = await progressService.getProgressAnalytics(sessionData.userId, '30d');

    return NextResponse.json({
      success: true,
      session: recordedSession,
      updatedAnalytics,
      message: 'Writing session recorded successfully'
    });

  } catch (error) {
    console.error('Session recording API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid session data',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record writing session. Please try again.' },
      { status: 500 }
    );
  }
}