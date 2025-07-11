/**
 * Progress Tracking Service
 * Handles user writing progress analytics and improvement tracking
 */

import { openai, AI_MODELS } from '@/lib/ai-providers';
import { z } from 'zod';

// Types and Schemas
export const WritingSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  questionId: z.string(),
  examType: z.string(),
  subject: z.string(),
  score: z.number().min(0).max(100),
  detailedScores: z.object({
    content: z.number(),
    structure: z.number(),
    language: z.number(),
    presentation: z.number(),
    timeManagement: z.number()
  }),
  metadata: z.object({
    timeSpent: z.number(),
    wordCount: z.number(),
    difficulty: z.string(),
    source: z.enum(['text', 'upload', 'ocr'])
  }),
  createdAt: z.date()
});

export const ProgressAnalyticsSchema = z.object({
  userId: z.string(),
  timeframe: z.enum(['7d', '30d', '90d', 'all']),
  overallTrend: z.object({
    currentAverage: z.number(),
    previousAverage: z.number(),
    improvementRate: z.number(),
    direction: z.enum(['improving', 'stable', 'declining'])
  }),
  subjectPerformance: z.array(z.object({
    subject: z.string(),
    averageScore: z.number(),
    attemptCount: z.number(),
    trend: z.string(),
    lastScore: z.number()
  })),
  skillBreakdown: z.object({
    content: z.object({ current: z.number(), trend: z.number() }),
    structure: z.object({ current: z.number(), trend: z.number() }),
    language: z.object({ current: z.number(), trend: z.number() }),
    presentation: z.object({ current: z.number(), trend: z.number() }),
    timeManagement: z.object({ current: z.number(), trend: z.number() })
  }),
  writingEfficiency: z.object({
    averageWPM: z.number(),
    typingEfficiency: z.number(),
    timeManagement: z.string(),
    consistencyScore: z.number()
  }),
  achievements: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    unlockedAt: z.date(),
    category: z.string()
  })),
  recommendations: z.array(z.object({
    priority: z.enum(['high', 'medium', 'low']),
    category: z.string(),
    suggestion: z.string(),
    expectedImpact: z.string()
  })),
  goals: z.object({
    current: z.array(z.object({
      id: z.string(),
      title: z.string(),
      target: z.number(),
      current: z.number(),
      deadline: z.date(),
      status: z.enum(['on_track', 'behind', 'ahead', 'completed'])
    })),
    suggested: z.array(z.object({
      title: z.string(),
      description: z.string(),
      targetImprovement: z.number(),
      timeframe: z.string()
    }))
  })
});

export type WritingSession = z.infer<typeof WritingSessionSchema>;
export type ProgressAnalytics = z.infer<typeof ProgressAnalyticsSchema>;

/**
 * Service for tracking writing progress and analytics
 */
export class ProgressTrackingService {
  
