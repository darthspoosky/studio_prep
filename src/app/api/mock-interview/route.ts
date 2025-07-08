import { run } from '@genkit-ai/flow';
import { mockInterviewFlow } from '@/ai/flows/mock-interview-flow';
import { NextRequest, NextResponse } from 'next/server';
import { createMockInterviewSession, updateMockInterviewSession } from '@/services/mockInterviewService';

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        try {
            // This is where you would verify the token with Firebase Admin SDK
            // const decodedToken = await admin.auth().verifyIdToken(idToken);
            // return decodedToken.uid;
            
            // Placeholder until service account is configured
            console.warn("Auth token verification is currently disabled. Using placeholder user ID.");
            return "placeholder-user-id";

        } catch (error) {
            console.error('Error verifying auth token:', error);
            return null;
        }
    }
    return null;
}

export async function POST(req: NextRequest) {
  const { interviewType, difficulty, roleProfile } = await req.json();

  const userId = await getUserIdFromRequest(req);

  if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessionId = await createMockInterviewSession(userId, { interviewType, difficulty, roleProfile });

    const inputData = {
      input: {
        interviewType,
        difficulty,
        roleProfile,
        sessionId, // Pass sessionId to the flow
      },
    };

    // @ts-expect-error - Flow typing issue with run function
    const result = await run(mockInterviewFlow, inputData);
    // Type assertion to handle the response structure
    const report = (result as { report: Record<string, unknown> }).report;
    
    // Convert the report to a string if the service expects a string
    const reportString = typeof report === 'string' 
      ? report 
      : JSON.stringify(report);
      
    await updateMockInterviewSession(sessionId, { 
        status: 'completed', 
        finalReport: reportString
    });

    return NextResponse.json({ sessionId, report });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to start interview' }, { status: 500 });
  }
}
