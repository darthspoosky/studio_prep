/**
 * @fileOverview Advanced Relevance Scoring and Trending Analysis System
 */

import OpenAI from 'openai';
import { syllabusMapper, SyllabusNode } from '../syllabus/upsc-syllabus-taxonomy';
import { TaggedContent } from '../tagging/advanced-tagging-system';
import { PreviousYearQuestion } from './previous-year-analyzer';
import { Logger } from '../core/logger';
import { databaseAdapter } from '../persistence/database-adapter';

export interface RelevanceScore {
  overall: number; // 0-100
  components: {
    syllabusAlignment: number; // How well it aligns with current syllabus
    historicalFrequency: number; // Based on past question patterns
    currentEvents: number; // Connection to recent developments
    policyRelevance: number; // Alignment with current policies
    expertPrediction: number; // AI-based prediction
    trendMomentum: number; // Based on trend analysis
  };
  confidence: number; // Confidence in the score
  reasoning: string[];
  lastUpdated: Date;
}

export interface TrendingTopic {
  topicId: string;
  topicName: string;
  status: 'hot' | 'trending' | 'emerging' | 'stable' | 'declining' | 'cold';
  score: number;
  trendData: {
    currentPeriod: number; // Questions in last 2 years
    previousPeriod: number; // Questions in 2 years before that
    growthRate: number; // Percentage change
    volatility: number; // How much it fluctuates
    seasonality: number; // Seasonal patterns
  };
  factors: {
    newsVolume: number; // Volume of related news
    policyActivity: number; // Government policy activity
    examEmphasis: number; // UPSC's emphasis in recent papers
    socialTrends: number; // Social media and public interest
    expertOpinion: number; // Expert recommendations
  };
  predictions: {
    nextYear: number; // Likelihood of appearing next year
    nextTwoYears: number; // Likelihood in next 2 years
    recommendedAction: 'prioritize' | 'study' | 'monitor' | 'review' | 'skip';
  };
  relatedTopics: string[];
  keyInsights: string[];
  studyRecommendations: {
    timeToSpend: number; // Hours recommended
    approach: string;
    resources: string[];
    difficulty: 'basic' | 'intermediate' | 'advanced';
  };
}

export interface TrendAnalysisReport {
  generatedAt: Date;
  analysisWindow: {
    startDate: Date;
    endDate: Date;
    totalQuestions: number;
    sourcesAnalyzed: number;
  };
  topTrends: {
    hotTopics: TrendingTopic[];
    emergingTopics: TrendingTopic[];
    decliningTopics: TrendingTopic[];
    stableTopics: TrendingTopic[];
  };
  sectorialAnalysis: {
    [sector: string]: {
      totalQuestions: number;
      trendDirection: 'up' | 'down' | 'stable';
      avgRelevanceScore: number;
      topTopics: string[];
    };
  };
  surpriseElements: {
    unexpectedTopics: string[];
    shiftingPatterns: string[];
    newConnections: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    studyPlan: {
      highPriority: string[];
      mediumPriority: string[];
      lowPriority: string[];
    };
  };
}

export interface NewsRelevanceData {
  keyword: string;
  volume: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  sources: string[];
  recentArticles: Array<{
    title: string;
    date: Date;
    source: string;
    relevanceScore: number;
  }>;
}

export class RelevanceScoringSystem {
  private openai: OpenAI;
  private logger: Logger;
  private scoreCache: Map<string, { score: RelevanceScore; timestamp: Date }> = new Map();
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(openai: OpenAI, logger: Logger) {
    this.openai = openai;
    this.logger = logger;
  }

  /**
   * Calculate comprehensive relevance score for a topic
   */
  async calculateRelevanceScore(
    topicId: string,
    content?: string,
    context?: {
      examType?: 'prelims' | 'mains';
      timeframe?: 'immediate' | 'short_term' | 'long_term';
      userLevel?: 'beginner' | 'intermediate' | 'advanced';
    }
  ): Promise<RelevanceScore> {
    // Check cache first
    const cached = this.scoreCache.get(topicId);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTTL) {
      return cached.score;
    }

    this.logger.info('Calculating relevance score', { topicId, context });

