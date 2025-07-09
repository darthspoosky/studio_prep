import React from 'react';
import { Bot, FileQuestion, PenLine, Mic, Users, BookOpen, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const FloatingIcon = ({ icon, className, animation, delay, gradient }: { icon: React.ReactNode, className?: string, animation?: string, delay?: string, gradient?: string }) => (
    <div 
      className={cn(
          'absolute rounded-full p-3 backdrop-blur-lg border border-white/30 dark:border-white/20 shadow-xl',
          animation,
          gradient ? `bg-gradient-to-br ${gradient}` : 'bg-white/20 dark:bg-white/10',
          className
        )}
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
            <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
              Ace your exams and interviews with <br className="hidden md:block" />
              <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                personalized, AI-powered, practice.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              We combine cutting-edge AI with community feedback to create a prep experience that truly adapts to you.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg">
                    <Link href="/login">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-background/50">
                    <a href="#tools">Explore Tools</a>
                </Button>
            </div>
        </div>
        
        <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
            {/* Top-left flow */}
            <FloatingIcon icon={<Bot className="w-8 h-8 text-white" />} className="top-[10%] left-[15%]" animation="animate-hero-float" delay="0s" gradient="from-orange-500 to-amber-500" />
            <FloatingIcon icon={<FileQuestion className="w-6 h-6 text-white" />} className="top-[30%] left-[5%]" animation="animate-hero-float-alt" delay="1s" gradient="from-sky-500 to-cyan-500" />
            
            {/* Top-right flow */}
            <FloatingIcon icon={<PenLine className="w-7 h-7 text-white" />} className="top-[15%] right-[10%]" animation="animate-hero-float" delay="0.5s" gradient="from-emerald-500 to-teal-500" />

            {/* Bottom-left flow */}
            <FloatingIcon icon={<Users className="w-7 h-7 text-white" />} className="bottom-[15%] left-[20%]" animation="animate-hero-float-alt" delay="0.2s" gradient="from-primary to-accent" />
            
            {/* Bottom-right flow */}
            <FloatingIcon icon={<Bot className="w-5 h-5 text-white" />} className="bottom-[10%] right-[15%]" animation="animate-hero-float" delay="1.2s" gradient="from-lime-400 to-green-500" />

            {/* Center icons */}
            <FloatingIcon icon={<BookOpen className="w-6 h-6 text-white" />} className="bottom-[25%] right-[45%]" animation="animate-hero-float" delay="0.8s" gradient="from-red-500 to-pink-500" />
            <FloatingIcon icon={<Target className="w-6 h-6 text-white" />} className="top-[20%] left-[48%]" animation="animate-hero-float-alt" delay="0.4s" gradient="from-blue-500 to-indigo-500" />
            <FloatingIcon icon={<Mic className="w-5 h-5 text-white" />} className="bottom-[10%] left-[48%]" animation="animate-hero-float-alt" delay="1.5s" gradient="from-purple-500 to-indigo-500" />
        </div>
    </section>
  );
};

export default Hero;
