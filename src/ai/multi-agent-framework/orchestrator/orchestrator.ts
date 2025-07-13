/**
 * @fileOverview Central Orchestrator Agent for request routing and coordination
 */

import OpenAI from 'openai';
import { z } from 'zod';
import {
  BaseRequest,
  BaseResponse,
  ExecutionContext,
  Intent,
  IntentClassificationResult,
  AgentTask,
  Workflow,
  TaskStatus,
  WorkflowStatus,
  OrchestratorError,
  ExecutionConstraints,
  AgentRequest
} from '../core/types';
import { BaseAgent } from '../core/base-agent';
import { Logger } from '../core/logger';
import { AgentRegistry } from './agent-registry';

// Intent classification schemas
const IntentClassificationRequestSchema = z.object({
  text: z.string(),
  context: z.record(z.any()).optional(),
  userHistory: z.array(z.string()).optional(),
});

const IntentClassificationResponseSchema = z.object({
  primaryIntent: z.object({
    name: z.string(),
    confidence: z.number().min(0).max(1),
    extractedEntities: z.record(z.any()),
    context: z.record(z.any())
  }),
  secondaryIntents: z.array(z.object({
    name: z.string(),
    confidence: z.number().min(0).max(1),
    extractedEntities: z.record(z.any()),
    context: z.record(z.any())
  })),
  ambiguous: z.boolean(),
  confidence: z.number().min(0).max(1)
});

export class OrchestratorAgent extends BaseAgent {
  private agentRegistry: AgentRegistry;
  private activeWorkflows: Map<string, Workflow> = new Map();

  constructor(
    config: {
      openai: OpenAI;
      logger: Logger;
      agentRegistry: AgentRegistry;
      enableMetrics?: boolean;
    }
  ) {
    const metadata = {
      id: 'orchestrator',
      name: 'Central Orchestrator',
      description: 'Routes requests to appropriate agents and coordinates multi-agent workflows',
      version: '1.0.0',
      category: 'orchestration' as const,
      capabilities: [
        {
          intent: 'route_request',
          description: 'Route incoming requests to appropriate specialized agents',
          inputSchema: z.any(),
          outputSchema: z.any(),
          confidence: 1.0,
          examples: []
        },
        {
          intent: 'coordinate_workflow',
          description: 'Coordinate multi-agent workflows for complex tasks',
          inputSchema: z.any(),
          outputSchema: z.any(),
          confidence: 1.0,
          examples: []
        }
      ],
      resourceRequirements: {
        maxTokens: 4000,
        estimatedLatency: 2000,
        memoryUsage: 256,
        costPerRequest: 0.01
      },
      status: 'active' as const
    };

    super(metadata, config);
    this.agentRegistry = config.agentRegistry;
  }

  async execute(request: BaseRequest, context: ExecutionContext): Promise<BaseResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.requestStart(
        request.id,
        this.metadata.id,
        'Starting orchestration',
        { requestType: (request as any).type }
      );

      // Step 1: Classify intent from the request
      const intentResult = await this.classifyIntent(request);
      
      this.logger.agentInfo(
        this.metadata.id,
        'Intent classified',
        {
          primaryIntent: intentResult.primaryIntent.name,
          confidence: intentResult.confidence,
          ambiguous: intentResult.ambiguous
        },
        request.id
      );

      // Step 2: Select appropriate agent(s)
      const selectedAgents = await this.selectAgents(intentResult, request);

      if (selectedAgents.length === 0) {
        throw new OrchestratorError(
          'No suitable agents found for the request',
          'NO_SUITABLE_AGENTS',
          'agent_selection'
        );
      }

      // Step 3: Determine execution strategy
      const executionStrategy = this.determineExecutionStrategy(selectedAgents, intentResult);

      // Step 4: Execute based on strategy
      let response: BaseResponse;
      
      if (executionStrategy.type === 'single_agent') {
        response = await this.executeSingleAgent(
          selectedAgents[0],
          request,
          context
        );
      } else {
        response = await this.executeWorkflow(
          selectedAgents,
          request,
          context,
          executionStrategy
        );
      }

      const processingTime = Date.now() - startTime;
      