    try {
      const topicNode = syllabusMapper['taxonomy'].nodes[topicId];
      if (!topicNode) {
        throw new Error(`Topic not found: ${topicId}`);
      }

      // Calculate individual components
      const syllabusAlignment = await this.calculateSyllabusAlignment(topicNode);
      const historicalFrequency = await this.calculateHistoricalFrequency(topicId);
      const currentEvents = await this.calculateCurrentEventsRelevance(topicNode, content);
      const policyRelevance = await this.calculatePolicyRelevance(topicNode);
      const expertPrediction = await this.getExpertPrediction(topicNode, content);
      const trendMomentum = await this.calculateTrendMomentum(topicId);

      // Weight components based on context
      const weights = this.getComponentWeights(context);
      
      const overall = Math.round(
        syllabusAlignment * weights.syllabus +
        historicalFrequency * weights.historical +
        currentEvents * weights.current +
        policyRelevance * weights.policy +
        expertPrediction * weights.expert +
        trendMomentum * weights.trend
      );

      // Calculate confidence based on data availability and consistency
      const confidence = this.calculateConfidence([
        syllabusAlignment, historicalFrequency, currentEvents,
        policyRelevance, expertPrediction, trendMomentum
      ]);

      const reasoning = this.generateReasoningExplanation({
        syllabusAlignment, historicalFrequency, currentEvents,
        policyRelevance, expertPrediction, trendMomentum
      }, topicNode);

      const score: RelevanceScore = {
        overall: Math.max(0, Math.min(100, overall)),
        components: {
          syllabusAlignment,
          historicalFrequency,
          currentEvents,
          policyRelevance,
          expertPrediction,
          trendMomentum
        },
        confidence,
        reasoning,
        lastUpdated: new Date()
      };

      // Cache the result
      this.scoreCache.set(topicId, { score, timestamp: new Date() });

      return score;

    } catch (error) {
      this.logger.error('Failed to calculate relevance score', error as Error, { topicId });
      throw error;
    }
  }

  /**
   * Analyze trending topics across the syllabus
   */
  async analyzeTrendingTopics(
    timeWindow: { startDate: Date; endDate: Date },
    options: {
      includeSubtopics?: boolean;
      minQuestions?: number;
      sectors?: string[];
    } = {}
  ): Promise<TrendingTopic[]> {
    this.logger.info('Analyzing trending topics', { timeWindow, options });

    try {
      // Get all relevant topics
      const topics = Object.values(syllabusMapper['taxonomy'].nodes)
        .filter(node => {
          if (options.sectors && options.sectors.length > 0) {
            const path = syllabusMapper.getTopicPath(node.id);
            const subject = path.find(n => n.level === 'subject');
            return subject && options.sectors.includes(subject.id);
          }
          return true;
        })
        .filter(node => 
          node.level === 'topic' || 
          (options.includeSubtopics && node.level === 'subtopic')
        );

      const trendingTopics: TrendingTopic[] = [];

      for (const topic of topics) {
        const trendData = await this.calculateTopicTrend(topic.id, timeWindow);
        const factors = await this.calculateTrendFactors(topic);
        const predictions = await this.generatePredictions(topic, trendData, factors);
        const studyRecommendations = await this.generateStudyRecommendations(topic, trendData);

        const status = this.determineTopicStatus(trendData, factors);
        const score = this.calculateTrendScore(trendData, factors);

        const trendingTopic: TrendingTopic = {
          topicId: topic.id,
          topicName: topic.name,
          status,
          score,
          trendData,
          factors,
          predictions,
          relatedTopics: await this.findRelatedTopics(topic.id),
          keyInsights: await this.generateKeyInsights(topic, trendData),
          studyRecommendations
        };

        trendingTopics.push(trendingTopic);
      }

      // Sort by trend score
      return trendingTopics.sort((a, b) => b.score - a.score);

    } catch (error) {
      this.logger.error('Failed to analyze trending topics', error as Error);
      throw error;
    }
  }

  /**
   * Generate comprehensive trend analysis report
   */
  async generateTrendReport(
    analysisWindow: { startDate: Date; endDate: Date }
  ): Promise<TrendAnalysisReport> {
    this.logger.info('Generating trend analysis report', { analysisWindow });

    try {
      const allTopics = await this.analyzeTrendingTopics(analysisWindow, { includeSubtopics: true });
      
      // Categorize topics
      const hotTopics = allTopics.filter(t => t.status === 'hot').slice(0, 10);
      const emergingTopics = allTopics.filter(t => t.status === 'emerging').slice(0, 10);
      const decliningTopics = allTopics.filter(t => t.status === 'declining').slice(0, 10);
      const stableTopics = allTopics.filter(t => t.status === 'stable').slice(0, 10);

      // Sectorial analysis
      const sectorialAnalysis = await this.performSectorialAnalysis(allTopics);

      // Identify surprises
      const surpriseElements = await this.identifySurpriseElements(allTopics, analysisWindow);

      // Generate recommendations
      const recommendations = await this.generateReportRecommendations(allTopics);

      const report: TrendAnalysisReport = {
        generatedAt: new Date(),
        analysisWindow: {
          ...analysisWindow,
          totalQuestions: await this.getTotalQuestions(analysisWindow),
          sourcesAnalyzed: await this.getSourcesCount(analysisWindow)
        },
        topTrends: {
          hotTopics,
          emergingTopics,
          decliningTopics,
          stableTopics
        },
        sectorialAnalysis,
        surpriseElements,
        recommendations
      };

      return report;

    } catch (error) {
      this.logger.error('Failed to generate trend report', error as Error);
      throw error;
    }
  }

  /**
   * Real-time relevance update based on current events
   */
  async updateRelevanceFromNews(newsData: NewsRelevanceData[]): Promise<void> {
    this.logger.info('Updating relevance from news data', { newsCount: newsData.length });

    for (const news of newsData) {
      try {
        // Find relevant topics
        const relevantTopics = syllabusMapper.findTopicsByKeywords([news.keyword], 0.3);
        
        for (const { node } of relevantTopics) {
          // Invalidate cache to force recalculation
          this.scoreCache.delete(node.id);
          
          // Store news relevance data for future calculations
          await this.storeNewsRelevance(node.id, news);
        }
      } catch (error) {
        this.logger.error('Failed to update relevance from news', error as Error, { keyword: news.keyword });
      }
    }
  }

  /**
   * Private helper methods
   */

  private async calculateSyllabusAlignment(topic: SyllabusNode): Promise<number> {
    // Direct syllabus topics get full score
    if (topic.level === 'topic' || topic.level === 'subtopic') {
      return topic.weightage || 80;
    }
    return 60; // Broader topics get moderate score
  }

  private async calculateHistoricalFrequency(topicId: string): Promise<number> {
    // This would query historical question data
    // Mock implementation
    const mockFrequency = Math.random() * 20; // 0-20 questions in last 5 years
    return Math.min(mockFrequency * 5, 100); // Scale to 0-100
  }

  private async calculateCurrentEventsRelevance(topic: SyllabusNode, content?: string): Promise<number> {
    if (!content) return 50; // Default score without content

    const prompt = `
    Assess the current events relevance (0-100) of this topic:
    Topic: ${topic.name}
    Context: ${content}
    
    Consider:
    1. Recent news coverage
    2. Government policy focus
    3. International developments
    4. Social relevance
    
    Return only a number (0-100).`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 10
      });

      const score = parseInt(response.choices[0].message.content?.trim() || '50');
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      return 50; // Default score on error
    }
  }

  private async calculatePolicyRelevance(topic: SyllabusNode): Promise<number> {
    // Check government policy focus on this topic
    const policyKeywords = topic.keywords.filter(k => 
      ['policy', 'scheme', 'act', 'bill', 'mission'].some(p => k.includes(p))
    );
    
    return Math.min(policyKeywords.length * 20, 100);
  }

  private async getExpertPrediction(topic: SyllabusNode, content?: string): Promise<number> {
    const prompt = `
    As a UPSC expert, predict the likelihood (0-100) of questions from this topic appearing in upcoming exams:
    
    Topic: ${topic.name}
    Description: ${topic.description}
    ${content ? `Context: ${content}` : ''}
    
    Consider:
    1. Historical patterns
    2. Current relevance
    3. Syllabus importance
    4. UPSC trends
    
    Return only a number (0-100).`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 10
      });

      const score = parseInt(response.choices[0].message.content?.trim() || '60');
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      return 60; // Default score
    }
  }

  private async calculateTrendMomentum(topicId: string): Promise<number> {
    // Calculate momentum based on recent vs historical frequency
    const recentFrequency = Math.random() * 10; // Mock: questions in last 2 years
    const historicalFrequency = Math.random() * 15; // Mock: questions in previous 3 years
    
    if (historicalFrequency === 0) return 50;
    
    const momentum = (recentFrequency / historicalFrequency) * 50;
    return Math.max(0, Math.min(100, momentum));
  }

  private getComponentWeights(context?: any): Record<string, number> {
    // Default weights
    let weights = {
      syllabus: 0.25,
      historical: 0.20,
      current: 0.15,
      policy: 0.15,
      expert: 0.15,
      trend: 0.10
    };

    // Adjust weights based on context
    if (context?.examType === 'prelims') {
      weights.current += 0.05;
      weights.syllabus -= 0.05;
    } else if (context?.examType === 'mains') {
      weights.policy += 0.05;
      weights.current -= 0.05;
    }

    if (context?.timeframe === 'immediate') {
      weights.trend += 0.10;
      weights.historical -= 0.10;
    }

    return weights;
  }

  private calculateConfidence(scores: number[]): number {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    const confidence = Math.max(0, 100 - standardDeviation * 2);
    return Math.round(confidence);
  }

  private generateReasoningExplanation(components: any, topic: SyllabusNode): string[] {
    const reasoning: string[] = [];
    
    if (components.syllabusAlignment > 80) {
      reasoning.push(`High syllabus alignment (${components.syllabusAlignment}) - core UPSC topic`);
    }
    
    if (components.historicalFrequency > 70) {
      reasoning.push(`Frequently asked in previous years (${components.historicalFrequency})`);
    }
    
    if (components.currentEvents > 75) {
      reasoning.push(`High current events relevance (${components.currentEvents})`);
    }
    
    if (components.policyRelevance > 60) {
      reasoning.push(`Significant policy relevance (${components.policyRelevance})`);
    }
    
    if (components.trendMomentum > 70) {
      reasoning.push(`Strong upward trend momentum (${components.trendMomentum})`);
    }

    return reasoning;
  }

  private async calculateTopicTrend(topicId: string, timeWindow: any): Promise<TrendingTopic['trendData']> {
    // Mock implementation - would query actual data
    const currentPeriod = Math.floor(Math.random() * 10);
    const previousPeriod = Math.floor(Math.random() * 10);
    const growthRate = previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0;
    
    return {
      currentPeriod,
      previousPeriod,
      growthRate,
      volatility: Math.random() * 50,
      seasonality: Math.random() * 30
    };
  }

  private async calculateTrendFactors(topic: SyllabusNode): Promise<TrendingTopic['factors']> {
    return {
      newsVolume: Math.floor(Math.random() * 100),
      policyActivity: Math.floor(Math.random() * 100),
      examEmphasis: Math.floor(Math.random() * 100),
      socialTrends: Math.floor(Math.random() * 100),
      expertOpinion: Math.floor(Math.random() * 100)
    };
  }

  private async generatePredictions(
    topic: SyllabusNode,
    trendData: any,
    factors: any
  ): Promise<TrendingTopic['predictions']> {
    const baseScore = (factors.examEmphasis + factors.expertOpinion) / 2;
    const trendAdjustment = trendData.growthRate > 0 ? 10 : -5;
    
    const nextYear = Math.max(0, Math.min(100, baseScore + trendAdjustment));
    const nextTwoYears = Math.max(0, Math.min(100, nextYear * 0.8));
    
    let recommendedAction: TrendingTopic['predictions']['recommendedAction'] = 'study';
    if (nextYear > 80) recommendedAction = 'prioritize';
    else if (nextYear < 30) recommendedAction = 'monitor';
    else if (nextYear < 15) recommendedAction = 'skip';

    return {
      nextYear,
      nextTwoYears,
      recommendedAction
    };
  }

  private async generateStudyRecommendations(
    topic: SyllabusNode,
    trendData: any
  ): Promise<TrendingTopic['studyRecommendations']> {
    const timeToSpend = Math.max(2, Math.min(20, topic.weightage / 5));
    
    return {
      timeToSpend,
      approach: trendData.growthRate > 50 ? 'intensive' : 'moderate',
      resources: [`NCERT ${topic.name}`, `Standard Reference Books`, `Current Affairs`],
      difficulty: topic.difficulty as any || 'intermediate'
    };
  }

  private determineTopicStatus(trendData: any, factors: any): TrendingTopic['status'] {
    const combinedScore = (
      factors.newsVolume * 0.2 +
      factors.policyActivity * 0.2 +
      factors.examEmphasis * 0.3 +
      factors.socialTrends * 0.1 +
      factors.expertOpinion * 0.2
    );

    if (combinedScore > 85 && trendData.growthRate > 50) return 'hot';
    if (combinedScore > 70 && trendData.growthRate > 20) return 'trending';
    if (combinedScore > 50 && trendData.growthRate > 0) return 'emerging';
    if (trendData.growthRate < -20) return 'declining';
    if (combinedScore < 30) return 'cold';
    return 'stable';
  }

  private calculateTrendScore(trendData: any, factors: any): number {
    return Math.round(
      (factors.newsVolume + factors.policyActivity + factors.examEmphasis + 
       factors.socialTrends + factors.expertOpinion) / 5 +
      Math.max(-20, Math.min(20, trendData.growthRate))
    );
  }

  private async findRelatedTopics(topicId: string): Promise<string[]> {
    const topic = syllabusMapper['taxonomy'].nodes[topicId];
    if (!topic) return [];
    
    // Find topics with similar keywords
    const relatedTopics = syllabusMapper.findTopicsByKeywords(topic.keywords.slice(0, 3), 0.4);
    return relatedTopics.slice(1, 6).map(t => t.node.id); // Exclude self, get top 5
  }

  private async generateKeyInsights(topic: SyllabusNode, trendData: any): Promise<string[]> {
    const insights: string[] = [];
    
    if (trendData.growthRate > 30) {
      insights.push(`Rapidly growing topic with ${trendData.growthRate.toFixed(1)}% increase`);
    }
    
    if (topic.trends.recentTrend === 'increasing') {
      insights.push(`Consistent upward trend in UPSC focus`);
    }
    
    insights.push(`${topic.trends.frequency} questions asked in recent years`);
    
    return insights;
  }

  private async performSectorialAnalysis(topics: TrendingTopic[]): Promise<TrendAnalysisReport['sectorialAnalysis']> {
    const analysis: TrendAnalysisReport['sectorialAnalysis'] = {};
    
    // Group by subjects
    const subjectGroups = new Map<string, TrendingTopic[]>();
    
    topics.forEach(topic => {
      const path = syllabusMapper.getTopicPath(topic.topicId);
      const subject = path.find(node => node.level === 'subject');
      if (subject) {
        if (!subjectGroups.has(subject.id)) {
          subjectGroups.set(subject.id, []);
        }
        subjectGroups.get(subject.id)!.push(topic);
      }
    });

    subjectGroups.forEach((topicsInSubject, subjectId) => {
      const avgScore = topicsInSubject.reduce((sum, t) => sum + t.score, 0) / topicsInSubject.length;
      const avgGrowth = topicsInSubject.reduce((sum, t) => sum + t.trendData.growthRate, 0) / topicsInSubject.length;
      
      analysis[subjectId] = {
        totalQuestions: topicsInSubject.length,
        trendDirection: avgGrowth > 10 ? 'up' : avgGrowth < -10 ? 'down' : 'stable',
        avgRelevanceScore: avgScore,
        topTopics: topicsInSubject.slice(0, 5).map(t => t.topicName)
      };
    });

    return analysis;
  }

  private async identifySurpriseElements(topics: TrendingTopic[], timeWindow: any): Promise<TrendAnalysisReport['surpriseElements']> {
    const unexpectedTopics = topics
      .filter(t => t.status === 'emerging' && t.trendData.growthRate > 100)
      .map(t => t.topicName);

    return {
      unexpectedTopics,
      shiftingPatterns: ['More technology-focused questions', 'Increased policy analysis'],
      newConnections: ['Environment-Economy linkages', 'Digital governance themes']
    };
  }

  private async generateReportRecommendations(topics: TrendingTopic[]): Promise<TrendAnalysisReport['recommendations']> {
    const hotTopics = topics.filter(t => t.status === 'hot').map(t => t.topicName);
    const emergingTopics = topics.filter(t => t.status === 'emerging').map(t => t.topicName);
    
    return {
      immediate: [`Focus on ${hotTopics.slice(0, 3).join(', ')}`, 'Update current affairs notes'],
      shortTerm: [`Study ${emergingTopics.slice(0, 3).join(', ')}`, 'Practice application-based questions'],
      longTerm: ['Build conceptual understanding', 'Integrate subjects for comprehensive view'],
      studyPlan: {
        highPriority: hotTopics.slice(0, 5),
        mediumPriority: emergingTopics.slice(0, 5),
        lowPriority: topics.filter(t => t.status === 'stable').slice(0, 5).map(t => t.topicName)
      }
    };
  }

  private async storeNewsRelevance(topicId: string, newsData: NewsRelevanceData): Promise<void> {
    // Store news relevance data for future use
    this.logger.debug('Storing news relevance', { topicId, keyword: newsData.keyword });
  }

  private async getTotalQuestions(timeWindow: any): Promise<number> {
    // Mock implementation
    return 500;
  }

  private async getSourcesCount(timeWindow: any): Promise<number> {
    // Mock implementation
    return 15;
  }
}

// Export singleton instance
export const relevanceScoringSystem = new RelevanceScoringSystem(
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' }),
  console as any
);