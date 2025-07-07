
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPrelimsQuestions, type PrelimsQuestionWithContext } from '@/services/historyService';
import { saveQuizAttempt, getAllUserAttempts } from '@/services/quizAttemptsService';
import { useRouter } from 'next/navigation';

import Header from '@/components/layout/header';
import Footer from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink, Info, CheckCircle, XCircle, Circle, Gauge, FileQuestion } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";


const DifficultyGauge = ({ score }: { score: number }) => {
    if (isNaN(score) || score < 1 || score > 10) return null;
    const percentage = score * 10;
    const label = score <= 3 ? 'Easy' : score <= 7 ? 'Medium' : 'Hard';
    return (
        <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Difficulty: {label}</span>
            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-xs font-bold text-foreground">{score}/10</span>
        </div>
    );
};

const FormattedQuestion = ({ text }: { text: string }) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) {
        return <p className="font-semibold leading-relaxed text-foreground">{text}</p>;
    }
    const firstStatementIndex = lines.findIndex(line => /^\d+\.\s/.test(line.trim()));
    if (firstStatementIndex === -1) {
        return <p className="font-semibold leading-relaxed text-foreground" style={{ whiteSpace: 'pre-line' }}>{text}</p>;
    }
    const preamble = lines.slice(0, firstStatementIndex).join('\n');
    let lastStatementIndex = firstStatementIndex;
    for (let i = firstStatementIndex + 1; i < lines.length; i++) {
        if (/^\d+\.\s/.test(lines[i].trim())) {
            lastStatementIndex = i;
        } else {
            break; 
        }
    }
    const statements = lines.slice(firstStatementIndex, lastStatementIndex + 1);
    const conclusion = lines.slice(lastStatementIndex + 1).join('\n');
    return (
        <div className="font-semibold leading-relaxed text-foreground">
            {preamble && <p className="mb-3" style={{ whiteSpace: 'pre-line' }}>{preamble}</p>}
            <ol className="list-decimal list-inside space-y-2 my-3">
                {statements.map((stmt, index) => (
                    <li key={index} className="pl-2">{stmt.trim().replace(/^\d+\.\s/, '')}</li>
                ))}
            </ol>
            {conclusion && <p className="mt-3" style={{ whiteSpace: 'pre-line' }}>{conclusion}</p>}
        </div>
    );
};

