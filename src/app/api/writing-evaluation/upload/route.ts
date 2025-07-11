/**
 * File Upload and OCR Processing API
 * Handles image and PDF uploads for handwritten answer analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { OCRService } from '@/services/ocrService';
import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/heic',
  'image/webp',
  'application/pdf'
];

export async function POST(request: NextRequest) {
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

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

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

export async function GET() {
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
    ]
  });
}