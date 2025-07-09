
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getFullHistory, type HistoryEntry, deleteHistoryEntry } from '@/services/historyService';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import Footer from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Library, Brain, BarChart, FileText, Activity, SortDesc, MoreVertical, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const GS_PAPER_COLORS: Record<string, string> = {
    'GS-I': 'from-orange-400 to-amber-500',
    'GS-II': 'from-blue-400 to-sky-500',
    'GS-III': 'from-emerald-400 to-teal-500',
    'GS-IV': 'from-purple-400 to-indigo-500',
    'Default': 'from-slate-400 to-gray-500',
};

const getGSPaperColor = (syllabusTopic?: string | null): string => {
    if (!syllabusTopic) return GS_PAPER_COLORS.Default;
    if (syllabusTopic.includes('GS-I') || syllabusTopic.includes('Paper-II')) return GS_PAPER_COLORS['GS-I'];
    if (syllabusTopic.includes('GS-II') || syllabusTopic.includes('Paper-III')) return GS_PAPER_COLORS['GS-II'];
    if (syllabusTopic.includes('GS-III') || syllabusTopic.includes('Paper-IV')) return GS_PAPER_COLORS['GS-III'];
    if (syllabusTopic.includes('GS-IV') || syllabusTopic.includes('Paper-V')) return GS_PAPER_COLORS['GS-IV'];
    return GS_PAPER_COLORS.Default;
};


