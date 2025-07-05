"use client";

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
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function NewspaperAnalysisPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = () => {
    setIsLoading(true);
    // Simulate API call while feature is in development
    setTimeout(() => {
      toast({
        title: "Coming Soon!",
        description: "Our AI is sharpening its analytical skills. This feature will be live soon!",
      });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
        <div className="max-w-2xl mx-auto">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
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
                    Analyze news articles to improve your comprehension and critical thinking skills.
                </p>
            </div>

            <Card className="glassmorphic shadow-2xl shadow-primary/10">
                <CardHeader>
                    <CardTitle>Analyze an Article</CardTitle>
                    <CardDescription>Provide an article by URL or by pasting the text directly.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs defaultValue="url" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="url">From URL</TabsTrigger>
                            <TabsTrigger value="text">Paste Text</TabsTrigger>
                        </TabsList>
                        <TabsContent value="url" className="pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="url">Article URL</Label>
                                <Input id="url" placeholder="https://www.thehindu.com/opinion/editorial/..." />
                            </div>
                        </TabsContent>
                        <TabsContent value="text" className="pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="article-text">Article Text</Label>
                                <Textarea id="article-text" placeholder="Paste the full text of an editorial or news article here..." className="h-40" />
                            </div>
                        </TabsContent>
                    </Tabs>
                    <div className="space-y-2">
                        <Label htmlFor="analysis-focus">Analysis Focus</Label>
                        <Select>
                            <SelectTrigger id="analysis-focus">
                                <SelectValue placeholder="Select an analysis type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="summary">Editorial Summary & Key Points</SelectItem>
                                <SelectItem value="critical-analysis">Critical Analysis & Bias Detection</SelectItem>
                                <SelectItem value="vocabulary">Vocabulary for Competitive Exams</SelectItem>
                                <SelectItem value="fact-opinion">Fact vs. Opinion Identification</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full" onClick={handleAnalyze} disabled={isLoading}>
                        {isLoading && <Loader2 className="animate-spin" />}
                        {isLoading ? "Analyzing Article..." : "Analyze Article"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
