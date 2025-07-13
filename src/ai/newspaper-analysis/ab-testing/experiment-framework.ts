/**
 * @fileOverview A/B Testing Framework for Prompt Optimization
 */

import { qualityTracker } from '../metrics/quality-tracker';
import { NewspaperAnalysisInput, NewspaperAnalysisOutput } from '../types';

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  variants: ExperimentVariant[];
  targetMetrics: string[];
  minSampleSize: number;
  confidenceLevel: number; // 0.95 for 95% confidence
  status: 'draft' | 'active' | 'completed' | 'paused';
  segments?: UserSegment[];
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  trafficAllocation: number; // 0-100 percentage
  promptVersion?: string;
  modelConfig?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  agentConfig?: {
    relevanceThreshold?: number;
    difficultyCalibration?: number;
  };
}

export interface UserSegment {
  id: string;
  name: string;
  criteria: {
    userType?: 'premium' | 'free';
    usageLevel?: 'high' | 'medium' | 'low';
    geography?: string[];
    examFocus?: string[];
  };
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  input: NewspaperAnalysisInput;
  output: NewspaperAnalysisOutput;
  metrics: {
    qualityScore: number;
    processingTime: number;
    userSatisfaction?: number;
    taskCompletion: boolean;
    tokenUsage: number;
    cost: number;
  };
  timestamp: Date;
}

/**
 * A/B Testing Framework for systematic prompt optimization
 */
export class ExperimentFramework {
  private experiments: Map<string, ExperimentConfig> = new Map();
  private results: ExperimentResult[] = [];
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> experimentId -> variantId

  /**
   * Create a new experiment
   */
  createExperiment(config: ExperimentConfig): void {
    // Validate experiment configuration
    this.validateExperimentConfig(config);
    
    // Ensure traffic allocation adds up to 100%
    const totalAllocation = config.variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error(`Traffic allocation must sum to 100%, got ${totalAllocation}%`);
    }

