'use client';

// Analytics Event Types
export interface AnalyticsEvent {
  eventId: string;
  eventName: string;
  eventData: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: string;
  url: string;
  userAgent?: string;
  referrer?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface UserProperties {
  userId: string;
  email?: string;
  displayName?: string;
  role?: string;
  plan?: string;
  signupDate?: string;
  lastActiveDate?: string;
}

export interface WebVital {
  name: string;
  value: number;
  id: string;
  attribution?: any;
}

// Analytics Manager Class
export class AnalyticsManager {
  private static instance: AnalyticsManager;
  private initialized = false;
  private userId: string | null = null;
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private userProperties: UserProperties | null = null;
  private isOnline = true;

  private constructor() {
    this.sessionId = this.generateUUID();
    this.setupNetworkListeners();
    this.setupPageVisibilityListeners();
    this.setupUnloadListeners();
  }

  static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  // Initialize analytics
  initialize(userId?: string): void {
    if (this.initialized) return;
    
    if (userId) {
      this.setUserId(userId);
    }
    
    // Track initial page view
    this.trackPageView();
    
    // Setup automatic tracking
    this.setupAutomaticTracking();
    
    // Start flush interval
    this.setupFlushInterval();
    
    this.initialized = true;
    
    console.log('Analytics initialized with session:', this.sessionId);
  }

  // Set user ID and properties
  setUserId(userId: string): void {
    this.userId = userId;
    this.trackEvent('user_identified', { userId });
  }

  setUserProperties(properties: Partial<UserProperties>): void {
    this.userProperties = { ...this.userProperties, ...properties } as UserProperties;
    this.trackEvent('user_properties_updated', properties);
  }

  // Track events
  trackEvent(eventName: string, eventData: Record<string, any> = {}): void {
    if (typeof window === 'undefined') return;
    
    const event: AnalyticsEvent = {
      eventId: this.generateUUID(),
      eventName,
      eventData: {
        ...eventData,
        timestamp: new Date().toISOString(),
      },
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
    
    this.eventQueue.push(event);
    
    // Auto-flush if queue gets large
    if (this.eventQueue.length >= 10) {
      this.flushEvents();
    }
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', eventName, eventData);
    }
  }

  // Track page views
  trackPageView(url?: string): void {
    const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const pagePath = typeof window !== 'undefined' ? window.location.pathname : '';
    const pageTitle = typeof document !== 'undefined' ? document.title : '';
    
    this.trackEvent('page_view', {
      url: pageUrl,
      path: pagePath,
      title: pageTitle,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    });
  }

  // Track user interactions
  trackClick(element: string, context?: Record<string, any>): void {
    this.trackEvent('click', {
      element,
      ...context,
    });
  }

  trackFormSubmit(formName: string, formData?: Record<string, any>): void {
    this.trackEvent('form_submit', {
      form_name: formName,
      ...formData,
    });
  }

  trackSearch(query: string, filters?: Record<string, any>): void {
    this.trackEvent('search', {
      query,
      filters,
      timestamp: Date.now(),
    });
  }

  trackFeatureUsage(feature: string, context?: Record<string, any>): void {
    this.trackEvent('feature_usage', {
      feature,
      ...context,
    });
  }

