
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Newspaper, Mic, FileQuestion, PenLine, Book, BarChart3, HelpCircle, Users, Settings, LogOut, ChevronDown, CheckCircle, Flame, Target, PlayCircle, Library, Menu, ArrowUpRight, MoreVertical, Filter, ArrowUpDown } from 'lucide-react';
import { getHistory, type HistoryEntry, getQuestionStats } from '@/services/historyService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, CartesianGrid, AreaChart, Area, ResponsiveContainer } from "recharts";
import { Skeleton } from '@/components/ui/skeleton';
import { isToday } from 'date-fns';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { UserNav } from '@/components/layout/user-nav';
import { getUserQuizStats, type UserQuizStats } from '@/services/quizAttemptsService';

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
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


// --- Local Components for Dashboard ---

const SidebarContent = ({ usageStats }: { usageStats: UsageStats | null }) => (
    <div className="flex flex-col h-full">
        <div className="p-4">
            <Link href="/dashboard" className="font-headline text-2xl font-bold animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                PrepTalk
            </Link>
        </div>
        <nav className="flex flex-col gap-2 flex-grow p-4 pt-0">
            <Link href="/dashboard" className="flex items-center gap-3 p-3 bg-primary/10 text-primary rounded-lg font-semibold">
                <BarChart3 className="w-5 h-5" />
                <span>Dashboard</span>
            </Link>
            <Link href="/newspaper-analysis" className="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg transition-colors">
                <Newspaper className="w-5 h-5" />
                <span>Newspaper Analysis</span>
            </Link>
             <Link href="/mock-interview" className="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg transition-colors">
                <Mic className="w-5 h-5" />
                <span>Mock Interview</span>
            </Link>
             <Link href="/daily-quiz" className="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg transition-colors">
                <FileQuestion className="w-5 h-5" />
                <span>Daily Quiz</span>
            </Link>
            <Link href="/writing-practice" className="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg transition-colors">
                <PenLine className="w-5 h-5" />
                <span>Writing Practice</span>
            </Link>
            <Separator className="my-2 bg-border/50" />
            <p className="px-3 text-xs font-semibold text-muted-foreground/80 tracking-wider">Question Bank</p>
             <Link href="/prelims-questions" className="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg transition-colors">
                <FileQuestion className="w-5 h-5" />
                <span>Prelims Q-Bank</span>
            </Link>
             <Link href="/mains-questions" className="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg transition-colors">
                <PenLine className="w-5 h-5" />
                <span>Mains Q-Bank</span>
            </Link>
            <Separator className="my-2 bg-border/50" />
             <Link href="#" className="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg transition-colors">
                <Book className="w-5 h-5" />
                <span>Syllabus</span>
            </Link>
             <Link href="#" className="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg transition-colors">
                <Users className="w-5 h-5" />
                <span>Group Study</span>
            </Link>
        </nav>
        <div className="mt-auto space-y-2 p-4 pt-0">
            <div className="p-4 bg-muted rounded-lg text-center">
                <HelpCircle className="mx-auto w-8 h-8 text-primary mb-2"/>
                <p className="font-semibold text-sm">Need Help?</p>
                <p className="text-xs text-muted-foreground">Check our FAQ or contact support.</p>
                <Button size="sm" variant="outline" className="mt-3 w-full">Ask Anything</Button>
            </div>
             <Button variant="ghost" className="w-full justify-start gap-3 p-3 text-muted-foreground">
                <LogOut className="w-5 h-5"/> Log Out
            </Button>
        </div>
    </div>
);


const LeftSidebar = ({ usageStats }: { usageStats: UsageStats | null }) => (
    <div className="hidden lg:flex flex-col gap-4 p-4 bg-card rounded-2xl h-full">
        <SidebarContent usageStats={usageStats} />
    </div>
);

const MobileHeader = ({ usageStats }: { usageStats: UsageStats | null }) => (
    <header className="lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4">
        <Sheet>
            <SheetTrigger asChild>
                <Button size="icon" variant="outline">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 border-r">
                <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                    <SheetDescription>
                        Main menu for the PrepTalk application, containing links to dashboard, tools, and other resources.
                    </SheetDescription>
                </SheetHeader>
                <SidebarContent usageStats={usageStats} />
            </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="font-headline text-xl font-bold animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
            PrepTalk
        </Link>
        <UserNav />
    </header>
);

