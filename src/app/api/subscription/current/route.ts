import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/services/subscriptionService';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
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

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user subscription
    const subscription = await SubscriptionService.getUserSubscription(userId);
    const profile = await SubscriptionService.getUserProfile(userId);

    if (!subscription || !profile) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Return subscription details
    return NextResponse.json({
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        currency: subscription.currency,
      },
      profile: {
        currentTier: profile.currentTier,
        subscriptionStatus: profile.subscriptionStatus,
        currentStage: profile.currentStage,
        onboardingCompleted: profile.onboardingCompleted,
      }
    });

  } catch (error) {
    console.error('Error getting current subscription:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription details' },
      { status: 500 }
    );
  }
}