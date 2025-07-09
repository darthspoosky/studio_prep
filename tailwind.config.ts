import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        body: ['var(--font-inter)', 'sans-serif'],
        headline: ['var(--font-space-grotesk)', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'hero-glow': {
          '0%, 100%': { 'text-shadow': '0 0 10px hsl(var(--primary)/0.5), 0 0 20px hsl(var(--primary)/0.3), 0 0 30px hsl(var(--primary)/0.2)' },
          '50%': { 'text-shadow': '0 0 20px hsl(var(--primary)/0.5), 0 0 30px hsl(var(--primary)/0.3), 0 0 40px hsl(var(--primary)/0.2)' },
        },
        'hero-float': {
          '0%': { transform: 'translatey(0px) rotate(0deg) scale(1)', opacity: '.9' },
          '50%': { transform: 'translatey(-30px) rotate(8deg) scale(1.05)', opacity: '1' },
          '100%': { transform: 'translatey(0px) rotate(0deg) scale(1)', opacity: '.9' },
        },
        'hero-float-alt': {
          '0%': { transform: 'translatey(0px) rotate(0deg) scale(1)', opacity: '.9' },
          '50%': { transform: 'translatey(25px) rotate(-8deg) scale(1.05)', opacity: '1' },
          '100%': { transform: 'translatey(0px) rotate(0deg) scale(1)', opacity: '.9' },
        },
        'pulse-cta': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 hsl(var(--primary) / 0.7)',
          },
          '50%': {
            transform: 'scale(1.05)',
            boxShadow: '0 0 0 10px hsl(var(--primary) / 0)',
          },
        },
        'gradient-anim': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(15deg)' },
        },
        'shimmer': {
            '0%': { 'background-position': '-200% 0' },
            '100%': { 'background-position': '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'hero-glow': 'hero-glow 4s ease-in-out infinite',
        'hero-float': 'hero-float 8s ease-in-out infinite',
        'hero-float-alt': 'hero-float-alt 12s ease-in-out infinite',
        'pulse-cta': 'pulse-cta 2s infinite',
        'gradient-anim': 'gradient-anim 6s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
