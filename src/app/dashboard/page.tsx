'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Mic, FileQuestion, PenLine, Book, BarChart3, HelpCircle, Users, Settings, LogOut, ChevronDown, CheckCircle, Flame, Target, PlayCircle, Library } from 'lucide-react';
import { getHistory, type HistoryEntry } from '@/services/historyService';
import { getUserUsage, type UsageStats } from '@/services/usageService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

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

const ScheduleCard = ({ title, description, buttonText, buttonVariant = 'default'}: {title: string, description: string, buttonText: string, buttonVariant?: 'default' | 'outline'}) => (
    <Card className="flex-1 glassmorphic">
        <CardHeader className="flex-row items-start gap-4">
            <div className="p-2 bg-primary/20 rounded-full">
                <CheckCircle className="w-5 h-5 text-primary"/>
            </div>
            <div>
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
            </div>
        </CardHeader>
        <CardFooter>
            <Button variant={buttonVariant} size="sm">{buttonText}</Button>
        </CardFooter>
    </Card>
);

const CourseCard = ({ title, chapters, imageHint }: {title: string, chapters: number, imageHint: string}) => (
    <Card className="overflow-hidden glassmorphic group">
        <div className="relative h-32">
            <Image src={`https://placehold.co/400x200.png`} alt={title} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform" data-ai-hint={imageHint} />
        </div>
        <CardHeader>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm">{chapters} Chapters</CardDescription>
        </CardHeader>
    </Card>
);

const WatchCard = ({ title, subtitle, imageHint, progress }: {title: string, subtitle: string, imageHint: string, progress: number}) => (
     <Card className="min-w-[280px] w-[280px] overflow-hidden glassmorphic group relative">
        <div className="relative h-32">
            <Image src={`https://placehold.co/400x200.png`} alt={title} layout="fill" objectFit="cover" data-ai-hint={imageHint} />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <PlayCircle className="w-10 h-10 text-white/70 group-hover:text-white transition-colors"/>
            </div>
        </div>
        <CardHeader>
            <CardTitle className="text-sm font-semibold truncate">{title}</CardTitle>
            <CardDescription className="text-xs truncate">{subtitle}</CardDescription>
        </CardHeader>
        <CardFooter>
            <Progress value={progress} className="h-1.5" />
        </CardFooter>
    </Card>
)

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

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

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
                        <div className="flex gap-4 px-4">
                            <ScheduleCard 
                                title="Daily current affairs test"
                                description="Your daily dose of current affairs test is served hot."
                                buttonText="Attempt another quiz"
                                buttonVariant="outline"
                            />
                             <ScheduleCard 
                                title="Let's do one more"
                                description="If you do 2 sub topics a day you can complete the entire syllabus!"
                                buttonText="Go to syllabus"
                            />
                        </div>
                    </div>

                    {/* Continue to Watch */}
                     <div>
                        <h3 className="text-lg font-semibold px-4 mb-3">Continue to Watch</h3>
                        <div className="flex gap-4 px-4 overflow-x-auto pb-4">
                           <WatchCard title="Indian Polity by M. Laxmikanth" subtitle="Video 1" imageHint="abstract purple" progress={60} />
                           <WatchCard title="History for UPSC - IAS - Pre" subtitle="History of Ancient India" imageHint="abstract teal" progress={25} />
                           <WatchCard title="GS Paper II Complete Course" subtitle="International Relations" imageHint="abstract blue" progress={80} />
                        </div>
                    </div>

                     {/* Your Courses */}
                    <div>
                        <h3 className="text-lg font-semibold px-4 mb-3">Your Courses</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4">
                           <CourseCard title="Indian Polity" chapters={11} imageHint="court law" />
                           <CourseCard title="Ancient History" chapters={18} imageHint="ancient rome" />
                           <Course_Card title="Medieval History" chapters={16} imageHint="castle architecture" />
                        </div>
                    </div>
                </main>
                <RightSidebar />
            </div>
        </div>
    );
}

// A small fix for a component name typo to avoid breaking the build
const Course_Card = CourseCard;
