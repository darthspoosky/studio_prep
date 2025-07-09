'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { glassmorphicStyles, predefinedStyles } from '../../styles/glassmorphic';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MobileHeader from './MobileHeader';
import { UsageStats } from '@/services/usageService';
import { UserNav } from '@/components/layout/user-nav';
import { cn } from '@/lib/utils';


// Types for necessary services
interface UserQuizStats {
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number;
  streak: number;
  improvement: number;
}

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);
  
  return (
    <div className="min-h-screen w-full relative bg-slate-100 dark:bg-slate-900">
      {/* Background gradient effects with proper z-index */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-primary/30 to-purple-600/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-cyan-400/30 to-blue-600/20 rounded-full blur-3xl opacity-30" />
      </div>
      
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white p-2 rounded z-50">
        Skip to main content
      </a>
      
      {/* Mobile header with sidebar toggle */}
      <div className="lg:hidden">
        {mobileHeader || (
          <MobileHeader 
            usageStats={usageStats} 
            userNav={<UserNav />}
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        )}
      </div>
      
      <div className="flex h-full lg:h-screen">
        {/* Left sidebar with mobile drawer */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:block border-r border-white/10",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-full overflow-y-auto overscroll-contain">
            {leftSidebar || <LeftSidebar usageStats={usageStats} />}
          </div>
        </aside>
        
        {/* Mobile backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Main content area */}
        <main 
          id="main-content"
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 lg:px-6"
          style={{ height: '100vh' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-full mx-auto pb-20 lg:pb-6"
          >
            {children}
          </motion.div>
        </main>
        
        {/* Right sidebar - desktop only */}
        <aside className="hidden xl:block w-72 h-screen sticky top-0">
          <div className="h-full overflow-y-auto overscroll-contain">
            {rightSidebar || <RightSidebar quizStats={quizStats} userNav={<UserNav />} />}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MainLayout;
