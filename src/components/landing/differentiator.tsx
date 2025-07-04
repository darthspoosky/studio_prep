"use client";

import React from 'react';
import { motion } from 'framer-motion';

const Differentiator = () => {
  return (
    <section
      className="py-20 sm:py-32 bg-background relative z-10 mt-[-200vh]"
    >
      <div className="container mx-auto px-4 text-center">
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <h2 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
              Ace your exams and interviews with <br className="hidden md:block" />
              <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                personalized, AI-powered, practice.
              </span>
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              We combine cutting-edge AI with community feedback to create a prep experience that truly adapts to you.
            </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Differentiator;
