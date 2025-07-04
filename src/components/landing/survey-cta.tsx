"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import SurveyModal from '@/components/survey-modal';

const SurveyCTA = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
          Help Us Build for You
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
          Your feedback is crucial. Take a 1-minute survey to tell us what you need, and we'll build it.
        </p>
        <div className="mt-8">
          <Button
            size="lg"
            className="animate-pulse-cta"
            onClick={() => setIsModalOpen(true)}
          >
            Take the Survey
          </Button>
        </div>
      </div>
      <SurveyModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </section>
  );
};

export default SurveyCTA;
