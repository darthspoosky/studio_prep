/**
 * @fileOverview Previous Year Question Analysis System for UPSC PDFs
 */

import OpenAI from 'openai';
import { AdvancedTaggingSystem, TaggedContent } from '../tagging/advanced-tagging-system';
import { syllabusMapper, SyllabusNode } from '../syllabus/upsc-syllabus-taxonomy';
import { Logger } from '../core/logger';
import { databaseAdapter } from '../persistence/database-adapter';

export interface PreviousYearQuestion {
  id: string;
  year: number;
  paper: 'prelims' | 'mains' | 'interview';
  paperNumber?: string; // GS1, GS2, etc.
  questionNumber: number;
  questionText: string;
  options?: string[]; // For MCQs
  correctAnswer?: string | number;
  marks?: number;
  images?: string[]; // Base64 encoded images or URLs
  rawText: string; // Extracted text from PDF
  pageNumber: number;
  sourceDocument: string;
  taggedContent: TaggedContent;
  analysisResults: QuestionAnalysis;
  timestamp: Date;
}

export interface QuestionAnalysis {
  difficulty: {
    level: number;
    reasoning: string;
    comparativeAnalysis: string;
  };
  syllabusCoverage: {
    primaryTopics: string[];
    secondaryTopics: string[];
    crossCuttingThemes: string[];
    syllabusPercentage: number;
  };
  trendAnalysis: {
    frequency: number; // How often this topic appears
    yearlyPattern: Record<number, number>; // Year-wise frequency
    trendDirection: 'increasing' | 'stable' | 'decreasing';
    predictionScore: number; // Likelihood of appearing again
  };
  conceptualDepth: {
    factualLevel: number;
    analyticalLevel: number;
    applicationLevel: number;
    synthesisLevel: number;
    bloomsLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  };
  examStrategy: {
    timeToSolve: number;
    approachStrategy: string;
    commonMistakes: string[];
    keyInsights: string[];
  };
  currentRelevance: {
    score: number;
    reasoning: string;
    newsConnections: string[];
    policyRelevance: string[];
  };
}

export interface YearlyAnalysisReport {
  year: number;
  paper: string;
  totalQuestions: number;
  analysis: {
    difficultyDistribution: Record<'easy' | 'medium' | 'hard', number>;
    topicDistribution: Record<string, number>;
    newTopics: string[];
    repeatedTopics: string[];
    surpriseElements: string[];
    trendShifts: string[];
  };
  recommendations: {
    highPriorityTopics: string[];
    emergingTrends: string[];
    studyStrategy: string;
    timeAllocation: Record<string, number>;
  };
  comparativeAnalysis: {
    previousYear: {
      similarities: string[];
      differences: string[];
      evolutionPattern: string;
    };
    fiveYearTrend: {
      consistentTopics: string[];
      emergingTopics: string[];
      decliningTopics: string[];
    };
  };
}

export interface PDFProcessingResult {
  documentId: string;
  filename: string;
  year: number;
  paper: string;
  totalPages: number;
  extractedQuestions: PreviousYearQuestion[];
  processingStats: {
    successfulExtractions: number;
    failedExtractions: number;
    totalProcessingTime: number;
    averageTimePerQuestion: number;
  };
  qualityMetrics: {
    ocrAccuracy: number;
    structureRecognition: number;
    contentCompleteness: number;
    overallQuality: number;
  };
}

export class PreviousYearAnalyzer {
  private openai: OpenAI;
  private taggingSystem: AdvancedTaggingSystem;
  private logger: Logger;

  constructor(openai: OpenAI, logger: Logger) {
    this.openai = openai;
    this.taggingSystem = new AdvancedTaggingSystem(openai, logger);
    this.logger = logger;
  }

