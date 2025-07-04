"use client";

import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, useScroll, useTransform } from 'framer-motion';

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

const FeedbackWall = () => {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ['start start', 'end end'],
    });

    const x = useTransform(scrollYProgress, [0.1, 0.9], ['0%', '-50%']);

    return (
        <section ref={targetRef} className="relative h-[300vh] bg-background">
            <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
                <div className="container mx-auto px-4 text-center mb-16">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
                        From the PrepTalk Community
                    </h2>
                    <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                        See what our users are saying about their prep journey with us.
                    </p>
                </div>

                <motion.div style={{ x }} className="flex gap-8 pl-8">
                    {duplicatedTestimonials.map((testimonial, index) => (
                        <Card key={index} className="w-[400px] lg:w-[450px] shrink-0 glassmorphic">
                            <CardContent className="pt-6 flex flex-col h-full">
                                <p className="mb-4 text-foreground flex-grow text-base md:text-lg">"{testimonial.quote}"</p>
                                <div className="flex items-center mt-auto">
                                    <Avatar>
                                        <AvatarImage data-ai-hint="person" src={`https://placehold.co/40x40.png`} />
                                        <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 text-left">
                                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.handle}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default FeedbackWall;
