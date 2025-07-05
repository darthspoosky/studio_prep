"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, Sparkles, Bot, Send, User } from 'lucide-react';
import { analyzeSurvey } from '@/ai/flows/analyze-survey-flow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  examType: z.string().min(1, 'Please select an exam type.'),
  goal: z.string().min(1, 'Please select a goal.'),
  studyTime: z.string().min(1, 'Please select your study time.'),
  frustrations: z.string().min(10, 'Please describe your frustrations in at least 10 characters.'),
  featureRequests: z.string().min(10, 'Please describe your feature requests in at least 10 characters.'),
});

type FormData = z.infer<typeof formSchema>;

const questions = [
  {
    key: 'examType' as const,
    text: 'Welcome to PrepTalk! To start, could you let me know what you\'re studying for?',
    type: 'options' as const,
    options: ['UPSC Civil Services', 'RBI Grade B / SEBI', 'CAT / MBA Entrance', 'Bank PO / Clerk', 'SSC CGL / CHSL', 'Other'],
  },
  {
    key: 'goal' as const,
    text: 'Got it. What’s your main goal for this exam?',
    type: 'options' as const,
    options: ['Aiming for a top rank', 'Just need to qualify', 'Improve specific skills'],
  },
  {
    key: 'studyTime' as const,
    text: 'That\'s a great goal. How much time can you realistically dedicate to studying each day?',
    type: 'options' as const,
    options: ['Less than 2 hours', '2 - 4 hours', 'More than 4 hours'],
  },
  {
    key: 'frustrations' as const,
    text: 'Thanks for sharing. Now, for the important part: what are your biggest frustrations with your current study routine?',
    type: 'textarea' as const,
    placeholder: 'e.g., Covering the vast syllabus, current affairs, writing practice for mains...',
  },
  {
    key: 'featureRequests' as const,
    text: 'And finally, if you could wave a magic wand, what features in a prep app would help you the most?',
    type: 'textarea' as const,
    placeholder: 'e.g., Daily current affairs analysis, mock interview practice, essay feedback...',
  }
];

type ChatMessage = {
  id: number;
  sender: 'bot' | 'user';
  content: React.ReactNode;
};

type SurveyModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const SurveyModal = ({ isOpen, onOpenChange }: SurveyModalProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      examType: '',
      goal: '',
      studyTime: '',
      frustrations: '',
      featureRequests: '',
    },
  });

  const { control, setValue, handleSubmit, watch } = form;
  const currentTextValue = watch(questions[currentQuestionIndex]?.key as keyof FormData, '');


  useEffect(() => {
    if (isOpen) {
      setMessages([{ id: Date.now(), sender: 'bot', content: questions[0].text }]);
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll to the bottom of the chat on new message
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
          setTimeout(() => {
            viewport.scrollTop = viewport.scrollHeight;
          }, 100);
        }
    }
  }, [messages]);


  const addMessage = (sender: 'bot' | 'user', content: React.ReactNode) => {
    setMessages((prev) => [...prev, { id: Date.now(), sender, content }]);
  };
  
  const handleNext = (key: keyof FormData, value: string) => {
    setValue(key, value);
    addMessage('user', value);
    
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setTimeout(() => {
        addMessage('bot', questions[nextIndex].text);
        setCurrentQuestionIndex(nextIndex);
      }, 500);
    } else {
      handleSubmit(onSubmit)();
    }
  };
  
  const handleTextSubmit = () => {
    const key = questions[currentQuestionIndex].key;
    const value = form.getValues(key);

    if (value.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Please provide a bit more detail.',
        description: 'Your response should be at least 10 characters long.',
      });
      return;
    }

    handleNext(key, value);
  };


  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    addMessage('bot', <Loader2 className="mr-2 h-4 w-4 animate-spin" />)

    try {
      const result = await analyzeSurvey(values);
      setAnalysisResult(result.personalizedMessage);
      setShowThankYou(true);
    } catch (error) {
      console.error('Survey submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Oh no! Something went wrong.',
        description: "We couldn't submit your survey. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
      // Remove the loading spinner message
      setMessages(prev => prev.slice(0, prev.length -1));
    }
  };
  
  const handleClose = () => {
    form.reset();
    setCurrentQuestionIndex(0);
    setMessages([]);
    setAnalysisResult(null);
    setShowThankYou(false);
    onOpenChange(false);
  }
  
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
            <DialogTitle className="font-headline text-2xl">Shape Our Tools</DialogTitle>
            <DialogDescription>Your feedback powers the future of PrepTalk.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex items-end gap-2",
                    message.sender === 'user' && "justify-end"
                  )}
                >
                  {message.sender === 'bot' && (
                    <Avatar className="h-8 w-8 self-start">
                      <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs md:max-w-md rounded-2xl p-3 text-sm",
                      message.sender === 'bot'
                        ? "bg-muted rounded-bl-none"
                        : "bg-primary text-primary-foreground rounded-br-none"
                    )}
                  >
                    {message.content}
                  </div>
                   {message.sender === 'user' && (
                    <Avatar className="h-8 w-8 self-start">
                      <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
               {showThankYou && (
                 <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center p-4"
                  >
                     <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                     <h2 className="font-headline text-2xl mb-2">Thank You!</h2>
                     <p className="text-muted-foreground mb-4">Your feedback is making PrepTalk better for everyone.</p>
                     {analysisResult && (
                       <div className="mt-2 p-4 bg-primary/10 rounded-lg text-sm text-foreground w-full">
                         <div className="flex items-start space-x-3">
                           <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                           <p className="italic text-left">{analysisResult}</p>
                         </div>
                       </div>
                     )}
                  </motion.div>
               )}
            </AnimatePresence>
          </div>
        </ScrollArea>
        
        <div className="p-6 pt-2 border-t bg-background">
          <AnimatePresence mode="wait">
            {!showThankYou && (
               <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
              {currentQuestion.type === 'options' && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {currentQuestion.options.map((option) => (
                    <Button
                      key={option}
                      variant="outline"
                      onClick={() => handleNext(currentQuestion.key, option)}
                      disabled={isSubmitting}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}
              {currentQuestion.type === 'textarea' && (
                <div className="flex items-center gap-2">
                  <Textarea
                    placeholder={currentQuestion.placeholder}
                    {...form.register(currentQuestion.key)}
                    rows={1}
                    className="max-h-24"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleTextSubmit();
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <Button size="icon" onClick={handleTextSubmit} disabled={isSubmitting || (currentTextValue?.length || 0) < 10}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              )}
              </motion.div>
            )}

            {showThankYou && (
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center"
                 >
                    <Button onClick={handleClose}>Close</Button>
                 </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SurveyModal;
