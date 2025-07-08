
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getFullHistory, type HistoryEntry } from '@/services/historyService';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import Footer from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Library } from 'lucide-react';
import HistoryCard from '@/app/dashboard/components/cards/HistoryCard';

export default function FullHistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            setIsLoading(true);
            getFullHistory(user.uid)
                .then(data => {
                    setHistory(data);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error("Failed to load full history:", error);
                    setIsLoading(false);
                });
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
                <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
                <div className="text-center mb-16">
                    <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tighter">
                        Full Activity History
                    </h1>
                    <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                        A complete record of all your analyses and activities on PrepTalk.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Card key={i}>
                                    <CardHeader><Skeleton className="h-10 w-3/4" /></CardHeader>
                                    <CardContent><Skeleton className="h-16 w-full" /></CardContent>
                                    <CardFooter><Skeleton className="h-8 w-24" /></CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : history.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {history.map(entry => (
                                <HistoryCard key={entry.id} entry={entry} />
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center p-8 glassmorphic">
                            <CardHeader>
                                <Library className="mx-auto w-12 h-12 text-muted-foreground/50 mb-4" />
                                <CardTitle>No History Found</CardTitle>
                                <CardDescription>
                                    Your past activities will appear here once you use a tool.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild>
                                    <Link href="/newspaper-analysis">Analyze your first article</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
