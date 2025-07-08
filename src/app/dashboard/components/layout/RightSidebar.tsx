'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { 
  Flame, 
  Target, 
  FileQuestion, 
  CheckCircle, 
  ChevronDown,
  Award,
  Clock,
  TrendingUp
} from 'lucide-react';
import DailyGoalChart from '../charts/DailyGoalChart';
import { glassmorphicStyles, predefinedStyles } from '../../styles/glassmorphic';

// Types for necessary services
interface UserQuizStats {
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number;
  streak: number;
  improvement: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  className?: string;
}

interface RightSidebarProps {
  /** Quiz statistics to display in the sidebar */
  quizStats: UserQuizStats | null;
  /** Show compact version */
  compact?: boolean;
  /** Custom class name */
  className?: string;
  /** Current exam or course selected */
  currentExam?: string;
  /** User navigation component */
  userNav?: React.ReactNode;
}

/**
 * A simple stat card for the sidebar with enhanced glassmorphic styling
 */
const SidebarStatCard: React.FC<StatCardProps> = ({ icon, value, label, className = "" }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className={`${glassmorphicStyles.card} flex flex-col items-center justify-center p-4 text-center group ${className}`}>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
        
        <div className="relative z-10">
          {icon}
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * RightSidebar component for PrepTalk dashboard and tool pages
 * Features true glassmorphic design inspired by Adobe Experience Cloud
 * Can be reused across all tool pages with consistent styling
 */
const RightSidebar: React.FC<RightSidebarProps> = ({ 
  quizStats, 
  compact = false,
  className = "",
  currentExam = "UPSC Civil Services",
  userNav
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState<'stats' | 'goals'>('stats');
  const containerClasses = `flex flex-col gap-6 ${compact ? 'p-2' : 'p-4'} ${className}`;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* True glassmorphic background with enhanced blur and transparency */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg"></div>
      
      {/* Gradient highlights */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-primary/10 to-purple-400/5 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-blue-400/10 to-cyan-300/5 rounded-full blur-3xl opacity-30"></div>
      
      <div className={`${containerClasses} relative z-10 h-full`}>
        {/* Header with exam selector and user nav */}
        <div className="hidden lg:flex items-center justify-between p-2">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button 
              variant="outline" 
              className="h-auto bg-white/5 hover:bg-white/10 border-white/10 backdrop-blur-md text-foreground/90"
            >
              {currentExam} <ChevronDown className="w-4 h-4 ml-2"/>
            </Button>
          </motion.div>
          {userNav}
        </div>

        {/* Tabs for toggling between views */}
        <div className="flex items-center mb-4 bg-white/5 backdrop-blur-md rounded-lg p-1">
          <motion.button
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'stats' ? 'bg-white/10 text-foreground shadow-sm' : 'text-foreground/70 hover:text-foreground/90'}`}
            onClick={() => setActiveTab('stats')}
            whileTap={{ scale: 0.97 }}
          >
            Statistics
          </motion.button>
          <motion.button
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'goals' ? 'bg-white/10 text-foreground shadow-sm' : 'text-foreground/70 hover:text-foreground/90'}`}
            onClick={() => setActiveTab('goals')}
            whileTap={{ scale: 0.97 }}
          >
            Goals
          </motion.button>
        </div>
        
        {activeTab === 'stats' && (
          <>
            {/* Calendar section with enhanced styling */}
            <div className="mb-6">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md"
                    classNames={{
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                      day_today: "bg-primary/20 text-primary",
                      day: "hover:bg-white/5 transition-colors"
                    }}
                  />
                </div>
              </motion.div>
            </div>
        )}

            {/* Activity stats with enhanced UI */}
            <div className="grid grid-cols-2 gap-4 px-2 mb-6">
              <SidebarStatCard 
                icon={
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400/20 to-red-500/20 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-400" />
                  </div>
                } 
                value="5" 
                label="Day Streak" 
              />
              <SidebarStatCard 
                icon={
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400/20 to-green-500/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-emerald-400" />
                  </div>
                } 
                value="Lv.3" 
                label="User Level" 
              />
            </div>
          </>
        )}

        {activeTab === 'goals' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Daily goal progress */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground/80 mb-3">Daily Goal</h3>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 flex items-center"
              >
                <div className="w-20 h-20 relative">
                  <DailyGoalChart progress={80} />
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">80%</div>
                </div>
                <div className="flex-1 ml-4">
                  <p className="font-medium text-foreground/90">You're doing great!</p>
                  <p className="text-sm text-foreground/60">4/5 tasks complete today</p>
                </div>
              </motion.div>
            </div>
            
            {/* Upcoming tasks */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground/80 mb-3">Today's Tasks</h3>
              <div className="space-y-2">
                <div className="bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-primary/80 mr-2" />
                    <span className="text-sm">Daily Quiz</span>
                  </div>
                  <div className="h-5 w-5 rounded-full bg-green-400/20 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-primary/80 mr-2" />
                    <span className="text-sm">Newspaper Analysis</span>
                  </div>
                  <div className="h-5 w-5 rounded-full bg-green-400/20 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-foreground/40 mr-2" />
                    <span className="text-sm">Writing Practice</span>
                  </div>
                  <div className="h-5 w-5 rounded-full bg-foreground/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-foreground/40">1h</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Quiz performance - conditionally rendered */}
        {quizStats && quizStats.totalAttempted > 0 && activeTab === 'stats' && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground/80 mb-3">Quiz Performance</h3>
            <div className="grid grid-cols-2 gap-4 px-2">
              <SidebarStatCard 
                icon={<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-500/20 flex items-center justify-center">
                  <FileQuestion className="w-5 h-5 text-blue-400"/>
                </div>} 
                value={quizStats.totalAttempted} 
                label="Answered" 
              />
              <SidebarStatCard 
                icon={<div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400/20 to-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-teal-400"/>
                </div>} 
                value={`${quizStats.accuracy}%`} 
                label="Accuracy" 
              />
            </div>
          </div>
        )}

        {/* Quick actions footer */}
        <div className="mt-auto pt-4">
          <motion.button 
            className="w-full bg-gradient-to-r from-primary/80 to-accent/80 hover:from-primary hover:to-accent text-primary-foreground py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Target className="w-4 h-4" />
            <span>Start Today's Tasks</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
