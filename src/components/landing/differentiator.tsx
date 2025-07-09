"use client";

import React from 'react';

const Differentiator = () => {
  return (
    <section
      className="bg-background relative py-24 sm:py-32"
    >
      <div className="container mx-auto px-4 text-center">
            <h2 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
              <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                Built with your voice. Powered by AI.
              </span>
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              PrepTalk is more than just a tool; it's a dynamic ecosystem. We combine your feedback with cutting-edge AI to create a prep experience that truly evolves with you.
            </p>
      </div>
    </section>
  );
};

export default Differentiator;
