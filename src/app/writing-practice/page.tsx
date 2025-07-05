"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Footer from "@/components/landing/footer";
import Header from "@/components/layout/header";

export default function WritingPracticePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
        <div className="text-center mb-16">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tighter">
              <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                Writing Practice
              </span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
              Improve your essays with AI-guided suggestions on structure, clarity, and grammar.
            </p>
        </div>

        <Card className="max-w-2xl mx-auto glassmorphic shadow-2xl shadow-primary/10">
            <CardHeader>
                <CardTitle>Get Essay Feedback</CardTitle>
                <CardDescription>Submit your essay and our AI will provide detailed feedback.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="essay-type">Essay Type</Label>
                    <Select>
                        <SelectTrigger id="essay-type">
                            <SelectValue placeholder="Select an essay type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="argumentative">Argumentative</SelectItem>
                            <SelectItem value="descriptive">Descriptive</SelectItem>
                            <SelectItem value="narrative">Narrative</SelectItem>
                            <SelectItem value="expository">Expository Essay</SelectItem>
                            <SelectItem value="ias-mains">UPSC Mains Essay</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="essay-text">Your Essay</Label>
                    <Textarea id="essay-text" placeholder="Paste your full essay here..." className="h-64" />
                </div>
            </CardContent>
            <CardFooter>
                <Button size="lg" className="w-full">Get Feedback</Button>
            </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
