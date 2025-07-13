/**
 * @fileOverview Newspaper Analysis Agent using the multi-agent framework
 */

import OpenAI from 'openai';
import { z } from 'zod';
import {
  BaseRequest,
  BaseResponse,
  ExecutionContext,
  AgentCategory,
  AgentStatus,
  NewspaperAnalysisRequest,
  NewspaperAnalysisRequestSchema,
  NewspaperAnalysisResponse,
  NewspaperAnalysisResponseSchema
} from '../core/types';
import { BaseAgent, createCapability } from '../core/base-agent';
import { Logger } from '../core/logger';

// Internal schemas for processing
const RelevanceAnalysisSchema = z.object({
  isRelevant: z.boolean(),
  relevanceScore: z.number().min(0).max(1),
  syllabusTopic: z.string().nullable(),
  reasoning: z.string(),
  confidenceScore: z.number().min(0).max(1),
  timelineRelevant: z.boolean(),
  examUtility: z.number().min(0).max(1),
  subjectAreas: z.array(z.string())
});

const QuestionGenerationSchema = z.object({
  questions: z.array(z.object({
    type: z.enum(['prelims', 'mains']),
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
    difficulty: z.number().min(1).max(10),
    explanation: z.string().optional(),
    syllabusTopic: z.string().optional(),
    upscPattern: z.boolean().optional()
  })),
  summary: z.string(),
  keyEntities: z.array(z.object({
    name: z.string(),
    type: z.string(),
    importance: z.number().min(0).max(1)
  }))
});

export class NewspaperAnalysisAgent extends BaseAgent {
  constructor(config: { openai: OpenAI; logger: Logger }) {
    const metadata = {
      id: 'newspaper_analysis_agent',
      name: 'Newspaper Analysis Agent',
      description: 'Analyzes newspaper articles for UPSC exam preparation',
      version: '2.0.0',
      category: AgentCategory.CONTENT_ANALYSIS,
      capabilities: [
        createCapability(
          'newspaper_analysis',
          'Analyze newspaper articles and generate UPSC-style questions',
          NewspaperAnalysisRequestSchema,
          NewspaperAnalysisResponseSchema,
          0.95,
          [
            {
              input: {
                type: 'newspaper_analysis',
                data: {
                  sourceText: 'Sample article about government policy...',
                  analysisType: 'comprehensive',
                  examType: 'UPSC Civil Services'
                }
              },
              output: {
                success: true,
                data: {
                  summary: 'Article summary...',
                  relevanceScore: 0.9,
                  questions: []
                }
              }
            }
          ]
        )
      ],
      resourceRequirements: {
        maxTokens: 8000,
        estimatedLatency: 15000,
        memoryUsage: 512,
        costPerRequest: 0.05
      },
      status: AgentStatus.ACTIVE
    };

    super(metadata, config);
  }

  async execute(request: BaseRequest, context: ExecutionContext): Promise<BaseResponse> {
    const newspaperRequest = request as NewspaperAnalysisRequest;
    const startTime = Date.now();

    this.logger.agentInfo(
      this.metadata.id,
      'Starting newspaper analysis',
      {
        textLength: newspaperRequest.data.sourceText.length,
        analysisType: newspaperRequest.data.analysisType,
        examType: newspaperRequest.data.examType
      },
      request.id
    );

    try {
      // Step 1: Analyze relevance and extract basic info
      const relevanceResult = await this.analyzeRelevance(newspaperRequest);
      
      if (!relevanceResult.isRelevant || relevanceResult.relevanceScore < 0.6) {
        return this.createResponse(
          request,
          {
            summary: 'Article not suitable for UPSC preparation',
            relevanceScore: relevanceResult.relevanceScore,
            questions: [],
            keyEntities: [],
            syllabusTopic: null,
            tags: []
          },
          Date.now() - startTime
        );
      }

      // Step 2: Generate comprehensive analysis based on type
      let analysisResult;
      
      switch (newspaperRequest.data.analysisType) {
        case 'comprehensive':
          analysisResult = await this.comprehensiveAnalysis(newspaperRequest, relevanceResult);
          break;
        case 'questions':
          analysisResult = await this.generateQuestions(newspaperRequest, relevanceResult);
          break;
        case 'summary':
          analysisResult = await this.generateSummary(newspaperRequest, relevanceResult);
          break;
        case 'critical':
          analysisResult = await this.criticalAnalysis(newspaperRequest, relevanceResult);
          break;
        default:
          analysisResult = await this.comprehensiveAnalysis(newspaperRequest, relevanceResult);
      }

      const processingTime = Date.now() - startTime;

      this.logger.agentInfo(
        this.metadata.id,
        'Newspaper analysis completed',
        {
          relevanceScore: relevanceResult.relevanceScore,
          questionsGenerated: analysisResult.questions?.length || 0,
          processingTime
        },
        request.id
      );

      return this.createResponse(
        request,
        {
          ...analysisResult,
          relevanceScore: relevanceResult.relevanceScore,
          syllabusTopic: relevanceResult.syllabusTopic,
          tags: relevanceResult.subjectAreas
        },
        processingTime,
        {
          tokenUsage: 0, // Would track actual usage
          analysisType: newspaperRequest.data.analysisType,
          confidence: relevanceResult.confidenceScore
        }
      );

    } catch (error) {
      this.logger.agentError(
        this.metadata.id,
        'Newspaper analysis failed',
        error instanceof Error ? error : new Error(String(error)),
        { requestId: request.id }
      );
      throw error;
    }
  }

