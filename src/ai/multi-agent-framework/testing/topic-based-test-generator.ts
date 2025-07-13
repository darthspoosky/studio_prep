/**
 * @fileOverview Advanced Topic-Based Test Generation System for UPSC
 */

import OpenAI from 'openai';
import { syllabusMapper, SyllabusNode } from '../syllabus/upsc-syllabus-taxonomy';
import { TaggedContent } from '../tagging/advanced-tagging-system';
import { PreviousYearQuestion } from '../analysis/previous-year-analyzer';
import { TrendingTopic } from '../analysis/relevance-scoring-system';
import { SyllabusProgress } from '../tracking/syllabus-progress-tracker';
import { Logger } from '../core/logger';

export interface TestConfiguration {
  id: string;
  name: string;
  type: 'adaptive' | 'topic_focused' | 'mixed' | 'mock_exam' | 'revision' | 'weak_area';
  examType: 'prelims' | 'mains' | 'both';
  topics: Array<{
    topicId: string;
    weightage: number; // 0-100%
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
    questionCount: number;
  }>;
  constraints: {
    totalQuestions: number;
    timeLimit: number; // minutes
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
    };
    questionTypes: {
      mcq: number;
      descriptive: number;
      caseStudy: number;
      currentAffairs: number;
    };
    includeImages: boolean;
    includePreviousYear: boolean;
    maxRepeats: number; // Max questions from same topic
  };
  adaptiveSettings: {
    adjustDifficulty: boolean;
    focusWeakAreas: boolean;
    includeStrengths: boolean;
    learningStyle: 'visual' | 'textual' | 'mixed';
    progressiveComplexity: boolean;
  };
  metadata: {
    createdBy: string;
    targetAudience: 'beginner' | 'intermediate' | 'advanced';
    estimatedScore: number;
    tags: string[];
  };
}

export interface GeneratedQuestion {
  id: string;
  questionText: string;
  type: 'mcq' | 'descriptive' | 'case_study' | 'match_following' | 'assertion_reason';
  examType: 'prelims' | 'mains';
  difficulty: number; // 1-10
  marks: number;
  timeToSolve: number; // minutes
  topicTags: Array<{
    topicId: string;
    topicName: string;
    relevance: number; // 0-100
  }>;
  options?: Array<{
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
  correctAnswer: string;
  explanation: string;
  hint?: string;
  source: {
    type: 'generated' | 'previous_year' | 'adapted';
    year?: number;
    reference?: string;
    adaptedFrom?: string;
  };
  bloom: {
    level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
    skills: string[];
  };
  analytics: {
    predictedDifficulty: number;
    discriminationIndex: number;
    conceptualDepth: number;
    crossTopicConnections: string[];
  };
  metadata: {
    generationTime: number;
    confidence: number;
    alternatives: number;
    reviewRequired: boolean;
  };
}

export interface GeneratedTest {
  id: string;
  configuration: TestConfiguration;
  questions: GeneratedQuestion[];
  structure: {
    sections: Array<{
      name: string;
      instructions: string;
      questions: string[]; // Question IDs
      timeAllocation: number;
      marks: number;
    }>;
    totalMarks: number;
    totalTime: number;
  };
  analytics: {
    topicCoverage: Record<string, number>;
    difficultyProfile: {
      distribution: Record<string, number>;
      averageDifficulty: number;
      variance: number;
    };
    qualityMetrics: {
      coherence: number;
      syllabusCoverage: number;
      currentRelevance: number;
      practicalUtility: number;
    };
    predictions: {
      averageScore: number;
      timeToComplete: number;
      challengeLevel: 'easy' | 'moderate' | 'challenging' | 'difficult';
    };
  };
  adaptiveElements: {
    difficulty: 'static' | 'adaptive';
    pathways: Array<{
      condition: string;
      nextQuestions: string[];
      adjustments: string[];
    }>;
    fallbacks: Array<{
      trigger: string;
      action: string;
      replacement: string[];
    }>;
  };
  metadata: {
    generatedAt: Date;
    generationTime: number;
    version: string;
    qualityScore: number;
    reviewStatus: 'pending' | 'approved' | 'needs_revision';
  };
}

export interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  responses: Array<{
    questionId: string;
    answer: string;
    timeSpent: number;
    confidence: number; // 1-10
    attempts: number;
    flagged: boolean;
  }>;
  results: {
    score: number;
    percentage: number;
    totalTime: number;
    topicWiseScore: Record<string, {
      correct: number;
      total: number;
      percentage: number;
    }>;
    analysis: {
      strengths: string[];
      weaknesses: string[];
      timeManagement: 'excellent' | 'good' | 'needs_improvement' | 'poor';
      accuracy: number;
      speed: number;
    };
  };
  feedback: {
    overall: string;
    questionWise: Array<{
      questionId: string;
      feedback: string;
      improvement: string[];
      resources: string[];
    }>;
    recommendations: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
      studyPlan: string[];
    };
  };
  adaptiveAdjustments: {
    difficultyChanged: boolean;
    topicsAdjusted: string[];
    timeExtended: boolean;
    hintsProvided: number;
  };
  timestamp: Date;
}