const RightSidebar = ({ quizStats }: { quizStats: UserQuizStats | null }) => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
        <div className="flex flex-col gap-6 lg:p-4 lg:bg-card lg:rounded-2xl lg:h-full">
            <div className="hidden lg:flex items-center justify-between p-2">
                 <Button variant="outline" className="h-auto">
                    UPSC Civil Services <ChevronDown className="w-4 h-4 ml-2"/>
                 </Button>
                 <UserNav />
            </div>
            <div>
                <h3 className="font-semibold px-2 mb-2">Statistics</h3>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md"
                    classNames={{
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                        day_today: "bg-primary/20 text-primary"
                    }}
                />
            </div>
            <div className="grid grid-cols-2 gap-4 px-2">
                <Card className="glassmorphic items-center justify-center flex flex-col p-4 text-center">
                    <Flame className="w-8 h-8 text-orange-500"/>
                    <p className="text-2xl font-bold mt-1">5</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                </Card>
                <Card className="glassmorphic items-center justify-center flex flex-col p-4 text-center">
                    <Target className="w-8 h-8 text-green-500"/>
                    <p className="text-2xl font-bold mt-1">1</p>
                    <p className="text-xs text-muted-foreground">Task Done</p>
                </Card>
            </div>
            {quizStats && quizStats.totalAttempted > 0 && (
                 <div>
                    <h3 className="font-semibold px-2 mb-2">Quiz Performance</h3>
                     <div className="grid grid-cols-2 gap-4 px-2">
                        <Card className="glassmorphic items-center justify-center flex flex-col p-4 text-center">
                            <FileQuestion className="w-8 h-8 text-blue-500"/>
                            <p className="text-2xl font-bold mt-1">{quizStats.totalAttempted}</p>
                            <p className="text-xs text-muted-foreground">Answered</p>
                        </Card>
                        <Card className="glassmorphic items-center justify-center flex flex-col p-4 text-center">
                            <CheckCircle className="w-8 h-8 text-teal-500"/>
                            <p className="text-2xl font-bold mt-1">{quizStats.accuracy}%</p>
                            <p className="text-xs text-muted-foreground">Accuracy</p>
                        </Card>
                    </div>
                </div>
            )}
             <div>
                <h3 className="font-semibold px-2 mb-2">Daily Goal</h3>
                <Card className="glassmorphic p-4 flex items-center">
                    <div className="w-24 h-24">
                        <DailyGoalChart progress={80} />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold">You're doing great!</p>
                        <p className="text-sm text-muted-foreground">You marked 1/2 tasks as done.</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// --- NEW CHART COMPONENTS ---

const questionsBySubjectData = [
  { paper: "GS I", History: 40, Geography: 24, Society: 24 },
  { paper: "GS II", Polity: 30, Governance: 13, "Intl. Relations": 22 },
  { paper: "GS III", Economy: 20, "Sci & Tech": 78, Environment: 29 },
  { paper: "GS IV", Ethics: 27, "Case Studies": 39 },
];

const questionsBySubjectConfig = {
  History: { label: "History", color: "#5347CE" },
  Polity: { label: "Polity", color: "#5347CE" },
  Economy: { label: "Economy", color: "#5347CE" },
  Ethics: { label: "Ethics", color: "#5347CE" },
  Geography: { label: "Geography", color: "#887CFD" },
  Governance: { label: "Governance", color: "#887CFD" },
  "Sci & Tech": { label: "Sci & Tech", color: "#887CFD" },
  "Case Studies": { label: "Case Studies", color: "#887CFD" },
  Society: { label: "Society", color: "#4896FE" },
  "Intl. Relations": { label: "Intl. Relations", color: "#4896FE" },
  Environment: { label: "Environment", color: "#16CBC7" },
} satisfies ChartConfig;

// QuestionsBySubjectChart component is now imported from its module

const allAccuracyData = {
    daily: [
      { day: 'Sun', accuracy: 82 }, { day: 'Mon', accuracy: 75 },
      { day: 'Tue', accuracy: 91 }, { day: 'Wed', accuracy: 88 },
      { day: 'Thu', accuracy: 72 }, { day: 'Fri', accuracy: 85 },
      { day: 'Sat', accuracy: 93 },
    ],
    weekly: [
        { week: 'W1', accuracy: 78 }, { week: 'W2', accuracy: 85 },
        { week: 'W3', accuracy: 81 }, { week: 'W4', accuracy: 90 },
    ],
    monthly: [
        { month: 'Jan', accuracy: 75 }, { month: 'Feb', accuracy: 80 },
        { month: 'Mar', accuracy: 88 }, { month: 'Apr', accuracy: 85 },
    ]
};

