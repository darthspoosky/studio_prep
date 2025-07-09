
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { onIdeasUpdate, type Idea } from '@/services/ideasService';
import { Button } from '@/components/ui/button';
import SurveyModal from '@/components/survey-modal';

const initialIdeas: Idea[] = [
  {
    featureRequests: "AI-powered analysis of my Detailed Application Form (DAF) to generate personalized mock interview questions.",
    author: 'Aarav Sharma',
    role: 'UPSC Aspirant',
    avatar: 'AS',
    glowColor: 'hsl(var(--primary))',
  },
  {
    featureRequests: "A 'focus mode' that blocks distracting websites and apps on my phone during scheduled study sessions.",
    author: 'Ishika Patel',
    role: 'RBI Grade B Aspirant',
    avatar: 'IP',
    glowColor: 'hsl(var(--accent))',
  },
  {
    featureRequests: "Automatically generate visual mind-maps and summaries from long newspaper editorials.",
    author: 'Rohan Gupta',
    role: 'Student',
    avatar: 'RG',
    glowColor: 'hsl(200 96% 87%)',
  },
  {
    featureRequests: "Track my accuracy and time-per-question not just by subject, but by specific micro-topics within the syllabus.",
    author: 'Aditi Rao',
    role: 'Power User',
    avatar: 'AR',
    glowColor: 'hsl(300 96% 87%)',
  },
  {
    featureRequests: "A Text-to-Speech (TTS) feature to listen to saved articles and notes during my commute.",
    author: 'Vikram Singh',
    role: 'Working Professional',
    avatar: 'VS',
    glowColor: 'hsl(150 96% 87%)',
  },
  {
    featureRequests: "Anonymously compare my quiz performance and study pace with other users preparing for the same exam.",
    author: 'Neha Reddy',
    role: 'Community Member',
    avatar: 'NR',
    glowColor: 'hsl(50 96% 87%)',
  },
];


const IdeaCard = ({ featureRequests, author, role, avatar }: Idea) => (
    <div className="w-[300px] sm:w-[350px] lg:w-[400px] shrink-0">
        <Card className="w-full h-full bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700/50 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardContent className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-center pb-2 border-b border-stone-200 dark:border-stone-700">
                    <h3 className="font-headline text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400">From the Community</h3>
                    <div className="w-3 h-3 border-2 border-stone-400 dark:border-stone-500 rounded-full" />
                </div>
                
                <p className="font-serif text-lg md:text-xl my-6 text-stone-800 dark:text-stone-200 flex-grow">
                    {featureRequests}
                </p>
                
                <div className="flex items-center mt-auto pt-4 border-t border-stone-200 dark:border-stone-700">
                    <Avatar className="h-8 w-8">
                        <AvatarImage data-ai-hint="person" src={`https://placehold.co/40x40.png`} className="filter grayscale" />
                        <AvatarFallback>{avatar}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3 text-left">
                        <p className="font-semibold text-sm text-stone-700 dark:text-stone-300">{author}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">{role}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
);


const FeedbackWall = () => {
    const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onIdeasUpdate((newIdeasFromDb) => {
            const newIdeaTexts = new Set(newIdeasFromDb.map(i => i.featureRequests));
            const filteredInitialIdeas = initialIdeas.filter(i => !newIdeaTexts.has(i.featureRequests));
            setIdeas([...newIdeasFromDb, ...filteredInitialIdeas].slice(0, 20));
        });
        return () => unsubscribe();
    }, []);

    const duplicatedIdeas = ideas.length > 0 ? [...ideas, ...ideas] : [];

    return (
        <>
            <section className="relative py-24 sm:py-32 flex flex-col justify-center overflow-hidden bg-background">
                <div className="container mx-auto px-4 text-center mb-16">
                    <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
                        <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                            From the PrepTalk Community
                        </span>
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
                        Our real-time idea wall is shaped by you. Your feedback is crucial—take a 1-minute survey to tell us what you need, and we'll build it.
                    </p>
                    <div className="mt-8">
                        <Button
                            size="lg"
                            className="bg-primary hover:bg-primary/90 animate-pulse-cta"
                            onClick={() => setIsModalOpen(true)}
                        >
                            Take the Survey
                        </Button>
                    </div>
                </div>
                
                <div className="w-full flex flex-col gap-8 -rotate-2 py-8">
                    <motion.div 
                        className="flex gap-8"
                        animate={{ x: ['0%', '-100%'] }}
                        transition={{ ease: 'linear', duration: 50, repeat: Infinity }}
                    >
                        {duplicatedIdeas.map((item, index) => (
                            <IdeaCard key={`marquee-1-${item.id || item.featureRequests}-${index}`} {...item} />
                        ))}
                    </motion.div>
                    <motion.div 
                        className="flex gap-8"
                        animate={{ x: ['-100%', '0%'] }}
                        transition={{ ease: 'linear', duration: 50, repeat: Infinity }}
                    >
                        {duplicatedIdeas.map((item, index) => (
                            <IdeaCard key={`marquee-2-${item.id || item.featureRequests}-${index}`} {...item} />
                        ))}
                    </motion.div>
                </div>
            </section>
            <SurveyModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
        </>
    );
};

export default FeedbackWall;
