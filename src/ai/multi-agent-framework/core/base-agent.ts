/**
 * @fileOverview Base agent class for the multi-agent framework
 */

import OpenAI from 'openai';
import { z } from 'zod';
import {
  AgentMetadata,
  AgentCapability,
  BaseRequest,
  BaseResponse,
  ExecutionContext,
  AgentError,
  AgentStatus,
  AgentMetrics
} from './types';
import { Logger } from './logger';

export abstract class BaseAgent {
  protected openai: OpenAI;
  protected logger: Logger;
  protected metrics: AgentMetrics;

  constructor(
    protected metadata: AgentMetadata,
    protected config: { 
      openai: OpenAI;
      logger: Logger;
      enableMetrics?: boolean;
    }
  ) {
    this.openai = config.openai;
    this.logger = config.logger;
    
    this.metrics = {
      agentId: metadata.id,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      averageTokens: 0,
      totalCost: 0,
      lastActivity: new Date(),
      errorRate: 0,
      qualityScore: 0
    };
  }

  /**
   * Abstract method that each agent must implement
   */
  abstract execute(request: BaseRequest, context: ExecutionContext): Promise<BaseResponse>;

  /**
   * Validate input against agent's expected schema
   */
  protected validateInput(input: any, capability: AgentCapability): boolean {
    try {
      capability.inputSchema.parse(input);
      return true;
    } catch (error) {
      this.logger.warn(`Input validation failed for ${this.metadata.id}:`, error);
      return false;
    }
  }

  /**
   * Validate output against agent's expected schema
   */
  protected validateOutput(output: any, capability: AgentCapability): boolean {
    try {
      capability.outputSchema.parse(output);
      return true;
    } catch (error) {
      this.logger.warn(`Output validation failed for ${this.metadata.id}:`, error);
      return false;
    }
  }

  /**
   * Check if this agent can handle the given intent
   */
  canHandle(intent: string, input?: any): { capable: boolean; confidence: number } {
    const capability = this.metadata.capabilities.find(cap => cap.intent === intent);
    
    if (!capability) {
      return { capable: false, confidence: 0 };
    }

    // If input provided, validate against schema
    if (input && !this.validateInput(input, capability)) {
      return { capable: false, confidence: 0 };
    }

    return { capable: true, confidence: capability.confidence };
  }

  /**
   * Get agent metadata
   */
  getMetadata(): AgentMetadata {
    return { ...this.metadata };
  }

  /**
   * Get agent metrics
   */
  getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  /**
   * Update agent status
   */
  updateStatus(status: AgentStatus): void {
    this.metadata.status = status;
    this.logger.info(`Agent ${this.metadata.id} status updated to ${status}`);
  }

  /**
   * Process request with metrics tracking
   */
  async processRequest(request: BaseRequest, context: ExecutionContext): Promise<BaseResponse> {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    this.metrics.lastActivity = new Date();

    try {
      // Validate execution constraints
      this.validateConstraints(context);

      // Log request
      this.logger.info(`Processing request ${request.id} with agent ${this.metadata.id}`);

      // Execute the actual agent logic
      const response = await this.execute(request, context);

      // Calculate metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(true, processingTime, response);

      // Validate response
      if (!response.success && !response.error) {
        throw new AgentError(
          'Agent returned unsuccessful response without error message',
          'INVALID_RESPONSE',
          this.metadata.id
        );
      }

      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(false, processingTime);

      // Create error response
      const errorResponse: BaseResponse = {
        id: `${request.id}_response`,
        requestId: request.id,
        success: false,
        timestamp: Date.now(),
        processingTime,
        agentId: this.metadata.id,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };

      this.logger.error(`Agent ${this.metadata.id} failed to process request ${request.id}:`, error);
      
      return errorResponse;
    }
  }

  /**
   * Validate execution constraints
   */
  protected validateConstraints(context: ExecutionContext): void {
    if (context.depth > 10) {
      throw new AgentError(
        'Maximum recursion depth exceeded',
        'MAX_DEPTH_EXCEEDED',
        this.metadata.id
      );
    }

    if (context.constraints.maxTokens < this.metadata.resourceRequirements.maxTokens) {
      throw new AgentError(
        'Insufficient token allocation for agent requirements',
        'INSUFFICIENT_TOKENS',
        this.metadata.id
      );
    }
  }

  /**
   * Update agent metrics
   */
  protected updateMetrics(success: boolean, processingTime: number, response?: BaseResponse): void {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average latency
    const totalRequests = this.metrics.totalRequests;
    this.metrics.averageLatency = (
      (this.metrics.averageLatency * (totalRequests - 1)) + processingTime
    ) / totalRequests;

    // Update error rate
    this.metrics.errorRate = this.metrics.failedRequests / totalRequests;

    // Update token usage if available
    if (response?.metadata?.tokenUsage) {
      const tokens = response.metadata.tokenUsage;
      this.metrics.averageTokens = (
        (this.metrics.averageTokens * (totalRequests - 1)) + tokens
      ) / totalRequests;
    }
  }

  /**
   * Call OpenAI API with standardized error handling
   */
  protected async callOpenAI(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      responseFormat?: { type: 'json_object' } | { type: 'text' };
    } = {}
  ): Promise<{ content: string; usage: OpenAI.Completions.CompletionUsage }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens || 2000,
        response_format: options.responseFormat,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AgentError(
          'No content received from OpenAI',
          'EMPTY_RESPONSE',
          this.metadata.id
        );
      }

      return {
        content,
        usage: response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };

    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new AgentError(
          `OpenAI API error: ${error.message}`,
          'OPENAI_API_ERROR',
          this.metadata.id,
          error.status >= 500, // Retry on server errors
          error
        );
      }
      
      throw new AgentError(
        `Unexpected error calling OpenAI: ${error}`,
        'OPENAI_CALL_FAILED',
        this.metadata.id,
        false,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Parse JSON response with error handling
   */
  protected parseJSONResponse<T>(content: string, schema?: z.ZodSchema<T>): T {
    try {
      const parsed = JSON.parse(content);
      
      if (schema) {
        return schema.parse(parsed);
      }
      
      return parsed;
    } catch (error) {
      throw new AgentError(
        `Failed to parse JSON response: ${error}`,
        'JSON_PARSE_ERROR',
        this.metadata.id,
        false,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Create standardized response
   */
  protected createResponse(
    request: BaseRequest,
    data?: any,
    processingTime?: number,
    metadata?: Record<string, any>
  ): BaseResponse {
    return {
      id: `${request.id}_response`,
      requestId: request.id,
      success: true,
      timestamp: Date.now(),
      processingTime: processingTime || 0,
      agentId: this.metadata.id,
      data,
      metadata
    };
  }

  /**
   * Health check for the agent
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      // Simple test call to OpenAI
      const response = await this.callOpenAI([
        { role: 'user', content: 'Hello' }
      ], { maxTokens: 10 });

      return {
        healthy: true,
        details: {
          status: this.metadata.status,
          lastActivity: this.metrics.lastActivity,
          errorRate: this.metrics.errorRate,
          openaiConnected: !!response.content
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          status: this.metadata.status,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastActivity: this.metrics.lastActivity
        }
      };
    }
  }
}

/**
 * Utility function to create agent capability
 */
export function createCapability(
  intent: string,
  description: string,
  inputSchema: z.ZodSchema,
  outputSchema: z.ZodSchema,
  confidence: number = 1.0,
  examples: Array<{ input: any; output: any }> = []
): AgentCapability {
  return {
    intent,
    description,
    inputSchema,
    outputSchema,
    examples,
    confidence
  };
}