'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Newspaper, Mic, FileQuestion, PenLine, Book, 
  BarChart3, Users, Settings, ArrowUpRight, 
  Calendar as CalendarIcon, Clock, CheckCircle,
  TrendingUp, Target, Award, ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Import services
import { onHistoryUpdate, type HistoryEntry } from '@/services/historyService';
import { getUserQuizStats, type UserQuizStats } from '@/services/quizAttemptsService';
import { getUserUsage, type UsageStats } from '@/services/usageService';

// Import improved layout components
import ImprovedMainLayout from './components/layout/ImprovedMainLayout';
import StatCard from '@/app/dashboard/components/cards/StatCard';

// Extended interface
interface ExtendedUserQuizStats extends UserQuizStats {
  streak: number;
  improvement: number;
}

// Production-ready styles with performance optimization
const styles = {
  // Optimized glassmorphic styles - reduced blur for better performance
  card: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md",
  heroCard: "bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-900/90 dark:to-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-lg",
  statCard: "bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-200/40 dark:border-gray-700/40 rounded-lg p-4 transition-all duration-200 hover:shadow-md hover:scale-105",
  quickAction: "bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-4 transition-all duration-200 hover:from-primary/10 hover:to-accent/10 hover:shadow-sm",
} as const;

// Quick action items for improved UX
const quickActions = [
  {
    title: 'Start Daily Quiz',
    description: 'Continue your practice streak',
    icon: <FileQuestion className="h-5 w-5" />,
    href: '/daily-quiz',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'from-blue-50 to-blue-100',
  },
  {
    title: 'Analyze Article',
    description: 'Convert news to questions',
    icon: <Newspaper className="h-5 w-5" />,
    href: '/newspaper-analysis',
    color: 'from-green-500 to-green-600',
    bgColor: 'from-green-50 to-green-100',
  },
  {
    title: 'Practice Writing',
    description: 'Improve answer quality',
    icon: <PenLine className="h-5 w-5" />,
    href: '/writing-practice',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'from-purple-50 to-purple-100',
  },
  {
    title: 'Mock Interview',
    description: 'AI-powered practice',
    icon: <Mic className="h-5 w-5" />,
    href: '/mock-interview',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'from-orange-50 to-orange-100',
  },
];

// Production Dashboard with improved UX/UI
export default function ImprovedDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State management
  const [historyLoading, setHistoryLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [quizStats, setQuizStats] = useState<ExtendedUserQuizStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Computed values
  const totalQuestions = quizStats?.totalAttempted || 0;
  const accuracy = quizStats?.accuracy || 0;
  const streak = quizStats?.streak || 0;
  const weeklyGoal = 100;
  const weeklyProgress = Math.min((totalQuestions / weeklyGoal) * 100, 100);

  // Data fetching
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [stats, usage] = await Promise.all([
          getUserQuizStats(user.uid),
          getUserUsage(user.uid)
        ]);
        
        const extendedStats: ExtendedUserQuizStats = {
          ...stats,
          streak: 7, // Example data
          improvement: 15
        };
        
        setQuizStats(extendedStats);
        setUsageStats(usage);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchData();

    // Real-time history updates
    const unsubscribe = onHistoryUpdate(user.uid, (historyData) => {
      setHistory(historyData);
      setHistoryLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  // Loading state
  if (statsLoading) {
    return (
      <ImprovedMainLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </ImprovedMainLayout>
    );
  }

  return (
    <ImprovedMainLayout>
      <div className="space-y-8 pb-8">
        {/* Hero Section - Redesigned for better hierarchy */}
        <motion.div 
          className={cn(styles.heroCard, "p-6 relative overflow-hidden")}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-accent/20 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Welcome Section */}
              <div className="space-y-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Welcome back, {user?.displayName || 'Student'}! 👋
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              {/* Weekly Progress */}
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 min-w-[280px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Weekly Goal
                  </span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {totalQuestions}/{weeklyGoal}
                  </Badge>
                </div>
                <Progress value={weeklyProgress} className="h-2 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {weeklyProgress >= 80 ? '🔥 Amazing progress!' : 'Keep going, you can do it!'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions - Improved for discoverability */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Quick Actions
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/tools" className="text-primary hover:text-primary/80">
                View all tools <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={action.href} className="block group">
                  <div className={cn(
                    styles.quickAction,
                    "group-hover:scale-105 group-focus:scale-105 cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                  )}>
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "p-2 rounded-lg bg-gradient-to-br",
                        action.bgColor,
                        "group-hover:shadow-sm transition-all duration-200"
                      )}>
                        <div className={cn("text-transparent bg-clip-text bg-gradient-to-br", action.color)}>
                          {action.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats Overview - Improved layout */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Performance Overview
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Questions Attempted</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {totalQuestions.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FileQuestion className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span className="text-xs">+12% this week</span>
              </div>
            </motion.div>

            <motion.div
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {accuracy.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span className="text-xs">+5.2% this month</span>
              </div>
            </motion.div>

            <motion.div
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Study Streak</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {streak} days
                  </p>
                </div>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-orange-600 dark:text-orange-400">
                <Clock className="h-3 w-3 mr-1" />
                <span className="text-xs">Personal best!</span>
              </div>
            </motion.div>

            <motion.div
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tools Used</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {(usageStats?.newspaperAnalysis || 0) + (usageStats?.mockInterview || 0)}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-purple-600 dark:text-purple-400">
                <Newspaper className="h-3 w-3 mr-1" />
                <span className="text-xs">{usageStats?.newspaperAnalysis || 0} articles analyzed</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Recent Activity - Simplified for mobile */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Activity
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/history">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {historyLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))
              ) : history.length > 0 ? (
                history.slice(0, 3).map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    className={styles.card + " p-4"}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Newspaper className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          Article Analysis
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {entry.timestamp ? new Date(entry.timestamp.toDate()).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className={cn(styles.card, "p-8 text-center")}>
                  <Book className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No activity yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start using our tools to see your progress here
                  </p>
                  <Button asChild>
                    <Link href="/newspaper-analysis">
                      Analyze your first article
                    </Link>
                  </Button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ImprovedMainLayout>
  );
}