  trackError(error: Error, context?: Record<string, any>): void {
    this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      ...context,
    });
  }

  // Track performance metrics
  trackWebVital(metric: WebVital): void {
    this.trackEvent('web_vital', {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      attribution: metric.attribution,
    });
  }

  trackTiming(name: string, duration: number, context?: Record<string, any>): void {
    this.trackEvent('timing', {
      name,
      duration,
      ...context,
    });
  }

  // Custom events for PrepTalk
  trackQuizSession(sessionData: {
    quizType: string;
    questionsCount: number;
    score: number;
    duration: number;
    accuracy: number;
  }): void {
    this.trackEvent('quiz_completed', sessionData);
  }

  trackInterviewSession(sessionData: {
    interviewType: string;
    duration: number;
    questionsCount: number;
    averageScore: number;
  }): void {
    this.trackEvent('interview_completed', sessionData);
  }

  trackArticleAnalysis(analysisData: {
    articleType: string;
    analysisType: string;
    processingTime: number;
    wordCount: number;
  }): void {
    this.trackEvent('article_analyzed', analysisData);
  }

  trackToolUsage(toolName: string, duration?: number): void {
    this.trackEvent('tool_used', {
      tool_name: toolName,
      duration,
    });
  }

  // Private methods
  private setupAutomaticTracking(): void {
    if (typeof window === 'undefined') return;
    
    // Track session start
    this.trackEvent('session_start', {
      user_agent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    });
    
    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end', {
        session_duration: Date.now() - performance.timeOrigin,
      });
      this.flushEvents();
    });
    
    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden');
      } else {
        this.trackEvent('page_visible');
      }
    });
    
    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.matches('button, a, [role="button"]')) {
        const text = target.textContent?.trim().substring(0, 50) || '';
        const href = target.getAttribute('href') || '';
        
        this.trackClick('button', {
          text,
          href,
          tag: target.tagName.toLowerCase(),
        });
      }
    });
  }

  private setupFlushInterval(): void {
    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, 30000);
  }

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.trackEvent('network_online');
      // Flush any queued events
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.trackEvent('network_offline');
    });
  }

  private setupPageVisibilityListeners(): void {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Flush events when page becomes hidden
        this.flushEvents();
      }
    });
  }

  private setupUnloadListeners(): void {
    if (typeof window === 'undefined') return;
    
    // Flush events on page unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents();
    });
    
    // Flush events on page freeze (mobile browsers)
    window.addEventListener('freeze', () => {
      this.flushEvents();
    });
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;
    
    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      // Use sendBeacon if available for reliability
      if (navigator.sendBeacon && this.isOnline) {
        const success = navigator.sendBeacon(
          '/api/analytics/collect',
          JSON.stringify({ events: eventsToSend })
        );
        
        if (!success) {
          throw new Error('sendBeacon failed');
        }
      } else {
        // Fallback to fetch
        await fetch('/api/analytics/collect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events: eventsToSend }),
          keepalive: true,
        });
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Analytics: Flushed ${eventsToSend.length} events`);
      }
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      
      // Re-queue events on failure if we're not at risk of memory issues
      if (this.eventQueue.length < 100) {
        this.eventQueue = [...eventsToSend, ...this.eventQueue];
      }
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Public utility methods
  dispose(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Flush any remaining events
    if (this.eventQueue.length > 0) {
      this.flushEvents();
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// React Hook for Analytics
export function useAnalytics() {
  const analytics = AnalyticsManager.getInstance();
  
  React.useEffect(() => {
    if (!analytics.isInitialized()) {
      analytics.initialize();
    }
  }, [analytics]);
  
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackClick: analytics.trackClick.bind(analytics),
    trackFormSubmit: analytics.trackFormSubmit.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackQuizSession: analytics.trackQuizSession.bind(analytics),
    trackInterviewSession: analytics.trackInterviewSession.bind(analytics),
    trackArticleAnalysis: analytics.trackArticleAnalysis.bind(analytics),
    trackToolUsage: analytics.trackToolUsage.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
    setUserProperties: analytics.setUserProperties.bind(analytics),
  };
}

// Web Vitals Integration
export function setupWebVitals() {
  if (typeof window === 'undefined') return;
  
  const analytics = AnalyticsManager.getInstance();
  
  // Import web-vitals dynamically to avoid SSR issues
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS(analytics.trackWebVital.bind(analytics));
    onFID(analytics.trackWebVital.bind(analytics));
    onFCP(analytics.trackWebVital.bind(analytics));
    onLCP(analytics.trackWebVital.bind(analytics));
    onTTFB(analytics.trackWebVital.bind(analytics));
  }).catch(error => {
    console.warn('Failed to load web-vitals:', error);
  });
}

// Export singleton instance
export const analytics = AnalyticsManager.getInstance();