  /**
   * Process uploaded PDF and extract questions with analysis
   */
  async processPDF(
    pdfBuffer: Buffer,
    filename: string,
    year: number,
    paper: 'prelims' | 'mains' | 'interview',
    paperNumber?: string
  ): Promise<PDFProcessingResult> {
    this.logger.info('Starting PDF processing', { filename, year, paper });
    const startTime = Date.now();

    try {
      // Step 1: Extract text and images from PDF
      const extractedContent = await this.extractContentFromPDF(pdfBuffer);
      
      // Step 2: Parse questions from extracted content
      const parsedQuestions = await this.parseQuestionsFromContent(
        extractedContent, 
        year, 
        paper, 
        paperNumber, 
        filename
      );
      
      // Step 3: Analyze each question comprehensively
      const analyzedQuestions = await this.analyzeQuestions(parsedQuestions);
      
      // Step 4: Generate processing statistics
      const processingTime = Date.now() - startTime;
      const stats = this.calculateProcessingStats(analyzedQuestions, processingTime);
      
      // Step 5: Store in database
      await this.storePreviousYearQuestions(analyzedQuestions);

      const result: PDFProcessingResult = {
        documentId: `doc_${year}_${paper}_${Date.now()}`,
        filename,
        year,
        paper,
        totalPages: extractedContent.totalPages,
        extractedQuestions: analyzedQuestions,
        processingStats: stats,
        qualityMetrics: await this.assessExtractionQuality(extractedContent, analyzedQuestions)
      };

      this.logger.info('PDF processing completed', {
        documentId: result.documentId,
        questionsExtracted: analyzedQuestions.length,
        processingTime
      });

      return result;

    } catch (error) {
      this.logger.error('PDF processing failed', error as Error, { filename, year, paper });
      throw error;
    }
  }

  /**
   * Extract text and images from PDF using OCR
   */
  private async extractContentFromPDF(pdfBuffer: Buffer): Promise<{
    pages: Array<{
      pageNumber: number;
      text: string;
      images: string[];
      boundingBoxes: Array<{
        text: string;
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
    }>;
    totalPages: number;
    metadata: {
      title?: string;
      author?: string;
      subject?: string;
      creator?: string;
    };
  }> {
    // This would integrate with actual PDF processing libraries like pdf-parse, pdf2pic, tesseract.js
    // For now, simulating the extraction process
    
    this.logger.info('Extracting content from PDF', { bufferSize: pdfBuffer.length });
    
    // Simulate PDF processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock extracted content
    return {
      pages: [
        {
          pageNumber: 1,
          text: `
          UPSC Civil Services Examination 2023
          General Studies Paper I
          
          1. Which of the following best describes the Indus Valley Civilization?
          (a) It was primarily an agricultural society
          (b) It had well-planned urban centers
          (c) It was ruled by priest-kings
          (d) All of the above
          
          2. The concept of 'Doctrine of Lapse' was introduced by:
          (a) Lord Wellesley
          (b) Lord Dalhousie
          (c) Lord Cornwallis
          (d) Lord Hastings
          `,
          images: [],
          boundingBoxes: []
        }
      ],
      totalPages: 1,
      metadata: {
        title: 'UPSC GS Paper 1 - 2023',
        subject: 'General Studies'
      }
    };
  }

  /**
   * Parse questions from extracted content using AI
   */
  private async parseQuestionsFromContent(
    extractedContent: any,
    year: number,
    paper: 'prelims' | 'mains' | 'interview',
    paperNumber: string | undefined,
    sourceDocument: string
  ): Promise<Partial<PreviousYearQuestion>[]> {
    const questions: Partial<PreviousYearQuestion>[] = [];

    for (const page of extractedContent.pages) {
      const pageQuestions = await this.extractQuestionsFromPage(
        page.text,
        page.pageNumber,
        year,
        paper,
        paperNumber,
        sourceDocument
      );
      questions.push(...pageQuestions);
    }

    return questions;
  }

  /**
   * Extract questions from a single page using AI
   */
  private async extractQuestionsFromPage(
    pageText: string,
    pageNumber: number,
    year: number,
    paper: 'prelims' | 'mains' | 'interview',
    paperNumber: string | undefined,
    sourceDocument: string
  ): Promise<Partial<PreviousYearQuestion>[]> {
    const prompt = `
    Extract UPSC questions from this page content. Identify:
    1. Question number
    2. Question text
    3. Options (if MCQ)
    4. Marks (if mentioned)
    
    Page content:
    "${pageText}"
    
    Provide response in JSON format:
    {
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "question content",
          "options": ["(a) option 1", "(b) option 2", ...],
          "marks": 2,
          "type": "mcq" | "descriptive"
        }
      ]
    }`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const questions: Partial<PreviousYearQuestion>[] = [];

      result.questions?.forEach((q: any) => {
        questions.push({
          year,
          paper,
          paperNumber,
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          options: q.options,
          marks: q.marks,
          rawText: pageText,
          pageNumber,
          sourceDocument,
          timestamp: new Date()
        });
      });

      return questions;
    } catch (error) {
      this.logger.error('Failed to extract questions from page', error as Error, { pageNumber });
      return [];
    }
  }

