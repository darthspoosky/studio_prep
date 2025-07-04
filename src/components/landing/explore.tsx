"use client";

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

const Explore = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end'],
  });

  const opacity = useTransform(scrollYProgress, [0.1, 0.3, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.1, 0.3, 0.8, 1], ['40px', '0px', '0px', '-40px']);
  
  const handleExploreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={targetRef} className="relative h-[150vh] bg-background">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <motion.div style={{ opacity, y }} className="relative z-10 text-center container mx-auto px-4 flex flex-col items-center">
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="absolute w-[60vw] h-[60vw] bg-primary/5 rounded-full filter blur-3xl opacity-50 animate-pulse" />
            </div>
            <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter">
                <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                    Prep for Success
                </span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
                AI-powered tools designed around you. Ace your exams with mock interviews, daily quizzes, and guided writing practice.
            </p>
            <div className="mt-8 flex flex-col items-center space-y-4">
                <a href="#tools" onClick={handleExploreClick}>
                    <Button size="lg">
                        Explore
                    </Button>
                </a>
                <ArrowDown className="w-5 h-5 animate-bounce text-muted-foreground" />
            </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Explore;
