import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { QuestionUploadService } from '@/services/questionUploadService';
import { isDevMode } from '@/lib/dev-mode';

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

async function verifyAuthToken(request: NextRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

// POST /api/admin/question-upload - Handle file upload for question import
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userAuth = await verifyAuthToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check dev mode access
    if (!isDevMode(userAuth.email)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const examType = formData.get('examType') as 'Prelims' | 'Mains';
    const year = parseInt(formData.get('year') as string);
    const paper = formData.get('paper') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!examType || !['Prelims', 'Mains'].includes(examType)) {
      return NextResponse.json(
        { error: 'Invalid exam type. Must be Prelims or Mains' },
        { status: 400 }
      );
    }

    if (!year || year < 2000 || year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { error: 'Invalid year' },
        { status: 400 }
      );
    }

    // Process file upload
    const result = await QuestionUploadService.uploadFile(
      file,
      examType,
      userAuth.uid,
      year,
      paper || undefined
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        batchId: result.batchId,
        stats: result.stats
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          errors: result.errors
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error processing question upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}

// GET /api/admin/question-upload - Get upload batch status
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const userAuth = await verifyAuthToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check dev mode access
    if (!isDevMode(userAuth.email)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    // Get batch status from database
    // This would require implementing a method in QuestionUploadService
    // For now, return a placeholder response
    return NextResponse.json({
      batchId,
      status: 'Completed',
      stats: {
        totalRecords: 0,
        processedRecords: 0,
        successfulRecords: 0,
        failedRecords: 0
      }
    });

  } catch (error) {
    console.error('Error getting upload batch status:', error);
    return NextResponse.json(
      { error: 'Failed to get batch status' },
      { status: 500 }
    );
  }
}