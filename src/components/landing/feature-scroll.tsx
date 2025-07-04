"use client";

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Mic, FileQuestion, PenLine, MoveRight, Newspaper } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import FeedbackWall from './feedback-wall';

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


const FeatureScroll = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    const titleOpacity = useTransform(scrollYProgress, [0, 0.05, 0.6], [0, 1, 0]);
    const titleY = useTransform(scrollYProgress, [0, 0.05], ['20px', '0px']);

    const cardTransforms = tools.map((_, i) => {
        const totalCards = tools.length;
        // Each card starts animating a bit later than the previous one
        const start = 0.1 + i * 0.1;
        // The point where all cards are stacked and the feedback wall starts to appear
        const end = 0.7;

        const scaleInput = [start, Math.min(start + 0.1, end)];
        const scale = useTransform(scrollYProgress, scaleInput, [1, 1 - (i * 0.05)]);

        const yInput = [start, Math.min(start + 0.1, end)];
        const y = useTransform(scrollYProgress, yInput, [0, i * 12]);
        
        return { scale, y };
    });

    const feedbackOpacity = useTransform(scrollYProgress, [0.6, 0.7], [0, 1]);
    const feedbackY = useTransform(scrollYProgress, [0.6, 0.8], ['100vh', '0vh']);
    const feedbackX = useTransform(scrollYProgress, [0.8, 1], ['0%', '-50%']);


    return (
        <section id="features" ref={containerRef} className="relative bg-gray-50 dark:bg-gray-900 h-[600vh]">
            <div className="sticky top-0 h-screen overflow-hidden">

                <motion.div 
                    style={{ opacity: titleOpacity, y: titleY }}
                    className="absolute inset-x-0 top-16 z-10"
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

                <div className="absolute inset-0 flex items-center justify-center">
                    {[...tools].reverse().map((tool, i) => {
                        const originalIndex = tools.length - 1 - i;
                        return (
                            <motion.div
                                key={tool.title}
                                style={{
                                    scale: cardTransforms[originalIndex].scale,
                                    y: cardTransforms[originalIndex].y,
                                    zIndex: i,
                                }}
                                className="absolute h-[450px] w-full max-w-2xl"
                            >
                                <ToolCard {...tool} />
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    style={{ y: feedbackY, opacity: feedbackOpacity }}
                    className="absolute inset-0 z-40 bg-gray-50 dark:bg-gray-900"
                >
                    <FeedbackWall scrollYProgress={feedbackX} />
                </motion.div>
            </div>
        </section>
    );
};

export default FeatureScroll;
