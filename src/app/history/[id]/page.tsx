'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getHistoryEntry, type HistoryEntry } from '@/services/historyService';

import Header from '@/components/layout/header';
import Footer from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import { type MCQ as MCQType, type MainsQuestion, type KnowledgeGraph } from "@/ai/flows/newspaper-analysis-flow";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle, XCircle, Circle, Gauge, IndianRupee, MoveRight, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

const MCQ = (props: MCQType) => {
  const { question, subject, explanation, options, difficulty } = props;
  const [selected, setSelected] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const score = difficulty;
  const handleSelect = (optionValue: string) => {
    if (isAnswered) return;
    setSelected(optionValue);
    setIsAnswered(true);
  };
  const hasSelectedCorrect = options.some(o => o.text === selected && o.correct);

  return (
    <div className="my-6 p-4 border rounded-lg bg-background/50 shadow-sm">
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
  );
};

const MCQList = ({ mcqs }: { mcqs: MCQType[] }) => {
    if (!mcqs || mcqs.length === 0) {
        return <div className="text-center text-muted-foreground p-8">No Prelims questions were generated for this analysis.</div>;
    }
    return <div>{mcqs.map((q, idx) => <MCQ key={idx} {...q} />)}</div>;
};

const markdownComponents = {
  h3: (props: any) => <h3 className="text-xl font-semibold font-headline mt-6 mb-2 text-primary/90" {...props} />,
  p: (props: any) => <p className="leading-relaxed my-4" {...props} />,
  ul: (props: any) => <ul className="list-disc list-outside pl-6 my-4 space-y-2 text-muted-foreground" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside pl-6 my-4 space-y-2" {...props} />,
  li: (props: any) => <li className="pl-2" {...props} />,
  strong: (props: any) => <strong className="font-bold text-foreground" {...props} />,
};

