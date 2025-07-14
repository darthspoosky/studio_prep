# PrepTalk Landing Page - Component Guide

This document provides a detailed, step-by-step guide to understanding and recreating the PrepTalk application's landing page. The landing page is designed to be modular, with each distinct section encapsulated in its own React component.

## 1. Overall Structure (`src/app/page.tsx`)

The foundation of the landing page is the `src/app/page.tsx` file. It acts as an assembler, importing and arranging the various landing page components in a specific order to create the final user experience.

The structure is a simple vertical stack of components within a `<main>` element:

```tsx
import Header from '@/components/layout/header';
import Hero from '@/components/landing/hero';
import ToolsShowcase from '@/components/landing/tools-showcase';
import FeedbackWall from '@/components/landing/feedback-wall';
import Differentiator from '@/components/landing/differentiator';
import SurveyCTA from '@/components/landing/survey-cta';
import Footer from '@/components/landing/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Hero />
        <ToolsShowcase />
        <FeedbackWall />
        <Differentiator />
        <SurveyCTA />
      </main>
      <Footer />
    </div>
  );
}
```

---

## 2. Component Breakdown

Each component listed below is a self-contained unit responsible for a specific section of the landing page.

### Step 1: `Header` (`@/components/layout/header.tsx`)

*   **Purpose**: Provides the consistent navigation bar at the top of the page.
*   **Key Features**:
    *   It's absolutely positioned to float over the content.
    *   It contains a single link to the homepage (`/`) styled with the "PrepTalk" brand name.
    *   The brand name uses a custom gradient and font (`font-headline`) for a distinct visual identity.

### Step 2: `Hero` (`@/components/landing/hero.tsx`)

*   **Purpose**: The first thing a user sees. It's designed to grab attention and communicate the app's core value proposition.
*   **Key Features**:
    *   **Headline**: A large, impactful headline (`<h1>`) explains what the app does. Part of the headline is wrapped in a `<span>` with a custom gradient animation to draw the eye.
    *   **Tagline**: A paragraph (`<p>`) that provides a more detailed explanation of the app's mission.
    *   **Floating Icons**: The background is populated with numerous `FloatingIcon` components. These are small, decorative icons (like `<Bot>`, `<FileQuestion>`, etc.) that use CSS animations (`animate-hero-float`) to gently drift and rotate, creating a dynamic and modern feel.

### Step 3: `ToolsShowcase` (`@/components/landing/tools-showcase.tsx`)

*   **Purpose**: To immediately and clearly present the primary features of the application.
*   **Key Features**:
    *   **Section Header**: A title and description explaining the purpose of the tools.
    *   **Tool Grid**: A responsive grid that displays four `ToolCard` components.
    *   **`ToolCard`**: Each card represents one of the app's main tools (Newspaper Analysis, Mock Interview, etc.). It includes:
        *   An icon with a unique gradient background.
        *   A title and description.
        *   A "Start Now" button that links to the respective tool's page (e.g., `/newspaper-analysis`).
        *   Hover effects, including a glowing shadow and a subtle scale/translate transform, to enhance interactivity.

### Step 4: `FeedbackWall` (`@/components/landing/feedback-wall.tsx`)

*   **Purpose**: To build social proof and trust by showcasing positive user testimonials.
*   **Key Features**:
    *   **Scrolling Marquee**: The core of this section is two horizontally scrolling rows of `TestimonialCard` components.
    *   **Animation**: The scrolling effect is achieved using `framer-motion`, which animates the `x` position of the rows in a continuous loop. The two rows scroll in opposite directions for a dynamic effect.
    *   **`TestimonialCard`**: Each card contains a user's quote, name, role/handle, and an avatar.

### Step 5: `Differentiator` (`@/components/landing/differentiator.tsx`)

*   **Purpose**: A visually engaging section to deliver the app's core philosophy: "Built with your voice. Powered by AI."
*   **Key Features**:
    *   **Scroll-Driven Animation**: This component's height is much larger than the viewport (`120vh`). It uses the `framer-motion` `useScroll` and `useTransform` hooks.
    *   **Sticky Positioning**: The content is held `sticky` in the center of the screen while the user scrolls through the component's height.
    *   **Fade & Move Effect**: As the user scrolls, the headline and tagline fade in and move up into view, remain centered, and then fade out and continue moving up. This creates a focused, cinematic effect.

### Step 6: `SurveyCTA` (`@/components/landing/survey-cta.tsx`)

*   **Purpose**: The final call-to-action, encouraging users to provide feedback, which is a core part of the app's identity.
*   **Key Features**:
    *   **Visually Distinct**: The section uses a dark background with a radial gradient to stand out.
    *   **Clear Call-to-Action**: A headline, description, and a prominent "Take the Survey" button.
    *   **Modal Trigger**: Clicking the button opens the `SurveyModal` component, which contains the interactive AI-powered survey.

### Step 7: `Footer` (`@/components/landing/footer.tsx`)

*   **Purpose**: The standard site footer containing branding, essential links, and copyright information.
*   **Key Features**:
    *   Contains the "PrepTalk" name and tagline.
    *   Includes navigation links (e.g., Roadmap, Contact, Discord).
    *   Displays the copyright notice with the current year.
