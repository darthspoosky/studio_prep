import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BookOpen, ArrowRight, Target } from 'lucide-react';
import Link from 'next/link';

export interface WeakAreaTopic {
  id: string;
  name: string;
  accuracy: number;
  questionCount: number;
  syllabusSectionId?: string;
}

interface WeakAreaWidgetProps {
  weakAreas: WeakAreaTopic[];
  loading?: boolean;
}

const WeakAreaWidget: React.FC<WeakAreaWidgetProps> = ({
  weakAreas,
  loading = false
}) => {
  // Handle loading state
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Weak Area Focus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-12 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No weak areas identified
  if (weakAreas.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Weak Area Focus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Target className="h-8 w-8 text-blue-500 mb-2" />
            <h3 className="text-sm font-medium">No weak areas identified yet</h3>
            <p className="text-xs text-gray-500 mt-1">
              Complete more quizzes to get personalized recommendations
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant="outline" size="sm">
            <Link href="/daily-quiz/past-year">
              Practice Questions <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Display identified weak areas (show max 3)
  const topWeakAreas = weakAreas.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Areas to Improve</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs">
              Focus on these topics to improve your overall performance
            </p>
          </div>
          
          {topWeakAreas.map((area) => (
            <div key={area.id} className="rounded-md border p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-sm font-medium">{area.name}</h4>
                  <p className="text-xs text-gray-500">
                    {area.questionCount} questions available
                  </p>
                </div>
                <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                  {area.accuracy}%
                </Badge>
              </div>
              <Button 
                asChild 
                size="sm" 
                variant="ghost" 
                className="w-full mt-1 h-8 text-xs"
              >
                <Link 
                  href={
                    area.syllabusSectionId 
                      ? `/daily-quiz/past-year/section/${area.syllabusSectionId}` 
                      : `/daily-quiz/past-year`
                  }
                >
                  <BookOpen className="mr-1 h-3 w-3" /> Practice Now
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button asChild className="w-full" variant="outline" size="sm">
          <Link href="/daily-quiz/past-year/progress">
            View All Weak Areas <ArrowRight className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WeakAreaWidget;
