"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import SurveyModal from '@/components/survey-modal';
import { Bot, FileQuestion, PenLine, Mic, Users, BookOpen, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useScroll, useTransform } from 'framer-motion';

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


const SurveyCTA = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end'],
  });

  const opacity = useTransform(scrollYProgress, [0.1, 0.3, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.1, 0.3, 0.8, 1], ['40px', '0px', '0px', '-40px']);

  return (
    <>
      <section ref={targetRef} className="relative h-[120vh] bg-gray-900">
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
            <motion.div style={{ opacity, y }} className="container mx-auto px-4 text-center relative">
              <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
                  {/* Top-left flow */}
                  <FloatingIcon icon={<Bot className="w-8 h-8 text-white" />} className="top-[10%] left-[15%]" animation="animate-hero-float" delay="0s" gradient="from-orange-500 to-amber-500" />
                  <FloatingIcon icon={<FileQuestion className="w-6 h-6 text-white" />} className="top-[30%] left-[5%]" animation="animate-hero-float-alt" delay="1s" gradient="from-sky-500 to-cyan-500" />
                  
                  {/* Top-right flow */}
                  <FloatingIcon icon={<PenLine className="w-7 h-7 text-white" />} className="top-[15%] right-[10%]" animation="animate-hero-float" delay="0.5s" gradient="from-emerald-500 to-teal-500" />
                  <FloatingIcon icon={<Mic className="w-5 h-5 text-white" />} className="top-[40%] right-[20%]" animation="animate-hero-float-alt" delay="1.5s" gradient="from-purple-500 to-indigo-500" />

                  {/* Bottom-left flow */}
                  <FloatingIcon icon={<Users className="w-7 h-7 text-white" />} className="bottom-[15%] left-[20%]" animation="animate-hero-float-alt" delay="0.2s" gradient="from-primary to-accent" />
                  
                  {/* Bottom-right flow */}
                  <FloatingIcon icon={<Bot className="w-5 h-5 text-white" />} className="bottom-[10%] right-[15%]" animation="animate-hero-float" delay="1.2s" gradient="from-lime-400 to-green-500" />

                  {/* Added icons */}
                  <FloatingIcon icon={<BookOpen className="w-6 h-6 text-white" />} className="bottom-[25%] right-[45%]" animation="animate-hero-float" delay="0.8s" gradient="from-red-500 to-pink-500" />
                  <FloatingIcon icon={<Target className="w-6 h-6 text-white" />} className="top-[20%] left-[48%]" animation="animate-hero-float-alt" delay="0.4s" gradient="from-blue-500 to-indigo-500" />
              </div>

              <div className="relative z-10">
                <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-white">
                  Help Us Build for You
                </h2>
                <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-300">
                  Your feedback is crucial. Take a 1-minute survey to tell us what you need, and we'll build it.
                </p>
                <div className="mt-8">
                  <Button
                    size="lg"
                    variant="default"
                    className="bg-white text-primary hover:bg-white/90 animate-pulse-cta"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Take the Survey
                  </Button>
                </div>
              </div>
            </motion.div>
        </div>
      </section>
      <SurveyModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};

export default SurveyCTA;