const AIAnalysisCard = ({ entry, onDelete }: { entry: HistoryEntry, onDelete: (id: string) => void }) => {
  const date = new Date(entry.timestamp.seconds * 1000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  
  const time = new Date(entry.timestamp.seconds * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const mcqCount = entry.analysis.prelims?.mcqs?.length || 0;
  const averageMCQDifficulty = mcqCount > 0 
    ? (entry.analysis.prelims?.mcqs?.reduce((acc, mcq) => acc + (mcq.difficulty || 5), 0) || 0) / mcqCount 
    : 0;
  
  const mainsCount = entry.analysis.mains?.questions?.length || 0;
  const averageMainsDifficulty = mainsCount > 0 && entry.analysis.mains?.questions
    ? entry.analysis.mains.questions.reduce((acc, q) => acc + (q.difficulty || 5), 0) / mainsCount
    : 0;

  const entityCount = entry.analysis.knowledgeGraph?.nodes?.length || 0;
  const relationshipCount = entry.analysis.knowledgeGraph?.edges?.length || 0;
  
  const processingTime = entry.analysis.processingTime || 0;
  const qualityScore = entry.analysis.qualityScore ? (entry.analysis.qualityScore * 10).toFixed(1) : '-';

  const cardColorGradient = getGSPaperColor(entry.analysis.syllabusTopic);

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border border-border/40 bg-card/90 backdrop-blur-sm hover:scale-[1.01]">
      <div className={`h-2 bg-gradient-to-r ${cardColorGradient} rounded-t-lg`} />
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="pr-4">
            <CardTitle className="text-base font-semibold line-clamp-2">
              {entry.analysis.summary?.split(' ').slice(0, 10).join(' ') + '...' || 'Newspaper Analysis'}
            </CardTitle>
            <CardDescription className="text-xs flex items-center gap-1.5 mt-1">
              <Activity className="h-3 w-3" />
              <span>{date} • {time}</span>
            </CardDescription>
          </div>
           <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mt-1 -mr-2">
                      <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this analysis and all associated data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(entry.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
           </AlertDialog>
        </div>
        <div className="mt-2">
            <Badge variant="outline" className="text-xs border-primary/20">
                {entry.analysis.syllabusTopic || 'General Analysis'}
            </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {entry.analysis.tags && entry.analysis.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
                {entry.analysis.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                ))}
            </div>
        )}
        
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="flex flex-col p-2 bg-muted/30 rounded-md">
            <span className="text-xs text-muted-foreground mb-1">MCQs Generated</span>
            <div className="flex items-baseline">
              <span className="text-lg font-semibold">{mcqCount}</span>
              {mcqCount > 0 && (
                <span className="text-xs ml-1.5 text-muted-foreground">
                  (avg. diff {averageMCQDifficulty.toFixed(1)})
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col p-2 bg-muted/30 rounded-md">
            <span className="text-xs text-muted-foreground mb-1">Mains Questions</span>
            <div className="flex items-baseline">
              <span className="text-lg font-semibold">{mainsCount}</span>
              {mainsCount > 0 && (
                <span className="text-xs ml-1.5 text-muted-foreground">
                  (avg. diff {averageMainsDifficulty.toFixed(1)})
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-1 bg-muted/30 rounded-md">
            <div className="text-lg font-medium">{entityCount}</div>
            <div className="text-xs text-muted-foreground">Entities</div>
          </div>
          <div className="text-center p-1 bg-muted/30 rounded-md">
            <div className="text-lg font-medium">{relationshipCount}</div>
            <div className="text-xs text-muted-foreground">Connections</div>
          </div>
           <div className="text-center p-1 bg-muted/30 rounded-md">
            <div className="text-lg font-medium">{qualityScore}</div>
            <div className="text-xs text-muted-foreground">Quality Score</div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-1 mt-auto border-t border-border/30 flex justify-between">
        <Button 
          asChild 
          variant="link" 
          size="sm"
          className="text-xs font-medium p-0 h-8 text-primary"
        >
          <Link href={`/history/${entry.id}`} className="px-3">
            View Full Analysis
          </Link>
        </Button>
        
        <div className="text-xs flex items-center text-muted-foreground">
          <FileText className="mr-1.5 h-3 w-3" />
          <span>{processingTime ? `${processingTime.toFixed(1)}s` : '—'}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default function FullHistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("newest");
    const { toast } = useToast();
    
    const [groupBy, setGroupBy] = useState<string>("none");

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
    
    const handleDelete = async (id: string) => {
        const originalHistory = [...history];
        setHistory(prev => prev.filter(entry => entry.id !== id));
        try {
            await deleteHistoryEntry(id);
            toast({ title: "Analysis Deleted" });
        } catch (error) {
            setHistory(originalHistory);
            toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the analysis. Please try again." });
        }
    };

    if (authLoading || !user) {
        return null;
    }
    
    const sortedHistory = [...history].sort((a, b) => {
        if (sortBy === "newest") {
            return b.timestamp.seconds - a.timestamp.seconds;
        } else if (sortBy === "oldest") {
            return a.timestamp.seconds - b.timestamp.seconds;
        } else if (sortBy === "quality") {
            return (b.analysis.qualityScore || 0) - (a.analysis.qualityScore || 0);
        } else if (sortBy === "questions") {
            const bCount = (b.analysis.prelims?.mcqs?.length || 0) + (b.analysis.mains?.questions?.length || 0);
            const aCount = (a.analysis.prelims?.mcqs?.length || 0) + (a.analysis.mains?.questions?.length || 0);
            return bCount - aCount;
        }
        return 0;
    });
    
    const syllabusTopics = [...new Set(history.map(entry => entry.analysis.syllabusTopic || 'Uncategorized'))];
    
    const getGroupedHistory = () => {
        if (groupBy === "none") {
            return { "All Analyses": sortedHistory };
        } else if (groupBy === "syllabusTopic") {
            const grouped: Record<string, HistoryEntry[]> = {};
            syllabusTopics.forEach(topic => {
                const entriesForTopic = sortedHistory.filter(entry => (entry.analysis.syllabusTopic || 'Uncategorized') === topic);
                if (entriesForTopic.length > 0) {
                    grouped[topic] = entriesForTopic;
                }
            });
            return grouped;
        }
        return { "All Analyses": sortedHistory };
    };
    
    const groupedHistory = getGroupedHistory();

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-16">
                <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
                
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center mb-3">
                        <Brain className="h-8 w-8 mr-3 text-primary" />
                        <h1 className="font-headline text-4xl font-bold tracking-tight">
                            AI Analysis History
                        </h1>
                    </div>
                    <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                        A complete record of all your AI-powered analyses and generated insights from PrepTalk.
                    </p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <Skeleton className="h-2 w-full" />
                                <CardHeader><Skeleton className="h-10 w-3/4" /></CardHeader>
                                <CardContent>
                                    <Skeleton className="h-4 w-full mb-3" />
                                    <Skeleton className="h-4 w-3/4 mb-6" />
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                                    <div className="flex justify-between">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>
                                </CardContent>
                                <CardFooter><Skeleton className="h-8 w-full" /></CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : history.length > 0 ? (
                    <>
                        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6 max-w-7xl mx-auto">
                            <div className="flex items-center">
                                <span className="text-sm text-muted-foreground mr-2">Group by:</span>
                                <Select defaultValue="none" onValueChange={setGroupBy}>
                                    <SelectTrigger className="w-[160px] h-9">
                                        <SelectValue placeholder="Grouping" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="syllabusTopic">Syllabus Topic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="flex items-center">
                                <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
                                <Select defaultValue="newest" onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[160px] h-9">
                                        <SelectValue placeholder="Sort order" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest First</SelectItem>
                                        <SelectItem value="oldest">Oldest First</SelectItem>
                                        <SelectItem value="quality">Quality Score</SelectItem>
                                        <SelectItem value="questions">Question Count</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="mb-24 max-w-7xl mx-auto">
                            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                                <TabsList className="mb-6">
                                    <TabsTrigger value="all">All Analyses</TabsTrigger>
                                    <TabsTrigger value="newspaper">Newspaper</TabsTrigger>
                                </TabsList>
                                <TabsContent value="all">
                                    {Object.entries(groupedHistory).map(([groupName, entries]) => (
                                        <div key={groupName} className="mb-8">
                                            {(groupBy !== "none" && entries.length > 0) && (
                                                <div className="mb-4">
                                                    <h2 className="text-lg font-semibold flex items-center">
                                                        <SortDesc className="h-5 w-5 mr-2 text-muted-foreground" />
                                                        {groupName}
                                                        <Badge variant="outline" className="ml-3 text-xs">
                                                            {entries.length} {entries.length === 1 ? 'analysis' : 'analyses'}
                                                        </Badge>
                                                    </h2>
                                                    <Separator className="mt-2" />
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {entries.map(entry => (
                                                    <AIAnalysisCard key={entry.id} entry={entry} onDelete={handleDelete} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </TabsContent>
                                <TabsContent value="newspaper">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {sortedHistory.map(entry => (
                                            <AIAnalysisCard key={entry.id} entry={entry} onDelete={handleDelete} />
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </>
                ) : (
                    <Card className="text-center p-8 max-w-lg mx-auto border border-muted/40">
                        <CardHeader>
                            <Brain className="mx-auto w-12 h-12 text-muted-foreground/50 mb-4" />
                            <CardTitle>No Analysis History</CardTitle>
                            <CardDescription>
                                Your AI-powered analyses will appear here once you use an analysis tool.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href="/newspaper-analysis">Analyze your first article</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </main>
            <Footer />
        </div>
    );
}
