/**
 * @fileOverview Error monitoring and alerting system for multi-agent framework
 */

import { Logger } from '../core/logger';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  agentId?: string;
  requestType?: string;
  timestamp: Date;
  environment: string;
  version: string;
  metadata?: Record<string, any>;
}

export interface ErrorAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  error: Error;
  context: ErrorContext;
  stackTrace?: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  resolved: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (error: Error, context: ErrorContext) => boolean;
  severity: ErrorAlert['severity'];
  throttleMinutes?: number;
  channels: AlertChannel[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

export interface MonitoringMetrics {
  errorRate: number;
  totalErrors: number;
  errorsByAgent: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurrence: Date;
  }>;
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
}

export class ErrorMonitor {
  private logger: Logger;
  private alerts: Map<string, ErrorAlert> = new Map();
  private alertRules: AlertRule[] = [];
  private throttleMap: Map<string, Date> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
    this.setupDefaultAlertRules();
  }

  /**
   * Capture and process an error
   */
  async captureError(
    error: Error,
    context: ErrorContext,
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      // Enhance context with additional data
      const enrichedContext = {
        ...context,
        metadata: {
          ...context.metadata,
          ...additionalData,
          userAgent: context.metadata?.userAgent,
          ip: context.metadata?.ip,
          url: context.metadata?.url
        }
      };

      // Log the error
      this.logger.error(error.message, error, enrichedContext);

      // Check if this error should trigger an alert
      await this.processAlertRules(error, enrichedContext);

      // Store error for metrics
      await this.storeError(error, enrichedContext);

      // Update error frequency tracking
      await this.updateErrorFrequency(error, enrichedContext);

    } catch (monitoringError) {
      // Don't let monitoring errors crash the application
      console.error('Error monitoring failed:', monitoringError);
    }
  }

  /**
   * Process alert rules for an error
   */
  private async processAlertRules(error: Error, context: ErrorContext): Promise<void> {
    for (const rule of this.alertRules) {
      if (rule.condition(error, context)) {
        await this.triggerAlert(rule, error, context);
      }
    }
  }

  /**
   * Trigger an alert if not throttled
   */
  private async triggerAlert(
    rule: AlertRule,
    error: Error,
    context: ErrorContext
  ): Promise<void> {
    const alertKey = `${rule.id}:${error.message}`;
    const now = new Date();

    // Check throttling
    if (rule.throttleMinutes) {
      const lastAlert = this.throttleMap.get(alertKey);
      if (lastAlert) {
        const minutesSinceLastAlert = (now.getTime() - lastAlert.getTime()) / (1000 * 60);
        if (minutesSinceLastAlert < rule.throttleMinutes) {
          return; // Throttled
        }
      }
    }

    // Create or update alert
    let alert = this.alerts.get(alertKey);
    if (alert) {
      alert.count++;
      alert.lastOccurrence = now;
    } else {
      alert = {
        id: alertKey,
        severity: rule.severity,
        title: rule.name,
        message: this.formatAlertMessage(error, context),
        error,
        context,
        stackTrace: error.stack,
        count: 1,
        firstOccurrence: now,
        lastOccurrence: now,
        resolved: false
      };
      this.alerts.set(alertKey, alert);
    }

    // Send alert through configured channels
    await this.sendAlert(alert, rule.channels);

    // Update throttle map
    this.throttleMap.set(alertKey, now);
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(alert: ErrorAlert, channels: AlertChannel[]): Promise<void> {
    for (const channel of channels.filter(c => c.enabled)) {
      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailAlert(alert, channel.config);
            break;
          case 'slack':
            await this.sendSlackAlert(alert, channel.config);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alert, channel.config);
            break;
          case 'sms':
            await this.sendSMSAlert(alert, channel.config);
            break;
        }
      } catch (error) {
        console.error(`Failed to send alert via ${channel.type}:`, error);
      }
    }
  }

  /**
   * Get current monitoring metrics
   */
  async getMetrics(timeRange: { start: Date; end: Date }): Promise<MonitoringMetrics> {
    // This would integrate with your database/metrics store in production
    // For now, return basic metrics from in-memory data
    
    const recentAlerts = Array.from(this.alerts.values()).filter(
      alert => alert.lastOccurrence >= timeRange.start && 
               alert.lastOccurrence <= timeRange.end
    );

    const totalErrors = recentAlerts.reduce((sum, alert) => sum + alert.count, 0);
    const timeSpanHours = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60);
    const errorRate = timeSpanHours > 0 ? totalErrors / timeSpanHours : 0;

    const errorsByAgent: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    recentAlerts.forEach(alert => {
      const agentId = alert.context.agentId || 'unknown';
      errorsByAgent[agentId] = (errorsByAgent[agentId] || 0) + alert.count;
      errorsBySeverity[alert.severity] = (errorsBySeverity[alert.severity] || 0) + alert.count;
    });

    const topErrors = recentAlerts
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(alert => ({
        message: alert.message,
        count: alert.count,
        lastOccurrence: alert.lastOccurrence
      }));

    return {
      errorRate,
      totalErrors,
      errorsByAgent,
      errorsBySeverity,
      topErrors,
      responseTime: {
        avg: 1250, // Would be calculated from actual metrics
        p95: 2800,
        p99: 5200
      }
    };
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.info(`Alert resolved: ${alertId}`);
    }
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): ErrorAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Private helper methods
   */

  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'openai_api_error',
        name: 'OpenAI API Error',
        condition: (error, context) => 
          error.message.includes('OpenAI') || 
          error.message.includes('rate limit') ||
          error.message.includes('API key'),
        severity: 'high',
        throttleMinutes: 15,
        channels: [
          { type: 'email', config: { recipients: ['admin@upsc.app'] }, enabled: true },
          { type: 'slack', config: { webhook: process.env.SLACK_WEBHOOK_URL }, enabled: true }
        ]
      },
      {
        id: 'authentication_failure',
        name: 'Authentication Failure',
        condition: (error, context) => 
          error.message.includes('authentication') ||
          error.message.includes('unauthorized'),
        severity: 'medium',
        throttleMinutes: 5,
        channels: [
          { type: 'email', config: { recipients: ['security@upsc.app'] }, enabled: true }
        ]
      },
      {
        id: 'database_error',
        name: 'Database Error',
        condition: (error, context) => 
          error.message.includes('database') ||
          error.message.includes('connection') ||
          error.message.includes('timeout'),
        severity: 'critical',
        throttleMinutes: 1,
        channels: [
          { type: 'email', config: { recipients: ['admin@upsc.app'] }, enabled: true },
          { type: 'slack', config: { webhook: process.env.SLACK_WEBHOOK_URL }, enabled: true },
          { type: 'sms', config: { number: process.env.ADMIN_PHONE }, enabled: false }
        ]
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: (error, context) => {
          // Check if error rate exceeds threshold (would need more sophisticated logic)
          return false; // Placeholder
        },
        severity: 'high',
        throttleMinutes: 30,
        channels: [
          { type: 'email', config: { recipients: ['admin@upsc.app'] }, enabled: true }
        ]
      }
    ];
  }

  private formatAlertMessage(error: Error, context: ErrorContext): string {
    return `Error in ${context.agentId || 'unknown agent'}: ${error.message}
Environment: ${context.environment}
User ID: ${context.userId || 'anonymous'}
Session ID: ${context.sessionId || 'none'}
Timestamp: ${context.timestamp.toISOString()}`;
  }

  private async sendEmailAlert(alert: ErrorAlert, config: any): Promise<void> {
    // Integrate with email service (SendGrid, SES, etc.)
    console.log(`[EMAIL ALERT] ${alert.title}: ${alert.message}`);
  }

  private async sendSlackAlert(alert: ErrorAlert, config: any): Promise<void> {
    if (!config.webhook) return;

    const payload = {
      text: `🚨 ${alert.title}`,
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        fields: [
          { title: 'Message', value: alert.message, short: false },
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Count', value: alert.count.toString(), short: true },
          { title: 'Agent', value: alert.context.agentId || 'unknown', short: true },
          { title: 'Environment', value: alert.context.environment, short: true }
        ],
        timestamp: Math.floor(alert.lastOccurrence.getTime() / 1000)
      }]
    };

    // Would make actual HTTP request to Slack webhook
    console.log(`[SLACK ALERT] ${JSON.stringify(payload, null, 2)}`);
  }

  private async sendWebhookAlert(alert: ErrorAlert, config: any): Promise<void> {
    if (!config.url) return;

    const payload = {
      alert,
      timestamp: new Date().toISOString()
    };

    // Would make actual HTTP request to webhook URL
    console.log(`[WEBHOOK ALERT] ${config.url}: ${JSON.stringify(payload)}`);
  }

  private async sendSMSAlert(alert: ErrorAlert, config: any): Promise<void> {
    if (!config.number || alert.severity !== 'critical') return;

    const message = `CRITICAL: ${alert.title} - ${alert.message.substring(0, 100)}...`;
    
    // Would integrate with SMS service (Twilio, etc.)
    console.log(`[SMS ALERT] ${config.number}: ${message}`);
  }

  private getSeverityColor(severity: string): string {
    const colors = {
      low: '#36a64f',      // Green
      medium: '#ff9500',   // Orange  
      high: '#ff4444',     // Red
      critical: '#990000'  // Dark red
    };
    return colors[severity as keyof typeof colors] || '#808080';
  }

  private async storeError(error: Error, context: ErrorContext): Promise<void> {
    // In production, store in database for long-term analysis
    // This is a placeholder
  }

  private async updateErrorFrequency(error: Error, context: ErrorContext): Promise<void> {
    // Track error frequency for trend analysis
    // This is a placeholder
  }
}

/**
 * Create error monitor instance
 */
export function createErrorMonitor(logger: Logger): ErrorMonitor {
  return new ErrorMonitor(logger);
}

/**
 * Error monitoring middleware
 */
export function createErrorMiddleware(monitor: ErrorMonitor) {
  return (error: Error, context: ErrorContext) => {
    monitor.captureError(error, context);
  };
}