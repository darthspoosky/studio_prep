'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Target, Clock, TrendingUp, AlertTriangle, CheckCircle2,
  Calendar, BookOpen, FileQuestion, Lightbulb, Star, Zap,
  ArrowRight, ChevronRight, Timer, Award, BarChart3
} from 'lucide-react';

// Interfaces matching our backend framework
interface Recommendation {
  id: string;
  type: 'study_topic' | 'practice_question' | 'resource' | 'strategy' | 'timing' | 'revision';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string[];
  confidence: number;
  estimatedTime: number;
  difficulty: number;
  tags: string[];
  content?: {
    topicId?: string;
    contentId?: string;
    resourceUrl?: string;
    questions?: string[];
  };
  metadata: {
    relevanceScore: number;
    trendingScore: number;
    personalFit: number;
    urgency: number;
  };
  deadline?: Date;
  actionable: {
    immediate: string[];
    preparation: string[];
    followUp: string[];
  };
  metrics: {
    expectedImprovement: number;
    successProbability: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

interface RecommendationSet {
  userId: string;
  generatedAt: Date;
  context: {
    currentProgress: number;
    timeToExam: number;
    studyMomentum: 'low' | 'medium' | 'high';
    recentActivity: string;
  };
  immediate: Recommendation[];
  today: Recommendation[];
  thisWeek: Recommendation[];
  strategic: Recommendation[];
  adaptive: {
    basedOnPerformance: Recommendation[];
    basedOnTime: Recommendation[];
    basedOnWeakness: Recommendation[];
    basedOnTrends: Recommendation[];
  };
  summary: {
    totalRecommendations: number;
    priorityDistribution: Record<string, number>;
    estimatedTotalTime: number;
    keyFocusAreas: string[];
    criticalActions: string[];
  };
}

interface RecommendationDashboardProps {
  userId: string;
  className?: string;
}

export function RecommendationDashboard({ userId, className }: RecommendationDashboardProps) {
  const [recommendations, setRecommendations] = useState<RecommendationSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'immediate' | 'today' | 'week' | 'strategic' | 'adaptive'>('immediate');
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  const glassmorphicStyles = {
    card: "relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg",
    container: "relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
  };

  // Mock data
  useEffect(() => {
    const mockRecommendations: RecommendationSet = {
      userId,
      generatedAt: new Date(),
      context: {
        currentProgress: 68,
        timeToExam: 120,
        studyMomentum: 'medium',
        recentActivity: 'Studied Polity for 2 hours, attempted 15 questions'
      },
      immediate: [
        {
          id: 'imm_1',
          type: 'study_topic',
          priority: 'critical',
          title: 'Complete Constitutional Amendments',
          description: 'Focus on Article 368 and amendment procedures - high weightage topic',
          reasoning: [
            'Appeared in last 3 UPSC papers',
            'Your weak area in recent tests',
            'High probability for upcoming exam'
          ],
          confidence: 95,
          estimatedTime: 120,
          difficulty: 7,
          tags: ['polity', 'constitution', 'high-priority'],
          metadata: {
            relevanceScore: 95,
            trendingScore: 88,
            personalFit: 85,
            urgency: 95
          },
          actionable: {
            immediate: ['Read Article 368', 'Make notes on amendment types'],
            preparation: ['Gather Laxmikant chapter', 'Find practice questions'],
            followUp: ['Practice MCQs', 'Create mind map']
          },
          metrics: {
            expectedImprovement: 15,
            successProbability: 85,
            riskLevel: 'low'
          }
        },
        {
          id: 'imm_2',
          type: 'practice_question',
          priority: 'high',
          title: 'Practice Economics MCQs',
          description: 'Solve 20 questions on Economic Survey topics to improve weak area',
          reasoning: [
            'Economics is your weakest subject',
            'Economic Survey questions trending',
            'Practice improves retention by 40%'
          ],
          confidence: 88,
          estimatedTime: 60,
          difficulty: 6,
          tags: ['economics', 'practice', 'mcq'],
          metadata: {
            relevanceScore: 85,
            trendingScore: 92,
            personalFit: 95,
            urgency: 80
          },
          actionable: {
            immediate: ['Select 20 Economics MCQs', 'Set 45-minute timer'],
            preparation: ['Review basic concepts', 'Keep calculator ready'],
            followUp: ['Analyze wrong answers', 'Note knowledge gaps']
          },
          metrics: {
            expectedImprovement: 20,
            successProbability: 75,
            riskLevel: 'medium'
          }
        }
      ],
      today: [
        {
          id: 'today_1',
          type: 'revision',
          priority: 'high',
          title: 'Revise Medieval History',
          description: 'Quick revision of Delhi Sultanate and Mughal Empire - due for review',
          reasoning: [
            'Last studied 2 weeks ago',
            'Forgetting curve indicates review needed',
            'High weightage in GS1'
          ],
          confidence: 90,
          estimatedTime: 90,
          difficulty: 5,
          tags: ['history', 'revision', 'gs1'],
          metadata: {
            relevanceScore: 80,
            trendingScore: 70,
            personalFit: 90,
            urgency: 75
          },
          actionable: {
            immediate: ['Review key dates and rulers', 'Go through previous notes'],
            preparation: ['Gather study materials', 'Find maps'],
            followUp: ['Take practice test', 'Update knowledge gaps']
          },
          metrics: {
            expectedImprovement: 12,
            successProbability: 90,
            riskLevel: 'low'
          }
        },
        {
          id: 'today_2',
          type: 'resource',
          priority: 'medium',
          title: 'Watch Environment Video Lecture',
          description: 'Environmental legislation and policies - visual learning recommended',
          reasoning: [
            'Complex topic needs visual explanation',
            'Recent environment questions increasing',
            'Your learning style preference'
          ],
          confidence: 78,
          estimatedTime: 45,
          difficulty: 6,
          tags: ['environment', 'video', 'gs3'],
          metadata: {
            relevanceScore: 75,
            trendingScore: 85,
            personalFit: 80,
            urgency: 60
          },
          actionable: {
            immediate: ['Find quality video resource', 'Prepare notebook'],
            preparation: ['Ensure good internet', 'Clear distractions'],
            followUp: ['Make summary notes', 'Find related articles']
          },
          metrics: {
            expectedImprovement: 10,
            successProbability: 80,
            riskLevel: 'low'
          }
        }
      ],
      thisWeek: [
        {
          id: 'week_1',
          type: 'strategy',
          priority: 'medium',
          title: 'Complete GS2 Governance Module',
          description: 'Finish entire governance section to reach weekly milestone',
          reasoning: [
            'Fits your weekly study plan',
            'Governance has high weightage',
            'Will boost confidence'
          ],
          confidence: 85,
          estimatedTime: 480,
          difficulty: 6,
          tags: ['governance', 'gs2', 'milestone'],
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          metadata: {
            relevanceScore: 80,
            trendingScore: 75,
            personalFit: 90,
            urgency: 60
          },
          actionable: {
            immediate: ['Plan daily breakdown', 'Gather all resources'],
            preparation: ['Schedule study sessions', 'Set daily targets'],
            followUp: ['Take comprehensive test', 'Review weak areas']
          },
          metrics: {
            expectedImprovement: 18,
            successProbability: 80,
            riskLevel: 'low'
          }
        }
      ],
      strategic: [
        {
          id: 'strategic_1',
          type: 'strategy',
          priority: 'medium',
          title: 'Strengthen Economics Foundation',
          description: 'Long-term plan to improve your weakest subject area',
          reasoning: [
            'Economics consistently lowest scores',
            'High weightage in both prelims and mains',
            'Time available for structured improvement'
          ],
          confidence: 75,
          estimatedTime: 30,
          difficulty: 8,
          tags: ['economics', 'foundation', 'long-term'],
          metadata: {
            relevanceScore: 85,
            trendingScore: 70,
            personalFit: 95,
            urgency: 40
          },
          actionable: {
            immediate: ['Assess current economics level', 'Identify specific gaps'],
            preparation: ['Create 4-week study plan', 'Gather quality resources'],
            followUp: ['Weekly assessment tests', 'Adjust plan based on progress']
          },
          metrics: {
            expectedImprovement: 35,
            successProbability: 70,
            riskLevel: 'medium'
          }
        }
      ],
      adaptive: {
        basedOnPerformance: [],
        basedOnTime: [],
        basedOnWeakness: [],
        basedOnTrends: []
      },
      summary: {
        totalRecommendations: 5,
        priorityDistribution: { critical: 1, high: 2, medium: 2, low: 0 },
        estimatedTotalTime: 375,
        keyFocusAreas: ['polity', 'economics', 'history', 'governance'],
        criticalActions: ['Complete Constitutional Amendments']
      }
    };

    setRecommendations(mockRecommendations);
    setLoading(false);
  }, [userId]);

  const handleActionComplete = (recommendationId: string) => {
    setCompletedActions(prev => new Set([...prev, recommendationId]));
  };

  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'study_topic': return <BookOpen className="h-4 w-4" />;
      case 'practice_question': return <FileQuestion className="h-4 w-4" />;
      case 'resource': return <Lightbulb className="h-4 w-4" />;
      case 'strategy': return <Target className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      case 'revision': return <TrendingUp className="h-4 w-4" />;
    }
  };

