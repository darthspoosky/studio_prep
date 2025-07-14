import { writeFile, unlink, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';
import * as pdf from 'pdf-parse';

// File processing types
export interface FileProcessingOptions {
  extractImages?: boolean;
  maxFileSize?: number;
  supportedFormats?: string[];
  preserveOriginal?: boolean;
  tempDir?: string;
}

export interface ProcessedFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  format: FileFormat;
  tempPath: string;
  processedAt: Date;
  metadata?: Record<string, any>;
}

export interface ExtractedContent {
  images: ExtractedImage[];
  text?: string;
  metadata: ContentMetadata;
}

export interface ExtractedImage {
  id: string;
  buffer: Buffer;
  format: string;
  width?: number;
  height?: number;
  page?: number;
  sequence: number;
}

export interface ContentMetadata {
  totalPages?: number;
  imageCount: number;
  textLength?: number;
  processingTime: number;
  confidence: number;
}

export type FileFormat = 'pdf' | 'image' | 'document' | 'unknown';

export class FileProcessingService {
  private static readonly DEFAULT_TEMP_DIR = join(process.cwd(), 'temp');
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly SUPPORTED_IMAGE_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
  ];
  private static readonly SUPPORTED_PDF_TYPES = [
    'application/pdf'
  ];

  // Initialize temp directory
  static async initializeTempDirectory(tempDir?: string): Promise<string> {
    const dir = tempDir || this.DEFAULT_TEMP_DIR;
    
    try {
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      return dir;
    } catch (error) {
      throw new Error(`Failed to initialize temp directory: ${error}`);
    }
  }

  // Main file processing entry point
  static async processFile(
    file: File | Buffer,
    options: FileProcessingOptions = {}
  ): Promise<ProcessedFile> {
    const startTime = Date.now();
    
    try {
      // Initialize temp directory
      const tempDir = await this.initializeTempDirectory(options.tempDir);
      
      // Handle different input types
      let fileBuffer: Buffer;
      let fileName: string;
      let mimeType: string;
      
      if (file instanceof File) {
        fileName = file.name;
        mimeType = file.type;
        fileBuffer = Buffer.from(await file.arrayBuffer());
      } else {
        fileName = `processed_${uuidv4()}`;
        mimeType = this.detectMimeType(file);
        fileBuffer = file;
      }

      // Validate file
      this.validateFile(fileBuffer, mimeType, options);

      // Generate unique ID and temp path
      const fileId = uuidv4();
      const tempPath = join(tempDir, `${fileId}-${fileName}`);

      // Save to temp directory
      await writeFile(tempPath, fileBuffer);

      // Determine file format
      const format = this.determineFileFormat(mimeType);

      const processedFile: ProcessedFile = {
        id: fileId,
        originalName: fileName,
        mimeType,
        size: fileBuffer.length,
        format,
        tempPath,
        processedAt: new Date(),
        metadata: {
          processingTime: Date.now() - startTime
        }
      };

      return processedFile;
    } catch (error) {
      throw new Error(`File processing failed: ${error}`);
    }
  }

  // Extract content from processed file
  static async extractContent(
    processedFile: ProcessedFile,
    options: FileProcessingOptions = {}
  ): Promise<ExtractedContent> {
    const startTime = Date.now();
    
    try {
      switch (processedFile.format) {
        case 'pdf':
          return await this.extractFromPDF(processedFile, options);
        case 'image':
          return await this.extractFromImage(processedFile, options);
        default:
          throw new Error(`Unsupported file format: ${processedFile.format}`);
      }
    } catch (error) {
      throw new Error(`Content extraction failed: ${error}`);
    }
  }

  // Extract images from PDF
  private static async extractFromPDF(
    processedFile: ProcessedFile,
    options: FileProcessingOptions
  ): Promise<ExtractedContent> {
    const startTime = Date.now();
    
    try {
      const pdfBuffer = await readFile(processedFile.tempPath);
      const pdfData = await pdf(pdfBuffer, {
        // Custom render function to extract images
        render_page: async (pageData: any) => {
          return pageData.getTextContent();
        }
      });

      const images: ExtractedImage[] = [];
      let imageSequence = 0;

      // Extract images from PDF using pdf-parse
      // Note: This is a simplified approach - for production, consider using pdf2pic or similar
      if (options.extractImages) {
        // For now, we'll extract the entire PDF as images using conversion
        const pdfImages = await this.convertPDFToImages(pdfBuffer);
        
        for (const [pageIndex, imageBuffer] of pdfImages.entries()) {
          images.push({
            id: `${processedFile.id}_page_${pageIndex + 1}`,
            buffer: imageBuffer,
            format: 'png',
            page: pageIndex + 1,
            sequence: imageSequence++
          });
        }
      }

      return {
        images,
        text: pdfData.text,
        metadata: {
          totalPages: pdfData.numpages,
          imageCount: images.length,
          textLength: pdfData.text.length,
          processingTime: Date.now() - startTime,
          confidence: 0.95
        }
      };
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error}`);
    }
  }

  // Extract from image file
  private static async extractFromImage(
    processedFile: ProcessedFile,
    options: FileProcessingOptions
  ): Promise<ExtractedContent> {
    const startTime = Date.now();
    
    try {
      const imageBuffer = await readFile(processedFile.tempPath);
      
      const extractedImage: ExtractedImage = {
        id: processedFile.id,
        buffer: imageBuffer,
        format: processedFile.mimeType.split('/')[1],
        sequence: 0
      };

      return {
        images: [extractedImage],
        metadata: {
          imageCount: 1,
          processingTime: Date.now() - startTime,
          confidence: 1.0
        }
      };
    } catch (error) {
      throw new Error(`Image extraction failed: ${error}`);
    }
  }

  // Convert PDF to images (simplified implementation)
  private static async convertPDFToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
    // This is a placeholder - in production, use pdf2pic or similar library
    // For now, we'll return the PDF as a single "image" for processing
    return [pdfBuffer];
  }

  // Validate file constraints
  private static validateFile(
    buffer: Buffer,
    mimeType: string,
    options: FileProcessingOptions
  ): void {
    const maxSize = options.maxFileSize || this.MAX_FILE_SIZE;
    const supportedFormats = options.supportedFormats || [
      ...this.SUPPORTED_IMAGE_TYPES,
      ...this.SUPPORTED_PDF_TYPES
    ];

    if (buffer.length > maxSize) {
      throw new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }

    if (!supportedFormats.includes(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  }

  // Detect MIME type from buffer
  private static detectMimeType(buffer: Buffer): string {
    // Simple magic number detection
    const header = buffer.slice(0, 10);
    
    if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
      return 'application/pdf';
    }
    
    if (header[0] === 0xFF && header[1] === 0xD8) {
      return 'image/jpeg';
    }
    
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      return 'image/png';
    }
    
    return 'application/octet-stream';
  }

  // Determine file format category
  private static determineFileFormat(mimeType: string): FileFormat {
    if (this.SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
      return 'image';
    }
    
    if (this.SUPPORTED_PDF_TYPES.includes(mimeType)) {
      return 'pdf';
    }
    
    return 'unknown';
  }

  // Cleanup temporary files
  static async cleanupFile(processedFile: ProcessedFile): Promise<void> {
    try {
      if (existsSync(processedFile.tempPath)) {
        await unlink(processedFile.tempPath);
      }
    } catch (error) {
      console.error('Failed to cleanup temporary file:', error);
    }
  }

  // Batch cleanup
  static async cleanupFiles(processedFiles: ProcessedFile[]): Promise<void> {
    const cleanupPromises = processedFiles.map(file => this.cleanupFile(file));
    await Promise.all(cleanupPromises);
  }

  // Get file info without processing
  static getFileInfo(file: File): {
    name: string;
    size: number;
    type: string;
    format: FileFormat;
    isSupported: boolean;
  } {
    const format = this.determineFileFormat(file.type);
    const supportedTypes = [...this.SUPPORTED_IMAGE_TYPES, ...this.SUPPORTED_PDF_TYPES];
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      format,
      isSupported: supportedTypes.includes(file.type)
    };
  }
}

// Utility functions for common operations
export class FileUtils {
  // Convert bytes to human readable format
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if file is PDF
  static isPDF(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  // Check if file is image
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  // Generate unique filename
  static generateFileName(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const baseName = originalName.split('.').slice(0, -1).join('.');
    
    return `${prefix ? prefix + '_' : ''}${baseName}_${timestamp}_${random}.${extension}`;
  }
}

export default FileProcessingService;