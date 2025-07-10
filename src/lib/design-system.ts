import { cn } from './utils';

// Spacing system based on 8px grid
export const spacing = {
  none: '0',
  px: '1px',
  '0.5': '0.125rem',  // 2px
  '1': '0.25rem',     // 4px
  '1.5': '0.375rem',  // 6px
  '2': '0.5rem',      // 8px
  '2.5': '0.625rem',  // 10px
  '3': '0.75rem',     // 12px
  '3.5': '0.875rem',  // 14px
  '4': '1rem',        // 16px
  '5': '1.25rem',     // 20px
  '6': '1.5rem',      // 24px
  '7': '1.75rem',     // 28px
  '8': '2rem',        // 32px
  '9': '2.25rem',     // 36px
  '10': '2.5rem',     // 40px
  '11': '2.75rem',    // 44px
  '12': '3rem',       // 48px
  '14': '3.5rem',     // 56px
  '16': '4rem',       // 64px
  '20': '5rem',       // 80px
  '24': '6rem',       // 96px
  '28': '7rem',       // 112px
  '32': '8rem',       // 128px
  '36': '9rem',       // 144px
  '40': '10rem',      // 160px
  '44': '11rem',      // 176px
  '48': '12rem',      // 192px
  '52': '13rem',      // 208px
  '56': '14rem',      // 224px
  '60': '15rem',      // 240px
  '64': '16rem',      // 256px
  '72': '18rem',      // 288px
  '80': '20rem',      // 320px
  '96': '24rem',      // 384px
} as const;

// Typography system
export const typography = {
  // Display sizes for hero sections
  'display-2xl': 'text-7xl font-bold tracking-tight',
  'display-xl': 'text-6xl font-bold tracking-tight',
  'display-lg': 'text-5xl font-bold tracking-tight',
  'display-md': 'text-4xl font-bold tracking-tight',
  'display-sm': 'text-3xl font-bold tracking-tight',
  'display-xs': 'text-2xl font-bold tracking-tight',

  // Headings
  'h1': 'text-4xl font-semibold tracking-tight',
  'h2': 'text-3xl font-semibold tracking-tight',
  'h3': 'text-2xl font-semibold tracking-tight',
  'h4': 'text-xl font-semibold tracking-tight',
  'h5': 'text-lg font-semibold tracking-tight',
  'h6': 'text-base font-semibold tracking-tight',

  // Body text
  'text-xl': 'text-xl font-normal leading-relaxed',
  'text-lg': 'text-lg font-normal leading-relaxed',
  'text-base': 'text-base font-normal leading-normal',
  'text-sm': 'text-sm font-normal leading-normal',
  'text-xs': 'text-xs font-normal leading-normal',

  // Special text
  'lead': 'text-xl font-normal leading-relaxed text-muted-foreground',
  'caption': 'text-sm font-medium text-muted-foreground uppercase tracking-wide',
  'overline': 'text-xs font-medium text-muted-foreground uppercase tracking-wider',
  'mono': 'font-mono text-sm',
} as const;

// Color system
export const colors = {
  // Brand colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Neutral colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
} as const;

// Shadow system
export const shadows = {
  'none': 'shadow-none',
  'sm': 'shadow-sm',
  'default': 'shadow',
  'md': 'shadow-md',
  'lg': 'shadow-lg',
  'xl': 'shadow-xl',
  '2xl': 'shadow-2xl',
  'inner': 'shadow-inner',
  'outline': 'shadow-outline',
  'focus': 'shadow-focus',
  'glow': 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
  'glow-lg': 'shadow-[0_0_40px_rgba(59,130,246,0.2)]',
} as const;

// Border radius system
export const borderRadius = {
  'none': 'rounded-none',
  'sm': 'rounded-sm',
  'default': 'rounded',
  'md': 'rounded-md',
  'lg': 'rounded-lg',
  'xl': 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  'full': 'rounded-full',
} as const;