  /**
   * Analyze article relevance for UPSC
   */
  private async analyzeRelevance(request: NewspaperAnalysisRequest): Promise<z.infer<typeof RelevanceAnalysisSchema>> {
    const response = await this.callOpenAI([
      {
        role: 'system',
        content: `You are a Senior UPSC Faculty with 15+ years of experience. Analyze the provided newspaper article for UPSC relevance using the TIERS framework:

**T - TEMPORAL RELEVANCE** (25%)
- Recent developments (last 18 months) score higher
- Government priority areas get bonus points
- Recurring themes are valuable

**I - INSTITUTIONAL COMPLEXITY** (25%)
- Multi-stakeholder issues (Centre-State, India-World)
- Constitutional/legal dimensions
- Governance challenges

**E - EXAMINATION UTILITY** (25%)
- Can generate good Prelims MCQs?
- Can create analytical Mains questions?
- Tests static+current knowledge integration?

**R - REFERENCE PRECEDENT** (15%)
- Similar topics in past UPSC papers
- Alignment with question patterns

**S - SYLLABUS MAPPING** (10%)
- Direct syllabus relevance
- Cross-cutting themes

Respond with JSON containing:
- isRelevant: boolean
- relevanceScore: 0-1 (weighted TIERS score)
- syllabusTopic: most specific topic or null
- reasoning: brief explanation
- confidenceScore: 0-1
- timelineRelevant: boolean (last 18 months)
- examUtility: 0-1 (question generation potential)
- subjectAreas: array of relevant subjects`
      },
      {
        role: 'user',
        content: `Analyze this article for UPSC relevance:

${request.data.sourceText.substring(0, 3000)}

Exam Type: ${request.data.examType}
Output Language: ${request.data.outputLanguage}`
      }
    ], {
      responseFormat: { type: 'json_object' },
      temperature: 0.1,
      maxTokens: 1000
    });

    return this.parseJSONResponse(response.content, RelevanceAnalysisSchema);
  }

  /**
   * Comprehensive analysis including questions, summary, and key insights
   */
  private async comprehensiveAnalysis(
    request: NewspaperAnalysisRequest,
    relevance: z.infer<typeof RelevanceAnalysisSchema>
  ): Promise<any> {
    const response = await this.callOpenAI([
      {
        role: 'system',
        content: `You are an expert UPSC question setter and educator. Provide comprehensive analysis of the article including:

1. **SUMMARY** (2-3 sentences): Clean, factual summary
2. **PRELIMS QUESTIONS** (3-5 MCQs): 
   - Follow exact UPSC patterns (multiple-statement, assertion-reason, matching pairs)
   - Options in format: "(a) 1 only", "(b) 1 and 2 only", etc.
   - Difficulty 7-9 range
   - Detailed explanations

3. **MAINS QUESTIONS** (2-3 questions):
   - Use proper directives: "Critically analyze", "Discuss", "Examine"
   - Include word limits (150/250 words)
   - Provide structured guidance

4. **KEY ENTITIES**: Important names, organizations, policies mentioned

Respond in JSON format. Use ${request.data.outputLanguage} language.

CRITICAL: Follow authentic UPSC question patterns exactly.`
      },
      {
        role: 'user',
        content: `Article: ${request.data.sourceText}

Syllabus Topic: ${relevance.syllabusTopic}
Subject Areas: ${relevance.subjectAreas.join(', ')}
Relevance Score: ${relevance.relevanceScore}`
      }
    ], {
      responseFormat: { type: 'json_object' },
      temperature: 0.3,
      maxTokens: 3000
    });

    return this.parseJSONResponse(response.content, QuestionGenerationSchema);
  }

