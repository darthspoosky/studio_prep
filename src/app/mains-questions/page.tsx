
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getMainsQuestions, type MainsQuestionWithContext } from '@/services/historyService';
import { getAllMainsAnswers, saveMainsAnswer } from '@/services/mainsAnswerService';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink, Loader2, PenLine } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownComponents = {
  h3: (props: any) => <h3 className="text-xl font-semibold font-headline mt-6 mb-2 text-primary/90" {...props} />,
  p: (props: any) => <p className="leading-relaxed my-4" {...props} />,
  ul: (props: any) => <ul className="list-disc list-outside pl-6 my-4 space-y-2 text-muted-foreground" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside pl-6 my-4 space-y-2" {...props} />,
  li: (props: any) => <li className="pl-2" {...props} />,
  strong: (props: any) => <strong className="font-bold text-foreground" {...props} />,
};

const MainsQuestionCard = ({ question, userId, savedAnswer: initialSavedAnswer }: { question: MainsQuestionWithContext; userId: string; savedAnswer: string }) => {
    const { toast } = useToast();
    const [answer, setAnswer] = useState(initialSavedAnswer);
    const [savedAnswer, setSavedAnswer] = useState(initialSavedAnswer);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveMainsAnswer(userId, question.historyId, question.question, answer);
            setSavedAnswer(answer);
            toast({ title: "Answer Saved!" });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const isSaved = answer === savedAnswer;

    return (
        <Card className="glassmorphic shadow-sm">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-xl">{question.question}</CardTitle>
                    {question.articleUrl && (
                        <Button asChild variant="link" size="sm" className="h-auto p-0 flex-shrink-0 ml-4">
                            <a href={question.articleUrl} target="_blank" rel="noopener noreferrer">Source Article <ExternalLink className="w-3 h-3 ml-1.5" /></a>
                        </Button>
                    )}
                </div>
                <CardDescription>
                    Generated on {new Date(question.timestamp.seconds * 1000).toLocaleDateString()}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {question.guidance && (
                    <div className="prose-sm dark:prose-invert max-w-none text-muted-foreground mt-4 mb-6 border-t pt-4">
                        <h4 className="font-semibold text-primary mb-2">AI Guidance</h4>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{question.guidance}</ReactMarkdown>
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor={`answer-${question.historyId}`} className="font-semibold">Your Answer</Label>
                    <Textarea
                        id={`answer-${question.historyId}`}
                        placeholder="Draft your response here..."
                        className="h-48 bg-background"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                    />
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSave} disabled={isSaving || isSaved || answer.length < 20}>
                    {isSaving && <Loader2 className="animate-spin" />}
                    {isSaving ? 'Saving...' : isSaved && answer.length > 0 ? 'Saved' : 'Save Answer'}
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function MainsQuestionBankPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [questions, setQuestions] = useState<MainsQuestionWithContext[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            setIsLoading(true);
            Promise.all([
                getMainsQuestions(user.uid),
                getAllMainsAnswers(user.uid)
            ]).then(([fetchedQuestions, fetchedAnswers]) => {
                setQuestions(fetchedQuestions);
                setAnswers(fetchedAnswers);
                setIsLoading(false);
            }).catch(error => {
                console.error("Failed to load question bank:", error);
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
                        Mains Question Bank
                    </h1>
                    <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                        All the Mains questions you've generated, ready for practice.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-8">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="glassmorphic shadow-sm">
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/4 mt-2" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-32 w-full" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Skeleton className="h-10 w-28" />
                                </CardFooter>
                            </Card>
                        ))
                    ) : questions.length > 0 ? (
                        questions.map((q, i) => <MainsQuestionCard key={`${q.historyId}-${i}`} question={q} userId={user.uid} savedAnswer={answers[q.question] || ''} />)
                    ) : (
                        <Card className="text-center p-8 glassmorphic">
                            <CardHeader>
                                <PenLine className="mx-auto w-12 h-12 text-muted-foreground/50 mb-4" />
                                <CardTitle>Your Mains Question Bank is Empty</CardTitle>
                                <CardDescription>
                                    Questions you generate using the Newspaper Analysis tool will appear here.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild>
                                    <Link href="/newspaper-analysis">Analyze an Article to Start</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}

    
