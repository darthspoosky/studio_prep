'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Home,
  FileText,
  Video,
  Newspaper,
  Edit,
  Settings,
  HelpCircle,
  Grid,
  BarChart,
  User,
  X,
  Bell,
  ChevronRight,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { glassmorphism } from '@/lib/design-system';
import { SkipLinks } from '@/components/ui/skip-links';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const pathname = usePathname();
  const { user, mobileMenuOpen, setMobileMenuOpen, notifications } = useAppStore();
  const [hasScroll, setHasScroll] = useState(false);
  
  // Detect scroll for header animation
  useEffect(() => {
    const checkScroll = () => {
      setHasScroll(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip Links for keyboard navigation */}
      <SkipLinks />
      {/* Mobile Header */}
      <header 
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out',
          glassmorphism.navigation,
          hasScroll ? 'h-14' : 'h-16'
        )}
        role="banner"
        aria-label="Main navigation header"
      >
        <div className="container h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2" aria-label="PrepTalk - Go to dashboard">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center" aria-hidden="true">
                <span className="text-primary-foreground font-bold text-sm">P</span>
              </div>
              <span className={cn(
                'font-semibold transition-all duration-300',
                hasScroll ? 'text-lg' : 'text-xl'
              )}>
                PrepTalk
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationButton />
            <UserButton />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent 
          side="left" 
          className="w-[85%] max-w-[320px] p-0"
          id="mobile-navigation"
          aria-label="Mobile navigation menu"
        >
          <div className="h-full flex flex-col">
            <SheetHeader className="p-6 pb-4">
              <SheetTitle className="text-left">PrepTalk</SheetTitle>
              <SheetDescription className="text-left">
                AI-powered exam preparation
              </SheetDescription>
            </SheetHeader>
            
            <ScrollArea className="flex-1 px-2">
              <div className="flex flex-col gap-2">
                {/* User Profile Card */}
                <div className="mx-4 mb-4">
                  <UserProfileCard />
                </div>

                {/* Navigation Items */}
                <nav className="space-y-1" role="navigation" aria-label="Main navigation" id="navigation">
                  <MobileNavItem
                    href="/dashboard"
                    icon={Home}
                    label="Dashboard"
                    isActive={pathname === '/dashboard'}
                  />
                  <MobileNavItem
                    href="/daily-quiz"
                    icon={FileText}
                    label="Daily Quiz"
                    isActive={pathname.includes('/daily-quiz')}
                  />
                  <MobileNavItem
                    href="/mock-interview"
                    icon={Video}
                    label="Mock Interview"
                    isActive={pathname.includes('/mock-interview')}
                  />
                  <MobileNavItem
                    href="/newspaper-analysis"
                    icon={Newspaper}
                    label="Newspaper Analysis"
                    isActive={pathname.includes('/newspaper-analysis')}
                  />
                  <MobileNavItem
                    href="/writing-practice"
                    icon={Edit}
                    label="Writing Practice"
                    isActive={pathname.includes('/writing-practice')}
                  />
                </nav>

                <Separator className="my-4" />

                {/* Settings & Help */}
                <nav className="space-y-1" role="navigation" aria-label="Secondary navigation">
                  <MobileNavItem
                    href="/settings"
                    icon={Settings}
                    label="Settings"
                    isActive={pathname.includes('/settings')}
                  />
                  <MobileNavItem
                    href="/help"
                    icon={HelpCircle}
                    label="Help & Support"
                    isActive={pathname.includes('/help')}
                  />
                </nav>
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <main className="flex-1 pt-16 pb-20 lg:pb-0" id="main-content">
        <div className="container px-4 py-6 max-w-screen-2xl">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

// Mobile Navigation Item Component
function MobileNavItem({ 
  href, 
  icon: Icon, 
  label, 
  isActive 
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) {
  const { setMobileMenuOpen } = useAppStore();
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setMobileMenuOpen(false);
    }
  };
  
  return (
    <Link
      href={href}
      onClick={() => setMobileMenuOpen(false)}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
        'hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span>{label}</span>
      {isActive && <ChevronRight className="h-4 w-4 ml-auto" aria-hidden="true" />}
    </Link>
  );
}

