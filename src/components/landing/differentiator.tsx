"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const Differentiator = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end'],
  });

  const opacity = useTransform(scrollYProgress, [0.1, 0.25, 0.85, 0.95], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.1, 0.25, 0.85, 0.95], ['30px', '0px', '0px', '-30px']);

  return (
    <section
      ref={targetRef}
      className="h-[150vh] bg-background relative"
    >
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <motion.div
            style={{ opacity, y }}
            className="container mx-auto px-4 text-center"
        >
            <h2 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
              <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                Built with your voice. Powered by AI.
              </span>
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              PrepTalk is more than just a tool; it's a dynamic ecosystem. We combine your feedback with cutting-edge AI to create a prep experience that truly evolves with you.
            </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Differentiator;
