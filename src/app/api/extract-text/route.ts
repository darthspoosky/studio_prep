import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import pdfParse from 'pdf-parse';
import { createAuthenticatedHandler, getRateLimitKey, rateLimit } from '@/lib/auth-middleware';
import { z } from 'zod';

const vision = new ImageAnnotatorClient();

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 500000; // 500KB of text

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff'
];

const ALLOWED_PDF_TYPE = 'application/pdf';

// Magic number validation for security
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]],
  'image/bmp': [[0x42, 0x4D]],
  'image/tiff': [[0x49, 0x49, 0x2A, 0x00], [0x4D, 0x4D, 0x00, 0x2A]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]]
};

function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return false;
  
  return signatures.some(signature => {
    if (buffer.length < signature.length) return false;
    return signature.every((byte, index) => buffer[index] === byte);
  });
}

function sanitizeText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove additional control characters
    .trim()
    .substring(0, MAX_TEXT_LENGTH);
}

async function handler(request: NextRequest) {
  // Rate limiting - 5 files per minute per user
  const rateLimitKey = getRateLimitKey(request);
  if (!rateLimit(rateLimitKey, 5, 60000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 413 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Empty file provided' }, { status: 400 });
    }

    // Validate MIME type
    const isValidType = [...ALLOWED_IMAGE_TYPES, ALLOWED_PDF_TYPE].includes(file.type);
    if (!isValidType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF or image files only.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate file signature (magic numbers)
    if (!validateFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: 'File type mismatch. The file content does not match the declared type.' },
        { status: 400 }
      );
    }

    let extractedText = '';

    if (file.type === ALLOWED_PDF_TYPE) {
      // Extract text from PDF
      try {
        const pdfData = await pdfParse(buffer, {
          max: 100, // Limit to 100 pages
          version: 'v1.10.100' // Specify version for consistency
        });
        extractedText = pdfData.text;
      } catch (error) {
        console.error('PDF parsing error:', error);
        return NextResponse.json(
          { error: 'Failed to extract text from PDF. The file may be corrupted or password-protected.' },
          { status: 422 }
        );
      }
    } else if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      // Extract text from image using Google Vision API
      try {
        const [result] = await vision.textDetection({
          image: {
            content: buffer.toString('base64'),
          },
        });

        const detections = result.textAnnotations;
        if (detections && detections.length > 0) {
          extractedText = detections[0].description || '';
        } else {
          extractedText = '';
        }
      } catch (error) {
        console.error('Vision API error:', error);
        return NextResponse.json(
          { error: 'Failed to extract text from image. Please ensure the image contains readable text.' },
          { status: 422 }
        );
      }
    }

    // Sanitize and validate extracted text
    const sanitizedText = sanitizeText(extractedText);

    if (!sanitizedText.trim()) {
      return NextResponse.json(
        { error: 'No readable text found in the file' },
        { status: 422 }
      );
    }

    if (sanitizedText.length < 10) {
      return NextResponse.json(
        { error: 'Insufficient text content. Please upload a file with more text.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: sanitizedText,
      originalFileName: file.name.substring(0, 100), // Limit filename length
      fileSize: file.size,
      fileType: file.type,
      textLength: sanitizedText.length
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    
    // Don't expose internal errors
    return NextResponse.json(
      { error: 'Unable to process file. Please try again with a different file.' },
      { status: 500 }
    );
  }
}

export const POST = createAuthenticatedHandler(handler);