import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { QuestionBankService, PrelimsQuestion, MainsQuestion, UploadBatch } from './questionBankService';
import * as XLSX from 'xlsx';

// File upload types
export type SupportedFileType = 'excel' | 'csv' | 'json';

export interface FileUploadResult {
  success: boolean;
  batchId?: string;
  message: string;
  errors?: string[];
  stats?: {
    totalRecords: number;
    processedRecords: number;
    successfulRecords: number;
    failedRecords: number;
  };
}

export interface QuestionUploadData {
  examType: 'Prelims' | 'Mains';
  year: number;
  paper?: string;
  questions: (Partial<PrelimsQuestion> | Partial<MainsQuestion>)[];
}

// Excel column mappings
export const PRELIMS_EXCEL_COLUMNS = {
  'Question ID': 'questionId',
  'Question': 'question',
  'Question Type': 'questionType',
  'Option A': 'options.A',
  'Option B': 'options.B',
  'Option C': 'options.C',
  'Option D': 'options.D',
  'Correct Answer': 'correctAnswer',
  'Explanation': 'explanation',
  'Year': 'year',
  'Paper': 'paper',
  'Question Number': 'questionNumber',
  'Subject': 'subject',
  'Subtopics': 'subtopics',
  'Syllabus Topic': 'syllabusTopic',
  'Difficulty Level': 'difficultyLevel',
  'Concept Level': 'conceptLevel',
  'Source': 'source',
  'Verified': 'verified',
  'Image URLs': 'imageUrls',
  'References': 'references'
};

export const MAINS_EXCEL_COLUMNS = {
  'Question ID': 'questionId',
  'Question': 'question',
  'Question Type': 'questionType',
  'Sub Parts': 'subParts',
  'Year': 'year',
  'Paper': 'paper',
  'Question Number': 'questionNumber',
  'Total Marks': 'totalMarks',
  'Time Allocation': 'timeAllocation',
  'Subject': 'subject',
  'Subtopics': 'subtopics',
  'Syllabus Topic': 'syllabusTopic',
  'Difficulty Level': 'difficultyLevel',
  'Concept Level': 'conceptLevel',
  'Expected Approach': 'expectedApproach',
  'Key Points': 'keyPoints',
  'Common Mistakes': 'commonMistakes',
  'Current Affairs Topics': 'currentAffairsTopics',
  'Practice Level': 'practiceLevel'
};

export class QuestionUploadService {
  
  // === FILE UPLOAD HANDLING ===
  
