/**
 * @fileOverview Quality tracking and metrics system for newspaper analysis
 */

import { MCQ, MainsQuestion, NewspaperAnalysisOutput, QualityMetrics } from '../types';
import { validateMCQ, validateMainsQuestion, validateKnowledgeGraph } from '../validators/upsc-validator';

interface AnalysisSession {
  sessionId: string;
  userId: string;
  timestamp: Date;
  input: {
    articleLength: number;
    sourceType: 'url' | 'text';
    examType: string;
    analysisFocus: string;
  };
  output: NewspaperAnalysisOutput;
  metrics: SessionMetrics;
  processingTime: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
}

interface SessionMetrics {
  relevanceScore: number;
  overallQuality: number;
  prelimsMetrics: {
    averageQuality: number;
    patternCompliance: number;
    difficultyDistribution: { easy: number; medium: number; hard: number };
    questionCount: number;
  };
  mainsMetrics: {
    averageQuality: number;
    patternCompliance: number; 
    guidanceQuality: number;
    questionCount: number;
  };
  knowledgeGraphMetrics: {
    quality: number;
    entityCount: number;
    relationshipCount: number;
    entityDiversity: number;
  };
}

/**
 * Quality tracking service
 */
export class QualityTracker {
  private sessions: AnalysisSession[] = [];
  private qualityThresholds = {
    excellent: 0.9,
    good: 0.75,
    acceptable: 0.6,
    poor: 0.4
  };

  /**
   * Track a new analysis session
   */
  async trackSession(
    sessionId: string,
    userId: string,
    input: AnalysisSession['input'],
    output: NewspaperAnalysisOutput,
    processingTime: number,
    tokenUsage: AnalysisSession['tokenUsage'],
    cost: number
  ): Promise<SessionMetrics> {
    
    const metrics = await this.calculateSessionMetrics(output);
    
    const session: AnalysisSession = {
      sessionId,
      userId,
      timestamp: new Date(),
      input,
      output,
      metrics,
      processingTime,
      tokenUsage,
      cost
    };

    this.sessions.push(session);
    
    // Trigger alerts if quality drops below threshold
    await this.checkQualityAlerts(metrics);
    
    return metrics;
  }

  /**
   * Calculate comprehensive quality metrics for a session
   */
  private async calculateSessionMetrics(output: NewspaperAnalysisOutput): Promise<SessionMetrics> {
    // Prelims metrics
    const prelimsQuestions = output.prelims?.mcqs || [];
    const prelimsQualityScores = prelimsQuestions.map(mcq => validateMCQ(mcq));
    
    const prelimsMetrics = {
      averageQuality: this.calculateAverage(prelimsQualityScores.map(m => m.overallScore)),
      patternCompliance: this.calculateAverage(prelimsQualityScores.map(m => m.upscPatternCompliance)),
      difficultyDistribution: this.calculateDifficultyDistribution(prelimsQuestions),
      questionCount: prelimsQuestions.length
    };

    // Mains metrics
    const mainsQuestions = output.mains?.questions || [];
    const mainsQualityScores = mainsQuestions.map(q => validateMainsQuestion(q));
    
    const mainsMetrics = {
      averageQuality: this.calculateAverage(mainsQualityScores.map(m => m.overallScore)),
      patternCompliance: this.calculateAverage(mainsQualityScores.map(m => m.upscPatternCompliance)),
      guidanceQuality: this.calculateAverage(mainsQualityScores.map(m => m.explanationQuality)),
      questionCount: mainsQuestions.length
    };

    // Knowledge graph metrics  
    const kgScore = output.knowledgeGraph ? validateKnowledgeGraph(output.knowledgeGraph) : 0;
    const knowledgeGraphMetrics = {
      quality: kgScore,
      entityCount: output.knowledgeGraph?.nodes?.length || 0,
      relationshipCount: output.knowledgeGraph?.edges?.length || 0,
      entityDiversity: this.calculateEntityDiversity(output.knowledgeGraph)
    };

    // Overall quality calculation
    const overallQuality = this.calculateOverallQuality(
      prelimsMetrics.averageQuality,
      mainsMetrics.averageQuality,
      kgScore,
      prelimsQuestions.length,
      mainsQuestions.length
    );

    return {
      relevanceScore: output.upscRelevanceScore || 0,
      overallQuality,
      prelimsMetrics,
      mainsMetrics,
      knowledgeGraphMetrics
    };
  }

