// Performance optimization utilities for quiz system
import { useCallback, useMemo, useRef, useEffect } from 'react';

// Debounce hook for expensive operations
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

// Throttle hook for frequent operations
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;
}

// Memoized quiz progress calculation
export function useQuizProgress(
  currentIndex: number,
  totalQuestions: number,
  answeredCount: number
) {
  return useMemo(() => {
    if (totalQuestions === 0) return 0;
    
    return {
      progress: ((currentIndex + 1) / totalQuestions) * 100,
      completion: (answeredCount / totalQuestions) * 100,
      remaining: totalQuestions - answeredCount,
      isComplete: answeredCount === totalQuestions
    };
  }, [currentIndex, totalQuestions, answeredCount]);
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const metricsRef = useRef<{
    startTime: number;
    renderCount: number;
    lastRenderTime: number;
  }>({
    startTime: Date.now(),
    renderCount: 0,
    lastRenderTime: Date.now()
  });

  useEffect(() => {
    metricsRef.current.renderCount++;
    metricsRef.current.lastRenderTime = Date.now();
  });

  return useCallback(() => {
    const now = Date.now();
    const { startTime, renderCount } = metricsRef.current;
    
    return {
      totalTime: now - startTime,
      renderCount,
      averageRenderTime: (now - startTime) / renderCount,
      lastRenderDuration: now - metricsRef.current.lastRenderTime
    };
  }, []);
}

// Lazy loading utility for quiz images
export class QuizImageLoader {
  private cache = new Map<string, HTMLImageElement>();
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();

  async loadImage(src: string): Promise<HTMLImageElement> {
    // Return cached image if available
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    // Create new loading promise
    const loadingPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(src, img);
        this.loadingPromises.delete(src);
        resolve(img);
      };
      
      img.onerror = () => {
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      // Start loading
      img.src = src;
    });

    this.loadingPromises.set(src, loadingPromise);
    return loadingPromise;
  }

  preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(urls.map(url => this.loadImage(url)));
  }

  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Quiz data optimization utilities
export class QuizDataOptimizer {
  // Compress quiz session data for storage
  static compressSession(session: any): string {
    const compressed = {
      i: session.id,
      u: session.userId,
      t: session.quizType,
      c: session.currentQuestionIndex,
      a: session.answers,
      b: session.bookmarked,
      tr: session.timeRemaining,
      cm: session.completed
    };
    return JSON.stringify(compressed);
  }

  // Decompress quiz session data
  static decompressSession(compressed: string): any {
    const data = JSON.parse(compressed);
    return {
      id: data.i,
      userId: data.u,
      quizType: data.t,
      currentQuestionIndex: data.c,
      answers: data.a,
      bookmarked: data.b,
      timeRemaining: data.tr,
      completed: data.cm
    };
  }

  // Optimize question data for rendering
  static optimizeQuestions(questions: any[]): any[] {
    return questions.map(q => ({
      ...q,
      // Pre-process option letters
      optionLetters: ['A', 'B', 'C', 'D'],
      // Pre-calculate text length for UI adjustments
      questionLength: q.question.length,
      hasImage: !!q.image,
      // Extract subject emoji for quick access
      subjectEmoji: this.getSubjectEmoji(q.subject)
    }));
  }

  private static getSubjectEmoji(subject: string): string {
    const emojiMap: { [key: string]: string } = {
      history: '📚',
      geography: '🌍',
      polity: '🏛️',
      economics: '💰',
      science: '🔬',
      environment: '🌱',
      current_affairs: '📰',
      ethics: '⚖️',
      governance: '🏢'
    };
    return emojiMap[subject.toLowerCase()] || '📝';
  }
}

// Local storage optimization
export class QuizStorageManager {
  private static readonly STORAGE_PREFIX = 'quiz_';
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

  static saveProgress(sessionId: string, data: any): boolean {
    try {
      const key = `${this.STORAGE_PREFIX}${sessionId}`;
      const compressed = QuizDataOptimizer.compressSession(data);
      
      // Check storage size
      if (this.getStorageSize() + compressed.length > this.MAX_STORAGE_SIZE) {
        this.cleanOldSessions();
      }
      
      localStorage.setItem(key, compressed);
      localStorage.setItem(`${key}_timestamp`, Date.now().toString());
      return true;
    } catch (error) {
      console.error('Failed to save quiz progress:', error);
      return false;
    }
  }

  static loadProgress(sessionId: string): any | null {
    try {
      const key = `${this.STORAGE_PREFIX}${sessionId}`;
      const compressed = localStorage.getItem(key);
      
      if (!compressed) return null;
      
      return QuizDataOptimizer.decompressSession(compressed);
    } catch (error) {
      console.error('Failed to load quiz progress:', error);
      return null;
    }
  }

  static clearProgress(sessionId: string): void {
    const key = `${this.STORAGE_PREFIX}${sessionId}`;
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_timestamp`);
  }

  private static getStorageSize(): number {
    let totalSize = 0;
    for (let key in localStorage) {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        totalSize += localStorage[key].length;
      }
    }
    return totalSize;
  }

  private static cleanOldSessions(): void {
    const sessions: Array<{ key: string; timestamp: number }> = [];
    
    // Collect all quiz sessions with timestamps
    for (let key in localStorage) {
      if (key.startsWith(this.STORAGE_PREFIX) && !key.endsWith('_timestamp')) {
        const timestampKey = `${key}_timestamp`;
        const timestamp = parseInt(localStorage.getItem(timestampKey) || '0');
        sessions.push({ key, timestamp });
      }
    }
    
    // Sort by timestamp (oldest first)
    sessions.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest sessions until we free up enough space
    const targetSize = this.MAX_STORAGE_SIZE * 0.7; // Keep 70% of max size
    let currentSize = this.getStorageSize();
    
    for (const session of sessions) {
      if (currentSize <= targetSize) break;
      
      const sessionData = localStorage.getItem(session.key);
      if (sessionData) {
        currentSize -= sessionData.length;
        this.clearProgress(session.key.replace(this.STORAGE_PREFIX, ''));
      }
    }
  }
}

// Network optimization for API calls
export class QuizNetworkOptimizer {
  private static requestCache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async cachedFetch(url: string, options?: RequestInit): Promise<Response> {
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    const cached = this.requestCache.get(cacheKey);
    
    // Return cached response if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return new Response(JSON.stringify(cached.data), { status: 200 });
    }
    
    // Make actual request
    const response = await fetch(url, options);
    
    // Cache successful responses
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.clone().json();
      this.requestCache.set(cacheKey, { data, timestamp: Date.now() });
    }
    
    return response;
  }

  static clearCache(): void {
    this.requestCache.clear();
  }

  static cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.requestCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.requestCache.delete(key);
      }
    }
  }
}

// Virtual scrolling for large question lists
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex)
      .map((item, index) => ({
        item,
        index: visibleRange.startIndex + index
      }));
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
}

// Export singleton instances
export const quizImageLoader = new QuizImageLoader();
export const quizStorageManager = QuizStorageManager;
export const quizNetworkOptimizer = QuizNetworkOptimizer;

// Performance monitoring utilities
export const performanceMetrics = {
  startTimer: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-start`);
    }
  },
  
  endTimer: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        const duration = measures[measures.length - 1].duration;
        console.debug(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        return duration;
      }
    }
    return 0;
  },
  
  clearMarks: (name?: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      if (name) {
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
      } else {
        performance.clearMarks();
        performance.clearMeasures();
      }
    }
  }
};