
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

    const flowInput = {
      interviewType,
      difficulty,
      roleProfile,
      transcript: [],
      questionCount: 0,
    };
    
    // Call the flow directly, replacing the old 'run' function
    const result = await mockInterviewFlow(flowInput);
    
    // The result will contain the first question. The frontend expects a 'report' object.
    // To make this work without changing the frontend yet, we'll create a mock report.
    const mockReport = {
        firstQuestion: result.question,
        status: 'Interview initiated. Please answer the first question.',
    };
    
    // We will update the session to 'in-progress', not 'completed'.
    // This also stores the first question for context in future conversational turns.
    await updateMockInterviewSession(sessionId, { 
        status: 'in-progress', 
        questionsAndAnswers: [{ question: result.question || '', answer: '', feedback: '' }]
    });

    return NextResponse.json({ sessionId, report: mockReport });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to start interview' }, { status: 500 });
  }
}
