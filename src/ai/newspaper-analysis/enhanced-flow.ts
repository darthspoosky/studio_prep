/**
 * @fileOverview Enhanced Newspaper Analysis Flow using modular architecture
 * Integrates all improvements: validation, testing, metrics, and A/B testing
 */

import { ai } from '@/ai/genkit';
import { 
  NewspaperAnalysisInput, 
  NewspaperAnalysisOutput, 
  NewspaperAnalysisChunk,
  NewspaperAnalysisInputSchema,
  NewspaperAnalysisChunkSchema 
} from './types';
import { analyzeRelevance } from './agents/relevance-agent';
import { selectPromptVersion } from './prompts/relevance-prompts';
import { validateMCQ, validateMainsQuestion, calculateOverallQuality } from './validators/upsc-validator';
import { qualityTracker } from './metrics/quality-tracker';
import { experimentFramework } from './ab-testing/experiment-framework';
import fs from 'fs';
import path from 'path';

interface EnhancedFlowConfig {
  userId: string;
  enableExperiments: boolean;
  qualityThreshold: number;
  maxRetries: number;
}

/**
 * Enhanced Newspaper Analysis Flow with comprehensive improvements
 */
export const enhancedNewspaperAnalysisFlow = ai.defineFlow(
  {
    name: 'enhancedNewspaperAnalysisFlow',
    inputSchema: NewspaperAnalysisInputSchema,
    streamSchema: NewspaperAnalysisChunkSchema,
  },
  async function* (input, config: EnhancedFlowConfig = {
    userId: 'anonymous',
    enableExperiments: true,
    qualityThreshold: 0.7,
    maxRetries: 2
  }) {
    const sessionId = generateSessionId();
    const startTime = Date.now();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    
    try {
      // Step 1: Load syllabus content
      yield { type: 'progress', data: { stage: 'Loading syllabus', progress: 10 } };
      const { prelimsSyllabus, mainsSyllabus } = getSyllabusContent();

      // Step 2: Determine experiment variant (if enabled)
      let experimentVariant = null;
      if (config.enableExperiments) {
        const activeExperiments = experimentFramework.getActiveExperiments(config.userId);
        experimentVariant = activeExperiments.find(exp => exp.experimentId === 'prompt-optimization-v1');
      }

      // Step 3: Select prompt version based on A/B test or configuration
      const promptVersion = experimentVariant?.variantId || selectPromptVersion({
        articleLength: input.sourceText.length,
        userGroup: config.userId
      });

      yield { type: 'progress', data: { stage: 'Analyzing relevance', progress: 25 } };

      // Step 4: Enhanced relevance analysis with retry logic
      let relevanceResult;
      let retryCount = 0;
      
      while (retryCount <= config.maxRetries) {
        try {
          const relevanceResponse = await analyzeRelevance({
            ...input,
            prelimsSyllabus,
            mainsSyllabus,
            articleDate: new Date() // In practice, extract from article
          });
          
          relevanceResult = relevanceResponse.output;
          totalInputTokens += relevanceResponse.metadata?.usage?.inputTokens || 0;
          totalOutputTokens += relevanceResponse.metadata?.usage?.outputTokens || 0;
          break;
        } catch (error) {
          retryCount++;
          if (retryCount > config.maxRetries) {
            throw error;
          }
          console.warn(`Relevance analysis retry ${retryCount}:`, error.message);
        }
      }

      // Step 5: Validate relevance and proceed only if meets threshold
      if (!relevanceResult?.isRelevant || relevanceResult.confidenceScore < 0.6) {
        yield { 
          type: 'error', 
          data: relevanceResult?.reasoning || 'Article not suitable for UPSC question generation'
        };
        return;
      }

      yield { type: 'progress', data: { stage: 'Generating questions', progress: 50 } };

      // Step 6: Generate questions using selected prompt version
      const questionResponse = await generateQuestions({
        ...input,
        prelimsSyllabus,
        mainsSyllabus,
        identifiedSyllabusTopic: relevanceResult.syllabusTopic!,
        promptVersion
      });

      totalInputTokens += questionResponse.metadata?.usage?.inputTokens || 0;
      totalOutputTokens += questionResponse.metadata?.usage?.outputTokens || 0;

      yield { type: 'progress', data: { stage: 'Validating quality', progress: 75 } };

      // Step 7: Quality validation and enhancement
      const validatedOutput = await validateAndEnhanceOutput(
        questionResponse.output,
        input,
        config.qualityThreshold
      );

      yield { type: 'progress', data: { stage: 'Finalizing analysis', progress: 90 } };

      // Step 8: Stream results with quality metrics
      if (validatedOutput.summary) {
        yield { type: 'summary', data: validatedOutput.summary };
      }

      if (validatedOutput.prelims?.mcqs) {
        for (const mcq of validatedOutput.prelims.mcqs) {
          yield { type: 'prelims', data: mcq };
        }
      }

      if (validatedOutput.mains?.questions) {
        for (const question of validatedOutput.mains.questions) {
          yield { type: 'mains', data: question };
        }
      }

      if (validatedOutput.knowledgeGraph) {
        yield { type: 'knowledgeGraph', data: validatedOutput.knowledgeGraph };
      }

      // Step 9: Calculate final metrics and costs
      const processingTime = Date.now() - startTime;
      const totalTokens = totalInputTokens + totalOutputTokens;
      const cost = calculateCost(totalInputTokens, totalOutputTokens);

      const finalMetadata = {
        syllabusTopic: relevanceResult.syllabusTopic,
        qualityScore: validatedOutput.qualityScore,
        tags: validatedOutput.tags,
        questionsCount: (validatedOutput.prelims?.mcqs?.length || 0) + (validatedOutput.mains?.questions?.length || 0),
        totalTokens,
        cost: Math.round(cost * 100) / 100
      };

      yield { type: 'metadata', data: finalMetadata };

      // Step 10: Track quality metrics
      await qualityTracker.trackSession(
        sessionId,
        config.userId,
        {
          articleLength: input.sourceText.length,
          sourceType: 'text',
          examType: input.examType,
          analysisFocus: input.analysisFocus
        },
        { ...validatedOutput, ...finalMetadata },
        processingTime,
        { input: totalInputTokens, output: totalOutputTokens, total: totalTokens },
        cost
      );

      // Step 11: Record A/B test result (if applicable)
      if (experimentVariant) {
        experimentFramework.recordResult({
          experimentId: experimentVariant.experimentId,
          variantId: experimentVariant.variantId,
          userId: config.userId,
          sessionId,
          input,
          output: { ...validatedOutput, ...finalMetadata },
          metrics: {
            qualityScore: validatedOutput.qualityScore || 0,
            processingTime,
            taskCompletion: true,
            tokenUsage: totalTokens,
            cost
          },
          timestamp: new Date()
        });
      }

      yield { type: 'progress', data: { stage: 'Complete', progress: 100 } };

    } catch (error) {
      console.error('Enhanced flow error:', error);
      
      // Record failed experiment result
      if (experimentVariant) {
        experimentFramework.recordResult({
          experimentId: experimentVariant.experimentId,
          variantId: experimentVariant.variantId,
          userId: config.userId,
          sessionId,
          input,
          output: {} as NewspaperAnalysisOutput,
          metrics: {
            qualityScore: 0,
            processingTime: Date.now() - startTime,
            taskCompletion: false,
            tokenUsage: totalInputTokens + totalOutputTokens,
            cost: calculateCost(totalInputTokens, totalOutputTokens)
          },
          timestamp: new Date()
        });
      }

      yield { type: 'error', data: `Analysis failed: ${error.message}` };
    }
  }
);

