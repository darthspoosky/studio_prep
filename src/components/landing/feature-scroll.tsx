"use client";

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Mic, FileQuestion, PenLine, MoveRight, Newspaper } from 'lucide-react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

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

const testimonials = [
  {
    quote: "PrepTalk's AI bot is a game-changer for my interview practice. The feedback is so insightful!",
    name: 'Alex Johnson',
    handle: 'Software Engineer',
    avatar: 'AJ',
  },
  {
    quote: 'The daily quizzes are the perfect way to start my study sessions. Short, sharp, and relevant.',
    name: 'Maria Garcia',
    handle: 'Pre-Med Student',
    avatar: 'MG',
  },
  {
    quote: "I finally feel confident about my writing skills for the GRE. The prompts are fantastic.",
    name: 'David Chen',
    handle: 'Graduate Applicant',
    avatar: 'DC',
  },
  {
    quote: "The community feedback feature is brilliant. It's like having thousands of study partners.",
    name: 'Samantha Lee',
    handle: 'SAT Taker',
    avatar: 'SL',
  },
  {
    quote: 'An indispensable tool. The mock interviews helped me land my dream internship.',
    name: 'Ben Carter',
    handle: 'MBA Candidate',
    avatar: 'BC',
  },
  {
    quote: 'The AI-powered writing practice has drastically improved my essays. A must-have!',
    name: 'Priya Patel',
    handle: 'Law Student',
    avatar: 'PP',
  },
];

const duplicatedTestimonials = [...testimonials, ...testimonials];

