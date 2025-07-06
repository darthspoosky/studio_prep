
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import Footer from "@/components/landing/footer";
import Header from "@/components/layout/header";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, CheckCircle, XCircle, Circle, Info, Maximize, Volume2, Gauge, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeNewspaperArticle, type NewspaperAnalysisInput, type NewspaperAnalysisOutput, type MCQ as MCQType, type MainsQuestion } from "@/ai/flows/newspaper-analysis-flow";
import { textToSpeech } from "@/ai/flows/text-to-speech-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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


const MCQ = ({ question, subject, explanation, children, difficultyScore }: { question: string, subject: string, explanation: string, children: React.ReactNode, difficultyScore?: string }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const score = difficultyScore ? parseInt(difficultyScore, 10) : null;

  const options = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<{ children: string, correct?: string }> =>
      React.isValidElement(child) && typeof child.props.children === 'string'
  );

  const handleSelect = (optionValue: string) => {
    if (isAnswered) return;
    setSelected(optionValue);
    setIsAnswered(true);
  };
  
  const hasSelectedCorrect = options.some(o => o.props.children === selected && o.props.correct === 'true');

  return (
    <div className="my-6 p-4 border rounded-lg bg-background/50 shadow-sm">
      {score && <DifficultyGauge score={score} />}
      <p className="font-semibold leading-relaxed text-foreground">{question}</p>
      {subject && <Badge variant="secondary" className="mb-4 mt-2 font-normal">{subject}</Badge>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        {options.map((option, index) => {
          const optionValue = option.props.children;
          const isCorrect = option.props.correct === 'true';
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
                "justify-start text-left h-auto py-2 px-3 whitespace-normal w-full items-center gap-2 transition-all duration-200 hover:bg-accent/80 hover:border-primary/50",
                isAnswered && {
                  "border-green-400 bg-green-50 text-green-900 hover:bg-green-100 dark:bg-green-900/30 dark:border-green-600 dark:text-green-100 dark:hover:bg-green-900/40": isCorrect,
                  "border-red-400 bg-red-50 text-red-900 hover:bg-red-100 dark:bg-red-900/30 dark:border-red-600 dark:text-red-100 dark:hover:bg-red-900/40": isSelected && !isCorrect,
                  "opacity-60 hover:opacity-80": !isSelected && !isCorrect
                }
              )}
            >
              {icon}
              <span>{optionValue}</span>
            </Button>
          );
        })}
      </div>
      {isAnswered && !hasSelectedCorrect && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-3 font-medium">
              Not quite. The correct answer is highlighted in green.
          </p>
      )}
      {isAnswered && hasSelectedCorrect && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-3 font-medium">
              Correct! Well done.
          </p>
      )}
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

const MCQList = ({ mcqs }: { mcqs: MCQType[] }) => (
  <div>
    {mcqs.map((q, idx) => (
      <MCQ
        key={idx}
        question={q.question}
        subject={q.subject || ""}
        explanation={q.explanation || ""}
        difficultyScore={q.difficulty ? q.difficulty.toString() : undefined}
      >
        {q.options.map((opt, i) => (
          <span key={i} correct={opt.correct ? "true" : undefined}>{opt.text}</span>
        ))}
      </MCQ>
    ))}
  </div>
);

const MainsQuestionList = ({ questions }: { questions: MainsQuestion[] }) => (
  <div className="space-y-8">
    {questions.map((q, i) => (
      <div key={i} className="p-4 border rounded-lg bg-background/50 shadow-sm">
        <h3 className="font-semibold mb-2">{q.question}</h3>
        {q.difficulty && <DifficultyGauge score={q.difficulty} />}
        {q.guidance && (
          <AnalysisOutputDisplay analysis={q.guidance} />
        )}
      </div>
    ))}
  </div>
);