  /**
   * Analyze each question comprehensively
   */
  private async analyzeQuestions(
    questions: Partial<PreviousYearQuestion>[]
  ): Promise<PreviousYearQuestion[]> {
    const analyzedQuestions: PreviousYearQuestion[] = [];

    for (const question of questions) {
      if (!question.questionText) continue;

      try {
        // Tag the question using advanced tagging system
        const taggedContent = await this.taggingSystem.analyzeAndTag(
          question.questionText,
          'question',
          {
            year: question.year,
            examType: question.paper,
            marks: question.marks
          }
        );

        // Perform detailed analysis
        const analysisResults = await this.performDetailedAnalysis(
          question.questionText,
          question.paper!,
          question.year!,
          taggedContent
        );

        const analyzedQuestion: PreviousYearQuestion = {
          id: `pyq_${question.year}_${question.paper}_${question.questionNumber}_${Date.now()}`,
          year: question.year!,
          paper: question.paper!,
          paperNumber: question.paperNumber,
          questionNumber: question.questionNumber!,
          questionText: question.questionText,
          options: question.options,
          correctAnswer: question.correctAnswer,
          marks: question.marks,
          images: question.images,
          rawText: question.rawText!,
          pageNumber: question.pageNumber!,
          sourceDocument: question.sourceDocument!,
          taggedContent,
          analysisResults,
          timestamp: new Date()
        };

        analyzedQuestions.push(analyzedQuestion);

      } catch (error) {
        this.logger.error('Failed to analyze question', error as Error, {
          questionNumber: question.questionNumber,
          year: question.year
        });
      }
    }

    return analyzedQuestions;
  }

