
import { NextRequest, NextResponse } from 'next/server';
import { createMockInterviewSession, getMockInterviewSession, updateMockInterviewWithAnswer } from '@/services/mockInterviewService';

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
    // In a real app, you'd verify a JWT or session token here.
    // For now, we'll use a placeholder.
    // This part should be replaced with actual authentication logic.
    return "placeholder-user-id";
}

export async function POST(req: NextRequest) {
  try {
    const { interviewType, difficulty, roleProfile, answer, sessionId: existingSessionId } = await req.json();

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this is an answer to an existing session or a new session creation
    if (existingSessionId && answer) {
      // Process answer and get next question
      const result = await updateMockInterviewWithAnswer(existingSessionId, answer);
      
      if (result.isComplete) {
        // Interview is complete, return final feedback
        return NextResponse.json({
          sessionId: existingSessionId,
          report: {
            status: 'completed',
            finalFeedback: result.feedback
          }
        });
      } else {
        // Return next question
        return NextResponse.json({
          sessionId: existingSessionId,
          report: {
            status: 'in-progress',
            nextQuestion: result.question
          }
        });
      }
    } else {
      // Create a new session
      const sessionId = await createMockInterviewSession(userId, { interviewType, difficulty, roleProfile });
      
      // Get the session to access the first question
      const session = await getMockInterviewSession(sessionId);
      if (!session || session.questionsAndAnswers.length === 0) {
        throw new Error("Failed to initialize interview session");
      }
      
      // Send response with the first question
      const firstQuestion = session.questionsAndAnswers[0].question;
      return NextResponse.json({
        sessionId,
        report: {
          status: 'in-progress',
          firstQuestion
        }
      });
    }
  } catch (error) {
    console.error('Error in mock interview API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Interview session error: ${errorMessage}` }, { status: 500 });
  }
}
