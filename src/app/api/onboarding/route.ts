import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService, OnboardingData } from '@/services/subscriptionService';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { SubscriptionTier, UserStage } from '@/lib/subscription-tiers';

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

// GET /api/onboarding - Get current onboarding status
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const onboardingData = await SubscriptionService.getOnboardingData(userId);
    const profile = await SubscriptionService.getUserProfile(userId);

    return NextResponse.json({
      onboarding: onboardingData,
      onboardingCompleted: profile?.onboardingCompleted || false,
      currentStage: profile?.currentStage || 'assessment',
      currentTier: profile?.currentTier || 'free'
    });

  } catch (error) {
    console.error('Error getting onboarding data:', error);
    return NextResponse.json(
      { error: 'Failed to get onboarding data' },
      { status: 500 }
    );
  }
}

// POST /api/onboarding - Save onboarding progress
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { step, data, completed = false } = body;

    if (!step) {
      return NextResponse.json(
        { error: 'Missing step information' },
        { status: 400 }
      );
    }

    // Save onboarding data
    await SubscriptionService.saveOnboardingData({
      userId,
      currentStep: step,
      completed,
      ...data
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding progress saved'
    });

  } catch (error) {
    console.error('Error saving onboarding data:', error);
    return NextResponse.json(
      { error: 'Failed to save onboarding data' },
      { status: 500 }
    );
  }
}

// PUT /api/onboarding - Complete onboarding
export async function PUT(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      assessmentAnswers,
      goals,
      experience,
      preferences,
      determinedStage,
      recommendedTier
    } = body;

    // Validate required data
    if (!assessmentAnswers || !determinedStage) {
      return NextResponse.json(
        { error: 'Missing required onboarding data' },
        { status: 400 }
      );
    }

    // Complete onboarding
    const onboardingData: OnboardingData = {
      userId,
      completed: true,
      currentStep: 'completion',
      assessmentAnswers,
      determinedStage: determinedStage as UserStage,
      goals: goals || {},
      experience: experience || {},
      preferences: preferences || {},
      recommendedTier: recommendedTier as SubscriptionTier || 'foundation',
      createdAt: new Date() as any // Will be converted to Timestamp in service
    };

    await SubscriptionService.completeOnboarding(userId, onboardingData);

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      determinedStage,
      recommendedTier
    });

  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}