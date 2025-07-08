'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { glassmorphicStyles, predefinedStyles } from '../../styles/glassmorphic';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MobileHeader from './MobileHeader';
import { UsageStats } from '@/services/usageService';

// Types for necessary services
interface UserQuizStats {
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number;
  streak: number;
  improvement: number;
}

// UserNav component placeholder - replace with actual component when available
const UserNav = () => (
  <div className="flex items-center space-x-2 rounded-full bg-background/50 p-2 backdrop-blur-sm">
    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
      <span className="text-sm font-medium">U</span>
    </div>
  </div>
);

interface MainLayoutProps {
  children: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  mobileHeader?: React.ReactNode;
  quizStats?: UserQuizStats | null;
  usageStats?: UsageStats | null;
}

/**
 * Main layout component with true glassmorphic styling
 * Implements a flexible layout with sidebars and responsive behavior
 * Based on Adobe Experience Cloud design reference
 */
const MainLayout: React.FC<MainLayoutProps> = ({ 
  children,
  leftSidebar,
  rightSidebar,
  mobileHeader,
  quizStats = null, 
  usageStats = null
}) => {
  return (
    <div className="min-h-screen w-full relative bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-primary/30 to-purple-600/20 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-cyan-400/30 to-blue-600/20 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute top-[40%] left-[25%] w-[400px] h-[400px] bg-gradient-to-tr from-amber-400/20 to-pink-600/10 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* Mobile header - shown only on mobile devices */}
      {mobileHeader || (
        <MobileHeader 
          usageStats={usageStats} 
          userNav={<UserNav />}
        />
      )}
      
      <div className="flex h-screen pt-16 lg:pt-0">
        {/* Left sidebar */}
        <div className="w-64 hidden lg:block border-r border-white/10 h-screen sticky top-0 overflow-y-auto">
          {leftSidebar || <LeftSidebar usageStats={usageStats} />}
        </div>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto px-4 py-6 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-full mx-auto"
          >
            {/* Main content wrapper with glassmorphic effect */}
            <div className={`${predefinedStyles.mainContainer}`}>
              {/* Subtle gradient overlays */}
              <div className={`${glassmorphicStyles.gradientOverlay} ${glassmorphicStyles.mixedGradient}`}></div>
              
              {/* Main content */}
              <div className="relative z-10">
                {children}
              </div>
            </div>
          </motion.div>
        </main>
        
        {/* Right sidebar */}
        <div className="w-72 hidden xl:block h-screen sticky top-0 overflow-y-auto">
          {rightSidebar || <RightSidebar quizStats={quizStats} userNav={<UserNav />} />}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
