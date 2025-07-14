import { FileProcessingService, ProcessedFile, ExtractedContent, ExtractedImage } from './fileProcessingService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import * as pdf from 'pdf-parse';
import sharp from 'sharp';

// Enhanced interfaces for advanced processing
export interface AdvancedExtractionOptions {
  extractText?: boolean;
  extractImages?: boolean;
  enhanceImageQuality?: boolean;
  splitPDFPages?: boolean;
  aiProcessing?: boolean;
  outputFormat?: 'json' | 'structured';
  confidenceThreshold?: number;
}

export interface PDFExtractionResult {
  pages: PDFPage[];
  metadata: PDFMetadata;
  totalImages: number;
  extractedQuestions?: ExtractedQuestion[];
}

export interface PDFPage {
  pageNumber: number;
  images: ExtractedImage[];
  text?: string;
  dimensions?: { width: number; height: number };
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  totalPages: number;
  processingTime: number;
}

export interface ExtractedQuestion {
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
  pageNumber?: number;
  confidence: number;
}

export class AdvancedFileProcessor {
  private genAI: GoogleGenerativeAI;
  private baseProcessor: typeof FileProcessingService;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.baseProcessor = FileProcessingService;
  }

  // Main processing method for any file type
  async processFile(
    file: File | Buffer,
    options: AdvancedExtractionOptions = {}
  ): Promise<{
    processedFile: ProcessedFile;
    extractedContent: ExtractedContent;
    questions?: ExtractedQuestion[];
  }> {
    try {
      // Step 1: Basic file processing
      const processedFile = await this.baseProcessor.processFile(file, {
        extractImages: options.extractImages,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        preserveOriginal: true
      });

      // Step 2: Extract content based on file type
      let extractedContent: ExtractedContent;
      let questions: ExtractedQuestion[] | undefined;

      if (processedFile.format === 'pdf') {
        const pdfResult = await this.processPDFAdvanced(processedFile, options);
        extractedContent = this.convertPDFResultToExtractedContent(pdfResult);
        
        if (options.aiProcessing) {
          questions = await this.extractQuestionsFromImages(pdfResult.pages, options);
        }
      } else if (processedFile.format === 'image') {
        extractedContent = await this.baseProcessor.extractContent(processedFile, {
          extractImages: true
        });
        
        if (options.aiProcessing) {
          questions = await this.extractQuestionsFromImages(
            [{
              pageNumber: 1,
              images: extractedContent.images,
              text: extractedContent.text
            }],
            options
          );
        }
      } else {
        throw new Error(`Unsupported file format: ${processedFile.format}`);
      }

      return {
        processedFile,
        extractedContent,
        questions
      };
    } catch (error) {
      throw new Error(`Advanced file processing failed: ${error}`);
    }
  }

  // Advanced PDF processing with page-by-page extraction
  private async processPDFAdvanced(
    processedFile: ProcessedFile,
    options: AdvancedExtractionOptions
  ): Promise<PDFExtractionResult> {
    const startTime = Date.now();
    
    try {
      const pdfBuffer = await readFile(processedFile.tempPath);
      const pdfData = await pdf(pdfBuffer);

      const pages: PDFPage[] = [];
      let totalImages = 0;

      // For each page, extract images and text
      if (options.splitPDFPages) {
        // This would require a more sophisticated PDF library like pdf2pic
        // For now, we'll process the PDF as a whole
        const pageImages = await this.extractImagesFromPDF(pdfBuffer, options);
        
        for (let i = 0; i < pdfData.numpages; i++) {
          const pageImage = pageImages[i];
          if (pageImage) {
            const images = [pageImage];
            totalImages += images.length;
            
            pages.push({
              pageNumber: i + 1,
              images,
              text: options.extractText ? `Page ${i + 1} text` : undefined
            });
          }
        }
      } else {
        // Process entire PDF as single unit
        const allImages = await this.extractImagesFromPDF(pdfBuffer, options);
        totalImages = allImages.length;
        
        pages.push({
          pageNumber: 1,
          images: allImages,
          text: options.extractText ? pdfData.text : undefined
        });
      }

      const metadata: PDFMetadata = {
        title: pdfData.info?.Title,
        author: pdfData.info?.Author,
        subject: pdfData.info?.Subject,
        creator: pdfData.info?.Creator,
        producer: pdfData.info?.Producer,
        creationDate: pdfData.info?.CreationDate,
        modificationDate: pdfData.info?.ModDate,
        totalPages: pdfData.numpages,
        processingTime: Date.now() - startTime
      };

      return {
        pages,
        metadata,
        totalImages
      };
    } catch (error) {
      throw new Error(`PDF processing failed: ${error}`);
    }
  }

  // Extract images from PDF buffer
  private async extractImagesFromPDF(
    pdfBuffer: Buffer,
    options: AdvancedExtractionOptions
  ): Promise<ExtractedImage[]> {
    // This is a simplified implementation
    // In production, use pdf2pic or similar library for proper image extraction
    
    const images: ExtractedImage[] = [];
    
    try {
      // For demonstration, we'll create a single image from the PDF
      // In real implementation, this would extract actual embedded images
      const imageBuffer = await this.convertPDFPageToImage(pdfBuffer, 1);
      
      if (imageBuffer) {
        let processedBuffer = imageBuffer;
        
        // Enhance image quality if requested
        if (options.enhanceImageQuality) {
          processedBuffer = await this.enhanceImageQuality(imageBuffer);
        }
        
        images.push({
          id: `pdf_page_1`,
          buffer: processedBuffer,
          format: 'png',
          page: 1,
          sequence: 0
        });
      }
    } catch (error) {
      console.error('Failed to extract images from PDF:', error);
    }
    
    return images;
  }

  // Convert PDF page to image (placeholder implementation)
  private async convertPDFPageToImage(
    pdfBuffer: Buffer,
    pageNumber: number
  ): Promise<Buffer | null> {
    // This would use pdf2pic or similar library
    // For now, return null as placeholder
    return null;
  }

  // Enhance image quality using Sharp
  private async enhanceImageQuality(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(2000, 2000, { 
          fit: 'inside',
          withoutEnlargement: true
        })
        .sharpen()
        .jpeg({ quality: 95 })
        .toBuffer();
    } catch (error) {
      console.error('Image enhancement failed:', error);
      return imageBuffer;
    }
  }

  // Extract questions from images using AI
  private async extractQuestionsFromImages(
    pages: PDFPage[],
    options: AdvancedExtractionOptions
  ): Promise<ExtractedQuestion[]> {
    const allQuestions: ExtractedQuestion[] = [];
    
    for (const page of pages) {
      for (const image of page.images) {
        try {
          const questions = await this.processImageWithAI(image, page.pageNumber, options);
          allQuestions.push(...questions);
        } catch (error) {
          console.error(`Failed to process image from page ${page.pageNumber}:`, error);
        }
      }
    }
    
    return allQuestions;
  }

  // Process individual image with AI
  private async processImageWithAI(
    image: ExtractedImage,
    pageNumber: number,
    options: AdvancedExtractionOptions
  ): Promise<ExtractedQuestion[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = this.buildExtractionPrompt(options);
      
      const imagePart = {
        inlineData: {
          data: image.buffer.toString('base64'),
          mimeType: `image/${image.format}`
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      // Parse AI response
      const extractedData = this.parseAIResponse(text);
      
      // Add page number and confidence filtering
      const questions = extractedData.questions
        .filter((q: any) => q.confidence >= (options.confidenceThreshold || 0.7))
        .map((q: any, index: number) => ({
          ...q,
          pageNumber,
          questionId: q.questionId || `P${pageNumber}_Q${index + 1}`
        }));
      
      return questions;
    } catch (error) {
      console.error('AI processing failed:', error);
      return [];
    }
  }

  // Build extraction prompt based on options
  private buildExtractionPrompt(options: AdvancedExtractionOptions): string {
    return `
You are an expert at extracting questions from examination papers. Analyze the provided image and extract all visible questions with their options.

EXTRACTION REQUIREMENTS:
1. Extract ALL visible questions from the image
2. Maintain exact text from the image
3. Extract both English and Hindi text if present
4. Number questions sequentially
5. Classify questions by subject (history/geography/polity/economics/science/environment/current_affairs/ethics/governance)
6. Include answer keys if visible
7. Assign confidence score (0-1) for each question

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "questionId": "Q001",
      "questionNumber": 1,
      "subject": "subject_classification",
      "topic": "specific_topic",
      "questionText": {
        "english": "exact english text",
        "hindi": "exact hindi text if present"
      },
      "options": {
        "a": {"english": "option A", "hindi": "hindi if present"},
        "b": {"english": "option B", "hindi": "hindi if present"},
        "c": {"english": "option C", "hindi": "hindi if present"},
        "d": {"english": "option D", "hindi": "hindi if present"}
      },
      "correctAnswer": "a/b/c/d if visible",
      "explanation": "explanation if provided",
      "difficulty": "easy/medium/hard",
      "confidence": 0.95
    }
  ]
}

Analyze the image and extract all questions following this format exactly.
`;
  }

  // Parse AI response with error handling
  private parseAIResponse(text: string): { questions: any[] } {
    try {
      let jsonText = text;
      
      // Handle markdown code blocks
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
      
      const parsed = JSON.parse(jsonText);
      return parsed;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return { questions: [] };
    }
  }

  // Convert PDF result to standard ExtractedContent format
  private convertPDFResultToExtractedContent(pdfResult: PDFExtractionResult): ExtractedContent {
    const allImages = pdfResult.pages.flatMap(page => page.images);
    const allText = pdfResult.pages.map(page => page.text).filter(Boolean).join('\n');
    
    return {
      images: allImages,
      text: allText || undefined,
      metadata: {
        totalPages: pdfResult.metadata.totalPages,
        imageCount: pdfResult.totalImages,
        textLength: allText.length,
        processingTime: pdfResult.metadata.processingTime,
        confidence: 0.9
      }
    };
  }

  // Cleanup resources
  async cleanup(processedFile: ProcessedFile): Promise<void> {
    await this.baseProcessor.cleanupFile(processedFile);
  }
}

export default AdvancedFileProcessor;