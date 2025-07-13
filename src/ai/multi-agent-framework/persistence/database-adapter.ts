/**
 * @fileOverview Database adapter for quality tracking persistence
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AgentMetrics, SystemMetrics } from '../core/types';

export interface QualitySession {
  id: string;
  userId: string;
  agentId: string;
  requestType: string;
  timestamp: Date;
  processingTime: number;
  success: boolean;
  qualityScore?: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  metadata?: Record<string, any>;
}

export interface ExperimentResult {
  id: string;
  experimentId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  metrics: {
    qualityScore: number;
    processingTime: number;
    userSatisfaction?: number;
    taskCompletion: boolean;
    tokenUsage: number;
    cost: number;
  };
  metadata?: Record<string, any>;
}

export interface UserUsage {
  userId: string;
  totalRequests: number;
  successfulRequests: number;
  totalCost: number;
  averageQuality: number;
  lastActivity: Date;
  agentUsage: Record<string, {
    requests: number;
    avgQuality: number;
    totalCost: number;
  }>;
}

export class DatabaseAdapter {
  private readonly COLLECTIONS = {
    QUALITY_SESSIONS: 'quality_sessions',
    EXPERIMENT_RESULTS: 'experiment_results',
    USER_USAGE: 'user_usage',
    AGENT_METRICS: 'agent_metrics',
    SYSTEM_METRICS: 'system_metrics'
  };

  /**
   * Save quality session data
   */
  async saveQualitySession(session: QualitySession): Promise<void> {
    try {
      const sessionDoc = {
        ...session,
        timestamp: Timestamp.fromDate(session.timestamp)
      };

      await addDoc(collection(db, this.COLLECTIONS.QUALITY_SESSIONS), sessionDoc);
      
      // Update user usage stats
      await this.updateUserUsage(session);
      
    } catch (error) {
      console.error('Failed to save quality session:', error);
      throw new Error(`Database save failed: ${error}`);
    }
  }

  /**
   * Get quality sessions for analysis
   */
  async getQualitySessions(filters: {
    userId?: string;
    agentId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<QualitySession[]> {
    try {
      let q = collection(db, this.COLLECTIONS.QUALITY_SESSIONS);
      
      const constraints = [];
      
      if (filters.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }
      
      if (filters.agentId) {
        constraints.push(where('agentId', '==', filters.agentId));
      }
      
      if (filters.startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
      }
      
      if (filters.endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
      }
      
      constraints.push(orderBy('timestamp', 'desc'));
      
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }
      
      const querySnapshot = await getDocs(query(q, ...constraints));
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as QualitySession[];
      
    } catch (error) {
      console.error('Failed to get quality sessions:', error);
      throw new Error(`Database query failed: ${error}`);
    }
  }

  /**
   * Save experiment result
   */
  async saveExperimentResult(result: ExperimentResult): Promise<void> {
    try {
      const resultDoc = {
        ...result,
        timestamp: Timestamp.fromDate(result.timestamp)
      };

      await addDoc(collection(db, this.COLLECTIONS.EXPERIMENT_RESULTS), resultDoc);
      
    } catch (error) {
      console.error('Failed to save experiment result:', error);
      throw new Error(`Database save failed: ${error}`);
    }
  }

  /**
   * Get experiment results for analysis
   */
  async getExperimentResults(experimentId: string): Promise<ExperimentResult[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.EXPERIMENT_RESULTS),
        where('experimentId', '==', experimentId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as ExperimentResult[];
      
    } catch (error) {
      console.error('Failed to get experiment results:', error);
      throw new Error(`Database query failed: ${error}`);
    }
  }

  /**
   * Update user usage statistics
   */
  private async updateUserUsage(session: QualitySession): Promise<void> {
    try {
      const userUsageRef = doc(db, this.COLLECTIONS.USER_USAGE, session.userId);
      const userUsageDoc = await getDoc(userUsageRef);
      
      let userUsage: UserUsage;
      
      if (userUsageDoc.exists()) {
        userUsage = userUsageDoc.data() as UserUsage;
        
        // Update totals
        userUsage.totalRequests++;
        if (session.success) {
          userUsage.successfulRequests++;
        }
        userUsage.totalCost += session.cost;
        userUsage.lastActivity = session.timestamp;
        
        // Update average quality (running average)
        if (session.qualityScore) {
          const totalQuality = userUsage.averageQuality * (userUsage.totalRequests - 1);
          userUsage.averageQuality = (totalQuality + session.qualityScore) / userUsage.totalRequests;
        }
        
        // Update agent-specific usage
        if (!userUsage.agentUsage[session.agentId]) {
          userUsage.agentUsage[session.agentId] = {
            requests: 0,
            avgQuality: 0,
            totalCost: 0
          };
        }
        
        const agentUsage = userUsage.agentUsage[session.agentId];
        agentUsage.requests++;
        agentUsage.totalCost += session.cost;
        
        if (session.qualityScore) {
          const totalAgentQuality = agentUsage.avgQuality * (agentUsage.requests - 1);
          agentUsage.avgQuality = (totalAgentQuality + session.qualityScore) / agentUsage.requests;
        }
        
      } else {
        // Create new user usage record
        userUsage = {
          userId: session.userId,
          totalRequests: 1,
          successfulRequests: session.success ? 1 : 0,
          totalCost: session.cost,
          averageQuality: session.qualityScore || 0,
          lastActivity: session.timestamp,
          agentUsage: {
            [session.agentId]: {
              requests: 1,
              avgQuality: session.qualityScore || 0,
              totalCost: session.cost
            }
          }
        };
      }
      
      await setDoc(userUsageRef, {
        ...userUsage,
        lastActivity: Timestamp.fromDate(userUsage.lastActivity)
      });
      
    } catch (error) {
      console.error('Failed to update user usage:', error);
      // Don't throw here as this is a secondary operation
    }
  }

  /**
   * Get user usage statistics
   */
  async getUserUsage(userId: string): Promise<UserUsage | null> {
    try {
      const userUsageRef = doc(db, this.COLLECTIONS.USER_USAGE, userId);
      const userUsageDoc = await getDoc(userUsageRef);
      
      if (userUsageDoc.exists()) {
        const data = userUsageDoc.data();
        return {
          ...data,
          lastActivity: data.lastActivity.toDate()
        } as UserUsage;
      }
      
      return null;
      
    } catch (error) {
      console.error('Failed to get user usage:', error);
      throw new Error(`Database query failed: ${error}`);
    }
  }

  /**
   * Save agent metrics
   */
  async saveAgentMetrics(agentId: string, metrics: AgentMetrics): Promise<void> {
    try {
      const metricsDoc = {
        ...metrics,
        timestamp: Timestamp.now(),
        lastActivity: Timestamp.fromDate(metrics.lastActivity)
      };

      await setDoc(doc(db, this.COLLECTIONS.AGENT_METRICS, agentId), metricsDoc);
      
    } catch (error) {
      console.error('Failed to save agent metrics:', error);
      throw new Error(`Database save failed: ${error}`);
    }
  }

  /**
   * Get agent metrics
   */
  async getAgentMetrics(agentId: string): Promise<AgentMetrics | null> {
    try {
      const metricsRef = doc(db, this.COLLECTIONS.AGENT_METRICS, agentId);
      const metricsDoc = await getDoc(metricsRef);
      
      if (metricsDoc.exists()) {
        const data = metricsDoc.data();
        return {
          ...data,
          lastActivity: data.lastActivity.toDate()
        } as AgentMetrics;
      }
      
      return null;
      
    } catch (error) {
      console.error('Failed to get agent metrics:', error);
      throw new Error(`Database query failed: ${error}`);
    }
  }

  /**
   * Save system metrics
   */
  async saveSystemMetrics(metrics: SystemMetrics): Promise<void> {
    try {
      const metricsDoc = {
        ...metrics,
        timestamp: Timestamp.now()
      };

      await addDoc(collection(db, this.COLLECTIONS.SYSTEM_METRICS), metricsDoc);
      
    } catch (error) {
      console.error('Failed to save system metrics:', error);
      throw new Error(`Database save failed: ${error}`);
    }
  }

  /**
   * Get system metrics history
   */
  async getSystemMetrics(startDate: Date, endDate: Date): Promise<SystemMetrics[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.SYSTEM_METRICS),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as SystemMetrics[];
      
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      throw new Error(`Database query failed: ${error}`);
    }
  }

  /**
   * Get analytics data for dashboard
   */
  async getAnalytics(timeRange: { start: Date; end: Date }, userId?: string): Promise<{
    totalSessions: number;
    successRate: number;
    averageQuality: number;
    totalCost: number;
    agentBreakdown: Record<string, {
      sessions: number;
      avgQuality: number;
      cost: number;
    }>;
    timeSeriesData: Array<{
      date: Date;
      sessions: number;
      quality: number;
      cost: number;
    }>;
  }> {
    try {
      const sessions = await this.getQualitySessions({
        userId,
        startDate: timeRange.start,
        endDate: timeRange.end
      });
      
      const totalSessions = sessions.length;
      const successfulSessions = sessions.filter(s => s.success).length;
      const successRate = totalSessions > 0 ? successfulSessions / totalSessions : 0;
      
      const qualityScores = sessions
        .map(s => s.qualityScore)
        .filter(q => q !== undefined) as number[];
      const averageQuality = qualityScores.length > 0 
        ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length 
        : 0;
      
      const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);
      
      // Agent breakdown
      const agentBreakdown: Record<string, any> = {};
      sessions.forEach(session => {
        if (!agentBreakdown[session.agentId]) {
          agentBreakdown[session.agentId] = {
            sessions: 0,
            totalQuality: 0,
            qualityCount: 0,
            cost: 0
          };
        }
        
        const breakdown = agentBreakdown[session.agentId];
        breakdown.sessions++;
        breakdown.cost += session.cost;
        
        if (session.qualityScore) {
          breakdown.totalQuality += session.qualityScore;
          breakdown.qualityCount++;
        }
      });
      
      // Calculate average quality for each agent
      Object.keys(agentBreakdown).forEach(agentId => {
        const breakdown = agentBreakdown[agentId];
        breakdown.avgQuality = breakdown.qualityCount > 0 
          ? breakdown.totalQuality / breakdown.qualityCount 
          : 0;
        delete breakdown.totalQuality;
        delete breakdown.qualityCount;
      });
      
      // Time series data (daily aggregation)
      const timeSeriesMap = new Map<string, any>();
      sessions.forEach(session => {
        const dateKey = session.timestamp.toISOString().split('T')[0];
        
        if (!timeSeriesMap.has(dateKey)) {
          timeSeriesMap.set(dateKey, {
            date: new Date(dateKey),
            sessions: 0,
            totalQuality: 0,
            qualityCount: 0,
            cost: 0
          });
        }
        
        const dayData = timeSeriesMap.get(dateKey);
        dayData.sessions++;
        dayData.cost += session.cost;
        
        if (session.qualityScore) {
          dayData.totalQuality += session.qualityScore;
          dayData.qualityCount++;
        }
      });
      
      const timeSeriesData = Array.from(timeSeriesMap.values())
        .map(day => ({
          date: day.date,
          sessions: day.sessions,
          quality: day.qualityCount > 0 ? day.totalQuality / day.qualityCount : 0,
          cost: day.cost
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      return {
        totalSessions,
        successRate,
        averageQuality,
        totalCost,
        agentBreakdown,
        timeSeriesData
      };
      
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw new Error(`Analytics query failed: ${error}`);
    }
  }

  /**
   * Clean up old data (for maintenance)
   */
  async cleanupOldData(olderThanDays: number = 90): Promise<{
    sessionsDeleted: number;
    experimentsDeleted: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      // Note: In production, you'd want to use batch operations for better performance
      // This is a simplified version for demonstration
      
      const oldSessions = await this.getQualitySessions({
        endDate: cutoffDate,
        limit: 1000 // Limit for safety
      });
      
      const oldExperiments = await getDocs(query(
        collection(db, this.COLLECTIONS.EXPERIMENT_RESULTS),
        where('timestamp', '<=', Timestamp.fromDate(cutoffDate)),
        limit(1000)
      ));
      
      // In a real implementation, you'd use batch deletes here
      console.log(`Would delete ${oldSessions.length} sessions and ${oldExperiments.size} experiments`);
      
      return {
        sessionsDeleted: oldSessions.length,
        experimentsDeleted: oldExperiments.size
      };
      
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
      throw new Error(`Cleanup failed: ${error}`);
    }
  }
}

// Singleton instance
export const databaseAdapter = new DatabaseAdapter();