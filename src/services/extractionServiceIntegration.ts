import { QuestionBankService, PrelimsQuestion, MainsQuestion } from './questionBankService';
import AdvancedFileProcessor, { ExtractedQuestion } from './advancedFileProcessor';
import TempFileManager from './tempFileManager';
import { FileUtils } from './fileProcessingService';

// Integration service for seamless extraction and database import
export interface ExtractionIntegrationOptions {
  examType: 'Prelims' | 'Mains';
  year: number;
  paper?: string;
  source?: string;
  userId: string;
  autoImport?: boolean;
  validateQuestions?: boolean;
  processingOptions?: {
    extractText?: boolean;
    extractImages?: boolean;
    enhanceImageQuality?: boolean;
    splitPDFPages?: boolean;
    confidenceThreshold?: number;
  };
}

export interface IntegrationResult {
  success: boolean;
  extractionResult: {
    totalFiles: number;
    extractedQuestions: number;
    processingTime: number;
    confidence: number;
  };
  importResult?: {
    successful: number;
    failed: number;
    errors: string[];
  };
  validationResult?: {
    valid: number;
    invalid: number;
    warnings: string[];
  };
  tempFileIds: string[];
  metadata: {
    processedAt: Date;
    examType: 'Prelims' | 'Mains';
    source: string;
    userId: string;
  };
}

export class ExtractionServiceIntegration {
  private processor: AdvancedFileProcessor;
  private tempFileManager: TempFileManager;
  private questionBankService: typeof QuestionBankService;

  constructor(geminiApiKey: string) {
    this.processor = new AdvancedFileProcessor(geminiApiKey);
    this.tempFileManager = TempFileManager.getInstance();
    this.questionBankService = QuestionBankService;
  }

  // Main integration method
  async processAndImportQuestions(
    files: File[] | Buffer[],
    options: ExtractionIntegrationOptions
  ): Promise<IntegrationResult> {
    const startTime = Date.now();
    const tempFileIds: string[] = [];

    try {
      // Initialize temp file manager
      await this.tempFileManager.initialize();

      // Step 1: Process files and extract questions
      const extractedQuestions: ExtractedQuestion[] = [];
      let totalProcessingTime = 0;
      let totalConfidence = 0;

      for (const file of files) {
        try {
          // Create temporary file
          let tempFile;
          if (file instanceof File) {
            tempFile = await this.tempFileManager.createTempFileFromFile(file, {
              ttl: 2 * 60 * 60 * 1000, // 2 hours
              prefix: 'extraction'
            });
          } else {
            tempFile = await this.tempFileManager.createTempFile(
              file,
              `buffer_${Date.now()}.bin`,
              'application/octet-stream',
              { ttl: 2 * 60 * 60 * 1000, prefix: 'extraction' }
            );
          }

          tempFileIds.push(tempFile.id);

          // Read file content
          const fileBuffer = await this.tempFileManager.readTempFile(tempFile.id);
          if (!fileBuffer) {
            throw new Error('Failed to read temporary file');
          }

          // Process with advanced processor
          const result = await this.processor.processFile(fileBuffer, {
            extractText: options.processingOptions?.extractText ?? true,
            extractImages: options.processingOptions?.extractImages ?? true,
            enhanceImageQuality: options.processingOptions?.enhanceImageQuality ?? false,
            splitPDFPages: options.processingOptions?.splitPDFPages ?? false,
            aiProcessing: true,
            confidenceThreshold: options.processingOptions?.confidenceThreshold ?? 0.7
          });

          if (result.questions) {
            extractedQuestions.push(...result.questions);
          }

          totalProcessingTime += result.extractedContent.metadata.processingTime;
          totalConfidence += result.extractedContent.metadata.confidence;

        } catch (error) {
          console.error('Error processing file:', error);
          // Continue with other files
        }
      }

      const avgConfidence = files.length > 0 ? totalConfidence / files.length : 0;

      // Step 2: Validate questions if requested
      let validationResult;
      if (options.validateQuestions) {
        validationResult = this.validateExtractedQuestions(extractedQuestions, options.examType);
      }

      // Step 3: Transform questions for database import
      const transformedQuestions = this.transformQuestionsForImport(
        extractedQuestions,
        options
      );

      // Step 4: Import to database if requested
      let importResult;
      if (options.autoImport && transformedQuestions.length > 0) {
        importResult = await this.importQuestionsToDatabase(
          transformedQuestions,
          options
        );
      }

      const totalTime = Date.now() - startTime;

      return {
        success: true,
        extractionResult: {
          totalFiles: files.length,
          extractedQuestions: extractedQuestions.length,
          processingTime: totalTime,
          confidence: avgConfidence
        },
        importResult,
        validationResult,
        tempFileIds,
        metadata: {
          processedAt: new Date(),
          examType: options.examType,
          source: options.source || 'File Upload',
          userId: options.userId
        }
      };

    } catch (error) {
      console.error('Integration error:', error);
      return {
        success: false,
        extractionResult: {
          totalFiles: files.length,
          extractedQuestions: 0,
          processingTime: Date.now() - startTime,
          confidence: 0
        },
        tempFileIds,
        metadata: {
          processedAt: new Date(),
          examType: options.examType,
          source: options.source || 'File Upload',
          userId: options.userId
        }
      };
    }
  }

