'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Filter,
  ArrowUpDown,
  MoreVertical,
  ArrowUpRight,
  Download,
  ZoomIn
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * Interface for QuestionsBySubjectChart props
 */
export interface QuestionsBySubjectChartProps {
  /** Chart data showing questions by subject/paper */
  data?: any[];
  /** Configuration for chart colors and display */
  config?: Record<string, any>;
  /** Total questions count */
  total?: number;
  /** Percentage change in questions */
  percentChange?: number;
  /** Absolute change in questions */
  absoluteChange?: number;
}

/**
 * ChartTooltipContent component for custom tooltip
 */
const ChartTooltipContent = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg shadow-lg bg-background/95 backdrop-blur-sm border border-border p-3">
        <p className="text-sm font-medium mb-1">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`tooltip-${index}`} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.fill }}></div>
            <span>{entry.name}: </span>
            <span className="font-semibold">{entry.value} questions</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * ChartLegendContent component for custom legend
 */
const ChartLegendContent = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-2">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }}></div>
          <span className="text-xs font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * QuestionsBySubjectChart component displays question generation statistics by subject
 * Uses modern glassmorphic design for the PrepTalk dashboard
 */
export const QuestionsBySubjectChart = ({
  data = [],
  config = {},
  total = 366,
  percentChange = 15.8,
  absoluteChange = 50
}: QuestionsBySubjectChartProps) => {
  // If no data is provided, use sample data
  const chartData = data.length > 0 ? data : [
    { paper: 'GS-I', history: 45, culture: 30, geography: 25 },
    { paper: 'GS-II', polity: 50, governance: 35, intl: 15 },
    { paper: 'GS-III', economy: 55, environment: 30, security: 15 },
    { paper: 'GS-IV', ethics: 40, case_studies: 26 }
  ];
  
  // Default chart configuration
  const chartConfig = Object.keys(config).length > 0 ? config : {
    history: { color: '#8b5cf6' }, // Purple
    culture: { color: '#6366f1' }, // Indigo
    geography: { color: '#3b82f6' }, // Blue
    polity: { color: '#ec4899' }, // Pink
    governance: { color: '#f43f5e' }, // Rose
    intl: { color: '#f97316' }, // Orange
    economy: { color: '#14b8a6' }, // Teal
    environment: { color: '#10b981' }, // Emerald
    security: { color: '#eab308' }, // Yellow
    ethics: { color: '#8b5cf6' }, // Purple
    case_studies: { color: '#6366f1' } // Indigo
  };

  return (
    <Card className="relative overflow-hidden backdrop-blur-md bg-background/30 border border-muted/20 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl">
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-xl"></div>
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-secondary/10 to-secondary/5 rounded-full blur-xl"></div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Questions by Subject</CardTitle>
            <CardDescription className="text-sm text-foreground/60">Breakdown of generated questions by GS Paper</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 hidden sm:flex text-xs bg-background/50 hover:bg-background/70 border border-border/40"
            >
              <Filter className="w-3.5 h-3.5 mr-1.5 opacity-70" />Filter
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 hidden sm:flex text-xs bg-background/50 hover:bg-background/70 border border-border/40"
            >
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 opacity-70" />Sort
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 bg-background/50 hover:bg-background/70 border border-border/40"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="flex items-center gap-2">
                  <ZoomIn className="w-3.5 h-3.5 opacity-70" />
                  <span>View Details</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 opacity-70" />
                  <span>Export as PNG</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="pt-4">
          <div className="text-3xl font-bold tracking-tight">{total} Total</div>
          <div className="flex items-center text-sm">
            <span className={`flex items-center ${percentChange >= 0 ? 'text-emerald-500' : 'text-rose-500'} mr-2`}>
              {percentChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5-5-5M17 7l-5 5-5-5" />
                </svg>
              )}
              {`${percentChange >= 0 ? '+' : ''}${percentChange}%`}
            </span>
            <span className="text-foreground/60">{`${absoluteChange >= 0 ? '+' : ''}${absoluteChange} this month`}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pl-2 pr-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 15 }}
          >
            <defs>
              {Object.entries(chartConfig).map(([key, config]: [string, any]) => (
                <linearGradient key={`gradient-${key}`} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={config.color} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={config.color} stopOpacity={0.3} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="#e5e7eb30" strokeDasharray="4 4" />
            <XAxis 
              dataKey="paper" 
              tickLine={false} 
              tickMargin={10} 
              axisLine={false} 
              tick={{ fontSize: 11, fill: 'var(--foreground)' }}
            />
            <YAxis 
              tickLine={false} 
              tickMargin={10} 
              axisLine={false} 
              tickFormatter={(value) => `${value}`}
              tick={{ fontSize: 11, fill: 'var(--foreground)' }}
              style={{ opacity: 0.7 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend content={<ChartLegendContent />} />
            {Object.keys(chartConfig).map((key) => (
              <Bar 
                key={key} 
                dataKey={key} 
                stackId="a" 
                fill={`url(#gradient-${key})`} 
                radius={[4, 4, 0, 0]} 
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default QuestionsBySubjectChart;