const MainsQuestionList = ({ questions }: { questions: MainsQuestion[] }) => {
    if (!questions || questions.length === 0) {
        return <div className="text-center text-muted-foreground p-8">No Mains questions were generated for this analysis.</div>;
    }
    return (
        <div className="space-y-8">
            {questions.map((q, i) => (
                <div key={i} className="p-4 border rounded-lg bg-background/50 shadow-sm">
                    <h2 className="text-xl font-bold font-headline text-primary">{q.question}</h2>
                    {q.difficulty && <div className="mt-2"><DifficultyGauge score={q.difficulty} /></div>}
                    {q.guidance && (
                        <div className="prose-sm dark:prose-invert max-w-none text-muted-foreground mt-4">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{q.guidance}</ReactMarkdown>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const entityColors: { [key: string]: string } = {
  Person: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  Organization: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
  Location: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  Policy: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
  Concept: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200",
  Date: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  Statistic: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200",
};

const KnowledgeGraphVisualizer = ({ graphData }: { graphData?: KnowledgeGraph }) => {
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No key connections were identified in this article.</div>;
  }
  const nodesByType = graphData.nodes.reduce((acc, node) => {
    if (!acc[node.type]) acc[node.type] = [];
    acc[node.type].push(node);
    return acc;
  }, {} as { [key: string]: typeof graphData.nodes });
  const getNode = (nodeId: string) => graphData.nodes.find(n => n.id === nodeId);
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Share2 className="w-5 h-5 text-primary"/> Key Entities</h3>
        <div className="space-y-4">
          {Object.entries(nodesByType).map(([type, nodes]) => (
            <div key={type}>
              <h4 className={cn("font-semibold mb-2", entityColors[type])}>{type}</h4>
              <div className="flex flex-wrap gap-2">
                {nodes.map(node => <Badge key={node.id} variant="secondary" className={cn("text-base", entityColors[type])}>{node.label}</Badge>)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MoveRight className="w-5 h-5 text-primary"/> Key Relationships</h3>
        <div className="space-y-3">
          {graphData.edges.map((edge, index) => {
            const sourceNode = getNode(edge.source);
            const targetNode = getNode(edge.target);
            if (!sourceNode || !targetNode) return null;
            return (
              <div key={index} className="flex items-center gap-3 text-sm p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <Badge variant="outline" className={cn(entityColors[sourceNode.type])}>{sourceNode.label}</Badge>
                <div className="flex-1 text-center text-primary font-medium text-xs tracking-wider uppercase">{edge.label}</div>
                <Badge variant="outline" className={cn(entityColors[targetNode.type])}>{targetNode.label}</Badge>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

const UsageStats = ({ totalTokens, inputTokens, outputTokens, cost }: { totalTokens?: number; inputTokens?: number; outputTokens?: number; cost?: number;}) => {
  if (totalTokens === undefined || cost === undefined) return null;
  return (
    <div className="flex items-center gap-6 text-xs text-muted-foreground border-b mb-4 pb-4">
      <TooltipProvider><Tooltip><TooltipTrigger asChild>
        <div className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5" /><span><span className="font-semibold text-foreground">{totalTokens.toLocaleString()}</span> tokens</span></div>
      </TooltipTrigger><TooltipContent><p className="font-medium">Total tokens used by the AI Agent.</p>{inputTokens !== undefined && outputTokens !== undefined && <p className="text-muted-foreground">{inputTokens.toLocaleString()} input + {outputTokens.toLocaleString()} output</p>}</TooltipContent></Tooltip></TooltipProvider>
      <TooltipProvider><Tooltip><TooltipTrigger asChild>
        <div className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" /><span>Cost: <span className="font-semibold text-foreground">₹{cost.toFixed(4)}</span></span></div>
      </TooltipTrigger><TooltipContent><p>Estimated cost in INR based on Gemini Flash model pricing.</p></TooltipContent></Tooltip></TooltipProvider>
    </div>
  );
};

const AnalysisDetailSkeleton = () => (
    <Card className="glassmorphic shadow-2xl shadow-primary/10">
        <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-4 mt-6">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="mt-6">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </CardContent>
    </Card>
);

export default function HistoryDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [historyEntry, setHistoryEntry] = useState<HistoryEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentAnalysisTab, setCurrentAnalysisTab] = useState('prelims');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && id) {
            const fetchEntry = async () => {
                setIsLoading(true);
                const entry = await getHistoryEntry(id);
                if (entry) {
                    if (entry.userId === user.uid) {
                        setHistoryEntry(entry);
                    } else {
                        setError("You do not have permission to view this analysis.");
                    }
                } else {
                    setError("Analysis not found.");
                }
                setIsLoading(false);
            };
            fetchEntry();
        }
    }, [user, id]);

    const { prelimsContent, mainsContent, knowledgeGraphContent } = useMemo(() => {
        if (!historyEntry) return { prelimsContent: [], mainsContent: [], knowledgeGraphContent: undefined };
        const analysis = historyEntry.analysis;
        return {
            prelimsContent: analysis.prelims?.mcqs || [],
            mainsContent: analysis.mains?.questions || [],
            knowledgeGraphContent: analysis.knowledgeGraph,
        };
    }, [historyEntry]);
    
    useEffect(() => {
      if (historyEntry) {
          const hasPrelims = (historyEntry.analysis.prelims?.mcqs?.length || 0) > 0;
          const hasMains = (historyEntry.analysis.mains?.questions?.length || 0) > 0;
          const hasGraph = (historyEntry.analysis.knowledgeGraph?.nodes?.length || 0) > 0;
  
          if (hasPrelims) setCurrentAnalysisTab('prelims');
          else if (hasMains) setCurrentAnalysisTab('mains');
          else if (hasGraph) setCurrentAnalysisTab('connections');
          else setCurrentAnalysisTab('prelims');
      }
    }, [historyEntry]);


    if (authLoading) {
        return null; 
    }

    const showPrelims = prelimsContent.length > 0;
    const showMains = mainsContent.length > 0;
    const showGraph = knowledgeGraphContent && knowledgeGraphContent.nodes.length > 0;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
                <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>

                {isLoading && <AnalysisDetailSkeleton />}
                
                {error && (
                     <Card className="glassmorphic shadow-2xl shadow-primary/10">
                        <CardHeader>
                            <CardTitle>Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-destructive">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {!isLoading && !error && historyEntry && (
                    <Card className="glassmorphic shadow-2xl shadow-primary/10">
                        <CardHeader>
                             <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="font-headline text-3xl">Analysis Details</CardTitle>
                                    <CardDescription>
                                        Reviewed on {new Date(historyEntry.timestamp.seconds * 1000).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                {historyEntry.articleUrl && (
                                     <Button asChild variant="outline">
                                        <a href={historyEntry.articleUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Source Article
                                        </a>
                                    </Button>
                                )}
                             </div>
                        </CardHeader>
                        <CardContent>
                            <UsageStats
                                totalTokens={historyEntry.analysis.totalTokens}
                                inputTokens={historyEntry.analysis.inputTokens}
                                outputTokens={historyEntry.analysis.outputTokens}
                                cost={historyEntry.analysis.cost}
                            />
                            {historyEntry.analysis.summary && (
                              <div className="mb-6 p-4 bg-primary/10 rounded-lg">
                                <p className="text-muted-foreground italic">
                                  {historyEntry.analysis.summary}
                                </p>
                              </div>
                            )}

                             <Tabs value={currentAnalysisTab} onValueChange={setCurrentAnalysisTab} className="w-full flex-1 flex flex-col mt-4">
                                <TabsList>
                                    {showPrelims && <TabsTrigger value="prelims" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 dark:data-[state=active]:bg-blue-900/50 dark:data-[state=active]:text-blue-200">Prelims Questions</TabsTrigger>}
                                    {showMains && <TabsTrigger value="mains" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 dark:data-[state=active]:bg-purple-900/50 dark:data-[state=active]:text-purple-200">Mains Questions</TabsTrigger>}
                                    {showGraph && <TabsTrigger value="connections" className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-800 dark:data-[state=active]:bg-teal-900/50 dark:data-[state=active]:text-teal-200">Key Connections</TabsTrigger>}
                                </TabsList>
                                <div className="mt-4">
                                    <ScrollArea className="h-[60vh] pr-4 -mr-4">
                                        {showPrelims && <TabsContent value="prelims"><MCQList mcqs={prelimsContent} /></TabsContent>}
                                        {showMains && <TabsContent value="mains"><MainsQuestionList questions={mainsContent} /></TabsContent>}
                                        {showGraph && <TabsContent value="connections"><KnowledgeGraphVisualizer graphData={knowledgeGraphContent} /></TabsContent>}
                                    </ScrollArea>
                                </div>
                            </Tabs>
                        </CardContent>
                    </Card>
                )}
            </main>
            <Footer />
        </div>
    );
}
