'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, ArrowRight } from 'lucide-react';
import { type HistoryEntry } from '@/services/historyService';

/**
 * Interface for HistoryCard props
 */
export interface HistoryCardProps {
  /** History entry data to display */
  entry: HistoryEntry;
}

/**
 * HistoryCard component displays a single history entry with timestamp and content
 * Uses modern glassmorphic design for the PrepTalk dashboard
 */
export const HistoryCard = ({ entry }: HistoryCardProps) => {
  const date = new Date(entry.timestamp.seconds * 1000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  
  // Format time for better readability
  const time = new Date(entry.timestamp.seconds * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Determine the activity type for proper icon display
  const getActivityTypeStyles = () => {
    // This could be expanded to handle different activity types
    return 'from-primary/30 to-primary/5';
  };
  
  return (
    <Card className="relative overflow-hidden backdrop-blur-md bg-background/30 border border-muted/20 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group flex flex-col">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getActivityTypeStyles()}`}></div>
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex-shrink-0 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors duration-300">
                <Newspaper className="w-4 h-4 text-primary"/>
            </div>
            <div>
                <CardTitle className="text-base font-semibold tracking-tight">Newspaper Analysis</CardTitle>
                <CardDescription className="text-xs font-medium opacity-70 flex gap-2 items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary/50"></span>
                  <span>{date} • {time}</span>
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground/70 line-clamp-3">
          {entry.analysis.summary || 'No summary available for this analysis.'}
        </p>
      </CardContent>
      
      <CardFooter className="pt-4">
        <Button 
          asChild 
          variant="ghost" 
          size="sm"
          className="text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors p-0 h-auto"
        >
          <Link href={`/history/${entry.id}`} className="flex items-center gap-1 py-1">
            View Details
            <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HistoryCard;