  /**
   * Perform detailed analysis of individual question
   */
  private async performDetailedAnalysis(
    questionText: string,
    paper: string,
    year: number,
    taggedContent: TaggedContent
  ): Promise<QuestionAnalysis> {
    const prompt = `
    As a UPSC expert, analyze this ${year} ${paper} question in detail:
    
    "${questionText}"
    
    Provide comprehensive analysis covering:
    1. Difficulty assessment (1-10 scale)
    2. Conceptual depth analysis
    3. Bloom's taxonomy level
    4. Solving strategy
    5. Current relevance
    
    Response format:
    {
      "difficulty": {
        "level": 6,
        "reasoning": "explanation",
        "comparativeAnalysis": "how it compares to typical questions"
      },
      "conceptualDepth": {
        "factualLevel": 60,
        "analyticalLevel": 30,
        "applicationLevel": 10,
        "bloomsLevel": "analyze"
      },
      "examStrategy": {
        "timeToSolve": 3,
        "approachStrategy": "methodology",
        "commonMistakes": ["mistake1", "mistake2"],
        "keyInsights": ["insight1", "insight2"]
      },
      "currentRelevance": {
        "score": 85,
        "reasoning": "why still relevant",
        "newsConnections": ["current event 1"],
        "policyRelevance": ["policy 1"]
      }
    }`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      });

      const aiAnalysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Generate syllabus coverage from tagged content
      const syllabusCoverage = this.generateSyllabusCoverage(taggedContent);
      
      // Generate trend analysis
      const trendAnalysis = await this.generateTrendAnalysis(taggedContent, year);

      return {
        difficulty: aiAnalysis.difficulty || { level: 5, reasoning: 'Default', comparativeAnalysis: 'Average' },
        syllabusCoverage,
        trendAnalysis,
        conceptualDepth: {
          factualLevel: aiAnalysis.conceptualDepth?.factualLevel || 60,
          analyticalLevel: aiAnalysis.conceptualDepth?.analyticalLevel || 30,
          applicationLevel: aiAnalysis.conceptualDepth?.applicationLevel || 10,
          synthesisLevel: 10,
          bloomsLevel: aiAnalysis.conceptualDepth?.bloomsLevel || 'understand'
        },
        examStrategy: aiAnalysis.examStrategy || {
          timeToSolve: 3,
          approachStrategy: 'Standard approach',
          commonMistakes: [],
          keyInsights: []
        },
        currentRelevance: aiAnalysis.currentRelevance || {
          score: 70,
          reasoning: 'Moderately relevant',
          newsConnections: [],
          policyRelevance: []
        }
      };

    } catch (error) {
      this.logger.error('Failed to perform detailed analysis', error as Error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Generate syllabus coverage analysis
   */
  private generateSyllabusCoverage(taggedContent: TaggedContent): QuestionAnalysis['syllabusCoverage'] {
    const primaryTopics = taggedContent.primaryTags.map(tag => tag.topicId);
    const secondaryTopics = taggedContent.secondaryTags.map(tag => tag.topicId);
    
    // Find cross-cutting themes
    const crossCuttingThemes: string[] = [];
    if (primaryTopics.length > 1) {
      // Identify topics that span multiple subjects
      const subjectMap = new Map<string, string[]>();
      primaryTopics.forEach(topicId => {
        const path = syllabusMapper.getTopicPath(topicId);
        const subject = path.find(node => node.level === 'subject');
        if (subject) {
          if (!subjectMap.has(subject.id)) {
            subjectMap.set(subject.id, []);
          }
          subjectMap.get(subject.id)!.push(topicId);
        }
      });
      
      if (subjectMap.size > 1) {
        crossCuttingThemes.push('interdisciplinary');
      }
    }

    // Calculate syllabus percentage covered
    const totalSyllabusTopics = Object.values(syllabusMapper['taxonomy'].nodes)
      .filter(node => node.level === 'topic' || node.level === 'subtopic').length;
    const coveredTopics = [...primaryTopics, ...secondaryTopics];
    const syllabusPercentage = (coveredTopics.length / totalSyllabusTopics) * 100;

    return {
      primaryTopics,
      secondaryTopics,
      crossCuttingThemes,
      syllabusPercentage: Math.min(syllabusPercentage, 100)
    };
  }

  /**
   * Generate trend analysis for topics
   */
  private async generateTrendAnalysis(
    taggedContent: TaggedContent,
    currentYear: number
  ): Promise<QuestionAnalysis['trendAnalysis']> {
    // This would query historical data from database
    // For now, providing mock analysis
    
    const primaryTopicId = taggedContent.primaryTags[0]?.topicId;
    if (!primaryTopicId) {
      return {
        frequency: 0,
        yearlyPattern: {},
        trendDirection: 'stable',
        predictionScore: 50
      };
    }

    // Mock historical frequency data
    const yearlyPattern: Record<number, number> = {};
    for (let year = currentYear - 4; year <= currentYear; year++) {
      yearlyPattern[year] = Math.floor(Math.random() * 10); // Mock data
    }

    const frequency = Object.values(yearlyPattern).reduce((sum, count) => sum + count, 0);
    
    // Determine trend direction
    const recentYears = Object.entries(yearlyPattern)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .slice(0, 2);
    
    const trendDirection: 'increasing' | 'stable' | 'decreasing' = 
      recentYears.length < 2 ? 'stable' :
      recentYears[0][1] > recentYears[1][1] ? 'increasing' :
      recentYears[0][1] < recentYears[1][1] ? 'decreasing' : 'stable';

    const predictionScore = Math.min(frequency * 10 + (trendDirection === 'increasing' ? 20 : 0), 100);

    return {
      frequency,
      yearlyPattern,
      trendDirection,
      predictionScore
    };
  }

  /**
   * Calculate processing statistics
   */
  private calculateProcessingStats(
    questions: PreviousYearQuestion[],
    totalTime: number
  ): PDFProcessingResult['processingStats'] {
    return {
      successfulExtractions: questions.length,
      failedExtractions: 0, // Would track actual failures
      totalProcessingTime: totalTime,
      averageTimePerQuestion: questions.length > 0 ? totalTime / questions.length : 0
    };
  }

  /**
   * Assess extraction quality
   */
  private async assessExtractionQuality(
    extractedContent: any,
    questions: PreviousYearQuestion[]
  ): Promise<PDFProcessingResult['qualityMetrics']> {
    // Quality assessment logic
    const ocrAccuracy = 85 + Math.random() * 10; // Mock OCR accuracy
    const structureRecognition = questions.length > 0 ? 90 : 50;
    const contentCompleteness = Math.min((questions.length / 10) * 100, 100); // Assuming 10 questions per paper
    const overallQuality = (ocrAccuracy + structureRecognition + contentCompleteness) / 3;

    return {
      ocrAccuracy,
      structureRecognition,
      contentCompleteness,
      overallQuality
    };
  }

  /**
   * Store previous year questions in database
   */
  private async storePreviousYearQuestions(questions: PreviousYearQuestion[]): Promise<void> {
    for (const question of questions) {
      try {
        // Store in database (mock implementation)
        this.logger.debug('Storing previous year question', { id: question.id });
      } catch (error) {
        this.logger.error('Failed to store question', error as Error, { id: question.id });
      }
    }
  }

  /**
   * Generate yearly analysis report
   */
  async generateYearlyReport(
    year: number,
    paper?: string
  ): Promise<YearlyAnalysisReport[]> {
    // This would query all questions for the year and generate comprehensive analysis
    // Mock implementation
    
    const report: YearlyAnalysisReport = {
      year,
      paper: paper || 'All Papers',
      totalQuestions: 100,
      analysis: {
        difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
        topicDistribution: {
          'Modern History': 15,
          'Geography': 20,
          'Polity': 25,
          'Economy': 20,
          'Environment': 10,
          'Current Affairs': 10
        },
        newTopics: ['Digital Economy', 'Climate Change Adaptation'],
        repeatedTopics: ['Constitution', 'Freedom Struggle', 'Monsoons'],
        surpriseElements: ['Ancient Art Forms', 'Tribal Communities'],
        trendShifts: ['Increased focus on technology', 'More application-based questions']
      },
      recommendations: {
        highPriorityTopics: ['Digital India', 'Climate Action', 'Constitutional Amendments'],
        emergingTrends: ['Sustainable Development', 'Technology Integration'],
        studyStrategy: 'Focus on current affairs integration with core subjects',
        timeAllocation: {
          'History': 25,
          'Geography': 20,
          'Polity': 30,
          'Economy': 15,
          'Current Affairs': 10
        }
      },
      comparativeAnalysis: {
        previousYear: {
          similarities: ['Constitutional questions pattern', 'Geography weightage'],
          differences: ['More tech-focused questions', 'Less traditional history'],
          evolutionPattern: 'Gradual shift towards contemporary relevance'
        },
        fiveYearTrend: {
          consistentTopics: ['Constitution', 'Indian Geography', 'Economic Development'],
          emergingTopics: ['Digital Governance', 'Climate Change', 'Space Technology'],
          decliningTopics: ['Ancient Dynasties', 'Traditional Agriculture']
        }
      }
    };

    return [report];
  }

  /**
   * Get default analysis for fallback
   */
  private getDefaultAnalysis(): QuestionAnalysis {
    return {
      difficulty: { level: 5, reasoning: 'Default assessment', comparativeAnalysis: 'Average difficulty' },
      syllabusCoverage: { primaryTopics: [], secondaryTopics: [], crossCuttingThemes: [], syllabusPercentage: 0 },
      trendAnalysis: { frequency: 0, yearlyPattern: {}, trendDirection: 'stable', predictionScore: 50 },
      conceptualDepth: { factualLevel: 60, analyticalLevel: 30, applicationLevel: 10, synthesisLevel: 10, bloomsLevel: 'understand' },
      examStrategy: { timeToSolve: 3, approachStrategy: 'Standard approach', commonMistakes: [], keyInsights: [] },
      currentRelevance: { score: 70, reasoning: 'Moderately relevant', newsConnections: [], policyRelevance: [] }
    };
  }

  /**
   * Search previous year questions by criteria
   */
  async searchPreviousYearQuestions(criteria: {
    years?: number[];
    papers?: string[];
    topics?: string[];
    difficultyRange?: [number, number];
    limit?: number;
  }): Promise<PreviousYearQuestion[]> {
    // This would implement actual database search
    // Mock implementation for now
    return [];
  }

  /**
   * Get topic-wise question distribution
   */
  async getTopicDistribution(years: number[]): Promise<Record<string, {
    count: number;
    percentage: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    avgDifficulty: number;
  }>> {
    // Mock implementation
    return {
      'Modern History': { count: 45, percentage: 15, trend: 'stable', avgDifficulty: 6.2 },
      'Geography': { count: 60, percentage: 20, trend: 'increasing', avgDifficulty: 7.1 },
      'Polity': { count: 75, percentage: 25, trend: 'stable', avgDifficulty: 6.8 }
    };
  }
}