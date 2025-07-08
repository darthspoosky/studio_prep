// Data Architecture Specifications for PrepTalk Dashboard

// ===== CORE DATA MODELS =====

interface User {
  id: string;
  profile: UserProfile;
  preferences: UserPreferences;
  subscription: SubscriptionDetails;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  targetExam: ExamType;
  preparationStartDate: Date;
  targetDate: Date;
  currentLevel: ProficiencyLevel;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  dashboardLayout: DashboardLayout;
  studySchedule: StudySchedule;
}

// ===== ENHANCED DATA MODELS =====

interface PerformanceMetrics {
  userId: string;
  overall: {
    accuracy: number;
    questionsAttempted: number;
    questionsCorrect: number;
    averageTimePerQuestion: number;
    consistencyScore: number;
  };
  bySubject: SubjectPerformance[];
  byTopic: TopicPerformance[];
  byDifficulty: DifficultyPerformance[];
  temporal: TemporalPerformance;
  comparative: ComparativeMetrics;
}

interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  metrics: {
    accuracy: number;
    attempted: number;
    correct: number;
    avgTime: number;
    trend: TrendData;
    strengths: string[];
    weaknesses: string[];
  };
}

interface TemporalPerformance {
  daily: DailyMetric[];
  weekly: WeeklyMetric[];
  monthly: MonthlyMetric[];
  patterns: {
    bestTimeOfDay: string;
    bestDayOfWeek: string;
    consistencyScore: number;
    studyHabitStrength: number;
  };
}

interface LearningPath {
  userId: string;
  currentPhase: LearningPhase;
  completedTopics: CompletedTopic[];
  upcomingTopics: UpcomingTopic[];
  milestones: Milestone[];
  estimatedCompletion: Date;
  adaptiveAdjustments: AdaptiveAdjustment[];
}

interface CompletedTopic {
  topicId: string;
  completedAt: Date;
  performanceScore: number;
  revisionsNeeded: number;
  nextRevisionDate: Date;
  masteryLevel: MasteryLevel;
}

interface AdaptiveAdjustment {
  timestamp: Date;
  reason: string;
  previousPath: string[];
  newPath: string[];
  impact: 'minor' | 'moderate' | 'major';
  basedOn: 'performance' | 'time' | 'preference' | 'ai_recommendation';
}

// ===== REAL-TIME DATA STRUCTURES =====

interface RealtimeUpdate {
  type: 'performance' | 'activity' | 'achievement' | 'social';
  timestamp: Date;
  data: any;
  priority: 'low' | 'medium' | 'high';
  ttl?: number; // Time to live in seconds
}

interface StreamingMetric {
  metricId: string;
  value: number;
  timestamp: Date;
  delta: number;
  trend: 'up' | 'down' | 'stable';
}

// ===== CACHING STRATEGIES =====

interface CacheConfig {
  performance: {
    strategy: 'stale-while-revalidate';
    ttl: 300000; // 5 minutes
    maxAge: 3600000; // 1 hour
  };
  userProfile: {
    strategy: 'cache-first';
    ttl: 86400000; // 24 hours
    invalidateOn: ['profile-update', 'subscription-change'];
  };
  analytics: {
    strategy: 'network-first';
    ttl: 600000; // 10 minutes
    maxAge: 1800000; // 30 minutes
  };
  recommendations: {
    strategy: 'cache-and-update';
    ttl: 3600000; // 1 hour
    prefetch: true;
  };
}

// ===== DATA AGGREGATION PATTERNS =====

