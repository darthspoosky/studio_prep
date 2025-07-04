"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import SurveyModal from '@/components/survey-modal';

const SurveyCTA = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section id="survey" className="relative bg-gray-900 py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-gray-900 to-gray-900"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-white">
            Help Us Build for You
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300">
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
      </section>
      <SurveyModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};

export default SurveyCTA;