const markdownComponents = {
  // Custom tag renderers
  person: (props: any) => <span className="entity-tag entity-person">{props.children}</span>,
  place: (props: any) => <span className="entity-tag entity-place">{props.children}</span>,
  scheme: (props: any) => <span className="entity-tag entity-scheme">{props.children}</span>,
  date: (props: any) => <span className="entity-tag entity-date">{props.children}</span>,
  org: (props: any) => <span className="entity-tag entity-org">{props.children}</span>,
  mcq: (props: any) => <MCQ {...props} />,
  option: (props: any) => <>{props.children}</>,
  
  // Premium styling for standard markdown
  h1: (props: any) => <h1 className="text-3xl font-bold font-headline mt-8 pb-2 border-b-2 border-primary/30 text-primary" {...props} />,
  h2: (props: any) => {
    const content = React.Children.toArray(props.children).join('');
    const difficultyRegex = / \(Difficulty: (\d{1,2})\/10\)$/;
    const match = content.match(difficultyRegex);
    
    const title = match ? content.replace(difficultyRegex, '') : content;
    const score = match ? parseInt(match[1], 10) : null;

    return (
      <div className="text-2xl font-bold font-headline mt-8 mb-4 p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
          <h2 {...props}>{title}</h2>
          {score && <div className="mt-2"><DifficultyGauge score={score} /></div>}
      </div>
    );
  },
  h3: (props: any) => <h3 className="text-xl font-semibold font-headline mt-6 mb-2 text-primary/90" {...props} />,
  blockquote: (props: any) => <blockquote className="relative border-l-4 border-primary bg-primary/10 p-4 my-4 rounded-r-lg italic text-muted-foreground" {...props} />,
  p: (props: any) => <p className="leading-relaxed my-4" {...props} />,
  ul: (props: any) => <ul className="list-disc list-outside pl-6 my-4 space-y-2 text-muted-foreground" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-outside pl-6 my-4 space-y-2" {...props} />,
  li: (props: any) => <li className="pl-2" {...props} />,
  code: (props: any) => <code className="bg-muted text-foreground font-mono text-sm rounded-md px-1.5 py-1" {...props} />,
  table: (props: any) => <div className="my-6 w-full overflow-y-auto rounded-lg border"><table className="w-full" {...props} /></div>,
  tr: (props: any) => <tr className="m-0 border-t p-0 even:bg-muted" {...props} />,
  th: (props: any) => <th className="border-b border-r px-4 py-2 text-left font-bold bg-muted/50 [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />,
  td: (props: any) => <td className="border-r px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />,
};

const AnalysisOutputDisplay = ({ analysis }: { analysis: string }) => (
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={markdownComponents}
        className="prose-sm dark:prose-invert max-w-none prose-headings:font-headline prose-h1:text-primary"
    >
        {analysis}
    </ReactMarkdown>
);

