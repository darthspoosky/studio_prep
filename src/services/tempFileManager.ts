import { writeFile, unlink, mkdir, readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface TempFileInfo {
  id: string;
  path: string;
  originalName: string;
  size: number;
  createdAt: Date;
  expiresAt: Date;
  mimeType: string;
  metadata?: Record<string, any>;
}

export interface TempFileOptions {
  ttl?: number; // Time to live in milliseconds
  prefix?: string;
  extension?: string;
  maxSize?: number;
  compress?: boolean;
}

export class TempFileManager {
  private static instance: TempFileManager;
  private tempDir: string;
  private files: Map<string, TempFileInfo> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private constructor(tempDir?: string) {
    this.tempDir = tempDir || join(process.cwd(), 'temp');
    this.startCleanupScheduler();
  }

  static getInstance(tempDir?: string): TempFileManager {
    if (!TempFileManager.instance) {
      TempFileManager.instance = new TempFileManager(tempDir);
    }
    return TempFileManager.instance;
  }

  // Initialize temp directory and start cleanup scheduler
  async initialize(): Promise<void> {
    try {
      await this.ensureTempDirectory();
      await this.loadExistingFiles();
      console.log(`TempFileManager initialized with directory: ${this.tempDir}`);
    } catch (error) {
      throw new Error(`Failed to initialize TempFileManager: ${error}`);
    }
  }

  // Create temporary file from buffer
  async createTempFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    options: TempFileOptions = {}
  ): Promise<TempFileInfo> {
    try {
      await this.ensureTempDirectory();

      // Validate file size
      const maxSize = options.maxSize || this.MAX_FILE_SIZE;
      if (buffer.length > maxSize) {
        throw new Error(`File too large: ${buffer.length} bytes (max: ${maxSize})`);
      }

      // Generate unique file info
      const id = uuidv4();
      const ttl = options.ttl || this.DEFAULT_TTL;
      const extension = options.extension || this.extractExtension(originalName);
      const prefix = options.prefix || 'temp';
      
      const filename = `${prefix}_${id}${extension ? '.' + extension : ''}`;
      const filePath = join(this.tempDir, filename);

      // Create file info
      const fileInfo: TempFileInfo = {
        id,
        path: filePath,
        originalName,
        size: buffer.length,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + ttl),
        mimeType,
        metadata: options.compress ? { compressed: true } : undefined
      };

      // Write file to disk
      await writeFile(filePath, buffer);

      // Store in memory map
      this.files.set(id, fileInfo);

      return fileInfo;
    } catch (error) {
      throw new Error(`Failed to create temp file: ${error}`);
    }
  }

  // Create temporary file from File object
  async createTempFileFromFile(
    file: File,
    options: TempFileOptions = {}
  ): Promise<TempFileInfo> {
    const buffer = Buffer.from(await file.arrayBuffer());
    return this.createTempFile(buffer, file.name, file.type, options);
  }

  // Get temp file info
  getTempFile(id: string): TempFileInfo | null {
    const fileInfo = this.files.get(id);
    
    if (!fileInfo) {
      return null;
    }

    // Check if file has expired
    if (fileInfo.expiresAt < new Date()) {
      this.deleteTempFile(id);
      return null;
    }

    return fileInfo;
  }

  // Read temp file content
  async readTempFile(id: string): Promise<Buffer | null> {
    const fileInfo = this.getTempFile(id);
    
    if (!fileInfo) {
      return null;
    }

    try {
      const content = await readFile(fileInfo.path);
      return content;
    } catch (error) {
      console.error(`Failed to read temp file ${id}:`, error);
      this.deleteTempFile(id);
      return null;
    }
  }

  // Delete specific temp file
  async deleteTempFile(id: string): Promise<boolean> {
    const fileInfo = this.files.get(id);
    
    if (!fileInfo) {
      return false;
    }

    try {
      // Remove from filesystem
      if (existsSync(fileInfo.path)) {
        await unlink(fileInfo.path);
      }

      // Remove from memory
      this.files.delete(id);
      
      return true;
    } catch (error) {
      console.error(`Failed to delete temp file ${id}:`, error);
      return false;
    }
  }

  // Get all temp files
  getAllTempFiles(): TempFileInfo[] {
    return Array.from(this.files.values());
  }

  // Get temp files by criteria
  getTempFilesByFilter(filter: (file: TempFileInfo) => boolean): TempFileInfo[] {
    return this.getAllTempFiles().filter(filter);
  }

  // Get expired files
  getExpiredFiles(): TempFileInfo[] {
    const now = new Date();
    return this.getAllTempFiles().filter(file => file.expiresAt < now);
  }

  // Extend file TTL
  async extendTTL(id: string, additionalTTL: number): Promise<boolean> {
    const fileInfo = this.files.get(id);
    
    if (!fileInfo) {
      return false;
    }

    fileInfo.expiresAt = new Date(fileInfo.expiresAt.getTime() + additionalTTL);
    return true;
  }

  // Clean up expired files
  async cleanupExpired(): Promise<number> {
    const expiredFiles = this.getExpiredFiles();
    let cleanedCount = 0;

    for (const file of expiredFiles) {
      const deleted = await this.deleteTempFile(file.id);
      if (deleted) {
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // Clean up all temp files
  async cleanupAll(): Promise<number> {
    const allFiles = this.getAllTempFiles();
    let cleanedCount = 0;

    for (const file of allFiles) {
      const deleted = await this.deleteTempFile(file.id);
      if (deleted) {
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    expiredFiles: number;
    averageAge: number;
    oldestFile?: TempFileInfo;
    largestFile?: TempFileInfo;
  }> {
    const files = this.getAllTempFiles();
    const expiredFiles = this.getExpiredFiles();
    const now = new Date();
    
    let totalSize = 0;
    let totalAge = 0;
    let oldestFile: TempFileInfo | undefined;
    let largestFile: TempFileInfo | undefined;

    for (const file of files) {
      totalSize += file.size;
      const age = now.getTime() - file.createdAt.getTime();
      totalAge += age;

      if (!oldestFile || file.createdAt < oldestFile.createdAt) {
        oldestFile = file;
      }

      if (!largestFile || file.size > largestFile.size) {
        largestFile = file;
      }
    }

    return {
      totalFiles: files.length,
      totalSize,
      expiredFiles: expiredFiles.length,
      averageAge: files.length > 0 ? totalAge / files.length : 0,
      oldestFile,
      largestFile
    };
  }

  // Start automatic cleanup scheduler
  private startCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        const cleaned = await this.cleanupExpired();
        if (cleaned > 0) {
          console.log(`Cleaned up ${cleaned} expired temp files`);
        }
      } catch (error) {
        console.error('Error during scheduled cleanup:', error);
      }
    }, this.CLEANUP_INTERVAL);
  }

  // Stop cleanup scheduler
  stopCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Ensure temp directory exists
  private async ensureTempDirectory(): Promise<void> {
    try {
      if (!existsSync(this.tempDir)) {
        await mkdir(this.tempDir, { recursive: true });
      }
    } catch (error) {
      throw new Error(`Failed to create temp directory: ${error}`);
    }
  }

  // Load existing files from filesystem
  private async loadExistingFiles(): Promise<void> {
    try {
      if (!existsSync(this.tempDir)) {
        return;
      }

      const files = await readdir(this.tempDir);
      
      for (const filename of files) {
        const filePath = join(this.tempDir, filename);
        const stats = await stat(filePath);
        
        // Skip directories
        if (stats.isDirectory()) {
          continue;
        }

        // Create file info from existing file
        const id = this.extractIdFromFilename(filename);
        if (id) {
          const fileInfo: TempFileInfo = {
            id,
            path: filePath,
            originalName: filename,
            size: stats.size,
            createdAt: stats.birthtime,
            expiresAt: new Date(stats.birthtime.getTime() + this.DEFAULT_TTL),
            mimeType: 'application/octet-stream' // Default type
          };

          this.files.set(id, fileInfo);
        }
      }
    } catch (error) {
      console.error('Failed to load existing temp files:', error);
    }
  }

  // Extract UUID from filename
  private extractIdFromFilename(filename: string): string | null {
    // Match UUID pattern in filename
    const uuidMatch = filename.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    return uuidMatch ? uuidMatch[1] : null;
  }

  // Extract file extension
  private extractExtension(filename: string): string | null {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : null;
  }

  // Shutdown cleanup
  async shutdown(): Promise<void> {
    this.stopCleanupScheduler();
    await this.cleanupAll();
  }
}

// Utility functions
export class TempFileUtils {
  // Format file size for display
  static formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format duration for display
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Check if file type is supported
  static isSupportedType(mimeType: string): boolean {
    const supportedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'text/plain', 'text/csv'
    ];
    return supportedTypes.includes(mimeType);
  }
}

export default TempFileManager;