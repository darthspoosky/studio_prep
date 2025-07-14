import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/services/subscriptionService';
import { SubscriptionTier, canUpgradeTo } from '@/lib/subscription-tiers';
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

// POST /api/subscription/upgrade - Upgrade subscription tier
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetTier, billingCycle = 'monthly', paymentDetails } = body;

    // Validate input
    if (!targetTier) {
      return NextResponse.json(
        { error: 'Target tier is required' },
        { status: 400 }
      );
    }

    // Get current subscription
    const currentSubscription = await SubscriptionService.getUserSubscription(userId);
    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'Current subscription not found' },
        { status: 404 }
      );
    }

    // Validate upgrade path
    if (!canUpgradeTo(currentSubscription.tier, targetTier as SubscriptionTier)) {
      return NextResponse.json(
        { error: 'Invalid upgrade path' },
        { status: 400 }
      );
    }

    // For free tier upgrades, payment details are required
    if (targetTier !== 'free' && !paymentDetails) {
      return NextResponse.json(
        { error: 'Payment details required for paid tiers' },
        { status: 400 }
      );
    }

    try {
      // Update subscription tier
      await SubscriptionService.updateSubscriptionTier(
        userId,
        targetTier as SubscriptionTier,
        paymentDetails
      );

      return NextResponse.json({
        success: true,
        message: 'Subscription upgraded successfully',
        newTier: targetTier,
        billingCycle
      });

    } catch (upgradeError) {
      console.error('Error upgrading subscription:', upgradeError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to upgrade subscription',
          message: upgradeError instanceof Error ? upgradeError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing upgrade request:', error);
    return NextResponse.json(
      { error: 'Failed to process upgrade request' },
      { status: 500 }
    );
  }
}

// GET /api/subscription/upgrade - Get available upgrade options
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current subscription
    const currentSubscription = await SubscriptionService.getUserSubscription(userId);
    const profile = await SubscriptionService.getUserProfile(userId);

    if (!currentSubscription || !profile) {
      return NextResponse.json(
        { error: 'Subscription data not found' },
        { status: 404 }
      );
    }

    // Get available tiers for upgrade
    const { SUBSCRIPTION_PLANS } = await import('@/lib/subscription-tiers');
    const allTiers: SubscriptionTier[] = ['free', 'foundation', 'practice', 'mains', 'interview', 'elite'];
    
    const availableUpgrades = allTiers
      .filter(tier => canUpgradeTo(currentSubscription.tier, tier))
      .map(tier => ({
        tier,
        plan: SUBSCRIPTION_PLANS[tier],
        isRecommended: tier === 'foundation' && currentSubscription.tier === 'free'
      }));

    return NextResponse.json({
      currentTier: currentSubscription.tier,
      currentStage: profile.currentStage,
      availableUpgrades,
      subscriptionStatus: currentSubscription.status
    });

  } catch (error) {
    console.error('Error getting upgrade options:', error);
    return NextResponse.json(
      { error: 'Failed to get upgrade options' },
      { status: 500 }
    );
  }
}