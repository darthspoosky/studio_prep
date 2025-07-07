import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Default preferences
export interface WidgetPreferences {
  showPerformanceMetrics: boolean;
  showWeeklyChart: boolean;
  showImprovementRate: boolean;
  showWeakAreas: boolean;
  autoRefreshInterval: number; // in minutes, 0 means no auto-refresh
}

const defaultPreferences: WidgetPreferences = {
  showPerformanceMetrics: true,
  showWeeklyChart: true,
  showImprovementRate: true,
  showWeakAreas: true,
  autoRefreshInterval: 0
};

interface QuizWidgetSettingsProps {
  preferences: WidgetPreferences;
  onChange: (preferences: WidgetPreferences) => void;
  onRefresh: () => void;
}

const QuizWidgetSettings: React.FC<QuizWidgetSettingsProps> = ({
  preferences,
  onChange,
  onRefresh
}) => {
  const [open, setOpen] = useState(false);
  const [tempPreferences, setTempPreferences] = useState<WidgetPreferences>(preferences);
  
  const handleToggle = (key: keyof WidgetPreferences, value: boolean) => {
    setTempPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleRefreshIntervalChange = (value: string) => {
    setTempPreferences(prev => ({
      ...prev,
      autoRefreshInterval: parseInt(value)
    }));
  };
  
  const handleSave = () => {
    onChange(tempPreferences);
    setOpen(false);
    toast({
      title: "Preferences updated",
      description: "Your dashboard widget preferences have been saved.",
    });
  };
  
  const handleRefresh = () => {
    onRefresh();
    toast({
      title: "Dashboard refreshed",
      description: "Your performance data has been updated.",
    });
  };
  
  return (
    <div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setOpen(true)}
          title="Widget Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefresh}
          title="Refresh Data"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Dashboard Widget Preferences</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-metrics">Performance Metrics</Label>
                <p className="text-sm text-muted-foreground">Show accuracy and streak information</p>
              </div>
              <Switch 
                id="show-metrics"
                checked={tempPreferences.showPerformanceMetrics}
                onCheckedChange={(value) => handleToggle('showPerformanceMetrics', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-chart">Weekly Performance Chart</Label>
                <p className="text-sm text-muted-foreground">Display visual chart of weekly progress</p>
              </div>
              <Switch 
                id="show-chart"
                checked={tempPreferences.showWeeklyChart}
                onCheckedChange={(value) => handleToggle('showWeeklyChart', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-improvement">Improvement Rate</Label>
                <p className="text-sm text-muted-foreground">Show percentage improvement over time</p>
              </div>
              <Switch 
                id="show-improvement"
                checked={tempPreferences.showImprovementRate}
                onCheckedChange={(value) => handleToggle('showImprovementRate', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-weak-areas">Weak Areas</Label>
                <p className="text-sm text-muted-foreground">Show topics that need improvement</p>
              </div>
              <Switch 
                id="show-weak-areas"
                checked={tempPreferences.showWeakAreas}
                onCheckedChange={(value) => handleToggle('showWeakAreas', value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="auto-refresh">Auto-refresh interval</Label>
              <select
                id="auto-refresh"
                className="w-full border rounded p-2"
                value={tempPreferences.autoRefreshInterval.toString()}
                onChange={(e) => handleRefreshIntervalChange(e.target.value)}
              >
                <option value="0">Never (Manual refresh only)</option>
                <option value="5">Every 5 minutes</option>
                <option value="15">Every 15 minutes</option>
                <option value="30">Every 30 minutes</option>
                <option value="60">Every hour</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Hook to handle widget preferences
export const useWidgetPreferences = () => {
  const [preferences, setPreferences] = useState<WidgetPreferences>(() => {
    // Try to load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quizWidgetPreferences');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved preferences', e);
        }
      }
    }
    return defaultPreferences;
  });
  
  const updatePreferences = (newPreferences: WidgetPreferences) => {
    setPreferences(newPreferences);
    
    // Save to localStorage if available
    if (typeof window !== 'undefined') {
      localStorage.setItem('quizWidgetPreferences', JSON.stringify(newPreferences));
    }
  };
  
  return { preferences, updatePreferences };
};

export default QuizWidgetSettings;
