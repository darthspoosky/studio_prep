/**
 * @fileOverview Enhanced Quality Tracker with database persistence
 */

import { QualityTracker } from '../metrics/quality-tracker';
import { databaseAdapter, QualitySession } from './database-adapter';
import { 
  NewspaperAnalysisOutput, 
  AgentMetrics,
  SystemMetrics 
} from '../core/types';
import { Logger } from '../core/logger';

interface PersistentQualityTrackerConfig {
  enablePersistence: boolean;
  enableInMemory: boolean;
  syncInterval: number; // milliseconds
  logger: Logger;
}

export class PersistentQualityTracker extends QualityTracker {
  private config: PersistentQualityTrackerConfig;
  private syncTimer: NodeJS.Timeout | null = null;
  private pendingSessions: QualitySession[] = [];

  constructor(config: PersistentQualityTrackerConfig) {
    super();
    this.config = config;
    
    if (config.enablePersistence && config.syncInterval > 0) {
      this.startPeriodicSync();
    }
  }

  /**
   * Track session with database persistence
   */
  async trackSession(
    sessionId: string,
    userId: string,
    input: any,
    output: NewspaperAnalysisOutput,
    processingTime: number,
    tokenUsage: any,
    cost: number
  ): Promise<any> {
    // Call parent method for in-memory tracking
    const metrics = this.config.enableInMemory 
      ? await super.trackSession(sessionId, userId, input, output, processingTime, tokenUsage, cost)
      : null;

    // Prepare session data for persistence
    if (this.config.enablePersistence) {
      const session: QualitySession = {
        id: sessionId,
        userId,
        agentId: this.determineAgentId(input),
        requestType: input.type || 'unknown',
        timestamp: new Date(),
        processingTime,
        success: !!output && Object.keys(output).length > 0,
        qualityScore: output.qualityScore,
        tokenUsage: {
          input: tokenUsage.input || 0,
          output: tokenUsage.output || 0,
          total: tokenUsage.total || 0
        },
        cost,
        metadata: {
          inputLength: this.getInputLength(input),
          outputLength: this.getOutputLength(output),
          analysisType: input.analysisType || input.analysisFocus,
          examType: input.examType,
          outputLanguage: input.outputLanguage,
          questionsGenerated: this.getQuestionsCount(output),
          relevanceScore: output.upscRelevanceScore || output.relevanceScore,
          syllabusTopic: output.syllabusTopic,
          tags: output.tags
        }
      };

      await this.saveSession(session);
    }

    return metrics;
  }