// User Profile Card Component
function UserProfileCard() {
  const { user } = useAppStore();
  
  if (!user) return null;
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.photoURL || undefined} />
        <AvatarFallback>
          {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {user.displayName || 'User'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {user.email}
        </p>
      </div>
    </div>
  );
}

// Notification Button Component
function NotificationButton() {
  const { notifications } = useAppStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative"
      aria-label={`Notifications${unreadCount > 0 ? ` - ${unreadCount} unread` : ''}`}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
          aria-hidden="true"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}

// User Button Component
function UserButton() {
  const { user } = useAppStore();
  
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={user?.photoURL || undefined} />
      <AvatarFallback className="text-xs">
        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
      </AvatarFallback>
    </Avatar>
  );
}

// Mobile Bottom Navigation Component
function MobileBottomNav() {
  const pathname = usePathname();
  
  return (
    <nav 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 h-16 lg:hidden',
        glassmorphism.navigation
      )}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="h-full max-w-md mx-auto grid grid-cols-5 items-center">
        <MobileNavButton
          href="/dashboard"
          icon={Home}
          label="Home"
          isActive={pathname === '/dashboard'}
        />
        <MobileNavButton
          href="/daily-quiz"
          icon={FileText}
          label="Quiz"
          isActive={pathname.includes('/daily-quiz')}
        />
        <MobileNavButton
          href="/tools"
          icon={Grid}
          label="Tools"
          isActive={pathname === '/tools'}
          primary
        />
        <MobileNavButton
          href="/progress"
          icon={BarChart}
          label="Stats"
          isActive={pathname.includes('/progress')}
        />
        <MobileNavButton
          href="/profile"
          icon={User}
          label="Profile"
          isActive={pathname.includes('/profile')}
        />
      </div>
      
      {/* Safe area spacing for notched devices */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

// Mobile Navigation Button Component
function MobileNavButton({
  href,
  icon: Icon,
  label,
  isActive,
  primary = false,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  primary?: boolean;
}) {
  const rippleRef = React.useRef<HTMLDivElement>(null);
  
  const createRipple = (event: React.MouseEvent) => {
    const button = event.currentTarget;
    const ripple = rippleRef.current;
    
    if (ripple) {
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      ripple.classList.remove('animate-ping');
      void ripple.offsetWidth; // Force reflow
      ripple.classList.add('animate-ping');
    }
  };
  
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center justify-center h-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
      onClick={createRipple}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`${label}${isActive ? ' - current page' : ''}`}
    >
      <div className={cn(
        'flex flex-col items-center justify-center transition-all duration-200',
        primary ? 'relative -mt-6' : ''
      )}>
        {primary ? (
          <div className={cn(
            'h-12 w-12 rounded-full flex items-center justify-center shadow-lg',
            isActive 
              ? 'bg-primary text-primary-foreground scale-110' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        ) : (
          <Icon className={cn(
            'h-5 w-5 transition-colors duration-200',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )} aria-hidden="true" />
        )}
        
        <span className={cn(
          'text-[10px] mt-1 font-medium transition-colors duration-200',
          primary && 'mt-2',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}>
          {label}
        </span>
        
        {/* Active indicator */}
        {isActive && !primary && (
          <div className="absolute bottom-0 w-1 h-1 bg-primary rounded-full" />
        )}
      </div>
      
      {/* Ripple effect */}
      <div 
        ref={rippleRef} 
        className="absolute bg-primary/10 rounded-full pointer-events-none"
      />
    </Link>
  );
}

// Responsive Container Component
export function ResponsiveContainer({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8',
      className
    )}>
      {children}
    </div>
  );
}

// Grid Component for responsive layouts
export function ResponsiveGrid({ 
  children, 
  className,
  cols = { base: 1, md: 2, lg: 3 }
}: { 
  children: React.ReactNode;
  className?: string;
  cols?: { base: number; md?: number; lg?: number; xl?: number };
}) {
  const gridClasses = cn(
    'grid gap-4',
    `grid-cols-${cols.base}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  );
  
  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

// Safe Area Component for mobile devices
export function SafeArea({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]',
      className
    )}>
      {children}
    </div>
  );
}