  /**
   * Generate focused questions
   */
  private async generateQuestions(
    request: NewspaperAnalysisRequest,
    relevance: z.infer<typeof RelevanceAnalysisSchema>
  ): Promise<any> {
    const response = await this.callOpenAI([
      {
        role: 'system',
        content: `You are an expert UPSC question generator. Focus ONLY on creating high-quality, exam-standard questions from the article.

**PRELIMS MCQs (5-7 questions)**:
- Multiple Statement: "Which of the following statements is/are correct?" with numbered statements
- Assertion-Reason: "Statement-I" and "Statement-II" format with standard 4 options
- Matching Pairs: "How many pairs are correctly matched?" with numerical options
- Direct Questions: Single best answer format

**MAINS QUESTIONS (3-4 questions)**:
- Use analytical directives: "Critically analyze", "Discuss", "Examine"
- Include specific word limits
- Ensure questions test application, not just recall

Each question must have:
- Exact UPSC pattern compliance
- Difficulty rating (1-10)
- Detailed explanation
- Syllabus topic mapping

Output in ${request.data.outputLanguage}.`
      },
      {
        role: 'user',
        content: `Generate UPSC questions from this article:

${request.data.sourceText}

Focus on: ${relevance.syllabusTopic}
Subject Areas: ${relevance.subjectAreas.join(', ')}`
      }
    ], {
      responseFormat: { type: 'json_object' },
      temperature: 0.2,
      maxTokens: 4000
    });

    return this.parseJSONResponse(response.content, QuestionGenerationSchema);
  }

  /**
   * Generate focused summary
   */
  private async generateSummary(
    request: NewspaperAnalysisRequest,
    relevance: z.infer<typeof RelevanceAnalysisSchema>
  ): Promise<any> {
    const response = await this.callOpenAI([
      {
        role: 'system',
        content: `Create a comprehensive summary for UPSC preparation including:

1. **MAIN SUMMARY** (3-4 sentences): Key points and significance
2. **UPSC RELEVANCE**: Why this matters for exam preparation
3. **KEY FACTS**: Important data points, names, dates
4. **SYLLABUS CONNECTION**: How this relates to UPSC syllabus
5. **CURRENT AFFAIRS ANGLE**: Timeline and context

Output in ${request.data.outputLanguage}.`
      },
      {
        role: 'user',
        content: `Summarize this article for UPSC preparation:

${request.data.sourceText}

Topic: ${relevance.syllabusTopic}
Relevance: ${relevance.relevanceScore}`
      }
    ], {
      temperature: 0.2,
      maxTokens: 1500
    });

    return {
      summary: response.content,
      questions: [],
      keyEntities: this.extractEntitiesFromText(request.data.sourceText)
    };
  }

  /**
   * Critical analysis of the article
   */
  private async criticalAnalysis(
    request: NewspaperAnalysisRequest,
    relevance: z.infer<typeof RelevanceAnalysisSchema>
  ): Promise<any> {
    const response = await this.callOpenAI([
      {
        role: 'system',
        content: `Provide critical analysis of the article including:

1. **PERSPECTIVE ANALYSIS**: What viewpoint does the article represent?
2. **BIAS DETECTION**: Any editorial bias or one-sided presentation?
3. **FACT vs OPINION**: Distinguish factual content from opinions
4. **STAKEHOLDER ANALYSIS**: Different perspectives on the issue
5. **IMPLICATIONS**: Short and long-term implications
6. **UPSC ANGLE**: How this connects to broader governance/policy themes

Be objective and analytical. Output in ${request.data.outputLanguage}.`
      },
      {
        role: 'user',
        content: `Critically analyze this article:

${request.data.sourceText}

Topic: ${relevance.syllabusTopic}`
      }
    ], {
      temperature: 0.3,
      maxTokens: 2000
    });

    return {
      summary: response.content,
      questions: [],
      keyEntities: this.extractEntitiesFromText(request.data.sourceText)
    };
  }

  /**
   * Extract key entities from text (simplified version)
   */
  private extractEntitiesFromText(text: string): Array<{name: string; type: string; importance: number}> {
    const entities: Array<{name: string; type: string; importance: number}> = [];
    
    // Simple regex patterns for common entities
    const patterns = [
      { regex: /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, type: 'Person' },
      { regex: /\b(?:Ministry|Department|Commission|Committee|Board)\s+of\s+[A-Z][a-z\s]+/g, type: 'Organization' },
      { regex: /\b(?:Act|Bill|Amendment|Article|Section)\s+\d+/g, type: 'Legal' },
      { regex: /\b\d{4}\b/g, type: 'Year' }
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern.regex) || [];
      for (const match of matches.slice(0, 5)) { // Limit to 5 per type
        entities.push({
          name: match.trim(),
          type: pattern.type,
          importance: 0.7 // Default importance
        });
      }
    }

    return entities.slice(0, 15); // Limit total entities
  }
}