// Animation system
export const animations = {
  'fade-in': 'animate-in fade-in duration-200',
  'fade-out': 'animate-out fade-out duration-200',
  'slide-in-from-top': 'animate-in slide-in-from-top-2 duration-200',
  'slide-in-from-bottom': 'animate-in slide-in-from-bottom-2 duration-200',
  'slide-in-from-left': 'animate-in slide-in-from-left-2 duration-200',
  'slide-in-from-right': 'animate-in slide-in-from-right-2 duration-200',
  'zoom-in': 'animate-in zoom-in-95 duration-200',
  'zoom-out': 'animate-out zoom-out-95 duration-200',
  'bounce': 'animate-bounce',
  'pulse': 'animate-pulse',
  'spin': 'animate-spin',
} as const;

// Glassmorphism styles
export const glassmorphism = {
  'card': 'bg-background/60 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg',
  'card-strong': 'bg-background/80 backdrop-blur-xl border border-border/70 rounded-xl shadow-xl',
  'overlay': 'bg-background/20 backdrop-blur-md',
  'overlay-strong': 'bg-background/40 backdrop-blur-lg',
  'navigation': 'bg-background/90 backdrop-blur-xl border-b border-border/50',
  'sidebar': 'bg-background/70 backdrop-blur-xl border-r border-border/50',
} as const;

// Gradient system
export const gradients = {
  'primary': 'bg-gradient-to-r from-primary-500 to-primary-600',
  'secondary': 'bg-gradient-to-r from-secondary-500 to-secondary-600',
  'accent': 'bg-gradient-to-r from-accent-500 to-accent-600',
  'warm': 'bg-gradient-to-r from-orange-400 to-pink-400',
  'cool': 'bg-gradient-to-r from-blue-400 to-purple-400',
  'rainbow': 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400',
  'glass': 'bg-gradient-to-br from-white/10 to-white/5',
  'glass-dark': 'bg-gradient-to-br from-black/10 to-black/5',
} as const;

// Utility functions
export const getSpacing = (size: keyof typeof spacing) => spacing[size];
export const getTypography = (variant: keyof typeof typography) => typography[variant];
export const getShadow = (variant: keyof typeof shadows) => shadows[variant];
export const getBorderRadius = (variant: keyof typeof borderRadius) => borderRadius[variant];
export const getAnimation = (variant: keyof typeof animations) => animations[variant];
export const getGlassmorphism = (variant: keyof typeof glassmorphism) => glassmorphism[variant];
export const getGradient = (variant: keyof typeof gradients) => gradients[variant];

// Responsive utilities
export const responsive = {
  'mobile-only': 'block sm:hidden',
  'tablet-up': 'hidden sm:block',
  'desktop-up': 'hidden lg:block',
  'mobile-tablet': 'block lg:hidden',
  'tablet-desktop': 'hidden sm:block',
} as const;

// Component variants
export const variants = {
  button: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/50',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary/50',
    outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
  },
  card: {
    default: 'bg-card text-card-foreground border border-border rounded-lg shadow-sm',
    elevated: 'bg-card text-card-foreground border border-border rounded-lg shadow-md',
    glass: glassmorphism.card,
    outlined: 'bg-transparent border-2 border-border rounded-lg',
  },
  input: {
    default: 'border border-input bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
    ghost: 'bg-transparent border-0 focus:ring-0 focus:outline-none',
    filled: 'bg-muted border-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
  },
} as const;

// Layout utilities
export const layout = {
  container: 'mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8',
  'container-sm': 'mx-auto max-w-screen-sm px-4 sm:px-6',
  'container-md': 'mx-auto max-w-screen-md px-4 sm:px-6',
  'container-lg': 'mx-auto max-w-screen-lg px-4 sm:px-6',
  'container-xl': 'mx-auto max-w-screen-xl px-4 sm:px-6',
  'container-2xl': 'mx-auto max-w-screen-2xl px-4 sm:px-6',
  'flex-center': 'flex items-center justify-center',
  'flex-between': 'flex items-center justify-between',
  'flex-start': 'flex items-center justify-start',
  'flex-end': 'flex items-center justify-end',
} as const;

// Export helper function to combine classes
export const createVariant = (base: string, variant: string) => cn(base, variant);