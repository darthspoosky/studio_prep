import React, { useEffect, useState } from 'react';
import QuizPerformanceWidget from './QuizPerformanceWidget';
import WeakAreaWidget, { WeakAreaTopic } from './WeakAreaWidget';
import QuizWidgetSettings, { useWidgetPreferences } from './QuizWidgetSettings';
import { useAuth } from '@/contexts/AuthContext';
import PastYearQuestionService from '@/services/pastYearQuestionService';
import { UserProgressData, SyllabusSection } from './types';

interface QuizDashboardWidgetsProps {
  className?: string;
}

// Get day name from date (e.g., "Mon")
const getDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

// Generate array of dates for last 7 days
const generateWeeklyDates = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push({
      date,
      day: getDayName(date)
    });
  }
  return dates;
};

const QuizDashboardWidgets: React.FC<QuizDashboardWidgetsProps> = ({ className }) => {
  const { user } = useAuth();
  const { preferences, updatePreferences } = useWidgetPreferences();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState({
    accuracy: 0,
    currentStreak: 0,
    bestStreak: 0,
    weeklyPerformance: [] as Array<{day: string, score: number}>,
    questionsAttempted: 0,
    recentImprovement: 0
  });
  const [weakAreas, setWeakAreas] = useState<WeakAreaTopic[]>([]);
  
  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Generate weekly dates
      const weeklyDates = generateWeeklyDates();
      
      if (user?.uid) {
        // Get user progress data
        const progressData = await PastYearQuestionService.getUserProgressData(user.uid);
        
        if (progressData) {
          // Calculate accuracy
          const accuracy = progressData.total > 0 
            ? Math.round((progressData.correct / progressData.total) * 100) 
            : 0;
            
          // Use streaks from progress data
          const currentStreak = progressData.currentStreak || 0;
          const bestStreak = progressData.bestStreak || 0;
          
          // Calculate questions attempted
          const questionsAttempted = progressData.total || 0;
          
          // Generate weekly performance data (random for now, would be replaced with actual data in production)
          const weeklyPerformance = weeklyDates.map(day => {
            // For demo: generate random scores between 40-100
            return {
              day: day.day,
              score: Math.floor(Math.random() * 60) + 40
            };
          });
          
          // Mock recent improvement (would calculate from actual data in production)
          const recentImprovement = Math.floor(Math.random() * 30) - 10; // -10 to +20
          
          setPerformanceData({
            accuracy,
            currentStreak,
            bestStreak,
            weeklyPerformance,
            questionsAttempted,
            recentImprovement
          });
          
          // Generate weak areas
          if (progressData.syllabusProgress) {
            const weakAreasList: WeakAreaTopic[] = [];
            
            // Convert syllabusProgress to weak areas
            Object.entries(progressData.syllabusProgress)
              .filter(([_, data]) => data.attempted > 0) // Only consider attempted sections
              .forEach(([sectionId, data]) => {
                // Get section accuracy
                const sectionAccuracy = data.attempted > 0 
                  ? Math.round((data.correct / data.attempted) * 100) 
                  : 0;
                  
                // If accuracy is below 65%, consider it a weak area
                if (sectionAccuracy < 65) {
                  weakAreasList.push({
                    id: sectionId,
                    name: sectionId, // This would be mapped to actual names in production
                    accuracy: sectionAccuracy,
                    questionCount: data.total,
                    syllabusSectionId: sectionId
                  });
                }
              });
              
            // Sort by accuracy (lowest first)
            weakAreasList.sort((a, b) => a.accuracy - b.accuracy);
            
            // Get proper section names
            try {
              const sections = await PastYearQuestionService.getAvailableSyllabusSections();
              const nameMap: Record<string, string> = {};
              
              sections.forEach(section => {
                nameMap[section.id] = section.name;
                
                // Also map child sections
                if (section.children) {
                  section.children.forEach(child => {
                    nameMap[child.id] = child.name;
                  });
                }
              });
              
              // Update names in weak areas list
              weakAreasList.forEach(area => {
                if (nameMap[area.id]) {
                  area.name = nameMap[area.id];
                }
              });
            } catch (error) {
              console.error('Error fetching section names:', error);
            }
            
            setWeakAreas(weakAreasList);
          }
        }
      } else {
        // Demo data for non-logged in users
        const weeklyPerformance = weeklyDates.map(day => {
          // For demo: generate random scores between 40-100
          return {
            day: day.day,
            score: Math.floor(Math.random() * 60) + 40
          };
        });
        
        setPerformanceData({
          accuracy: 68,
          currentStreak: 3,
          bestStreak: 7,
          weeklyPerformance,
          questionsAttempted: 120,
          recentImprovement: 8
        });
        
        // Demo weak areas
        setWeakAreas([
          {
            id: 'gs-economy',
            name: 'Economic and Social Development',
            accuracy: 52,
            questionCount: 45,
            syllabusSectionId: 'gs-economy'
          },
          {
            id: 'gs-science',
            name: 'General Science',
            accuracy: 58,
            questionCount: 30,
            syllabusSectionId: 'gs-science'
          },
          {
            id: 'csat-data-interpretation',
            name: 'Data Interpretation',
            accuracy: 60,
            questionCount: 25,
            syllabusSectionId: 'csat-data-interpretation'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Use demo data on error
      setPerformanceData({
        accuracy: 65,
        currentStreak: 2,
        bestStreak: 5,
        weeklyPerformance: generateWeeklyDates().map(day => ({
          day: day.day,
          score: Math.floor(Math.random() * 60) + 40
        })),
        questionsAttempted: 100,
        recentImprovement: 5
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up auto-refresh if configured
  useEffect(() => {
    if (preferences.autoRefreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchDashboardData();
      }, preferences.autoRefreshInterval * 60 * 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [preferences.autoRefreshInterval, user]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [user]);
  
  return (
    <div className={`grid gap-4 ${className || ''}`}>
      {/* Settings and refresh controls */}
      <div className="flex justify-end mb-2">
        <QuizWidgetSettings 
          preferences={preferences}
          onChange={updatePreferences}
          onRefresh={fetchDashboardData}
        />
      </div>
      
      {/* Performance widget */}
      {preferences.showPerformanceMetrics && (
        <QuizPerformanceWidget 
          data={{
            accuracy: performanceData.accuracy,
            currentStreak: performanceData.currentStreak,
            bestStreak: performanceData.bestStreak,
            questionsAttempted: performanceData.questionsAttempted,
            recentImprovement: performanceData.recentImprovement,
            weeklyPerformance: performanceData.weeklyPerformance
          }}
          loading={loading}
        />
      )}
      
      {/* Weak areas widget */}
      {preferences.showWeakAreas && (
        <WeakAreaWidget 
          weakAreas={weakAreas}
          loading={loading}
        />
      )}
    </div>
  );
};

export default QuizDashboardWidgets;
