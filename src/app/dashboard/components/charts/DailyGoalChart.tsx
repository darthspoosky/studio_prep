'use client';

import React from 'react';
import { 
  RadialBarChart, 
  RadialBar, 
  ResponsiveContainer, 
  PolarAngleAxis 
} from 'recharts';

/**
 * Interface for DailyGoalChart props
 */
export interface DailyGoalChartProps {
  /** Progress value as a percentage (0-100) */
  progress: number;
}

/**
 * DailyGoalChart component displays a circular progress chart
 * for tracking daily goal completion with modern glassmorphic styling
 */
export const DailyGoalChart = ({ 
  progress
}: DailyGoalChartProps) => {
  // Create gradient definition for the chart
  const gradientId = "goalGradient";
  
  // Define status color based on progress
  let statusColor = "hsl(var(--primary))";
  if (progress < 30) statusColor = "#EF4444"; // Red for low progress
  else if (progress < 70) statusColor = "#F59E0B"; // Amber for medium progress
  else statusColor = "#10B981"; // Green for good progress
  
  // Define the data for the chart
  const data = [{ name: 'goal', value: progress, fill: `url(#${gradientId})` }];
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart 
        innerRadius="70%" 
        outerRadius="90%" 
        barSize={8} 
        data={data} 
        startAngle={90} 
        endAngle={-270}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={statusColor} stopOpacity={0.8} />
            <stop offset="100%" stopColor={statusColor} stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar
          background
          dataKey="value"
          cornerRadius={5}
          className="opacity-90"
        />
        <text 
          x="50%" 
          y="50%" 
          textAnchor="middle" 
          dominantBaseline="middle" 
          className="text-3xl font-bold fill-foreground tracking-tighter"
        >
          {`${Math.round(progress)}%`}
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

export default DailyGoalChart;
