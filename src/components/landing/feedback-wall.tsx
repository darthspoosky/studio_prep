"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { onIdeasUpdate, type Idea } from '@/services/ideasService';

const initialIdeas: Idea[] = [
  {
    featureRequests: "An AI that creates a personalized study schedule based on my weak areas would be amazing.",
    author: 'Priya S.',
    role: 'Beta Tester',
    avatar: 'PS',
    glowColor: 'hsl(var(--primary))',
  },
  {
    featureRequests: "What if we could upload our own practice essays and get instant feedback on structure and grammar?",
    author: 'Ben C.',
    role: 'Early Adopter',
    avatar: 'BC',
    glowColor: 'hsl(var(--accent))',
  },
  {
    featureRequests: "I'd love a 'cram session' mode that drills you on the topics you struggle with most, right before an exam.",
    author: 'Maria G.',
    role: 'Student Voice',
    avatar: 'MG',
    glowColor: 'hsl(200 96% 87%)',
  },
  {
    featureRequests: "Could the mock interviewer simulate different personality types, like a friendly or a very strict one?",
    author: 'Alex J.',
    role: 'Power User',
    avatar: 'AJ',
    glowColor: 'hsl(300 96% 87%)',
  },
  {
    featureRequests: "Gamify the daily quizzes! Leaderboards, points, and streaks would make studying much more fun.",
    author: 'Samantha L.',
    role: 'Beta Tester',
    avatar: 'SL',
    glowColor: 'hsl(150 96% 87%)',
  },
  {
    featureRequests: "A feature to connect with other students studying for the same exam would be great for motivation.",
    author: 'David C.',
    role: 'Community Member',
    avatar: 'DC',
    glowColor: 'hsl(50 96% 87%)',
  },
];

const IdeaCard = ({ featureRequests, author, role, avatar, glowColor }: Idea) => (
    <motion.div
        whileHover={{
            scale: 1.05,
            y: -8,
            boxShadow: `0 0 30px 5px ${glowColor}`,
            zIndex: 50
        }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="relative w-[300px] sm:w-[350px] lg:w-[400px] shrink-0"
    >
        <Card className="w-full h-full glassmorphic">
            <CardContent className="pt-6 flex flex-col h-full">
                <p className="mb-4 text-foreground flex-grow text-base md:text-lg">"{featureRequests}"</p>
                <div className="flex items-center mt-auto">
                    <Avatar>
                        <AvatarImage data-ai-hint="person" src={`https://placehold.co/40x40.png`} />
                        <AvatarFallback>{avatar}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 text-left">
                        <p className="font-semibold text-foreground">{author}</p>
                        <p className="text-sm text-muted-foreground">{role}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    </motion.div>
);


const FeedbackWall = () => {
    const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);

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
        <section className="relative py-24 sm:py-32 flex flex-col justify-center overflow-hidden bg-background">
            <div className="container mx-auto px-4 text-center mb-16">
                <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
                    <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                        From the PrepTalk Community
                    </span>
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
                    Our real-time idea wall, shaped by you and powered by AI.
                </p>
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
    );
};

export default FeedbackWall;
