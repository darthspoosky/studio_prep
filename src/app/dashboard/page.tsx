
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Newspaper, Mic, FileQuestion, PenLine, Book, BarChart3, HelpCircle, Users, Settings, LogOut, ChevronDown, CheckCircle, Flame, Target, PlayCircle, Library, Menu, ArrowUpRight, MoreVertical } from 'lucide-react';
import { getHistory, type HistoryEntry, getQuestionStats } from '@/services/historyService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday } from 'date-fns';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { UserNav } from '@/components/layout/user-nav';
import { getUserQuizStats, type UserQuizStats } from '@/services/quizAttemptsService';
import { getUserUsage, type UsageStats } from '@/services/usageService';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
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

const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) => (
    <Card className={`glassmorphic border-l-4 ${color}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">Total uses</p>
        </CardContent>
    </Card>
);

const HistoryCard = ({ entry }: { entry: HistoryEntry }) => {
  const date = new Date(entry.timestamp.seconds * 1000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  
  return (
    <Card className="glassmorphic flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-full flex-shrink-0">
                <Newspaper className="w-5 h-5 text-primary"/>
            </div>
            <div>
                <CardTitle className="text-base font-semibold">Newspaper Analysis</CardTitle>
                <CardDescription className="text-xs">{date}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {entry.analysis.summary || 'No summary available for this analysis.'}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm">
          <Link href={`/history/${entry.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};


const DailyGoalChart = ({ progress }: { progress: number }) => {
    const data = [{ name: 'goal', value: progress, fill: 'hsl(var(--primary))' }];
    return (
        <ResponsiveContainer width="100%" height={100}>
            <RadialBarChart 
                innerRadius="70%" 
                outerRadius="90%" 
                barSize={10} 
                data={data} 
                startAngle={90} 
                endAngle={-270}
            >
                <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                />
                <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={5}
                    className="fill-primary"
                />
                <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="text-2xl font-bold fill-foreground"
                >
                    {`${progress}%`}
                </text>
            </RadialBarChart>
        </ResponsiveContainer>
    );
};

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
  { week: "Week 1", History: 40, Polity: 24, Economy: 24 },
  { week: "Week 2", History: 30, Polity: 13, Economy: 22 },
  { week: "Week 3", History: 20, Polity: 78, Economy: 29 },
  { week: "Week 4", History: 27, Polity: 39, Economy: 20 },
];

const questionsBySubjectConfig = {
  History: { label: "History", color: "hsl(var(--chart-1))" },
  Polity: { label: "Polity", color: "hsl(var(--chart-2))" },
  Economy: { label: "Economy", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const QuestionsBySubjectChart = () => (
    <Card className="glassmorphic">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>Questions by Subject</CardTitle>
                    <CardDescription>Breakdown of generated questions in the last 4 weeks</CardDescription>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Export as PNG</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </CardHeader>
        <CardContent>
             <ChartContainer config={questionsBySubjectConfig} className="min-h-[250px] w-full">
                <BarChart accessibilityLayer data={questionsBySubjectData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="week" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickLine={false} tickMargin={10} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="History" stackId="a" fill="var(--color-History)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Polity" stackId="a" fill="var(--color-Polity)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Economy" stackId="a" fill="var(--color-Economy)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ChartContainer>
        </CardContent>
    </Card>
);

const weeklyAccuracyData = [
  { day: 'Sun', accuracy: 82 },
  { day: 'Mon', accuracy: 75 },
  { day: 'Tue', accuracy: 91 },
  { day: 'Wed', accuracy: 88 },
  { day: 'Thu', accuracy: 72 },
  { day: 'Fri', accuracy: 85 },
  { day: 'Sat', accuracy: 93 },
]

const weeklyAccuracyConfig = {
  accuracy: { label: "Accuracy", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

const WeeklyAccuracyChart = () => (
  <Card className="glassmorphic">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
            <CardTitle>Weekly Quiz Accuracy</CardTitle>
            <CardDescription>Your performance over the last 7 days</CardDescription>
        </div>
        <Select defaultValue="weekly">
            <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Select"/>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
        </Select>
      </div>
    </CardHeader>
    <CardContent>
        <div className="mb-4">
            <div className="text-3xl font-bold">85.4%</div>
            <div className="flex items-center text-sm text-muted-foreground">
                <span className="flex items-center text-green-600 mr-2">
                    <ArrowUpRight className="w-4 h-4" />
                    +3.2%
                </span>
                vs last week
            </div>
        </div>
        <ChartContainer config={weeklyAccuracyConfig} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={weeklyAccuracyData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                    dataKey="accuracy"
                    fill="var(--color-accuracy)"
                    radius={4}
                />
            </BarChart>
        </ChartContainer>
    </CardContent>
  </Card>
);


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
                                        color={stat.color}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Performance Analytics */}
                    <div className="px-4 lg:px-0">
                        <h3 className="text-lg font-semibold mb-3">Performance Analytics</h3>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <QuestionsBySubjectChart />
                            <WeeklyAccuracyChart />
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
