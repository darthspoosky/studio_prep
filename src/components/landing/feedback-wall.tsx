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

const FeedbackWall = () => {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ['start start', 'end end'],
    });

    const opacity = useTransform(scrollYProgress, [0.1, 0.3, 0.8, 1], [0, 1, 1, 0]);
    const y = useTransform(scrollYProgress, [0.1, 0.3, 0.8, 1], ['40px', '0px', '0px', '-40px']);

    return (
        <section ref={targetRef} className="relative h-[150vh] bg-gray-50 dark:bg-gray-900 z-20">
            <div className="sticky top-0 h-screen flex items-center justify-center">
                <motion.div style={{ opacity, y }} className="container mx-auto px-4">
                    <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
                        From the PrepTalk Community
                    </h2>
                    <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                        See what our users are saying about their prep journey with us.
                    </p>
                    </div>
                    <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="h-full">
                            <CardContent className="pt-6 flex flex-col h-full">
                            <p className="mb-4 text-foreground flex-grow">"{testimonial.quote}"</p>
                            <div className="flex items-center mt-auto">
                                <Avatar>
                                <AvatarImage data-ai-hint="person" src={`https://placehold.co/40x40.png`} />
                                <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                <p className="font-semibold text-foreground">{testimonial.name}</p>
                                <p className="text-sm text-muted-foreground">{testimonial.handle}</p>
                                </div>
                            </div>
                            </CardContent>
                        </Card>
                    ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default FeedbackWall;
