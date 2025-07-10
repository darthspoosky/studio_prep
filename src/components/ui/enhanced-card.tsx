'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { glassmorphism, shadows } from '@/lib/design-system';

export interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  glass?: boolean;
  elevated?: boolean;
  interactive?: boolean;
  hover?: boolean;
  loading?: boolean;
  disabled?: boolean;
  gradient?: boolean;
  border?: boolean;
  shadow?: keyof typeof shadows;
}

export const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({
    className,
    variant = 'default',
    glass = false,
    elevated = false,
    interactive = false,
    hover = false,
    loading = false,
    disabled = false,
    gradient = false,
    border = true,
    shadow = 'sm',
    children,
    ...props
  }, ref) => {
    const variantStyles = {
      default: '',
      primary: 'border-primary/20 bg-primary/5',
      secondary: 'border-secondary/20 bg-secondary/5',
      success: 'border-green-500/20 bg-green-500/5',
      warning: 'border-amber-500/20 bg-amber-500/5',
      danger: 'border-red-500/20 bg-red-500/5',
    };

    const Component = interactive ? motion.div : 'div';

    return (
      <Component
        ref={ref}
        className={cn(
          'relative rounded-lg',
          // Base styles
          border && 'border',
          glass ? glassmorphism.card : 'bg-card text-card-foreground',
          elevated && shadows.lg,
          shadow && shadows[shadow],
          // Variant styles
          variantStyles[variant],
          // Interactive states
          interactive && 'transition-all duration-200 cursor-pointer',
          hover && !disabled && 'hover:shadow-md hover:scale-[1.02]',
          disabled && 'opacity-50 cursor-not-allowed',
          // Gradient overlay
          gradient && 'bg-gradient-to-br from-background to-background/50',
          // Loading state
          loading && 'animate-pulse',
          className
        )}
        {...(interactive && {
          whileHover: !disabled ? { scale: 1.02 } : {},
          whileTap: !disabled ? { scale: 0.98 } : {},
          transition: { duration: 0.2 }
        })}
        {...props}
      >
        {/* Loading overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-lg flex items-center justify-center z-10"
            >
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gradient overlay for glass effect */}
        {glass && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 rounded-lg pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative z-0">
          {children}
        </div>
      </Component>
    );
  }
);

EnhancedCard.displayName = 'EnhancedCard';

// Card Header Component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, actions, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5 p-6',
        actions && 'flex-row items-center justify-between space-y-0',
        className
      )}
      {...props}
    >
      <div className="flex-1">
        {children}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

// Card Title Component
export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

// Card Description Component
export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

// Card Content Component
export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

// Card Footer Component
export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

// Metric Card Component
export interface MetricCardProps extends EnhancedCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  trendLabel?: string;
  suffix?: string;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({
    title,
    value,
    icon,
    trend,
    trendLabel,
    suffix,
    color = 'default',
    className,
    ...props
  }, ref) => {
    const colorStyles = {
      default: 'text-foreground',
      primary: 'text-primary',
      secondary: 'text-secondary',
      success: 'text-green-600',
      warning: 'text-amber-600',
      danger: 'text-red-600',
    };

    const getTrendIcon = () => {
      if (!trend) return null;
      
      const iconClass = cn(
        'h-4 w-4',
        trend.direction === 'up' && 'text-green-500',
        trend.direction === 'down' && 'text-red-500',
        trend.direction === 'neutral' && 'text-muted-foreground'
      );

      switch (trend.direction) {
        case 'up':
          return <CheckCircle2 className={iconClass} />;
        case 'down':
          return <AlertCircle className={iconClass} />;
        case 'neutral':
          return <Info className={iconClass} />;
        default:
          return null;
      }
    };

    return (
      <EnhancedCard
        ref={ref}
        className={cn('p-6', className)}
        {...props}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && (
            <div className={cn('p-2 rounded-full bg-muted/50', colorStyles[color])}>
              {icon}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className={cn('text-2xl font-bold', colorStyles[color])}>
              {value}
            </span>
            {suffix && (
              <span className="text-sm text-muted-foreground">{suffix}</span>
            )}
          </div>
          
          {trend && (
            <div className="flex items-center gap-1 text-sm">
              {getTrendIcon()}
              <span className={cn(
                'font-medium',
                trend.direction === 'up' && 'text-green-600',
                trend.direction === 'down' && 'text-red-600',
                trend.direction === 'neutral' && 'text-muted-foreground'
              )}>
                {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                {Math.abs(trend.value)}%
              </span>
              {trendLabel && (
                <span className="text-muted-foreground">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
      </EnhancedCard>
    );
  }
);

MetricCard.displayName = 'MetricCard';

// Status Card Component
export interface StatusCardProps extends EnhancedCardProps {
  status: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  action?: React.ReactNode;
}

export const StatusCard = React.forwardRef<HTMLDivElement, StatusCardProps>(
  ({ status, title, message, action, className, ...props }, ref) => {
    const statusConfig = {
      success: {
        icon: CheckCircle2,
        variant: 'success' as const,
        iconColor: 'text-green-600',
      },
      warning: {
        icon: AlertTriangle,
        variant: 'warning' as const,
        iconColor: 'text-amber-600',
      },
      error: {
        icon: AlertCircle,
        variant: 'danger' as const,
        iconColor: 'text-red-600',
      },
      info: {
        icon: Info,
        variant: 'primary' as const,
        iconColor: 'text-blue-600',
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <EnhancedCard
        ref={ref}
        variant={config.variant}
        className={cn('p-6', className)}
        {...props}
      >
        <div className="flex items-start gap-4">
          <Icon className={cn('h-5 w-5 mt-0.5', config.iconColor)} />
          <div className="flex-1 space-y-2">
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm text-muted-foreground">{message}</p>
            {action && <div className="pt-2">{action}</div>}
          </div>
        </div>
      </EnhancedCard>
    );
  }
);

StatusCard.displayName = 'StatusCard';

// Feature Card Component
export interface FeatureCardProps extends EnhancedCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  badge?: string;
  action?: React.ReactNode;
}

export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ icon, title, description, href, badge, action, className, ...props }, ref) => {
    const Component = href ? 'a' : 'div';
    
    return (
      <EnhancedCard
        ref={ref}
        interactive={!!href}
        hover={!!href}
        className={cn('p-6 h-full', className)}
        {...props}
      >
        <Component
          {...(href && { href })}
          className="block h-full"
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
              {badge && (
                <span className="text-xs bg-muted px-2 py-1 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground flex-1">{description}</p>
            
            {action && (
              <div className="mt-4 pt-4 border-t">
                {action}
              </div>
            )}
          </div>
        </Component>
      </EnhancedCard>
    );
  }
);

FeatureCard.displayName = 'FeatureCard';