class DataAggregationService {
  // Aggregate performance data across multiple dimensions
  async aggregatePerformanceData(userId: string, options: AggregationOptions): Promise<AggregatedData> {
    const pipeline = [
      // Time-based aggregation
      {
        $match: {
          userId,
          timestamp: {
            $gte: options.startDate,
            $lte: options.endDate
          }
        }
      },
      // Group by specified dimensions
      {
        $group: {
          _id: {
            subject: '$subject',
            difficulty: '$difficulty',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          accuracy: { $avg: '$isCorrect' },
          count: { $sum: 1 },
          avgTime: { $avg: '$timeSpent' }
        }
      },
      // Calculate rolling averages
      {
        $setWindowFields: {
          sortBy: { '_id.date': 1 },
          output: {
            rollingAccuracy: {
              $avg: '$accuracy',
              window: { documents: [-6, 0] } // 7-day rolling average
            }
          }
        }
      }
    ];

    return await this.db.aggregate(pipeline);
  }

  // Generate insights from aggregated data
  async generateInsights(aggregatedData: AggregatedData): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Trend Analysis
    const trendAnalysis = this.analyzeTrends(aggregatedData);
    if (trendAnalysis.significantChange) {
      insights.push({
        type: 'trend',
        severity: trendAnalysis.severity,
        message: trendAnalysis.message,
        recommendations: trendAnalysis.recommendations
      });
    }

    // Pattern Recognition
    const patterns = this.identifyPatterns(aggregatedData);
    patterns.forEach(pattern => {
      insights.push({
        type: 'pattern',
        severity: 'info',
        message: pattern.description,
        recommendations: pattern.actions
      });
    });

    // Comparative Analysis
    const comparison = await this.compareWithPeers(aggregatedData);
    if (comparison.percentile < 30) {
      insights.push({
        type: 'comparative',
        severity: 'warning',
        message: `Your performance is in the ${comparison.percentile}th percentile`,
        recommendations: comparison.improvementAreas
      });
    }

    return insights;
  }
}

// ===== DATA FLOW ARCHITECTURE =====

interface DataFlow {
  sources: {
    primary: {
      firebase: {
        collections: ['users', 'quizAttempts', 'studySessions', 'achievements'];
        realtime: ['activeUsers', 'liveScores'];
      };
      external: {
        analytics: 'GoogleAnalytics';
        ml: 'TensorFlowServing';
      };
    };
  };
  
  processing: {
    stream: {
      engine: 'ApacheKafka';
      topics: ['user-events', 'performance-updates', 'system-metrics'];
    };
    batch: {
      scheduler: 'ApacheAirflow';
      jobs: ['daily-aggregation', 'weekly-insights', 'monthly-reports'];
    };
  };
  
  storage: {
    operational: {
      type: 'Firestore';
      indexes: ['userId_timestamp', 'subject_accuracy', 'date_performance'];
    };
    analytical: {
      type: 'BigQuery';
      datasets: ['user_performance', 'aggregated_metrics', 'ml_features'];
    };
    cache: {
      type: 'Redis';
      evictionPolicy: 'LRU';
      maxMemory: '2GB';
    };
  };
}

// ===== OPTIMIZED QUERY PATTERNS =====

class OptimizedQueries {
  // Batched data fetching with React Query
  dashboardDataQuery = {
    queryKey: ['dashboard', userId],
    queryFn: async () => {
      // Parallel fetch all required data
      const [profile, metrics, activities, recommendations] = await Promise.all([
        this.fetchUserProfile(userId),
        this.fetchPerformanceMetrics(userId),
        this.fetchRecentActivities(userId),
        this.fetchRecommendations(userId)
      ]);

      return { profile, metrics, activities, recommendations };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 1000, // 30 seconds for real-time feel
  };

  // Infinite query for activity timeline
  activityTimelineQuery = {
    queryKey: ['activities', userId],
    queryFn: async ({ pageParam = 0 }) => {
      const PAGE_SIZE = 20;
      const activities = await this.fetchActivities(userId, {
        offset: pageParam * PAGE_SIZE,
        limit: PAGE_SIZE
      });
      
      return {
        activities,
        nextPage: activities.length === PAGE_SIZE ? pageParam + 1 : null
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 2 * 60 * 1000,
  };

  // Optimized aggregation query
  async fetchPerformanceMetrics(userId: string): Promise<PerformanceMetrics> {
    // Use composite indexes for efficient querying
    const query = `
      SELECT 
        COUNT(*) as total_questions,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
        AVG(time_spent) as avg_time,
        AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as accuracy,
        subject,
        DATE_TRUNC('day', timestamp) as date
      FROM quiz_attempts
      WHERE user_id = $1 
        AND timestamp > NOW() - INTERVAL '30 days'
      GROUP BY subject, date
      ORDER BY date DESC
    `;
    
    // Execute with connection pooling
    const results = await this.db.query(query, [userId]);
    
    // Transform and enrich data
    return this.transformMetrics(results);
  }
}

// ===== STATE SYNCHRONIZATION =====

class StateSyncManager {
  private syncQueue: SyncOperation[] = [];
  private syncInterval: number = 5000; // 5 seconds
  
  // Optimistic update with rollback support
  async optimisticUpdate<T>(
    operation: () => Promise<T>,
    rollback: () => void,
    options: OptimisticOptions
  ): Promise<T> {
    // Apply optimistic update
    const tempId = this.applyOptimisticChange(options.data);
    
    try {
      // Execute actual operation
      const result = await operation();
      
      // Replace optimistic data with real data
      this.replaceOptimisticData(tempId, result);
      
      return result;
    } catch (error) {
      // Rollback on failure
      rollback();
      this.removeOptimisticData(tempId);
      throw error;
    }
  }
  
  // Sync local changes with server
  async syncChanges(): Promise<void> {
    if (this.syncQueue.length === 0) return;
    
    const batch = this.syncQueue.splice(0, 10); // Process 10 at a time
    
    try {
      await this.batchSync(batch);
    } catch (error) {
      // Re-queue failed operations
      this.syncQueue.unshift(...batch);
      throw error;
    }
  }
}

// ===== REAL-TIME DATA SUBSCRIPTIONS =====

class RealtimeDataService {
  private subscriptions: Map<string, Subscription> = new Map();
  
  // Subscribe to performance updates
  subscribeToPerformanceUpdates(
    userId: string,
    callback: (update: PerformanceUpdate) => void
  ): () => void {
    const subscription = this.firebase
      .collection('performance')
      .doc(userId)
      .onSnapshot((doc) => {
        const data = doc.data() as PerformanceUpdate;
        callback(data);
      });
    
    this.subscriptions.set(`performance-${userId}`, subscription);
    
    // Return unsubscribe function
    return () => {
      subscription();
      this.subscriptions.delete(`performance-${userId}`);
    };
  }
  
  // Subscribe to achievement notifications
  subscribeToAchievements(
    userId: string,
    callback: (achievement: Achievement) => void
  ): () => void {
    const subscription = this.firebase
      .collection('achievements')
      .where('userId', '==', userId)
      .where('notified', '==', false)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            callback(change.doc.data() as Achievement);
          }
        });
      });
    
    this.subscriptions.set(`achievements-${userId}`, subscription);
    
    return () => {
      subscription();
      this.subscriptions.delete(`achievements-${userId}`);
    };
  }
}