      this.logger.requestEnd(
        request.id,
        this.metadata.id,
        'Orchestration completed',
        { processingTime, strategy: executionStrategy.type }
      );

      return {
        ...response,
        processingTime,
        metadata: {
          ...response.metadata,
          orchestratorInfo: {
            intentClassification: intentResult,
            selectedAgents: selectedAgents.map(a => a.agentId),
            executionStrategy: executionStrategy.type
          }
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.requestError(
        request.id,
        this.metadata.id,
        'Orchestration failed',
        error instanceof Error ? error : new Error(String(error))
      );

      throw error;
    }
  }

  /**
   * Classify the intent of an incoming request
   */
  private async classifyIntent(request: BaseRequest): Promise<IntentClassificationResult> {
    try {
      // Extract text content for classification
      const textContent = this.extractTextContent(request);
      
      // Use OpenAI to classify intent
      const response = await this.callOpenAI([
        {
          role: 'system',
          content: `You are an expert intent classifier for an educational AI system. Analyze the user request and classify it into one of these intents:

CONTENT ANALYSIS INTENTS:
- newspaper_analysis: Analyzing news articles for UPSC preparation
- pdf_analysis: Analyzing PDF documents and extracting insights
- quiz_generation: Creating quiz questions from content
- mock_interview: Conducting mock interviews

WRITING SUPPORT INTENTS:
- writing_evaluation: Evaluating essays, answers, or other written content
- essay_planning: Helping plan essay structure and content
- grammar_check: Checking grammar and language

KNOWLEDGE INTENTS:
- syllabus_query: Questions about UPSC syllabus
- current_affairs: Current affairs related queries
- fact_verification: Verifying facts and information

UTILITY INTENTS:
- text_to_speech: Converting text to audio
- language_translation: Translating content
- summarization: Summarizing long content

Respond with a JSON object containing:
1. primaryIntent: The most likely intent with confidence score and extracted entities
2. secondaryIntents: Alternative intents (if any) with lower confidence
3. ambiguous: Whether the intent is unclear
4. confidence: Overall confidence in classification (0-1)

Extract relevant entities like:
- topic names
- difficulty levels
- content types
- language preferences
- specific requirements`
        },
        {
          role: 'user',
          content: `Classify this request:
${JSON.stringify(request, null, 2)}

Text content: "${textContent}"`
        }
      ], {
        responseFormat: { type: 'json_object' },
        temperature: 0.1
      });

      const result = this.parseJSONResponse(response.content, IntentClassificationResponseSchema);
      
      // Validate confidence threshold
      if (result.confidence < 0.5) {
        throw new OrchestratorError(
          `Low confidence in intent classification: ${result.confidence}`,
          'LOW_CONFIDENCE_INTENT',
          'intent_classification'
        );
      }

      return result;

    } catch (error) {
      throw new OrchestratorError(
        `Intent classification failed: ${error}`,
        'INTENT_CLASSIFICATION_FAILED',
        'intent_classification',
        true,
      );
    }
  }

  /**
   * Extract text content from request for intent classification
   */
  private extractTextContent(request: BaseRequest): string {
    const data = (request as any).data;
    if (!data) return '';

    // Extract text from various possible fields
    const textFields = [
      data.sourceText,
      data.text,
      data.content,
      data.query,
      data.question,
      data.topic
    ].filter(Boolean);

    return textFields.join(' ').substring(0, 2000); // Limit length
  }