  const renderRecommendationCard = (rec: Recommendation, index: number) => {
    const isCompleted = completedActions.has(rec.id);
    
    return (
      <motion.div
        key={rec.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`${glassmorphicStyles.card} group ${isCompleted ? 'opacity-60' : ''}`}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getPriorityColor(rec.priority)} border text-xs px-2 py-1`}>
                  {getTypeIcon(rec.type)}
                  <span className="ml-1 capitalize">{rec.priority}</span>
                </Badge>
                <Badge variant="outline" className="bg-white/10 border-white/20 text-xs">
                  {rec.estimatedTime}m
                </Badge>
                <Badge variant="outline" className="bg-white/10 border-white/20 text-xs">
                  {rec.confidence}% confidence
                </Badge>
              </div>
              <h3 className={`font-semibold mb-1 ${isCompleted ? 'line-through' : ''}`}>
                {rec.title}
              </h3>
              <p className="text-sm text-foreground/70 mb-3">
                {rec.description}
              </p>
            </div>
            
            {isCompleted && (
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
            )}
          </div>

          {/* Reasoning */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-foreground/80 mb-2">Why this recommendation:</h4>
            <ul className="space-y-1">
              {rec.reasoning.map((reason, i) => (
                <li key={i} className="text-xs text-foreground/60 flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Immediate Actions */}
          {rec.actionable.immediate.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-foreground/80 mb-2">Immediate actions:</h4>
              <div className="space-y-1">
                {rec.actionable.immediate.map((action, i) => (
                  <div key={i} className="text-xs text-foreground/60 flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-blue-400" />
                    {action}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-sm font-medium text-green-400">
                  +{rec.metrics.expectedImprovement}%
                </div>
                <div className="text-xs text-foreground/60">Expected Gain</div>
              </div>
              <div>
                <div className="text-sm font-medium text-blue-400">
                  {rec.metrics.successProbability}%
                </div>
                <div className="text-xs text-foreground/60">Success Rate</div>
              </div>
              <div>
                <div className={`text-sm font-medium ${
                  rec.metrics.riskLevel === 'low' ? 'text-green-400' :
                  rec.metrics.riskLevel === 'medium' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {rec.metrics.riskLevel}
                </div>
                <div className="text-xs text-foreground/60">Risk Level</div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {rec.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="outline" className="bg-white/5 border-white/10 text-xs">
                  {tag}
                </Badge>
              ))}
              {rec.tags.length > 3 && (
                <Badge variant="outline" className="bg-white/5 border-white/10 text-xs">
                  +{rec.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            {isCompleted ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            ) : (
              <Button
                size="sm"
                onClick={() => handleActionComplete(rec.id)}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
              >
                Start Action
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className={`${glassmorphicStyles.container} p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Context */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={glassmorphicStyles.container}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-400" />
                AI Recommendations
              </h2>
              <p className="text-foreground/70 mt-1">
                Personalized study suggestions based on your progress and performance
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-blue-400">
                {recommendations.summary.totalRecommendations}
              </div>
              <div className="text-sm text-foreground/70">Active Recommendations</div>
            </div>
          </div>

          {/* Context Summary */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className={`${glassmorphicStyles.card} p-4 text-center`}>
              <div className="text-2xl font-bold text-green-400">
                {recommendations.context.currentProgress}%
              </div>
              <div className="text-sm text-foreground/70">Progress</div>
            </div>
            <div className={`${glassmorphicStyles.card} p-4 text-center`}>
              <div className="text-2xl font-bold text-amber-400">
                {recommendations.context.timeToExam}
              </div>
              <div className="text-sm text-foreground/70">Days to Exam</div>
            </div>
            <div className={`${glassmorphicStyles.card} p-4 text-center`}>
              <div className="text-2xl font-bold text-purple-400 capitalize">
                {recommendations.context.studyMomentum}
              </div>
              <div className="text-sm text-foreground/70">Momentum</div>
            </div>
            <div className={`${glassmorphicStyles.card} p-4 text-center`}>
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(recommendations.summary.estimatedTotalTime / 60)}h
              </div>
              <div className="text-sm text-foreground/70">Est. Time</div>
            </div>
          </div>

          {/* Key Focus Areas */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground/80 mb-3">Key Focus Areas</h3>
            <div className="flex flex-wrap gap-2">
              {recommendations.summary.keyFocusAreas.map((area, i) => (
                <Badge key={i} variant="outline" className="bg-white/10 border-white/20 capitalize">
                  {area}
                </Badge>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-sm font-medium text-foreground/80 mb-2">Recent Activity</h3>
            <p className="text-sm text-foreground/70">{recommendations.context.recentActivity}</p>
          </div>
        </div>
      </motion.div>

      {/* Recommendations Tabs */}
      <Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
        <TabsList className="grid w-full grid-cols-5 bg-white/10 border border-white/20">
          <TabsTrigger value="immediate" className="data-[state=active]:bg-white/20">
            <Clock className="h-4 w-4 mr-2" />
            Now
          </TabsTrigger>
          <TabsTrigger value="today" className="data-[state=active]:bg-white/20">
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </TabsTrigger>
          <TabsTrigger value="week" className="data-[state=active]:bg-white/20">
            <Target className="h-4 w-4 mr-2" />
            This Week
          </TabsTrigger>
          <TabsTrigger value="strategic" className="data-[state=active]:bg-white/20">
            <Star className="h-4 w-4 mr-2" />
            Strategic
          </TabsTrigger>
          <TabsTrigger value="adaptive" className="data-[state=active]:bg-white/20">
            <Zap className="h-4 w-4 mr-2" />
            Adaptive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="immediate" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.immediate.map((rec, index) => renderRecommendationCard(rec, index))}
          </div>
          {recommendations.immediate.length === 0 && (
            <div className={`${glassmorphicStyles.card} text-center py-8`}>
              <CheckCircle2 className="h-8 w-8 mx-auto text-green-400 mb-3" />
              <p className="text-foreground/70">No immediate actions needed. Great job!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.today.map((rec, index) => renderRecommendationCard(rec, index))}
          </div>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.thisWeek.map((rec, index) => renderRecommendationCard(rec, index))}
          </div>
        </TabsContent>

        <TabsContent value="strategic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.strategic.map((rec, index) => renderRecommendationCard(rec, index))}
          </div>
        </TabsContent>

        <TabsContent value="adaptive" className="space-y-4">
          <div className={`${glassmorphicStyles.card} text-center py-12`}>
            <Brain className="h-12 w-12 mx-auto text-blue-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Adaptive Recommendations</h3>
            <p className="text-foreground/60 mb-4">
              AI will generate personalized recommendations based on your performance patterns
            </p>
            <Button variant="outline" className="bg-white/10 border-white/20">
              Analyze Performance
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}