

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Newspaper, Mic, FileQuestion, PenLine, Book, 
  BarChart3, Users, Settings, ArrowUpRight, 
  MoreVertical, Filter, ArrowUpDown, Library,
  Calendar as CalendarIcon, Clock, CheckCircle
} from 'lucide-react';
import { onHistoryUpdate, type HistoryEntry } from '@/services/historyService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, CartesianGrid, AreaChart, Area, ResponsiveContainer } from "recharts";
import { Skeleton } from '@/components/ui/skeleton';
import { isToday } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { UserNav } from '@/components/layout/user-nav';
import { getUserQuizStats, type UserQuizStats } from '@/services/quizAttemptsService';

// Extended interface with additional required properties
interface ExtendedUserQuizStats extends UserQuizStats {
  streak: number;
  improvement: number;
}

// Import our refactored components
import StatCard from '@/app/dashboard/components/cards/StatCard';
import HistoryCard from '@/app/dashboard/components/cards/HistoryCard';
import DailyGoalChart from '@/app/dashboard/components/charts/DailyGoalChart';
import { QuestionsBySubjectChart } from './components/charts/QuestionsBySubjectChart';
import WeeklyAccuracyChart from './components/charts/WeeklyAccuracyChart';
import { getUserUsage, type UsageStats } from '@/services/usageService';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  ChartContainer, ChartTooltip, ChartTooltipContent, 
  ChartConfig, ChartLegend, ChartLegendContent 
} from '@/components/ui/chart';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, DropdownMenuContent, 
  DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

// Import our refactored layout components
import MainLayout from './components/layout/MainLayout';
import LeftSidebar from './components/layout/LeftSidebar';
import RightSidebar from './components/layout/RightSidebar';
import MobileHeader from './components/layout/MobileHeader';
import { glassmorphicStyles } from './styles/glassmorphic';

// --- NEW CHART COMPONENTS & DATA ---

const questionsBySubjectData = [
  { paper: "GS I", History: 40, Geography: 24, Society: 24 },
  { paper: "GS II", Polity: 30, Governance: 13, "Intl. Relations": 22 },
  { paper: "GS III", Economy: 32, Science: 14, Environment: 20 },
  { paper: "GS IV", Ethics: 25, "Case Studies": 32 },
];

const questionsBySubjectConfig = {
  History: { label: "History", color: "#FDB16E" },
  Geography: { label: "Geography", color: "#CE96FB" },
  Society: { label: "Society", color: "#73CFFF" },
  Polity: { label: "Polity", color: "#FF8576" },
  Governance: { label: "Governance", color: "#E1E05B" },
  "Intl. Relations": { label: "Intl. Relations", color: "#4896FE" },
  Environment: { label: "Environment", color: "#16CBC7" },
} satisfies ChartConfig;

const allAccuracyData = {
  daily: [
    { day: 'Sun', accuracy: 82 }, { day: 'Mon', accuracy: 75 },
    { day: 'Tue', accuracy: 91 }, { day: 'Wed', accuracy: 88 },
    { day: 'Thu', accuracy: 72 }, { day: 'Fri', accuracy: 85 },
    { day: 'Sat', accuracy: 89 }
  ],
  weekly: [
    { week: 'Week 1', accuracy: 78 }, { week: 'Week 2', accuracy: 82 },
    { week: 'Week 3', accuracy: 87 }, { week: 'Week 4', accuracy: 84 }
  ],
  monthly: [
    { month: 'Jan', accuracy: 76 }, { month: 'Feb', accuracy: 81 },
    { month: 'Mar', accuracy: 88 }, { month: 'Apr', accuracy: 85 },
  ]
};

const weeklyAccuracyConfig = {
  accuracy: { label: "Accuracy", color: "#887CFD" },
} satisfies ChartConfig;

