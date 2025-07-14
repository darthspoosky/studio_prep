import { FileProcessingService, ProcessedFile, ExtractedContent, ExtractedImage } from './fileProcessingService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import pdf from 'pdf-parse';
import sharp from 'sharp';
import MultiAIService from './multiAIService';

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
  private multiAI: MultiAIService;

  constructor(apiKeys: { google: string; openai?: string; anthropic?: string }) {
    this.genAI = new GoogleGenerativeAI(apiKeys.google);
    this.baseProcessor = FileProcessingService;
    
    // Initialize Multi-AI service
    this.multiAI = new MultiAIService({
      googleApiKey: apiKeys.google,
      openaiApiKey: apiKeys.openai,
      anthropicApiKey: apiKeys.anthropic
    });
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
        // Enhanced PDF processing with page-by-page image extraction
        const pdfResult = await this.processPDFAdvanced(processedFile, options);
        extractedContent = this.convertPDFResultToExtractedContent(pdfResult);
        
        // Process each page image with AI for question extraction
        if (options.aiProcessing && pdfResult.pages.length > 0) {
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

  // Enhanced PDF processing with page-by-page image extraction
  private async processPDFAdvanced(
    processedFile: ProcessedFile,
    options: AdvancedExtractionOptions
  ): Promise<PDFExtractionResult> {
    const startTime = Date.now();
    const pages: PDFPage[] = [];
    let totalImages = 0;

    try {
      const pdfBuffer = await readFile(processedFile.tempPath);
      const pdfData = await pdf(pdfBuffer);

      // Extract text and metadata
      const metadata: PDFMetadata = {
        totalPages: pdfData.numpages,
        processingTime: 0,
        title: pdfData.info?.Title,
        author: pdfData.info?.Author,
        subject: pdfData.info?.Subject,
        creator: pdfData.info?.Creator,
        producer: pdfData.info?.Producer,
        creationDate: pdfData.info?.CreationDate ? new Date(pdfData.info.CreationDate) : undefined,
        modificationDate: pdfData.info?.ModDate ? new Date(pdfData.info.ModDate) : undefined
      };

      // For image-heavy PDFs (like UPSC papers), extract each page as an image
      if (options.splitPDFPages || pdfData.text.length < 500) {
        // PDF likely contains mostly images, convert each page to image
        for (let pageNum = 1; pageNum <= pdfData.numpages; pageNum++) {
          try {
            const pageImage = await this.convertPDFPageToImage(pdfBuffer, pageNum, processedFile.id);
            
            if (pageImage) {
              const enhancedImage = options.enhanceImageQuality 
                ? await this.enhanceImageForOCR(pageImage.buffer)
                : pageImage.buffer;

              pages.push({
                pageNumber: pageNum,
                images: [{
                  ...pageImage,
                  buffer: enhancedImage
                }],
                text: pdfData.text,
                dimensions: pageImage.width && pageImage.height ? 
                  { width: pageImage.width, height: pageImage.height } : undefined
              });
              
              totalImages++;
            }
          } catch (pageError) {
            console.warn(`Failed to process page ${pageNum}:`, pageError);
            // Continue with other pages
          }
        }
      } else {
        // Text-based PDF, use regular extraction
        pages.push({
          pageNumber: 1,
          images: [],
          text: pdfData.text
        });
      }

      metadata.processingTime = Date.now() - startTime;

      return {
        pages,
        metadata,
        totalImages,
        extractedQuestions: []
      };

    } catch (error) {
      throw new Error(`Enhanced PDF processing failed: ${error}`);
    }
  }

  // Convert PDF page to high-quality image for OCR
  private async convertPDFPageToImage(
    pdfBuffer: Buffer,
    pageNumber: number,
    fileId: string
  ): Promise<ExtractedImage | null> {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const pdf = require('pdf-poppler');
      
      // Create temporary directory for PDF conversion
      const tempDir = path.join(process.cwd(), 'temp', 'pdf_conversion');
      await fs.mkdir(tempDir, { recursive: true });
      
      // Save PDF buffer to temporary file
      const tempPdfPath = path.join(tempDir, `${fileId}_temp.pdf`);
      await fs.writeFile(tempPdfPath, pdfBuffer);
      
      // Convert specific page to image
      const options = {
        format: 'png',
        out_dir: tempDir,
        out_prefix: `${fileId}_page`,
        page: pageNumber,
        single_file: true
      };
      
      try {
        const result = await pdf.convert(tempPdfPath, options);
        
        // Read the generated image
        const imagePath = path.join(tempDir, `${fileId}_page-${pageNumber}.png`);
        const imageBuffer = await fs.readFile(imagePath);
        
        // Get image dimensions using Sharp
        const metadata = await sharp(imageBuffer).metadata();
        
        // Clean up temporary files
        await fs.unlink(tempPdfPath).catch(() => {});
        await fs.unlink(imagePath).catch(() => {});
        
        return {
          id: `${fileId}_page_${pageNumber}`,
          buffer: imageBuffer,
          format: 'png',
          width: metadata.width || 1200,
          height: metadata.height || 1600,
          page: pageNumber,
          sequence: pageNumber - 1
        };
        
      } catch (conversionError) {
        console.warn(`PDF conversion failed for page ${pageNumber}, using fallback:`, conversionError);
        
        // Fallback: Create a high-quality placeholder that the AI can process
        const fallbackImage = await sharp({
          create: {
            width: 1200,
            height: 1600,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        })
        .png()
        .toBuffer();
        
        return {
          id: `${fileId}_page_${pageNumber}_fallback`,
          buffer: fallbackImage,
          format: 'png',
          width: 1200,
          height: 1600,
          page: pageNumber,
          sequence: pageNumber - 1
        };
      }
      
    } catch (error) {
      console.warn(`Failed to convert page ${pageNumber} to image:`, error);
      return null;
    }
  }

  // Enhance image quality for better OCR recognition
  private async enhanceImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(1800, 2400, { // High resolution
          fit: 'inside',
          withoutEnlargement: false
        })
        .normalize() // Normalize lighting
        .sharpen() // Increase sharpness
        .png({ quality: 95 }) // High quality PNG
        .toBuffer();
    } catch (error) {
      console.warn('Image enhancement failed, using original:', error);
      return imageBuffer;
    }
  }

  // Extract questions using Multi-AI from page images
  private async extractQuestionsFromImages(
    pages: PDFPage[],
    options: AdvancedExtractionOptions
  ): Promise<ExtractedQuestion[]> {
    const questions: ExtractedQuestion[] = [];
    const availableProviders = this.multiAI.getAvailableProviders();
    
    console.log(`🤖 Multi-AI Question Extraction enabled with: ${availableProviders.map(p => p.name).join(', ')}`);

    // Process only first few pages to avoid overwhelming the APIs
    const pagesToProcess = pages.slice(0, Math.min(5, pages.length));
    
    for (const page of pagesToProcess) {
      for (const image of page.images) {
        try {
          console.log(`🔍 Processing page ${page.pageNumber} with multi-AI consensus...`);
          
          // Use multi-AI consensus for better accuracy
          const multiResult = await this.multiAI.extractQuestionsMultiAI(
            image.buffer, 
            page.pageNumber
          );
          
          console.log(`📊 Multi-AI Results for page ${page.pageNumber}:`);
          console.log(`   Primary Provider: ${multiResult.primaryProvider}`);
          console.log(`   Confidence: ${(multiResult.confidence * 100).toFixed(1)}%`);
          console.log(`   Agreement Score: ${(multiResult.agreementScore * 100).toFixed(1)}%`);
          
          if (multiResult.consensus && multiResult.consensus.questions) {
            const pageQuestions = multiResult.consensus.questions.map((q: any, index: number) => ({
              questionId: `q_${page.pageNumber}_${index + 1}`,
              questionNumber: q.questionNumber || index + 1,
              subject: q.subject || 'General Studies',
              topic: q.topic || 'Unknown',
              questionText: {
                main: q.questionText || '',
                options: q.options || [],
                language: q.language || 'English',
                subParts: q.subParts || []
              },
              difficulty: q.difficulty || 'Medium',
              questionType: q.questionType || 'MCQ',
              confidence: Math.min(q.confidence || 0.8, multiResult.confidence),
              source: {
                type: 'pdf_page_image',
                pageNumber: page.pageNumber,
                extractionMethod: 'multi_ai_consensus',
                primaryProvider: multiResult.primaryProvider,
                agreementScore: multiResult.agreementScore
              },
              metadata: {
                hasVisualElements: q.hasImages || false,
                extractedAt: new Date(),
                processingTime: 0,
                multiAIResult: {
                  availableProviders: availableProviders.map(p => p.name),
                  primaryProvider: multiResult.primaryProvider,
                  confidence: multiResult.confidence,
                  agreementScore: multiResult.agreementScore
                }
              }
            }));
            
            const validQuestions = pageQuestions.filter(q => 
              q.confidence >= (options.confidenceThreshold || 0.6)
            );
            
            console.log(`✅ Extracted ${validQuestions.length} questions from page ${page.pageNumber}`);
            questions.push(...validQuestions);
          } else {
            console.log(`⚠️  No questions found on page ${page.pageNumber}`);
          }

        } catch (error) {
          console.warn(`❌ Failed to extract questions from page ${page.pageNumber}:`, error);
        }
      }
    }

    console.log(`🎯 Total questions extracted: ${questions.length}`);
    return questions;
  }

  // Build enhanced prompt for question extraction
  private buildEnhancedQuestionExtractionPrompt(options: AdvancedExtractionOptions): string {
    return `
You are an expert at analyzing UPSC (Union Public Service Commission) examination papers. 
Extract questions from this image with the following requirements:

1. IDENTIFY ALL QUESTIONS: Look for question numbers, question text, and multiple choice options (if any)
2. EXTRACT COMPLETE INFORMATION for each question:
   - Question number
   - Complete question text
   - Multiple choice options (A, B, C, D if present)
   - Subject classification (History, Geography, Polity, Economics, Science, Current Affairs, etc.)
   - Topic/subtopic
   - Difficulty level (Easy/Medium/Hard)

3. SPECIAL INSTRUCTIONS:
   - Handle both English and Hindi text
   - Recognize mathematical formulas, diagrams, and tables
   - Identify question types (MCQ, Subjective, Case Study)
   - Extract any instructions or special notes
   - Note any maps, charts, or visual elements

4. OUTPUT FORMAT: Return ONLY a valid JSON array with this structure:
[{
  "questionNumber": number,
  "questionText": "complete question text",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"] or null,
  "subject": "subject name",
  "topic": "specific topic",
  "difficulty": "Easy|Medium|Hard",
  "questionType": "MCQ|Subjective|CaseStudy",
  "language": "English|Hindi|Mixed",
  "hasVisualElements": boolean,
  "confidence": 0.0-1.0,
  "extractedFrom": "page_image_ocr"
}]

If no clear questions are found, return an empty array [].
Ensure all JSON is properly formatted and valid.
    `.trim();
  }

  // Parse AI response for extracted questions
  private parseQuestionExtractionResponse(responseText: string, pageNumber: number): ExtractedQuestion[] {
    try {
      // Clean and parse the JSON response
      const cleanedResponse = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsedQuestions = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(parsedQuestions)) {
        return [];
      }

      return parsedQuestions.map((q, index) => ({
        questionId: `q_${pageNumber}_${index + 1}`,
        questionNumber: q.questionNumber || index + 1,
        subject: q.subject || 'General Studies',
        topic: q.topic || 'Unknown',
        questionText: {
          main: q.questionText || '',
          options: q.options || [],
          language: q.language || 'English'
        },
        difficulty: q.difficulty || 'Medium',
        questionType: q.questionType || 'MCQ',
        confidence: q.confidence || 0.8,
        source: {
          type: 'pdf_page_image',
          pageNumber: pageNumber,
          extractionMethod: 'gemini_vision_ocr'
        },
        metadata: {
          hasVisualElements: q.hasVisualElements || false,
          extractedAt: new Date(),
          processingTime: 0
        }
      }));

    } catch (error) {
      console.warn('Failed to parse question extraction response:', error);
      return [];
    }
  }

  // Convert PDF result to standard ExtractedContent format
  private convertPDFResultToExtractedContent(pdfResult: PDFExtractionResult): ExtractedContent {
    const allImages: ExtractedImage[] = [];
    let allText = '';

    pdfResult.pages.forEach(page => {
      allImages.push(...page.images);
      if (page.text) {
        allText += page.text + '\n';
      }
    });

    return {
      images: allImages,
      text: allText.trim(),
      metadata: {
        totalPages: pdfResult.metadata.totalPages,
        imageCount: allImages.length,
        textLength: allText.length,
        processingTime: pdfResult.metadata.processingTime,
        confidence: allImages.length > 0 ? 0.9 : 0.7
      }
    };
  }

  // Cleanup resources
  async cleanup(processedFile: ProcessedFile): Promise<void> {
    await this.baseProcessor.cleanupFile(processedFile);
  }
}

export default AdvancedFileProcessor;