  /**
   * Record a writing session
   */
  async recordWritingSession(sessionData: Omit<WritingSession, 'id' | 'createdAt'>): Promise<WritingSession> {
    const session: WritingSession = {
      ...sessionData,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    // In production, this would save to database
    console.log('Recording writing session:', session.id);
    
    return session;
  }

  /**
   * Get comprehensive progress analytics for a user
   */
  async getProgressAnalytics(
    userId: string, 
    timeframe: '7d' | '30d' | '90d' | 'all' = '30d'
  ): Promise<ProgressAnalytics> {
    // In production, this would query actual user data
    // For now, generating realistic simulated data
    const sessions = this.generateSimulatedSessions(userId, timeframe);
    
    const analytics = await this.analyzeWritingSessions(sessions, timeframe);
    
    return analytics;
  }

  /**
   * Analyze writing sessions to generate insights
   */
  private async analyzeWritingSessions(
    sessions: WritingSession[], 
    timeframe: string
  ): Promise<ProgressAnalytics> {
    if (sessions.length === 0) {
      return this.getEmptyAnalytics(timeframe as any);
    }

    // Calculate trends and analytics
    const overallTrend = this.calculateOverallTrend(sessions);
    const subjectPerformance = this.analyzeSubjectPerformance(sessions);
    const skillBreakdown = this.analyzeSkillBreakdown(sessions);
    const writingEfficiency = this.analyzeWritingEfficiency(sessions);
    const achievements = await this.checkAchievements(sessions);
    const recommendations = await this.generateRecommendations(sessions);
    const goals = await this.manageGoals(sessions);

    return {
      userId: sessions[0].userId,
      timeframe: timeframe as any,
      overallTrend,
      subjectPerformance,
      skillBreakdown,
      writingEfficiency,
      achievements,
      recommendations,
      goals
    };
  }

  /**
   * Calculate overall improvement trend
   */
  private calculateOverallTrend(sessions: WritingSession[]) {
    const sortedSessions = sessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const midpoint = Math.floor(sortedSessions.length / 2);
    const firstHalf = sortedSessions.slice(0, midpoint);
    const secondHalf = sortedSessions.slice(midpoint);
    
    const previousAverage = firstHalf.length > 0 
      ? firstHalf.reduce((sum, s) => sum + s.score, 0) / firstHalf.length 
      : 0;
    
    const currentAverage = secondHalf.length > 0
      ? secondHalf.reduce((sum, s) => sum + s.score, 0) / secondHalf.length
      : 0;
    
    const improvementRate = previousAverage > 0 
      ? ((currentAverage - previousAverage) / previousAverage) * 100 
      : 0;
    
    let direction: 'improving' | 'stable' | 'declining' = 'stable';
    if (improvementRate > 5) direction = 'improving';
    else if (improvementRate < -5) direction = 'declining';

    return {
      currentAverage: Math.round(currentAverage * 10) / 10,
      previousAverage: Math.round(previousAverage * 10) / 10,
      improvementRate: Math.round(improvementRate * 10) / 10,
      direction
    };
  }

  /**
   * Analyze performance by subject
   */
  private analyzeSubjectPerformance(sessions: WritingSession[]) {
    const subjectGroups = sessions.reduce((groups, session) => {
      const subject = session.subject;
      if (!groups[subject]) groups[subject] = [];
      groups[subject].push(session);
      return groups;
    }, {} as Record<string, WritingSession[]>);

    return Object.entries(subjectGroups).map(([subject, subjectSessions]) => {
      const scores = subjectSessions.map(s => s.score);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const lastScore = subjectSessions[subjectSessions.length - 1].score;
      
      // Calculate trend
      const firstHalfAvg = scores.slice(0, Math.floor(scores.length / 2))
        .reduce((sum, score) => sum + score, 0) / Math.max(1, Math.floor(scores.length / 2));
      const secondHalfAvg = scores.slice(Math.floor(scores.length / 2))
        .reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length - Math.floor(scores.length / 2));
      
      const trend = secondHalfAvg > firstHalfAvg + 2 ? 'improving' :
                   secondHalfAvg < firstHalfAvg - 2 ? 'declining' : 'stable';

      return {
        subject,
        averageScore: Math.round(averageScore * 10) / 10,
        attemptCount: subjectSessions.length,
        trend,
        lastScore
      };
    });
  }

  /**
   * Analyze skill-wise breakdown
   */
  private analyzeSkillBreakdown(sessions: WritingSession[]) {
    const skills = ['content', 'structure', 'language', 'presentation', 'timeManagement'] as const;
    
    const breakdown = {} as any;
    
    skills.forEach(skill => {
      const scores = sessions.map(s => s.detailedScores[skill]);
      const current = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      // Calculate trend (comparing first half vs second half)
      const midpoint = Math.floor(scores.length / 2);
      const firstHalf = scores.slice(0, midpoint);
      const secondHalf = scores.slice(midpoint);
      
      const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length : 0;
      const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length : 0;
      
      const trend = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
      
      breakdown[skill] = {
        current: Math.round(current * 10) / 10,
        trend: Math.round(trend * 10) / 10
      };
    });
    
    return breakdown;
  }

