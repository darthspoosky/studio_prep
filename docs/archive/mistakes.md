# Mistake Log

This file tracks mistakes made during development and the solutions applied to prevent them from happening again.

## 1. Animation Regressions and Unresponsive Components

- **Mistake:** The `FeatureScroll` component, which had a complex desktop animation, was repeatedly broken on mobile views. Initial fixes involved disabling the animation on mobile, which was a regression in user experience. Subsequent fixes were not thorough and led to the reintroduction of bugs. The glow effect on cards was also repeatedly clipped by parent containers with `overflow: hidden`.

- **Root Cause:**
    1.  Lack of a clear, robust separation between mobile and desktop component logic. A single component was trying to handle both layouts, leading to style conflicts and bugs.
    2.  Not fully testing the implications of CSS properties like `overflow: hidden` on child element effects like `box-shadow`.
    3.  Rushing to a simple fix (disabling animation) instead of implementing a proper, tailored solution for mobile (like a carousel).

- **Solution:**
    1.  **Component-Based Responsive Design:** The `FeatureScroll` component was refactored to use a `useIsMobile` hook to render one of two dedicated child components: `MobileView` or `DesktopView`.
    2.  **Tailored Animations:** This separation allows for completely different, tailored animations for each context. The mobile view now uses a performant and touch-friendly Carousel, while the desktop view retains its complex scroll-based animation. This is a more robust pattern than using CSS media queries to patch a single component.
    3.  **Proper Padding for Effects:** The glow clipping issue was solved by adding sufficient internal padding *within* the scrolling container, creating a buffer zone for the `box-shadow` effect to render without being cut off.

- **Lesson:** For complex components with vastly different mobile and desktop behaviors, create separate, dedicated child components. This is cleaner and more reliable than trying to patch a single component. Always test interactive effects (like hover) in the context of their parent containers and CSS properties.
