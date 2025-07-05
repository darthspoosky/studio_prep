"use client";

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { analyzeSurvey } from '@/ai/flows/analyze-survey-flow';

const formSchema = z.object({
  examType: z.string().min(1, 'Please select an exam type.'),
  frustrations: z.string().min(10, 'Please describe your frustrations in at least 10 characters.'),
  featureRequests: z.string().min(10, 'Please describe your feature requests in at least 10 characters.'),
});

type SurveyModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const SurveyModal = ({ isOpen, onOpenChange }: SurveyModalProps) => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      examType: '',
      frustrations: '',
      featureRequests: '',
    },
  });

  const handleNext = async () => {
    let isValid = false;
    if (step === 0) {
      isValid = await form.trigger('examType');
    } else if (step === 1) {
      isValid = await form.trigger('frustrations');
    }
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await analyzeSurvey(values);
      setAnalysisResult(result.personalizedMessage);
      setStep((prev) => prev + 1); // Go to thank you step
    } catch (error) {
      console.error('Survey submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Oh no! Something went wrong.',
        description: "We couldn't submit your survey. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    form.reset();
    setStep(0);
    setAnalysisResult(null);
    onOpenChange(false);
  }

  const steps = [
    {
      title: 'What are you studying for?',
      description: 'Let us know which exam is on your mind.',
      field: 'examType',
      content: (
        <FormField
          control={form.control}
          name="examType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  {['SAT/ACT', 'GRE/GMAT', 'MCAT', 'Professional Certification', 'Other'].map((exam) => (
                    <FormItem key={exam} className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={exam} />
                      </FormControl>
                      <FormLabel className="font-normal">{exam}</FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
    },
    {
      title: 'What are your biggest frustrations?',
      description: 'What are the most challenging parts of your current study routine?',
      field: 'frustrations',
      content: (
        <FormField
          control={form.control}
          name="frustrations"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea placeholder="e.g., Finding good practice questions, staying motivated..." {...field} rows={5}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
    },
    {
      title: 'What features would help you most?',
      description: 'If you could have any tool to help you study, what would it be?',
      field: 'featureRequests',
      content: (
        <FormField
          control={form.control}
          name="featureRequests"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea placeholder="e.g., A tool to automatically create flashcards, a study schedule planner..." {...field} rows={5}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
    },
    {
      title: 'Thank You!',
      description: "Your feedback is making PrepTalk better for everyone.",
      content: (
          <div className="text-left flex flex-col justify-center min-h-[12rem]">
            <div className="flex items-center justify-center text-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <p className="text-center font-semibold text-foreground mb-4">We've received your feedback!</p>
            {analysisResult ? (
              <div className="mt-2 p-4 bg-primary/10 rounded-lg text-sm text-foreground">
                 <div className="flex items-start space-x-3">
                    <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <p className="italic">{analysisResult}</p>
                 </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Your input is incredibly valuable as we build.</p>
            )}
          </div>
      ),
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="font-headline">{steps[step].title}</DialogTitle>
              <DialogDescription>{steps[step].description}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {steps[step].content}
            </div>
            <DialogFooter>
              {step > 0 && step < steps.length - 1 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
                  Back
                </Button>
              )}
              {step < steps.length - 2 && (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              )}
              {step === steps.length - 2 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Feedback
                </Button>
              )}
              {step === steps.length - 1 && (
                <Button type="button" onClick={handleClose}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default SurveyModal;
