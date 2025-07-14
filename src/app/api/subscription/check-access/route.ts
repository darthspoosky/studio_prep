import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

interface AccessCheckRequest {
  userId: string;
  requiredTier: string;
}

// Subscription tier hierarchy (higher index = higher tier)
const TIER_HIERARCHY = [
  'free',
  'foundation', 
  'practice',
  'mains',
  'interview',
  'elite'
];

// Feature access mapping
const FEATURE_ACCESS = {
  'free': {
    dailyQuizLimit: 5,
    quizTypes: ['free-daily'],
    features: ['basic_quiz', 'basic_results']
  },
  'foundation': {
    dailyQuizLimit: 15,
    quizTypes: ['free-daily', 'ncert-foundation', 'current-affairs-basic'],
    features: ['basic_quiz', 'basic_results', 'explanations', 'bookmarks']
  },
  'practice': {
    dailyQuizLimit: 50,
    quizTypes: ['free-daily', 'ncert-foundation', 'current-affairs-basic', 'past-year', 'subject-wise', 'current-affairs-advanced'],
    features: ['basic_quiz', 'basic_results', 'explanations', 'bookmarks', 'detailed_analytics', 'progress_tracking']
  },
  'mains': {
    dailyQuizLimit: 100,
    quizTypes: ['free-daily', 'ncert-foundation', 'current-affairs-basic', 'past-year', 'subject-wise', 'current-affairs-advanced', 'mock-prelims'],
    features: ['basic_quiz', 'basic_results', 'explanations', 'bookmarks', 'detailed_analytics', 'progress_tracking', 'writing_practice', 'mock_tests']
  },
  'interview': {
    dailyQuizLimit: 200,
    quizTypes: ['free-daily', 'ncert-foundation', 'current-affairs-basic', 'past-year', 'subject-wise', 'current-affairs-advanced', 'mock-prelims', 'adaptive'],
    features: ['basic_quiz', 'basic_results', 'explanations', 'bookmarks', 'detailed_analytics', 'progress_tracking', 'writing_practice', 'mock_tests', 'mock_interviews', 'personality_dev']
  },
  'elite': {
    dailyQuizLimit: -1, // Unlimited
    quizTypes: ['free-daily', 'ncert-foundation', 'current-affairs-basic', 'past-year', 'subject-wise', 'current-affairs-advanced', 'mock-prelims', 'adaptive', 'topper-bank', 'final-revision'],
    features: ['basic_quiz', 'basic_results', 'explanations', 'bookmarks', 'detailed_analytics', 'progress_tracking', 'writing_practice', 'mock_tests', 'mock_interviews', 'personality_dev', 'priority_support', 'exclusive_content']
  }
};

async function getUserSubscription(userId: string): Promise<any> {
  try {
    const userDoc = await db.collection('userSubscriptions').doc(userId).get();
    
    if (!userDoc.exists) {
      // Return free tier for new users
      return {
        tier: 'free',
        status: 'active',
        expiresAt: null,
        isNew: true
      };
    }

    const subscriptionData = userDoc.data();
    
    // Check if subscription is expired
    if (subscriptionData?.expiresAt && subscriptionData.expiresAt.toDate() < new Date()) {
      return {
        tier: 'free',
        status: 'expired',
        expiresAt: subscriptionData.expiresAt.toDate(),
        originalTier: subscriptionData.tier
      };
    }

    return {
      tier: subscriptionData?.tier || 'free',
      status: subscriptionData?.status || 'active',
      expiresAt: subscriptionData?.expiresAt?.toDate() || null,
      features: subscriptionData?.features || []
    };
  } catch (error) {
    console.error('User subscription fetch error:', error);
    // Default to free tier on error
    return {
      tier: 'free',
      status: 'active',
      expiresAt: null,
      error: true
    };
  }
}

async function checkDailyUsage(userId: string, userTier: string): Promise<{ hasQuota: boolean; used: number; limit: number }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const usageDoc = await db.collection('dailyUsage').doc(`${userId}_${today}`).get();
    
    const currentUsage = usageDoc.exists ? usageDoc.data() : {};
    const quizzesUsed = currentUsage?.quizzesCompleted || 0;
    const tierConfig = FEATURE_ACCESS[userTier as keyof typeof FEATURE_ACCESS];
    const dailyLimit = tierConfig?.dailyQuizLimit || 5;
    
    // -1 means unlimited
    const hasQuota = dailyLimit === -1 || quizzesUsed < dailyLimit;
    
    return {
      hasQuota,
      used: quizzesUsed,
      limit: dailyLimit
    };
  } catch (error) {
    console.error('Daily usage check error:', error);
    // Allow access on error to prevent blocking users
    return {
      hasQuota: true,
      used: 0,
      limit: 5
    };
  }
}