  // Validate extracted questions
  private validateExtractedQuestions(
    questions: ExtractedQuestion[],
    examType: 'Prelims' | 'Mains'
  ): { valid: number; invalid: number; warnings: string[] } {
    let valid = 0;
    let invalid = 0;
    const warnings: string[] = [];

    for (const question of questions) {
      let isValid = true;

      // Common validations
      if (!question.questionText?.english || question.questionText.english.trim().length < 10) {
        isValid = false;
        warnings.push(`Question ${question.questionNumber}: Question text too short`);
      }

      if (!question.subject || question.subject === 'general_studies') {
        warnings.push(`Question ${question.questionNumber}: Subject not properly classified`);
      }

      if (question.confidence < 0.7) {
        warnings.push(`Question ${question.questionNumber}: Low confidence score (${question.confidence})`);
      }

      // Exam-specific validations
      if (examType === 'Prelims') {
        if (!question.options?.a || !question.options?.b || !question.options?.c || !question.options?.d) {
          isValid = false;
          warnings.push(`Question ${question.questionNumber}: Missing options`);
        }

        if (!question.correctAnswer || !['a', 'b', 'c', 'd'].includes(question.correctAnswer)) {
          warnings.push(`Question ${question.questionNumber}: Invalid or missing correct answer`);
        }
      }

      if (isValid) {
        valid++;
      } else {
        invalid++;
      }
    }

    return { valid, invalid, warnings };
  }

  // Transform questions for database import
  private transformQuestionsForImport(
    questions: ExtractedQuestion[],
    options: ExtractionIntegrationOptions
  ): (Omit<PrelimsQuestion, 'id' | 'createdAt' | 'updatedAt'> | Omit<MainsQuestion, 'id' | 'createdAt' | 'updatedAt'>)[] {
    return questions.map(question => {
      const baseQuestion = {
        questionId: question.questionId,
        question: question.questionText.english,
        questionType: 'MCQ' as const,
        year: options.year,
        paper: options.paper || 'General Studies',
        questionNumber: question.questionNumber,
        subject: this.normalizeSubject(question.subject),
        subtopics: question.topic ? [question.topic] : [],
        syllabusTopic: question.topic ? [question.topic] : [],
        difficultyLevel: question.difficulty || 'medium',
        conceptLevel: this.mapDifficultyToConceptLevel(question.difficulty || 'medium'),
        source: options.source || 'Extracted from files',
        verified: question.confidence > 0.8,
        attemptCount: 0,
        correctAttempts: 0,
        averageTime: 0,
        successRate: 0,
        isActive: true
      };

      if (options.examType === 'Prelims') {
        return {
          ...baseQuestion,
          options: {
            A: question.options?.a?.english || '',
            B: question.options?.b?.english || '',
            C: question.options?.c?.english || '',
            D: question.options?.d?.english || ''
          },
          correctAnswer: question.correctAnswer ? [question.correctAnswer.toUpperCase()] : [],
          explanation: question.explanation || '',
          imageUrls: [],
          references: []
        } as Omit<PrelimsQuestion, 'id' | 'createdAt' | 'updatedAt'>;
      } else {
        return {
          ...baseQuestion,
          subParts: [],
          totalMarks: 10, // Default marks
          timeAllocation: 300, // 5 minutes default
          expectedApproach: question.explanation || '',
          keyPoints: [],
          commonMistakes: [],
          currentAffairsTopics: [],
          practiceLevel: question.difficulty || 'medium'
        } as Omit<MainsQuestion, 'id' | 'createdAt' | 'updatedAt'>;
      }
    });
  }