/**
 * Enhanced question generation with prompt versioning
 */
async function generateQuestions(input: any) {
  // This would use the enhanced question generator agent
  // For now, using placeholder - in practice would import from agents module
  const questionGeneratorAgent = ai.definePrompt({
    name: 'enhancedQuestionGenerator',
    input: { schema: NewspaperAnalysisInputSchema.extend({
      prelimsSyllabus: NewspaperAnalysisInputSchema.shape.sourceText,
      mainsSyllabus: NewspaperAnalysisInputSchema.shape.sourceText,
      identifiedSyllabusTopic: NewspaperAnalysisInputSchema.shape.sourceText,
      promptVersion: NewspaperAnalysisInputSchema.shape.sourceText.optional()
    }) },
    output: { schema: NewspaperAnalysisInputSchema },
    prompt: getQuestionGenerationPrompt(input.promptVersion)
  });

  return await questionGeneratorAgent(input);
}

/**
 * Validate and enhance output quality
 */
async function validateAndEnhanceOutput(
  output: any,
  input: NewspaperAnalysisInput,
  qualityThreshold: number
): Promise<NewspaperAnalysisOutput> {
  // Validate MCQs
  const mcqMetrics = (output.prelims?.mcqs || []).map(validateMCQ);
  const avgMCQQuality = mcqMetrics.length > 0 
    ? mcqMetrics.reduce((sum, m) => sum + m.overallScore, 0) / mcqMetrics.length 
    : 0;

  // Validate Mains questions
  const mainsMetrics = (output.mains?.questions || []).map(validateMainsQuestion);
  const avgMainsQuality = mainsMetrics.length > 0
    ? mainsMetrics.reduce((sum, m) => sum + m.overallScore, 0) / mainsMetrics.length
    : 0;

  // Calculate overall quality
  const overallQuality = calculateOverallQuality(mcqMetrics, mainsMetrics, 0.8);

  // If quality below threshold, attempt enhancement
  if (overallQuality < qualityThreshold) {
    console.warn(`Quality below threshold: ${overallQuality}, attempting enhancement`);
    // In practice, would call enhancement agent or retry with different prompts
  }

  // Add quality scores to questions
  const enhancedMCQs = (output.prelims?.mcqs || []).map((mcq: any, index: number) => ({
    ...mcq,
    qualityScore: mcqMetrics[index]?.overallScore || 0,
    upscPattern: mcqMetrics[index]?.upscPatternCompliance > 0.8
  }));

  const enhancedMains = (output.mains?.questions || []).map((q: any, index: number) => ({
    ...q,
    qualityScore: mainsMetrics[index]?.overallScore || 0
  }));

  return {
    ...output,
    prelims: { mcqs: enhancedMCQs },
    mains: { questions: enhancedMains },
    qualityScore: overallQuality,
    upscRelevanceScore: overallQuality // Simplified
  };
}

