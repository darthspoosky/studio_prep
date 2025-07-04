"use client";

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Mic, FileQuestion, PenLine, MoveRight, Newspaper } from 'lucide-react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

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

const AnimatedCard = ({
  tool,
  i,
  progress,
  range,
  targetScale,
}: {
  tool: any;
  i: number;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
}) => {
  // Add the third value to the input range and repeat the targetScale in the output range
  // This "clamps" the animation, ensuring that once a card reaches its target scale, it stops transforming.
  const scale = useTransform(progress, [range[0], range[1], 1], [1, targetScale, targetScale]);
  
  return (
    <motion.div
      style={{
        scale,
        top: `calc(12rem + ${i * 25}px)`,
      }}
      className="sticky flex items-center justify-center h-[calc(100vh_-_12rem)]"
    >
      <div className="relative h-[450px] w-full max-w-2xl">
        <ToolCard {...tool} />
      </div>
    </motion.div>
  );
};


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

    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    return (
        <section ref={containerRef} className="relative bg-gray-50 dark:bg-gray-900/50 h-[350vh]">
             <div className="sticky top-0 h-auto py-16 bg-gray-50 dark:bg-gray-900/50 z-10">
                <div 
                    className="container mx-auto px-4 text-center"
                >
                    <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
                        <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                            Our Core Tools
                        </span>
                    </h2>
                    <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                        Everything you need to get exam-ready, all in one place.
                    </p>
                </div>
            </div>
            
            {tools.map((tool, i) => {
                // The scale of the card in the stack.
                // The card at the back (i=0) is smallest, the one at the front (i=3) is largest.
                // The scaling factor is more subtle now for a cleaner look.
                const targetScale = 1 - (tools.length - 1 - i) * 0.04;
                const rangeStart = i / tools.length;
                const rangeEnd = rangeStart + (1 / tools.length);
                
                return (
                <AnimatedCard
                    key={tool.title}
                    i={i}
                    progress={scrollYProgress}
                    range={[rangeStart, rangeEnd]}
                    targetScale={targetScale}
                    tool={tool}
                />
                );
            })}
        </section>
    );
};

export default Tools;
