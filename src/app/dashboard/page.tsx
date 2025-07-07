
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Newspaper, Mic, FileQuestion, PenLine, Book, BarChart3, HelpCircle, Users, Settings, LogOut, ChevronDown, CheckCircle, Flame, Target, PlayCircle, Library } from 'lucide-react';
import { getHistory, type HistoryEntry } from '@/services/historyService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday } from 'date-fns';


// --- Local Components for Dashboard ---

const LeftSidebar = () => (
    <div className="hidden lg:flex flex-col gap-4 p-4 bg-card rounded-2xl h-full">
        <div className="p-4">
            <h1 className="font-headline text-2xl font-bold animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">PrepTalk</h1>
        </div>
        <nav className="flex flex-col gap-2 flex-grow">
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
             <Link href="#" className="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg transition-colors">
                <Book className="w-5 h-5" />
                <span>Syllabus</span>
            </Link>
             <Link href="#" className="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg transition-colors">
                <Users className="w-5 h-5" />
                <span>Group Study</span>
            </Link>
        </nav>
        <div className="mt-auto space-y-2">
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

const RightSidebar = () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
        <div className="hidden lg:flex flex-col gap-6 p-4 bg-card rounded-2xl h-full">
            <div className="flex items-center justify-between p-2">
                 <Button variant="outline" className="h-auto">
                    UPSC Civil Services <ChevronDown className="w-4 h-4 ml-2"/>
                 </Button>
                 <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="person" />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
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

export default function ReimaginedDashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

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
        }
    }, [user]);

    const scheduleContent = useMemo(() => {
        const lastActivity = history?.[0];
        const lastActivityWasToday = lastActivity ? isToday(new Date(lastActivity.timestamp.seconds * 1000)) : false;

        if (lastActivityWasToday) {
            const analysis = lastActivity.analysis;
            return (
                <Card className="flex-1 glassmorphic">
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
            return (
                <>
                    <Card className="flex-1 glassmorphic">
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
                    </Card>
                     <Card className="flex-1 glassmorphic">
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
                </>
            );
        }
    }, [history]);


    if (loading || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-muted/30 dark:bg-muted/10 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px] gap-4 h-full">
                <LeftSidebar />
                <main className="flex flex-col gap-6">
                    {/* Main Header */}
                    <div className="p-4">
                        <h2 className="text-2xl font-bold">Welcome back, {user.email?.split('@')[0] || 'Aspirant'}!</h2>
                        <p className="text-muted-foreground">You're doing great this week. Keep it up!</p>
                    </div>

                    {/* Schedule */}
                    <div>
                        <h3 className="text-lg font-semibold px-4 mb-3">Your Schedule for today</h3>
                        <div className="flex flex-col md:flex-row gap-4 px-4">
                            {scheduleContent}
                        </div>
                    </div>
                    
                    {/* Activity History */}
                     <div>
                        <h3 className="text-lg font-semibold px-4 mb-3">Activity History</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4">
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
                <RightSidebar />
            </div>
        </div>
    );
}

// A small fix for a component name typo to avoid breaking the build
const Course_Card = HistoryCard;

