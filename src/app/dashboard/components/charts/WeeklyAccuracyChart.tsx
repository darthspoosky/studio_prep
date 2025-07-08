'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ArrowUpRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface WeeklyAccuracyChartProps {
  /** Default time interval to display */
  defaultInterval?: 'daily' | 'weekly' | 'monthly';
  /** Default quiz type filter */
  defaultQuizType?: string;
  /** Average accuracy percentage */
  averageAccuracy?: number;
  /** Percentage change compared to previous period */
  percentageChange?: number;
  /** Custom chart data, if not provided uses default sample data */
  data?: Record<string, any[]>;
}

/**
 * WeeklyAccuracyChart component displays quiz accuracy over time with period filters
 * Uses modern glassmorphic design for the PrepTalk dashboard
 */
const WeeklyAccuracyChart = ({
  defaultInterval = 'weekly',
  defaultQuizType = 'combined',
  averageAccuracy = 84,
  percentageChange = 2.5,
  data
}: WeeklyAccuracyChartProps) => {
  const [interval, setInterval] = useState<"daily" | "weekly" | "monthly">(defaultInterval);
  const [quizType, setQuizType] = useState(defaultQuizType);

  // Default chart data if none is provided
  const allAccuracyData = data || {
    daily: [
      { day: 'Sun', accuracy: 82 }, { day: 'Mon', accuracy: 75 },
      { day: 'Tue', accuracy: 91 }, { day: 'Wed', accuracy: 88 },
      { day: 'Thu', accuracy: 72 }, { day: 'Fri', accuracy: 85 },
      { day: 'Sat', accuracy: 93 },
    ],
    weekly: [
      { week: 'W1', accuracy: 78 }, { week: 'W2', accuracy: 85 },
      { week: 'W3', accuracy: 81 }, { week: 'W4', accuracy: 90 },
    ],
    monthly: [
      { month: 'Jan', accuracy: 75 }, { month: 'Feb', accuracy: 80 },
      { month: 'Mar', accuracy: 88 }, { month: 'Apr', accuracy: 85 },
    ]
  };

  // Chart config for styling
  const weeklyAccuracyConfig = {
    accuracy: { label: "Accuracy", color: "#887CFD" },
  };

  const chartData = useMemo(() => {
    // Apply filter effects to the data
    const baseData = allAccuracyData[interval];
    let multiplier = 1;
    if (quizType === 'newspaper') multiplier = 1.05;
    if (quizType === 'practice') multiplier = 0.95;
    
    return baseData.map(d => ({ 
      ...d, 
      accuracy: Math.min(100, Math.round(d.accuracy * multiplier))
    }));
  }, [interval, quizType, allAccuracyData]);

  const dataKey = useMemo(() => {
    if (interval === 'daily') return 'day';
    if (interval === 'weekly') return 'week';
    return 'month';
  }, [interval]);

  return (
    <Card className="relative overflow-hidden backdrop-blur-md bg-background/30 border border-muted/20 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl">
      {/* Glassmorphic background effects */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-full blur-xl"></div>
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-indigo-500/5 rounded-full blur-xl"></div>
      
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Quiz Accuracy</CardTitle>
            <CardDescription className="text-sm text-foreground/60">Performance over time</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue={defaultQuizType} onValueChange={setQuizType}>
              <SelectTrigger className="w-[150px] text-xs bg-background/50 hover:bg-background/70 border border-border/40">
                <SelectValue placeholder="Quiz Type"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="combined">Combined</SelectItem>
                <SelectItem value="newspaper">Newspaper Quiz</SelectItem>
                <SelectItem value="practice">Quiz Practice</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue={interval} onValueChange={(value: any) => setInterval(value)}>
              <SelectTrigger className="w-[120px] text-xs bg-background/50 hover:bg-background/70 border border-border/40">
                <SelectValue placeholder="Period"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="pt-4">
          <div className="text-3xl font-bold tracking-tight">{averageAccuracy}%</div>
          <div className="flex items-center text-sm">
            <span className={`flex items-center ${percentageChange >= 0 ? 'text-emerald-500' : 'text-rose-500'} mr-2`}>
              {percentageChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5-5-5M17 7l-5 5-5-5" />
                </svg>
              )}
              {`${percentageChange >= 0 ? '+' : ''}${percentageChange}%`}
            </span>
            <span className="text-foreground/60">vs last period</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-6">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 15 }}>
            <defs>
              <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#887CFD" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#5347CE" stopOpacity={0.2}/>
              </linearGradient>
              <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#5347CE" floodOpacity={0.3} />
              </filter>
              {/* Hover effect filter */}
              <filter id="barHover" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#5347CE" floodOpacity={0.4} />
              </filter>
            </defs>
            <CartesianGrid vertical={false} stroke="#e5e7eb30" strokeDasharray="4 4" />
            <XAxis 
              dataKey={dataKey} 
              tickLine={false} 
              tickMargin={10} 
              axisLine={false} 
              tick={{ fontSize: 11, fill: 'var(--foreground)' }}
            />
            <Bar 
              dataKey="accuracy" 
              radius={[5, 5, 0, 0]} 
              fill="url(#accuracyGradient)"
              filter="url(#barShadow)"
              className="cursor-pointer transition-all duration-200 hover:opacity-90"
              onMouseOver={(data, index) => {
                document.querySelector(`#bar-${index}`)?.setAttribute('filter', 'url(#barHover)');
              }}
              onMouseOut={(data, index) => {
                document.querySelector(`#bar-${index}`)?.setAttribute('filter', 'url(#barShadow)');
              }}
            />
            {/* Custom tooltip using chartTooltipContent */}
            <ChartContainer 
              config={weeklyAccuracyConfig}
              tooltipContent={(props) => (
                <div className="rounded-lg shadow-lg bg-background/95 backdrop-blur-sm border border-border p-3">
                  <p className="text-sm font-medium mb-1">
                    {props.payload && props.payload[0] && props.payload[0].payload ? 
                      props.payload[0].payload[dataKey] : ''}
                  </p>
                  {props.payload && props.payload.map((entry, index) => (
                    <div key={`tooltip-${index}`} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-sm bg-indigo-500/80"></div>
                      <span>Accuracy: </span>
                      <span className="font-semibold">{entry.value}%</span>
                    </div>
                  ))}
                </div>
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WeeklyAccuracyChart;
