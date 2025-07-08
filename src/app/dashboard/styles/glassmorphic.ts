/**
 * Shared glassmorphic styles for the dashboard
 * Based on the Adobe Experience Cloud design reference
 */

export const glassmorphicStyles = {
  // Base container styles
  container: "bg-background/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl relative overflow-hidden",
  
  // Card styles - higher transparency than before
  card: "bg-white/10 backdrop-blur-2xl border-0 rounded-xl shadow-sm relative overflow-hidden hover:bg-white/15 transition-all duration-300",
  
  // Content panel - for larger sections
  panel: "bg-white/5 backdrop-blur-xl border-0 rounded-3xl shadow-lg relative overflow-hidden",
  
  // Gradient overlays
  gradientOverlay: "absolute inset-0 pointer-events-none opacity-20",
  blueGradient: "bg-gradient-to-br from-blue-400/20 to-purple-600/20",
  greenGradient: "bg-gradient-to-br from-green-400/20 to-teal-500/20", 
  orangeGradient: "bg-gradient-to-br from-orange-400/20 to-pink-500/20",
  mixedGradient: "bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20",
  
  // Text styles
  heading: "font-semibold text-foreground/90",
  subheading: "font-medium text-foreground/80 text-sm",
  paragraph: "text-foreground/70 text-sm",
  
  // Interactive elements
  button: "bg-white/20 hover:bg-white/30 backdrop-blur-lg border-0 rounded-lg transition-all duration-200",
  
  // Hover effects
  hoverScale: "hover:scale-[1.02] transition-transform duration-300",
  hoverGlow: "hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-shadow duration-300",
  
  // Data visualization
  chartContainer: "p-4 rounded-xl bg-white/5 backdrop-blur-lg",
  
  // Background effects
  backgroundBlur: "backdrop-blur-xl",
  subtleBorder: "border border-white/10",
};

// Helper function to combine multiple glassmorphic styles
export function combineStyles(...classNames: string[]): string {
  return classNames.join(' ');
}

// Predefined component styles
export const predefinedStyles = {
  mainContainer: combineStyles(
    glassmorphicStyles.container,
    "p-6 h-full w-full"
  ),
  dataCard: combineStyles(
    glassmorphicStyles.card,
    glassmorphicStyles.hoverScale,
    glassmorphicStyles.hoverGlow,
    "p-5"
  ),
  statsPanel: combineStyles(
    glassmorphicStyles.panel,
    "p-6 mb-6"
  ),
  chartCard: combineStyles(
    glassmorphicStyles.chartContainer,
    glassmorphicStyles.hoverGlow,
    "mb-4"
  )
};
