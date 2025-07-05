"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Footer from "@/components/landing/footer";
import Header from "@/components/layout/header";

export default function MockInterviewPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
        <div className="text-center mb-16">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tighter">
              <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                Mock Interview
              </span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                Practice with our AI interviewer to get real-time feedback on your answers, tone, and pacing.
            </p>
        </div>

        <Card className="max-w-2xl mx-auto glassmorphic shadow-2xl shadow-primary/10">
            <CardHeader>
                <CardTitle>Configure Your Interview</CardTitle>
                <CardDescription>Set up the parameters for your practice session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="interview-type">Interview Type</Label>
                    <Select>
                        <SelectTrigger id="interview-type">
                            <SelectValue placeholder="Select an interview type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="behavioral">Behavioral</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="case-study">Case Study</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="job-description">Paste Job Description (Optional)</Label>
                    <Textarea id="job-description" placeholder="For a more tailored experience, paste the job description here..." className="h-32" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select>
                        <SelectTrigger id="difficulty">
                            <SelectValue placeholder="Select a difficulty level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter>
                <Button size="lg" className="w-full">Start Interview</Button>
            </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