  /**
   * Select appropriate agents based on intent classification
   */
  private async selectAgents(
    intentResult: IntentClassificationResult,
    request: BaseRequest
  ): Promise<Array<{ agentId: string; confidence: number; capabilities: string[] }>> {
    const selectedAgents: Array<{ agentId: string; confidence: number; capabilities: string[] }> = [];
    
    // Get all available agents from registry
    const availableAgents = this.agentRegistry.getActiveAgents();
    
    // Primary intent matching
    for (const agent of availableAgents) {
      const capability = agent.canHandle(intentResult.primaryIntent.name, (request as any).data);
      
      if (capability.capable) {
        selectedAgents.push({
          agentId: agent.getMetadata().id,
          confidence: capability.confidence * intentResult.primaryIntent.confidence,
          capabilities: [intentResult.primaryIntent.name]
        });
      }
    }

    // Secondary intent matching (for complex requests)
    for (const secondaryIntent of intentResult.secondaryIntents) {
      if (secondaryIntent.confidence > 0.7) {
        for (const agent of availableAgents) {
          const capability = agent.canHandle(secondaryIntent.name, (request as any).data);
          
          if (capability.capable) {
            const existingAgent = selectedAgents.find(a => a.agentId === agent.getMetadata().id);
            
            if (existingAgent) {
              existingAgent.capabilities.push(secondaryIntent.name);
              existingAgent.confidence = Math.max(
                existingAgent.confidence,
                capability.confidence * secondaryIntent.confidence
              );
            } else {
              selectedAgents.push({
                agentId: agent.getMetadata().id,
                confidence: capability.confidence * secondaryIntent.confidence,
                capabilities: [secondaryIntent.name]
              });
            }
          }
        }
      }
    }

    // Sort by confidence and return top candidates
    return selectedAgents
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Limit to top 3 agents
  }

  /**
   * Determine execution strategy based on selected agents and intent
   */
  private determineExecutionStrategy(
    selectedAgents: Array<{ agentId: string; confidence: number; capabilities: string[] }>,
    intentResult: IntentClassificationResult
  ): { type: 'single_agent' | 'parallel' | 'sequential'; plan?: any } {
    
    // Single agent if only one selected or high confidence primary intent
    if (selectedAgents.length === 1 || intentResult.primaryIntent.confidence > 0.9) {
      return { type: 'single_agent' };
    }

    // Check if agents have complementary capabilities
    const allCapabilities = selectedAgents.flatMap(a => a.capabilities);
    const uniqueCapabilities = new Set(allCapabilities);

    // If agents handle different intents, execute in parallel
    if (uniqueCapabilities.size > 1) {
      return { type: 'parallel' };
    }

    // Default to single agent (highest confidence)
    return { type: 'single_agent' };
  }

  /**
   * Execute single agent request
   */
  private async executeSingleAgent(
    selectedAgent: { agentId: string; confidence: number; capabilities: string[] },
    request: BaseRequest,
    context: ExecutionContext
  ): Promise<BaseResponse> {
    
    const agent = this.agentRegistry.getAgent(selectedAgent.agentId);
    if (!agent) {
      throw new OrchestratorError(
        `Agent ${selectedAgent.agentId} not found in registry`,
        'AGENT_NOT_FOUND',
        'execution'
      );
    }

    this.logger.agentInfo(
      this.metadata.id,
      `Executing single agent: ${selectedAgent.agentId}`,
      { confidence: selectedAgent.confidence },
      request.id
    );

    return await agent.processRequest(request, context);
  }

