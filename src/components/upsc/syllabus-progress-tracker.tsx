'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PieChart, Pie, Cell, AreaChart, Area,
  LineChart, Line
} from 'recharts';
import {
  BookOpen, Target, Trophy, Calendar as CalendarIcon, Clock,
  TrendingUp, AlertCircle, CheckCircle2, Brain, Zap, Star
} from 'lucide-react';

// Interfaces matching our backend framework
interface TopicProgress {
  topicId: string;
  topicName: string;
  level: 'paper' | 'subject' | 'unit' | 'topic' | 'subtopic';
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered' | 'needs_revision';
  completionPercentage: number;
  masteryLevel: number;
  totalTimeSpent: number;
  lastStudied: Date | null;
  nextReview: Date | null;
  confidenceLevel: number;
  retentionRate: number;
}

interface SyllabusProgress {
  userId: string;
  lastUpdated: Date;
  overall: {
    completionPercentage: number;
    masteryPercentage: number;
    totalTopics: number;
    completedTopics: number;
    masteredTopics: number;
    totalTimeSpent: number;
    studyStreak: number;
    averageSessionDuration: number;
  };
  byPaper: Record<string, {
    name: string;
    completion: number;
    mastery: number;
    timeSpent: number;
    topicsCount: number;
    completedCount: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  bySubject: Record<string, {
    name: string;
    paperCode: string;
    completion: number;
    mastery: number;
    timeSpent: number;
    topicsCount: number;
    trend: 'improving' | 'stable' | 'declining';
    nextMilestone: string;
  }>;
  topics: TopicProgress[];
}

interface SyllabusProgressTrackerProps {
  userId: string;
  className?: string;
}

export function SyllabusProgressTracker({ userId, className }: SyllabusProgressTrackerProps) {
  const [progress, setProgress] = useState<SyllabusProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'papers' | 'subjects' | 'topics'>('overview');
  const [selectedPaper, setSelectedPaper] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Mock data - in production, this would fetch from the backend
  useEffect(() => {
    const mockProgress: SyllabusProgress = {
      userId,
      lastUpdated: new Date(),
      overall: {
        completionPercentage: 68,
        masteryPercentage: 42,
        totalTopics: 156,
        completedTopics: 106,
        masteredTopics: 65,
        totalTimeSpent: 240,
        studyStreak: 15,
        averageSessionDuration: 85
      },
      byPaper: {
        'gs1': {
          name: 'GS Paper I',
          completion: 75,
          mastery: 48,
          timeSpent: 80,
          topicsCount: 45,
          completedCount: 34,
          priority: 'high'
        },
        'gs2': {
          name: 'GS Paper II',
          completion: 62,
          mastery: 38,
          timeSpent: 65,
          topicsCount: 38,
          completedCount: 24,
          priority: 'high'
        },
        'gs3': {
          name: 'GS Paper III',
          completion: 58,
          mastery: 35,
          timeSpent: 55,
          topicsCount: 42,
          completedCount: 24,
          priority: 'medium'
        },
        'gs4': {
          name: 'GS Paper IV',
          completion: 78,
          mastery: 65,
          timeSpent: 40,
          topicsCount: 31,
          completedCount: 24,
          priority: 'low'
        }
      },
      bySubject: {
        'history': {
          name: 'History',
          paperCode: 'gs1',
          completion: 82,
          mastery: 65,
          timeSpent: 45,
          topicsCount: 24,
          trend: 'improving',
          nextMilestone: 'Complete Medieval India'
        },
        'geography': {
          name: 'Geography',
          paperCode: 'gs1',
          completion: 68,
          mastery: 42,
          timeSpent: 35,
          topicsCount: 21,
          trend: 'stable',
          nextMilestone: 'World Geography basics'
        },
        'polity': {
          name: 'Polity',
          paperCode: 'gs2',
          completion: 75,
          mastery: 58,
          timeSpent: 38,
          topicsCount: 18,
          trend: 'improving',
          nextMilestone: 'Constitutional Amendments'
        },
        'economics': {
          name: 'Economics',
          paperCode: 'gs3',
          completion: 45,
          mastery: 28,
          timeSpent: 32,
          topicsCount: 26,
          trend: 'declining',
          nextMilestone: 'Basic Economic Concepts'
        }
      },
      topics: []
    };
    
    setProgress(mockProgress);
    setLoading(false);
  }, [userId]);

  const glassmorphicStyles = {
    card: "relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg",
    container: "relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
  };

  if (loading) {
    return (
      <div className={`${glassmorphicStyles.container} p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/20 rounded"></div>
            <div className="h-4 bg-white/20 rounded w-5/6"></div>
            <div className="h-4 bg-white/20 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!progress) return null;

  const paperData = Object.entries(progress.byPaper).map(([key, paper]) => ({
    name: paper.name,
    completion: paper.completion,
    mastery: paper.mastery,
    timeSpent: paper.timeSpent
  }));

  const subjectData = Object.entries(progress.bySubject).map(([key, subject]) => ({
    name: subject.name,
    completion: subject.completion,
    mastery: subject.mastery,
    trend: subject.trend
  }));

  const overallData = [
    { name: 'Completed', value: progress.overall.completionPercentage, color: '#10B981' },
    { name: 'Remaining', value: 100 - progress.overall.completionPercentage, color: '#374151' }
  ];

  const masteryData = [
    { name: 'Mastered', value: progress.overall.masteryPercentage, color: '#8B5CF6' },
    { name: 'In Progress', value: progress.overall.completionPercentage - progress.overall.masteryPercentage, color: '#F59E0B' },
    { name: 'Not Started', value: 100 - progress.overall.completionPercentage, color: '#6B7280' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Overall Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={glassmorphicStyles.container}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-400" />
                Syllabus Progress Tracker
              </h2>
              <p className="text-foreground/70 mt-1">
                Track your UPSC preparation across all subjects and topics
              </p>
            </div>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-lg px-3 py-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              {progress.overall.studyStreak} day streak
            </Badge>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`${glassmorphicStyles.card} p-4 text-center`}>
              <div className="text-3xl font-bold text-blue-400">{progress.overall.completionPercentage}%</div>
              <div className="text-sm text-foreground/70">Overall Completion</div>
            </div>
            <div className={`${glassmorphicStyles.card} p-4 text-center`}>
              <div className="text-3xl font-bold text-purple-400">{progress.overall.masteryPercentage}%</div>
              <div className="text-sm text-foreground/70">Mastery Level</div>
            </div>
            <div className={`${glassmorphicStyles.card} p-4 text-center`}>
              <div className="text-3xl font-bold text-green-400">{progress.overall.completedTopics}</div>
              <div className="text-sm text-foreground/70">Topics Completed</div>
            </div>
            <div className={`${glassmorphicStyles.card} p-4 text-center`}>
              <div className="text-3xl font-bold text-amber-400">{progress.overall.totalTimeSpent}h</div>
              <div className="text-sm text-foreground/70">Study Time</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs for Different Views */}
      <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
        <div className="flex justify-between items-center">
          <TabsList className="bg-white/10 border border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="papers" className="data-[state=active]:bg-white/20">
              Papers
            </TabsTrigger>
            <TabsTrigger value="subjects" className="data-[state=active]:bg-white/20">
              Subjects
            </TabsTrigger>
            <TabsTrigger value="topics" className="data-[state=active]:bg-white/20">
              Topics
            </TabsTrigger>
          </TabsList>
          
          <Select value={selectedPaper} onValueChange={setSelectedPaper}>
            <SelectTrigger className="w-48 bg-white/10 border-white/20">
              <SelectValue placeholder="Filter by paper" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Papers</SelectItem>
              <SelectItem value="gs1">GS Paper I</SelectItem>
              <SelectItem value="gs2">GS Paper II</SelectItem>
              <SelectItem value="gs3">GS Paper III</SelectItem>
              <SelectItem value="gs4">GS Paper IV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Overall Progress Pie Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={glassmorphicStyles.card}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overallData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {overallData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4">
                  <div className="text-2xl font-bold">{progress.overall.completionPercentage}%</div>
                  <div className="text-sm text-foreground/70">Syllabus Completion</div>
                </div>
              </CardContent>
            </motion.div>

            {/* Mastery Distribution */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={glassmorphicStyles.card}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Mastery Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={masteryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {masteryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4">
                  <div className="text-2xl font-bold">{progress.overall.masteryPercentage}%</div>
                  <div className="text-sm text-foreground/70">Topics Mastered</div>
                </div>
              </CardContent>
            </motion.div>
          </div>

          {/* Paper-wise Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={glassmorphicStyles.card}
          >
            <CardHeader>
              <CardTitle>Paper-wise Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paperData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                    <YAxis stroke="rgba(255,255,255,0.7)" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="completion" fill="#3B82F6" name="Completion %" />
                    <Bar dataKey="mastery" fill="#8B5CF6" name="Mastery %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </motion.div>
        </TabsContent>

        {/* Papers Tab */}
        <TabsContent value="papers" className="space-y-6">
          <div className="grid gap-4">
            {Object.entries(progress.byPaper).map(([key, paper], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={glassmorphicStyles.card}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{paper.name}</h3>
                      <p className="text-sm text-foreground/70">
                        {paper.completedCount} of {paper.topicsCount} topics completed
                      </p>
                    </div>
                    <Badge 
                      variant={paper.priority === 'high' ? 'destructive' : paper.priority === 'medium' ? 'default' : 'secondary'}
                      className="bg-white/10 border-white/20"
                    >
                      {paper.priority} priority
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completion</span>
                        <span>{paper.completion}%</span>
                      </div>
                      <Progress value={paper.completion} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Mastery</span>
                        <span>{paper.mastery}%</span>
                      </div>
                      <Progress value={paper.mastery} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <Clock className="h-4 w-4" />
                      {paper.timeSpent}h studied
                    </div>
                    <Button variant="outline" size="sm" className="bg-white/10 border-white/20">
                      View Details
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(progress.bySubject).map(([key, subject], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={glassmorphicStyles.card}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{subject.name}</h3>
                      <p className="text-sm text-foreground/70">{subject.paperCode.toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {subject.trend === 'improving' && <TrendingUp className="h-4 w-4 text-green-400" />}
                      {subject.trend === 'declining' && <AlertCircle className="h-4 w-4 text-red-400" />}
                      {subject.trend === 'stable' && <CheckCircle2 className="h-4 w-4 text-blue-400" />}
                      <Badge variant="outline" className="bg-white/10 border-white/20 text-xs">
                        {subject.trend}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{subject.completion}%</span>
                      </div>
                      <Progress value={subject.completion} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Mastery</span>
                        <span>{subject.mastery}%</span>
                      </div>
                      <Progress value={subject.mastery} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-sm">
                      <span className="text-foreground/70">Next milestone:</span>
                      <div className="font-medium">{subject.nextMilestone}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={glassmorphicStyles.card}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Topic-level Progress</h3>
              <div className="text-center py-12">
                <Star className="h-12 w-12 mx-auto text-foreground/30 mb-4" />
                <p className="text-foreground/70">
                  Detailed topic tracking will be available once you start studying specific topics.
                </p>
                <Button className="mt-4" variant="outline">
                  Start Studying
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}