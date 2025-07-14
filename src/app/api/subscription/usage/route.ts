import { NextRequest, NextResponse } from 'next/server';
import { UsageTrackingService, ToolType, validateUsageMiddleware } from '@/services/usageTrackingService';
import { SubscriptionService } from '@/services/subscriptionService';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
}

async function verifyAuthToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

// GET /api/subscription/usage - Get current usage
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Get current usage
    const currentUsage = await UsageTrackingService.getCurrentUsage(userId);
    
    // Get usage summary
    const usageSummary = await UsageTrackingService.getUsageSummary(userId, days);
    
    // Get user profile for tier information
    const profile = await SubscriptionService.getUserProfile(userId);
    
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check usage limits
    const limitCheck = await UsageTrackingService.checkUsageLimits(userId, profile.currentTier);
    
    // Get streak information
    const streak = await UsageTrackingService.getUsageStreak(userId);

    return NextResponse.json({
      currentUsage,
      summary: usageSummary,
      limits: limitCheck,
      streak,
      userTier: profile.currentTier
    });

  } catch (error) {
    console.error('Error getting usage data:', error);
    return NextResponse.json(
      { error: 'Failed to get usage data' },
      { status: 500 }
    );
  }
}

// POST /api/subscription/usage - Validate and record usage
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { toolType, amount = 1 } = body;

    // Validate input
    if (!toolType || !['quiz', 'currentAffairs', 'writing', 'interview'].includes(toolType)) {
      return NextResponse.json(
        { error: 'Invalid tool type' },
        { status: 400 }
      );
    }

    // Get user profile for tier
    const profile = await SubscriptionService.getUserProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Validate and record usage
    const result = await validateUsageMiddleware(
      userId,
      profile.currentTier,
      toolType as ToolType,
      amount
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message,
        remaining: result.remaining,
        userTier: profile.currentTier
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      remaining: result.remaining,
      message: 'Usage recorded successfully'
    });

  } catch (error) {
    console.error('Error validating/recording usage:', error);
    return NextResponse.json(
      { error: 'Failed to validate usage' },
      { status: 500 }
    );
  }
}

// PUT /api/subscription/usage/validate - Just validate without recording
export async function PUT(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { toolType } = body;

    if (!toolType || !['quiz', 'currentAffairs', 'writing', 'interview'].includes(toolType)) {
      return NextResponse.json(
        { error: 'Invalid tool type' },
        { status: 400 }
      );
    }

    // Get user profile for tier
    const profile = await SubscriptionService.getUserProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Just validate without recording
    const validation = await UsageTrackingService.validateToolAccess(
      userId,
      profile.currentTier,
      toolType as ToolType
    );

    return NextResponse.json({
      allowed: validation.allowed,
      remaining: validation.remaining,
      message: validation.message,
      userTier: profile.currentTier,
      requiresUpgrade: validation.requiresUpgrade
    });

  } catch (error) {
    console.error('Error validating usage:', error);
    return NextResponse.json(
      { error: 'Failed to validate usage' },
      { status: 500 }
    );
  }
}