  /**
   * Execute multi-agent workflow
   */
  private async executeWorkflow(
    selectedAgents: Array<{ agentId: string; confidence: number; capabilities: string[] }>,
    request: BaseRequest,
    context: ExecutionContext,
    strategy: { type: string; plan?: any }
  ): Promise<BaseResponse> {
    
    const workflowId = `workflow_${request.id}`;
    
    this.logger.agentInfo(
      this.metadata.id,
      `Starting workflow: ${workflowId}`,
      { strategy: strategy.type, agentCount: selectedAgents.length },
      request.id
    );

    // Create workflow
    const workflow: Workflow = {
      id: workflowId,
      name: `Auto-generated workflow for ${request.id}`,
      description: 'Multi-agent workflow created by orchestrator',
      tasks: selectedAgents.map((agent, index) => ({
        id: `task_${index}`,
        agentId: agent.agentId,
        input: request,
        dependencies: [],
        priority: 2, // MEDIUM
        status: TaskStatus.PENDING
      })),
      executionPlan: {
        parallel: strategy.type === 'parallel' ? [selectedAgents.map((_, i) => `task_${i}`)] : [],
        sequential: strategy.type === 'sequential' ? selectedAgents.map((_, i) => `task_${i}`) : [],
        conditional: []
      },
      status: WorkflowStatus.RUNNING
    };

    this.activeWorkflows.set(workflowId, workflow);

    try {
      if (strategy.type === 'parallel') {
        return await this.executeParallelTasks(workflow, context);
      } else {
        return await this.executeSequentialTasks(workflow, context);
      }
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Execute tasks in parallel
   */
  private async executeParallelTasks(workflow: Workflow, context: ExecutionContext): Promise<BaseResponse> {
    const taskPromises = workflow.tasks.map(async (task) => {
      const agent = this.agentRegistry.getAgent(task.agentId);
      if (!agent) {
        throw new OrchestratorError(
          `Agent ${task.agentId} not found`,
          'AGENT_NOT_FOUND',
          'execution'
        );
      }

      task.status = TaskStatus.RUNNING;
      task.startTime = Date.now();

      try {
        const result = await agent.processRequest(task.input as BaseRequest, context);
        task.status = TaskStatus.COMPLETED;
        task.result = result;
        task.endTime = Date.now();
        return result;
      } catch (error) {
        task.status = TaskStatus.FAILED;
        task.error = error instanceof Error ? error.message : String(error);
        task.endTime = Date.now();
        throw error;
      }
    });

    const results = await Promise.allSettled(taskPromises);
    
    // Aggregate results
    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<BaseResponse> => result.status === 'fulfilled')
      .map(result => result.value);

    const failedResults = results
      .filter(result => result.status === 'rejected')
      .map(result => result.reason);

    if (successfulResults.length === 0) {
      throw new OrchestratorError(
        `All parallel tasks failed: ${failedResults.map(r => r.message).join(', ')}`,
        'ALL_TASKS_FAILED',
        'execution'
      );
    }

    // Combine successful results
    const combinedResponse = this.combineResponses(successfulResults, workflow.tasks[0].input as BaseRequest);
    workflow.status = WorkflowStatus.COMPLETED;

    return combinedResponse;
  }

  /**
   * Execute tasks sequentially
   */
  private async executeSequentialTasks(workflow: Workflow, context: ExecutionContext): Promise<BaseResponse> {
    let lastResponse: BaseResponse | null = null;

    for (const task of workflow.tasks) {
      const agent = this.agentRegistry.getAgent(task.agentId);
      if (!agent) {
        throw new OrchestratorError(
          `Agent ${task.agentId} not found`,
          'AGENT_NOT_FOUND',
          'execution'
        );
      }

      task.status = TaskStatus.RUNNING;
      task.startTime = Date.now();

      try {
        // Use output from previous task if available
        const taskInput = lastResponse?.data ? 
          { ...task.input, previousResult: lastResponse.data } : 
          task.input;

        const result = await agent.processRequest(taskInput as BaseRequest, context);
        
        task.status = TaskStatus.COMPLETED;
        task.result = result;
        task.endTime = Date.now();
        lastResponse = result;

      } catch (error) {
        task.status = TaskStatus.FAILED;
        task.error = error instanceof Error ? error.message : String(error);
        task.endTime = Date.now();
        workflow.status = WorkflowStatus.FAILED;
        throw error;
      }
    }

    workflow.status = WorkflowStatus.COMPLETED;
    return lastResponse!;
  }

  /**
   * Combine responses from multiple agents
   */
  private combineResponses(responses: BaseResponse[], originalRequest: BaseRequest): BaseResponse {
    const combinedData: any = {};
    let totalProcessingTime = 0;
    const agentResults: any[] = [];

    for (const response of responses) {
      totalProcessingTime += response.processingTime;
      agentResults.push({
        agentId: response.agentId,
        data: response.data,
        processingTime: response.processingTime
      });

      // Merge data from each response
      if (response.data) {
        Object.assign(combinedData, response.data);
      }
    }

    return this.createResponse(
      originalRequest,
      {
        ...combinedData,
        agentResults
      },
      totalProcessingTime,
      {
        workflowType: 'parallel',
        agentCount: responses.length,
        combinedResults: true
      }
    );
  }

  /**
   * Get active workflows
   */
  getActiveWorkflows(): Workflow[] {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Cancel workflow
   */
  cancelWorkflow(workflowId: string): boolean {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.status = WorkflowStatus.PAUSED;
      // Cancel running tasks
      workflow.tasks.forEach(task => {
        if (task.status === TaskStatus.RUNNING) {
          task.status = TaskStatus.CANCELLED;
        }
      });
      return true;
    }
    return false;
  }
}