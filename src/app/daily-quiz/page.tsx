"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Footer from "@/components/landing/footer";
import Header from "@/components/layout/header";

export default function DailyQuizPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
        <div className="text-center mb-16">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tighter">
              <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                Daily Quiz
              </span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                Sharpen your knowledge with quick, adaptive quizzes tailored to your exam and progress.
            </p>
        </div>

        <Card className="max-w-2xl mx-auto glassmorphic shadow-2xl shadow-primary/10">
            <CardHeader>
                <CardTitle>Set Up Your Quiz</CardTitle>
                <CardDescription>Customize your quiz to focus on what you need.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select>
                        <SelectTrigger id="subject">
                            <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="general-knowledge">General Knowledge</SelectItem>
                            <SelectItem value="quantitative-aptitude">Quantitative Aptitude</SelectItem>
                            <SelectItem value="reasoning">Logical Reasoning</SelectItem>
                            <SelectItem value="english">English Language</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="num-questions">Number of Questions</Label>
                     <Select>
                        <SelectTrigger id="num-questions">
                            <SelectValue placeholder="Select number of questions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                    </Select>
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
                            <SelectItem value="adaptive">Adaptive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter>
                <Button size="lg" className="w-full">Start Quiz</Button>
            </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
