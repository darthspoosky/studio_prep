'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Import both dashboard versions
import OriginalDashboard from './page_old';
import GlassmorphicDashboard from './page';

/**
 * Dashboard container component that allows switching between implementations
 * Use ?version=original query parameter to view the original dashboard
 * Default is the new glassmorphic design
 */
export default function DashboardContainer() {
  const searchParams = useSearchParams();
  const version = searchParams.get('version');
  const [showOriginal, setShowOriginal] = useState(version === 'original');
  
  // Local storage key for dashboard preference
  const DASHBOARD_PREF_KEY = 'preptalk-dashboard-preference';
  
  useEffect(() => {
    // If URL parameter is set, use that
    if (version) {
      setShowOriginal(version === 'original');
      return;
    }
    
    // Otherwise try to load from local storage
    const savedPreference = localStorage.getItem(DASHBOARD_PREF_KEY);
    if (savedPreference) {
      setShowOriginal(savedPreference === 'original');
    }
  }, [version]);
  
  // Save preference to local storage when changed
  useEffect(() => {
    localStorage.setItem(DASHBOARD_PREF_KEY, showOriginal ? 'original' : 'glassmorphic');
  }, [showOriginal]);
  
  return (
    <div className="relative">
      {/* Version switcher */}
      <div className="absolute top-4 right-4 z-50 p-2 bg-background/70 backdrop-blur-md rounded-lg border border-border flex items-center gap-2">
        <Switch
          id="dashboard-version"
          checked={!showOriginal}
          onCheckedChange={(checked) => setShowOriginal(!checked)}
        />
        <Label htmlFor="dashboard-version" className="text-xs font-medium">
          {showOriginal ? 'Original' : 'Glassmorphic'} Design
        </Label>
      </div>
      
      {/* Render selected dashboard version */}
      {showOriginal ? <OriginalDashboard /> : <GlassmorphicDashboard />}
    </div>
  );
}
