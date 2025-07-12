
import { NextRequest, NextResponse } from 'next/server';
import { createMockInterviewSession, getMockInterviewSession, updateMockInterviewWithAnswer } from '@/services/mockInterviewService';
import { createAuthenticatedHandler, getRateLimitKey, rateLimit, AuthenticatedRequest } from '@/lib/auth-middleware';
import { z } from 'zod';

// Input validation schemas
const newSessionSchema = z.object({
  interviewType: z.enum(['Technical', 'Behavioral', 'UPSC', 'General']).default('General'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
  roleProfile: z.string().min(1, 'Role profile is required').max(200, 'Role profile too long')
});

const answerSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  answer: z.string().min(10, 'Answer must be at least 10 characters').max(5000, 'Answer too long')
});

async function handler(req: AuthenticatedRequest) {
  // Rate limiting - 10 interview actions per minute per user  
  const rateLimitKey = getRateLimitKey(req);
  if (!rateLimit(rateLimitKey, 10, 60000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const userId = req.user.uid; // Get real user ID from authenticated request

    // Determine if this is a new session or continuing existing session
    const isNewSession = !body.sessionId && !body.answer;
    const isContinuation = body.sessionId && body.answer;

    if (isContinuation) {
      // Validate continuation request
      const validationResult = answerSessionSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Invalid request parameters',
            details: validationResult.error.errors.map(e => ({ 
              field: e.path.join('.'), 
              message: e.message 
            }))
          },
          { status: 400 }
        );
      }

      const { sessionId, answer } = validationResult.data;

      // Process answer and get next question
      const result = await updateMockInterviewWithAnswer(sessionId, answer);
      
      if (result.isComplete) {
        // Interview is complete, return final feedback
        return NextResponse.json({
          sessionId,
          report: {
            status: 'completed',
            finalFeedback: result.feedback
          },
          metadata: {
            completedAt: new Date().toISOString(),
            totalQuestions: result.totalQuestions,
            userId: userId
          }
        });
      } else {
        // Return next question
        return NextResponse.json({
          sessionId,
          report: {
            status: 'in-progress',
            nextQuestion: result.question,
            questionNumber: result.questionNumber,
            totalQuestions: result.totalQuestions
          },
          metadata: {
            updatedAt: new Date().toISOString(),
            userId: userId
          }
        });
      }
    } else if (isNewSession) {
      // Validate new session request
      const validationResult = newSessionSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Invalid session parameters',
            details: validationResult.error.errors.map(e => ({ 
              field: e.path.join('.'), 
              message: e.message 
            }))
          },
          { status: 400 }
        );
      }

      const { interviewType, difficulty, roleProfile } = validationResult.data;

      // Create a new session
      const sessionId = await createMockInterviewSession(userId, { 
        interviewType, 
        difficulty, 
        roleProfile 
      });
      
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
          firstQuestion,
          questionNumber: 1,
          totalQuestions: session.questionsAndAnswers.length
        },
        metadata: {
          interviewType,
          difficulty,
          roleProfile,
          createdAt: new Date().toISOString(),
          userId: userId
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid request format. Either start a new session or continue existing one.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in mock interview API:', error);
    
    // Don't expose internal errors
    const errorMessage = error instanceof Error && error.message.includes('Failed to initialize') 
      ? 'Unable to start interview session. Please try again.'
      : 'Interview service temporarily unavailable. Please try again later.';
      
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export const POST = createAuthenticatedHandler(handler);
