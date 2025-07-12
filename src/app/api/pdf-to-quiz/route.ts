
import { NextRequest, NextResponse } from 'next/server';
import { run } from '@genkit-ai/flow';
import { pdfToQuizFlow } from '@/ai/flows/pdf-to-quiz-flow';
import { createAuthenticatedHandler, getRateLimitKey, rateLimit } from '@/lib/auth-middleware';
import { z } from 'zod';

// Input validation schema
const inputSchema = z.object({
  examType: z.string().min(1).max(50).default('UPSC Prelims'),
  questionCount: z.number().int().min(1).max(50).default(10)
});

// File validation constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB for PDFs
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46]; // %PDF

function validatePdfSignature(buffer: Buffer): boolean {
  if (buffer.length < PDF_SIGNATURE.length) return false;
  return PDF_SIGNATURE.every((byte, index) => buffer[index] === byte);
}

async function handler(req: NextRequest) {
  // Rate limiting - 3 PDF conversions per minute
  const rateLimitKey = getRateLimitKey(req);
  if (!rateLimit(rateLimitKey, 3, 60000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const examTypeRaw = formData.get('examType') as string;
    const questionCountRaw = formData.get('questionCount') as string;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 });
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
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Only PDF is supported.' }, { status: 400 });
    }

    // Validate file signature
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    
    if (!validatePdfSignature(buffer)) {
      return NextResponse.json(
        { error: 'Invalid PDF file. The file content does not match PDF format.' },
        { status: 400 }
      );
    }

    // Validate and parse input parameters
    const inputValidation = inputSchema.safeParse({
      examType: examTypeRaw,
      questionCount: questionCountRaw ? parseInt(questionCountRaw, 10) : undefined
    });

    if (!inputValidation.success) {
      return NextResponse.json(
        { error: 'Invalid input parameters', details: inputValidation.error.errors },
        { status: 400 }
      );
    }

    const { examType, questionCount } = inputValidation.data;

    // Convert the file to a Base64 data URI
    const base64String = buffer.toString('base64');
    const pdfDataUri = `data:application/pdf;base64,${base64String}`;
    
    // Run the Genkit flow with the prepared input
    const result = await pdfToQuizFlow({
      pdfDataUri,
      examType,
      questionCount,
    });
    
    return NextResponse.json({
      ...result,
      metadata: {
        originalFileName: file.name.substring(0, 100),
        fileSize: file.size,
        questionCount,
        examType,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[PDF to Quiz API Error]', error);
    
    // Don't expose internal errors
    return NextResponse.json(
      { error: 'Unable to process PDF. Please try again with a different file.' }, 
      { status: 500 }
    );
  }
}

export const POST = createAuthenticatedHandler(handler);
