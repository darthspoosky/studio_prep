import { NextRequest } from 'next/server';
import { GET } from '../subscription/current/route';
import { POST as UpgradePost } from '../subscription/upgrade/route';
import { SubscriptionService } from '@/services/subscriptionService';

// Mock the SubscriptionService
jest.mock('@/services/subscriptionService');

// Mock Firebase Admin
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn()
  }))
}));

jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => [])
}));

const mockSubscriptionService = SubscriptionService as jest.Mocked<typeof SubscriptionService>;

describe('/api/subscription/current', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return subscription data for authenticated user', async () => {
    const mockRequest = {
      headers: {
        get: jest.fn(() => 'Bearer valid-token')
      }
    } as unknown as NextRequest;

    // Mock auth verification
    const { getAuth } = require('firebase-admin/auth');
    getAuth().verifyIdToken.mockResolvedValue({ uid: 'test-user-123' });

    // Mock subscription data
    const mockSubscription = {
      tier: 'foundation',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
      billingCycle: 'monthly',
      amount: 99,
      currency: 'INR'
    };

    const mockProfile = {
      currentTier: 'foundation',
      subscriptionStatus: 'active',
      currentStage: 'prelims',
      onboardingCompleted: true
    };

    mockSubscriptionService.getUserSubscription.mockResolvedValue(mockSubscription as any);
    mockSubscriptionService.getUserProfile.mockResolvedValue(mockProfile as any);

    const response = await GET(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData).toEqual({
      subscription: expect.objectContaining({
        tier: 'foundation',
        status: 'active'
      }),
      profile: expect.objectContaining({
        currentTier: 'foundation',
        onboardingCompleted: true
      })
    });
  });

  it('should return 401 for unauthenticated request', async () => {
    const mockRequest = {
      headers: {
        get: jest.fn(() => null)
      }
    } as unknown as NextRequest;

    const response = await GET(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(401);
    expect(responseData.error).toBe('Unauthorized');
  });

  it('should return 404 when subscription not found', async () => {
    const mockRequest = {
      headers: {
        get: jest.fn(() => 'Bearer valid-token')
      }
    } as unknown as NextRequest;

    // Mock auth verification
    const { getAuth } = require('firebase-admin/auth');
    getAuth().verifyIdToken.mockResolvedValue({ uid: 'test-user-123' });

    // Mock no subscription found
    mockSubscriptionService.getUserSubscription.mockResolvedValue(null);
    mockSubscriptionService.getUserProfile.mockResolvedValue(null);

    const response = await GET(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(404);
    expect(responseData.error).toBe('Subscription not found');
  });
});

describe('/api/subscription/upgrade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upgrade subscription successfully', async () => {
    const mockRequest = {
      headers: {
        get: jest.fn(() => 'Bearer valid-token')
      },
      json: jest.fn().mockResolvedValue({
        targetTier: 'foundation',
        billingCycle: 'monthly'
      })
    } as unknown as NextRequest;

    // Mock auth verification
    const { getAuth } = require('firebase-admin/auth');
    getAuth().verifyIdToken.mockResolvedValue({ uid: 'test-user-123' });

    // Mock successful upgrade
    mockSubscriptionService.updateSubscriptionTier.mockResolvedValue(undefined);

    const response = await UpgradePost(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.message).toContain('upgraded');
  });

  it('should return 400 for invalid tier', async () => {
    const mockRequest = {
      headers: {
        get: jest.fn(() => 'Bearer valid-token')
      },
      json: jest.fn().mockResolvedValue({
        targetTier: 'invalid-tier',
        billingCycle: 'monthly'
      })
    } as unknown as NextRequest;

    // Mock auth verification
    const { getAuth } = require('firebase-admin/auth');
    getAuth().verifyIdToken.mockResolvedValue({ uid: 'test-user-123' });

    const response = await UpgradePost(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toContain('Invalid subscription tier');
  });

  it('should return 401 for unauthenticated request', async () => {
    const mockRequest = {
      headers: {
        get: jest.fn(() => null)
      },
      json: jest.fn()
    } as unknown as NextRequest;

    const response = await UpgradePost(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(401);
    expect(responseData.error).toBe('Unauthorized');
  });
});