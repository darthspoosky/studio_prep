import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, FileQuestion, PenLine, MoveRight, Mic, Users } from 'lucide-react';

const FloatingIcon = ({ icon, className, animation, delay }: { icon: React.ReactNode, className?: string, animation?: string, delay?: string }) => (
    <div 
      className={`absolute rounded-full p-3 bg-white/20 dark:bg-white/10 backdrop-blur-lg border border-white/30 dark:border-white/20 shadow-xl ${animation} ${className}`} 
      style={{ animationDelay: delay }}
    >
        {icon}
    </div>
);

const Hero = () => {
  return (
    <section className="relative w-full h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-background" />
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-pulse" />
            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/10 rounded-full filter blur-3xl opacity-50 animate-pulse animation-delay-2000" />
        </div>

        <div className="container mx-auto px-4 z-10 text-center">
            <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter animate-hero-glow">
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
            {/* Top-left flow */}
            <FloatingIcon icon={<Bot className="w-8 h-8 text-white" />} className="top-[10%] left-[15%]" animation="animate-hero-float" delay="0s" />
            <FloatingIcon icon={<FileQuestion className="w-6 h-6 text-white" />} className="top-[30%] left-[5%]" animation="animate-hero-float-alt" delay="1s" />
            
            {/* Top-right flow */}
            <FloatingIcon icon={<PenLine className="w-7 h-7 text-white" />} className="top-[15%] right-[10%]" animation="animate-hero-float" delay="0.5s" />
            <FloatingIcon icon={<Mic className="w-5 h-5 text-white" />} className="top-[40%] right-[20%]" animation="animate-hero-float-alt" delay="1.5s" />

            {/* Bottom-left flow */}
            <FloatingIcon icon={<Users className="w-7 h-7 text-white" />} className="bottom-[15%] left-[20%]" animation="animate-hero-float-alt" delay="0.2s" />
            
            {/* Bottom-right flow */}
            <FloatingIcon icon={<Bot className="w-5 h-5 text-white" />} className="bottom-[10%] right-[15%]" animation="animate-hero-float" delay="1.2s" />
        </div>
    </section>
  );
};

export default Hero;
