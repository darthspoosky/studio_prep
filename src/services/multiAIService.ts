import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Multi-AI service interfaces
export interface MultiAIConfig {
  googleApiKey: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

export interface AIProvider {
  name: string;
  available: boolean;
  model: string;
}

export interface MultiAIResult {
  consensus: any;
  individual: {
    google?: any;
    openai?: any;
    claude?: any;
  };
  confidence: number;
  agreementScore: number;
  primaryProvider: string;
}

export interface QuestionExtractionPrompt {
  instruction: string;
  imageData: string;
  format: 'base64' | 'url';
}

export interface AnswerEvaluationPrompt {
  questionText: string;
  studentAnswer: string;
  modelAnswer?: string;
  subject: string;
  maxMarks: number;
}

export class MultiAIService {
  private google: GoogleGenerativeAI;
  private openai?: OpenAI;
  private claude?: Anthropic;
  private providers: AIProvider[] = [];

  constructor(config: MultiAIConfig) {
    // Initialize Google AI
    this.google = new GoogleGenerativeAI(config.googleApiKey);
    this.providers.push({
      name: 'Google Gemini',
      available: true,
      model: 'gemini-1.5-pro-vision-latest'
    });

    // Initialize OpenAI if API key provided
    if (config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: config.openaiApiKey,
      });
      this.providers.push({
        name: 'OpenAI GPT-4',
        available: true,
        model: 'gpt-4-vision-preview'
      });
    }

