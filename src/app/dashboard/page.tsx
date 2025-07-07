'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/header';
import Footer from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';
import Link from 'next/link';
import { Newspaper, Mic, FileQuestion, PenLine, Settings, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

const tools = [
    {
        icon: <Newspaper className="w-8 h-8 text-primary" />,
        title: 'Newspaper Analysis',
        description: 'Analyze daily news and editorials.',
        href: '/newspaper-analysis',
    },
    {
        icon: <Mic className="w-8 h-8 text-primary" />,
        title: 'Mock Interview',
        description: 'Practice with an AI interviewer.',
        href: '/mock-interview',
    },
    {
        icon: <FileQuestion className="w-8 h-8 text-primary" />,
        title: 'Daily Quiz',
        description: 'Take adaptive quizzes.',
        href: '/daily-quiz',
    },
    {
        icon: <PenLine className="w-8 h-8 text-primary" />,
        title: 'Writing Practice',
        description: 'Get feedback on your essays.',
        href: '/writing-practice',
    },
];

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            toast({ title: 'Logged out successfully.' });
            router.push('/');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Logout failed.' });
        }
    };

    if (loading || !user) {
        return null; // Or a loading spinner, but AuthProvider already has one
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-3xl md:text-4xl font-bold font-headline">Welcome to your Dashboard</h1>
                        <p className="text-muted-foreground mt-2">Here are your tools to get you exam-ready. Good luck!</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {tools.map(tool => (
                             <Link href={tool.href} key={tool.title} className="group">
                                <Card className="h-full glassmorphic transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-lg group-hover:-translate-y-1">
                                    <CardHeader className="flex-row items-center gap-4">
                                        {tool.icon}
                                        <div>
                                            <CardTitle className="font-headline text-xl">{tool.title}</CardTitle>
                                            <CardDescription>{tool.description}</CardDescription>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Account</CardTitle>
                            <CardDescription>Manage your account settings and preferences.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <span className="text-sm font-medium">Email</span>
                                <span className="text-sm text-muted-foreground">{user.email}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button variant="outline" disabled>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Manage Account (Soon)
                                </Button>
                                <Button onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}