  /**
   * Save session to database (with retry logic)
   */
  private async saveSession(session: QualitySession, retryCount: number = 0): Promise<void> {
    try {
      await databaseAdapter.saveQualitySession(session);
      
      this.config.logger.debug(
        'Quality session saved to database',
        { sessionId: session.id, userId: session.userId }
      );
      
    } catch (error) {
      this.config.logger.error(
        'Failed to save quality session',
        error instanceof Error ? error : new Error(String(error)),
        { sessionId: session.id, retryCount }
      );

      // Retry logic
      if (retryCount < 2) {
        setTimeout(() => {
          this.saveSession(session, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
      } else {
        // Add to pending queue for periodic retry
        this.pendingSessions.push(session);
      }
    }
  }

  /**
   * Get enhanced analytics with database data
   */
  async getEnhancedAnalytics(timeRange: { start: Date; end: Date }, userId?: string): Promise<any> {
    try {
      // Get in-memory analytics
      const inMemoryAnalytics = this.config.enableInMemory 
        ? this.getQualityAnalytics(timeRange)
        : null;

      // Get database analytics
      const dbAnalytics = this.config.enablePersistence 
        ? await databaseAdapter.getAnalytics(timeRange, userId)
        : null;

      // Combine results
      if (inMemoryAnalytics && dbAnalytics) {
        return {
          inMemory: inMemoryAnalytics,
          persistent: dbAnalytics,
          combined: this.combineAnalytics(inMemoryAnalytics, dbAnalytics)
        };
      }

      return dbAnalytics || inMemoryAnalytics || null;

    } catch (error) {
      this.config.logger.error(
        'Failed to get enhanced analytics',
        error instanceof Error ? error : new Error(String(error))
      );
      
      // Fallback to in-memory only
      return this.config.enableInMemory ? this.getQualityAnalytics(timeRange) : null;
    }
  }

  /**
   * Get user-specific analytics
   */
  async getUserAnalytics(userId: string, timeRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const userUsage = await databaseAdapter.getUserUsage(userId);
      
      if (!userUsage) {
        return null;
      }

      let recentSessions = null;
      if (timeRange) {
        recentSessions = await databaseAdapter.getQualitySessions({
          userId,
          startDate: timeRange.start,
          endDate: timeRange.end
        });
      }

      return {
        totalUsage: userUsage,
        recentActivity: recentSessions ? {
          sessions: recentSessions.length,
          averageQuality: this.calculateAverageQuality(recentSessions),
          totalCost: recentSessions.reduce((sum, s) => sum + s.cost, 0),
          agentUsage: this.calculateAgentUsage(recentSessions)
        } : null
      };

    } catch (error) {
      this.config.logger.error(
        'Failed to get user analytics',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
      return null;
    }
  }

  /**
   * Export comprehensive data for analysis
   */
  async exportData(
    timeRange: { start: Date; end: Date },
    format: 'json' | 'csv' = 'json',
    userId?: string
  ): Promise<string> {
    try {
      const sessions = await databaseAdapter.getQualitySessions({
        userId,
        startDate: timeRange.start,
        endDate: timeRange.end
      });

      if (format === 'json') {
        return JSON.stringify({
          exportTime: new Date().toISOString(),
          timeRange,
          userId,
          sessions,
          summary: {
            totalSessions: sessions.length,
            successRate: sessions.filter(s => s.success).length / sessions.length,
            averageQuality: this.calculateAverageQuality(sessions),
            totalCost: sessions.reduce((sum, s) => sum + s.cost, 0)
          }
        }, null, 2);
      } else {
        // CSV format
        const headers = [
          'sessionId', 'userId', 'agentId', 'requestType', 'timestamp',
          'processingTime', 'success', 'qualityScore', 'tokenUsage', 'cost'
        ];
        
        const rows = sessions.map(session => [
          session.id,
          session.userId,
          session.agentId,
          session.requestType,
          session.timestamp.toISOString(),
          session.processingTime,
          session.success,
          session.qualityScore || '',
          session.tokenUsage.total,
          session.cost
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      }

    } catch (error) {
      this.config.logger.error(
        'Failed to export data',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(days: number = 30): Promise<{
    qualityTrend: Array<{ date: Date; avgQuality: number }>;
    costTrend: Array<{ date: Date; totalCost: number }>;
    volumeTrend: Array<{ date: Date; sessionCount: number }>;
    agentPerformance: Record<string, {
      avgQuality: number;
      sessionCount: number;
      costEfficiency: number;
    }>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await databaseAdapter.getAnalytics({ start: startDate, end: endDate });
      
      // Process trends
      const qualityTrend = analytics.timeSeriesData.map(day => ({
        date: day.date,
        avgQuality: day.quality
      }));

      const costTrend = analytics.timeSeriesData.map(day => ({
        date: day.date,
        totalCost: day.cost
      }));

      const volumeTrend = analytics.timeSeriesData.map(day => ({
        date: day.date,
        sessionCount: day.sessions
      }));

      // Agent performance analysis
      const agentPerformance: Record<string, any> = {};
      Object.entries(analytics.agentBreakdown).forEach(([agentId, data]: [string, any]) => {
        agentPerformance[agentId] = {
          avgQuality: data.avgQuality,
          sessionCount: data.sessions,
          costEfficiency: data.sessions / Math.max(data.cost, 0.001) // Sessions per dollar
        };
      });

      return {
        qualityTrend,
        costTrend,
        volumeTrend,
        agentPerformance
      };

    } catch (error) {
      this.config.logger.error(
        'Failed to get performance trends',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Cleanup old data
   */
  async cleanup(olderThanDays: number = 90): Promise<void> {
    try {
      const result = await databaseAdapter.cleanupOldData(olderThanDays);
      
      this.config.logger.info(
        'Database cleanup completed',
        {
          sessionsDeleted: result.sessionsDeleted,
          experimentsDeleted: result.experimentsDeleted,
          olderThanDays
        }
      );

    } catch (error) {
      this.config.logger.error(
        'Database cleanup failed',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    // Stop periodic sync
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    // Save any pending sessions
    if (this.pendingSessions.length > 0) {
      this.config.logger.info(`Saving ${this.pendingSessions.length} pending sessions`);
      
      for (const session of this.pendingSessions) {
        try {
          await databaseAdapter.saveQualitySession(session);
        } catch (error) {
          this.config.logger.error('Failed to save pending session', error as Error);
        }
      }
      
      this.pendingSessions = [];
    }
  }

  /**
   * Private helper methods
   */

  private startPeriodicSync(): void {
    this.syncTimer = setInterval(async () => {
      if (this.pendingSessions.length > 0) {
        const sessionsToSync = [...this.pendingSessions];
        this.pendingSessions = [];

        for (const session of sessionsToSync) {
          await this.saveSession(session);
        }
      }
    }, this.config.syncInterval);
  }

  private determineAgentId(input: any): string {
    // Map request types to agent IDs
    const typeToAgentId: Record<string, string> = {
      'newspaper_analysis': 'newspaper_analysis_agent',
      'quiz_generation': 'quiz_generation_agent',
      'writing_evaluation': 'writing_evaluation_agent',
      'mock_interview': 'mock_interview_agent'
    };

    return typeToAgentId[input.type] || 'unknown_agent';
  }

  private getInputLength(input: any): number {
    if (input.data?.sourceText) return input.data.sourceText.length;
    if (input.data?.text) return input.data.text.length;
    if (input.data?.content) return input.data.content.length;
    return 0;
  }

  private getOutputLength(output: any): number {
    if (!output) return 0;
    return JSON.stringify(output).length;
  }

  private getQuestionsCount(output: any): number {
    if (!output) return 0;
    
    let count = 0;
    if (output.prelims?.mcqs) count += output.prelims.mcqs.length;
    if (output.mains?.questions) count += output.mains.questions.length;
    if (output.questions) count += output.questions.length;
    
    return count;
  }

  private calculateAverageQuality(sessions: QualitySession[]): number {
    const qualityScores = sessions
      .map(s => s.qualityScore)
      .filter(q => q !== undefined) as number[];
    
    return qualityScores.length > 0 
      ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length 
      : 0;
  }

  private calculateAgentUsage(sessions: QualitySession[]): Record<string, any> {
    const agentUsage: Record<string, any> = {};
    
    sessions.forEach(session => {
      if (!agentUsage[session.agentId]) {
        agentUsage[session.agentId] = {
          sessions: 0,
          totalQuality: 0,
          qualityCount: 0,
          totalCost: 0
        };
      }
      
      const usage = agentUsage[session.agentId];
      usage.sessions++;
      usage.totalCost += session.cost;
      
      if (session.qualityScore) {
        usage.totalQuality += session.qualityScore;
        usage.qualityCount++;
      }
    });

    // Calculate averages
    Object.keys(agentUsage).forEach(agentId => {
      const usage = agentUsage[agentId];
      usage.avgQuality = usage.qualityCount > 0 ? usage.totalQuality / usage.qualityCount : 0;
      delete usage.totalQuality;
      delete usage.qualityCount;
    });

    return agentUsage;
  }

  private combineAnalytics(inMemory: any, persistent: any): any {
    // Simple combination - in production, you might want more sophisticated merging
    return {
      totalSessions: inMemory.summary.totalSessions + persistent.totalSessions,
      avgQuality: (inMemory.summary.avgOverallQuality + persistent.averageQuality) / 2,
      totalCost: inMemory.summary.totalCost + persistent.totalCost,
      dataSource: 'combined'
    };
  }
}

/**
 * Create persistent quality tracker
 */
export function createPersistentQualityTracker(config: Partial<PersistentQualityTrackerConfig> & { logger: Logger }): PersistentQualityTracker {
  const defaultConfig: PersistentQualityTrackerConfig = {
    enablePersistence: true,
    enableInMemory: true,
    syncInterval: 30000, // 30 seconds
    ...config
  };

  return new PersistentQualityTracker(defaultConfig);
}