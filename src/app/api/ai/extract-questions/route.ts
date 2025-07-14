import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

interface ExtractedQuestion {
  questionId: string;
  questionNumber: number;
  subject: string;
  topic: string;
  questionText: {
    english: string;
    hindi?: string;
  };
  options: {
    a: { english: string; hindi?: string };
    b: { english: string; hindi?: string };
    c: { english: string; hindi?: string };
    d: { english: string; hindi?: string };
  };
  correctAnswer?: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  year?: number;
  source?: string;
}

interface ExtractionResult {
  examInfo?: {
    examName: string;
    paperName: string;
    paperCode?: string;
    duration?: number;
    maxMarks?: number;
    totalQuestions?: number;
  };
  questions: ExtractedQuestion[];
  confidence: number;
  processingTime: number;
}

const EXTRACTION_PROMPT = `
You are an expert at extracting questions from UPSC examination papers and other competitive exam images. Your task is to analyze the provided image and extract all visible questions with their options.

IMPORTANT INSTRUCTIONS:
1. Extract ALL visible questions from the image
2. Maintain exact text from the image - do not modify or interpret
3. If both English and Hindi text is present, extract both
4. Number the questions sequentially as they appear
5. Identify the subject/topic for each question based on content
6. For multiple choice questions, extract all options (A, B, C, D)
7. If answer keys or explanations are visible, include them
8. If exam information (name, date, paper details) is visible, extract it

OUTPUT FORMAT (JSON):
{
  "examInfo": {
    "examName": "exam name if visible",
    "paperName": "paper name if visible", 
    "paperCode": "paper code if visible",
    "duration": number_in_minutes,
    "maxMarks": number,
    "totalQuestions": number
  },
  "questions": [
    {
      "questionId": "Q001",
      "questionNumber": 1,
      "subject": "classify as: history/geography/polity/economics/science/environment/current_affairs/ethics/governance",
      "topic": "specific_topic_name",
      "questionText": {
        "english": "exact english text",
        "hindi": "exact hindi text if present"
      },
      "options": {
        "a": {"english": "option A text", "hindi": "hindi text if present"},
        "b": {"english": "option B text", "hindi": "hindi text if present"},
        "c": {"english": "option C text", "hindi": "hindi text if present"},
        "d": {"english": "option D text", "hindi": "hindi text if present"}
      },
      "correctAnswer": "a/b/c/d if visible",
      "explanation": "explanation if provided",
      "difficulty": "easy/medium/hard based on complexity",
      "year": year_if_visible,
      "source": "source_if_mentioned"
    }
  ],
  "confidence": 0.95,
  "metadata": {
    "imageQuality": "high/medium/low",
    "textClarity": "clear/partially_clear/unclear",
    "languageDetected": ["english", "hindi"],
    "totalQuestionsFound": number,
    "processingNotes": "any important observations"
  }
}

SUBJECT CLASSIFICATION GUIDELINES:
- History: Ancient, medieval, modern Indian history, freedom struggle
- Geography: Physical, human geography, climate, resources
- Polity: Constitution, governance, institutions, rights
- Economics: Economic policy, banking, finance, trade
- Science: Physics, chemistry, biology, technology
- Environment: Ecology, climate change, conservation
- Current Affairs: Recent events, government schemes, international relations
- Ethics: Ethics, integrity, case studies
- Governance: Public administration, welfare schemes

QUALITY REQUIREMENTS:
- Extract text exactly as written (including any typos)
- Preserve formatting and structure
- If text is unclear, mention in processing notes
- Maintain question numbering as shown in image
- Include page numbers or section indicators if visible

Analyze the image carefully and extract all questions following this format exactly.
`;

async function processImageWithGemini(imageBuffer: Buffer, mimeType: string): Promise<ExtractionResult> {
  const startTime = Date.now();
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    const result = await model.generateContent([EXTRACTION_PROMPT, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (handling potential markdown formatting)
    let jsonText = text;
    if (text.includes('```json')) {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
    } else if (text.includes('```')) {
      const jsonMatch = text.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
    }

    const extractedData = JSON.parse(jsonText);
    const processingTime = Date.now() - startTime;

    // Validate and enhance the extracted data
    const validatedQuestions = extractedData.questions.map((q: any, index: number) => ({
      ...q,
      questionId: q.questionId || `Q${String(index + 1).padStart(3, '0')}`,
      questionNumber: q.questionNumber || (index + 1),
      subject: q.subject || 'general_studies',
      topic: q.topic || 'general',
      difficulty: q.difficulty || 'medium'
    }));

    return {
      examInfo: extractedData.examInfo,
      questions: validatedQuestions,
      confidence: extractedData.confidence || 0.85,
      processingTime
    };

  } catch (error) {
    console.error('Gemini processing error:', error);
    throw new Error('Failed to process image with AI: ' + (error as Error).message);
  }
}

async function saveTemporaryFile(buffer: Buffer, filename: string): Promise<string> {
  const tempDir = join(process.cwd(), 'temp');
  const filePath = join(tempDir, filename);
  
  try {
    await writeFile(filePath, buffer);
    return filePath;
  } catch (error) {
    throw new Error('Failed to save temporary file: ' + (error as Error).message);
  }
}

async function cleanupTemporaryFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error('Failed to cleanup temporary file:', error);
  }
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const options = formData.get('options') ? JSON.parse(formData.get('options') as string) : {};

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload JPG, PNG, or WebP images.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const imageBuffer = Buffer.from(bytes);

    // Save temporary file for processing
    const filename = `${uuidv4()}-${file.name}`;
    tempFilePath = await saveTemporaryFile(imageBuffer, filename);

    // Process image with Gemini AI
    const extractionResult = await processImageWithGemini(imageBuffer, file.type);

    // Enhance with additional metadata
    const response = {
      success: true,
      ...extractionResult,
      metadata: {
        ...extractionResult.metadata || {},
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        processedAt: new Date().toISOString(),
        apiVersion: '1.0'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Question extraction error:', error);
    
    let errorMessage = 'Failed to extract questions from image';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'AI service configuration error';
        statusCode = 503;
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Failed to parse AI response';
        statusCode = 502;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  } finally {
    // Cleanup temporary file
    if (tempFilePath) {
      await cleanupTemporaryFile(tempFilePath);
    }
  }
}

// GET endpoint for checking service status
export async function GET(request: NextRequest) {
  try {
    const hasApiKey = !!process.env.GOOGLE_AI_API_KEY;
    
    return NextResponse.json({
      status: 'operational',
      features: {
        imageExtraction: hasApiKey,
        supportedFormats: ['jpeg', 'jpg', 'png', 'webp'],
        maxFileSize: '10MB',
        languages: ['english', 'hindi'],
        subjects: [
          'history', 'geography', 'polity', 'economics', 
          'science', 'environment', 'current_affairs', 'ethics', 'governance'
        ]
      },
      version: '1.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Service configuration error'
      },
      { status: 503 }
    );
  }
}