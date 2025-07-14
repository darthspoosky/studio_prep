import { NextRequest, NextResponse } from 'next/server';
import AdvancedFileProcessor from '@/services/advancedFileProcessor';
import TempFileManager from '@/services/tempFileManager';
import { FileUtils } from '@/services/fileProcessingService';

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

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate files
    for (const file of files) {
      const fileInfo = FileUtils.getFileInfo(file);
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

    // Initialize AI processor
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const processor = new AdvancedFileProcessor(apiKey);
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

        // Process with advanced processor
        const result = await processor.processFile(fileBuffer, {
          extractText: options.extractText !== false,
          extractImages: options.extractImages !== false,
          enhanceImageQuality: options.enhanceImageQuality || false,
          splitPDFPages: options.splitPDFPages || false,
          aiProcessing: options.aiProcessing !== false,
          outputFormat: options.outputFormat || 'json',
          confidenceThreshold: options.confidenceThreshold || 0.7
        });

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