const UsageStats = ({
  totalTokens,
  inputTokens,
  outputTokens,
  cost,
}: {
  totalTokens: number;
  inputTokens?: number;
  outputTokens?: number;
  cost: number;
}) => {
  return (
    <div className="flex items-center gap-6 text-xs text-muted-foreground border-b mb-4 pb-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              <span>
                <span className="font-semibold text-foreground">
                  {totalTokens.toLocaleString()}
                </span>{" "}
                tokens
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Total tokens used by the AI Agent.</p>
            {inputTokens !== undefined && outputTokens !== undefined && (
              <p className="text-muted-foreground">
                {inputTokens.toLocaleString()} input +{" "}
                {outputTokens.toLocaleString()} output
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>
                Cost:{" "}
                <span className="font-semibold text-foreground">
                  ₹{cost.toFixed(4)}
                </span>
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Estimated cost in INR based on Gemini Flash model pricing.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};


export default function NewspaperAnalysisPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<NewspaperAnalysisOutput | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("url");
  const [inputs, setInputs] = useState({
    url: "",
    text: "",
    examType: "UPSC Civil Services",
    analysisFocus: "Generate Questions (Mains & Prelims)",
    outputLanguage: "English",
  });
  const { toast } = useToast();

  const handleInputChange = (field: keyof typeof inputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = async () => {
    const sourceText = activeTab === 'url' ? inputs.url : inputs.text;

    if (!sourceText.trim()) {
        toast({ variant: 'destructive', title: "Input Required", description: "Please provide an article URL or paste the text to analyze." });
        return;
    }
    if (!inputs.examType) {
        toast({ variant: 'destructive', title: "Exam Type Required", description: "Please select an exam type." });
        return;
    }
    if (!inputs.analysisFocus) {
        toast({ variant: 'destructive', title: "Analysis Focus Required", description: "Please select an analysis focus." });
        return;
    }
    
    setIsLoading(true);
    setAnalysisResult(null);
    setAudioSrc(null);

    try {
        const flowInput: Omit<NewspaperAnalysisInput, 'difficulty'> = {
            sourceText,
            examType: inputs.examType,
            analysisFocus: inputs.analysisFocus,
            outputLanguage: inputs.outputLanguage,
        };
        const result = await analyzeNewspaperArticle(flowInput);
        setAnalysisResult(result);
    } catch (error) {
        console.error("Analysis error:", error);
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "The AI failed to analyze the article. Please check the input or try again later.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!analysisResult?.summary) return;

    setIsGeneratingAudio(true);
    setAudioSrc(null);
    try {
      const { audio } = await textToSpeech(analysisResult.summary);
      setAudioSrc(audio);
    } catch (error) {
      console.error("Audio generation error:", error);
      toast({
          variant: "destructive",
          title: "Audio Failed",
          description: "Could not generate an audio summary for this article.",
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const { prelimsContent, mainsContent } = useMemo(() => {
    if (!analysisResult) {
        return { prelimsContent: [] as MCQType[], mainsContent: null as MainsQuestion[] | null };
    }
    return {
        prelimsContent: analysisResult.prelims.mcqs,
        mainsContent: analysisResult.mains?.questions || null,
    };
  }, [analysisResult]);

  const showTabs = !!mainsContent && prelimsContent.length > 0;
  
  const audioButton = (
    <Button 
        onClick={handleGenerateAudio} 
        disabled={isGeneratingAudio || inputs.outputLanguage !== 'English'} 
        variant="outline" 
        size="sm"
    >
        {isGeneratingAudio ? <Loader2 className="animate-spin" /> : <Volume2 />}
        {isGeneratingAudio ? "Generating..." : "Listen"}
    </Button>
  );


  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
        <Link href="/#tools" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
        </Link>
        <div className="text-center mb-16">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tighter">
            <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                Newspaper Analysis
            </span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                Go beyond summarization. Extract exam-ready insights from any news article.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Input */}
            <div className="lg:col-span-1 lg:sticky top-24">
                <Card className="glassmorphic shadow-2xl shadow-primary/10">
                    <CardHeader>
                        <CardTitle>Analyze an Article</CardTitle>
                        <CardDescription>Provide an article by URL or by pasting the text directly.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="url">From URL</TabsTrigger>
                                <TabsTrigger value="text">Paste Text</TabsTrigger>
                            </TabsList>
                            <TabsContent value="url" className="pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="url">Article URL</Label>
                                    <Input id="url" placeholder="https://www.thehindu.com/opinion/editorial/..." value={inputs.url} onChange={(e) => handleInputChange("url", e.target.value)} />
                                </div>
                            </TabsContent>
                            <TabsContent value="text" className="pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="article-text">Article Text</Label>
                                    <Textarea id="article-text" placeholder="Paste the full text of an editorial or news article here..." className="h-40" value={inputs.text} onChange={(e) => handleInputChange("text", e.target.value)} />
                                </div>
                            </TabsContent>
                        </Tabs>
                        <div className="space-y-2">
                            <Label htmlFor="analysis-focus">Analysis Focus</Label>
                            <Select value={inputs.analysisFocus} onValueChange={(value) => handleInputChange("analysisFocus", value)}>
                                <SelectTrigger id="analysis-focus">
                                    <SelectValue placeholder="Select an analysis type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Generate Questions (Mains & Prelims)">Generate Questions (Mains & Prelims)</SelectItem>
                                    <SelectItem value="Mains Analysis (Arguments, Keywords, Viewpoints)">Mains Analysis (Arguments, Keywords, Viewpoints)</SelectItem>
                                    <SelectItem value="Prelims Fact Finder (Key Names, Dates, Schemes)">Prelims Fact Finder (Key Names, Dates, Schemes)</SelectItem>
                                    <SelectItem value="Critical Analysis (Tone, Bias, Fact vs. Opinion)">Critical Analysis (Tone, Bias, Fact vs. Opinion)</SelectItem>
                                    <SelectItem value="Vocabulary Builder for Editorials">Vocabulary Builder for Editorials</SelectItem>
                                    <SelectItem value="Comprehensive Summary">Comprehensive Summary</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="output-language">Output Language</Label>
                            <Select value={inputs.outputLanguage} onValueChange={(value) => handleInputChange("outputLanguage", value)}>
                                <SelectTrigger id="output-language">
                                    <SelectValue placeholder="Select a language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="English">English</SelectItem>
                                    <SelectItem value="Hindi">Hindi (हिन्दी)</SelectItem>
                                    <SelectItem value="Tamil">Tamil (தமிழ்)</SelectItem>
                                    <SelectItem value="Bengali">Bengali (বাংলা)</SelectItem>
                                    <SelectItem value="Telugu">Telugu (తెలుగు)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="exam-type">Exam Type</Label>
                            <Select value={inputs.examType} onValueChange={(value) => handleInputChange("examType", value)}>
                                <SelectTrigger id="exam-type">
                                    <SelectValue placeholder="Select an exam type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UPSC Civil Services">UPSC Civil Services</SelectItem>
                                    <SelectItem value="State PSC">State PSC</SelectItem>
                                    <SelectItem value="RBI Grade B">RBI Grade B</SelectItem>
                                    <SelectItem value="Other Competitive Exams">Other Competitive Exams</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full" onClick={handleAnalyze} disabled={isLoading}>
                            {isLoading ? (
                              <>
                                <Loader2 className="animate-spin" />
                                Analyzing Article...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5" />
                                Analyze Article
                              </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>


            {/* Right Column: Analysis Output */}
            <div className="lg:col-span-2">
                <Dialog>
                     <Card className="relative glassmorphic shadow-2xl shadow-primary/10 lg:min-h-[620px] flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>AI Analysis</CardTitle>
                                    <CardDescription>The breakdown of your article will appear here.</CardDescription>
                                </div>
                                {analysisResult?.analysis && (
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary -mr-2 -mt-2 flex-shrink-0">
                                            <Maximize className="w-5 h-5" />
                                        </Button>
                                    </DialogTrigger>
                                )}
                            </div>
                        </CardHeader>
                        <div className="flex-1 flex flex-col px-6 pb-6 pt-0">
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center text-center h-full flex-1 p-8">
                                    <Loader2 className="w-16 h-16 text-primary/50 animate-spin mb-4" />
                                    <p className="text-muted-foreground font-medium text-lg">Our AI is reading...</p>
                                    <p className="text-muted-foreground">This can take a moment for long articles.</p>
                                </div>
                            )}
                            {!isLoading && !analysisResult && (
                                <div className="flex flex-col items-center justify-center text-center h-full flex-1 p-8">
                                    <Sparkles className="w-24 h-24 text-primary/30 mb-4" />
                                    <h3 className="font-semibold text-foreground text-xl">Waiting for article</h3>
                                    <p className="text-muted-foreground mt-2 max-w-sm">Submit an article on the left to see the AI-powered analysis.</p>
                                </div>
                            )}
                            {!isLoading && analysisResult && (
                              <div className="flex-1 flex flex-col">
                                {analysisResult.totalTokens !== undefined && analysisResult.cost !== undefined && (
                                    <UsageStats
                                        totalTokens={analysisResult.totalTokens}
                                        inputTokens={analysisResult.inputTokens}
                                        outputTokens={analysisResult.outputTokens}
                                        cost={analysisResult.cost}
                                    />
                                )}
                                {analysisResult.summary && (
                                  <div className="mb-4 p-4 bg-primary/10 rounded-lg flex items-center gap-4">
                                    <p className="flex-1 text-sm text-muted-foreground italic">
                                      {analysisResult.summary}
                                    </p>
                                    {inputs.outputLanguage !== 'English' ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span tabIndex={0}>{audioButton}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Audio summaries are only available in English for now.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        audioButton
                                    )}
                                  </div>
                                )}
                                {audioSrc && (
                                  <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}}>
                                    <audio controls src={audioSrc} className="w-full h-10" />
                                  </motion.div>
                                )}

                                {showTabs ? (
                                    <Tabs defaultValue="prelims" className="w-full flex-1 flex flex-col mt-4">
                                        <TabsList>
                                            <TabsTrigger 
                                                value="prelims"
                                                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 dark:data-[state=active]:bg-blue-900/50 dark:data-[state=active]:text-blue-200"
                                            >
                                                Prelims Questions
                                            </TabsTrigger>
                                            {mainsContent && 
                                                <TabsTrigger 
                                                    value="mains"
                                                    className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 dark:data-[state=active]:bg-purple-900/50 dark:data-[state=active]:text-purple-200"
                                                >
                                                    Mains Questions
                                                </TabsTrigger>
                                            }
                                        </TabsList>
                                        <TabsContent value="prelims" className="flex-1 mt-4">
                                            <ScrollArea className="h-[400px] w-full pr-4 -mr-4">
                                                <MCQList mcqs={prelimsContent} />
                                            </ScrollArea>
                                        </TabsContent>
                                        {mainsContent && (
                                            <TabsContent value="mains" className="flex-1 mt-4">
                                                <ScrollArea className="h-[400px] w-full pr-4 -mr-4">
                                                    <MainsQuestionList questions={mainsContent} />
                                                </ScrollArea>
                                            </TabsContent>
                                        )}
                                    </Tabs>
                                ) : (
                                    <ScrollArea className="h-[450px] w-full pr-4 -mr-4">
                                        <MCQList mcqs={prelimsContent} />
                                    </ScrollArea>
                                )}
                              </div>
                            )}
                        </div>
                    </Card>
                    <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Expanded Analysis</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="flex-1 pr-6 -mr-6">
                           {analysisResult && (
                             <MCQList mcqs={analysisResult.prelims.mcqs} />
                           )}
                           {analysisResult?.mains && (
                             <MainsQuestionList questions={analysisResult.mains.questions} />
                           )}
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
