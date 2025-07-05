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

const ideas = [
  {
    idea: "An AI that creates a personalized study schedule based on my weak areas would be amazing.",
    author: 'Priya S.',
    role: 'Beta Tester',
    avatar: 'PS',
    glowColor: 'hsl(var(--primary))',
  },
  {
    idea: "What if we could upload our own practice essays and get instant feedback on structure and grammar?",
    author: 'Ben C.',
    role: 'Early Adopter',
    avatar: 'BC',
    glowColor: 'hsl(var(--accent))',
  },
  {
    idea: "I'd love a 'cram session' mode that drills you on the topics you struggle with most, right before an exam.",
    author: 'Maria G.',
    role: 'Student Voice',
    avatar: 'MG',
    glowColor: 'hsl(200 96% 87%)',
  },
  {
    idea: "Could the mock interviewer simulate different personality types, like a friendly or a very strict one?",
    author: 'Alex J.',
    role: 'Power User',
    avatar: 'AJ',
    glowColor: 'hsl(300 96% 87%)',
  },
  {
    idea: "Gamify the daily quizzes! Leaderboards, points, and streaks would make studying much more fun.",
    author: 'Samantha L.',
    role: 'Beta Tester',
    avatar: 'SL',
    glowColor: 'hsl(150 96% 87%)',
  },
  {
    idea: "A feature to connect with other students studying for the same exam would be great for motivation.",
    author: 'David C.',
    role: 'Community Member',
    avatar: 'DC',
    glowColor: 'hsl(50 96% 87%)',
  },
];

const duplicatedIdeas = [...ideas, ...ideas];

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

                {/* Idea Board Section */}
                <div className="text-center mt-24">
                     <h2 className="font-headline text-3xl font-bold tracking-tight">
                        <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                            Our Idea Board
                        </span>
                    </h2>
                    <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                        Shaped by the community, built for your success. Here are some of the ideas that inspire our next features.
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-8">
                    {ideas.map((item, index) => (
                        <Card key={index} className="w-full shrink-0 glassmorphic">
                            <CardContent className="pt-6 flex flex-col h-full">
                                <p className="mb-4 text-foreground flex-grow">"{item.idea}"</p>
                                <div className="flex items-center mt-auto">
                                    <Avatar>
                                        <AvatarImage data-ai-hint="person" src={`https://placehold.co/40x40.png`} />
                                        <AvatarFallback>{item.avatar}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 text-left">
                                        <p className="font-semibold text-foreground">{item.author}</p>
                                        <p className="text-sm text-muted-foreground">{item.role}</p>
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

const IdeaCard = ({ idea, author, role, avatar, glowColor }: (typeof ideas)[0]) => (
    <motion.div
        whileHover={{
            scale: 1.05,
            y: -8,
            boxShadow: `0 0 30px 5px ${glowColor}`,
            zIndex: 50
        }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="relative w-[350px] lg:w-[400px] shrink-0"
    >
        <Card className="w-full h-full glassmorphic">
            <CardContent className="pt-6 flex flex-col h-full">
                <p className="mb-4 text-foreground flex-grow text-base md:text-lg">"{idea}"</p>
                <div className="flex items-center mt-auto">
                    <Avatar>
                        <AvatarImage data-ai-hint="person" src={`https://placehold.co/40x40.png`} />
                        <AvatarFallback>{avatar}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 text-left">
                        <p className="font-semibold text-foreground">{author}</p>
                        <p className="text-sm text-muted-foreground">{role}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    </motion.div>
);


const IdeaBoard = () => {
    return (
        <div className="relative h-screen flex flex-col justify-center overflow-hidden">
            <div className="container mx-auto px-4 text-center mb-16">
                <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
                    <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                        Our Idea Board
                    </span>
                </h2>
                <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Shaped by the community, built for your success. Here are some of the ideas that inspire our next features.
                </p>
            </div>
            
            <div className="flex flex-col gap-8 -rotate-3">
                <motion.div 
                    className="flex gap-8"
                    animate={{ x: ['0%', '-100%'] }}
                    transition={{ ease: 'linear', duration: 40, repeat: Infinity }}
                >
                    {duplicatedIdeas.map((item, index) => (
                        <IdeaCard key={`row1-${index}`} {...item} />
                    ))}
                </motion.div>
                <motion.div 
                    className="flex gap-8"
                    animate={{ x: ['-100%', '0%'] }}
                    transition={{ ease: 'linear', duration: 40, repeat: Infinity }}
                >
                    {duplicatedIdeas.map((item, index) => (
                        <IdeaCard key={`row2-${index}`} {...item} />
                    ))}
                </motion.div>
            </div>
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
                    <IdeaBoard />
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