const MCQ = ({ mcq, userId, savedSelection, onAnswer }: { mcq: PrelimsQuestionWithContext, userId: string, savedSelection: string | null, onAnswer: (question: string, selectedOption: string, isCorrect: boolean, subject?: string, difficulty?: number) => void }) => {
  const { question, subject, explanation, options, difficulty, historyId } = mcq;
  const [selected, setSelected] = useState<string | null>(savedSelection);
  const [isAnswered, setIsAnswered] = useState(!!savedSelection);
  const score = difficulty;

  useEffect(() => {
    setSelected(savedSelection);
    setIsAnswered(!!savedSelection);
  }, [savedSelection]);

  const handleSelect = (optionValue: string) => {
    if (isAnswered) return;
    setSelected(optionValue);
    setIsAnswered(true);
    const isCorrect = options.find(o => o.text === optionValue)?.correct || false;
    onAnswer(question, optionValue, isCorrect, subject, difficulty);
  };
  const hasSelectedCorrect = options.some(o => o.text === selected && o.correct);

  return (
    <Card className="p-4 bg-background/50 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-2">
            <div className="text-xs text-muted-foreground">
                Generated on {new Date(mcq.timestamp.seconds * 1000).toLocaleDateString()}
            </div>
            {mcq.articleUrl && (
                <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                    <a href={mcq.articleUrl} target="_blank" rel="noopener noreferrer">Source Article <ExternalLink className="w-3 h-3 ml-1" /></a>
                </Button>
            )}
        </div>
        
        <div className="flex-grow">
          {score && <DifficultyGauge score={score} />}
          <FormattedQuestion text={question} />
          {subject && <Badge variant="secondary" className="mb-4 mt-2 font-normal">{subject}</Badge>}
          <div className="grid grid-cols-1 gap-2 mt-4">
            {options.map((option, index) => {
              const optionValue = option.text;
              const isCorrect = option.correct;
              const isSelected = selected === optionValue;
              let icon;
              if (isAnswered) {
                  if (isCorrect) {
                      icon = <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"/>;
                  } else if (isSelected) {
                      icon = <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0"/>;
                  } else {
                      icon = <Circle className="w-4 h-4 text-muted-foreground/50 flex-shrink-0"/>;
                  }
              } else {
                  icon = <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0"/>;
              }
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleSelect(optionValue)}
                  disabled={isAnswered}
                  className={cn(
                    "justify-start text-left h-auto py-2 px-3 whitespace-normal w-full items-center gap-3 transition-all duration-200 hover:bg-accent/80 hover:border-primary/50",
                    isAnswered && {
                      "border-green-400 bg-green-50 text-green-900 hover:bg-green-100 dark:bg-green-900/30 dark:border-green-600 dark:text-green-100 dark:hover:bg-green-900/40": isCorrect,
                      "border-red-400 bg-red-50 text-red-900 hover:bg-red-100 dark:bg-red-900/30 dark:border-red-600 dark:text-red-100 dark:hover:bg-red-900/40": isSelected && !isCorrect,
                      "opacity-60 hover:opacity-80": !isSelected && !isCorrect
                    }
                  )}
                >
                  {icon}
                  <span className="flex items-start gap-2">
                    <span className="font-bold">({String.fromCharCode(65 + index)})</span>
                    <span>{optionValue}</span>
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      <div className="mt-auto pt-3">
          {isAnswered && !hasSelectedCorrect && <p className="text-xs text-red-600 dark:text-red-400 mt-3 font-medium">Not quite. The correct answer is highlighted in green.</p>}
          {isAnswered && hasSelectedCorrect && <p className="text-xs text-green-600 dark:text-green-400 mt-3 font-medium">Correct! Well done.</p>}
          <AnimatePresence>
          {isAnswered && explanation && (
            <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden"
            >
                <div className="p-3 bg-primary/10 border-l-4 border-primary rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-primary">Explanation</h4>
                      <p className="text-sm text-muted-foreground mt-1">{explanation}</p>
                    </div>
                  </div>
                </div>
            </motion.div>
          )}
          </AnimatePresence>
      </div>
    </Card>
  );
};


export default function PrelimsQuestionBankPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [questions, setQuestions] = useState<PrelimsQuestionWithContext[]>([]);
    const [attempts, setAttempts] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            setIsLoading(true);
            Promise.all([
                getPrelimsQuestions(user.uid),
                getAllUserAttempts(user.uid) 
            ]).then(([prelimsQuestions, savedAttempts]) => {
                setQuestions(prelimsQuestions);
                setAttempts(savedAttempts);
                setIsLoading(false);
            }).catch(error => {
                console.error("Failed to load question bank:", error);
                setIsLoading(false);
            });
        }
    }, [user, authLoading, router]);

    const handleAnswer = (question: string, selectedOption: string, isCorrect: boolean, subject?: string, difficulty?: number) => {
        if (!user) return;
        setAttempts(prev => ({ ...prev, [question]: selectedOption }));
        const questionData = questions.find(q => q.question === question);
        if (questionData) {
            saveQuizAttempt(user.uid, questionData.historyId, question, selectedOption, isCorrect, subject, difficulty);
        }
    };
    
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
                        Prelims Question Wall
                    </h1>
                    <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                        Your personal question bank. Review, practice, and master every MCQ you've generated.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-6">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="p-4">
                                <div className="flex justify-between mb-2">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-4 w-1/6" />
                                </div>
                                <Skeleton className="h-5 w-3/4 mb-4" />
                                <div className="space-y-2 mt-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </Card>
                        ))
                    ) : questions.length > 0 ? (
                        questions.map((q, i) => (
                            <MCQ 
                                key={`${q.historyId}-${i}`} 
                                mcq={q} 
                                userId={user.uid} 
                                savedSelection={attempts[q.question] || null} 
                                onAnswer={handleAnswer}
                            />
                        ))
                    ) : (
                        <Card className="text-center p-8 glassmorphic">
                             <div className="mx-auto w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full mb-4">
                                <FileQuestion className="w-6 h-6 text-primary" />
                             </div>
                            <h3 className="text-xl font-semibold">Your Question Wall is Empty</h3>
                            <p className="text-muted-foreground mt-2 mb-4">
                                Questions you generate using the Newspaper Analysis tool will appear here.
                            </p>
                            <Button asChild>
                                <Link href="/newspaper-analysis">Analyze an Article to Start</Link>
                            </Button>
                        </Card>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
