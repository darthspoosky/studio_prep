import React from 'react';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBarIcon, TrophyIcon, CalendarIcon } from 'lucide-react';
import { YearProgress } from '@/services/pastYearQuestionService';

interface ProgressOverviewProps {
  yearProgress: YearProgress[];
  currentStreak: number;
  bestStreak: number;
  totalQuestionsAttempted: number;
  avgAccuracy: number;
}

const ProgressOverview: React.FC<ProgressOverviewProps> = ({
  yearProgress,
  currentStreak,
  bestStreak,
  totalQuestionsAttempted,
  avgAccuracy
}) => {
  // Sort years in descending order for the chart
  const chartData = [...yearProgress]
    .sort((a, b) => a.year - b.year)
    .map(yearData => ({
      year: yearData.year,
      attempted: yearData.attempted,
      correct: yearData.correct,
      accuracy: yearData.attempted > 0 ? Math.round((yearData.correct / yearData.attempted) * 100) : 0
    }));

  // Custom colors for the chart
  const colors = {
    attempted: '#93c5fd',
    correct: '#3b82f6',
  };

  // Get the top 3 strongest years based on accuracy
  const topPerformingYears = [...yearProgress]
    .sort((a, b) => {
      const aAccuracy = a.attempted > 0 ? a.correct / a.attempted : 0;
      const bAccuracy = b.attempted > 0 ? b.correct / b.attempted : 0;
      return bAccuracy - aAccuracy;
    })
    .slice(0, 3)
    .filter(year => year.attempted > 0);

  return (
    <div className="space-y-8">
      {/* Top stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Questions Attempted
            </CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestionsAttempted}</div>
            <p className="text-xs text-muted-foreground">
              Total questions attempted across all years
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Accuracy
            </CardTitle>
            <TrophyIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAccuracy}%</div>
            <p className="text-xs text-muted-foreground">
              Correct answers across all attempts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Streak
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Consecutive days with practice
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Best Streak
            </CardTitle>
            <TrophyIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Your longest practice streak
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance By Year Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance By Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'accuracy') return `${value}%`;
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="attempted" name="Questions Attempted" fill={colors.attempted} />
                <Bar dataKey="correct" name="Correct Answers" fill={colors.correct} />
                <Bar dataKey="accuracy" name="Accuracy (%)" fill="#22c55e">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.accuracy >= 80 ? '#22c55e' : entry.accuracy >= 60 ? '#eab308' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Years */}
      {topPerformingYears.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Strongest Years</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformingYears.map((year) => {
                const accuracy = year.attempted > 0 ? Math.round((year.correct / year.attempted) * 100) : 0;
                
                return (
                  <div key={year.year} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <TrophyIcon className="h-4 w-4 mr-2 text-yellow-500" />
                        <span className="font-medium">{year.year}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {year.correct} / {year.attempted} correct ({accuracy}%)
                      </span>
                    </div>
                    <Progress value={accuracy} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressOverview;
