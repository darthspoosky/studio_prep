
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  suffix?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  error?: Error | null;
  onClick?: () => void;
  className?: string;
}

const colorMap = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary-foreground',
  accent: 'bg-accent/10 text-accent-foreground',
  success: 'bg-green-500/10 text-green-500',
  warning: 'bg-yellow-500/10 text-yellow-500',
  danger: 'bg-red-500/10 text-red-500',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  icon,
  value,
  suffix,
  trend,
  color = 'primary',
  loading = false,
  error = null,
  onClick,
  className
}) => {
  const isMobile = useIsMobile();
  
  if (loading) {
    return (
      <div className={cn("p-5", className)}>
        <Skeleton className="h-8 w-8 rounded-lg mb-4" />
        <Skeleton className="h-7 w-20 mb-1" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={cn("p-5 flex flex-col justify-between h-full", className)}>
        <div>
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Failed to load</span>
          </div>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClick} className="mt-2 self-start">
          Retry
        </Button>
      </div>
    );
  }
  
  const getTrendStyles = () => {
    if (!trend) return '';
    if (trend.direction === 'up') return 'text-green-600';
    if (trend.direction === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') return <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4" />;
    if (trend.direction === 'down') return <TrendingDown className="h-3 w-3 lg:h-4 lg:w-4" />;
    return <Minus className="h-3 w-3 lg:h-4 lg:w-4" />;
  };

  return (
    <div 
      className={cn(
        "p-5 h-full",
        onClick && "cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : "region"}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={onClick ? `${title} - ${value}${suffix || ''}` : undefined}
      aria-describedby={onClick ? undefined : `stat-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div 
          className={cn(
            "p-2.5 rounded-lg",
            colorMap[color] || colorMap.primary
          )}
          aria-hidden="true"
        >
          {React.cloneElement(icon as React.ReactElement, {
            className: cn("h-5 w-5 lg:h-6 lg:w-6", (icon as React.ReactElement).props.className),
            'aria-hidden': 'true'
          })}
        </div>
        
        {trend && (
          <div 
            className={cn(
              "flex items-center gap-1 text-xs lg:text-sm font-medium",
              getTrendStyles()
            )}
            aria-label={`Trend: ${trend.direction === 'up' ? 'increasing' : trend.direction === 'down' ? 'decreasing' : 'no change'} by ${Math.abs(trend.value)} percent`}
          >
            {getTrendIcon()}
            <span aria-hidden="true">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      
      <div>
        <div className="flex items-baseline gap-1">
          <span className={cn(
            "font-bold",
            isMobile ? "text-xl" : "text-2xl"
          )}>
            {value}
          </span>
          {suffix && (
            <span className="text-sm lg:text-base text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        <p 
          className={cn(
            "text-muted-foreground line-clamp-2",
            isMobile ? "text-xs mt-1" : "text-sm mt-0.5"
          )}
          id={onClick ? undefined : `stat-${title.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {title}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
