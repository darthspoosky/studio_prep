/**
 * @fileOverview Quiz Generation Agent using the multi-agent framework
 */

import OpenAI from 'openai';
import { z } from 'zod';
import {
  BaseRequest,
  BaseResponse,
  ExecutionContext,
  AgentCategory,
  AgentStatus,
  QuizGenerationRequest,
  QuizGenerationRequestSchema
} from '../core/types';
import { BaseAgent, createCapability } from '../core/base-agent';
import { Logger } from '../core/logger';

// Quiz response schema
const QuizResponseSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    type: z.enum(['mcq', 'true_false', 'short_answer']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    topic: z.string(),
    syllabusTopic: z.string().optional(),
    timeEstimate: z.number(), // seconds
    tags: z.array(z.string()).optional()
  })),
  metadata: z.object({
    totalQuestions: z.number(),
    estimatedTime: z.number(),
    difficultyDistribution: z.object({
      easy: z.number(),
      medium: z.number(),
      hard: z.number()
    }),
    topics: z.array(z.string()),
    qualityScore: z.number().min(0).max(1)
  })
});

export class QuizGenerationAgent extends BaseAgent {
  constructor(config: { openai: OpenAI; logger: Logger }) {
    const metadata = {
      id: 'quiz_generation_agent',
      name: 'Quiz Generation Agent',
      description: 'Generates quiz questions for various topics and difficulty levels',
      version: '1.0.0',
      category: AgentCategory.CONTENT_ANALYSIS,
      capabilities: [
        createCapability(
          'quiz_generation',
          'Generate quiz questions on specified topics',
          QuizGenerationRequestSchema,
          QuizResponseSchema,
          0.9,
          [
            {
              input: {
                type: 'quiz_generation',
                data: {
                  topic: 'Indian Constitution',
                  difficulty: 'medium',
                  questionCount: 10,
                  questionType: 'mcq'
                }
              },
              output: {
                success: true,
                data: {
                  questions: [],
                  metadata: {
                    totalQuestions: 10,
                    estimatedTime: 600,
                    difficultyDistribution: { easy: 2, medium: 6, hard: 2 },
                    topics: ['Indian Constitution'],
                    qualityScore: 0.85
                  }
                }
              }
            }
          ]
        )
      ],
      resourceRequirements: {
        maxTokens: 6000,
        estimatedLatency: 12000,
        memoryUsage: 384,
        costPerRequest: 0.03
      },
      status: AgentStatus.ACTIVE
    };

    super(metadata, config);
  }

  async execute(request: BaseRequest, context: ExecutionContext): Promise<BaseResponse> {
    const quizRequest = request as QuizGenerationRequest;
    const startTime = Date.now();

    this.logger.agentInfo(
      this.metadata.id,
      'Starting quiz generation',
      {
        topic: quizRequest.data.topic,
        difficulty: quizRequest.data.difficulty,
        questionCount: quizRequest.data.questionCount,
        questionType: quizRequest.data.questionType
      },
      request.id
    );

    try {
      // Generate quiz questions based on type
      const questions = await this.generateQuestions(quizRequest);
      
      // Calculate metadata
      const metadata = this.calculateQuizMetadata(questions, quizRequest);
      
      // Validate quality
      const qualityScore = this.assessQuizQuality(questions);
      metadata.qualityScore = qualityScore;

      const processingTime = Date.now() - startTime;

      this.logger.agentInfo(
        this.metadata.id,
        'Quiz generation completed',
        {
          questionsGenerated: questions.length,
          qualityScore,
          processingTime
        },
        request.id
      );

      return this.createResponse(
        request,
        {
          questions,
          metadata
        },
        processingTime,
        {
          tokenUsage: 0, // Would track actual usage
          qualityScore
        }
      );

    } catch (error) {
      this.logger.agentError(
        this.metadata.id,
        'Quiz generation failed',
        error instanceof Error ? error : new Error(String(error)),
        { requestId: request.id }
      );
      throw error;
    }
  }

