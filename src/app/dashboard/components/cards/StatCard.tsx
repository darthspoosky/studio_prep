'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Interface for StatCard props
 */
export interface StatCardProps {
  /** Icon to display in the card */
  icon: React.ReactNode;
  /** Title text for the stat */
  title: string;
  /** Value text to display prominently */
  value: string | number;
  /** Optional suffix to show after the value (like %, pts, etc) */
  suffix?: string;
  /** Background color gradient for the card indicator */
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
  /** Optional trend indicator */
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
}

/**
 * StatCard component displays a single statistic with an icon, title and value
 * Used for displaying key metrics on the dashboard with modern glassmorphic styling
 */
export const StatCard = ({ 
  icon, 
  title, 
  value, 
  color = 'primary',
  trend 
}: StatCardProps) => {
  // Map color names to actual gradient classes
  const colorMap = {
    primary: 'from-primary/20 to-primary/5',
    secondary: 'from-secondary/20 to-secondary/5',
    accent: 'from-accent/20 to-accent/5',
    success: 'from-emerald-500/20 to-emerald-500/5',
    warning: 'from-amber-500/20 to-amber-500/5',
    danger: 'from-rose-500/20 to-rose-500/5'
  };
  
  // Get trend indicator styles
  const getTrendStyles = () => {
    if (!trend) return '';
    
    if (trend.direction === 'up') {
      return 'text-emerald-500';
    } else if (trend.direction === 'down') {
      return 'text-rose-500';
    } 
    return 'text-slate-400';
  };
  
  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.direction === 'up') {
      return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5 5 5M7 17l5-5 5 5" />
      </svg>;
    } else if (trend.direction === 'down') {
      return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 11l-5 5-5-5M17 5l-5 5-5-5" />
      </svg>;
    }
    return null;
  };

  return (
    <Card className={`overflow-hidden backdrop-blur-md bg-background/30 border border-muted/20 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group`}>
      <div className={`absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b ${colorMap[color]}`}></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground/80">{title}</CardTitle>
        <div className="p-2 rounded-full bg-background/50 border border-muted/10 text-foreground/80 group-hover:bg-background/70 transition-colors duration-300">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {trend && (
            <div className={`flex items-center space-x-1 text-xs font-medium ${getTrendStyles()}`}>
              {getTrendIcon()}
              <span>{`${trend.value}%`}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