const weeklyAccuracyConfig = {
  accuracy: { label: "Accuracy", color: "#887CFD" },
} satisfies ChartConfig

// Using the modular WeeklyAccuracyChart component


export default function ReimaginedDashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [quizStats, setQuizStats] = useState<UserQuizStats | null>(null);
    const [questionStats, setQuestionStats] = useState<{ prelimsCount: number; mainsCount: number } | null>(null);
    const [usageStats, setUsageStats] = useState<UsageStats | null>(null);


    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    useEffect(() => {
        if (user) {
            setHistoryLoading(true);
            getHistory(user.uid).then(data => {
                setHistory(data);
                setHistoryLoading(false);
            }).catch(() => {
                setHistoryLoading(false);
            });
            getUserQuizStats(user.uid).then(stats => {
                setQuizStats(stats);
            });
            getQuestionStats(user.uid).then(stats => {
                setQuestionStats(stats);
            });
            getUserUsage(user.uid).then(stats => {
                setUsageStats(stats);
            });
        }
    }, [user]);

    const toolStats = [
        {
            title: 'Newspaper Analyses',
            icon: <Newspaper className="h-4 w-4 text-muted-foreground" />,
            value: usageStats?.newspaperAnalysis,
            color: 'border-l-orange-500',
        },
        {
            title: 'Mock Interviews',
            icon: <Mic className="h-4 w-4 text-muted-foreground" />,
            value: usageStats?.mockInterview,
            color: 'border-l-purple-500',
        },
        {
            title: 'Daily Quizzes',
            icon: <FileQuestion className="h-4 w-4 text-muted-foreground" />,
            value: usageStats?.dailyQuiz,
            color: 'border-l-sky-500',
        },
        {
            title: 'Writing Practices',
            icon: <PenLine className="h-4 w-4 text-muted-foreground" />,
            value: usageStats?.writingPractice,
            color: 'border-l-emerald-500',
        },
    ];

    const scheduleContent = useMemo(() => {
        const lastActivity = history?.[0];
        const lastActivityWasToday = lastActivity ? isToday(new Date(lastActivity.timestamp.seconds * 1000)) : false;

        let content = [];

        if (lastActivityWasToday) {
            const analysis = lastActivity.analysis;
            content.push(
                <Card className="flex-1 glassmorphic" key="today-activity">
                    <CardHeader className="flex-row items-start gap-4">
                        <div className="p-2 bg-green-500/20 rounded-full">
                            <CheckCircle className="w-5 h-5 text-green-500"/>
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold">Great work today!</CardTitle>
                            <CardDescription className="text-xs">
                                You analyzed an article on &quot;{analysis.syllabusTopic || 'a relevant topic'}&quot; with {analysis.questionsCount || 'several'} questions.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardFooter className="gap-2">
                        <Button asChild variant="default" size="sm">
                            <Link href={`/history/${lastActivity.id}`}>Review Analysis</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/newspaper-analysis">Analyze Another</Link>
                        </Button>
                    </CardFooter>
                </Card>
            );
        } else {
            content.push(
                <Card className="flex-1 glassmorphic" key="analyze-article">
                    <CardHeader className="flex-row items-start gap-4">
                        <div className="p-2 bg-primary/20 rounded-full">
                            <Newspaper className="w-5 h-5 text-primary"/>
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold">Analyze a News Article</CardTitle>
                            <CardDescription className="text-xs">Stay updated and generate exam-ready questions from today&apos;s news.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild variant="default" size="sm">
                            <Link href="/newspaper-analysis">Start Analyzing</Link>
                        </Button>
                    </CardFooter>
                </Card>,
                 <Card className="flex-1 glassmorphic" key="take-quiz">
                    <CardHeader className="flex-row items-start gap-4">
                        <div className="p-2 bg-primary/20 rounded-full">
                            <FileQuestion className="w-5 h-5 text-primary"/>
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold">Take a Daily Quiz</CardTitle>
                            <CardDescription className="text-xs">Sharpen your knowledge with a quick, adaptive quiz.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/daily-quiz">Start Quiz</Link>
                        </Button>
                    </CardFooter>
                </Card>
            );
        }

        if(questionStats && (questionStats.prelimsCount > 0 || questionStats.mainsCount > 0)) {
            content.push(
                <Card className="flex-1 glassmorphic" key="q-bank">
                    <CardHeader className="flex-row items-start gap-4">
                        <div className="p-2 bg-primary/20 rounded-full">
                            <Library className="w-5 h-5 text-primary"/>
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold">Your Question Bank</CardTitle>
                            <CardDescription className="text-xs">A growing repository of your practice questions.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{questionStats.prelimsCount + questionStats.mainsCount}</div>
                        <p className="text-xs text-muted-foreground">Total Questions Generated</p>
                        <div className="mt-4 flex justify-between text-sm">
                            <span className="text-muted-foreground">Prelims MCQs</span>
                            <span className="font-semibold">{questionStats.prelimsCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Mains Questions</span>
                            <span className="font-semibold">{questionStats.mainsCount}</span>
                        </div>
                    </CardContent>
                </Card>
            )
        }

        return content;

    }, [history, questionStats]);


    if (loading || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-muted/30 dark:bg-muted/10">
            <MobileHeader usageStats={usageStats} />
            <div className="lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px] lg:gap-4 lg:p-4 h-full">
                <LeftSidebar usageStats={usageStats} />
                <main className="flex flex-col gap-6 p-4 lg:p-0">
                    {/* Main Header */}
                    <div className="hidden lg:block p-4">
                        <h2 className="text-2xl font-bold">Welcome back, {user.displayName || user.email?.split('@')[0] || 'Aspirant'}!</h2>
                        <p className="text-muted-foreground">You're doing great this week. Keep it up!</p>
                    </div>

                    {/* Activity Overview */}
                     <div className="px-4 lg:px-0">
                         <h3 className="text-lg font-semibold mb-3">Activity Overview</h3>
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {toolStats.map((stat, index) => (
                                 <motion.div
                                    key={stat.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <StatCard
                                        title={stat.title}
                                        icon={stat.icon}
                                        value={(stat.value || 0).toLocaleString()}
                                        trend={{
                                          value: index % 2 === 0 ? 15 : index % 3 === 0 ? -8 : 0,
                                          direction: index % 2 === 0 ? 'up' : index % 3 === 0 ? 'down' : 'neutral'
                                        }}
                                        color={stat.color as "primary" | "secondary" | "accent" | "success" | "warning" | "danger" | undefined}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Schedule */}
                    <div>
                        <h3 className="text-lg font-semibold px-4 lg:px-0 mb-3">Your Schedule for today</h3>
                        <div className="flex flex-col md:flex-row gap-4 px-4 lg:px-0">
                            {scheduleContent}
                        </div>
                    </div>
                    
                    {/* Activity History */}
                     <div>
                        <h3 className="text-lg font-semibold px-4 lg:px-0 mb-3">Activity History</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 lg:px-0">
                           {historyLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <Card key={i}>
                                        <CardHeader><Skeleton className="h-10 w-3/4" /></CardHeader>
                                        <CardContent><Skeleton className="h-16 w-full" /></CardContent>
                                        <CardFooter><Skeleton className="h-8 w-24" /></CardFooter>
                                    </Card>
                                ))
                           ) : history.length > 0 ? (
                                history.slice(0, 3).map(entry => (
                                    <HistoryCard key={entry.id} entry={entry} />
                                ))
                           ) : (
                             <Card className="md:col-span-3 text-center p-8 glassmorphic">
                                <CardContent className="pt-6">
                                    <Library className="mx-auto w-12 h-12 text-muted-foreground/50 mb-4" />
                                    <h4 className="font-semibold text-lg">No history yet</h4>
                                    <p className="text-muted-foreground mt-1">Your past analyses will appear here once you use a tool.</p>
                                    <Button asChild className="mt-4">
                                        <Link href="/newspaper-analysis">Analyze your first article</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                           )}
                        </div>
                    </div>

                </main>
                <div className="p-4 lg:p-0">
                    <RightSidebar quizStats={quizStats} />
                </div>
            </div>
        </div>
    );
}
