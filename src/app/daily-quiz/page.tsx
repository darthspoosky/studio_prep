'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Clock, Globe, Replace, TrendingUp, CalendarDays, BrainCog, BookOpen, HelpCircle, Shuffle, Star } from 'lucide-react';

const topics = [
  {
    title: 'Previous Year',
    description: 'Practice with past papers to understand exam patterns.',
    icon: <Clock />,
    color: 'blue',
    href: '/daily-quiz/past-year'
  },
  {
    title: 'GS Paper 1',
    description: 'Covers History, Geography, Art and Culture.',
    icon: <Globe />,
    color: 'green',
    href: '#'
  },
  {
    title: 'GS Paper 2',
    description: 'Focus on Polity, Governance, Social Justice, and IR.',
    icon: <Replace />,
    color: 'yellow',
    href: '#'
  },
  {
    title: 'GS Paper 3',
    description: 'Economy, S&T, Environment, and Disaster Management.',
    icon: <TrendingUp />,
    color: 'red',
    href: '#'
  },
  {
    title: 'Current Affairs',
    description: 'Stay updated with the latest national and international news.',
    icon: <CalendarDays />,
    color: 'purple',
    href: '#'
  },
  {
    title: 'CSAT',
    description: 'Sharpen your aptitude and reasoning skills.',
    icon: <BrainCog />,
    color: 'indigo',
    href: '#'
  },
  {
    title: 'NCERT Based',
    description: 'Build a strong foundation with core concept questions.',
    icon: <BookOpen />,
    color: 'pink',
    href: '#'
  },
  {
    title: 'Mock Tests',
    description: 'Simulate real exam conditions to test your preparation.',
    icon: <HelpCircle />,
    color: 'teal',
    href: '#'
  },
  {
    title: 'Mixed Bag',
    description: 'Challenge yourself with a random mix of questions from all topics.',
    icon: <Shuffle />,
    color: 'orange',
    span: 2,
    href: '#'
  },
  {
    title: 'High-Yield Topics',
    description: 'Focus on the most frequently asked questions and important areas.',
    icon: <Star />,
    color: 'cyan',
    span: 2,
    href: '#'
  },
];

const colorVariants = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/50',
    text: 'text-blue-600 dark:text-blue-300',
    button: 'bg-blue-500 hover:bg-blue-600',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/50',
    text: 'text-green-600 dark:text-green-300',
    button: 'bg-green-500 hover:bg-green-600',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/50',
    text: 'text-yellow-600 dark:text-yellow-300',
    button: 'bg-yellow-500 hover:bg-yellow-600 text-yellow-950',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/50',
    text: 'text-red-600 dark:text-red-300',
    button: 'bg-red-500 hover:bg-red-600',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/50',
    text: 'text-purple-600 dark:text-purple-300',
    button: 'bg-purple-500 hover:bg-purple-600',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/50',
    text: 'text-indigo-600 dark:text-indigo-300',
    button: 'bg-indigo-500 hover:bg-indigo-600',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/50',
    text: 'text-pink-600 dark:text-pink-300',
    button: 'bg-pink-500 hover:bg-pink-600',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/50',
    text: 'text-teal-600 dark:text-teal-300',
    button: 'bg-teal-500 hover:bg-teal-600',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/50',
    text: 'text-orange-600 dark:text-orange-300',
    button: 'bg-orange-500 hover:bg-orange-600',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/50',
    text: 'text-cyan-600 dark:text-cyan-300',
    button: 'bg-cyan-500 hover:bg-cyan-600',
  },
};

const TopicCard = ({ topic }: { topic: (typeof topics)[0] }) => {
  const variants = colorVariants[topic.color as keyof typeof colorVariants];
  return (
    <Card className={`flex flex-col text-center items-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${topic.span === 2 ? 'lg:col-span-2' : ''}`}>
      <CardHeader className="items-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${variants.bg} ${variants.text}`}>
          {React.cloneElement(topic.icon as React.ReactElement, { className: 'w-8 h-8' })}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardTitle>{topic.title}</CardTitle>
        <CardDescription className="mt-2">{topic.description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button asChild className={`w-full ${variants.button}`}>
          <Link href={topic.href}>Start Practicing</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function QuestionBankPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="text-center mb-16">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tighter">
            Select a Topic to Start
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            Choose a category below to begin your personalized practice session. Each topic is designed to help you master key areas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topics.map((topic) => (
            <TopicCard key={topic.title} topic={topic} />
          ))}
        </div>
      </main>
    </div>
  );
}
