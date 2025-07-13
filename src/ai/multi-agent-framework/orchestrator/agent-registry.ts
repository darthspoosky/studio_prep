/**
 * @fileOverview Agent Registry for managing and discovering agents
 */

import { 
  AgentMetadata, 
  AgentStatus, 
  AgentCategory,
  AgentMetrics,
  SystemMetrics 
} from '../core/types';
import { BaseAgent } from '../core/base-agent';
import { Logger } from '../core/logger';

export interface AgentRegistryConfig {
  maxAgents: number;
  healthCheckInterval: number; // milliseconds
  enableAutoDiscovery: boolean;
  logger: Logger;
}

export class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map();
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(private config: AgentRegistryConfig) {
    if (config.healthCheckInterval > 0) {
      this.startHealthChecks();
    }
  }

  /**
   * Register a new agent
   */
  register(agent: BaseAgent): void {
    const metadata = agent.getMetadata();
    
    if (this.agents.has(metadata.id)) {
      throw new Error(`Agent with ID ${metadata.id} is already registered`);
    }

    if (this.agents.size >= this.config.maxAgents) {
      throw new Error(`Maximum number of agents (${this.config.maxAgents}) reached`);
    }

    // Validate agent capabilities
    this.validateAgent(agent);

    this.agents.set(metadata.id, agent);
    
    this.config.logger.info(
      `Agent registered: ${metadata.id}`,
      {
        name: metadata.name,
        category: metadata.category,
        capabilities: metadata.capabilities.length,
        version: metadata.version
      }
    );
  }

  /**
   * Unregister an agent
   */
  unregister(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      agent.updateStatus(AgentStatus.INACTIVE);
      
      this.config.logger.info(`Agent unregistered: ${agentId}`);
      return true;
    }
    return false;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get active agents only
   */
  getActiveAgents(): BaseAgent[] {
    return this.getAllAgents().filter(agent => 
      agent.getMetadata().status === AgentStatus.ACTIVE
    );
  }

  /**
   * Get agents by category
   */
  getAgentsByCategory(category: AgentCategory): BaseAgent[] {
    return this.getAllAgents().filter(agent => 
      agent.getMetadata().category === category
    );
  }

  /**
   * Find agents that can handle a specific intent
   */
  findAgentsForIntent(intent: string, input?: any): Array<{
    agent: BaseAgent;
    confidence: number;
  }> {
    const capableAgents: Array<{ agent: BaseAgent; confidence: number }> = [];

    for (const agent of this.getActiveAgents()) {
      const capability = agent.canHandle(intent, input);
      if (capability.capable) {
        capableAgents.push({
          agent,
          confidence: capability.confidence
        });
      }
    }

    // Sort by confidence (highest first)
    return capableAgents.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalAgents: number;
    activeAgents: number;
    agentsByCategory: Record<AgentCategory, number>;
    agentsByStatus: Record<AgentStatus, number>;
  } {
    const agents = this.getAllAgents();
    
    const agentsByCategory = agents.reduce((acc, agent) => {
      const category = agent.getMetadata().category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<AgentCategory, number>);

    const agentsByStatus = agents.reduce((acc, agent) => {
      const status = agent.getMetadata().status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<AgentStatus, number>);

    return {
      totalAgents: agents.length,
      activeAgents: this.getActiveAgents().length,
      agentsByCategory,
      agentsByStatus
    };
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const agents = this.getAllAgents();
    const activeAgents = this.getActiveAgents();
    
    let totalRequests = 0;
    let totalCost = 0;
    let totalLatency = 0;
    let totalErrors = 0;

    for (const agent of agents) {
      const metrics = agent.getMetrics();
      totalRequests += metrics.totalRequests;
      totalCost += metrics.totalCost;
      totalLatency += metrics.averageLatency * metrics.totalRequests;
      totalErrors += metrics.failedRequests;
    }

    const averageResponseTime = totalRequests > 0 ? totalLatency / totalRequests : 0;
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      totalRequests,
      requestsPerMinute: 0, // Would need time window tracking
      averageResponseTime,
      systemLoad: this.calculateSystemLoad(),
      errorRate,
      costPerHour: totalCost // Simplified
    };
  }

  /**
   * Get detailed agent metrics
   */
  getAgentMetrics(): AgentMetrics[] {
    return this.getAllAgents().map(agent => agent.getMetrics());
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: AgentStatus): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.updateStatus(status);
      this.config.logger.info(`Agent ${agentId} status updated to ${status}`);
      return true;
    }
    return false;
  }

  /**
   * Perform health check on all agents
   */
  async performHealthCheck(): Promise<Map<string, boolean>> {
    const healthResults = new Map<string, boolean>();
    
    this.config.logger.debug('Starting health check for all agents');
    
    const healthPromises = this.getAllAgents().map(async (agent) => {
      const agentId = agent.getMetadata().id;
      try {
        const health = await agent.healthCheck();
        healthResults.set(agentId, health.healthy);
        
        if (!health.healthy) {
          this.config.logger.warn(
            `Agent ${agentId} health check failed`,
            health.details
          );
          agent.updateStatus(AgentStatus.ERROR);
        } else if (agent.getMetadata().status === AgentStatus.ERROR) {
          // Recover from error status if health check passes
          agent.updateStatus(AgentStatus.ACTIVE);
        }
      } catch (error) {
        healthResults.set(agentId, false);
        this.config.logger.error(
          `Health check error for agent ${agentId}`,
          error instanceof Error ? error : new Error(String(error))
        );
        agent.updateStatus(AgentStatus.ERROR);
      }
    });

    await Promise.all(healthPromises);
    
    const unhealthyCount = Array.from(healthResults.values()).filter(h => !h).length;
    if (unhealthyCount > 0) {
      this.config.logger.warn(`Health check completed: ${unhealthyCount} unhealthy agents`);
    } else {
      this.config.logger.debug('Health check completed: all agents healthy');
    }

    return healthResults;
  }

  /**
   * Auto-discover and register agents
   */
  async autoDiscoverAgents(searchPaths: string[]): Promise<number> {
    if (!this.config.enableAutoDiscovery) {
      this.config.logger.debug('Auto-discovery is disabled');
      return 0;
    }

    let discoveredCount = 0;
    
    // In a real implementation, this would scan file system for agent modules
    // For now, this is a placeholder for the auto-discovery mechanism
    this.config.logger.info('Auto-discovery is not yet implemented');
    
    return discoveredCount;
  }

  /**
   * Export registry data for backup/analysis
   */
  exportRegistry(): {
    timestamp: Date;
    agents: Array<{
      metadata: AgentMetadata;
      metrics: AgentMetrics;
      healthy: boolean;
    }>;
    stats: ReturnType<typeof this.getStats>;
  } {
    const agents = this.getAllAgents();
    
    return {
      timestamp: new Date(),
      agents: agents.map(agent => ({
        metadata: agent.getMetadata(),
        metrics: agent.getMetrics(),
        healthy: agent.getMetadata().status === AgentStatus.ACTIVE
      })),
      stats: this.getStats()
    };
  }

  /**
   * Clean up inactive agents
   */
  cleanup(): void {
    const inactiveAgents: string[] = [];
    
    for (const [agentId, agent] of this.agents) {
      const metadata = agent.getMetadata();
      const metrics = agent.getMetrics();
      
      // Remove agents that have been inactive for more than 1 hour
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (metadata.status === AgentStatus.INACTIVE || 
          (metrics.lastActivity < hourAgo && metadata.status === AgentStatus.ERROR)) {
        inactiveAgents.push(agentId);
      }
    }

    for (const agentId of inactiveAgents) {
      this.unregister(agentId);
      this.config.logger.info(`Cleaned up inactive agent: ${agentId}`);
    }
  }

  /**
   * Shutdown registry
   */
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Set all agents to inactive
    for (const agent of this.agents.values()) {
      agent.updateStatus(AgentStatus.INACTIVE);
    }

    this.config.logger.info('Agent registry shutdown completed');
  }

  /**
   * Private methods
   */

  private validateAgent(agent: BaseAgent): void {
    const metadata = agent.getMetadata();
    
    if (!metadata.id || !metadata.name) {
      throw new Error('Agent must have valid id and name');
    }

    if (metadata.capabilities.length === 0) {
      throw new Error('Agent must have at least one capability');
    }

    // Validate capability schemas
    for (const capability of metadata.capabilities) {
      if (!capability.intent || !capability.inputSchema || !capability.outputSchema) {
        throw new Error(`Invalid capability definition: ${capability.intent}`);
      }
    }
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.config.logger.error('Health check failed', error instanceof Error ? error : new Error(String(error)));
      }
    }, this.config.healthCheckInterval);

    this.config.logger.info(`Health checks started with interval: ${this.config.healthCheckInterval}ms`);
  }

  private calculateSystemLoad(): number {
    const agents = this.getAllAgents();
    if (agents.length === 0) return 0;

    let totalLoad = 0;
    for (const agent of agents) {
      const metrics = agent.getMetrics();
      
      // Calculate load based on error rate and recent activity
      const errorLoad = metrics.errorRate * 0.5;
      const activityLoad = metrics.lastActivity > new Date(Date.now() - 5 * 60 * 1000) ? 0.3 : 0;
      
      totalLoad += errorLoad + activityLoad;
    }

    return Math.min(totalLoad / agents.length, 1.0);
  }
}

/**
 * Create default agent registry
 */
export function createAgentRegistry(config: Partial<AgentRegistryConfig> & { logger: Logger }): AgentRegistry {
  const defaultConfig: AgentRegistryConfig = {
    maxAgents: 50,
    healthCheckInterval: 60000, // 1 minute
    enableAutoDiscovery: false,
    ...config
  };

  return new AgentRegistry(defaultConfig);
}