const MobileView = () => {
    return (
        <section id="features-mobile" className="bg-gray-50 dark:bg-gray-900 py-24 sm:py-32">
            <div className="container mx-auto px-4">
                {/* Core Tools Section */}
                <div className="text-center">
                    <h2 className="font-headline text-3xl font-bold tracking-tight">
                        <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                            Our Core Tools
                        </span>
                    </h2>
                    <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                        Everything you need to get exam-ready, all in one place.
                    </p>
                </div>

                <div className="mt-12">
                     <Carousel
                        opts={{
                            align: "start",
                        }}
                        className="w-full max-w-xs mx-auto"
                    >
                        <CarouselContent>
                            {tools.map((tool, index) => (
                                <CarouselItem key={index}>
                                    <div className="p-1 h-[450px]">
                                        <ToolCard {...tool} />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden sm:inline-flex" />
                        <CarouselNext className="hidden sm:inline-flex" />
                    </Carousel>
                </div>

                {/* Community Feedback Section */}
                <div className="text-center mt-24">
                     <h2 className="font-headline text-3xl font-bold tracking-tight">
                        <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                            From the PrepTalk Community
                        </span>
                    </h2>
                    <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                        See what our users are saying about their prep journey with us.
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="w-full shrink-0 glassmorphic">
                            <CardContent className="pt-6 flex flex-col h-full">
                                <p className="mb-4 text-foreground flex-grow">"{testimonial.quote}"</p>
                                <div className="flex items-center mt-auto">
                                    <Avatar>
                                        <AvatarImage data-ai-hint="person" src={`https://placehold.co/40x40.png`} />
                                        <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 text-left">
                                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.handle}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

// --- Desktop Components ---

// Animation ranges
const showcaseEnd = 0.55;
const stackingStart = 0.55;
const stackingEnd = 0.8;

const AnimatedCard = ({
  i,
  tool,
  scrollYProgress,
}: {
  i: number;
  tool: (typeof tools)[0];
  scrollYProgress: MotionValue<number>;
}) => {
  const showcaseDurationPerCard = (showcaseEnd - 0.05) / tools.length;
  const showcaseStartTime = 0.05 + i * showcaseDurationPerCard;
  const showcaseEndTime = showcaseStartTime + showcaseDurationPerCard;
  
  const isLastCard = i === tools.length - 1;

  const lastCardOpacity = useTransform(
    scrollYProgress,
    [
      showcaseStartTime,
      showcaseStartTime + 0.02,
      stackingEnd
    ],
    [0, 1, 1]
  );
  
  const showcaseOpacity = useTransform(
    scrollYProgress,
    [
      showcaseStartTime,
      showcaseStartTime + 0.02,
      showcaseEndTime - 0.02,
      showcaseEndTime,
    ],
    [0, 1, 1, 0]
  );
  
  const stackingOpacity = useTransform(
    scrollYProgress,
    [stackingStart, stackingStart + 0.05],
    [0, 1]
  );

  const opacity = useTransform(scrollYProgress, (p) => {
    if (isLastCard) {
      return lastCardOpacity.get();
    }
    if (p < stackingStart) {
      return showcaseOpacity.get();
    }
    return stackingOpacity.get();
  });

  // --- Y Position (translateY for performance) ---
  const showcaseY = useTransform(scrollYProgress, [showcaseStartTime, showcaseEndTime], ["4rem", "0rem"]);
  
  const finalStackY = (i) * 30;

  const stackingY = useTransform(
    scrollYProgress,
    [stackingStart, stackingEnd],
    [0, finalStackY]
  );

  const y = useTransform(scrollYProgress, (p) => {
    if (p < stackingStart) return showcaseY.get();
    return stackingY.get();
  });

  // --- Scale ---
  const showcaseScale = useTransform(scrollYProgress, [showcaseStartTime, showcaseEndTime], [0.95, 1]);
  
  const finalStackScale = 1 - (tools.length - 1 - i) * 0.05;

  const stackingScale = useTransform(
    scrollYProgress,
    [stackingStart, stackingEnd],
    [1, finalStackScale]
  );

  const scale = useTransform(scrollYProgress, (p) => {
    if (p < stackingStart) return showcaseScale.get();
    return stackingScale.get();
  });

  return (
    <motion.div
      style={{
        opacity,
        scale,
        translateY: y,
        zIndex: tools.length - i,
      }}
      className="absolute h-[450px] w-full max-w-2xl"
    >
      <ToolCard {...tool} />
    </motion.div>
  );
};

const FeedbackWall = ({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) => {
    return (
        <div className="relative h-screen flex flex-col justify-center overflow-hidden">
            <div className="container mx-auto px-4 text-center mb-16">
                <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
                    <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                        From the PrepTalk Community
                    </span>
                </h2>
                <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                    See what our users are saying about their prep journey with us.
                </p>
            </div>

            <motion.div style={{ x: scrollYProgress }} className="flex gap-8 pl-8">
                {duplicatedTestimonials.map((testimonial, index) => (
                    <Card key={index} className="w-[400px] lg:w-[450px] shrink-0 glassmorphic">
                        <CardContent className="pt-6 flex flex-col h-full">
                            <p className="mb-4 text-foreground flex-grow text-base md:text-lg">"{testimonial.quote}"</p>
                            <div className="flex items-center mt-auto">
                                <Avatar>
                                    <AvatarImage data-ai-hint="person" src={`https://placehold.co/40x40.png`} />
                                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 text-left">
                                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                                    <p className="text-sm text-muted-foreground">{testimonial.handle}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>
        </div>
    );
};


const DesktopView = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    const titleOpacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);
    const titleY = useTransform(scrollYProgress, [0, 0.05], ['20px', '0px']);
    
    const feedbackStart = 0.8;

    const feedbackOpacity = useTransform(scrollYProgress, [feedbackStart - 0.05, feedbackStart], [0, 1]);
    const feedbackY = useTransform(scrollYProgress, [feedbackStart, 1.0], ['50vh', '0vh']);
    const feedbackX = useTransform(scrollYProgress, [feedbackStart, 1.0], ['0%', '-50%']);

    return (
        <section id="features" ref={containerRef} className="relative bg-gray-50 dark:bg-gray-900 h-[600vh]">
            <div className="sticky top-0 h-screen overflow-hidden">
                <motion.div 
                    style={{ opacity: titleOpacity, y: titleY }}
                    className="absolute inset-x-0 top-16 z-30"
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
                    {tools.map((tool, i) => (
                        <AnimatedCard
                            key={tool.title}
                            i={i}
                            tool={tool}
                            scrollYProgress={scrollYProgress}
                        />
                    ))}
                </div>

                <motion.div
                    style={{ y: feedbackY, opacity: feedbackOpacity, zIndex: 50 }}
                    className="absolute inset-0 bg-gray-50 dark:bg-gray-900"
                >
                    <FeedbackWall scrollYProgress={feedbackX} />
                </motion.div>
            </div>
        </section>
    );
};

const FeatureScroll = () => {
    const isMobile = useIsMobile();
    
    // Avoid rendering on the server or during hydration mismatch
    if (isMobile === undefined) {
        return null; 
    }

    return isMobile ? <MobileView /> : <DesktopView />;
};

export default FeatureScroll;