  // Import questions to database
  private async importQuestionsToDatabase(
    questions: (Omit<PrelimsQuestion, 'id' | 'createdAt' | 'updatedAt'> | Omit<MainsQuestion, 'id' | 'createdAt' | 'updatedAt'>)[],
    options: ExtractionIntegrationOptions
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    try {
      if (options.examType === 'Prelims') {
        const result = await this.questionBankService.bulkImportPrelimsQuestions(
          questions as Omit<PrelimsQuestion, 'id' | 'createdAt' | 'updatedAt'>[],
          options.userId
        );

        return {
          successful: result.successful.length,
          failed: result.failed.length,
          errors: result.failed.map(f => f.error)
        };
      } else {
        const result = await this.questionBankService.bulkImportMainsQuestions(
          questions as Omit<MainsQuestion, 'id' | 'createdAt' | 'updatedAt'>[],
          options.userId
        );

        return {
          successful: result.successful.length,
          failed: result.failed.length,
          errors: result.failed.map(f => f.error)
        };
      }
    } catch (error) {
      return {
        successful: 0,
        failed: questions.length,
        errors: [error instanceof Error ? error.message : 'Import failed']
      };
    }
  }

  // Normalize subject names
  private normalizeSubject(subject: string): string[] {
    const subjectMap: { [key: string]: string[] } = {
      'history': ['History'],
      'geography': ['Geography'],
      'polity': ['Polity'],
      'economics': ['Economics'],
      'science': ['Science & Technology'],
      'environment': ['Environment'],
      'current_affairs': ['Current Affairs'],
      'ethics': ['Ethics'],
      'governance': ['Governance']
    };

    return subjectMap[subject.toLowerCase()] || ['General Studies'];
  }

  // Map difficulty to concept level
  private mapDifficultyToConceptLevel(difficulty: string): 'Basic' | 'Intermediate' | 'Advanced' {
    const mapping: { [key: string]: 'Basic' | 'Intermediate' | 'Advanced' } = {
      'easy': 'Basic',
      'medium': 'Intermediate',
      'hard': 'Advanced'
    };

    return mapping[difficulty] || 'Intermediate';
  }

  // Cleanup temporary files
  async cleanup(tempFileIds: string[]): Promise<void> {
    for (const id of tempFileIds) {
      try {
        await this.tempFileManager.deleteTempFile(id);
      } catch (error) {
        console.error(`Failed to cleanup temp file ${id}:`, error);
      }
    }
  }

  // Get system statistics
  async getSystemStats(): Promise<{
    tempFileStats: any;
    processingCapacity: any;
    recentExtractions: any;
  }> {
    try {
      const tempFileStats = await this.tempFileManager.getStorageStats();
      
      return {
        tempFileStats,
        processingCapacity: {
          maxConcurrentFiles: 10,
          maxFileSize: FileUtils.formatFileSize(50 * 1024 * 1024),
          supportedFormats: ['PDF', 'JPG', 'PNG', 'WebP'],
          aiModels: ['Gemini-1.5-Pro']
        },
        recentExtractions: {
          // This would come from a database query in production
          totalExtractions: 0,
          successRate: 0,
          averageQuestionsPerFile: 0
        }
      };
    } catch (error) {
      console.error('Failed to get system stats:', error);
      return {
        tempFileStats: {},
        processingCapacity: {},
        recentExtractions: {}
      };
    }
  }
}

// Utility class for common extraction operations
export class ExtractionUtils {
  // Validate file before processing
  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large: ${FileUtils.formatFileSize(file.size)}. Maximum: 50MB`
      };
    }

    if (!supportedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type}`
      };
    }

    return { valid: true };
  }

  // Batch validate files
  static validateFiles(files: File[]): { valid: File[]; invalid: { file: File; error: string }[] } {
    const valid: File[] = [];
    const invalid: { file: File; error: string }[] = [];

    for (const file of files) {
      const validation = this.validateFile(file);
      if (validation.valid) {
        valid.push(file);
      } else {
        invalid.push({ file, error: validation.error! });
      }
    }

    return { valid, invalid };
  }

  // Estimate processing time
  static estimateProcessingTime(files: File[]): number {
    // Base time per file: 10 seconds
    // Additional time per MB: 2 seconds
    let totalTime = 0;

    for (const file of files) {
      totalTime += 10000; // 10 seconds base
      totalTime += (file.size / (1024 * 1024)) * 2000; // 2 seconds per MB
    }

    return totalTime;
  }

  // Get processing status message
  static getProcessingStatusMessage(
    totalFiles: number,
    processedFiles: number,
    extractedQuestions: number
  ): string {
    if (processedFiles === 0) {
      return 'Starting processing...';
    }

    if (processedFiles < totalFiles) {
      return `Processing ${processedFiles}/${totalFiles} files...`;
    }

    return `Completed! Extracted ${extractedQuestions} questions from ${totalFiles} files.`;
  }
}

export default ExtractionServiceIntegration;