/**
 * Get question generation prompt based on version
 */
function getQuestionGenerationPrompt(version?: string): string {
  // In practice, would load from prompts module
  return `Generate high-quality UPSC questions based on the provided article...`;
}

/**
 * Calculate cost based on token usage
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const USD_TO_INR_RATE = 83;
  const INPUT_PRICE_PER_1K_TOKENS_USD = 0.00035;
  const OUTPUT_PRICE_PER_1K_TOKENS_USD = 0.00105;
  
  return ((inputTokens / 1000) * INPUT_PRICE_PER_1K_TOKENS_USD + 
          (outputTokens / 1000) * OUTPUT_PRICE_PER_1K_TOKENS_USD) * USD_TO_INR_RATE;
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load syllabus content (cached)
 */
const syllabusCache: { prelims?: string; mains?: string } = {};
function getSyllabusContent() {
  if (!syllabusCache.prelims || !syllabusCache.mains) {
    syllabusCache.prelims = fs.readFileSync(
      path.join(process.cwd(), 'src/ai/knowledge/upsc-prelims-syllabus.md'), 
      'utf-8'
    );
    syllabusCache.mains = fs.readFileSync(
      path.join(process.cwd(), 'src/ai/knowledge/upsc-mains-syllabus.md'), 
      'utf-8'
    );
  }
  return syllabusCache;
}

/**
 * Public interface for enhanced analysis
 */
export async function analyzeNewspaperArticleEnhanced(
  input: NewspaperAnalysisInput,
  config?: Partial<EnhancedFlowConfig>
) {
  const finalConfig: EnhancedFlowConfig = {
    userId: 'anonymous',
    enableExperiments: true,
    qualityThreshold: 0.7,
    maxRetries: 2,
    ...config
  };

  return enhancedNewspaperAnalysisFlow(input, finalConfig);
}

/**
 * Batch analysis for testing and evaluation
 */
export async function batchAnalyzeArticles(
  articles: Array<{ id: string; input: NewspaperAnalysisInput }>,
  config?: Partial<EnhancedFlowConfig>
): Promise<Array<{ id: string; result: NewspaperAnalysisOutput; metrics: any }>> {
  const results = [];
  
  for (const article of articles) {
    try {
      const analysisStream = await analyzeNewspaperArticleEnhanced(article.input, config);
      
      // Collect all chunks into final result
      const chunks = [];
      for await (const chunk of analysisStream) {
        chunks.push(chunk);
      }
      
      // Reconstruct output from chunks
      const result = reconstructOutputFromChunks(chunks);
      
      results.push({
        id: article.id,
        result,
        metrics: {
          processingTime: 0, // Would calculate from chunks
          qualityScore: result.qualityScore || 0,
          tokenUsage: result.totalTokens || 0
        }
      });
    } catch (error) {
      console.error(`Failed to analyze article ${article.id}:`, error);
      results.push({
        id: article.id,
        result: {} as NewspaperAnalysisOutput,
        metrics: { error: error.message }
      });
    }
  }
  
  return results;
}

/**
 * Reconstruct output from streaming chunks
 */
function reconstructOutputFromChunks(chunks: NewspaperAnalysisChunk[]): NewspaperAnalysisOutput {
  const result: Partial<NewspaperAnalysisOutput> = {
    prelims: { mcqs: [] },
    mains: { questions: [] }
  };

  for (const chunk of chunks) {
    switch (chunk.type) {
      case 'summary':
        result.summary = chunk.data;
        break;
      case 'prelims':
        result.prelims!.mcqs.push(chunk.data);
        break;
      case 'mains':
        result.mains!.questions.push(chunk.data);
        break;
      case 'knowledgeGraph':
        result.knowledgeGraph = chunk.data;
        break;
      case 'metadata':
        Object.assign(result, chunk.data);
        break;
    }
  }

  return result as NewspaperAnalysisOutput;
}