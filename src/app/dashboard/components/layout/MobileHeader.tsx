'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { UsageStats } from '@/services/usageService';
import { glassmorphicStyles } from '../../styles/glassmorphic';

interface MobileHeaderProps {
  /** Usage statistics to pass to the sidebar */
  usageStats: UsageStats | null;
  /** Current page title */
  pageTitle?: string;
  /** User navigation component */
  userNav?: React.ReactNode;
  /** Sidebar content component - defaults to standard sidebar */
  sidebarContent?: React.ReactNode;
  /** Logo component or element */
  logo?: React.ReactNode;
  /** Show title */
  showTitle?: boolean;
  /** Additional actions for the header */
  actions?: React.ReactNode;
  /** Custom class name */
  className?: string;
}

/**
 * MobileHeader component for PrepTalk dashboard and tool pages
 * Features modern glassmorphic design and can be reused across all tool pages
 * Provides mobile navigation drawer and header controls
 */
const MobileHeader: React.FC<MobileHeaderProps> = ({
  usageStats,
  pageTitle,
  userNav,
  sidebarContent,
  logo,
  showTitle = true,
  actions,
  className = ""
}) => {
  // Default logo if none provided
  const defaultLogo = (
    <Link 
      href="/dashboard" 
      className="font-headline text-xl font-bold animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent"
    >
      PrepTalk
    </Link>
  );

  return (
    <motion.header 
      className={`lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-background/30 backdrop-blur-xl px-4 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Subtle gradient highlight at the top */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      <Sheet>
        <SheetTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              size="icon" 
              variant="outline" 
              className="bg-white/5 hover:bg-white/10 border-white/10 backdrop-blur-xl shadow-sm"
            >
              <Menu className="h-5 w-5 text-foreground/80" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </motion.div>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 border-r border-white/10 bg-background/60 backdrop-blur-2xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>
              Main menu for the PrepTalk application, containing links to dashboard, tools, and other resources.
            </SheetDescription>
          </SheetHeader>
          
          {/* Render provided sidebar content or load dynamic content */}
          {sidebarContent ? (
            sidebarContent
          ) : (
            <div className="p-4">
              {/* This would be replaced with your SidebarContent component */}
              <div className="text-lg font-bold mb-4">PrepTalk</div>
              <nav className="flex flex-col gap-2">
                <Link href="/dashboard" className="flex items-center gap-3 p-3 bg-primary/10 text-primary rounded-lg font-semibold">
                  Dashboard
                </Link>
                <Link href="/newspaper-analysis" className="flex items-center gap-3 p-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg transition-colors">
                  Newspaper Analysis
                </Link>
              </nav>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Middle section: Logo or Title with gradient effect */}
      {showTitle ? (
        logo || (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {defaultLogo}
          </motion.div>
        )
      ) : pageTitle ? (
        <motion.h1 
          className="text-lg font-semibold bg-gradient-to-r from-foreground/90 to-foreground/70 bg-clip-text text-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {pageTitle}
        </motion.h1>
      ) : (
        logo || defaultLogo
      )}

      {/* Right section: User nav and/or actions */}
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <Button 
            size="icon" 
            variant="ghost" 
            className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl rounded-full h-9 w-9"
          >
            <Bell className="h-4 w-4 text-foreground/80" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full"></span>
          </Button>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            size="icon" 
            variant="ghost" 
            className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl rounded-full h-9 w-9"
          >
            <Search className="h-4 w-4 text-foreground/80" />
          </Button>
        </motion.div>
        
        {actions}
        {userNav}
      </div>
    </motion.header>
  );
};

export default MobileHeader;
