/**
 * OCR Service for Processing Handwritten Answers
 * Uses Google Vision API for text extraction and OpenAI for text correction
 */

import { openai, AI_MODELS } from '@/lib/ai-providers';

interface OCRResult {
  extractedText: string;
  confidence: number;
  processingTime: number;
  wordCount: number;
  corrections: string[];
  originalBlocks: TextBlock[];
}

interface TextBlock {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * OCR Service for handwritten answer processing
 */
export class OCRService {
  private googleVisionClient: any;

  constructor() {
    // Initialize Google Vision client
    this.initializeVisionClient();
  }

  private async initializeVisionClient() {
    try {
      const { ImageAnnotatorClient } = await import('@google-cloud/vision');
      this.googleVisionClient = new ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
      });
    } catch (error) {
      console.error('Failed to initialize Google Vision client:', error);
    }
  }

  /**
   * Process uploaded image/PDF and extract text
   */
  async processUploadedFile(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      let extractedText = '';
      let confidence = 0;
      let textBlocks: TextBlock[] = [];

      if (mimeType.startsWith('image/')) {
        const result = await this.extractTextFromImage(fileBuffer);
        extractedText = result.text;
        confidence = result.confidence;
        textBlocks = result.blocks;
      } else if (mimeType === 'application/pdf') {
        const result = await this.extractTextFromPDF(fileBuffer);
        extractedText = result.text;
        confidence = result.confidence;
        textBlocks = result.blocks;
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Post-process text with AI correction
      const correctedText = await this.correctExtractedText(extractedText);

      return {
        extractedText: correctedText.text,
        confidence,
        processingTime: Date.now() - startTime,
        wordCount: correctedText.text.split(/\s+/).length,
        corrections: correctedText.corrections,
        originalBlocks: textBlocks
      };

    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from image using Google Vision API
   */
  private async extractTextFromImage(imageBuffer: Buffer): Promise<{
    text: string;
    confidence: number;
    blocks: TextBlock[];
  }> {
    if (!this.googleVisionClient) {
      throw new Error('Google Vision client not initialized');
    }

    const [result] = await this.googleVisionClient.textDetection({
      image: { content: imageBuffer }
    });

    const detections = result.textAnnotations || [];
    
    if (detections.length === 0) {
      throw new Error('No text detected in image');
    }

    // First detection contains full text
    const fullText = detections[0].description || '';
    
    // Calculate average confidence from individual detections
    let totalConfidence = 0;
    let confidenceCount = 0;
    const blocks: TextBlock[] = [];

    // Skip first detection (full text) and process individual words/blocks
    for (let i = 1; i < detections.length; i++) {
      const detection = detections[i];
      if (detection.confidence !== undefined) {
        totalConfidence += detection.confidence;
        confidenceCount++;
      }

      // Extract bounding box information
      const vertices = detection.boundingPoly?.vertices || [];
      if (vertices.length >= 4) {
        blocks.push({
          text: detection.description || '',
          confidence: detection.confidence || 0,
          boundingBox: {
            x: vertices[0].x || 0,
            y: vertices[0].y || 0,
            width: (vertices[2].x || 0) - (vertices[0].x || 0),
            height: (vertices[2].y || 0) - (vertices[0].y || 0)
          }
        });
      }
    }

    const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.8;

    return {
      text: fullText,
      confidence: Math.round(averageConfidence * 100),
      blocks
    };
  }

  /**
   * Extract text from PDF
   */
  private async extractTextFromPDF(pdfBuffer: Buffer): Promise<{
    text: string;
    confidence: number;
    blocks: TextBlock[];
  }> {
    // For PDF processing, we can use pdf-parse or similar library
    // For now, implementing a basic version
    try {
      const pdf = await import('pdf-parse');
      const data = await pdf.default(pdfBuffer);
      
      return {
        text: data.text,
        confidence: 95, // PDFs typically have high confidence
        blocks: [] // Would extract block information from PDF structure
      };
    } catch (error) {
      console.error('PDF processing failed:', error);
      throw new Error('PDF processing not available');
    }
  }

  /**
   * Use OpenAI to correct OCR errors and improve text quality
   */
  private async correctExtractedText(rawText: string): Promise<{
    text: string;
    corrections: string[];
  }> {
    const prompt = `You are an expert at correcting OCR errors in handwritten UPSC exam answers. 

The following text was extracted from a handwritten answer using OCR. Please:

1. Correct obvious OCR errors (character recognition mistakes)
2. Fix common handwriting recognition issues
3. Maintain the original meaning and structure
4. Keep UPSC-specific terminology intact
5. Preserve paragraph breaks and formatting

RAW OCR TEXT:
${rawText}

Please respond with JSON:
{
  "correctedText": "The corrected version of the text",
  "corrections": ["List of specific corrections made", "e.g., 'Changed goverment to government'"]
}

Common OCR errors to look for:
- "rn" often misread as "m"
- "cl" misread as "d"  
- "li" misread as "h"
- Numbers confused with letters (1/I, 0/O)
- Common UPSC terms: constitution, parliament, governance, democracy
- Missing spaces between words
- Broken words across lines`;

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODELS.openai.gpt4,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2, // Low temperature for accuracy
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        text: result.correctedText || rawText,
        corrections: result.corrections || []
      };
    } catch (error) {
      console.error('Text correction failed:', error);
      return {
        text: rawText,
        corrections: ['AI correction failed, using raw OCR text']
      };
    }
  }

  /**
   * Validate and enhance extracted text quality
   */
  async validateTextQuality(text: string): Promise<{
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    issues: string[];
    suggestions: string[];
  }> {
    const prompt = `Analyze the quality of this extracted text from a handwritten UPSC answer:

TEXT: ${text}

Evaluate:
1. Readability and coherence
2. Completeness (are there obvious missing words/sentences?)
3. Grammar and structure
4. Technical term accuracy for UPSC context

Return JSON:
{
  "quality": "excellent|good|fair|poor",
  "readabilityScore": number (0-100),
  "issues": ["List of quality issues found"],
  "suggestions": ["Suggestions for manual review/correction"],
  "confidence": number (0-100)
}`;

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODELS.openai.gpt35Turbo,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        quality: result.quality || 'fair',
        issues: result.issues || [],
        suggestions: result.suggestions || []
      };
    } catch (error) {
      console.error('Text validation failed:', error);
      return {
        quality: 'fair',
        issues: ['Unable to validate text quality'],
        suggestions: ['Manual review recommended']
      };
    }
  }

  /**
   * Extract structured information from handwritten answer
   */
  async extractStructuredInfo(text: string): Promise<{
    introduction: string;
    mainPoints: string[];
    conclusion: string;
    keywords: string[];
    structure: 'excellent' | 'good' | 'poor';
  }> {
    const prompt = `Extract structured information from this UPSC answer:

ANSWER: ${text}

Identify and extract:
1. Introduction paragraph
2. Main body points/arguments
3. Conclusion paragraph  
4. Key terms and concepts used
5. Overall structural quality

Return JSON:
{
  "introduction": "Introduction text",
  "mainPoints": ["Point 1", "Point 2", "Point 3"],
  "conclusion": "Conclusion text",
  "keywords": ["keyword1", "keyword2"],
  "structure": "excellent|good|poor",
  "paragraphCount": number,
  "hasProperFlow": boolean
}`;

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODELS.openai.gpt4,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        introduction: result.introduction || '',
        mainPoints: result.mainPoints || [],
        conclusion: result.conclusion || '',
        keywords: result.keywords || [],
        structure: result.structure || 'good'
      };
    } catch (error) {
      console.error('Structure extraction failed:', error);
      return {
        introduction: '',
        mainPoints: [],
        conclusion: '',
        keywords: [],
        structure: 'poor'
      };
    }
  }
}

export type { OCRResult, TextBlock };