  /**
   * Analyze writing efficiency metrics
   */
  private analyzeWritingEfficiency(sessions: WritingSession[]) {
    const timeSpents = sessions.map(s => s.metadata.timeSpent);
    const wordCounts = sessions.map(s => s.metadata.wordCount);
    
    // Calculate WPM for each session
    const wpms = sessions.map(s => 
      s.metadata.timeSpent > 0 ? s.metadata.wordCount / s.metadata.timeSpent : 0
    );
    
    const averageWPM = wpms.reduce((sum, wpm) => sum + wpm, 0) / wpms.length;
    
    // Calculate typing efficiency (simplified)
    const efficiency = Math.min(100, (averageWPM / 30) * 100); // 30 WPM as baseline
    
    // Time management assessment
    const avgTimeSpent = timeSpents.reduce((sum, t) => sum + t, 0) / timeSpents.length;
    const timeManagement = avgTimeSpent < 35 ? 'excellent' :
                          avgTimeSpent < 45 ? 'good' :
                          avgTimeSpent < 60 ? 'average' : 'needs_improvement';
    
    // Consistency score (how consistent are the scores)
    const allScores = sessions.map(s => s.score);
    const avgScore = allScores.reduce((sum, s) => sum + s, 0) / allScores.length;
    const variance = allScores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / allScores.length;
    const consistencyScore = Math.max(0, 100 - Math.sqrt(variance));

    return {
      averageWPM: Math.round(averageWPM * 10) / 10,
      typingEfficiency: Math.round(efficiency),
      timeManagement,
      consistencyScore: Math.round(consistencyScore)
    };
  }

  /**
   * Check for achievements based on progress
   */
  private async checkAchievements(sessions: WritingSession[]) {
    const achievements = [];
    
    // First writing submission
    if (sessions.length === 1) {
      achievements.push({
        id: 'first_submission',
        title: 'First Steps',
        description: 'Completed your first writing evaluation',
        unlockedAt: sessions[0].createdAt,
        category: 'milestone'
      });
    }

    // Consistent practice
    if (sessions.length >= 10) {
      achievements.push({
        id: 'consistent_writer',
        title: 'Consistent Writer',
        description: 'Completed 10 writing evaluations',
        unlockedAt: sessions[9].createdAt,
        category: 'practice'
      });
    }

    // High scorer
    const highScores = sessions.filter(s => s.score >= 80);
    if (highScores.length >= 3) {
      achievements.push({
        id: 'high_achiever',
        title: 'High Achiever',
        description: 'Scored 80+ in 3 different answers',
        unlockedAt: highScores[2].createdAt,
        category: 'performance'
      });
    }

    // Perfect structure
    const perfectStructures = sessions.filter(s => s.detailedScores.structure >= 90);
    if (perfectStructures.length >= 2) {
      achievements.push({
        id: 'structure_master',
        title: 'Structure Master',
        description: 'Achieved 90+ structure scores in 2 answers',
        unlockedAt: perfectStructures[1].createdAt,
        category: 'skill'
      });
    }

    return achievements;
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(sessions: WritingSession[]) {
    const recentSessions = sessions.slice(-5); // Last 5 sessions
    const skillAverages = this.analyzeSkillBreakdown(sessions);
    
    const prompt = `Based on these writing performance metrics, provide personalized improvement recommendations:

RECENT PERFORMANCE DATA:
${JSON.stringify({
      sessionCount: sessions.length,
      recentScores: recentSessions.map(s => s.score),
      skillBreakdown: skillAverages,
      subjects: [...new Set(sessions.map(s => s.subject))]
    })}

Generate specific, actionable recommendations in JSON format:
{
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "content|structure|language|practice|strategy",
      "suggestion": "specific actionable advice",
      "expectedImpact": "what improvement to expect"
    }
  ]
}

Focus on the weakest areas and provide practical UPSC-specific advice.`;

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODELS.openai.gpt4,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.recommendations || [];
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return this.getFallbackRecommendations(skillAverages);
    }
  }

