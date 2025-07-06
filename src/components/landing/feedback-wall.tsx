"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "PrepTalk's AI bot is a game-changer for my interview practice. The feedback is so insightful!",
    name: 'Alex Johnson',
    handle: 'Software Engineer',
    avatar: 'AJ',
  },
  {
    quote: 'The daily quizzes are the perfect way to start my study sessions. Short, sharp, and relevant.',
    name: 'Maria Garcia',
    handle: 'Pre-Med Student',
    avatar: 'MG',
  },
  {
    quote: "I finally feel confident about my writing skills for the GRE. The prompts are fantastic.",
    name: 'David Chen',
    handle: 'Graduate Applicant',
    avatar: 'DC',
  },
  {
    quote: "The community feedback feature is brilliant. It's like having thousands of study partners.",
    name: 'Samantha Lee',
    handle: 'SAT Taker',
    avatar: 'SL',
  },
  {
    quote: 'An indispensable tool. The mock interviews helped me land my dream internship.',
    name: 'Ben Carter',
    handle: 'MBA Candidate',
    avatar: 'BC',
  },
  {
    quote: 'The AI-powered writing practice has drastically improved my essays. A must-have!',
    name: 'Priya Patel',
    handle: 'Law Student',
    avatar: 'PP',
  },
];

const duplicatedTestimonials = [...testimonials, ...testimonials];

const TestimonialCard = ({ quote, name, handle, avatar }: (typeof testimonials)[0]) => (
    <Card className="w-[300px] sm:w-[350px] lg:w-[400px] shrink-0 glassmorphic h-full">
        <CardContent className="pt-6 flex flex-col h-full">
            <p className="mb-4 text-foreground flex-grow text-base">"{quote}"</p>
            <div className="flex items-center mt-auto">
                <Avatar>
                    <AvatarImage data-ai-hint="person" src={`https://placehold.co/40x40.png`} />
                    <AvatarFallback>{avatar}</AvatarFallback>
                </Avatar>
                <div className="ml-4 text-left">
                    <p className="font-semibold text-foreground">{name}</p>
                    <p className="text-sm text-muted-foreground">{handle}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);


const FeedbackWall = () => {
    return (
        <section className="relative py-24 sm:py-32 flex flex-col justify-center overflow-hidden bg-background">
            <div className="container mx-auto px-4 text-center mb-16">
                <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
                    From the PrepTalk Community
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
                    See what our users are saying about their prep journey with us.
                </p>
            </div>
            
            <div className="w-full flex flex-col gap-8 -rotate-2 py-8">
                <motion.div 
                    className="flex gap-8"
                    animate={{ x: ['0%', '-100%'] }}
                    transition={{ ease: 'linear', duration: 50, repeat: Infinity }}
                >
                    {duplicatedTestimonials.map((testimonial, index) => (
                        <TestimonialCard key={`marquee-1-${index}`} {...testimonial} />
                    ))}
                </motion.div>
                <motion.div 
                    className="flex gap-8"
                    animate={{ x: ['-100%', '0%'] }}
                    transition={{ ease: 'linear', duration: 50, repeat: Infinity }}
                >
                    {duplicatedTestimonials.map((testimonial, index) => (
                        <TestimonialCard key={`marquee-2-${index}`} {...testimonial} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default FeedbackWall;
