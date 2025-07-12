'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { createKeyboardHandler, createInteractiveAria } from '@/lib/accessibility';
import { cn } from '@/lib/utils';

interface AccessibleButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaCurrent?: boolean | string;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      onClick,
      onKeyDown,
      ariaLabel,
      ariaLabelledBy,
      ariaDescribedBy,
      ariaPressed,
      ariaExpanded,
      ariaControls,
      ariaCurrent,
      loading = false,
      loadingText = 'Loading...',
      icon,
      iconPosition = 'left',
      children,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const handleClick = () => {
      if (!disabled && !loading && onClick) {
        onClick();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (onKeyDown) {
        onKeyDown(e);
      } else {
        createKeyboardHandler(handleClick)(e);
      }
    };

    const ariaAttributes = createInteractiveAria({
      label: ariaLabel,
      labelledby: ariaLabelledBy,
      describedby: ariaDescribedBy,
      pressed: ariaPressed,
      expanded: ariaExpanded,
      controls: ariaControls,
      current: ariaCurrent,
    });

    const buttonContent = (
      <>
        {loading && (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="sr-only">{loadingText}</span>
          </span>
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span aria-hidden="true">{icon}</span>
        )}
        
        {children && (
          <span className={cn(loading && 'sr-only')}>
            {children}
          </span>
        )}
        
        {!loading && icon && iconPosition === 'right' && (
          <span aria-hidden="true">{icon}</span>
        )}
      </>
    );

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        className={cn(
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          loading && 'cursor-not-allowed',
          className
        )}
        {...ariaAttributes}
        {...props}
      >
        {buttonContent}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;