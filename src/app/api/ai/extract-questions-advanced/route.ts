import { NextRequest, NextResponse } from 'next/server';
import AdvancedFileProcessor from '@/services/advancedFileProcessor';
import TempFileManager from '@/services/tempFileManager';
import { FileUtils, FileProcessingService } from '@/services/fileProcessingService';

// Enhanced extraction API with multi-format support
export async function POST(request: NextRequest) {
  const tempFileManager = TempFileManager.getInstance();
  let tempFileIds: string[] = [];

  try {
    // Initialize temp file manager
    await tempFileManager.initialize();

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const optionsString = formData.get('options') as string;
    const options = optionsString ? JSON.parse(optionsString) : {};
    
    // Enhanced options for better question extraction
    const enhancedOptions = {
      extractText: formData.get('extractText') === 'true',
      extractImages: true, // Always extract images for better processing
      extractQuestions: formData.get('extractQuestions') === 'true',
      splitPDFPages: true, // Enable page-by-page processing
      enhanceImageQuality: true, // Enhance for better OCR
      aiProcessing: formData.get('extractQuestions') === 'true',
      confidenceThreshold: parseFloat(formData.get('confidenceThreshold') as string) || 0.7,
      ...options
    };

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate files
    for (const file of files) {
      const fileInfo = FileProcessingService.getFileInfo(file);
      if (!fileInfo.isSupported) {
        return NextResponse.json(
          { 
            error: `Unsupported file type: ${file.type}. Supported: PDF, JPG, PNG, WebP`,
            fileName: file.name
          },
          { status: 400 }
        );
      }

      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { 
            error: `File too large: ${FileUtils.formatFileSize(file.size)}. Maximum: 50MB`,
            fileName: file.name
          },
          { status: 400 }
        );
      }
    }

    // Initialize AI processor with multiple API keys
    const googleApiKey = process.env.GOOGLE_AI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 503 }
      );
    }

    const processor = new AdvancedFileProcessor({
      google: googleApiKey,
      openai: openaiApiKey,
      anthropic: anthropicApiKey
    });
    const results = [];

    // Process each file
    for (const file of files) {
      try {
        // Create temporary file
        const tempFile = await tempFileManager.createTempFileFromFile(file, {
          ttl: 60 * 60 * 1000, // 1 hour
          prefix: 'extract'
        });
        tempFileIds.push(tempFile.id);

        // Read file content
        const fileBuffer = await tempFileManager.readTempFile(tempFile.id);
        if (!fileBuffer) {
          throw new Error('Failed to read temporary file');
        }

        // Process with enhanced processor using improved options
        const result = await processor.processFile(fileBuffer, enhancedOptions);
        
        // Save extracted questions to database if requested
        if (enhancedOptions.extractQuestions && result.questions && result.questions.length > 0) {
          try {
            await saveQuestionsToDatabase(result.questions, file.name, enhancedOptions);
          } catch (dbError) {
            console.warn('Failed to save questions to database:', dbError);
            // Continue processing even if database save fails
          }
        }

        // Build response for this file
        const fileResult = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          processingTime: result.extractedContent.metadata.processingTime,
          success: true,
          
          // Content information
          extractedContent: {
            imageCount: result.extractedContent.metadata.imageCount,
            textLength: result.extractedContent.metadata.textLength,
            totalPages: result.extractedContent.metadata.totalPages,
            confidence: result.extractedContent.metadata.confidence
          },

          // Questions if AI processing was enabled
          questions: result.questions || [],
          questionCount: result.questions?.length || 0,

          // Metadata
          metadata: {
            processedAt: new Date().toISOString(),
            tempFileId: tempFile.id,
            format: result.processedFile.format,
            ...result.extractedContent.metadata
          }
        };

        results.push(fileResult);

        // Cleanup processed file
        await processor.cleanup(result.processedFile);

      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        
        results.push({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          success: false,
          error: fileError instanceof Error ? fileError.message : 'Unknown error',
          questions: [],
          questionCount: 0
        });
      }
    }

    // Calculate overall statistics
    const totalQuestions = results.reduce((sum, r) => sum + r.questionCount, 0);
    const successfulFiles = results.filter(r => r.success).length;
    const totalProcessingTime = results.reduce((sum, r) => sum + (r.processingTime || 0), 0);

    const response = {
      success: successfulFiles > 0,
      summary: {
        totalFiles: files.length,
        successfulFiles,
        failedFiles: files.length - successfulFiles,
        totalQuestions,
        totalProcessingTime,
        averageQuestionsPerFile: successfulFiles > 0 ? Math.round(totalQuestions / successfulFiles) : 0
      },
      files: results,
      metadata: {
        processedAt: new Date().toISOString(),
        apiVersion: '2.0',
        features: {
          multiFileSupport: true,
          pdfProcessing: true,
          imageEnhancement: true,
          aiExtraction: true,
          tempFileManagement: true
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Advanced extraction error:', error);
    
    let errorMessage = 'Failed to process files';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'AI service configuration error';
        statusCode = 503;
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Failed to parse AI response';
        statusCode = 502;
      } else if (error.message.includes('File too large')) {
        errorMessage = error.message;
        statusCode = 413;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        summary: {
          totalFiles: 0,
          successfulFiles: 0,
          failedFiles: 0,
          totalQuestions: 0
        }
      },
      { status: statusCode }
    );

  } finally {
    // Cleanup temporary files
    for (const tempFileId of tempFileIds) {
      try {
        await tempFileManager.deleteTempFile(tempFileId);
      } catch (cleanupError) {
        console.error(`Failed to cleanup temp file ${tempFileId}:`, cleanupError);
      }
    }
  }
}

