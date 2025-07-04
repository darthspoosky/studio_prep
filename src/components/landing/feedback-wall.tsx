import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
];

const FeedbackWall = () => {
  const allTestimonials = [...testimonials, ...testimonials]; // Duplicate for seamless loop

  return (
    <section className="py-20 sm:py-32 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
            From the PrepTalk Community
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
            See what our users are saying about their prep journey with us.
          </p>
        </div>
        <div className="relative">
          <div className="flex animate-scroll hover:pause-animation">
            {allTestimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="mx-4 w-80 md:w-96 flex-shrink-0"
              >
                <CardContent className="pt-6">
                  <p className="mb-4 text-foreground">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    <Avatar>
                      <AvatarImage src={`https://placehold.co/40x40.png`} />
                      <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <p className="font-semibold text-foreground">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.handle}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeedbackWall;
