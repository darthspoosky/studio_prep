/**
 * @fileOverview API Integration for Multi-Agent Framework
 * Provides seamless integration with existing Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMultiAgentFramework, MultiAgentFramework } from '../index';
import { 
  AgentRequest, 
  NewspaperAnalysisRequest,
  QuizGenerationRequest,
  WritingEvaluationRequest,
  MockInterviewRequest
} from '../core/types';

// Global framework instance (singleton pattern)
let frameworkInstance: MultiAgentFramework | null = null;

/**
 * Initialize the global framework instance
 */
export async function initializeFramework(): Promise<MultiAgentFramework> {
  if (!frameworkInstance) {
    frameworkInstance = createMultiAgentFramework({
      openai: {
        apiKey: process.env.OPENAI_API_KEY!,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 4000
      },
      orchestrator: {
        intentClassificationModel: 'gpt-4o-mini',
        maxConcurrentTasks: 10,
        defaultTimeout: 30000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          baseDelay: 1000,
          maxDelay: 10000
        }
      },
      monitoring: {
        enableMetrics: true,
        enableLogging: process.env.NODE_ENV === 'development',
        logLevel: 'info' as any,
        metricsInterval: 60000
      },
      security: {
        enableRateLimit: true,
        requestsPerMinute: 100,
        enableAuth: false,
        allowedOrigins: ['*']
      }
    });

    await frameworkInstance.start();
    console.log('🤖 Multi-Agent Framework initialized');
  }

  return frameworkInstance;
}

/**
 * Get the global framework instance
 */
export function getFramework(): MultiAgentFramework {
  if (!frameworkInstance) {
    throw new Error('Framework not initialized. Call initializeFramework() first.');
  }
  return frameworkInstance;
}

/**
 * Universal API handler for all agent requests
 */
export async function handleAgentRequest(req: NextRequest): Promise<NextResponse> {
  try {
    // Initialize framework if needed
    const framework = await initializeFramework();

    // Parse request body
    const body = await req.json();
    
    // Extract user information (would integrate with your auth system)
    const userId = extractUserId(req);
    const sessionId = extractSessionId(req);

    // Create standardized request
    const agentRequest: AgentRequest = {
      id: generateRequestId(),
      userId,
      sessionId,
      timestamp: Date.now(),
      ...body
    };

    // Validate request
    validateAgentRequest(agentRequest);

    // Process through framework
    const response = await framework.processRequest(agentRequest);

    // Return response
    return NextResponse.json(response, {
      status: response.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': agentRequest.id,
        'X-Processing-Time': response.processingTime.toString(),
        'X-Agent-ID': response.agentId
      }
    });

  } catch (error) {
    console.error('Agent request failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: Date.now()
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Specific handler for newspaper analysis (backwards compatibility)
 */
export async function handleNewspaperAnalysis(req: NextRequest): Promise<NextResponse> {
  try {
    const framework = await initializeFramework();
    const body = await req.json();

    const request: NewspaperAnalysisRequest = {
      id: generateRequestId(),
      userId: extractUserId(req),
      sessionId: extractSessionId(req),
      timestamp: Date.now(),
      type: 'newspaper_analysis',
      data: {
        sourceText: body.articleText || body.sourceText,
        analysisType: body.analysisType || 'comprehensive',
        examType: body.examType || 'UPSC Civil Services',
        outputLanguage: body.outputLanguage || 'English',
        sourceUrl: body.articleUrl
      }
    };

    const response = await framework.processRequest(request);
    
    // Transform response for backwards compatibility
    const legacyResponse = transformToLegacyFormat(response, 'newspaper_analysis');
    
    return NextResponse.json(legacyResponse);

  } catch (error) {
    console.error('Newspaper analysis failed:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Analysis failed'
    }, { status: 500 });
  }
}

/**
 * Handler for quiz generation
 */
export async function handleQuizGeneration(req: NextRequest): Promise<NextResponse> {
  try {
    const framework = await initializeFramework();
    const body = await req.json();

    const request: QuizGenerationRequest = {
      id: generateRequestId(),
      userId: extractUserId(req),
      timestamp: Date.now(),
      type: 'quiz_generation',
      data: {
        topic: body.topic,
        difficulty: body.difficulty || 'medium',
        questionCount: body.questionCount || 10,
        questionType: body.questionType || 'mcq',
        syllabus: body.syllabus
      }
    };

    const response = await framework.processRequest(request);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Quiz generation failed:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Quiz generation failed'
    }, { status: 500 });
  }
}

/**
 * Middleware for framework integration
 */
