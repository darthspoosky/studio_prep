'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Newspaper,
  Mic,
  FileQuestion,
  PenLine,
  Book,
  Users,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  FileText,
  UserRound,
  CalendarDays,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UsageStats } from '@/services/usageService';
import { glassmorphicStyles } from '../../styles/glassmorphic';

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

interface NavSectionProps {
  title?: string;
  links: NavLinkProps[];
}

interface LeftSidebarProps {
  /** Usage statistics to display in the sidebar */
  usageStats: UsageStats | null;
  /** Current active page */
  activePage?: string;
  /** Show compact version on mobile */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon, label, active }) => {
  const baseClasses = "flex items-center gap-3 p-3 rounded-lg transition-all duration-200";
  const activeClasses = "bg-primary/10 text-primary font-semibold";
  const inactiveClasses = "text-muted-foreground hover:bg-muted/50 hover:text-foreground";
  
  return (
    <Link href={href} className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
};

const NavSection: React.FC<NavSectionProps> = ({ title, links }) => {
  const pathname = usePathname();
  
  return (
    <div className="flex flex-col gap-2">
      {title && (
        <p className="px-3 text-xs font-semibold text-muted-foreground/80 tracking-wider">
          {title}
        </p>
      )}
      {links.map((link) => (
        <NavLink 
          key={link.href}
          href={link.href}
          icon={link.icon}
          label={link.label}
          active={pathname === link.href}
        />
      ))
      }
    </div>
  );
};

/**
 * LeftSidebar component for PrepTalk dashboard and tool pages
 * Features modern glassmorphic design and can be reused across all tool pages
 */
const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  usageStats, 
  activePage, 
  compact = false, 
  className = ""
}) => {
  // Animation variants for hover effects
  const hoverAnimation = {
    hover: { scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 10 } }
  };
  const mainLinks = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: "Dashboard"
    },
    {
      href: "/newspaper-analysis",
      icon: <Newspaper className="w-5 h-5" />,
      label: "Newspaper Analysis"
    },
    {
      href: "/mock-interview",
      icon: <Mic className="w-5 h-5" />,
      label: "Mock Interview"
    },
    {
      href: "/daily-quiz",
      icon: <FileQuestion className="w-5 h-5" />,
      label: "Daily Quiz"
    },
    {
      href: "/writing-practice",
      icon: <PenLine className="w-5 h-5" />,
      label: "Writing Practice"
    }
  ];

  const resourceLinks = [
    {
      href: "/prelims-questions",
      icon: <FileQuestion className="w-5 h-5" />,
      label: "Prelims Q-Bank"
    },
    {
      href: "/mains-questions",
      icon: <PenLine className="w-5 h-5" />,
      label: "Mains Q-Bank"
    }
  ];

  const supportLinks = [
    {
      href: "/syllabus",
      icon: <Book className="w-5 h-5" />,
      label: "Syllabus"
    },
    {
      href: "/group-study",
      icon: <Users className="w-5 h-5" />,
      label: "Group Study"
    }
  ];

  const containerClasses = `hidden lg:flex flex-col gap-4 ${className} ${compact ? 'p-2' : 'p-4'}`;
  
  return (
    <div className={`flex flex-col h-full ${compact ? 'px-2 py-4' : 'p-4'} ${className} relative z-10`}>
      {/* Subtle gradient overlays for depth */}
      <div className={`${glassmorphicStyles.gradientOverlay} ${glassmorphicStyles.blueGradient}`}></div>
      
      {/* Logo area with glow effect */}
      <motion.div 
        className="flex items-center gap-2 px-2 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.3)]">
          <span className="text-primary-foreground font-semibold text-sm">PT</span>
        </div>
        <Link href="/dashboard" className="font-headline text-xl font-bold animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
          PrepTalk
        </Link>
      </motion.div>
      
      {/* Navigation */}
      <nav className={`flex flex-col gap-4 flex-grow ${compact ? 'p-2' : 'p-4 pt-0'}`}>
        <div className="px-2 pb-1">
          <h2 className="mb-3 text-xs font-semibold tracking-tight opacity-70">NAVIGATION</h2>
          <nav className="space-y-1">
            {mainLinks.map((link) => (
              <motion.div whileHover="hover" variants={hoverAnimation} key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all",
                    usePathname() === link.href 
                      ? "bg-white/10 backdrop-blur-sm text-foreground shadow-sm border-l-2 border-primary" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>
        
        <Separator className="my-1 bg-border/50" />
        <div className="px-2 pb-1">
          <h2 className="mb-3 text-xs font-semibold tracking-tight opacity-70">QUESTION BANK</h2>
          <nav className="space-y-1">
            {resourceLinks.map((link) => (
              <motion.div whileHover="hover" variants={hoverAnimation} key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all",
                    usePathname() === link.href 
                      ? "bg-white/10 backdrop-blur-sm text-foreground shadow-sm border-l-2 border-primary" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>
        
        <Separator className="my-1 bg-border/50" />
        <div className="px-2 pb-1">
          <h2 className="mb-3 text-xs font-semibold tracking-tight opacity-70">SUPPORT</h2>
          <nav className="space-y-1">
            {supportLinks.map((link) => (
              <motion.div whileHover="hover" variants={hoverAnimation} key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all",
                    usePathname() === link.href 
                      ? "bg-white/10 backdrop-blur-sm text-foreground shadow-sm border-l-2 border-primary" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>
      </nav>
      
      {/* Help Section */}
      <div className="mt-auto space-y-2 p-4 pt-0">
        <motion.div 
          className="p-4 bg-muted/50 backdrop-blur-sm border border-border/20 rounded-lg text-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <HelpCircle className="mx-auto w-8 h-8 text-primary mb-2"/>
          <div className="mt-6 space-y-6">
            <Button size="sm" variant="outline" className="mt-3 w-full">Ask Anything</Button>
          </div>
        </motion.div>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 p-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-5 h-5"/> Log Out
        </Button>
      </div>
    </div>
  );
};

export default LeftSidebar;