/**
 * New Dashboard Page with Glassmorphic Design
 * Implements modern, frosted-glass UI inspired by Adobe Experience Cloud
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // States
  const [historyLoading, setHistoryLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [quizStats, setQuizStats] = useState<ExtendedUserQuizStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [accuracyView, setAccuracyView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  // Mock data
  const scheduleItems = [
    { time: '09:00 AM', title: 'Daily Quiz', completed: true, icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
    { time: '11:00 AM', title: 'Newspaper Analysis', completed: true, icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
    { time: '02:00 PM', title: 'Mock Interview Session', completed: false, icon: <Clock className="w-4 h-4 text-amber-500" /> },
    { time: '04:00 PM', title: 'Answer Writing Practice', completed: false, icon: <Clock className="w-4 h-4 text-amber-500" /> },
  ];

  // Tool statistics
  const toolStats = [
    { title: 'Questions Attempted', value: quizStats?.totalAttempted, icon: <FileQuestion className="h-6 w-6" />, color: 'primary' },
    { title: 'Accuracy', value: quizStats?.accuracy, suffix: '%', icon: <BarChart3 className="h-6 w-6" />, color: 'accent' },
    { title: 'Articles Analyzed', value: usageStats?.newspaperAnalysis, icon: <Newspaper className="h-6 w-6" />, color: 'secondary' },
    { title: 'Mock Interviews', value: usageStats?.mockInterview, icon: <Mic className="h-6 w-6" />, color: 'warning' },
  ];

  // Fetch data
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    setHistoryLoading(true);
    setStatsLoading(true);

    // Fetch one-time stats
    const fetchStaticData = async () => {
      try {
        const [stats, usage] = await Promise.all([
          getUserQuizStats(user.uid),
          getUserUsage(user.uid)
        ]);
        const extendedStats: ExtendedUserQuizStats = {
          ...stats,
          streak: 3,
          improvement: 12
        };
        setQuizStats(extendedStats);
        setUsageStats(usage);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchStaticData();

    // Set up real-time listener for history
    const unsubscribe = onHistoryUpdate(user.uid, (historyData) => {
      setHistory(historyData);
      setHistoryLoading(false); // Set loading to false once initial data is loaded
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
    
  }, [user, router]);


  // Memoize schedule content
  const scheduleContent = useMemo(() => (
    scheduleItems.map((item, index) => (
      <motion.div 
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 * index }}
        className="flex-1"
      >
        <div className={`${glassmorphicStyles.card} group p-4 h-full`}>
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-foreground/70">{item.time}</span>
              {item.icon}
            </div>
            <h4 className="font-medium">{item.title}</h4>
            <Badge variant={item.completed ? "outline" : "secondary"} className="mt-2 bg-white/5 border-white/10">
              {item.completed ? 'Completed' : 'Upcoming'}
            </Badge>
          </div>
        </div>
      </motion.div>
    ))
  ), [scheduleItems]);

  // Use our refactored MainLayout component
  return (
    <MainLayout
      leftSidebar={<LeftSidebar usageStats={usageStats} />}
      rightSidebar={<RightSidebar quizStats={quizStats} />}
    >
      <div className="space-y-8">
        {/* Hero/Welcome section with glassmorphic styling */}
        <div className={`${glassmorphicStyles.container} relative overflow-hidden mb-6 p-6`}>
          {/* Background gradients for visual richness */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-purple-400/10 to-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-cyan-300/10 to-emerald-400/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold">
                Welcome back, {user?.displayName || 'Student'}!
              </h1>
              <p className="text-foreground/70 mt-1">Here's your study progress and activities</p>
            </motion.div>
            
            <div className="mt-4 flex items-start flex-wrap gap-6">
              <motion.div 
                className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 flex-1 min-w-[240px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h3 className="text-sm font-medium text-foreground/80 mb-3">Weekly Progress</h3>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 relative">
                    <DailyGoalChart progress={72} />
                  </div>
                  <div>
                    <p className="font-medium">Great progress!</p>
                    <p className="text-sm text-foreground/60">You've completed 18/25 weekly goals</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 flex-1 min-w-[240px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className="text-sm font-medium text-foreground/80 mb-3">Today's Schedule</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-400"></div>
                      <span className="text-sm">Daily Quiz</span>
                    </div>
                    <span className="text-xs text-foreground/60">9:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                      <span className="text-sm">Mock Interview</span>
                    </div>
                    <span className="text-xs text-foreground/60">2:00 PM</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Activity Overview with StatsCard */}
        <div className="px-4 lg:px-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-foreground/90">Activity Overview</h3>
            <Select defaultValue="week">
              <SelectTrigger className="w-[120px] h-8 text-xs bg-white/5 border-white/10">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {toolStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className={`${glassmorphicStyles.card} h-full`}>
                  <StatCard
                    loading={statsLoading}
                    title={stat.title}
                    icon={stat.icon}
                    value={stat.value === undefined ? '-' : stat.value.toLocaleString()}
                    suffix={stat.suffix}
                    trend={{
                      value: index % 2 === 0 ? 15 : index % 3 === 0 ? -8 : 0,
                      direction: index % 2 === 0 ? 'up' : index % 3 === 0 ? 'down' : 'neutral'
                    }}
                    color={stat.color as "primary" | "secondary" | "accent" | "success" | "warning" | "danger" | undefined}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Performance Charts Section */}
        <div className="px-4 lg:px-0 grid gap-6 md:grid-cols-2">
          {/* Weekly Accuracy Chart */}
          <motion.div 
            className={`${glassmorphicStyles.card}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium">Performance Accuracy</h3>
                <Select defaultValue={accuracyView} onValueChange={(value: any) => setAccuracyView(value)}>
                  <SelectTrigger className="h-8 w-[110px] text-xs bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-64">
                <WeeklyAccuracyChart 
                  data={allAccuracyData}
                  defaultInterval={accuracyView}
                  averageAccuracy={quizStats?.accuracy || 78}
                  percentageChange={quizStats?.improvement || 2.5}
                />
              </div>
            </div>
          </motion.div>
          
          {/* Questions by Subject Chart */}
          <motion.div 
            className={`${glassmorphicStyles.card}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium">Questions by Subject</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 bg-white/5 hover:bg-white/10 border border-white/10">
                      <Filter className="h-3.5 w-3.5" />
                      <span>Filter</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>All Papers</DropdownMenuItem>
                    <DropdownMenuItem>GS Paper I</DropdownMenuItem>
                    <DropdownMenuItem>GS Paper II</DropdownMenuItem>
                    <DropdownMenuItem>GS Paper III</DropdownMenuItem>
                    <DropdownMenuItem>GS Paper IV</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="h-64">
                <QuestionsBySubjectChart 
                  data={questionsBySubjectData} 
                  config={questionsBySubjectConfig}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Schedule */}
        <div className="px-4 lg:px-0">
          <h3 className="text-lg font-medium text-foreground/90 mb-4">Today's Schedule</h3>
          <div className="flex flex-col md:flex-row gap-4">
            {scheduleContent}
          </div>
        </div>
        
        {/* Question Banks Section */}
        <div className="px-4 lg:px-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-foreground/90">Question Banks</h3>
            <Button variant="outline" size="sm" className="gap-1 bg-white/5 hover:bg-white/10 border-white/10">
              <span>View All</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {['UPSC CSE Prelims', 'UPSC CSE Mains', 'Current Affairs', 'Ethics & Aptitude'].map((bank, index) => (
              <motion.div
                key={bank}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="group"
              >
                <div className={`${glassmorphicStyles.card} h-full group-hover:shadow-lg transition-all duration-300`}>
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
                  
                  <div className="relative z-10 p-5">
                    <FileQuestion className="h-8 w-8 mb-2 text-primary/70" />
                    <h4 className="font-medium mb-1">{bank}</h4>
                    <p className="text-xs text-foreground/60 mb-3">
                      {100 + Math.floor(Math.random() * 900)} questions
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <Badge variant="outline" className="bg-white/5 border-white/10">
                        {Math.floor(Math.random() * 5) + 1} modules
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Activity History */}
        <div className="px-4 lg:px-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-foreground/90">Activity History</h3>
            <Button asChild variant="outline" size="sm" className="gap-1 bg-white/5 hover:bg-white/10 border-white/10">
                <Link href="/history">
                    <span>View All</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {historyLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`${glassmorphicStyles.card}`}>
                  <div className="p-5">
                    <Skeleton className="h-10 w-3/4 mb-4" />
                    <Skeleton className="h-16 w-full mb-4" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))
            ) : history.length > 0 ? (
              history.slice(0, 3).map(entry => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="group"
                >
                  <div className={`${glassmorphicStyles.card} h-full`}>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
                    
                    <div className="relative z-10">
                      <HistoryCard entry={entry} />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className={`md:col-span-3 ${glassmorphicStyles.card} text-center py-8`}>
                <div className="p-5">
                  <Library className="mx-auto w-12 h-12 text-foreground/30 mb-4" />
                  <h4 className="font-medium text-lg">No history yet</h4>
                  <p className="text-foreground/60 mt-1 mb-4">Your past analyses will appear here once you use a tool.</p>
                  <Button asChild className="bg-primary/80 hover:bg-primary text-primary-foreground">
                    <Link href="/newspaper-analysis">Analyze your first article</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
