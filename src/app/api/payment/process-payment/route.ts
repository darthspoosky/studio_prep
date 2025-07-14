import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { SubscriptionService } from '@/services/subscriptionService';
import { SubscriptionTier } from '@/lib/subscription-tiers';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      paymentId,
      orderId,
      signature,
      tier,
      billingCycle,
      userId
    } = body;

    // Validate required fields
    if (!paymentId || !orderId || !signature || !tier || !billingCycle || !userId) {
      return NextResponse.json(
        { error: 'Missing required payment details' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const body_string = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body_string)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Get payment amount from tier and billing cycle
    const { SUBSCRIPTION_PLANS } = await import('@/lib/subscription-tiers');
    const plan = SUBSCRIPTION_PLANS[tier as SubscriptionTier];
    const amount = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;

    try {
      // Create or update subscription
      await SubscriptionService.createSubscription(
        userId,
        tier as SubscriptionTier,
        billingCycle,
        {
          provider: 'razorpay',
          subscriptionId: paymentId,
          customerId: userId,
          amount: amount
        }
      );

      // Record payment transaction
      const transactionId = `${userId}_${paymentId}_${Date.now()}`;
      await setDoc(doc(db, 'paymentTransactions', transactionId), {
        userId,
        subscriptionId: paymentId,
        transactionId: paymentId,
        amount,
        currency: 'INR',
        status: 'success',
        provider: 'razorpay',
        providerTransactionId: paymentId,
        billingPeriodStart: serverTimestamp(),
        billingPeriodEnd: serverTimestamp(), // Will be calculated properly in service
        metadata: {
          orderId,
          signature,
          tier,
          billingCycle
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
        subscriptionTier: tier,
        transactionId: paymentId
      });

    } catch (dbError) {
      console.error('Database error after successful payment:', dbError);
      
      // Payment was successful but database update failed
      // This should trigger manual intervention
      return NextResponse.json({
        success: false,
        message: 'Payment successful but subscription update failed. Please contact support.',
        requiresManualReview: true,
        paymentId,
        orderId
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Payment processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}