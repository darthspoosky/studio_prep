/**
 * @fileOverview Usage examples for the enhanced newspaper analysis system
 */

import { analyzeNewspaperArticleEnhanced, batchAnalyzeArticles } from '../enhanced-flow';
import { experimentFramework, ExperimentConfig } from '../ab-testing/experiment-framework';
import { qualityTracker } from '../metrics/quality-tracker';
import { GOLDEN_DATASET } from '../tests/golden-dataset';
import { NewspaperAnalysisInput } from '../types';

/**
 * Example 1: Basic Enhanced Analysis
 */
export async function exampleBasicAnalysis() {
  const input: NewspaperAnalysisInput = {
    sourceText: `The Supreme Court of India today delivered a landmark judgment on the implementation of the Digital Personal Data Protection Act, 2023. The five-judge bench unanimously held that data localization requirements are constitutional and necessary for protecting citizen privacy.
    
    The court emphasized that in an era of increasing digital surveillance, the state has a positive obligation to protect personal data. The judgment specifically addresses concerns raised by global tech companies about compliance costs and operational challenges.
    
    The decision is expected to have far-reaching implications for digital governance in India and could influence similar legislation in other developing countries. Legal experts note that this judgment strengthens India's position in global data governance discussions.`,
    examType: 'UPSC Civil Services',
    analysisFocus: 'Generate Questions (Mains & Prelims)',
    outputLanguage: 'English'
  };

  console.log('Starting enhanced analysis...');
  
  try {
    const analysisStream = await analyzeNewspaperArticleEnhanced(input, {
      userId: 'demo_user_001',
      enableExperiments: true,
      qualityThreshold: 0.8,
      maxRetries: 2
    });

    console.log('Streaming results:');
    for await (const chunk of analysisStream) {
      console.log(`[${chunk.type}]`, 
        chunk.type === 'progress' ? `${chunk.data.stage}: ${chunk.data.progress}%` :
        chunk.type === 'metadata' ? JSON.stringify(chunk.data, null, 2) :
        chunk.type === 'error' ? chunk.data :
        'Generated content...'
      );
    }
    
    console.log('Analysis completed successfully!');
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

/**
 * Example 2: Setting up A/B Testing Experiment
 */
export async function exampleSetupABTest() {
  console.log('Setting up A/B testing experiment...');

  const experimentConfig: ExperimentConfig = {
    id: 'prompt-optimization-v1',
    name: 'Question Generation Prompt Optimization',
    description: 'Testing different prompt frameworks for better UPSC question generation',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    variants: [
      {
        id: 'control-v1',
        name: 'Original TIERS Framework',
        description: 'Current production prompt using TIERS framework',
        trafficAllocation: 50,
        promptVersion: 'relevance-analysis-v2'
      },
      {
        id: 'treatment-v1',
        name: 'Enhanced RAPID Framework',
        description: 'New RAPID framework focusing on discrimination',
        trafficAllocation: 50,
        promptVersion: 'relevance-analysis-v3'
      }
    ],
    targetMetrics: ['qualityScore', 'processingTime', 'userSatisfaction'],
    minSampleSize: 100,
    confidenceLevel: 0.95,
    status: 'active'
  };

  try {
    experimentFramework.createExperiment(experimentConfig);
    console.log('Experiment created successfully!');
    
    // Test user assignment
    const assignment = experimentFramework.assignUserToVariant('test_user_123', 'prompt-optimization-v1');
    console.log('User assigned to variant:', assignment);
    
  } catch (error) {
    console.error('Failed to setup experiment:', error);
  }
}

/**
 * Example 3: Batch Analysis with Golden Dataset
 */
export async function exampleBatchAnalysis() {
  console.log('Running batch analysis on golden dataset...');

  // Use first 3 samples from golden dataset
  const testArticles = GOLDEN_DATASET.slice(0, 3).map(sample => ({
    id: sample.id,
    input: {
      sourceText: sample.article.text,
      examType: 'UPSC Civil Services',
      analysisFocus: 'Generate Questions (Mains & Prelims)',
      outputLanguage: 'English'
    } as NewspaperAnalysisInput
  }));

  try {
    const results = await batchAnalyzeArticles(testArticles, {
      userId: 'batch_analysis_user',
      enableExperiments: false, // Disable for consistent results
      qualityThreshold: 0.75
    });

    console.log('Batch analysis results:');
    results.forEach(result => {
      console.log(`\n${result.id}:`);
      console.log(`- Quality Score: ${result.metrics.qualityScore?.toFixed(2) || 'N/A'}`);
      console.log(`- Questions Generated: ${(result.result.prelims?.mcqs?.length || 0) + (result.result.mains?.questions?.length || 0)}`);
      console.log(`- Token Usage: ${result.metrics.tokenUsage || 'N/A'}`);
      if (result.metrics.error) {
        console.log(`- Error: ${result.metrics.error}`);
      }
    });

    // Compare with expert annotations
    console.log('\nComparison with Expert Annotations:');
    results.forEach((result, index) => {
      const goldenSample = GOLDEN_DATASET[index];
      const expertQuality = goldenSample.expertAnnotation.qualityScore || 0;
      const systemQuality = result.metrics.qualityScore || 0;
      const difference = Math.abs(expertQuality - systemQuality);
      
      console.log(`${result.id}: Expert=${expertQuality.toFixed(2)}, System=${systemQuality.toFixed(2)}, Diff=${difference.toFixed(2)}`);
    });

  } catch (error) {
    console.error('Batch analysis failed:', error);
  }
}

/**
 * Example 4: Quality Analytics Dashboard
 */
export async function exampleQualityAnalytics() {
  console.log('Generating quality analytics...');

  const timeRange = {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    end: new Date()
  };

  const analytics = qualityTracker.getQualityAnalytics(timeRange);
  
  if (analytics) {
    console.log('\nQuality Analytics Report:');
    console.log('========================');
    console.log(`Total Sessions: ${analytics.summary.totalSessions}`);
    console.log(`Average Quality: ${analytics.summary.avgOverallQuality.toFixed(2)}`);
    console.log(`Average Processing Time: ${(analytics.summary.avgProcessingTime / 1000).toFixed(1)}s`);
    console.log(`Total Cost: ₹${analytics.summary.totalCost.toFixed(2)}`);
    console.log(`Cost per Session: ₹${analytics.summary.costPerSession.toFixed(2)}`);
    
    console.log('\nQuality Distribution:');
    Object.entries(analytics.qualityDistribution).forEach(([category, count]) => {
      const percentage = (count / analytics.summary.totalSessions * 100).toFixed(1);
      console.log(`- ${category}: ${count} (${percentage}%)`);
    });

    console.log('\nRecommendations:');
    analytics.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  } else {
    console.log('No data available for the specified time range.');
  }
}

/**
 * Example 5: Experiment Analysis
 */
export async function exampleExperimentAnalysis() {
  console.log('Analyzing A/B test results...');

  try {
    const analysis = experimentFramework.analyzeExperiment('prompt-optimization-v1');
    
    console.log('\nExperiment Analysis Report:');
    console.log('===========================');
    console.log(`Status: ${analysis.status}`);
    console.log(`Sample Size: ${analysis.sampleSize}/${analysis.requiredSampleSize}`);
    
    if (analysis.winningVariant) {
      console.log(`Winning Variant: ${analysis.winningVariant}`);
    }
    
    console.log('\nVariant Performance:');
    analysis.variants.forEach(variant => {
      console.log(`\n${variant.variantName} (n=${variant.sampleSize}):`);
      console.log(`- Avg Quality Score: ${variant.metrics.avgQualityScore?.toFixed(3) || 'N/A'}`);
      console.log(`- Avg Processing Time: ${(variant.metrics.avgProcessingTime || 0 / 1000).toFixed(1)}s`);
      console.log(`- Task Completion Rate: ${(variant.metrics.taskCompletionRate || 0 * 100).toFixed(1)}%`);
      
      if (variant.confidenceInterval.qualityScore) {
        const ci = variant.confidenceInterval.qualityScore;
        console.log(`- Quality CI (95%): [${ci.lower.toFixed(3)}, ${ci.upper.toFixed(3)}]`);
      }
    });

    console.log('\nRecommendations:');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

  } catch (error) {
    console.error('Experiment analysis failed:', error);
  }
}

/**
 * Example 6: Running Complete Test Suite
 */
export async function exampleCompleteTestSuite() {
  console.log('Running complete example suite...\n');

  console.log('1. Basic Analysis Example');
  console.log('=' .repeat(40));
  await exampleBasicAnalysis();

  console.log('\n\n2. A/B Testing Setup Example');
  console.log('=' .repeat(40));
  await exampleSetupABTest();

  console.log('\n\n3. Batch Analysis Example');
  console.log('=' .repeat(40));
  await exampleBatchAnalysis();

  console.log('\n\n4. Quality Analytics Example');
  console.log('=' .repeat(40));
  await exampleQualityAnalytics();

  console.log('\n\n5. Experiment Analysis Example');
  console.log('=' .repeat(40));
  await exampleExperimentAnalysis();

  console.log('\n\nAll examples completed!');
}

// Export for easy usage
export {
  exampleBasicAnalysis,
  exampleSetupABTest,
  exampleBatchAnalysis,
  exampleQualityAnalytics,
  exampleExperimentAnalysis,
  exampleCompleteTestSuite
};

/**
 * Utility function to run specific example
 */
export async function runExample(exampleName: string) {
  const examples: Record<string, () => Promise<void>> = {
    'basic': exampleBasicAnalysis,
    'abtest': exampleSetupABTest,
    'batch': exampleBatchAnalysis,
    'analytics': exampleQualityAnalytics,
    'experiment': exampleExperimentAnalysis,
    'all': exampleCompleteTestSuite
  };

  const example = examples[exampleName];
  if (example) {
    await example();
  } else {
    console.log('Available examples:', Object.keys(examples).join(', '));
  }
}

// CLI usage: npx tsx examples/usage-examples.ts [example-name]
if (require.main === module) {
  const exampleName = process.argv[2] || 'all';
  runExample(exampleName).catch(console.error);
}