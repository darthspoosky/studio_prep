import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, FileQuestion, PenLine, MoveRight } from 'lucide-react';

const FloatingIcon = ({ icon, className, delay }: { icon: React.ReactNode, className?: string, delay?: string }) => (
    <div className={`absolute rounded-full p-3 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg animate-float ${className}`} style={{ animationDelay: delay }}>
        {icon}
    </div>
);

const Hero = () => {
  return (
    <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-background" />
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full filter blur-3xl opacity-50 animate-pulse" />
            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/20 rounded-full filter blur-3xl opacity-50 animate-pulse animation-delay-2000" />
        </div>

        <div className="container mx-auto px-4 z-10 text-center">
            <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter">
                Prep for Success
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
                AI-powered tools designed around you. Ace your exams with mock interviews, daily quizzes, and guided writing practice.
            </p>
            <div className="mt-8">
                <Button size="lg" className="group">
                    Get Started Free
                    <MoveRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
            </div>
        </div>

        <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
            <FloatingIcon icon={<Bot className="w-8 h-8 text-white" />} className="top-[15%] left-[10%]" delay="0s" />
            <FloatingIcon icon={<FileQuestion className="w-6 h-6 text-white" />} className="top-[25%] right-[15%]" delay="1s" />
            <FloatingIcon icon={<PenLine className="w-7 h-7 text-white" />} className="bottom-[20%] left-[20%]" delay="2s" />
            <FloatingIcon icon={<Bot className="w-5 h-5 text-white" />} className="bottom-[15%] right-[25%]" delay="0.5s" />
        </div>
    </section>
  );
};

export default Hero;
