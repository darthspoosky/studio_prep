import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BarChart2, TrendingUp } from 'lucide-react';
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip
} from 'recharts';

interface QuizPerformanceData {
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  weeklyPerformance: Array<{
    day: string;
    score: number;
  }>;
  questionsAttempted: number;
  recentImprovement?: number; // percentage improvement over last week
}

interface QuizPerformanceWidgetProps {
  data: QuizPerformanceData;
  title?: string;
  loading?: boolean;
}

const QuizPerformanceWidget: React.FC<QuizPerformanceWidgetProps> = ({
  data,
  title = 'Quiz Performance',
  loading = false
}) => {
  // Function to get appropriate color class based on accuracy
  const getAccuracyColorClass = (accuracy: number): string => {
    if (accuracy >= 80) return 'text-green-500';
    if (accuracy >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Skip weekends or days with no data in the chart
  const filteredWeeklyData = data.weeklyPerformance.filter(day => day.score >= 0);
  
  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-16 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold">
              <span className={getAccuracyColorClass(data.accuracy)}>{data.accuracy}%</span>
            </div>
            <p className="text-xs text-gray-500">Accuracy</p>
          </div>
          <div>
            <div className="text-2xl font-bold flex items-center">
              {data.currentStreak}{' '}
              {data.currentStreak >= 3 && <Sparkles size={18} className="ml-1 text-yellow-400" />}
            </div>
            <p className="text-xs text-gray-500">
              Current Streak
              <span className="text-gray-400 ml-1">
                (Best: {data.bestStreak})
              </span>
            </p>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Weekly Performance</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredWeeklyData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  tick={{fontSize: 10}}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ fontSize: '12px' }}
                  formatter={(value) => [`${value}%`, 'Score']}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <BarChart2 size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500">
              {data.questionsAttempted} questions
            </span>
          </div>
          {data.recentImprovement !== undefined && (
            <Badge variant={data.recentImprovement >= 0 ? "success" : "destructive"} className="h-5">
              <TrendingUp size={12} className="mr-1" />
              {data.recentImprovement > 0 ? '+' : ''}{data.recentImprovement}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizPerformanceWidget;
