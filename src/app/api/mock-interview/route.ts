
import { mockInterviewFlow } from '@/ai/flows/mock-interview-flow';
import { NextRequest, NextResponse } from 'next/server';
import { createMockInterviewSession, updateMockInterviewSession } from '@/services/mockInterviewService';

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
    // In a real app, you'd verify a JWT or session token here.
    // For now, we'll use a placeholder.
    // This part should be replaced with actual authentication logic.
    return "placeholder-user-id";
}

export async function POST(req: NextRequest) {
  try {
    const { interviewType, difficulty, roleProfile } = await req.json();

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Create the session document in Firestore to get a session ID
    const sessionId = await createMockInterviewSession(userId, { interviewType, difficulty, roleProfile });

    // 2. Prepare the input for the first call to the flow
    const flowInput = {
      interviewType,
      difficulty,
      roleProfile,
      transcript: [], // Start with an empty transcript
      questionCount: 0,
    };
    
    // 3. Call the flow directly to get the first question
    const initialResult = await mockInterviewFlow(flowInput);

    if (!initialResult.question) {
        throw new Error("The AI failed to generate the first question.");
    }

    // 4. Update the session with the first question and set status to 'in-progress'
    await updateMockInterviewSession(sessionId, { 
        status: 'in-progress', 
        questionsAndAnswers: [{ question: initialResult.question, answer: '', feedback: '' }]
    });

    // 5. Send a response that the frontend can handle
    // The current frontend expects a 'report' object, so we'll wrap the question in that.
    const report = {
        firstQuestion: initialResult.question,
        status: 'Interview initiated. Please answer the first question.',
    };

    return NextResponse.json({ sessionId, report });

  } catch (error) {
    console.error('Error starting mock interview:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to start interview session: ${errorMessage}` }, { status: 500 });
  }
}
