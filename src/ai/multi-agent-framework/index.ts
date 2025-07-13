/**
 * @fileOverview Multi-Agent Framework - Main Entry Point
 */

import 'openai/shims/node';
import OpenAI from 'openai';
import { 
  FrameworkConfig,
  LogLevel,
  BaseRequest,
  BaseResponse,
  AgentRequest,
  ExecutionContext,
  ExecutionConstraints
} from './core/types';
import { createLogger, Logger } from './core/logger';
import { createAgentRegistry, AgentRegistry } from './orchestrator/agent-registry';
import { OrchestratorAgent } from './orchestrator/orchestrator';
import { NewspaperAnalysisAgent } from './agents/newspaper-analysis-agent';
import { QuizGenerationAgent } from './agents/quiz-generation-agent';

export class MultiAgentFramework {
  private openai: OpenAI;
  private logger: Logger;
  private agentRegistry: AgentRegistry;
  private orchestrator: OrchestratorAgent;
  private isInitialized: boolean = false;

  constructor(private config: FrameworkConfig) {
    this.validateConfig(config);
    this.initializeFramework();
  }

  /**
   * Initialize the framework
   */
  private initializeFramework(): void {
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: this.config.openai.apiKey,
    });

    // Initialize Logger
    this.logger = createLogger({
      level: this.config.monitoring.logLevel,
      enableConsole: this.config.monitoring.enableLogging,
    });

    // Initialize Agent Registry
    this.agentRegistry = createAgentRegistry({
      maxAgents: 20,
      healthCheckInterval: 60000, // 1 minute
      enableAutoDiscovery: false,
      logger: this.logger
    });

    // Initialize Orchestrator
    this.orchestrator = new OrchestratorAgent({
      openai: this.openai,
      logger: this.logger,
      agentRegistry: this.agentRegistry,
      enableMetrics: this.config.monitoring.enableMetrics
    });

    this.logger.info('Multi-Agent Framework initialized');
  }

  /**
   * Start the framework and register default agents
   */
  async start(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Framework already initialized');
      return;
    }

    try {
      this.logger.info('Starting Multi-Agent Framework...');

      // Register core agents
      await this.registerCoreAgents();

      // Perform initial health check
      const healthResults = await this.agentRegistry.performHealthCheck();
      const healthyAgents = Array.from(healthResults.values()).filter(h => h).length;
      
      this.logger.info(`Framework started successfully with ${healthyAgents} healthy agents`);
      
      this.isInitialized = true;

    } catch (error) {
      this.logger.error('Failed to start framework', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Register core agents
   */
  private async registerCoreAgents(): Promise<void> {
    const coreAgents = [
      new NewspaperAnalysisAgent({
        openai: this.openai,
        logger: this.logger
      }),
      new QuizGenerationAgent({
        openai: this.openai,
        logger: this.logger
      })
    ];

    for (const agent of coreAgents) {
      try {
        this.agentRegistry.register(agent);
        this.logger.info(`Registered agent: ${agent.getMetadata().name}`);
      } catch (error) {
        this.logger.error(
          `Failed to register agent: ${agent.getMetadata().name}`,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Process a request through the framework
   */
  async processRequest(request: AgentRequest): Promise<BaseResponse> {
    if (!this.isInitialized) {
      throw new Error('Framework not initialized. Call start() first.');
    }

    // Add framework metadata to request
    const enhancedRequest: BaseRequest = {
      ...request,
      id: request.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      metadata: {
        ...request.metadata,
        frameworkVersion: '1.0.0'
      }
    };

    // Create execution context
    const context: ExecutionContext = {
      requestId: enhancedRequest.id,
      userId: enhancedRequest.userId,
      sessionId: enhancedRequest.sessionId,
      depth: 0,
      sharedState: {},
      constraints: this.createDefaultConstraints()
    };

    this.logger.requestStart(
      enhancedRequest.id,
      'framework',
      'Processing request',
      { type: (enhancedRequest as any).type }
    );

    try {
      // Route through orchestrator
      const response = await this.orchestrator.processRequest(enhancedRequest, context);
      
      this.logger.requestEnd(
        enhancedRequest.id,
        'framework',
        'Request completed',
        { success: response.success, processingTime: response.processingTime }
      );

      return response;

    } catch (error) {
      this.logger.requestError(
        enhancedRequest.id,
        'framework',
        'Request failed',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Create default execution constraints
   */
  private createDefaultConstraints(): ExecutionConstraints {
    return {
      maxExecutionTime: this.config.orchestrator.defaultTimeout,
      maxTokens: this.config.openai.maxTokens,
      maxCost: 1.0, // $1 USD max per request
      allowSubAgents: true,
      retryCount: this.config.orchestrator.retryPolicy.maxRetries
    };
  }

  /**
   * Get framework statistics
   */
  getStats(): {
    framework: { initialized: boolean; uptime: number };
    agents: ReturnType<typeof this.agentRegistry.getStats>;
    system: ReturnType<typeof this.agentRegistry.getSystemMetrics>;
  } {
    return {
      framework: {
        initialized: this.isInitialized,
        uptime: this.isInitialized ? Date.now() - (this.isInitialized as any) : 0
      },
      agents: this.agentRegistry.getStats(),
      system: this.agentRegistry.getSystemMetrics()
    };
  }

  /**
   * Get agent registry for advanced operations
   */
  getAgentRegistry(): AgentRegistry {
    return this.agentRegistry;
  }

  /**
   * Get orchestrator for workflow management
   */
  getOrchestrator(): OrchestratorAgent {
    return this.orchestrator;
  }

  /**
   * Shutdown the framework
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Multi-Agent Framework...');
    
    try {
      // Shutdown agent registry (this will deactivate all agents)
      this.agentRegistry.shutdown();
      
      // Clear any running workflows
      const activeWorkflows = this.orchestrator.getActiveWorkflows();
      for (const workflow of activeWorkflows) {
        this.orchestrator.cancelWorkflow(workflow.id);
      }
      
      this.isInitialized = false;
      this.logger.info('Framework shutdown completed');
      
    } catch (error) {
      this.logger.error('Error during shutdown', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Validate framework configuration
   */
  private validateConfig(config: FrameworkConfig): void {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    if (!config.openai.model) {
      throw new Error('OpenAI model is required');
    }

    if (config.orchestrator.maxConcurrentTasks < 1) {
      throw new Error('maxConcurrentTasks must be at least 1');
    }

    if (config.orchestrator.defaultTimeout < 1000) {
      throw new Error('defaultTimeout must be at least 1000ms');
    }
  }
}

/**
 * Create and configure the Multi-Agent Framework
 */
export function createMultiAgentFramework(config: Partial<FrameworkConfig> & { 
  openai: { apiKey: string } 
}): MultiAgentFramework {
  const defaultConfig: FrameworkConfig = {
    openai: {
      apiKey: config.openai.apiKey,
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 4000,
      ...config.openai
    },
    orchestrator: {
      intentClassificationModel: 'gpt-4o-mini',
      maxConcurrentTasks: 5,
      defaultTimeout: 30000,
      retryPolicy: {
        maxRetries: 2,
        backoffStrategy: 'exponential',
        baseDelay: 1000,
        maxDelay: 10000
      },
      ...config.orchestrator
    },
    monitoring: {
      enableMetrics: true,
      enableLogging: true,
      logLevel: LogLevel.INFO,
      metricsInterval: 60000,
      ...config.monitoring
    },
    security: {
      enableRateLimit: false,
      requestsPerMinute: 60,
      enableAuth: false,
      allowedOrigins: ['*'],
      ...config.security
    }
  };

  return new MultiAgentFramework(defaultConfig);
}

// Export types and classes for external use
export {
  FrameworkConfig,
  BaseRequest,
  BaseResponse,
  AgentRequest,
  NewspaperAnalysisRequest,
  QuizGenerationRequest,
  WritingEvaluationRequest,
  MockInterviewRequest,
  LogLevel,
  AgentCategory,
  AgentStatus
} from './core/types';

export { BaseAgent } from './core/base-agent';
export { Logger } from './core/logger';
export { AgentRegistry } from './orchestrator/agent-registry';
export { OrchestratorAgent } from './orchestrator/orchestrator';
export { NewspaperAnalysisAgent } from './agents/newspaper-analysis-agent';
export { QuizGenerationAgent } from './agents/quiz-generation-agent';

// Default export
export default MultiAgentFramework;