'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/header';
import Footer from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Mic, FileQuestion, PenLine, History, IndianRupee, BarChart } from 'lucide-react';
import { getHistory, type HistoryEntry } from '@/services/historyService';
import { getUserUsage, type UsageStats } from '@/services/usageService';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const tools = [
    {
        id: 'newspaperAnalysis',
        icon: <Newspaper className="w-8 h-8 text-white" />,
        title: 'Newspaper Analysis',
        description: 'Analyze daily news and editorials.',
        href: '/newspaper-analysis',
        gradient: 'from-orange-500 to-amber-500',
    },
    {
        id: 'mockInterview',
        icon: <Mic className="w-8 h-8 text-white" />,
        title: 'Mock Interview',
        description: 'Practice with an AI interviewer.',
        href: '/mock-interview',
        gradient: 'from-purple-500 to-indigo-500',
    },
    {
        id: 'dailyQuiz',
        icon: <FileQuestion className="w-8 h-8 text-white" />,
        title: 'Daily Quiz',
        description: 'Take adaptive quizzes.',
        href: '/daily-quiz',
        gradient: 'from-sky-500 to-cyan-500',
    },
    {
        id: 'writingPractice',
        icon: <PenLine className="w-8 h-8 text-white" />,
        title: 'Writing Practice',
        description: 'Get feedback on your essays.',
        href: '/writing-practice',
        gradient: 'from-emerald-500 to-teal-500',
    },
];

const HistoryItemSkeleton = () => (
    <Card className="flex flex-col">
        <CardHeader>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/4 mt-2" />
        </CardHeader>
        <CardContent className="flex-grow">
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
        </CardContent>
        <CardFooter>
            <Skeleton className="h-8 w-24" />
        </CardFooter>
    </Card>
);

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [userUsage, setUserUsage] = useState<UsageStats | null>(null);
    const [usageLoading, setUsageLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            const fetchHistoryAndUsage = async () => {
                setHistoryLoading(true);
                setUsageLoading(true);
                const [userHistory, usageData] = await Promise.all([
                    getHistory(user.uid),
                    getUserUsage(user.uid)
                ]);
                setHistory(userHistory);
                setUserUsage(usageData);
                setHistoryLoading(false);
                setUsageLoading(false);
            };
            fetchHistoryAndUsage();
        }
    }, [user]);

    if (loading || !user) {
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
                <div className="mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">Welcome, Aspirant!</h1>
                    <p className="text-muted-foreground mt-2">Here are your tools. Let's get you exam-ready.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {tools.map(tool => (
                        <Link href={tool.href} key={tool.title} className="group">
                            <Card className="h-full glassmorphic transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col">
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4`}>
                                        {tool.icon}
                                    </div>
                                    <CardTitle className="font-headline text-xl">{tool.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <CardDescription>{tool.description}</CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <BarChart className="w-8 h-8 text-primary"/>
                        <div>
                            <h2 className="text-2xl font-bold font-headline">Your Stats</h2>
                            <p className="text-muted-foreground">A look at your tool usage.</p>
                        </div>
                    </div>
                    {usageLoading ? (
                        <Card className="glassmorphic"><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                    ) : (
                        <Card className="glassmorphic">
                            <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                <div>
                                    <p className="text-3xl font-bold">{userUsage?.newspaperAnalysis || 0}</p>
                                    <p className="text-sm text-muted-foreground">Analyses</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{userUsage?.mockInterview || 0}</p>
                                    <p className="text-sm text-muted-foreground">Interviews</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{userUsage?.dailyQuiz || 0}</p>
                                    <p className="text-sm text-muted-foreground">Quizzes</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{userUsage?.writingPractice || 0}</p>
                                    <p className="text-sm text-muted-foreground">Essays</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>


                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <History className="w-8 h-8 text-primary"/>
                        <div>
                            <h2 className="text-2xl font-bold font-headline">Analysis History</h2>
                            <p className="text-muted-foreground">Review your past newspaper analyses.</p>
                        </div>
                    </div>
                    {historyLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <HistoryItemSkeleton />
                            <HistoryItemSkeleton />
                            <HistoryItemSkeleton />
                        </div>
                    ) : history.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {history.map(item => (
                                <Card key={item.id} className="glassmorphic flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="text-lg line-clamp-2">
                                            {item.analysis.summary || "Analysis Summary"}
                                        </CardTitle>
                                        <CardDescription>
                                            {formatDistanceToNow(item.timestamp.toDate(), { addSuffix: true })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <div className="text-sm space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Syllabus Topic</span>
                                                <span className="font-semibold">{item.analysis.syllabusTopic || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Questions</span>
                                                <span className="font-semibold">{item.analysis.questionsCount || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                 <span className="text-muted-foreground flex items-center gap-1"><IndianRupee className="w-3 h-3"/> Cost</span>
                                                <span className="font-semibold">₹{item.analysis.cost?.toFixed(2) || '0.00'}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button asChild variant="outline">
                                            <Link href={`/history/${item.id}`}>View Details</Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg">
                            <h3 className="text-xl font-semibold">No History Yet</h3>
                            <p className="text-muted-foreground mt-2">Your newspaper analysis results will appear here.</p>
                            <Button asChild className="mt-4">
                                <Link href="/newspaper-analysis">Analyze an Article</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
