"use client";

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Mic, FileQuestion, PenLine, MoveRight, Newspaper } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

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


const Tools = () => {
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
            description: 'Sharpen your knowledge with quick, adaptive quizzes tailored to your exam and. progress',
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

    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ['start start', 'end start'],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.6, 0.8], [1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.8]);
    const position = useTransform(scrollYProgress, (pos) =>
        pos >= 1 ? 'relative' : 'sticky'
    );
    
    return (
        <section ref={targetRef} className="h-[300vh] bg-gray-50 dark:bg-gray-900/50">
            <motion.div style={{ position, opacity, scale }} className="top-0 flex h-screen flex-col items-center justify-center">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
                            Our Core Tools
                        </h2>
                        <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                            Everything you need to get exam-ready, all in one place.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {tools.map((tool, index) => (
                            <motion.div key={index}>
                                <ToolCard {...tool} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default Tools;
