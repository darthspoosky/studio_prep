import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

const Explore = () => {
  return (
    <section className="relative w-full py-24 sm:py-32 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-background" />
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full filter blur-3xl opacity-50 animate-pulse" />
            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/5 rounded-full filter blur-3xl opacity-50 animate-pulse animation-delay-2000" />
        </div>

        <div className="container mx-auto px-4 z-10 text-center">
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
        </div>
    </section>
  );
};

export default Explore;
