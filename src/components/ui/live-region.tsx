'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  clearOnChange?: boolean;
  className?: string;
}

export function LiveRegion({ 
  message, 
  politeness = 'polite', 
  clearOnChange = true,
  className 
}: LiveRegionProps) {
  const [displayMessage, setDisplayMessage] = useState('');

  useEffect(() => {
    if (message) {
      if (clearOnChange) {
        // Clear first to ensure screen readers pick up the change
        setDisplayMessage('');
        setTimeout(() => setDisplayMessage(message), 10);
      } else {
        setDisplayMessage(message);
      }
    }
  }, [message, clearOnChange]);

  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className={cn("sr-only", className)}
      role="status"
    >
      {displayMessage}
    </div>
  );
}

// Custom hook for managing live region announcements
export function useLiveRegion() {
  const [message, setMessage] = useState('');
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite');

  const announce = (text: string, urgent = false) => {
    setPoliteness(urgent ? 'assertive' : 'polite');
    setMessage(text);
  };

  return { message, politeness, announce };
}

export default LiveRegion;