  /**
   * Manage user goals and suggest new ones
   */
  private async manageGoals(sessions: WritingSession[]) {
    const currentAverage = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length 
      : 0;

    // Current goals (simulated - would come from database)
    const current = [
      {
        id: 'improve_average',
        title: 'Improve Average Score',
        target: Math.min(100, currentAverage + 10),
        current: currentAverage,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'on_track' as const
      }
    ];

    // Suggested goals based on current performance
    const suggested = [
      {
        title: 'Master Time Management',
        description: 'Complete answers within 40 minutes consistently',
        targetImprovement: 15,
        timeframe: '2 weeks'
      },
      {
        title: 'Improve Structure Scores',
        description: 'Achieve 85+ in structure consistently',
        targetImprovement: 10,
        timeframe: '3 weeks'
      },
      {
        title: 'Content Depth Enhancement',
        description: 'Increase content scores by using more examples',
        targetImprovement: 12,
        timeframe: '1 month'
      }
    ];

    return { current, suggested };
  }

  // Helper methods
  private generateSimulatedSessions(userId: string, timeframe: string): WritingSession[] {
    const count = timeframe === '7d' ? 3 : timeframe === '30d' ? 12 : 25;
    const sessions: WritingSession[] = [];
    
    const subjects = ['General Studies', 'Essay', 'Public Administration'];
    const examTypes = ['UPSC Mains', 'State PSC'];
    
    for (let i = 0; i < count; i++) {
      const baseScore = 60 + Math.random() * 30; // 60-90 range
      const session: WritingSession = {
        id: `session_${i}`,
        userId,
        questionId: `q_${i}`,
        examType: examTypes[Math.floor(Math.random() * examTypes.length)],
        subject: subjects[Math.floor(Math.random() * subjects.length)],
        score: Math.round(baseScore),
        detailedScores: {
          content: Math.round(baseScore + (Math.random() - 0.5) * 10),
          structure: Math.round(baseScore + (Math.random() - 0.5) * 15),
          language: Math.round(baseScore + (Math.random() - 0.5) * 8),
          presentation: Math.round(baseScore + (Math.random() - 0.5) * 5),
          timeManagement: Math.round(baseScore + (Math.random() - 0.5) * 12)
        },
        metadata: {
          timeSpent: 30 + Math.random() * 30, // 30-60 minutes
          wordCount: 600 + Math.random() * 400, // 600-1000 words
          difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
          source: 'text'
        },
        createdAt: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000)
      };
      sessions.push(session);
    }
    
    return sessions;
  }

  private getEmptyAnalytics(timeframe: '7d' | '30d' | '90d' | 'all'): ProgressAnalytics {
    return {
      userId: '',
      timeframe,
      overallTrend: {
        currentAverage: 0,
        previousAverage: 0,
        improvementRate: 0,
        direction: 'stable'
      },
      subjectPerformance: [],
      skillBreakdown: {
        content: { current: 0, trend: 0 },
        structure: { current: 0, trend: 0 },
        language: { current: 0, trend: 0 },
        presentation: { current: 0, trend: 0 },
        timeManagement: { current: 0, trend: 0 }
      },
      writingEfficiency: {
        averageWPM: 0,
        typingEfficiency: 0,
        timeManagement: 'needs_improvement',
        consistencyScore: 0
      },
      achievements: [],
      recommendations: [],
      goals: { current: [], suggested: [] }
    };
  }

  private getFallbackRecommendations(skillAverages: any) {
    const recommendations = [];
    
    // Find weakest skill
    const skills = Object.entries(skillAverages) as [string, { current: number }][];
    const weakestSkill = skills.reduce((min, [skill, data]) => 
      data.current < min.score ? { skill, score: data.current } : min,
      { skill: '', score: 100 }
    );

    if (weakestSkill.score < 70) {
      recommendations.push({
        priority: 'high',
        category: weakestSkill.skill,
        suggestion: `Focus on improving your ${weakestSkill.skill} skills through targeted practice`,
        expectedImpact: '8-12 point improvement expected'
      });
    }

    return recommendations;
  }
}