// ===== ANALYTICS DATA PIPELINE =====

interface AnalyticsPipeline {
  // Event collection
  collect: {
    events: UserEvent[];
    enrichment: EnrichmentRules[];
    validation: ValidationSchema;
  };
  
  // Processing stages
  process: {
    cleaning: DataCleaningRules[];
    transformation: TransformationPipeline[];
    aggregation: AggregationConfig[];
  };
  
  // Output destinations
  output: {
    realtime: RealtimeDestination[];
    batch: BatchDestination[];
    alerts: AlertConfiguration[];
  };
}

class AnalyticsProcessor {
  async processUserEvent(event: UserEvent): Promise<void> {
    // Enrich event with context
    const enrichedEvent = await this.enrichEvent(event);
    
    // Validate event data
    if (!this.validateEvent(enrichedEvent)) {
      throw new Error('Invalid event data');
    }
    
    // Send to real-time processing
    await this.streamProcessor.send(enrichedEvent);
    
    // Queue for batch processing
    await this.batchQueue.add(enrichedEvent);
    
    // Check for alert conditions
    await this.checkAlertConditions(enrichedEvent);
  }
  
  private async enrichEvent(event: UserEvent): Promise<EnrichedEvent> {
    const [userContext, sessionContext] = await Promise.all([
      this.getUserContext(event.userId),
      this.getSessionContext(event.sessionId)
    ]);
    
    return {
      ...event,
      userContext,
      sessionContext,
      timestamp: new Date(),
      serverVersion: process.env.APP_VERSION
    };
  }
}

// ===== DATA MIGRATION UTILITIES =====

class DataMigrationService {
  async migrateToNewSchema(
    fromVersion: string,
    toVersion: string
  ): Promise<MigrationResult> {
    const migrations = this.getMigrationPath(fromVersion, toVersion);
    const results: MigrationStepResult[] = [];
    
    for (const migration of migrations) {
      try {
        const result = await this.executeMigration(migration);
        results.push(result);
        
        if (result.status === 'failed') {
          await this.rollbackMigrations(results);
          throw new Error(`Migration failed at step ${migration.version}`);
        }
      } catch (error) {
        await this.rollbackMigrations(results);
        throw error;
      }
    }
    
    return {
      fromVersion,
      toVersion,
      steps: results,
      status: 'completed'
    };
  }
}