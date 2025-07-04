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

  return (
    <section ref={targetRef} className="relative h-[150vh] bg-background">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <motion.div style={{ opacity, y }} className="relative z-10 text-center container mx-auto px-4">
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="absolute w-[60vw] h-[60vw] bg-primary/5 rounded-full filter blur-3xl opacity-50 animate-pulse" />
            </div>
            <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter">
                Prep for Success
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
                AI-powered tools designed around you. Ace your exams with mock interviews, daily quizzes, and guided writing practice.
            </p>
            <div className="mt-8">
                <Button size="lg" className="group">
                    Explore
                    <ArrowDown className="w-5 h-5 ml-2 transition-transform group-hover:translate-y-1 animate-bounce" />
                </Button>
            </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Explore;