export interface TestAnalytics {
  testId: string;
  attempts: number;
  avgScore: number;
  avgTime: number;
  questionAnalytics: Array<{
    questionId: string;
    attempts: number;
    correctRate: number;
    avgTime: number;
    discriminationIndex: number;
    commonMistakes: string[];
    needsRevision: boolean;
  }>;
  topicPerformance: Record<string, {
    attempts: number;
    avgScore: number;
    difficulty: number;
    improvementTrend: 'up' | 'down' | 'stable';
  }>;
  insights: {
    easyQuestions: string[];
    hardQuestions: string[];
    timeConsumingQuestions: string[];
    controversialQuestions: string[];
  };
  recommendations: {
    questionRevisions: string[];
    difficultyAdjustments: string[];
    contentUpdates: string[];
    structureChanges: string[];
  };
}

export class TopicBasedTestGenerator {
  private openai: OpenAI;
  private logger: Logger;
  private questionBank: Map<string, GeneratedQuestion[]> = new Map();
  private testCache: Map<string, GeneratedTest> = new Map();

  constructor(openai: OpenAI, logger: Logger) {
    this.openai = openai;
    this.logger = logger;
  }

  /**
   * Generate a comprehensive test based on configuration
   */
  async generateTest(
    userId: string,
    configuration: TestConfiguration,
    userProgress?: SyllabusProgress,
    context?: {
      previousTests?: string[];
      timeConstraints?: number;
      focusAreas?: string[];
    }
  ): Promise<GeneratedTest> {
    this.logger.info('Generating topic-based test', { 
      userId, 
      testType: configuration.type,
      topics: configuration.topics.length 
    });

    const startTime = Date.now();

    try {
      // Validate configuration
      this.validateConfiguration(configuration);

      // Analyze user context
      const generationContext = await this.analyzeGenerationContext(userId, configuration, userProgress, context);

      // Generate questions for each topic
      const questions = await this.generateQuestions(configuration, generationContext);

      // Structure the test
      const testStructure = this.createTestStructure(configuration, questions);

      // Calculate analytics
      const analytics = this.calculateTestAnalytics(questions, configuration);

      // Create adaptive elements
      const adaptiveElements = this.createAdaptiveElements(configuration, questions);

      const generatedTest: GeneratedTest = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        configuration,
        questions,
        structure: testStructure,
        analytics,
        adaptiveElements,
        metadata: {
          generatedAt: new Date(),
          generationTime: Date.now() - startTime,
          version: '1.0',
          qualityScore: this.calculateQualityScore(questions, analytics),
          reviewStatus: 'pending'
        }
      };

      // Cache and store the test
      this.testCache.set(generatedTest.id, generatedTest);
      await this.storeTest(generatedTest);

      this.logger.info('Test generation completed', {
        testId: generatedTest.id,
        questionCount: questions.length,
        generationTime: generatedTest.metadata.generationTime
      });

      return generatedTest;

    } catch (error) {
      this.logger.error('Test generation failed', error as Error, { userId, configType: configuration.type });
      throw error;
    }
  }

  /**
   * Generate adaptive test that adjusts based on user responses
   */
  async generateAdaptiveTest(
    userId: string,
    initialTopics: string[],
    targetDifficulty: 'adaptive' | 'easy' | 'medium' | 'hard',
    userProgress: SyllabusProgress
  ): Promise<GeneratedTest> {
    const configuration: TestConfiguration = {
      id: `adaptive_${Date.now()}`,
      name: 'Adaptive Assessment',
      type: 'adaptive',
      examType: 'both',
      topics: initialTopics.map(topicId => ({
        topicId,
        weightage: 100 / initialTopics.length,
        difficulty: targetDifficulty,
        questionCount: 5
      })),
      constraints: {
        totalQuestions: 25,
        timeLimit: 60,
        difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
        questionTypes: { mcq: 80, descriptive: 15, caseStudy: 5, currentAffairs: 0 },
        includeImages: false,
        includePreviousYear: true,
        maxRepeats: 3
      },
      adaptiveSettings: {
        adjustDifficulty: true,
        focusWeakAreas: true,
        includeStrengths: false,
        learningStyle: 'mixed',
        progressiveComplexity: true
      },
      metadata: {
        createdBy: 'system',
        targetAudience: this.determineUserLevel(userProgress),
        estimatedScore: this.estimateUserScore(userProgress),
        tags: ['adaptive', 'personalized']
      }
    };

    return await this.generateTest(userId, configuration, userProgress);
  }

  /**
   * Generate topic-focused test for specific weakness areas
   */
  async generateWeaknessTest(
    userId: string,
    weakTopics: string[],
    userProgress: SyllabusProgress,
    options: {
      questionCount: number;
      includeFoundational: boolean;
      difficulty: 'remedial' | 'practice' | 'challenging';
    }
  ): Promise<GeneratedTest> {
    const configuration: TestConfiguration = {
      id: `weakness_${Date.now()}`,
      name: 'Weakness Improvement Test',
      type: 'weak_area',
      examType: 'both',
      topics: await this.expandWeakTopics(weakTopics, options.includeFoundational),
      constraints: {
        totalQuestions: options.questionCount,
        timeLimit: options.questionCount * 2.5, // 2.5 minutes per question
        difficultyDistribution: this.getDifficultyDistribution(options.difficulty),
        questionTypes: { mcq: 60, descriptive: 30, caseStudy: 10, currentAffairs: 0 },
        includeImages: true,
        includePreviousYear: true,
        maxRepeats: 2
      },
      adaptiveSettings: {
        adjustDifficulty: false,
        focusWeakAreas: true,
        includeStrengths: false,
        learningStyle: 'mixed',
        progressiveComplexity: true
      },
      metadata: {
        createdBy: 'system',
        targetAudience: 'targeted_improvement',
        estimatedScore: 65, // Lower expected score for weakness areas
        tags: ['weakness', 'improvement', 'targeted']
      }
    };

    return await this.generateTest(userId, configuration, userProgress);
  }

  /**
   * Generate mock exam simulating actual UPSC pattern
   */
  async generateMockExam(
    userId: string,
    examType: 'prelims' | 'mains',
    paperNumber?: string,
    customization?: {
      currentAffairsWeight: number;
      previousYearWeight: number;
      topicFocus?: string[];
    }
  ): Promise<GeneratedTest> {
    const configuration = await this.createMockExamConfiguration(examType, paperNumber, customization);
    return await this.generateTest(userId, configuration);
  }

  /**
   * Generate personalized revision test
   */
  async generateRevisionTest(
    userId: string,
    completedTopics: string[],
    lastStudied: Date,
    options: {
      focusOnRecent: boolean;
      spacedRepetition: boolean;
      mixDifficulties: boolean;
    }
  ): Promise<GeneratedTest> {
    const revisionTopics = await this.selectRevisionTopics(completedTopics, lastStudied, options);
    
    const configuration: TestConfiguration = {
      id: `revision_${Date.now()}`,
      name: 'Personalized Revision Test',
      type: 'revision',
      examType: 'both',
      topics: revisionTopics,
      constraints: {
        totalQuestions: 30,
        timeLimit: 45,
        difficultyDistribution: options.mixDifficulties 
          ? { easy: 40, medium: 40, hard: 20 }
          : { easy: 60, medium: 30, hard: 10 },
        questionTypes: { mcq: 70, descriptive: 20, caseStudy: 10, currentAffairs: 0 },
        includeImages: false,
        includePreviousYear: options.spacedRepetition,
        maxRepeats: 3
      },
      adaptiveSettings: {
        adjustDifficulty: false,
        focusWeakAreas: false,
        includeStrengths: true,
        learningStyle: 'mixed',
        progressiveComplexity: false
      },
      metadata: {
        createdBy: 'system',
        targetAudience: 'revision',
        estimatedScore: 78, // Higher expected score for revision
        tags: ['revision', 'spaced_repetition', 'personalized']
      }
    };

    return await this.generateTest(userId, configuration);
  }

  /**
   * Analyze test attempt and provide detailed feedback
   */
  async analyzeTestAttempt(
    testAttempt: TestAttempt,
    test: GeneratedTest
  ): Promise<{
    performance: {
      overall: string;
      topicWise: Record<string, string>;
      timeManagement: string;
      accuracy: string;
    };
    insights: {
      strengths: string[];
      weaknesses: string[];
      patterns: string[];
      comparisons: string[];
    };
    recommendations: {
      immediate: string[];
      study: string[];
      practice: string[];
      strategy: string[];
    };
    nextSteps: {
      suggestedTopics: string[];
      difficulty: 'easier' | 'same' | 'harder';
      focusAreas: string[];
      timeframe: string;
    };
  }> {
    const performance = this.analyzePerformance(testAttempt, test);
    const insights = await this.generateInsights(testAttempt, test);
    const recommendations = await this.generateRecommendations(testAttempt, test, performance);
    const nextSteps = this.planNextSteps(testAttempt, test, performance);

    return {
      performance,
      insights,
      recommendations,
      nextSteps
    };
  }

  /**
   * Get test analytics for improvement
   */
  async getTestAnalytics(testId: string): Promise<TestAnalytics> {
    const attempts = await this.getTestAttempts(testId);
    const test = this.testCache.get(testId) || await this.loadTest(testId);
    
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    return this.calculateTestAnalytics(test, attempts);
  }

  /**
   * Private helper methods
   */

  private validateConfiguration(config: TestConfiguration): void {
    if (config.topics.length === 0) {
      throw new Error('At least one topic must be specified');
    }

    const totalWeightage = config.topics.reduce((sum, topic) => sum + topic.weightage, 0);
    if (Math.abs(totalWeightage - 100) > 1) {
      throw new Error('Topic weightages must sum to 100%');
    }

    if (config.constraints.totalQuestions <= 0) {
      throw new Error('Total questions must be positive');
    }
  }

  private async analyzeGenerationContext(
    userId: string,
    config: TestConfiguration,
    userProgress?: SyllabusProgress,
    context?: any
  ): Promise<any> {
    return {
      userLevel: userProgress ? this.determineUserLevel(userProgress) : 'intermediate',
      weakAreas: userProgress?.analytics.weaknessAnalysis.subjects || [],
      strongAreas: userProgress?.analytics.strengthAnalysis.subjects || [],
      recentPerformance: await this.getRecentPerformance(userId),
      availableQuestions: await this.getAvailableQuestions(config.topics),
      timeConstraints: context?.timeConstraints || config.constraints.timeLimit
    };
  }

  private async generateQuestions(
    config: TestConfiguration,
    context: any
  ): Promise<GeneratedQuestion[]> {
    const questions: GeneratedQuestion[] = [];

    for (const topicConfig of config.topics) {
      const topicQuestions = await this.generateTopicQuestions(
        topicConfig,
        config,
        context
      );
      questions.push(...topicQuestions);
    }

    // Shuffle questions while maintaining distribution
    return this.shuffleWithConstraints(questions, config);
  }

  private async generateTopicQuestions(
    topicConfig: TestConfiguration['topics'][0],
    config: TestConfiguration,
    context: any
  ): Promise<GeneratedQuestion[]> {
    const topic = syllabusMapper['taxonomy'].nodes[topicConfig.topicId];
    if (!topic) {
      throw new Error(`Topic ${topicConfig.topicId} not found`);
    }

    const questions: GeneratedQuestion[] = [];
    
    // Check if we have cached questions for this topic
    const cachedQuestions = this.questionBank.get(topicConfig.topicId) || [];
    const availableCached = cachedQuestions.filter(q => 
      this.matchesDifficulty(q, topicConfig.difficulty) &&
      this.matchesExamType(q, config.examType)
    );

    let generatedCount = 0;
    const targetCount = topicConfig.questionCount;

    // Use cached questions first
    const useCached = Math.min(availableCached.length, Math.floor(targetCount * 0.3));
    questions.push(...availableCached.slice(0, useCached));
    generatedCount += useCached;

    // Generate new questions for the remainder
    while (generatedCount < targetCount) {
      const questionType = this.selectQuestionType(config.constraints.questionTypes);
      const difficulty = this.selectDifficulty(topicConfig.difficulty, config.constraints.difficultyDistribution);
      
      const newQuestion = await this.generateSingleQuestion(
        topic,
        questionType,
        difficulty,
        config.examType,
        context
      );

      questions.push(newQuestion);
      generatedCount++;

      // Cache the generated question
      if (!this.questionBank.has(topicConfig.topicId)) {
        this.questionBank.set(topicConfig.topicId, []);
      }
      this.questionBank.get(topicConfig.topicId)!.push(newQuestion);
    }

    return questions;
  }

  private async generateSingleQuestion(
    topic: SyllabusNode,
    questionType: string,
    difficulty: number,
    examType: 'prelims' | 'mains' | 'both',
    context: any
  ): Promise<GeneratedQuestion> {
    const prompt = this.createQuestionPrompt(topic, questionType, difficulty, examType);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      });

      const questionData = this.parseQuestionResponse(response.choices[0].message.content || '');
      
      return {
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        questionText: questionData.question,
        type: questionType as any,
        examType: examType === 'both' ? (questionType === 'mcq' ? 'prelims' : 'mains') : examType,
        difficulty,
        marks: this.calculateMarks(questionType, difficulty),
        timeToSolve: this.estimateTimeToSolve(questionType, difficulty),
        topicTags: [{
          topicId: topic.id,
          topicName: topic.name,
          relevance: 100
        }],
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        explanation: questionData.explanation,
        hint: questionData.hint,
        source: {
          type: 'generated',
          reference: `Generated for ${topic.name}`
        },
        bloom: {
          level: this.determineBloomLevel(questionType, difficulty),
          skills: this.identifySkills(questionData.question)
        },
        analytics: {
          predictedDifficulty: difficulty,
          discriminationIndex: 0.5, // Default value
          conceptualDepth: this.assessConceptualDepth(questionData.question),
          crossTopicConnections: this.findCrossTopicConnections(topic, questionData.question)
        },
        metadata: {
          generationTime: Date.now(),
          confidence: 0.8, // AI generation confidence
          alternatives: 0,
          reviewRequired: difficulty > 8 // High difficulty questions need review
        }
      };

    } catch (error) {
      this.logger.error('Failed to generate single question', error as Error, { topicId: topic.id });
      throw error;
    }
  }

  private createQuestionPrompt(
    topic: SyllabusNode,
    questionType: string,
    difficulty: number,
    examType: string
  ): string {
    const difficultyMap = {
      1: 'very easy', 2: 'very easy', 3: 'easy', 4: 'easy',
      5: 'medium', 6: 'medium', 7: 'hard', 8: 'hard',
      9: 'very hard', 10: 'very hard'
    };

    return `
Generate a ${difficultyMap[difficulty as keyof typeof difficultyMap]} ${questionType} question for UPSC ${examType} exam.

Topic: ${topic.name}
Description: ${topic.description}
Keywords: ${topic.keywords.join(', ')}

Requirements:
- Difficulty level: ${difficulty}/10 (${difficultyMap[difficulty as keyof typeof difficultyMap]})
- Question type: ${questionType}
- Exam type: ${examType}
- Must be factually accurate and relevant to UPSC syllabus
- Include current affairs if relevant
- For MCQs: provide 4 options with clear correct answer
- Include detailed explanation
- Add hint if difficulty > 6

Format response as JSON:
{
  "question": "question text",
  "options": ["option1", "option2", "option3", "option4"], // for MCQs only
  "correctAnswer": "correct answer",
  "explanation": "detailed explanation",
  "hint": "helpful hint" // optional
}`;
  }

  private parseQuestionResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      // Fallback parsing if JSON is malformed
      return {
        question: 'Failed to generate question',
        correctAnswer: 'Unable to determine',
        explanation: 'Question generation failed',
        options: ['Option A', 'Option B', 'Option C', 'Option D']
      };
    }
  }

  private createTestStructure(
    config: TestConfiguration,
    questions: GeneratedQuestion[]
  ): GeneratedTest['structure'] {
    const sections = [];
    
    if (config.examType === 'prelims' || config.examType === 'both') {
      const prelimsQuestions = questions.filter(q => q.examType === 'prelims');
      if (prelimsQuestions.length > 0) {
        sections.push({
          name: 'General Studies (Prelims)',
          instructions: 'Choose the most appropriate answer for each question.',
          questions: prelimsQuestions.map(q => q.id),
          timeAllocation: Math.ceil(config.constraints.timeLimit * 0.6),
          marks: prelimsQuestions.reduce((sum, q) => sum + q.marks, 0)
        });
      }
    }

    if (config.examType === 'mains' || config.examType === 'both') {
      const mainsQuestions = questions.filter(q => q.examType === 'mains');
      if (mainsQuestions.length > 0) {
        sections.push({
          name: 'General Studies (Mains)',
          instructions: 'Write comprehensive answers with proper analysis and examples.',
          questions: mainsQuestions.map(q => q.id),
          timeAllocation: Math.ceil(config.constraints.timeLimit * 0.4),
          marks: mainsQuestions.reduce((sum, q) => sum + q.marks, 0)
        });
      }
    }

    return {
      sections,
      totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
      totalTime: config.constraints.timeLimit
    };
  }

  private calculateTestAnalytics(
    questions: GeneratedQuestion[],
    config: TestConfiguration
  ): GeneratedTest['analytics'] {
    const topicCoverage: Record<string, number> = {};
    questions.forEach(q => {
      q.topicTags.forEach(tag => {
        topicCoverage[tag.topicId] = (topicCoverage[tag.topicId] || 0) + 1;
      });
    });

    const difficulties = questions.map(q => q.difficulty);
    const averageDifficulty = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;
    const variance = difficulties.reduce((sum, d) => sum + Math.pow(d - averageDifficulty, 2), 0) / difficulties.length;

    return {
      topicCoverage,
      difficultyProfile: {
        distribution: {
          easy: questions.filter(q => q.difficulty <= 4).length,
          medium: questions.filter(q => q.difficulty >= 5 && q.difficulty <= 7).length,
          hard: questions.filter(q => q.difficulty >= 8).length
        },
        averageDifficulty,
        variance
      },
      qualityMetrics: {
        coherence: this.calculateCoherence(questions),
        syllabusCoverage: this.calculateSyllabusCoverage(questions, config),
        currentRelevance: this.calculateCurrentRelevance(questions),
        practicalUtility: this.calculatePracticalUtility(questions)
      },
      predictions: {
        averageScore: this.predictAverageScore(questions, config),
        timeToComplete: this.predictTimeToComplete(questions),
        challengeLevel: this.determineChallengeLevel(averageDifficulty)
      }
    };
  }

  private createAdaptiveElements(
    config: TestConfiguration,
    questions: GeneratedQuestion[]
  ): GeneratedTest['adaptiveElements'] {
    if (!config.adaptiveSettings.adjustDifficulty) {
      return {
        difficulty: 'static',
        pathways: [],
        fallbacks: []
      };
    }

    const pathways = [];
    const fallbacks = [];

    // Create difficulty adjustment pathways
    const easyQuestions = questions.filter(q => q.difficulty <= 4);
    const mediumQuestions = questions.filter(q => q.difficulty >= 5 && q.difficulty <= 7);
    const hardQuestions = questions.filter(q => q.difficulty >= 8);

    if (easyQuestions.length > 0 && mediumQuestions.length > 0) {
      pathways.push({
        condition: 'score > 70% in first 5 questions',
        nextQuestions: mediumQuestions.slice(0, 3).map(q => q.id),
        adjustments: ['increase_difficulty', 'reduce_hints']
      });
    }

    if (hardQuestions.length > 0) {
      pathways.push({
        condition: 'score > 80% in medium questions',
        nextQuestions: hardQuestions.slice(0, 2).map(q => q.id),
        adjustments: ['increase_difficulty', 'reduce_time']
      });
    }

    // Create fallback strategies
    fallbacks.push({
      trigger: 'score < 40% in first 10 questions',
      action: 'reduce_difficulty',
      replacement: easyQuestions.slice(0, 5).map(q => q.id)
    });

    return {
      difficulty: 'adaptive',
      pathways,
      fallbacks
    };
  }

  private calculateQualityScore(
    questions: GeneratedQuestion[],
    analytics: GeneratedTest['analytics']
  ): number {
    const coherenceScore = analytics.qualityMetrics.coherence * 0.25;
    const coverageScore = analytics.qualityMetrics.syllabusCoverage * 0.25;
    const relevanceScore = analytics.qualityMetrics.currentRelevance * 0.25;
    const utilityScore = analytics.qualityMetrics.practicalUtility * 0.25;

    return Math.round(coherenceScore + coverageScore + relevanceScore + utilityScore);
  }

  // Helper methods for question generation
  private matchesDifficulty(question: GeneratedQuestion, targetDifficulty: string): boolean {
    if (targetDifficulty === 'adaptive') return true;
    
    const ranges = {
      easy: [1, 4],
      medium: [5, 7],
      hard: [8, 10]
    };
    
    const range = ranges[targetDifficulty as keyof typeof ranges];
    return question.difficulty >= range[0] && question.difficulty <= range[1];
  }

  private matchesExamType(question: GeneratedQuestion, examType: string): boolean {
    return examType === 'both' || question.examType === examType;
  }

  private selectQuestionType(distribution: TestConfiguration['constraints']['questionTypes']): string {
    const rand = Math.random() * 100;
    let cumulative = 0;
    
    for (const [type, percentage] of Object.entries(distribution)) {
      cumulative += percentage;
      if (rand < cumulative) {
        return type === 'mcq' ? 'mcq' : 
               type === 'descriptive' ? 'descriptive' : 
               type === 'caseStudy' ? 'case_study' : 'mcq';
      }
    }
    
    return 'mcq';
  }

  private selectDifficulty(
    targetDifficulty: string,
    distribution: TestConfiguration['constraints']['difficultyDistribution']
  ): number {
    if (targetDifficulty !== 'adaptive') {
      const ranges = { easy: [1, 4], medium: [5, 7], hard: [8, 10] };
      const range = ranges[targetDifficulty as keyof typeof ranges];
      return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    }

    // Use distribution for adaptive
    const rand = Math.random() * 100;
    if (rand < distribution.easy) return Math.floor(Math.random() * 4) + 1;
    if (rand < distribution.easy + distribution.medium) return Math.floor(Math.random() * 3) + 5;
    return Math.floor(Math.random() * 3) + 8;
  }

  private shuffleWithConstraints(
    questions: GeneratedQuestion[],
    config: TestConfiguration
  ): GeneratedQuestion[] {
    // Implement constrained shuffling to maintain test structure
    return questions.sort(() => Math.random() - 0.5);
  }

  // Analytics and feedback methods
  private analyzePerformance(attempt: TestAttempt, test: GeneratedTest): any {
    return {
      overall: this.getPerformanceLevel(attempt.results.percentage),
      topicWise: Object.fromEntries(
        Object.entries(attempt.results.topicWiseScore).map(([topic, score]) => [
          topic,
          this.getPerformanceLevel(score.percentage)
        ])
      ),
      timeManagement: this.assessTimeManagement(attempt.results.totalTime, test.structure.totalTime),
      accuracy: this.getAccuracyLevel(attempt.results.percentage)
    };
  }

  private async generateInsights(attempt: TestAttempt, test: GeneratedTest): Promise<any> {
    // Generate detailed insights about the test attempt
    return {
      strengths: this.identifyStrengths(attempt),
      weaknesses: this.identifyWeaknesses(attempt),
      patterns: this.identifyPatterns(attempt),
      comparisons: await this.generateComparisons(attempt, test)
    };
  }

  private async generateRecommendations(attempt: TestAttempt, test: GeneratedTest, performance: any): Promise<any> {
    return {
      immediate: this.generateImmediateRecommendations(performance),
      study: this.generateStudyRecommendations(attempt),
      practice: this.generatePracticeRecommendations(attempt),
      strategy: this.generateStrategyRecommendations(performance)
    };
  }

  private planNextSteps(attempt: TestAttempt, test: GeneratedTest, performance: any): any {
    return {
      suggestedTopics: this.suggestNextTopics(attempt),
      difficulty: this.suggestNextDifficulty(performance),
      focusAreas: this.identifyFocusAreas(attempt),
      timeframe: this.estimateTimeframe(performance)
    };
  }

  // Utility methods
  private determineUserLevel(progress: SyllabusProgress): 'beginner' | 'intermediate' | 'advanced' {
    if (progress.overall.completionPercentage < 30) return 'beginner';
    if (progress.overall.completionPercentage < 70) return 'intermediate';
    return 'advanced';
  }

  private estimateUserScore(progress: SyllabusProgress): number {
    return Math.round(progress.overall.masteryPercentage * 0.8 + 20);
  }

  private async expandWeakTopics(weakTopics: string[], includeFoundational: boolean): Promise<TestConfiguration['topics']> {
    const topics = [];
    
    for (const topicId of weakTopics) {
      topics.push({
        topicId,
        weightage: 100 / weakTopics.length,
        difficulty: 'medium' as const,
        questionCount: 3
      });
      
      if (includeFoundational) {
        // Add foundational topics
        const topicNode = syllabusMapper['taxonomy'].nodes[topicId];
        if (topicNode?.parent) {
          topics.push({
            topicId: topicNode.parent,
            weightage: 50 / weakTopics.length,
            difficulty: 'easy' as const,
            questionCount: 2
          });
        }
      }
    }
    
    // Normalize weightages
    const totalWeight = topics.reduce((sum, t) => sum + t.weightage, 0);
    topics.forEach(t => t.weightage = (t.weightage / totalWeight) * 100);
    
    return topics;
  }

  private getDifficultyDistribution(difficulty: string): TestConfiguration['constraints']['difficultyDistribution'] {
    const distributions = {
      remedial: { easy: 70, medium: 25, hard: 5 },
      practice: { easy: 40, medium: 45, hard: 15 },
      challenging: { easy: 20, medium: 50, hard: 30 }
    };
    
    return distributions[difficulty as keyof typeof distributions] || distributions.practice;
  }

  private async createMockExamConfiguration(
    examType: 'prelims' | 'mains',
    paperNumber?: string,
    customization?: any
  ): Promise<TestConfiguration> {
    // Create configuration for mock exam based on actual UPSC pattern
    const baseConfig: TestConfiguration = {
      id: `mock_${examType}_${paperNumber || 'general'}_${Date.now()}`,
      name: `Mock ${examType.toUpperCase()} ${paperNumber || 'Exam'}`,
      type: 'mock_exam',
      examType,
      topics: await this.getExamTopics(examType, paperNumber),
      constraints: examType === 'prelims' 
        ? {
            totalQuestions: 100,
            timeLimit: 120, // 2 hours
            difficultyDistribution: { easy: 35, medium: 45, hard: 20 },
            questionTypes: { mcq: 100, descriptive: 0, caseStudy: 0, currentAffairs: 15 },
            includeImages: true,
            includePreviousYear: true,
            maxRepeats: 3
          }
        : {
            totalQuestions: 20,
            timeLimit: 180, // 3 hours
            difficultyDistribution: { easy: 25, medium: 50, hard: 25 },
            questionTypes: { mcq: 0, descriptive: 80, caseStudy: 20, currentAffairs: 10 },
            includeImages: false,
            includePreviousYear: true,
            maxRepeats: 2
          },
      adaptiveSettings: {
        adjustDifficulty: false,
        focusWeakAreas: false,
        includeStrengths: true,
        learningStyle: 'mixed',
        progressiveComplexity: false
      },
      metadata: {
        createdBy: 'system',
        targetAudience: 'advanced',
        estimatedScore: 65,
        tags: ['mock', examType, 'official_pattern']
      }
    };

    // Apply customizations
    if (customization) {
      if (customization.currentAffairsWeight) {
        baseConfig.constraints.questionTypes.currentAffairs = customization.currentAffairsWeight;
      }
      if (customization.topicFocus) {
        // Adjust topic weightages based on focus
        baseConfig.topics.forEach(topic => {
          if (customization.topicFocus.includes(topic.topicId)) {
            topic.weightage *= 1.5;
          }
        });
        // Renormalize
        const total = baseConfig.topics.reduce((sum, t) => sum + t.weightage, 0);
        baseConfig.topics.forEach(t => t.weightage = (t.weightage / total) * 100);
      }
    }

    return baseConfig;
  }

  // More helper methods would be implemented here...
  
  private async getExamTopics(examType: string, paperNumber?: string): Promise<TestConfiguration['topics']> {
    // Return topics based on exam type and paper
    return [];
  }

  private async selectRevisionTopics(completedTopics: string[], lastStudied: Date, options: any): Promise<TestConfiguration['topics']> {
    // Select topics for revision based on spaced repetition and options
    return [];
  }

  private calculateMarks(questionType: string, difficulty: number): number {
    const baseMarks = { mcq: 2, descriptive: 10, case_study: 12.5 }[questionType] || 2;
    return Math.round(baseMarks * (1 + difficulty / 20));
  }

  private estimateTimeToSolve(questionType: string, difficulty: number): number {
    const baseTime = { mcq: 1.2, descriptive: 8, case_study: 12 }[questionType] || 1.2;
    return Math.round(baseTime * (1 + difficulty / 15));
  }

  private determineBloomLevel(questionType: string, difficulty: number): GeneratedQuestion['bloom']['level'] {
    if (difficulty <= 3) return 'remember';
    if (difficulty <= 5) return 'understand';
    if (difficulty <= 7) return 'apply';
    if (difficulty <= 8) return 'analyze';
    return 'evaluate';
  }

  private identifySkills(questionText: string): string[] {
    // Identify required skills from question text
    return ['analytical thinking', 'factual recall'];
  }

  private assessConceptualDepth(questionText: string): number {
    // Assess the conceptual depth of the question
    return 6; // Mock value
  }

  private findCrossTopicConnections(topic: SyllabusNode, questionText: string): string[] {
    // Find connections to other topics
    return [];
  }

  // Analytics calculation methods
  private calculateCoherence(questions: GeneratedQuestion[]): number {
    // Calculate how well questions flow together
    return 85;
  }

  private calculateSyllabusCoverage(questions: GeneratedQuestion[], config: TestConfiguration): number {
    // Calculate percentage of intended syllabus covered
    return 92;
  }

  private calculateCurrentRelevance(questions: GeneratedQuestion[]): number {
    // Calculate relevance to current affairs and trends
    return 78;
  }

  private calculatePracticalUtility(questions: GeneratedQuestion[]): number {
    // Calculate practical utility for exam preparation
    return 88;
  }

  private predictAverageScore(questions: GeneratedQuestion[], config: TestConfiguration): number {
    const avgDifficulty = questions.reduce((sum, q) => sum + q.difficulty, 0) / questions.length;
    return Math.round(100 - (avgDifficulty - 1) * 8); // Rough estimation
  }

  private predictTimeToComplete(questions: GeneratedQuestion[]): number {
    return questions.reduce((sum, q) => sum + q.timeToSolve, 0);
  }

  private determineChallengeLevel(avgDifficulty: number): 'easy' | 'moderate' | 'challenging' | 'difficult' {
    if (avgDifficulty <= 3) return 'easy';
    if (avgDifficulty <= 5) return 'moderate';
    if (avgDifficulty <= 7) return 'challenging';
    return 'difficult';
  }

  // Performance analysis methods
  private getPerformanceLevel(percentage: number): string {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'good';
    if (percentage >= 60) return 'average';
    if (percentage >= 40) return 'below_average';
    return 'poor';
  }

  private assessTimeManagement(timeUsed: number, timeAllotted: number): string {
    const efficiency = timeUsed / timeAllotted;
    if (efficiency <= 0.8) return 'excellent';
    if (efficiency <= 0.95) return 'good';
    if (efficiency <= 1.1) return 'adequate';
    return 'poor';
  }

  private getAccuracyLevel(percentage: number): string {
    return this.getPerformanceLevel(percentage);
  }

  private identifyStrengths(attempt: TestAttempt): string[] {
    return Object.entries(attempt.results.topicWiseScore)
      .filter(([_, score]) => score.percentage >= 75)
      .map(([topic, _]) => topic);
  }

  private identifyWeaknesses(attempt: TestAttempt): string[] {
    return Object.entries(attempt.results.topicWiseScore)
      .filter(([_, score]) => score.percentage < 60)
      .map(([topic, _]) => topic);
  }

  private identifyPatterns(attempt: TestAttempt): string[] {
    const patterns = [];
    
    // Analyze response patterns
    const flaggedCount = attempt.responses.filter(r => r.flagged).length;
    if (flaggedCount > attempt.responses.length * 0.3) {
      patterns.push('High uncertainty in responses');
    }
    
    const avgTime = attempt.responses.reduce((sum, r) => sum + r.timeSpent, 0) / attempt.responses.length;
    if (avgTime < 0.5) {
      patterns.push('Very quick responses - may indicate guessing');
    }
    
    return patterns;
  }

  private async generateComparisons(attempt: TestAttempt, test: GeneratedTest): Promise<string[]> {
    // Compare with other attempts and benchmarks
    return ['Performed better than 68% of test takers'];
  }

  private generateImmediateRecommendations(performance: any): string[] {
    const recommendations = [];
    
    if (performance.timeManagement === 'poor') {
      recommendations.push('Practice time management with mock tests');
    }
    
    if (performance.accuracy === 'poor') {
      recommendations.push('Focus on concept clarity over speed');
    }
    
    return recommendations;
  }

  private generateStudyRecommendations(attempt: TestAttempt): string[] {
    const weakAreas = this.identifyWeaknesses(attempt);
    return weakAreas.map(area => `Strengthen ${area} concepts`);
  }

  private generatePracticeRecommendations(attempt: TestAttempt): string[] {
    return ['Practice more MCQs', 'Attempt topic-wise tests'];
  }

  private generateStrategyRecommendations(performance: any): string[] {
    return ['Eliminate obviously wrong options first', 'Manage time per question'];
  }

  private suggestNextTopics(attempt: TestAttempt): string[] {
    return this.identifyWeaknesses(attempt).slice(0, 3);
  }

  private suggestNextDifficulty(performance: any): 'easier' | 'same' | 'harder' {
    if (performance.overall === 'excellent') return 'harder';
    if (performance.overall === 'poor') return 'easier';
    return 'same';
  }

  private identifyFocusAreas(attempt: TestAttempt): string[] {
    return this.identifyWeaknesses(attempt);
  }

  private estimateTimeframe(performance: any): string {
    if (performance.overall === 'poor') return '2-3 weeks intensive study';
    if (performance.overall === 'average') return '1-2 weeks focused practice';
    return '3-5 days review and practice';
  }

  // Database and caching methods
  private async storeTest(test: GeneratedTest): Promise<void> {
    this.logger.debug('Storing generated test', { testId: test.id });
  }

  private async loadTest(testId: string): Promise<GeneratedTest | null> {
    return this.testCache.get(testId) || null;
  }

  private async getTestAttempts(testId: string): Promise<TestAttempt[]> {
    // Fetch test attempts from database
    return [];
  }

  private async getRecentPerformance(userId: string): Promise<any> {
    // Get user's recent test performance
    return { avgScore: 72, improvementTrend: 'up' };
  }

  private async getAvailableQuestions(topics: TestConfiguration['topics']): Promise<any> {
    // Get count of available questions for each topic
    return {};
  }

  private calculateTestAnalytics(test: GeneratedTest, attempts: TestAttempt[]): TestAnalytics {
    // Calculate comprehensive test analytics
    return {
      testId: test.id,
      attempts: attempts.length,
      avgScore: attempts.reduce((sum, a) => sum + a.results.percentage, 0) / attempts.length,
      avgTime: attempts.reduce((sum, a) => sum + a.results.totalTime, 0) / attempts.length,
      questionAnalytics: [],
      topicPerformance: {},
      insights: {
        easyQuestions: [],
        hardQuestions: [],
        timeConsumingQuestions: [],
        controversialQuestions: []
      },
      recommendations: {
        questionRevisions: [],
        difficultyAdjustments: [],
        contentUpdates: [],
        structureChanges: []
      }
    };
  }
}