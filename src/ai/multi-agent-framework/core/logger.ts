/**
 * @fileOverview Logging utility for the multi-agent framework
 */

import { LogLevel } from './types';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  agentId?: string;
  requestId?: string;
  message: string;
  data?: any;
  error?: Error;
}

export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 10000;

  constructor(
    private config: {
      level: LogLevel;
      enableConsole: boolean;
      enableFile?: boolean;
      filePath?: string;
    }
  ) {}

  private shouldLog(level: LogLevel): boolean {
    const levels = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3
    };

    return levels[level] >= levels[this.config.level];
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any,
    agentId?: string,
    requestId?: string,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      agentId,
      requestId,
      message,
      data,
      error
    };
  }

  private writeLog(entry: LogEntry): void {
    // Add to in-memory logs
    this.logs.push(entry);
    
    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    if (this.config.enableConsole) {
      const timestamp = entry.timestamp.toISOString();
      const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
      const agentInfo = entry.agentId ? `[${entry.agentId}]` : '';
      const requestInfo = entry.requestId ? `[${entry.requestId}]` : '';
      
      const logMessage = `${prefix}${agentInfo}${requestInfo} ${entry.message}`;

      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(logMessage, entry.data);
          break;
        case LogLevel.INFO:
          console.info(logMessage, entry.data);
          break;
        case LogLevel.WARN:
          console.warn(logMessage, entry.data);
          break;
        case LogLevel.ERROR:
          console.error(logMessage, entry.data, entry.error);
          break;
      }
    }

    // File output (would implement file writing in production)
    if (this.config.enableFile && this.config.filePath) {
      // In production, write to file system
      // fs.appendFileSync(this.config.filePath, JSON.stringify(entry) + '\n');
    }
  }

  debug(message: string, data?: any, agentId?: string, requestId?: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog(this.createLogEntry(LogLevel.DEBUG, message, data, agentId, requestId));
    }
  }

  info(message: string, data?: any, agentId?: string, requestId?: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog(this.createLogEntry(LogLevel.INFO, message, data, agentId, requestId));
    }
  }

  warn(message: string, data?: any, agentId?: string, requestId?: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog(this.createLogEntry(LogLevel.WARN, message, data, agentId, requestId));
    }
  }

  error(message: string, error?: Error, data?: any, agentId?: string, requestId?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog(this.createLogEntry(LogLevel.ERROR, message, data, agentId, requestId, error));
    }
  }

  // Agent-specific logging methods
  agentDebug(agentId: string, message: string, data?: any, requestId?: string): void {
    this.debug(message, data, agentId, requestId);
  }

  agentInfo(agentId: string, message: string, data?: any, requestId?: string): void {
    this.info(message, data, agentId, requestId);
  }

  agentWarn(agentId: string, message: string, data?: any, requestId?: string): void {
    this.warn(message, data, agentId, requestId);
  }

  agentError(agentId: string, message: string, error?: Error, data?: any, requestId?: string): void {
    this.error(message, error, data, agentId, requestId);
  }

  // Request-specific logging methods
  requestStart(requestId: string, agentId: string, message: string, data?: any): void {
    this.info(`[START] ${message}`, data, agentId, requestId);
  }

  requestEnd(requestId: string, agentId: string, message: string, data?: any): void {
    this.info(`[END] ${message}`, data, agentId, requestId);
  }

  requestError(requestId: string, agentId: string, message: string, error: Error, data?: any): void {
    this.error(`[ERROR] ${message}`, error, data, agentId, requestId);
  }

  // Query logs
  getLogs(filters?: {
    level?: LogLevel;
    agentId?: string;
    requestId?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.level) {
        const levels = {
          [LogLevel.DEBUG]: 0,
          [LogLevel.INFO]: 1,
          [LogLevel.WARN]: 2,
          [LogLevel.ERROR]: 3
        };
        filteredLogs = filteredLogs.filter(log => 
          levels[log.level] >= levels[filters.level!]
        );
      }

      if (filters.agentId) {
        filteredLogs = filteredLogs.filter(log => log.agentId === filters.agentId);
      }

      if (filters.requestId) {
        filteredLogs = filteredLogs.filter(log => log.requestId === filters.requestId);
      }

      if (filters.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startTime!);
      }

      if (filters.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endTime!);
      }

      if (filters.limit) {
        filteredLogs = filteredLogs.slice(-filters.limit);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get error logs for monitoring
  getErrorLogs(hours: number = 24): LogEntry[] {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.getLogs({
      level: LogLevel.ERROR,
      startTime
    });
  }

  // Get agent activity
  getAgentActivity(agentId: string, hours: number = 1): LogEntry[] {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.getLogs({
      agentId,
      startTime
    });
  }

  // Clear old logs
  clearLogs(olderThan?: Date): void {
    if (olderThan) {
      this.logs = this.logs.filter(log => log.timestamp > olderThan);
    } else {
      this.logs = [];
    }
  }

  // Export logs for analysis
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      // CSV format
      if (this.logs.length === 0) return '';
      
      const headers = ['timestamp', 'level', 'agentId', 'requestId', 'message'];
      const csvLines = [headers.join(',')];
      
      for (const log of this.logs) {
        const row = [
          log.timestamp.toISOString(),
          log.level,
          log.agentId || '',
          log.requestId || '',
          `"${log.message.replace(/"/g, '""')}"`
        ];
        csvLines.push(row.join(','));
      }
      
      return csvLines.join('\n');
    }
  }

  // Performance tracking
  time(label: string, agentId?: string, requestId?: string): () => void {
    const startTime = Date.now();
    this.debug(`Timer started: ${label}`, { startTime }, agentId, requestId);
    
    return () => {
      const duration = Date.now() - startTime;
      this.debug(`Timer ended: ${label}`, { duration }, agentId, requestId);
    };
  }
}

// Create default logger instance
export const createLogger = (config: {
  level?: LogLevel;
  enableConsole?: boolean;
  enableFile?: boolean;
  filePath?: string;
} = {}): Logger => {
  return new Logger({
    level: config.level || LogLevel.INFO,
    enableConsole: config.enableConsole !== false,
    enableFile: config.enableFile || false,
    filePath: config.filePath
  });
};