// GET endpoint for service status and capabilities
export async function GET(request: NextRequest) {
  try {
    const tempFileManager = TempFileManager.getInstance();
    const stats = await tempFileManager.getStorageStats();
    
    return NextResponse.json({
      status: 'operational',
      version: '2.0',
      capabilities: {
        multiFileProcessing: true,
        supportedFormats: ['pdf', 'jpeg', 'jpg', 'png', 'webp'],
        maxFileSize: '50MB',
        maxFilesPerRequest: 10,
        languages: ['english', 'hindi'],
        subjects: [
          'history', 'geography', 'polity', 'economics', 
          'science', 'environment', 'current_affairs', 'ethics', 'governance'
        ],
        features: {
          pdfPageSplitting: true,
          imageEnhancement: true,
          textExtraction: true,
          aiProcessing: true,
          confidenceScoring: true,
          tempFileManagement: true
        }
      },
      systemStats: {
        tempFiles: stats.totalFiles,
        tempStorageUsed: FileUtils.formatFileSize(stats.totalSize),
        expiredFiles: stats.expiredFiles
      },
      limits: {
        maxFileSize: 50 * 1024 * 1024,
        maxFilesPerRequest: 10,
        tempFileTTL: 3600000, // 1 hour
        maxConcurrentRequests: 5
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Service status check failed',
        version: '2.0'
      },
      { status: 503 }
    );
  }
}

// DELETE endpoint for manual temp file cleanup
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const cleanupAll = searchParams.get('cleanupAll') === 'true';

    const tempFileManager = TempFileManager.getInstance();

    if (cleanupAll) {
      const cleaned = await tempFileManager.cleanupExpired();
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${cleaned} expired files`,
        cleanedFiles: cleaned
      });
    } else if (fileId) {
      const deleted = await tempFileManager.deleteTempFile(fileId);
      return NextResponse.json({
        success: deleted,
        message: deleted ? 'File deleted successfully' : 'File not found',
        fileId
      });
    } else {
      return NextResponse.json(
        { error: 'Missing fileId or cleanupAll parameter' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Cleanup operation failed'
      },
      { status: 500 }
    );
  }
}

// Helper function to save questions to database
async function saveQuestionsToDatabase(questions: any[], fileName: string, options: any) {
  // This would integrate with your question bank service
  // For now, we'll save to a JSON file as a demonstration
  
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // Create extraction results directory
    const resultsDir = path.join(process.cwd(), 'extraction_results');
    await fs.mkdir(resultsDir, { recursive: true });
    
    // Save extracted questions
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
    const resultFile = path.join(resultsDir, `${sanitizedFileName}_${timestamp}.json`);
    
    const saveData = {
      sourceFile: fileName,
      extractedAt: new Date().toISOString(),
      totalQuestions: questions.length,
      processingOptions: options,
      questions: questions.map(q => ({
        id: q.questionId,
        questionNumber: q.questionNumber,
        subject: q.subject,
        topic: q.topic,
        questionText: q.questionText,
        difficulty: q.difficulty,
        questionType: q.questionType,
        confidence: q.confidence,
        source: q.source,
        metadata: q.metadata
      }))
    };
    
    await fs.writeFile(resultFile, JSON.stringify(saveData, null, 2));
    console.log(`✅ Saved ${questions.length} questions to: ${resultFile}`);
    
    return { success: true, file: resultFile, count: questions.length };
  } catch (error) {
    console.error('❌ Failed to save questions to database:', error);
    throw error;
  }
}