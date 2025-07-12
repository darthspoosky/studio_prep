/**
 * File Upload and OCR Processing API
 * Handles image and PDF uploads for handwritten answer analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { OCRService } from '@/services/ocrService';
import { createAuthenticatedHandler, getRateLimitKey, rateLimit } from '@/lib/auth-middleware';
import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/heic',
  'image/webp',
  'application/pdf'
];

// Enhanced file signature validation
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'application/pdf': [0x25, 0x50, 0x44, 0x46] // %PDF
};

function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signature = FILE_SIGNATURES[mimeType as keyof typeof FILE_SIGNATURES];
  if (!signature) return false;
  
  if (buffer.length < signature.length) return false;
  
  return signature.every((byte, index) => buffer[index] === byte);
}

async function handler(request: NextRequest) {
  // Rate limiting - 15 file uploads per hour per user
  const rateLimitKey = getRateLimitKey(request);
  if (!rateLimit(rateLimitKey, 15, 3600000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const questionText = formData.get('questionText') as string;
    const examType = formData.get('examType') as string || 'UPSC Mains';

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload JPG, PNG, HEIC, or PDF files.' },
        { status: 400 }
      );
    }

    // Validate file name for suspicious patterns
    const fileName = file.name.toLowerCase();
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.jar'];
    if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
      return NextResponse.json(
        { error: 'Invalid file type detected.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Validate file signature for security
    if (!validateFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: 'File content does not match declared file type.' },
        { status: 400 }
      );
    }

    // Initialize OCR service
    const ocrService = new OCRService();

    // Process file
    const ocrResult = await ocrService.processUploadedFile(buffer, file.type);

    // Validate text quality
    const qualityCheck = await ocrService.validateTextQuality(ocrResult.extractedText);

    // Extract structured information
    const structuredInfo = await ocrService.extractStructuredInfo(ocrResult.extractedText);

    // Return comprehensive result
    const response = {
      success: true,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        processedAt: new Date().toISOString()
      },
      ocr: {
        extractedText: ocrResult.extractedText,
        confidence: ocrResult.confidence,
        processingTime: ocrResult.processingTime,
        wordCount: ocrResult.wordCount,
        corrections: ocrResult.corrections
      },
      quality: qualityCheck,
      structure: structuredInfo,
      metadata: {
        source: 'ocr',
        readyForEvaluation: qualityCheck.quality !== 'poor',
        recommendedActions: qualityCheck.quality === 'poor' 
          ? ['Manual review recommended', 'Consider retaking photo with better lighting']
          : ['Ready for evaluation']
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('OCR processing error:', error);

    if (error instanceof Error) {
      if (error.message.includes('No text detected')) {
        return NextResponse.json(
          { error: 'No text found in the image. Please ensure the image is clear and contains written text.' },
          { status: 400 }
        );
      }

      if (error.message.includes('Google Vision client not initialized')) {
        return NextResponse.json(
          { error: 'OCR service temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process file. Please try again.' },
      { status: 500 }
    );
  }
}

function healthCheckHandler() {
  return NextResponse.json({
    service: 'ocr-upload',
    status: 'active',
    supportedFormats: ALLOWED_MIME_TYPES,
    maxFileSize: `${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    features: [
      'Handwritten text recognition',
      'PDF text extraction', 
      'Automatic error correction',
      'Quality validation',
      'Structure analysis'
    ],
    security: {
      fileSignatureValidation: true,
      rateLimitPerHour: 15,
      maxFileSize: MAX_FILE_SIZE
    }
  });
}

export const POST = createAuthenticatedHandler(handler);
export const GET = createAuthenticatedHandler(healthCheckHandler);