    // Initialize Anthropic Claude if API key provided
    if (config.anthropicApiKey) {
      this.claude = new Anthropic({
        apiKey: config.anthropicApiKey,
      });
      this.providers.push({
        name: 'Anthropic Claude',
        available: true,
        model: 'claude-3-5-sonnet-20241022'
      });
    }
  }

  // Get available AI providers
  getAvailableProviders(): AIProvider[] {
    return this.providers;
  }

  // Multi-AI question extraction from PDF page images
  async extractQuestionsMultiAI(
    imageBuffer: Buffer,
    pageNumber: number
  ): Promise<MultiAIResult> {
    const imageBase64 = imageBuffer.toString('base64');
    const prompt = this.buildQuestionExtractionPrompt();
    
    const results: any = {};
    const errors: any = {};

    // Extract with Google Gemini
    try {
      results.google = await this.extractWithGoogle(imageBase64, prompt);
    } catch (error) {
      errors.google = error;
      console.warn('Google Gemini extraction failed:', error);
    }

    // Extract with OpenAI GPT-4 Vision (if available)
    if (this.openai) {
      try {
        results.openai = await this.extractWithOpenAI(imageBase64, prompt);
      } catch (error) {
        errors.openai = error;
        console.warn('OpenAI extraction failed:', error);
      }
    }

    // Extract with Claude (if available and supports vision)
    if (this.claude) {
      try {
        results.claude = await this.extractWithClaude(imageBase64, prompt);
      } catch (error) {
        errors.claude = error;
        console.warn('Claude extraction failed:', error);
      }
    }

    // Generate consensus
    const consensus = this.generateQuestionConsensus(results);
    const confidence = this.calculateConfidence(results, errors);
    const agreementScore = this.calculateAgreementScore(results);

    return {
      consensus,
      individual: results,
      confidence,
      agreementScore,
      primaryProvider: this.selectPrimaryProvider(results, confidence)
    };
  }

  // Multi-AI answer evaluation
  async evaluateAnswerMultiAI(
    prompt: AnswerEvaluationPrompt
  ): Promise<MultiAIResult> {
    const evaluationPrompt = this.buildAnswerEvaluationPrompt(prompt);
    
    const results: any = {};
    const errors: any = {};

    // Evaluate with Google Gemini
    try {
      results.google = await this.evaluateWithGoogle(evaluationPrompt);
    } catch (error) {
      errors.google = error;
      console.warn('Google evaluation failed:', error);
    }

    // Evaluate with OpenAI (if available)
    if (this.openai) {
      try {
        results.openai = await this.evaluateWithOpenAI(evaluationPrompt);
      } catch (error) {
        errors.openai = error;
        console.warn('OpenAI evaluation failed:', error);
      }
    }

    // Evaluate with Claude (if available)
    if (this.claude) {
      try {
        results.claude = await this.evaluateWithClaude(evaluationPrompt);
      } catch (error) {
        errors.claude = error;
        console.warn('Claude evaluation failed:', error);
      }
    }

    // Generate consensus evaluation
    const consensus = this.generateEvaluationConsensus(results);
    const confidence = this.calculateConfidence(results, errors);
    const agreementScore = this.calculateAgreementScore(results);

    return {
      consensus,
      individual: results,
      confidence,
      agreementScore,
      primaryProvider: this.selectPrimaryProvider(results, confidence)
    };
  }

  // Extract questions using Google Gemini
  private async extractWithGoogle(imageBase64: string, prompt: string): Promise<any> {
    const model = this.google.getGenerativeModel({ model: 'gemini-1.5-pro-vision-latest' });
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/png'
        }
      }
    ]);

    const response = await result.response;
    return this.parseAIResponse(response.text(), 'google');
  }

  // Extract questions using OpenAI GPT-4 Vision
  private async extractWithOpenAI(imageBase64: string, prompt: string): Promise<any> {
    if (!this.openai) throw new Error('OpenAI not initialized');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });

    return this.parseAIResponse(response.choices[0].message.content || '', 'openai');
  }

  // Extract questions using Claude
  private async extractWithClaude(imageBase64: string, prompt: string): Promise<any> {
    if (!this.claude) throw new Error('Claude not initialized');

    const message = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    });

    return this.parseAIResponse(message.content[0].text, 'claude');
  }

  // Evaluate answer using Google Gemini
  private async evaluateWithGoogle(prompt: string): Promise<any> {
    const model = this.google.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return this.parseAIResponse(response.text(), 'google');
  }

  // Evaluate answer using OpenAI
  private async evaluateWithOpenAI(prompt: string): Promise<any> {
    if (!this.openai) throw new Error('OpenAI not initialized');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert UPSC examiner with 20+ years of experience.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });

    return this.parseAIResponse(response.choices[0].message.content || '', 'openai');
  }

  // Evaluate answer using Claude
  private async evaluateWithClaude(prompt: string): Promise<any> {
    if (!this.claude) throw new Error('Claude not initialized');

    const message = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return this.parseAIResponse(message.content[0].text, 'claude');
  }

  // Build question extraction prompt
  private buildQuestionExtractionPrompt(): string {
    return `
You are an expert at analyzing UPSC (Union Public Service Commission) examination papers. 
Extract ALL questions from this PDF page image with maximum accuracy.

REQUIREMENTS:
1. IDENTIFY ALL QUESTIONS: Look for question numbers, question text, and options
2. EXTRACT COMPLETE INFORMATION:
   - Question number
   - Complete question text (including sub-parts)
   - Multiple choice options (A, B, C, D if present)
   - Subject classification (History, Geography, Polity, Economics, etc.)
   - Topic/subtopic identification
   - Difficulty assessment

3. HANDLE MULTIPLE FORMATS:
   - Multiple Choice Questions (MCQs)
   - Assertion-Reason questions
   - Statement-based questions
   - Case study questions
   - Both English and Hindi text

4. OUTPUT FORMAT: Return ONLY valid JSON:
{
  "pageAnalysis": {
    "hasQuestions": boolean,
    "questionCount": number,
    "language": "English|Hindi|Mixed",
    "format": "MCQ|Mixed|Other"
  },
  "questions": [{
    "questionNumber": number,
    "questionText": "complete question text",
    "subParts": ["part a", "part b"] or null,
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"] or null,
    "subject": "subject name",
    "topic": "specific topic",
    "difficulty": "Easy|Medium|Hard",
    "questionType": "MCQ|Assertion-Reason|Statement|CaseStudy",
    "language": "English|Hindi|Mixed",
    "confidence": 0.0-1.0,
    "hasImages": boolean,
    "specialInstructions": "any special notes" or null
  }]
}

CRITICAL: Return ONLY the JSON object. Ensure all JSON is properly formatted and valid.
If no questions are found, return {"pageAnalysis": {"hasQuestions": false, "questionCount": 0}, "questions": []}.
    `.trim();
  }

  // Build answer evaluation prompt
  private buildAnswerEvaluationPrompt(prompt: AnswerEvaluationPrompt): string {
    return `
You are an expert UPSC examiner with 20+ years of experience evaluating ${prompt.subject} answers.

QUESTION: ${prompt.questionText}
MAXIMUM MARKS: ${prompt.maxMarks}
${prompt.modelAnswer ? `MODEL ANSWER: ${prompt.modelAnswer}` : ''}

STUDENT ANSWER TO EVALUATE:
${prompt.studentAnswer}

EVALUATION CRITERIA:
1. Content Accuracy (40%)
2. Conceptual Understanding (25%)
3. Structure and Presentation (20%)
4. Use of Examples and Evidence (15%)

PROVIDE COMPREHENSIVE EVALUATION:

OUTPUT FORMAT (JSON ONLY):
{
  "evaluation": {
    "totalMarks": ${prompt.maxMarks},
    "awardedMarks": number,
    "percentage": number,
    "grade": "A+|A|B+|B|C+|C|D|F",
    "confidence": 0.0-1.0
  },
  "analysis": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "missingPoints": ["key point 1", "key point 2"],
    "incorrectPoints": ["error 1", "error 2"]
  },
  "criteriaBreakdown": {
    "contentAccuracy": {"marks": number, "feedback": "detailed feedback"},
    "conceptualUnderstanding": {"marks": number, "feedback": "detailed feedback"},
    "structurePresentation": {"marks": number, "feedback": "detailed feedback"},
    "examplesEvidence": {"marks": number, "feedback": "detailed feedback"}
  },
  "suggestions": {
    "immediate": ["specific improvement 1", "improvement 2"],
    "longTerm": ["strategy 1", "strategy 2"],
    "resources": ["resource 1", "resource 2"]
  }
}

Return ONLY valid JSON. Be fair but strict according to UPSC standards.
    `.trim();
  }

  // Parse AI responses uniformly
  private parseAIResponse(responseText: string, provider: string): any {
    try {
      const cleanedResponse = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      return {
        provider,
        data: JSON.parse(cleanedResponse),
        raw: responseText,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn(`Failed to parse ${provider} response:`, error);
      return {
        provider,
        data: null,
        raw: responseText,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Generate consensus from multiple AI responses for questions
  private generateQuestionConsensus(results: any): any {
    const validResults = Object.values(results).filter((r: any) => r.data && r.data.questions);
    
    if (validResults.length === 0) {
      return { questions: [], confidence: 0, source: 'none' };
    }

    if (validResults.length === 1) {
      return { 
        questions: (validResults[0] as any).data.questions, 
        confidence: 0.7, 
        source: (validResults[0] as any).provider 
      };
    }

    // Merge questions from multiple providers
    const allQuestions: any[] = [];
    validResults.forEach((result: any) => {
      if (result.data.questions) {
        allQuestions.push(...result.data.questions.map((q: any) => ({
          ...q,
          sourceProvider: result.provider
        })));
      }
    });

    // Group by question number and merge
    const questionGroups: { [key: number]: any[] } = {};
    allQuestions.forEach(q => {
      const qNum = q.questionNumber || 0;
      if (!questionGroups[qNum]) questionGroups[qNum] = [];
      questionGroups[qNum].push(q);
    });

    const consensusQuestions = Object.values(questionGroups).map(group => {
      if (group.length === 1) return group[0];
      
      // Merge multiple versions of the same question
      const merged = { ...group[0] };
      merged.confidence = Math.min(...group.map(q => q.confidence || 0.5));
      merged.sourceProviders = group.map(q => q.sourceProvider);
      merged.agreementLevel = group.length > 1 ? 'high' : 'single';
      
      return merged;
    });

    return {
      questions: consensusQuestions,
      confidence: 0.9,
      source: 'consensus',
      agreementScore: this.calculateAgreementScore(validResults)
    };
  }

  // Generate consensus from multiple AI responses for evaluations
  private generateEvaluationConsensus(results: any): any {
    const validResults = Object.values(results).filter((r: any) => r.data && r.data.evaluation);
    
    if (validResults.length === 0) {
      return { evaluation: null, confidence: 0, source: 'none' };
    }

    if (validResults.length === 1) {
      return { 
        ...((validResults[0] as any).data), 
        confidence: 0.7, 
        source: (validResults[0] as any).provider 
      };
    }

    // Calculate consensus evaluation
    const evaluations = validResults.map((r: any) => r.data.evaluation);
    const avgMarks = evaluations.reduce((sum, e) => sum + e.awardedMarks, 0) / evaluations.length;
    const avgPercentage = evaluations.reduce((sum, e) => sum + e.percentage, 0) / evaluations.length;
    
    // Take the most common grade or average-based grade
    const grades = evaluations.map(e => e.grade);
    const grade = this.getMostCommonGrade(grades) || this.percentageToGrade(avgPercentage);

    // Merge analysis from all providers
    const allStrengths = validResults.flatMap((r: any) => r.data.analysis?.strengths || []);
    const allWeaknesses = validResults.flatMap((r: any) => r.data.analysis?.weaknesses || []);
    const allSuggestions = validResults.flatMap((r: any) => r.data.suggestions?.immediate || []);

    return {
      evaluation: {
        totalMarks: evaluations[0].totalMarks,
        awardedMarks: Math.round(avgMarks * 100) / 100,
        percentage: Math.round(avgPercentage * 100) / 100,
        grade,
        confidence: 0.95
      },
      analysis: {
        strengths: [...new Set(allStrengths)].slice(0, 5),
        weaknesses: [...new Set(allWeaknesses)].slice(0, 5),
        missingPoints: [],
        incorrectPoints: []
      },
      suggestions: {
        immediate: [...new Set(allSuggestions)].slice(0, 5),
        longTerm: [],
        resources: []
      },
      consensus: true,
      sourceProviders: validResults.map((r: any) => r.provider),
      agreementScore: this.calculateAgreementScore(validResults)
    };
  }

  // Calculate confidence based on results and errors
  private calculateConfidence(results: any, errors: any): number {
    const totalProviders = this.providers.length;
    const successfulProviders = Object.keys(results).length;
    const errorCount = Object.keys(errors).length;
    
    const baseConfidence = successfulProviders / totalProviders;
    const errorPenalty = errorCount * 0.1;
    
    return Math.max(0, Math.min(1, baseConfidence - errorPenalty));
  }

  // Calculate agreement score between AI providers
  private calculateAgreementScore(results: any): number {
    const validResults = Object.values(results).filter((r: any) => r.data);
    
    if (validResults.length < 2) return 1.0;
    
    // Simple agreement score based on result similarity
    // In production, this would be more sophisticated
    return 0.8; // Placeholder
  }

  // Select primary provider based on confidence and results
  private selectPrimaryProvider(results: any, confidence: number): string {
    const validProviders = Object.keys(results).filter(key => results[key].data);
    
    if (validProviders.length === 0) return 'none';
    if (validProviders.length === 1) return validProviders[0];
    
    // Prefer Google Gemini for vision tasks, Claude for text analysis
    if (validProviders.includes('google')) return 'google';
    if (validProviders.includes('claude')) return 'claude';
    if (validProviders.includes('openai')) return 'openai';
    
    return validProviders[0];
  }

  // Helper: Get most common grade
  private getMostCommonGrade(grades: string[]): string | null {
    const counts: { [key: string]: number } = {};
    grades.forEach(grade => counts[grade] = (counts[grade] || 0) + 1);
    
    let maxCount = 0;
    let mostCommon = null;
    
    for (const [grade, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = grade;
      }
    }
    
    return mostCommon;
  }

  // Helper: Convert percentage to grade
  private percentageToGrade(percentage: number): string {
    if (percentage >= 95) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 75) return 'B+';
    if (percentage >= 65) return 'B';
    if (percentage >= 55) return 'C+';
    if (percentage >= 45) return 'C';
    if (percentage >= 35) return 'D';
    return 'F';
  }
}

export default MultiAIService;