"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import SurveyModal from '@/components/survey-modal';

const SurveyCTA = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="py-20 sm:py-32 bg-gray-900 overflow-hidden">
      <div className="container mx-auto px-4 text-center relative">
        <div 
          className="absolute -inset-24 -top-10 bg-gradient-to-br from-primary/20 via-accent/20 to-pink-500/20 rounded-full blur-3xl opacity-50"
        />
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
      </div>
      <SurveyModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </section>
  );
};

export default SurveyCTA;
