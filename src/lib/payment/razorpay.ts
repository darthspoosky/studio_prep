// Razorpay integration for subscription payments
import { SubscriptionTier, SUBSCRIPTION_PLANS } from '@/lib/subscription-tiers';

// Razorpay configuration
export const RAZORPAY_CONFIG = {
  keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ''
};

// Payment types
export interface PaymentIntent {
  amount: number;
  currency: string;
  tier: SubscriptionTier;
  billingCycle: 'monthly' | 'yearly';
  userId: string;
  orderId: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

export interface SubscriptionPayment {
  subscriptionId: string;
  customerId: string;
  planId: string;
  status: 'created' | 'authenticated' | 'active' | 'paused' | 'cancelled';
}

// Razorpay Plan IDs - these need to be created in Razorpay Dashboard
export const RAZORPAY_PLAN_IDS = {
  foundation_monthly: 'plan_foundation_monthly',
  foundation_yearly: 'plan_foundation_yearly',
  practice_monthly: 'plan_practice_monthly',
  practice_yearly: 'plan_practice_yearly',
  mains_monthly: 'plan_mains_monthly',
  mains_yearly: 'plan_mains_yearly',
  interview_monthly: 'plan_interview_monthly',
  interview_yearly: 'plan_interview_yearly',
  elite_monthly: 'plan_elite_monthly',
  elite_yearly: 'plan_elite_yearly',
};

// Razorpay Service
export class RazorpayService {
  
  // Create order for one-time payment
  static async createOrder(
    tier: SubscriptionTier,
    billingCycle: 'monthly' | 'yearly',
    userId: string
  ): Promise<PaymentIntent> {
    try {
      const plan = SUBSCRIPTION_PLANS[tier];
      const amount = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
      
      const orderData = {
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `${tier}_${billingCycle}_${userId}_${Date.now()}`,
        notes: {
          tier,
          billingCycle,
          userId,
          planName: plan.name
        }
      };

      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const order = await response.json();

      return {
        amount: amount,
        currency: 'INR',
        tier,
        billingCycle,
        userId,
        orderId: order.id
      };

    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Create subscription
  static async createSubscription(
    tier: SubscriptionTier,
    billingCycle: 'monthly' | 'yearly',
    userId: string,
    customerEmail: string
  ): Promise<SubscriptionPayment> {
    try {
      const planId = RAZORPAY_PLAN_IDS[`${tier}_${billingCycle}` as keyof typeof RAZORPAY_PLAN_IDS];
      
      if (!planId) {
        throw new Error('Plan not found for the selected tier and billing cycle');
      }

      const subscriptionData = {
        planId,
        customerEmail,
        userId,
        tier,
        billingCycle
      };

      const response = await fetch('/api/payment/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const subscription = await response.json();

      return {
        subscriptionId: subscription.id,
        customerId: subscription.customer_id,
        planId: subscription.plan_id,
        status: subscription.status
      };

    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Verify payment signature
  static verifyPaymentSignature(
    paymentId: string,
    orderId: string,
    signature: string
  ): boolean {
    try {
      const crypto = require('crypto');
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_CONFIG.keySecret)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  // Process successful payment
  static async processSuccessfulPayment(
    paymentId: string,
    orderId: string,
    signature: string,
    tier: SubscriptionTier,
    billingCycle: 'monthly' | 'yearly',
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify signature
      if (!this.verifyPaymentSignature(paymentId, orderId, signature)) {
        throw new Error('Invalid payment signature');
      }

      // Process payment on backend
      const response = await fetch('/api/payment/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          orderId,
          signature,
          tier,
          billingCycle,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  // Initialize Razorpay checkout
  static initializeCheckout(
    paymentIntent: PaymentIntent,
    onSuccess: (response: any) => void,
    onError: (error: any) => void
  ): void {
    try {
      // Check if Razorpay is loaded
      if (typeof window === 'undefined' || !window.Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

      const plan = SUBSCRIPTION_PLANS[paymentIntent.tier];
      
      const options = {
        key: RAZORPAY_CONFIG.keyId,
        amount: paymentIntent.amount * 100, // Convert to paise
        currency: paymentIntent.currency,
        name: 'PrepTalk',
        description: `${plan.name} - ${paymentIntent.billingCycle} subscription`,
        order_id: paymentIntent.orderId,
        image: '/logo.png', // Add your logo path
        
        prefill: {
          email: '', // Will be filled from user context
          contact: '' // Will be filled from user context
        },
        
        theme: {
          color: '#3b82f6' // Primary color
        },
        
        notes: {
          tier: paymentIntent.tier,
          billingCycle: paymentIntent.billingCycle,
          userId: paymentIntent.userId
        },
        
        handler: function (response: any) {
          onSuccess({
            ...response,
            tier: paymentIntent.tier,
            billingCycle: paymentIntent.billingCycle,
            userId: paymentIntent.userId
          });
        },
        
        modal: {
          ondismiss: function() {
            onError({ message: 'Payment cancelled by user' });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Error initializing checkout:', error);
      onError(error);
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/payment/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      return await response.json();

    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Cancellation failed'
      };
    }
  }

  // Get subscription details
  static async getSubscriptionDetails(subscriptionId: string): Promise<any> {
    try {
      const response = await fetch(`/api/payment/subscription/${subscriptionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get subscription details');
      }

      return await response.json();

    } catch (error) {
      console.error('Error getting subscription details:', error);
      throw error;
    }
  }

  // Validate webhook signature
  static validateWebhookSignature(
    body: string,
    signature: string
  ): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_CONFIG.webhookSecret)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }
}

// Payment hook for React components
export function useRazorpayPayment() {
  const initiatePayment = async (
    tier: SubscriptionTier,
    billingCycle: 'monthly' | 'yearly',
    userId: string,
    userEmail: string
  ): Promise<PaymentResult> => {
    try {
      // Create order
      const paymentIntent = await RazorpayService.createOrder(tier, billingCycle, userId);
      
      return new Promise((resolve) => {
        RazorpayService.initializeCheckout(
          paymentIntent,
          async (response) => {
            // Process successful payment
            const result = await RazorpayService.processSuccessfulPayment(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature,
              tier,
              billingCycle,
              userId
            );
            
            resolve({
              success: result.success,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              error: result.success ? undefined : result.message
            });
          },
          (error) => {
            resolve({
              success: false,
              error: error.message || 'Payment failed'
            });
          }
        );
      });

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initialization failed'
      };
    }
  };

  return { initiatePayment };
}

export default RazorpayService;

// Add Razorpay script to document head
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

// Declare Razorpay on window object
declare global {
  interface Window {
    Razorpay: any;
  }
}