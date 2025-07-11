
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

// Initialize AI clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Import Anthropic if available, otherwise use a mock
let anthropic: any;
try {
  const { Anthropic } = require('@anthropic-ai/sdk');
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
} catch (error) {
  console.warn('Anthropic SDK not available, using OpenAI as fallback');
  anthropic = null;
}

export interface MockInterviewConfig {
  interviewType: string;
  difficulty: string;
  roleProfile?: string;
}

export interface MockInterviewSession {
  id: string;
  userId: string;
  config: MockInterviewConfig;
  status: 'initializing' | 'in-progress' | 'completed' | 'error';
  createdAt: Date;
  completedAt?: Date;
  finalReport?: string;
  questionsAndAnswers: Array<{ question: string; answer?: string; feedback?: string; }>;
  // Store conversation history for AI context
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

// In-memory storage for sessions (replace with Redis/database in production)
const sessions = new Map<string, MockInterviewSession>();

// Error classes for better error handling
export class MockInterviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MockInterviewError';
  }
}

export class SessionNotFoundError extends MockInterviewError {
  constructor(sessionId: string) {
    super(`Session not found with ID: ${sessionId}`);
    this.name = 'SessionNotFoundError';
  }
}

export class AIGenerationError extends MockInterviewError {
  constructor(message: string) {
    super(`AI generation failed: ${message}`);
    this.name = 'AIGenerationError';
  }
}

// Validation function for interview config
function validateInterviewConfig(config: MockInterviewConfig): void {
  if (!config.interviewType) {
    throw new MockInterviewError('Interview type is required');
  }
  
  if (!config.difficulty) {
    throw new MockInterviewError('Difficulty level is required');
  }
  
  // Validate difficulty is one of: 'easy', 'medium', 'hard'
  const validDifficulties = ['easy', 'medium', 'hard'];
  if (!validDifficulties.includes(config.difficulty.toLowerCase())) {
    throw new MockInterviewError(`Invalid difficulty: ${config.difficulty}. Must be one of: ${validDifficulties.join(', ')}`);
  }
}

// Function to create a new mock interview session
export async function createMockInterviewSession(userId: string, config: MockInterviewConfig): Promise<string> {
  try {
    if (!userId) {
      throw new MockInterviewError('User ID is required');
    }
    
    // Validate interview configuration
    validateInterviewConfig(config);
    
    // Generate a session ID
    const sessionId = uuidv4();
    
    // Create system prompt based on the interview configuration
    const systemPrompt = generateInterviewSystemPrompt(config);
    
    // Initialize session with empty questions and answers
    const session: MockInterviewSession = {
      id: sessionId,
      userId,
      config,
      status: 'initializing',
      createdAt: new Date(),
      questionsAndAnswers: [],
      messages: [
        { role: 'system', content: systemPrompt }
      ]
    };
    
    // Store session in memory
    sessions.set(sessionId, session);
    
    try {
      // Generate first question using AI
      const firstQuestion = await generateInterviewQuestion(session);
      
      // Update session with first question
      if (firstQuestion) {
        session.questionsAndAnswers.push({ question: firstQuestion });
        session.messages.push({ role: 'assistant', content: firstQuestion });
        session.status = 'in-progress';
        sessions.set(sessionId, session); // Update the session in storage
      } else {
        throw new AIGenerationError('Failed to generate first interview question');
      }
    } catch (aiError) {
      // Handle AI-specific errors but still return the session ID
      // so frontend can retry or handle gracefully
      console.error('AI error during interview initialization:', aiError);
      session.status = 'error';
      sessions.set(sessionId, session);
    }
    
    return sessionId;
  } catch (error) {
    console.error("Error creating mock interview session: ", error);
    if (error instanceof MockInterviewError) {
      throw error; // Pass through our custom errors
    }
    throw new MockInterviewError(error instanceof Error ? error.message : 'Failed to create a new session');
  }
}

// Get a session by ID
export async function getMockInterviewSession(sessionId: string): Promise<MockInterviewSession> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new SessionNotFoundError(sessionId);
  }
  return session;
}

