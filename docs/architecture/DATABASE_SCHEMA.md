# Firestore Schema Updates for Subscription System

## New Collections

### 1. `userSubscriptions`
```typescript
{
  userId: string;              // User ID
  tier: 'free' | 'foundation' | 'practice' | 'mains' | 'interview' | 'elite';
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  
  // Payment details
  paymentProvider: 'razorpay' | 'stripe';
  subscriptionId: string;      // External subscription ID
  customerId: string;          // External customer ID
  
  // Billing
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Trial information
  trialStart?: Timestamp;
  trialEnd?: Timestamp;
  isTrialUsed: boolean;
}
```

### 2. `userUsageTracking`
```typescript
{
  userId: string;
  date: string;                // Format: YYYY-MM-DD
  
  // Daily usage counters
  dailyQuizQuestions: number;
  currentAffairsAnalysis: number;
  writingAnswers: number;
  interviewSessions: number;
  
  // Total usage
  totalQuizQuestions: number;
  totalAnalysis: number;
  totalAnswers: number;
  totalInterviews: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3. `userOnboarding`
```typescript
{
  userId: string;
  completed: boolean;
  currentStep: string;
  
  // Assessment results
  assessmentAnswers: {
    [questionId: string]: string;
  };
  determinedStage: 'foundation' | 'prelims' | 'mains' | 'interview';
  
  // User preferences
  goals: {
    timeline: string;
    services: string;
  };
  experience: {
    educationalBackground: string;
    workExperience: string;
    optionalSubject: string;
  };
  preferences: {
    studyTime: string;
    learningStyle: string[];
    languagePreference: string;
  };
  
  recommendedTier: string;
  completedAt?: Timestamp;
  createdAt: Timestamp;
}
```

### 4. `paymentTransactions`
```typescript
{
  userId: string;
  subscriptionId: string;
  transactionId: string;
  
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  
  provider: 'razorpay' | 'stripe';
  providerTransactionId: string;
  
  billingPeriodStart: Timestamp;
  billingPeriodEnd: Timestamp;
  
  metadata: {
    [key: string]: any;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Updated Collections

### 1. `userProfiles` (add subscription fields)
```typescript
{
  // ... existing fields
  
  // Subscription information
  currentTier: 'free' | 'foundation' | 'practice' | 'mains' | 'interview' | 'elite';
  subscriptionStatus: 'active' | 'cancelled' | 'expired' | 'past_due' | 'none';
  
  // Preparation stage
  currentStage: 'assessment' | 'prelims' | 'mains' | 'interview';
  stageUpdatedAt: Timestamp;
  
  // Onboarding
  onboardingCompleted: boolean;
  onboardingCompletedAt?: Timestamp;
  
  // Subscription history
  subscriptionHistory: {
    tier: string;
    startDate: Timestamp;
    endDate?: Timestamp;
    reason?: string;
  }[];
}
```

## Firestore Security Rules Updates

### 1. `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User subscriptions - only user can read/write their own
    match /userSubscriptions/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Usage tracking - only user can read their own, system can write
    match /userUsageTracking/{document} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && 
                      request.auth.uid == resource.data.userId;
    }
    
    // Onboarding data - only user can access
    match /userOnboarding/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Payment transactions - only user can read their own
    match /paymentTransactions/{document} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow write: if false; // Only backend functions can write
    }
    
    // Updated user profiles
    match /userProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow reading subscription status for feature gating
      allow read: if request.auth != null;
    }
  }
}
```

## Firestore Indexes

### 1. `firestore.indexes.json`
```json
{
  "indexes": [
    {
      "collectionGroup": "userUsageTracking",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "date", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "userSubscriptions",
      "queryScope": "COLLECTION", 
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "currentPeriodEnd", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "paymentTransactions",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ],
  "fieldOverrides": []
}
```

## Migration Script

### 1. Add to existing users
```typescript
// Run this as a Firebase Function to migrate existing users
export const migrateExistingUsers = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();
  const batch = db.batch();
  
  // Get all existing users
  const usersSnapshot = await db.collection('userProfiles').get();
  
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    // Update user profile with subscription fields
    const userRef = db.collection('userProfiles').doc(userId);
    batch.update(userRef, {
      currentTier: 'free',
      subscriptionStatus: 'none',
      currentStage: 'assessment',
      stageUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      onboardingCompleted: false,
      subscriptionHistory: []
    });
    
    // Create subscription record
    const subscriptionRef = db.collection('userSubscriptions').doc(userId);
    batch.set(subscriptionRef, {
      userId,
      tier: 'free',
      status: 'active',
      currentPeriodStart: admin.firestore.FieldValue.serverTimestamp(),
      currentPeriodEnd: new admin.firestore.Timestamp(2099, 0), // Far future for free tier
      cancelAtPeriodEnd: false,
      paymentProvider: 'none',
      subscriptionId: 'free',
      customerId: 'none',
      billingCycle: 'monthly',
      amount: 0,
      currency: 'INR',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isTrialUsed: false
    });
    
    // Create usage tracking for today
    const today = new Date().toISOString().split('T')[0];
    const usageRef = db.collection('userUsageTracking').doc(`${userId}_${today}`);
    batch.set(usageRef, {
      userId,
      date: today,
      dailyQuizQuestions: 0,
      currentAffairsAnalysis: 0,
      writingAnswers: 0,
      interviewSessions: 0,
      totalQuizQuestions: 0,
      totalAnalysis: 0,
      totalAnswers: 0,
      totalInterviews: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  await batch.commit();
  return { success: true, migratedUsers: usersSnapshot.size };
});
```