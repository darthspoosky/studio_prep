import { NextRequest } from 'next/server';
import { auth as firebaseAuth } from '@/lib/firebase';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export interface AuthenticatedRequest extends NextRequest {
  user: DecodedIdToken;
}

export async function authenticateRequest(request: NextRequest): Promise<{ user: DecodedIdToken | null; error: string | null }> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return { user: null, error: 'No token provided' };
    }

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    return { user: decodedToken, error: null };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'Invalid token' };
  }
}

export function createAuthenticatedHandler<T = any>(
  handler: (request: AuthenticatedRequest, context?: T) => Promise<Response>
) {
  return async (request: NextRequest, context?: T): Promise<Response> => {
    const { user, error } = await authenticateRequest(request);
    
    if (error || !user) {
      return Response.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Add user to request object
    (request as AuthenticatedRequest).user = user;
    
    return handler(request as AuthenticatedRequest, context);
  };
}

// Rate limiting utilities
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return ip;
}