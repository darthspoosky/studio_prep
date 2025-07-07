import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend 
} from 'recharts';
import { LucideBookOpen } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { UserProgressData } from '@/services/pastYearQuestionService';

// Type for section progress data
type SectionProgress = {
  sectionId: string;
  sectionName: string;
  attempted: number;
  correct: number;
  total: number;
  percentage: number;
};

// Type for radar chart data
type RadarData = {
  subject: string;
  score: number;
  fullMark: number;
};

interface SyllabusSectionProgressProps {
  userProgressData: UserProgressData | null;
  sectionNameMap: Record<string, string>;
}

const SyllabusSectionProgress: React.FC<SyllabusSectionProgressProps> = ({ userProgressData, sectionNameMap }) => {
  // If no progress data available, show placeholder
  if (!userProgressData || !userProgressData.syllabusProgress) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Syllabus Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <LucideBookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No progress data yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start practicing with questions from different syllabus sections to see your performance analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Process syllabus progress data
  const syllabusProgress = userProgressData.syllabusProgress || {};
  const sections: SectionProgress[] = Object.entries(syllabusProgress).map(([sectionId, data]) => ({
    sectionId,
    sectionName: sectionNameMap[sectionId] || sectionId,
    attempted: data.attempted,
    correct: data.correct,
    total: data.total,
    percentage: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0
  }));

  // Sort sections by performance (best first)
  const sortedSections = [...sections].sort((a, b) => b.percentage - a.percentage);
  
  // Get top 5 sections for the radar chart (filter those with at least 1 attempt)
  const topSections = sortedSections.filter(section => section.attempted > 0).slice(0, 5);
  
  // Create data for radar chart
  const radarData: RadarData[] = topSections.map(section => ({
    subject: section.sectionName,
    score: section.percentage,
    fullMark: 100
  }));

  // Function to get appropriate color for percentage
  const getColorForPercentage = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Syllabus Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          {topSections.length > 0 ? (
            <>
              {/* Radar Chart */}
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Performance %"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">
                No attempts recorded yet. Start practicing to see your performance radar.
              </p>
            </div>
          )}
          
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Section-wise Performance</h3>
            
            {sortedSections.length > 0 ? (
              <div className="space-y-5">
                {sortedSections.map(section => (
                  <div key={section.sectionId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{section.sectionName}</p>
                        <div className="flex items-center mt-1 text-sm">
                          <span className="text-gray-500 mr-2">
                            {section.correct}/{section.attempted} correct
                          </span>
                          {section.attempted > 0 && (
                            <Badge variant="outline">{section.percentage}%</Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {section.attempted}/{section.total} attempted
                      </span>
                    </div>
                    <Progress 
                      value={section.percentage} 
                      className={`h-2 ${getColorForPercentage(section.percentage)}`} 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No section data available. Start practicing to see your progress.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedSections.length > 0 ? (
              <>
                <h3 className="text-sm font-medium">Areas to Focus On</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sortedSections
                    .filter(s => s.attempted > 0 && s.percentage < 70)
                    .slice(0, 4)
                    .map(section => (
                      <div 
                        key={section.sectionId} 
                        className="bg-red-50 border border-red-100 rounded-md p-3"
                      >
                        <p className="font-medium">{section.sectionName}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Current accuracy: {section.percentage}%
                        </p>
                      </div>
                    ))}
                  
                  {sortedSections.filter(s => s.attempted === 0).slice(0, 2).map(section => (
                    <div 
                      key={section.sectionId} 
                      className="bg-blue-50 border border-blue-100 rounded-md p-3"
                    >
                      <p className="font-medium">{section.sectionName}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Not attempted yet
                      </p>
                    </div>
                  ))}
                </div>
                
                <h3 className="text-sm font-medium mt-6">Your Strengths</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sortedSections
                    .filter(s => s.attempted > 0 && s.percentage >= 70)
                    .slice(0, 4)
                    .map(section => (
                      <div 
                        key={section.sectionId} 
                        className="bg-green-50 border border-green-100 rounded-md p-3"
                      >
                        <p className="font-medium">{section.sectionName}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Strong performance: {section.percentage}%
                        </p>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">
                  Complete practice sessions to receive personalized recommendations.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyllabusSectionProgress;