  /**
   * Calculate difficulty distribution for questions
   */
  private calculateDifficultyDistribution(questions: (MCQ | MainsQuestion)[]): { easy: number; medium: number; hard: number } {
    const distribution = { easy: 0, medium: 0, hard: 0 };
    
    questions.forEach(q => {
      if (!q.difficulty) return;
      
      if (q.difficulty <= 6) distribution.easy++;
      else if (q.difficulty <= 8) distribution.medium++;
      else distribution.hard++;
    });

    const total = questions.length;
    return {
      easy: total > 0 ? distribution.easy / total : 0,
      medium: total > 0 ? distribution.medium / total : 0,
      hard: total > 0 ? distribution.hard / total : 0
    };
  }

  /**
   * Calculate entity diversity in knowledge graph
   */
  private calculateEntityDiversity(kg?: any): number {
    if (!kg?.nodes) return 0;
    
    const typeCount = kg.nodes.reduce((acc: any, node: any) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {});
    
    const uniqueTypes = Object.keys(typeCount).length;
    const maxTypes = 7; // Maximum possible entity types
    
    return uniqueTypes / maxTypes;
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallQuality(
    prelimsAvg: number,
    mainsAvg: number,
    kgScore: number,
    prelimsCount: number,
    mainsCount: number
  ): number {
    let totalWeight = 0;
    let weightedSum = 0;

    if (prelimsCount > 0) {
      weightedSum += prelimsAvg * 0.4;
      totalWeight += 0.4;
    }

    if (mainsCount > 0) {
      weightedSum += mainsAvg * 0.4;
      totalWeight += 0.4;
    }

    if (kgScore > 0) {
      weightedSum += kgScore * 0.2;
      totalWeight += 0.2;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate average from array of numbers
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
  }

  /**
   * Check for quality alerts and trigger notifications
   */
  private async checkQualityAlerts(metrics: SessionMetrics): Promise<void> {
    const alerts: string[] = [];

    // Overall quality alert
    if (metrics.overallQuality < this.qualityThresholds.acceptable) {
      alerts.push(`Overall quality below acceptable threshold: ${metrics.overallQuality.toFixed(2)}`);
    }

    // Pattern compliance alerts
    if (metrics.prelimsMetrics.patternCompliance < 0.8) {
      alerts.push(`Prelims pattern compliance low: ${metrics.prelimsMetrics.patternCompliance.toFixed(2)}`);
    }

    if (metrics.mainsMetrics.patternCompliance < 0.8) {
      alerts.push(`Mains pattern compliance low: ${metrics.mainsMetrics.patternCompliance.toFixed(2)}`);
    }

    // Difficulty distribution alerts
    const { easy, medium, hard } = metrics.prelimsMetrics.difficultyDistribution;
    if (easy > 0.4 || hard < 0.1) {
      alerts.push(`Prelims difficulty distribution suboptimal: E:${(easy*100).toFixed(0)}% M:${(medium*100).toFixed(0)}% H:${(hard*100).toFixed(0)}%`);
    }

    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendQualityAlerts(alerts);
    }
  }

  /**
   * Send quality alerts to monitoring system
   */
  private async sendQualityAlerts(alerts: string[]): Promise<void> {
    // In production, this would integrate with monitoring services
    console.warn('Quality Alerts:', alerts);
    
    // Could send to Slack, email, or monitoring dashboard
    // await notificationService.send({
    //   type: 'quality_alert',
    //   message: alerts.join('\n'),
    //   severity: 'warning'
    // });
  }

  /**
   * Get quality analytics for dashboard
   */
  getQualityAnalytics(timeRange: { start: Date; end: Date }) {
    const filteredSessions = this.sessions.filter(s => 
      s.timestamp >= timeRange.start && s.timestamp <= timeRange.end
    );

    if (filteredSessions.length === 0) {
      return null;
    }

    const avgOverallQuality = this.calculateAverage(
      filteredSessions.map(s => s.metrics.overallQuality)
    );

    const avgProcessingTime = this.calculateAverage(
      filteredSessions.map(s => s.processingTime)
    );

    const totalCost = filteredSessions.reduce((sum, s) => sum + s.cost, 0);
    const totalTokens = filteredSessions.reduce((sum, s) => sum + s.tokenUsage.total, 0);

    const qualityDistribution = {
      excellent: filteredSessions.filter(s => s.metrics.overallQuality >= this.qualityThresholds.excellent).length,
      good: filteredSessions.filter(s => s.metrics.overallQuality >= this.qualityThresholds.good && s.metrics.overallQuality < this.qualityThresholds.excellent).length,
      acceptable: filteredSessions.filter(s => s.metrics.overallQuality >= this.qualityThresholds.acceptable && s.metrics.overallQuality < this.qualityThresholds.good).length,
      poor: filteredSessions.filter(s => s.metrics.overallQuality < this.qualityThresholds.acceptable).length
    };

    const subjectAnalysis = this.analyzeSubjectPerformance(filteredSessions);
    const trendAnalysis = this.calculateQualityTrends(filteredSessions);

    return {
      summary: {
        totalSessions: filteredSessions.length,
        avgOverallQuality,
        avgProcessingTime,
        totalCost,
        totalTokens,
        costPerSession: totalCost / filteredSessions.length
      },
      qualityDistribution,
      subjectAnalysis,
      trendAnalysis,
      recommendations: this.generateRecommendations(filteredSessions)
    };
  }

  /**
   * Analyze performance by subject area
   */
  private analyzeSubjectPerformance(sessions: AnalysisSession[]) {
    const subjectMetrics: Record<string, { count: number; avgQuality: number; sessions: AnalysisSession[] }> = {};

    sessions.forEach(session => {
      const tags = session.output.tags || [];
      tags.forEach(tag => {
        if (!subjectMetrics[tag]) {
          subjectMetrics[tag] = { count: 0, avgQuality: 0, sessions: [] };
        }
        subjectMetrics[tag].sessions.push(session);
        subjectMetrics[tag].count++;
      });
    });

    // Calculate average quality per subject
    Object.keys(subjectMetrics).forEach(subject => {
      const subjectSessions = subjectMetrics[subject].sessions;
      subjectMetrics[subject].avgQuality = this.calculateAverage(
        subjectSessions.map(s => s.metrics.overallQuality)
      );
    });

    return subjectMetrics;
  }

  /**
   * Calculate quality trends over time
   */
  private calculateQualityTrends(sessions: AnalysisSession[]) {
    // Sort by timestamp
    const sortedSessions = sessions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Calculate moving average quality (window size: 10)
    const windowSize = Math.min(10, sessions.length);
    const trends: Array<{ date: Date; quality: number; processTime: number }> = [];

    for (let i = windowSize - 1; i < sortedSessions.length; i++) {
      const window = sortedSessions.slice(i - windowSize + 1, i + 1);
      const avgQuality = this.calculateAverage(window.map(s => s.metrics.overallQuality));
      const avgProcessTime = this.calculateAverage(window.map(s => s.processingTime));
      
      trends.push({
        date: window[window.length - 1].timestamp,
        quality: avgQuality,
        processTime: avgProcessTime
      });
    }

    return trends;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(sessions: AnalysisSession[]): string[] {
    const recommendations: string[] = [];
    const recentSessions = sessions.slice(-20); // Last 20 sessions

    const avgQuality = this.calculateAverage(recentSessions.map(s => s.metrics.overallQuality));
    const avgProcessTime = this.calculateAverage(recentSessions.map(s => s.processingTime));
    const avgPatternCompliance = this.calculateAverage(recentSessions.map(s => s.metrics.prelimsMetrics.patternCompliance));

    if (avgQuality < 0.75) {
      recommendations.push("Overall quality below target. Consider prompt optimization or model fine-tuning.");
    }

    if (avgProcessTime > 45000) { // 45 seconds
      recommendations.push("Processing time high. Consider prompt efficiency improvements.");
    }

    if (avgPatternCompliance < 0.85) {
      recommendations.push("UPSC pattern compliance needs improvement. Review question generation prompts.");
    }

    // Check difficulty distribution across recent sessions
    const allPrelims = recentSessions.flatMap(s => s.output.prelims?.mcqs || []);
    const diffDist = this.calculateDifficultyDistribution(allPrelims);
    
    if (diffDist.easy > 0.4) {
      recommendations.push("Too many easy questions. Increase difficulty calibration.");
    }

    if (diffDist.hard < 0.1) {
      recommendations.push("Insufficient challenging questions. Review difficulty assessment criteria.");
    }

    return recommendations;
  }

  /**
   * Export analytics data for external analysis
   */
  exportAnalytics(format: 'json' | 'csv' = 'json') {
    const data = this.sessions.map(session => ({
      sessionId: session.sessionId,
      userId: session.userId,
      timestamp: session.timestamp.toISOString(),
      articleLength: session.input.articleLength,
      sourceType: session.input.sourceType,
      examType: session.input.examType,
      analysisFocus: session.input.analysisFocus,
      overallQuality: session.metrics.overallQuality,
      relevanceScore: session.metrics.relevanceScore,
      prelimsCount: session.metrics.prelimsMetrics.questionCount,
      mainsCount: session.metrics.mainsMetrics.questionCount,
      processingTime: session.processingTime,
      totalTokens: session.tokenUsage.total,
      cost: session.cost,
      tags: session.output.tags?.join(';') || ''
    }));

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Convert to CSV format
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).join(','));
      return [headers, ...rows].join('\n');
    }
  }
}

// Singleton instance
export const qualityTracker = new QualityTracker();