export function withFramework(handler: (req: NextRequest, framework: MultiAgentFramework) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const framework = await initializeFramework();
      return await handler(req, framework);
    } catch (error) {
      console.error('Framework middleware error:', error);
      return NextResponse.json({
        error: 'Framework initialization failed'
      }, { status: 500 });
    }
  };
}

/**
 * Health check endpoint
 */
export async function handleHealthCheck(req: NextRequest): Promise<NextResponse> {
  try {
    if (!frameworkInstance) {
      return NextResponse.json({
        status: 'not_initialized',
        healthy: false,
        message: 'Framework not initialized'
      });
    }

    const stats = frameworkInstance.getStats();
    const agentRegistry = frameworkInstance.getAgentRegistry();
    const healthResults = await agentRegistry.performHealthCheck();
    
    const unhealthyAgents = Array.from(healthResults.entries())
      .filter(([, healthy]) => !healthy)
      .map(([agentId]) => agentId);

    const healthy = unhealthyAgents.length === 0;

    return NextResponse.json({
      status: healthy ? 'healthy' : 'degraded',
      healthy,
      timestamp: new Date().toISOString(),
      framework: {
        initialized: stats.framework.initialized,
        uptime: stats.framework.uptime
      },
      agents: {
        total: stats.agents.totalAgents,
        active: stats.agents.activeAgents,
        unhealthy: unhealthyAgents
      },
      system: {
        load: stats.system.systemLoad,
        errorRate: stats.system.errorRate,
        avgResponseTime: stats.system.averageResponseTime
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      healthy: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    }, { status: 500 });
  }
}

/**
 * Metrics endpoint
 */
export async function handleMetrics(req: NextRequest): Promise<NextResponse> {
  try {
    if (!frameworkInstance) {
      return NextResponse.json({ error: 'Framework not initialized' }, { status: 503 });
    }

    const stats = frameworkInstance.getStats();
    const agentRegistry = frameworkInstance.getAgentRegistry();
    const agentMetrics = agentRegistry.getAgentMetrics();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      framework: stats.framework,
      agents: stats.agents,
      system: stats.system,
      agentMetrics: agentMetrics.map(metric => ({
        agentId: metric.agentId,
        totalRequests: metric.totalRequests,
        successRate: metric.totalRequests > 0 ? 
          (metric.successfulRequests / metric.totalRequests) * 100 : 0,
        averageLatency: metric.averageLatency,
        errorRate: metric.errorRate * 100,
        lastActivity: metric.lastActivity,
        totalCost: metric.totalCost
      }))
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Metrics unavailable'
    }, { status: 500 });
  }
}

/**
 * Utility functions
 */

function extractUserId(req: NextRequest): string {
  // Extract from auth header, session, or default
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // Would parse JWT or session token here
    return 'authenticated_user';
  }
  
  // Default to IP-based ID for anonymous users
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
  return `anonymous_${ip.replace(/\./g, '_')}`;
}

function extractSessionId(req: NextRequest): string | undefined {
  // Extract from cookie or header
  const sessionHeader = req.headers.get('x-session-id');
  if (sessionHeader) return sessionHeader;

  // Could also check cookies
  const sessionCookie = req.cookies.get('session_id');
  return sessionCookie?.value;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function validateAgentRequest(request: AgentRequest): void {
  if (!request.type) {
    throw new Error('Request type is required');
  }

  if (!request.data) {
    throw new Error('Request data is required');
  }

  // Type-specific validation
  switch (request.type) {
    case 'newspaper_analysis':
      if (!request.data.sourceText || request.data.sourceText.length < 100) {
        throw new Error('Source text must be at least 100 characters');
      }
      break;
    
    case 'quiz_generation':
      if (!request.data.topic) {
        throw new Error('Topic is required for quiz generation');
      }
      if (request.data.questionCount && (request.data.questionCount < 1 || request.data.questionCount > 50)) {
        throw new Error('Question count must be between 1 and 50');
      }
      break;
  }
}

function transformToLegacyFormat(response: any, type: string): any {
  // Transform new framework response to match existing API expectations
  if (type === 'newspaper_analysis') {
    return {
      ...response.data,
      metadata: {
        ...response.metadata,
        analysisType: response.data?.analysisType,
        examType: response.data?.examType,
        processedAt: new Date().toISOString(),
        processingTime: response.processingTime
      }
    };
  }

  return response;
}

/**
 * Graceful shutdown handler
 */
export async function shutdownFramework(): Promise<void> {
  if (frameworkInstance) {
    await frameworkInstance.shutdown();
    frameworkInstance = null;
    console.log('🔄 Multi-Agent Framework shutdown completed');
  }
}

// Cleanup on process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', shutdownFramework);
  process.on('SIGINT', shutdownFramework);
}