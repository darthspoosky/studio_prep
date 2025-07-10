'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/error-boundary';
import { setupWebVitals } from '@/lib/analytics';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Setup analytics and performance monitoring on the client
  React.useEffect(() => {
    setupWebVitals();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </ErrorBoundary>
  );
}
