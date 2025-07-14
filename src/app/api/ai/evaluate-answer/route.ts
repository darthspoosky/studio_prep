import { NextRequest, NextResponse } from 'next/server';
import AnswerEvaluationService from '@/services/answerEvaluationService';

// Answer evaluation API endpoint
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const answerImage = formData.get('answerImage') as File;
    const questionText = formData.get('questionText') as string;
    const modelAnswer = formData.get('modelAnswer') as string;
    const subject = formData.get('subject') as string;
    const maxMarks = parseInt(formData.get('maxMarks') as string || '10');
    const language = formData.get('language') as string || 'english';

    if (!answerImage || !questionText || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: answerImage, questionText, or subject' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const answerBuffer = Buffer.from(await answerImage.arrayBuffer());

    // Initialize evaluation service
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      );
    }

    const evaluationService = new AnswerEvaluationService(apiKey);

    // Evaluate the answer
    const evaluation = await evaluationService.evaluateAnswer(answerBuffer, {
      questionText,
      modelAnswer: modelAnswer || undefined,
      subject,
      maxMarks,
      language: language as 'english' | 'hindi' | 'mixed',
      answerType: 'handwritten'
    });

    // Save evaluation to database/file system
    try {
      await saveEvaluationToDatabase(evaluation, answerImage.name);
    } catch (dbError) {
      console.warn('Failed to save evaluation to database:', dbError);
      // Continue even if database save fails
    }

    return NextResponse.json({
      success: true,
      evaluation,
      metadata: {
        apiVersion: '1.0',
        evaluatedAt: new Date().toISOString(),
        processingTime: evaluation.metadata.processingTime
      }
    });

  } catch (error) {
    console.error('Answer evaluation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Answer evaluation failed: ${error}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Get evaluation status and capabilities
export async function GET() {
  return NextResponse.json({
    status: 'operational',
    capabilities: {
      handwritingOCR: true,
      aiEvaluation: true,
      multipleSubjects: true,
      languages: ['english', 'hindi', 'mixed'],
      batchProcessing: true,
      modelAnswerComparison: true,
      improvementSuggestions: true
    },
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxFileSize: '10MB',
    supportedSubjects: [
      'History',
      'Geography', 
      'Polity',
      'Economics',
      'Science & Technology',
      'Environment',
      'Current Affairs',
      'Ethics',
      'Public Administration',
      'Sociology',
      'Philosophy',
      'Literature'
    ]
  });
}

// Batch evaluation endpoint
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const answerImages: File[] = [];
    const questions: any[] = [];

    // Extract multiple files and questions
    let fileIndex = 0;
    while (formData.get(`answerImage_${fileIndex}`)) {
      const answerImage = formData.get(`answerImage_${fileIndex}`) as File;
      const questionData = JSON.parse(formData.get(`question_${fileIndex}`) as string);
      
      answerImages.push(answerImage);
      questions.push(questionData);
      fileIndex++;
    }

    if (answerImages.length === 0) {
      return NextResponse.json(
        { error: 'No answer images provided for batch evaluation' },
        { status: 400 }
      );
    }

    // Convert Files to Buffers
    const answerBuffers = await Promise.all(
      answerImages.map(file => file.arrayBuffer().then(buffer => Buffer.from(buffer)))
    );

    // Initialize evaluation service
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      );
    }

    const evaluationService = new AnswerEvaluationService(apiKey);

    // Perform batch evaluation
    const batchResult = await evaluationService.evaluateBatch(answerBuffers, questions);

    return NextResponse.json({
      success: true,
      batchResult,
      metadata: {
        apiVersion: '1.0',
        evaluatedAt: new Date().toISOString(),
        totalAnswers: batchResult.results.length,
        averageScore: batchResult.summary.averageScore
      }
    });

  } catch (error) {
    console.error('Batch evaluation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Batch evaluation failed: ${error}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to save evaluations to database
async function saveEvaluationToDatabase(evaluation: any, fileName: string) {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // Create evaluation results directory
    const resultsDir = path.join(process.cwd(), 'evaluation_results');
    await fs.mkdir(resultsDir, { recursive: true });
    
    // Save evaluation result
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedFileName = fileName ? fileName.replace(/[^a-zA-Z0-9]/g, '_') : 'unknown';
    const resultFile = path.join(resultsDir, `${sanitizedFileName}_${timestamp}.json`);
    
    const saveData = {
      evaluationId: evaluation.answerId,
      sourceFile: fileName,
      evaluatedAt: evaluation.metadata.evaluatedAt,
      question: evaluation.questionId,
      student: {
        extractedText: evaluation.studentAnswer.text,
        confidence: evaluation.studentAnswer.confidence,
        readabilityScore: evaluation.studentAnswer.readabilityScore
      },
      evaluation: {
        marks: evaluation.evaluation.awardedMarks,
        totalMarks: evaluation.evaluation.totalMarks,
        percentage: evaluation.evaluation.percentage,
        grade: evaluation.evaluation.grade,
        confidence: evaluation.evaluation.confidence
      },
      analysis: evaluation.analysis,
      suggestions: evaluation.suggestions,
      comparison: evaluation.comparison,
      processingTime: evaluation.metadata.processingTime,
      reviewRequired: evaluation.metadata.reviewRequired
    };
    
    await fs.writeFile(resultFile, JSON.stringify(saveData, null, 2));
    console.log(`✅ Saved evaluation to: ${resultFile}`);
    
    return { success: true, file: resultFile };
  } catch (error) {
    console.error('❌ Failed to save evaluation to database:', error);
    throw error;
  }
}
