"use client";

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Mic, FileQuestion, PenLine, MoveRight, Newspaper } from 'lucide-react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const tools = [
    {
        icon: <Newspaper className="w-6 h-6 text-white" />,
        title: 'Newspaper Analysis',
        description: 'Get AI-powered analysis of daily news to improve comprehension and critical thinking.',
        gradient: 'from-orange-500 to-amber-500',
        href: '/newspaper-analysis'
    },
    {
        icon: <Mic className="w-6 h-6 text-white" />,
        title: 'Mock Interview',
        description: 'Practice with an AI interviewer that gives you real-time feedback on your answers, tone, and pacing.',
        gradient: 'from-purple-500 to-indigo-500',
        href: '/mock-interview'
    },
    {
        icon: <FileQuestion className="w-6 h-6 text-white" />,
        title: 'Daily Quiz',
        description: 'Sharpen your knowledge with quick, adaptive quizzes tailored to your exam and progress.',
        gradient: 'from-sky-500 to-cyan-500',
        href: '/daily-quiz'
    },
    {
        icon: <PenLine className="w-6 h-6 text-white" />,
        title: 'Writing Practice',
        description: 'Improve your essays with AI-guided suggestions on structure, clarity, and grammar.',
        gradient: 'from-emerald-500 to-teal-500',
        href: '/writing-practice'
    }
];

const ToolCard = ({ icon, title, description, gradient, href }: { icon: React.ReactNode, title: string, description: string, gradient: string, href: string }) => (
    <Link href={href} className="group relative w-full h-full block">
        <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${gradient} opacity-50 group-hover:opacity-75 transition duration-500 blur-lg`}></div>
        <Card className="relative glassmorphic h-full flex flex-col justify-between transition-transform duration-300 ease-in-out group-hover:scale-105 group-hover:-translate-y-2">
            <div>
                <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                        {icon}
                    </div>
                    <CardTitle className="font-headline">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{description}</p>
                </CardContent>
            </div>
            <div className="p-6 pt-0">
                <div className="text-sm font-medium text-primary group-hover:text-accent-foreground flex items-center">
                    Start Now <MoveRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </Card>
    </Link>
);

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

const FeedbackWall = ({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) => {
    return (
        <div className="relative h-screen flex flex-col justify-center overflow-hidden">
            <div className="container mx-auto px-4 text-center mb-16">
                <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
                    From the PrepTalk Community
                </h2>
                <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                    See what our users are saying about their prep journey with us.
                </p>
            </div>

            <motion.div style={{ x: scrollYProgress }} className="flex gap-8 pl-8">
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
    );
};


const FeatureScroll = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    const titleOpacity = useTransform(scrollYProgress, [0, 0.05, 0.5], [0, 1, 0]);
    const titleY = useTransform(scrollYProgress, [0, 0.05], ['20px', '0px']);
    
    const cardsOpacity = useTransform(scrollYProgress, [0, 0.1, 0.5, 0.6], [0, 1, 1, 0]);

    const feedbackStart = 0.5;
    const feedbackEnd = 0.7;
    const feedbackOpacity = useTransform(scrollYProgress, [feedbackStart, feedbackEnd], [0, 1]);
    const feedbackY = useTransform(scrollYProgress, [feedbackStart, feedbackEnd], ['100vh', '0vh']);
    
    const feedbackScrollStart = 0.7;
    const feedbackScrollEnd = 1.0;
    const feedbackX = useTransform(scrollYProgress, [feedbackScrollStart, feedbackScrollEnd], ['0%', '-50%']);


    return (
        <section id="features" ref={containerRef} className="relative bg-gray-50 dark:bg-gray-900 h-[400vh]">
            <div className="sticky top-0 h-screen overflow-hidden">

                <motion.div 
                    style={{ opacity: titleOpacity, y: titleY }}
                    className="absolute inset-x-0 top-16 z-30"
                >
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
                            <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                                Our Core Tools
                            </span>
                        </h2>
                        <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                            Everything you need to get exam-ready, all in one place.
                        </p>
                    </div>
                </motion.div>

                <motion.div style={{ opacity: cardsOpacity }} className="absolute inset-0 flex items-center justify-center">
                    {tools.map((tool, i) => {
                        const N = tools.length - 1;
                        const y = useTransform(
                            scrollYProgress,
                            [0.1, 0.5],
                            [`${(i) * 120}px`, `${(N - i) * -20}px`]
                        );
                        const scale = useTransform(
                            scrollYProgress,
                            [0.1, 0.5],
                            [1, 1 - (N - i) * 0.05]
                        );

                        return (
                            <motion.div
                                key={tool.title}
                                style={{
                                    y,
                                    scale,
                                    zIndex: i,
                                }}
                                className="absolute h-[450px] w-full max-w-2xl"
                            >
                                <ToolCard {...tool} />
                            </motion.div>
                        );
                    })}
                </motion.div>

                <motion.div
                    style={{ y: feedbackY, opacity: feedbackOpacity, zIndex: 50 }}
                    className="absolute inset-0 bg-gray-50 dark:bg-gray-900"
                >
                    <FeedbackWall scrollYProgress={feedbackX} />
                </motion.div>
            </div>
        </section>
    );
};

export default FeatureScroll;
