import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFile } from 'fs/promises';
import sharp from 'sharp';
import MultiAIService from './multiAIService';

// Answer evaluation interfaces
export interface AnswerEvaluationOptions {
  questionText: string;
  modelAnswer?: string;
  subject: string;
  maxMarks: number;
  evaluationCriteria?: string[];
  language?: 'english' | 'hindi' | 'mixed';
  answerType?: 'handwritten' | 'typed';
}

export interface EvaluatedAnswer {
  answerId: string;
  questionId: string;
  studentAnswer: {
    text: string;
    originalImage?: Buffer;
    confidence: number;
    readabilityScore: number;
  };
  evaluation: {
    totalMarks: number;
    awardedMarks: number;
    percentage: number;
    grade: string;
    confidence: number;
  };
  analysis: {
    strengths: string[];
    weaknesses: string[];
    missingPoints: string[];
    incorrectPoints: string[];
  };
  suggestions: {
    immediate: string[];
    longTerm: string[];
    resources: string[];
  };
  comparison: {
    modelAnswer: string;
    keyDifferences: string[];
    coveragePercentage: number;
  };
  metadata: {
    evaluatedAt: Date;
    processingTime: number;
    evaluationMethod: string;
    reviewRequired: boolean;
  };
}

export interface BatchEvaluationResult {
  results: EvaluatedAnswer[];
  summary: {
    totalAnswers: number;
    averageScore: number;
    averageGrade: string;
    needsReview: number;
    processingTime: number;
  };
  insights: {
    commonWeaknesses: string[];
    topPerformingAreas: string[];
    improvementSuggestions: string[];
  };
}

export class AnswerEvaluationService {
  private genAI: GoogleGenerativeAI;
  private multiAI: MultiAIService;

  constructor(apiKeys: { google: string; openai?: string; anthropic?: string }) {
    this.genAI = new GoogleGenerativeAI(apiKeys.google);
    
    // Initialize Multi-AI service
    this.multiAI = new MultiAIService({
      googleApiKey: apiKeys.google,
      openaiApiKey: apiKeys.openai,
      anthropicApiKey: apiKeys.anthropic
    });
  }

  // Main method to evaluate a handwritten answer
  async evaluateAnswer(
    answerImage: Buffer,
    options: AnswerEvaluationOptions
  ): Promise<EvaluatedAnswer> {
    const startTime = Date.now();

    try {
      // Step 1: Extract text from handwritten answer using OCR
      const extractedText = await this.extractTextFromHandwriting(answerImage);
      
      // Step 2: Evaluate the answer using Multi-AI consensus
      console.log(`🤖 Multi-AI Answer Evaluation starting...`);
      const multiResult = await this.multiAI.evaluateAnswerMultiAI({
        questionText: options.questionText,
        studentAnswer: extractedText.text,
        modelAnswer: options.modelAnswer,
        subject: options.subject,
        maxMarks: options.maxMarks
      });
      
      console.log(`📊 Multi-AI Evaluation Results:`);
      console.log(`   Primary Provider: ${multiResult.primaryProvider}`);
      console.log(`   Confidence: ${(multiResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Agreement Score: ${(multiResult.agreementScore * 100).toFixed(1)}%`);
      
      // Use consensus result or fallback to single AI
      const evaluation = multiResult.consensus || (await this.performAIEvaluation(extractedText, options));
      
      // Generate additional suggestions (can still use single AI for specific suggestions)
      const suggestions = evaluation.suggestions || (await this.generateSuggestions(extractedText, evaluation, options));
      
      // Compare with model answer if provided
      const comparison = await this.compareWithModelAnswer(extractedText, options);

      return {
        answerId: `ans_${Date.now()}`,
        questionId: options.questionText.slice(0, 20).replace(/\s+/g, '_'),
        studentAnswer: {
          text: extractedText.text,
          originalImage: answerImage,
          confidence: extractedText.confidence,
          readabilityScore: extractedText.readabilityScore
        },
        evaluation,
        analysis: evaluation.detailedAnalysis,
        suggestions,
        comparison,
        metadata: {
          evaluatedAt: new Date(),
          processingTime: Date.now() - startTime,
          evaluationMethod: 'gemini_ai_evaluation',
          reviewRequired: evaluation.awardedMarks < (options.maxMarks * 0.4) || extractedText.confidence < 0.7
        }
      };

    } catch (error) {
      throw new Error(`Answer evaluation failed: ${error}`);
    }
  }

