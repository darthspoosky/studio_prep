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
  /** Title of the goal (optional) */
  title?: string;
  /** Description or subtitle (optional) */
  description?: string;
}

/**
 * DailyGoalChart component displays a circular progress chart
 * for tracking daily goal completion with modern glassmorphic styling
 */
export const DailyGoalChart = ({ 
  progress, 
  title = "Today's Goal", 
  description = "Daily completion rate"
}: DailyGoalChartProps) => {
  // Create gradient definition for the chart
  const gradientId = "goalGradient";
  
  // Define status color based on progress
  let statusColor = "var(--primary)";
  if (progress < 30) statusColor = "#EF4444"; // Red for low progress
  else if (progress < 70) statusColor = "#F59E0B"; // Amber for medium progress
  else statusColor = "#10B981"; // Green for good progress
  
  // Define the data for the chart
  const data = [{ name: 'goal', value: progress, fill: `url(#${gradientId})` }];
  
  return (
    <div className="backdrop-blur-md bg-background/30 border border-muted/20 shadow-lg rounded-xl p-4 transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-col mb-2">
        <h3 className="text-sm font-medium tracking-tight">{title}</h3>
        <p className="text-xs text-foreground/60">{description}</p>
      </div>
      
      <ResponsiveContainer width="100%" height={140}>
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
            y="46%" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            className="text-3xl font-bold fill-foreground tracking-tighter"
          >
            {`${progress}%`}
          </text>
          <text 
            x="50%" 
            y="62%" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            className="text-[10px] fill-foreground/60"
          >
            completed
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DailyGoalChart;