  /**
   * Generate questions based on request parameters
   */
  private async generateQuestions(request: QuizGenerationRequest): Promise<any[]> {
    const { topic, difficulty, questionCount, questionType, syllabus } = request.data;

    let systemPrompt = '';
    
    switch (questionType) {
      case 'mcq':
        systemPrompt = this.getMCQPrompt(difficulty, syllabus);
        break;
      case 'true_false':
        systemPrompt = this.getTrueFalsePrompt(difficulty);
        break;
      case 'short_answer':
        systemPrompt = this.getShortAnswerPrompt(difficulty);
        break;
    }

    const response = await this.callOpenAI([
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Generate ${questionCount} ${questionType} questions on the topic: "${topic}"

Difficulty level: ${difficulty}
${syllabus ? `Syllabus reference: ${syllabus}` : ''}

Requirements:
- Each question should be unique and well-crafted
- Provide clear, accurate answers
- Include explanations for each answer
- Ensure questions test understanding, not just recall
- Tag questions with relevant subtopics`
      }
    ], {
      responseFormat: { type: 'json_object' },
      temperature: 0.4,
      maxTokens: Math.min(questionCount * 200, 4000)
    });

    const result = this.parseJSONResponse(response.content);
    return this.processGeneratedQuestions(result.questions || [], questionType, difficulty);
  }

  /**
   * Get MCQ generation prompt
   */
  private getMCQPrompt(difficulty: string, syllabus?: string): string {
    const difficultyGuidance = {
      easy: 'Focus on basic facts and direct recall. Options should have clear right/wrong answers.',
      medium: 'Include some analytical thinking. Options may have subtle differences requiring careful consideration.',
      hard: 'Require deep understanding and application. Include tricky distractors and complex scenarios.'
    };

    return `You are an expert quiz creator specializing in multiple-choice questions. Create high-quality MCQs with the following standards:

**Question Structure:**
- Clear, unambiguous question stem
- 4 options labeled (a), (b), (c), (d)
- Only one correct answer
- Plausible but incorrect distractors

**Difficulty Guidelines:**
${difficultyGuidance[difficulty as keyof typeof difficultyGuidance]}

**Requirements:**
- Each question should test specific knowledge/concepts
- Avoid "all of the above" or "none of the above" options
- Include brief explanations for correct answers
- Estimate time needed (30-60 seconds per question)

${syllabus ? `**Syllabus Alignment:**
Ensure questions align with: ${syllabus}` : ''}

Respond with JSON containing an array of questions with this structure:
{
  "questions": [
    {
      "id": "unique_id",
      "question": "question text",
      "options": ["(a) option 1", "(b) option 2", "(c) option 3", "(d) option 4"],
      "correctAnswer": "(a) option 1",
      "explanation": "detailed explanation",
      "topic": "specific subtopic",
      "timeEstimate": 45,
      "tags": ["tag1", "tag2"]
    }
  ]
}`;
  }

  /**
   * Get True/False generation prompt
   */
  private getTrueFalsePrompt(difficulty: string): string {
    return `Create True/False questions that test specific factual knowledge and understanding.

**Guidelines:**
- Statements should be clearly true or false, not ambiguous
- Avoid trivial questions or obvious answers
- Include nuanced statements that require good understanding
- Provide explanations for why the statement is true or false

**Difficulty: ${difficulty}**
- Easy: Basic facts and direct statements
- Medium: Require some analysis or detailed knowledge
- Hard: Complex relationships or subtle distinctions

Respond with JSON format including explanations and time estimates.`;
  }

  /**
   * Get Short Answer generation prompt
   */
  private getShortAnswerPrompt(difficulty: string): string {
    return `Create short answer questions that require 1-3 sentence responses.

**Guidelines:**
- Questions should test understanding, not just recall
- Expected answers should be 20-100 words
- Include model answers as "correctAnswer"
- Provide marking criteria in explanations

**Difficulty: ${difficulty}**
- Easy: Define terms or explain basic concepts
- Medium: Analyze relationships or compare concepts
- Hard: Synthesize information or evaluate scenarios

Respond with JSON format including model answers and marking guidance.`;
  }

  /**
   * Process and standardize generated questions
   */
  private processGeneratedQuestions(questions: any[], questionType: string, difficulty: string): any[] {
    return questions.map((q, index) => ({
      id: q.id || `q_${Date.now()}_${index}`,
      question: q.question,
      type: questionType,
      options: q.options || (questionType === 'true_false' ? ['True', 'False'] : undefined),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || 'No explanation provided',
      difficulty: q.difficulty || difficulty,
      topic: q.topic || 'General',
      syllabusTopic: q.syllabusTopic,
      timeEstimate: q.timeEstimate || this.estimateQuestionTime(questionType, difficulty),
      tags: q.tags || []
    }));
  }

  /**
   * Estimate time needed for a question
   */
  private estimateQuestionTime(questionType: string, difficulty: string): number {
    const baseTime = {
      mcq: 45,
      true_false: 20,
      short_answer: 90
    };

    const difficultyMultiplier = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.3
    };

    return Math.round(
      baseTime[questionType as keyof typeof baseTime] * 
      difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier]
    );
  }

  /**
   * Calculate quiz metadata
   */
  private calculateQuizMetadata(questions: any[], request: QuizGenerationRequest): any {
    const difficultyDistribution = questions.reduce(
      (acc, q) => {
        acc[q.difficulty]++;
        return acc;
      },
      { easy: 0, medium: 0, hard: 0 }
    );

    const topics = [...new Set(questions.map(q => q.topic))];
    const estimatedTime = questions.reduce((sum, q) => sum + q.timeEstimate, 0);

    return {
      totalQuestions: questions.length,
      estimatedTime,
      difficultyDistribution,
      topics,
      qualityScore: 0 // Will be calculated separately
    };
  }

  /**
   * Assess quiz quality
   */
  private assessQuizQuality(questions: any[]): number {
    let qualityScore = 0;
    let criteria = 0;

    // Check if all questions have explanations
    const hasExplanations = questions.every(q => q.explanation && q.explanation.length > 10);
    if (hasExplanations) qualityScore += 0.3;
    criteria++;

    // Check question diversity (different topics)
    const uniqueTopics = new Set(questions.map(q => q.topic)).size;
    const topicDiversityScore = Math.min(uniqueTopics / Math.max(questions.length * 0.3, 1), 1);
    qualityScore += topicDiversityScore * 0.2;
    criteria++;

    // Check time estimates are reasonable
    const hasReasonableTime = questions.every(q => q.timeEstimate >= 10 && q.timeEstimate <= 300);
    if (hasReasonableTime) qualityScore += 0.2;
    criteria++;

    // Check difficulty distribution
    const difficulties = questions.map(q => q.difficulty);
    const hasDifficultyVariation = new Set(difficulties).size > 1 || questions.length <= 3;
    if (hasDifficultyVariation) qualityScore += 0.3;
    criteria++;

    return qualityScore;
  }
}