  static async uploadFile(
    file: File,
    examType: 'Prelims' | 'Mains',
    userId: string,
    year: number,
    paper?: string
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message || 'Invalid file',
          errors: validation.errors
        };
      }
      
      // Create upload batch record
      const batchId = await this.createUploadBatch(file.name, userId, examType, year, paper);
      
      // Upload file to storage
      const storageRef = ref(storage, `question-uploads/${batchId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Process file based on type
      const fileType = this.getFileType(file.name);
      let result: FileUploadResult;
      
      switch (fileType) {
        case 'excel':
          result = await this.processExcelFile(file, examType, userId, batchId);
          break;
        case 'csv':
          result = await this.processCsvFile(file, examType, userId, batchId);
          break;
        case 'json':
          result = await this.processJsonFile(file, examType, userId, batchId);
          break;
        default:
          result = {
            success: false,
            message: 'Unsupported file type',
          };
      }
      
      // Update batch with results
      await this.updateUploadBatch(batchId, result);
      
      // Clean up storage file
      await deleteObject(storageRef);
      
      return {
        ...result,
        batchId
      };
      
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }
  
  // === FILE VALIDATION ===
  
  static validateFile(file: File): { valid: boolean; message?: string; errors?: string[] } {
    const errors: string[] = [];
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      errors.push('File size exceeds 50MB limit');
    }
    
    // Check file type
    const fileType = this.getFileType(file.name);
    if (!fileType) {
      errors.push('Unsupported file type. Supported: .xlsx, .xls, .csv, .json');
    }
    
    // Check file name
    if (!file.name || file.name.length === 0) {
      errors.push('Invalid file name');
    }
    
    return {
      valid: errors.length === 0,
      message: errors.length > 0 ? errors.join(', ') : undefined,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  static getFileType(fileName: string): SupportedFileType | null {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'xlsx':
      case 'xls':
        return 'excel';
      case 'csv':
        return 'csv';
      case 'json':
        return 'json';
      default:
        return null;
    }
  }
  
  // === FILE PROCESSING ===
  
  static async processExcelFile(
    file: File,
    examType: 'Prelims' | 'Mains',
    userId: string,
    batchId: string
  ): Promise<FileUploadResult> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet);
      
      // Validate and transform data
      const columnMapping = examType === 'Prelims' ? PRELIMS_EXCEL_COLUMNS : MAINS_EXCEL_COLUMNS;
      const questions = this.transformExcelData(rawData, columnMapping, examType);
      
      // Validate questions
      const validation = this.validateQuestions(questions, examType);
      if (!validation.valid) {
        return {
          success: false,
          message: 'Data validation failed',
          errors: validation.errors
        };
      }
      
      // Import questions
      if (examType === 'Prelims') {
        const result = await QuestionBankService.bulkImportPrelimsQuestions(
          questions as Omit<PrelimsQuestion, 'id' | 'createdAt' | 'updatedAt'>[],
          userId
        );
        
        return {
          success: result.failed.length === 0,
          message: `Import completed. ${result.successful.length} successful, ${result.failed.length} failed`,
          stats: {
            totalRecords: questions.length,
            processedRecords: questions.length,
            successfulRecords: result.successful.length,
            failedRecords: result.failed.length
          }
        };
      } else {
        const result = await QuestionBankService.bulkImportMainsQuestions(
          questions as Omit<MainsQuestion, 'id' | 'createdAt' | 'updatedAt'>[],
          userId
        );
        
        return {
          success: result.failed.length === 0,
          message: `Import completed. ${result.successful.length} successful, ${result.failed.length} failed`,
          stats: {
            totalRecords: questions.length,
            processedRecords: questions.length,
            successfulRecords: result.successful.length,
            failedRecords: result.failed.length
          }
        };
      }
      
    } catch (error) {
      console.error('Error processing Excel file:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Excel processing failed'
      };
    }
  }
  
  static async processCsvFile(
    file: File,
    examType: 'Prelims' | 'Mains',
    userId: string,
    batchId: string
  ): Promise<FileUploadResult> {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const rawData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      }).filter(row => Object.values(row).some(v => v !== ''));
      
      // Transform and validate similar to Excel
      const columnMapping = examType === 'Prelims' ? PRELIMS_EXCEL_COLUMNS : MAINS_EXCEL_COLUMNS;
      const questions = this.transformExcelData(rawData, columnMapping, examType);
      
      const validation = this.validateQuestions(questions, examType);
      if (!validation.valid) {
        return {
          success: false,
          message: 'Data validation failed',
          errors: validation.errors
        };
      }
      
      // Import questions (similar to Excel processing)
      if (examType === 'Prelims') {
        const result = await QuestionBankService.bulkImportPrelimsQuestions(
          questions as Omit<PrelimsQuestion, 'id' | 'createdAt' | 'updatedAt'>[],
          userId
        );
        
        return {
          success: result.failed.length === 0,
          message: `Import completed. ${result.successful.length} successful, ${result.failed.length} failed`,
          stats: {
            totalRecords: questions.length,
            processedRecords: questions.length,
            successfulRecords: result.successful.length,
            failedRecords: result.failed.length
          }
        };
      } else {
        const result = await QuestionBankService.bulkImportMainsQuestions(
          questions as Omit<MainsQuestion, 'id' | 'createdAt' | 'updatedAt'>[],
          userId
        );
        
        return {
          success: result.failed.length === 0,
          message: `Import completed. ${result.successful.length} successful, ${result.failed.length} failed`,
          stats: {
            totalRecords: questions.length,
            processedRecords: questions.length,
            successfulRecords: result.successful.length,
            failedRecords: result.failed.length
          }
        };
      }
      
    } catch (error) {
      console.error('Error processing CSV file:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'CSV processing failed'
      };
    }
  }
  
  static async processJsonFile(
    file: File,
    examType: 'Prelims' | 'Mains',
    userId: string,
    batchId: string
  ): Promise<FileUploadResult> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate JSON structure
      if (!Array.isArray(data)) {
        return {
          success: false,
          message: 'JSON file must contain an array of questions'
        };
      }
      
      const validation = this.validateQuestions(data, examType);
      if (!validation.valid) {
        return {
          success: false,
          message: 'Data validation failed',
          errors: validation.errors
        };
      }
      
      // Import questions
      if (examType === 'Prelims') {
        const result = await QuestionBankService.bulkImportPrelimsQuestions(
          data as Omit<PrelimsQuestion, 'id' | 'createdAt' | 'updatedAt'>[],
          userId
        );
        
        return {
          success: result.failed.length === 0,
          message: `Import completed. ${result.successful.length} successful, ${result.failed.length} failed`,
          stats: {
            totalRecords: data.length,
            processedRecords: data.length,
            successfulRecords: result.successful.length,
            failedRecords: result.failed.length
          }
        };
      } else {
        const result = await QuestionBankService.bulkImportMainsQuestions(
          data as Omit<MainsQuestion, 'id' | 'createdAt' | 'updatedAt'>[],
          userId
        );
        
        return {
          success: result.failed.length === 0,
          message: `Import completed. ${result.successful.length} successful, ${result.failed.length} failed`,
          stats: {
            totalRecords: data.length,
            processedRecords: data.length,
            successfulRecords: result.successful.length,
            failedRecords: result.failed.length
          }
        };
      }
      
    } catch (error) {
      console.error('Error processing JSON file:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'JSON processing failed'
      };
    }
  }
  
  // === DATA TRANSFORMATION ===
  
  static transformExcelData(
    rawData: any[],
    columnMapping: Record<string, string>,
    examType: 'Prelims' | 'Mains'
  ): any[] {
    return rawData.map(row => {
      const transformed: any = {};
      
      // Map columns
      Object.entries(columnMapping).forEach(([excelColumn, objectPath]) => {
        const value = row[excelColumn];
        if (value !== undefined && value !== '') {
          this.setNestedProperty(transformed, objectPath, value);
        }
      });
      
      // Set default values
      transformed.attemptCount = 0;
      transformed.correctAttempts = 0;
      transformed.averageTime = 0;
      transformed.successRate = 0;
      transformed.isActive = true;
      transformed.verified = transformed.verified === 'true' || transformed.verified === true;
      
      // Parse arrays
      if (transformed.subject && typeof transformed.subject === 'string') {
        transformed.subject = transformed.subject.split(',').map((s: string) => s.trim());
      }
      if (transformed.subtopics && typeof transformed.subtopics === 'string') {
        transformed.subtopics = transformed.subtopics.split(',').map((s: string) => s.trim());
      }
      if (transformed.syllabusTopic && typeof transformed.syllabusTopic === 'string') {
        transformed.syllabusTopic = transformed.syllabusTopic.split(',').map((s: string) => s.trim());
      }
      
      // Parse options for Prelims
      if (examType === 'Prelims') {
        if (transformed.correctAnswer && typeof transformed.correctAnswer === 'string') {
          transformed.correctAnswer = transformed.correctAnswer.split(',').map((s: string) => s.trim());
        }
      }
      
      // Parse sub parts for Mains
      if (examType === 'Mains' && transformed.subParts && typeof transformed.subParts === 'string') {
        try {
          transformed.subParts = JSON.parse(transformed.subParts);
        } catch {
          transformed.subParts = [];
        }
      }
      
      return transformed;
    });
  }
  
  static setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }
  
  // === VALIDATION ===
  
  static validateQuestions(
    questions: any[],
    examType: 'Prelims' | 'Mains'
  ): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    questions.forEach((question, index) => {
      // Common validations
      if (!question.question || question.question.trim() === '') {
        errors.push(`Row ${index + 1}: Question text is required`);
      }
      
      if (!question.year || !Number.isInteger(question.year)) {
        errors.push(`Row ${index + 1}: Valid year is required`);
      }
      
      if (!question.paper) {
        errors.push(`Row ${index + 1}: Paper is required`);
      }
      
      if (examType === 'Prelims') {
        // Prelims specific validations
        if (!question.options?.A || !question.options?.B || !question.options?.C || !question.options?.D) {
          errors.push(`Row ${index + 1}: All four options (A, B, C, D) are required`);
        }
        
        if (!question.correctAnswer || !Array.isArray(question.correctAnswer) || question.correctAnswer.length === 0) {
          errors.push(`Row ${index + 1}: Correct answer is required`);
        }
      } else {
        // Mains specific validations
        if (!question.totalMarks || !Number.isInteger(question.totalMarks)) {
          errors.push(`Row ${index + 1}: Total marks is required`);
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  // === BATCH MANAGEMENT ===
  
  static async createUploadBatch(
    fileName: string,
    uploadedBy: string,
    examType: 'Prelims' | 'Mains',
    year: number,
    paper?: string
  ): Promise<string> {
    try {
      const batchRef = doc(collection(db, 'upload_batches'));
      const now = serverTimestamp();
      
      const batch: UploadBatch = {
        id: batchRef.id,
        fileName,
        uploadedBy,
        uploadedAt: now as Timestamp,
        status: 'Processing',
        examType,
        year,
        paper,
        stats: {
          totalRecords: 0,
          processedRecords: 0,
          successfulRecords: 0,
          failedRecords: 0
        },
        errors: [],
        validation: {
          duplicateQuestions: [],
          missingFields: [],
          formatErrors: []
        },
        processingLog: [{
          timestamp: now as Timestamp,
          action: 'Batch Created',
          details: `Upload started for ${fileName}`
        }]
      };
      
      await setDoc(batchRef, batch);
      return batchRef.id;
    } catch (error) {
      console.error('Error creating upload batch:', error);
      throw error;
    }
  }
  
  static async updateUploadBatch(batchId: string, result: FileUploadResult): Promise<void> {
    try {
      const batchRef = doc(db, 'upload_batches', batchId);
      
      await updateDoc(batchRef, {
        status: result.success ? 'Completed' : 'Failed',
        stats: result.stats || {
          totalRecords: 0,
          processedRecords: 0,
          successfulRecords: 0,
          failedRecords: 0
        },
        errors: result.errors || [],
        processingLog: [{
          timestamp: serverTimestamp(),
          action: 'Processing Completed',
          details: result.message
        }]
      });
    } catch (error) {
      console.error('Error updating upload batch:', error);
      throw error;
    }
  }
}

export default QuestionUploadService;