function hasAccessToTier(userTier: string, requiredTier: string): boolean {
  const userTierIndex = TIER_HIERARCHY.indexOf(userTier);
  const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier);
  
  // If tier not found, deny access
  if (userTierIndex === -1 || requiredTierIndex === -1) {
    return false;
  }
  
  return userTierIndex >= requiredTierIndex;
}

function hasAccessToQuizType(userTier: string, quizType: string): boolean {
  const tierConfig = FEATURE_ACCESS[userTier as keyof typeof FEATURE_ACCESS];
  return tierConfig?.quizTypes.includes(quizType) || false;
}

function hasAccessToFeature(userTier: string, feature: string): boolean {
  const tierConfig = FEATURE_ACCESS[userTier as keyof typeof FEATURE_ACCESS];
  return tierConfig?.features.includes(feature) || false;
}

export async function POST(request: NextRequest) {
  try {
    const body: AccessCheckRequest = await request.json();
    const { userId, requiredTier } = body;

    // Validate required fields
    if (!userId || !requiredTier) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and requiredTier' },
        { status: 400 }
      );
    }

    // Get user subscription
    const subscription = await getUserSubscription(userId);
    
    // Check tier access
    const hasAccess = hasAccessToTier(subscription.tier, requiredTier);
    
    // Check daily usage quota
    const usageInfo = await checkDailyUsage(userId, subscription.tier);
    
    // Prepare response
    const response = {
      hasAccess: hasAccess && usageInfo.hasQuota,
      userTier: subscription.tier,
      requiredTier,
      subscription: {
        status: subscription.status,
        expiresAt: subscription.expiresAt,
        isExpired: subscription.status === 'expired'
      },
      usage: usageInfo,
      tierConfig: FEATURE_ACCESS[subscription.tier as keyof typeof FEATURE_ACCESS] || FEATURE_ACCESS.free,
      accessReasons: []
    };

    // Add access denial reasons
    if (!hasAccess) {
      response.accessReasons.push(`Requires ${requiredTier} tier or higher (current: ${subscription.tier})`);
    }
    
    if (!usageInfo.hasQuota) {
      response.accessReasons.push(`Daily quiz limit reached (${usageInfo.used}/${usageInfo.limit})`);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Access check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for feature access check
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const feature = searchParams.get('feature');
    const quizType = searchParams.get('quizType');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Get user subscription
    const subscription = await getUserSubscription(userId);
    
    let hasAccess = true;
    const accessDetails: any = {
      userTier: subscription.tier,
      subscription: {
        status: subscription.status,
        expiresAt: subscription.expiresAt
      }
    };

    // Check feature access
    if (feature) {
      hasAccess = hasAccessToFeature(subscription.tier, feature);
      accessDetails.feature = feature;
      accessDetails.featureAccess = hasAccess;
    }

    // Check quiz type access
    if (quizType) {
      const quizTypeAccess = hasAccessToQuizType(subscription.tier, quizType);
      hasAccess = hasAccess && quizTypeAccess;
      accessDetails.quizType = quizType;
      accessDetails.quizTypeAccess = quizTypeAccess;
    }

    // Check daily usage
    const usageInfo = await checkDailyUsage(userId, subscription.tier);
    hasAccess = hasAccess && usageInfo.hasQuota;
    accessDetails.usage = usageInfo;

    return NextResponse.json({
      hasAccess,
      ...accessDetails
    });

  } catch (error) {
    console.error('Feature access check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update user tier (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, newTier, adminToken } = body;

    // Validate admin access (simplified - implement proper admin authentication)
    if (!adminToken || adminToken !== process.env.ADMIN_SECRET_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!userId || !newTier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!TIER_HIERARCHY.includes(newTier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // Update user subscription
    const subscriptionRef = db.collection('userSubscriptions').doc(userId);
    await subscriptionRef.set({
      tier: newTier,
      status: 'active',
      updatedAt: new Date(),
      updatedBy: 'admin'
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: `User tier updated to ${newTier}`
    });

  } catch (error) {
    console.error('Tier update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}