// Update a session with user's answer and generate feedback/next question
export async function updateMockInterviewWithAnswer(
  sessionId: string, 
  answer: string
): Promise<{ question?: string; feedback?: string; isComplete: boolean }> {
  try {
    if (!sessionId) {
      throw new MockInterviewError('Session ID is required');
    }
    
    if (!answer || answer.trim().length === 0) {
      throw new MockInterviewError('Answer cannot be empty');
    }
    
    // Get the session or throw error if not found
    const session = await getMockInterviewSession(sessionId);
    
    // Only allow updating sessions that are in progress
    if (session.status !== 'in-progress' && session.status !== 'initializing') {
      throw new MockInterviewError(`Cannot update session with status: ${session.status}`);
    }
    
    // Add user's answer to the session
    const currentQuestionIndex = session.questionsAndAnswers.length - 1;
    if (currentQuestionIndex >= 0) {
      session.questionsAndAnswers[currentQuestionIndex].answer = answer;
    } else {
      throw new MockInterviewError('No current question found in session');
    }
    
    // Add user message to conversation history
    session.messages.push({ role: 'user', content: answer });
    
    // Check if interview should be completed
    const shouldComplete = session.questionsAndAnswers.length >= 5;
    
    try {
      if (shouldComplete) {
        // Generate final feedback
        const feedback = await generateInterviewFeedback(session);
        session.status = 'completed';
        session.completedAt = new Date();
        session.finalReport = feedback;
        sessions.set(sessionId, session);
        
        return {
          feedback,
          isComplete: true
        };
      } else {
        // Generate next question
        const nextQuestion = await generateInterviewQuestion(session);
        
        if (!nextQuestion) {
          throw new AIGenerationError('Failed to generate next interview question');
        }
        
        // Add new question to session
        session.questionsAndAnswers.push({ question: nextQuestion });
        session.messages.push({ role: 'assistant', content: nextQuestion });
        sessions.set(sessionId, session);
        
        return {
          question: nextQuestion,
          isComplete: false
        };
      }
    } catch (aiError) {
      // Handle AI errors gracefully
      console.error('AI error during interview session:', aiError);
      session.status = 'error';
      sessions.set(sessionId, session);
      throw new AIGenerationError(aiError instanceof Error ? aiError.message : 'Failed to generate interview content');
    }
  } catch (error) {
    console.error('Error updating mock interview with answer:', error);
    if (error instanceof MockInterviewError) {
      throw error; // Pass through our custom errors
    }
    throw new MockInterviewError(error instanceof Error ? error.message : 'Failed to update interview session');
  }
}

// Helper function to generate system prompt based on interview configuration
function generateInterviewSystemPrompt(config: MockInterviewConfig): string {
  const { interviewType, difficulty, roleProfile } = config;
  
  return `You are an expert interviewer for a ${interviewType} exam at ${difficulty} difficulty level.
  
${roleProfile ? `The candidate is applying for the following role: ${roleProfile}` : ''}

Your task is to conduct a professional interview, asking relevant and challenging questions.

Guide the conversation naturally, but ensure your questions test the candidate's knowledge, problem-solving abilities, and communication skills.

Keep your questions concise, relevant, and appropriately difficult for a ${difficulty} level interview in ${interviewType}.`;
}

// Generate an interview question using AI
async function generateInterviewQuestion(session: MockInterviewSession): Promise<string> {
  try {
    // Determine if we should use Claude or OpenAI based on availability
    if (anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        messages: [
          ...session.messages,
          {
            role: 'user',
            content: 'Ask the next relevant interview question based on our conversation so far. Be concise and focus on a single specific question that will reveal the candidate\'s skills and knowledge. Only respond with the question itself, no additional text.'
          }
        ]
      });
      
      return response.content[0].text;
    } else {
      // Fallback to OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          ...session.messages.map(msg => ({
            role: msg.role === 'assistant' 
              ? 'assistant' as const 
              : msg.role === 'user' 
                ? 'user' as const 
                : 'system' as const,
            content: msg.content
          })),
          {
            role: 'user' as const,
            content: 'Ask the next relevant interview question based on our conversation so far. Be concise and focus on a single specific question that will reveal the candidate\'s skills and knowledge. Only respond with the question itself, no additional text.'
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      
      return response.choices[0]?.message?.content || 'Could you tell me more about your experience in this field?';
    }
  } catch (error) {
    console.error('Error generating interview question:', error);
    // Fallback question if AI fails
    return 'Could you expand on your previous answer with more specific examples?';
  }
}

// Generate final interview feedback using AI
async function generateInterviewFeedback(session: MockInterviewSession): Promise<string> {
  try {
    const promptMessages = [...session.messages, {
      role: 'user',
      content: 'Please provide comprehensive feedback on the entire interview. Analyze the candidate\'s strengths, areas for improvement, and overall performance. Be constructive, specific, and actionable in your feedback.'
    }];
    
    // Determine if we should use Claude or OpenAI based on availability
    if (anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: promptMessages
      });
      
      return response.content[0].text;
    } else {
      // Fallback to OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: promptMessages.map(msg => ({
          role: msg.role === 'assistant' 
            ? 'assistant' as const 
            : msg.role === 'user' 
              ? 'user' as const 
              : 'system' as const,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1000
      });
      
      return response.choices[0]?.message?.content || 'Thank you for completing the interview. Based on your responses, we recommend further practice in articulating your experiences and technical knowledge.';
    }
  } catch (error) {
    console.error('Error generating interview feedback:', error);
    // Fallback feedback if AI fails
    return 'Thank you for completing this interview session. Consider being more specific in your answers and providing concrete examples from your experience.';
  }
}

// Function to get all sessions for a user (in memory implementation)  
export async function getUserInterviewSessions(userId: string): Promise<MockInterviewSession[]> {
    try {
        const userSessions: MockInterviewSession[] = [];
        
        // Find all sessions for this user
        for (const session of sessions.values()) {
            if (session.userId === userId) {
                userSessions.push(session);
            }
        }
        
        // Sort by creation date (newest first)
        return userSessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
        console.error("Error retrieving user's mock interview sessions: ", error);
        return [];
    }
}