    this.experiments.set(config.id, config);
  }

  /**
   * Assign user to experiment variant
   */
  assignUserToVariant(userId: string, experimentId: string): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'active') {
      return null;
    }

    // Check if user already assigned
    const userExperiments = this.userAssignments.get(userId) || new Map();
    if (userExperiments.has(experimentId)) {
      return userExperiments.get(experimentId)!;
    }

    // Check if user meets segment criteria
    if (experiment.segments && !this.userMatchesSegments(userId, experiment.segments)) {
      return null;
    }

    // Assign variant based on hash and traffic allocation
    const variantId = this.assignVariantByHash(userId, experimentId, experiment.variants);
    
    // Store assignment
    userExperiments.set(experimentId, variantId);
    this.userAssignments.set(userId, userExperiments);

    return variantId;
  }

  /**
   * Record experiment result
   */
  recordResult(result: ExperimentResult): void {
    this.results.push(result);

    // Update quality tracker with experiment context
    qualityTracker.trackSession(
      result.sessionId,
      result.userId,
      {
        articleLength: result.input.sourceText.length,
        sourceType: 'text', // Simplified for now
        examType: result.input.examType,
        analysisFocus: result.input.analysisFocus
      },
      result.output,
      result.metrics.processingTime,
      {
        input: 0, // Would need to extract from actual usage
        output: 0,
        total: result.metrics.tokenUsage
      },
      result.metrics.cost
    );
  }

  /**
   * Analyze experiment results
   */
  analyzeExperiment(experimentId: string): ExperimentAnalysis {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const experimentResults = this.results.filter(r => r.experimentId === experimentId);
    
    if (experimentResults.length < experiment.minSampleSize) {
      return {
        experimentId,
        status: 'insufficient_data',
        sampleSize: experimentResults.length,
        requiredSampleSize: experiment.minSampleSize,
        variants: [],
        recommendations: ['Collect more data before analyzing results']
      };
    }

    const variantAnalyses = experiment.variants.map(variant => 
      this.analyzeVariant(variant, experimentResults)
    );

    const statisticalSignificance = this.calculateStatisticalSignificance(
      variantAnalyses,
      experiment.confidenceLevel
    );

    const winningVariant = this.determineWinningVariant(variantAnalyses);
    const recommendations = this.generateRecommendations(variantAnalyses, statisticalSignificance);

    return {
      experimentId,
      status: statisticalSignificance ? 'significant' : 'inconclusive',
      sampleSize: experimentResults.length,
      requiredSampleSize: experiment.minSampleSize,
      variants: variantAnalyses,
      winningVariant,
      statisticalSignificance,
      recommendations
    };
  }

  /**
   * Validate experiment configuration
   */
  private validateExperimentConfig(config: ExperimentConfig): void {
    if (config.variants.length < 2) {
      throw new Error('Experiment must have at least 2 variants');
    }

    if (config.minSampleSize < 30) {
      throw new Error('Minimum sample size must be at least 30');
    }

    if (config.confidenceLevel < 0.8 || config.confidenceLevel > 0.99) {
      throw new Error('Confidence level must be between 0.8 and 0.99');
    }

    if (config.endDate <= config.startDate) {
      throw new Error('End date must be after start date');
    }
  }

  /**
   * Check if user matches segment criteria
   */
  private userMatchesSegments(userId: string, segments: UserSegment[]): boolean {
    // In production, this would check against user profile data
    // For now, return true (all users eligible)
    return true;
  }

  /**
   * Assign variant using consistent hashing
   */
  private assignVariantByHash(userId: string, experimentId: string, variants: ExperimentVariant[]): string {
    // Create deterministic hash based on userId and experimentId
    const hashInput = `${userId}_${experimentId}`;
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to 0-100 range
    const percentage = Math.abs(hash) % 100;
    
    // Find variant based on traffic allocation
    let cumulativeAllocation = 0;
    for (const variant of variants) {
      cumulativeAllocation += variant.trafficAllocation;
      if (percentage < cumulativeAllocation) {
        return variant.id;
      }
    }
    
    // Fallback to last variant
    return variants[variants.length - 1].id;
  }

  /**
   * Analyze variant performance
   */
  private analyzeVariant(variant: ExperimentVariant, allResults: ExperimentResult[]): VariantAnalysis {
    const variantResults = allResults.filter(r => r.variantId === variant.id);
    
    if (variantResults.length === 0) {
      return {
        variantId: variant.id,
        variantName: variant.name,
        sampleSize: 0,
        metrics: {},
        confidenceInterval: {}
      };
    }

    const metrics = {
      avgQualityScore: this.calculateMean(variantResults.map(r => r.metrics.qualityScore)),
      avgProcessingTime: this.calculateMean(variantResults.map(r => r.metrics.processingTime)),
      avgTokenUsage: this.calculateMean(variantResults.map(r => r.metrics.tokenUsage)),
      avgCost: this.calculateMean(variantResults.map(r => r.metrics.cost)),
      taskCompletionRate: variantResults.filter(r => r.metrics.taskCompletion).length / variantResults.length,
      userSatisfactionScore: this.calculateMean(
        variantResults.map(r => r.metrics.userSatisfaction).filter(s => s !== undefined) as number[]
      )
    };

    const confidenceInterval = {
      qualityScore: this.calculateConfidenceInterval(variantResults.map(r => r.metrics.qualityScore)),
      processingTime: this.calculateConfidenceInterval(variantResults.map(r => r.metrics.processingTime)),
      taskCompletionRate: this.calculateProportionConfidenceInterval(
        variantResults.filter(r => r.metrics.taskCompletion).length,
        variantResults.length
      )
    };

    return {
      variantId: variant.id,
      variantName: variant.name,
      sampleSize: variantResults.length,
      metrics,
      confidenceInterval
    };
  }

  /**
   * Calculate statistical significance using t-test
   */
  private calculateStatisticalSignificance(
    variants: VariantAnalysis[],
    confidenceLevel: number
  ): boolean {
    if (variants.length < 2) return false;

    // For simplicity, compare first two variants on quality score
    const variant1 = variants[0];
    const variant2 = variants[1];

    if (variant1.sampleSize < 10 || variant2.sampleSize < 10) {
      return false; // Insufficient data for statistical test
    }

    // Calculate pooled standard error (simplified)
    const se1 = variant1.confidenceInterval.qualityScore?.standardError || 0;
    const se2 = variant2.confidenceInterval.qualityScore?.standardError || 0;
    const pooledSE = Math.sqrt(se1 * se1 + se2 * se2);

    if (pooledSE === 0) return false;

    // Calculate t-statistic
    const meanDiff = Math.abs((variant1.metrics.avgQualityScore || 0) - (variant2.metrics.avgQualityScore || 0));
    const tStat = meanDiff / pooledSE;

    // Critical value for 95% confidence (simplified)
    const criticalValue = 1.96;
    
    return tStat > criticalValue;
  }

  /**
   * Determine winning variant based on primary metric
   */
  private determineWinningVariant(variants: VariantAnalysis[]): string | null {
    const validVariants = variants.filter(v => v.sampleSize > 0);
    if (validVariants.length === 0) return null;

    // Find variant with highest quality score
    const winner = validVariants.reduce((best, current) => 
      (current.metrics.avgQualityScore || 0) > (best.metrics.avgQualityScore || 0) ? current : best
    );

    return winner.variantId;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    variants: VariantAnalysis[],
    isSignificant: boolean
  ): string[] {
    const recommendations: string[] = [];

    if (!isSignificant) {
      recommendations.push('Results are not statistically significant. Continue experiment or increase sample size.');
    } else {
      const bestVariant = variants.reduce((best, current) => 
        (current.metrics.avgQualityScore || 0) > (best.metrics.avgQualityScore || 0) ? current : best
      );
      
      recommendations.push(`Implement ${bestVariant.variantName} as it shows significantly better performance.`);
      
      // Analyze why it performed better
      if (bestVariant.metrics.avgProcessingTime && bestVariant.metrics.avgProcessingTime < 30000) {
        recommendations.push('Winning variant also shows better processing efficiency.');
      }
      
      if (bestVariant.metrics.taskCompletionRate && bestVariant.metrics.taskCompletionRate > 0.9) {
        recommendations.push('High task completion rate indicates good user experience.');
      }
    }

    // General recommendations
    const avgSampleSize = variants.reduce((sum, v) => sum + v.sampleSize, 0) / variants.length;
    if (avgSampleSize < 100) {
      recommendations.push('Consider running experiment longer to collect more data.');
    }

    return recommendations;
  }

  /**
   * Calculate mean of array
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate confidence interval for continuous variables
   */
  private calculateConfidenceInterval(values: number[]): { lower: number; upper: number; standardError: number } {
    if (values.length < 2) {
      return { lower: 0, upper: 0, standardError: 0 };
    }

    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    const standardError = Math.sqrt(variance / values.length);
    const margin = 1.96 * standardError; // 95% confidence

    return {
      lower: mean - margin,
      upper: mean + margin,
      standardError
    };
  }

  /**
   * Calculate confidence interval for proportions
   */
  private calculateProportionConfidenceInterval(successes: number, total: number): { lower: number; upper: number; standardError: number } {
    if (total === 0) {
      return { lower: 0, upper: 0, standardError: 0 };
    }

    const proportion = successes / total;
    const standardError = Math.sqrt((proportion * (1 - proportion)) / total);
    const margin = 1.96 * standardError;

    return {
      lower: Math.max(0, proportion - margin),
      upper: Math.min(1, proportion + margin),
      standardError
    };
  }

  /**
   * Get active experiments for user
   */
  getActiveExperiments(userId: string): Array<{ experimentId: string; variantId: string }> {
    const userExperiments = this.userAssignments.get(userId) || new Map();
    const activeExperiments: Array<{ experimentId: string; variantId: string }> = [];

    for (const [experimentId, variantId] of userExperiments) {
      const experiment = this.experiments.get(experimentId);
      if (experiment && experiment.status === 'active') {
        const now = new Date();
        if (now >= experiment.startDate && now <= experiment.endDate) {
          activeExperiments.push({ experimentId, variantId });
        }
      }
    }

    return activeExperiments;
  }

  /**
   * Export experiment data for external analysis
   */
  exportExperimentData(experimentId: string): string {
    const experiment = this.experiments.get(experimentId);
    const results = this.results.filter(r => r.experimentId === experimentId);

    const exportData = {
      experiment,
      results: results.map(r => ({
        ...r,
        timestamp: r.timestamp.toISOString()
      })),
      analysis: this.analyzeExperiment(experimentId)
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Result interfaces
export interface ExperimentAnalysis {
  experimentId: string;
  status: 'insufficient_data' | 'significant' | 'inconclusive';
  sampleSize: number;
  requiredSampleSize: number;
  variants: VariantAnalysis[];
  winningVariant?: string;
  statisticalSignificance?: boolean;
  recommendations: string[];
}

export interface VariantAnalysis {
  variantId: string;
  variantName: string;
  sampleSize: number;
  metrics: {
    avgQualityScore?: number;
    avgProcessingTime?: number;
    avgTokenUsage?: number;
    avgCost?: number;
    taskCompletionRate?: number;
    userSatisfactionScore?: number;
  };
  confidenceInterval: {
    qualityScore?: { lower: number; upper: number; standardError: number };
    processingTime?: { lower: number; upper: number; standardError: number };
    taskCompletionRate?: { lower: number; upper: number; standardError: number };
  };
}

// Singleton instance
export const experimentFramework = new ExperimentFramework();