  // Extract text from handwritten answer using Google Vision AI
  private async extractTextFromHandwriting(answerImage: Buffer): Promise<{
    text: string;
    confidence: number;
    readabilityScore: number;
  }> {
    try {
      // Enhance image for better OCR
      const enhancedImage = await this.enhanceImageForOCR(answerImage);
      
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro-vision-latest' });
      
      const prompt = `
You are an expert OCR system specialized in reading handwritten text, particularly for academic answers.

TASK: Extract ALL text from this handwritten answer image with maximum accuracy.

INSTRUCTIONS:
1. Read every word, including crossed-out text (mark as [crossed: text])
2. Preserve paragraph structure and line breaks
3. Handle poor handwriting with best effort
4. Identify illegible words as [illegible]
5. Note any diagrams, charts, or drawings as [DIAGRAM: description]
6. Maintain original formatting as much as possible

OUTPUT FORMAT:
{
  "extractedText": "complete text content here",
  "confidence": 0.0-1.0,
  "readabilityScore": 0.0-1.0,
  "notes": ["any special observations about handwriting quality"]
}

Focus on academic content, technical terms, and ensure nothing is missed.
      `.trim();

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: enhancedImage.toString('base64'),
            mimeType: 'image/png'
          }
        }
      ]);

      const response = await result.response;
      const extractionResult = this.parseOCRResponse(response.text());
      
      return {
        text: extractionResult.extractedText || '',
        confidence: extractionResult.confidence || 0.5,
        readabilityScore: extractionResult.readabilityScore || 0.5
      };

    } catch (error) {
      throw new Error(`Text extraction failed: ${error}`);
    }
  }

  // Enhance image quality for better OCR
  private async enhanceImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(2400, 3200, { // Very high resolution for handwriting
          fit: 'inside',
          withoutEnlargement: false
        })
        .normalize() // Improve contrast
        .sharpen({ sigma: 0.5 }) // Enhance text sharpness
        .threshold(200) // Convert to high contrast B&W
        .png({ quality: 100 })
        .toBuffer();
    } catch (error) {
      console.warn('Image enhancement failed, using original:', error);
      return imageBuffer;
    }
  }

  // Parse OCR response
  private parseOCRResponse(responseText: string): any {
    try {
      const cleanedResponse = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      return JSON.parse(cleanedResponse);
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        extractedText: responseText,
        confidence: 0.6,
        readabilityScore: 0.6,
        notes: ['Fallback text extraction used']
      };
    }
  }

  // Perform AI-based evaluation of the answer
  private async performAIEvaluation(
    extractedText: { text: string; confidence: number },
    options: AnswerEvaluationOptions
  ): Promise<any> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    
    const prompt = `
You are an expert UPSC examiner with 20+ years of experience evaluating ${options.subject} answers.

QUESTION: ${options.questionText}
MAXIMUM MARKS: ${options.maxMarks}
${options.modelAnswer ? `MODEL ANSWER: ${options.modelAnswer}` : ''}

STUDENT ANSWER TO EVALUATE:
${extractedText.text}

EVALUATION CRITERIA:
1. Content Accuracy (40%)
2. Conceptual Understanding (25%)
3. Structure and Presentation (20%)
4. Use of Examples and Evidence (15%)

PROVIDE DETAILED EVALUATION:

OUTPUT FORMAT (JSON):
{
  "totalMarks": ${options.maxMarks},
  "awardedMarks": number,
  "percentage": number,
  "grade": "A+|A|B+|B|C+|C|D|F",
  "confidence": 0.0-1.0,
  "detailedAnalysis": {
    "strengths": ["strength 1", "strength 2", ...],
    "weaknesses": ["weakness 1", "weakness 2", ...],
    "missingPoints": ["missing key point 1", ...],
    "incorrectPoints": ["incorrect statement 1", ...]
  },
  "criteriaWiseMarks": {
    "contentAccuracy": {"marks": number, "maxMarks": number, "feedback": "string"},
    "conceptualUnderstanding": {"marks": number, "maxMarks": number, "feedback": "string"},
    "structurePresentation": {"marks": number, "maxMarks": number, "feedback": "string"},
    "examplesEvidence": {"marks": number, "maxMarks": number, "feedback": "string"}
  }
}

Be fair but strict. Consider UPSC standards. Provide constructive feedback.
    `.trim();

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return this.parseEvaluationResponse(response.text());
    } catch (error) {
      throw new Error(`AI evaluation failed: ${error}`);
    }
  }

  // Parse evaluation response
  private parseEvaluationResponse(responseText: string): any {
    try {
      const cleanedResponse = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      return JSON.parse(cleanedResponse);
    } catch (error) {
      // Fallback evaluation
      return {
        totalMarks: 10,
        awardedMarks: 5,
        percentage: 50,
        grade: 'C',
        confidence: 0.5,
        detailedAnalysis: {
          strengths: ['Answer provided'],
          weaknesses: ['Evaluation system error'],
          missingPoints: ['Could not analyze due to system error'],
          incorrectPoints: []
        }
      };
    }
  }

  // Generate improvement suggestions
  private async generateSuggestions(
    extractedText: { text: string },
    evaluation: any,
    options: AnswerEvaluationOptions
  ): Promise<any> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    
    const prompt = `
Based on this UPSC ${options.subject} answer evaluation, provide specific improvement suggestions:

QUESTION: ${options.questionText}
STUDENT ANSWER: ${extractedText.text}
AWARDED MARKS: ${evaluation.awardedMarks}/${evaluation.totalMarks}
WEAKNESSES: ${evaluation.detailedAnalysis?.weaknesses?.join(', ') || 'None identified'}

PROVIDE ACTIONABLE SUGGESTIONS:

OUTPUT FORMAT (JSON):
{
  "immediate": [
    "specific improvement for this answer type",
    "writing technique improvement",
    "content gap to address"
  ],
  "longTerm": [
    "study strategy recommendation",
    "skill development area",
    "preparation approach"
  ],
  "resources": [
    "specific book/resource recommendation",
    "online resource",
    "practice material"
  ]
}

Focus on practical, achievable improvements for UPSC preparation.
    `.trim();

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return this.parseSuggestionsResponse(response.text());
    } catch (error) {
      return {
        immediate: ['Review the answer structure', 'Add more specific examples'],
        longTerm: ['Focus on conceptual clarity', 'Practice more answer writing'],
        resources: ['Standard UPSC preparation books', 'Previous year papers']
      };
    }
  }

  // Parse suggestions response
  private parseSuggestionsResponse(responseText: string): any {
    try {
      const cleanedResponse = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      return JSON.parse(cleanedResponse);
    } catch (error) {
      return {
        immediate: ['Review and improve answer structure'],
        longTerm: ['Focus on comprehensive preparation'],
        resources: ['Standard preparation materials']
      };
    }
  }

  // Compare with model answer
  private async compareWithModelAnswer(
    extractedText: { text: string },
    options: AnswerEvaluationOptions
  ): Promise<any> {
    if (!options.modelAnswer) {
      return {
        modelAnswer: 'No model answer provided',
        keyDifferences: [],
        coveragePercentage: 0
      };
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    
    const prompt = `
Compare this student answer with the model answer for UPSC ${options.subject}:

MODEL ANSWER: ${options.modelAnswer}
STUDENT ANSWER: ${extractedText.text}

PROVIDE COMPARISON ANALYSIS:

OUTPUT FORMAT (JSON):
{
  "modelAnswer": "${options.modelAnswer}",
  "keyDifferences": [
    "difference 1: model covers X, student covers Y",
    "difference 2: model emphasizes A, student misses A"
  ],
  "coveragePercentage": number (0-100),
  "alignmentScore": number (0-10),
  "recommendations": [
    "include point X from model answer",
    "improve explanation of concept Y"
  ]
}

Focus on content coverage and approach differences.
    `.trim();

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return this.parseComparisonResponse(response.text());
    } catch (error) {
      return {
        modelAnswer: options.modelAnswer,
        keyDifferences: ['Could not perform detailed comparison'],
        coveragePercentage: 50
      };
    }
  }

  // Parse comparison response
  private parseComparisonResponse(responseText: string): any {
    try {
      const cleanedResponse = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      return JSON.parse(cleanedResponse);
    } catch (error) {
      return {
        modelAnswer: 'Comparison not available',
        keyDifferences: [],
        coveragePercentage: 50
      };
    }
  }

  // Batch evaluation for multiple answers
  async evaluateBatch(
    answerImages: Buffer[],
    questions: AnswerEvaluationOptions[]
  ): Promise<BatchEvaluationResult> {
    const startTime = Date.now();
    const results: EvaluatedAnswer[] = [];

    for (let i = 0; i < answerImages.length; i++) {
      try {
        const evaluation = await this.evaluateAnswer(answerImages[i], questions[i]);
        results.push(evaluation);
      } catch (error) {
        console.warn(`Failed to evaluate answer ${i + 1}:`, error);
      }
    }

    const summary = this.generateBatchSummary(results);
    const insights = this.generateBatchInsights(results);

    return {
      results,
      summary: {
        ...summary,
        processingTime: Date.now() - startTime
      },
      insights
    };
  }

  // Generate summary for batch evaluation
  private generateBatchSummary(results: EvaluatedAnswer[]): any {
    const totalAnswers = results.length;
    const averageScore = results.reduce((sum, r) => sum + r.evaluation.percentage, 0) / totalAnswers;
    const needsReview = results.filter(r => r.metadata.reviewRequired).length;
    
    // Determine average grade
    const averageGrade = averageScore >= 90 ? 'A+' :
                        averageScore >= 80 ? 'A' :
                        averageScore >= 70 ? 'B+' :
                        averageScore >= 60 ? 'B' :
                        averageScore >= 50 ? 'C+' :
                        averageScore >= 40 ? 'C' :
                        averageScore >= 30 ? 'D' : 'F';

    return {
      totalAnswers,
      averageScore: Math.round(averageScore * 100) / 100,
      averageGrade,
      needsReview
    };
  }

  // Generate insights for batch evaluation
  private generateBatchInsights(results: EvaluatedAnswer[]): any {
    const allWeaknesses = results.flatMap(r => r.analysis.weaknesses);
    const allStrengths = results.flatMap(r => r.analysis.strengths);
    
    // Count frequency and get top items
    const weaknessCount: { [key: string]: number } = {};
    const strengthCount: { [key: string]: number } = {};
    
    allWeaknesses.forEach(w => weaknessCount[w] = (weaknessCount[w] || 0) + 1);
    allStrengths.forEach(s => strengthCount[s] = (strengthCount[s] || 0) + 1);
    
    const commonWeaknesses = Object.entries(weaknessCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([weakness]) => weakness);
      
    const topPerformingAreas = Object.entries(strengthCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([strength]) => strength);

    return {
      commonWeaknesses,
      topPerformingAreas,
      improvementSuggestions: [
        'Focus on addressing common weaknesses identified',
        'Practice more structured answer writing',
        'Review model answers for better content coverage'
      ]
    };
  }
}

export default AnswerEvaluationService;