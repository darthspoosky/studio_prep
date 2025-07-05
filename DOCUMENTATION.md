# PrepTalk Project Documentation

## 1. Project Overview

**PrepTalk** is a web application designed to be an AI-powered exam preparation assistant, with a focus on competitive exams in India (e.g., UPSC, RBI, CAT). The core philosophy is "Built with your voice. Powered by AI." It combines a polished, modern user interface with intelligent features to create a personalized and engaging prep experience.

The application is built to be interactive, with real-time features like the **Idea Wall**, which is populated by user feedback submitted through an AI-driven survey.

## 2. Technology Stack

PrepTalk is built on a modern, server-centric web stack:

*   **Framework**: [Next.js](https://nextjs.org/) (App Router) - For server-side rendering, routing, and a robust React foundation.
*   **UI Library**: [React](https://react.dev/) - For building dynamic and interactive user interfaces.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapid styling.
*   **Component Library**: [ShadCN/UI](https://ui.shadcn.com/) - A collection of beautifully designed, accessible, and reusable components.
*   **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit) - A Google-developed open-source framework for building production-ready AI-powered features. It's used for survey analysis and content moderation.
*   **Database**: [Google Firestore](https://firebase.google.com/docs/firestore) - A real-time NoSQL database used for storing and live-updating the Idea Wall.
*   **Animations**: [Framer Motion](https://www.framer.com/motion/) - For creating fluid and complex animations, particularly on the landing page.
*   **Language**: [TypeScript](https://www.typescriptlang.org/) - For type safety and improved code quality.

## 3. Project Structure

The project follows a standard Next.js App Router structure with some key directories:

```
.
├── src
│   ├── app/                # Next.js App Router: contains all pages and layouts.
│   │   ├── daily-quiz/     # Page for the Daily Quiz tool.
│   │   ├── mock-interview/   # Page for the Mock Interview tool.
│   │   ├── newspaper-analysis/ # Page for the Newspaper Analysis tool.
│   │   ├── writing-practice/ # Page for the Writing Practice tool.
│   │   ├── globals.css     # Global styles and ShadCN theme variables.
│   │   ├── layout.tsx      # Root layout for the entire application.
│   │   └── page.tsx        # The main landing page.
│   │
│   ├── ai/                 # All Genkit AI-related code.
│   │   ├── flows/          # Contains individual AI flows (e.g., survey analysis).
│   │   └── genkit.ts       # Genkit initialization and configuration.
│   │
│   ├── components/         # Reusable React components.
│   │   ├── landing/        # Components specific to the landing page.
│   │   ├── layout/         # Layout components like Header and Footer.
│   │   ├── ui/             # ShadCN UI components.
│   │   └── survey-modal.tsx # The interactive survey chatbot component.
│   │
│   ├── hooks/              # Custom React hooks (e.g., useIsMobile).
│   │
│   ├── lib/                # Utility functions and library initializations.
│   │   ├── firebase.ts     # Firebase and Firestore initialization.
│   │   └── utils.ts        # General utility functions (e.g., `cn` for classnames).
│   │
│   └── services/           # Services for interacting with external APIs or databases.
│       └── ideasService.ts # Handles all interactions with the Firestore 'ideas' collection.
│
├── public/                 # Static assets (images, fonts, etc.).
└── package.json            # Project dependencies and scripts.
```

## 4. Core Features

### 4.1. Landing Page
A visually rich and animated landing page designed to showcase the app's features.
*   **Hero Section**: An engaging introduction with floating animated icons.
*   **Feature Scroll**: A complex, scroll-driven animation (different for desktop and mobile) that showcases the core tools and the real-time Idea Wall.
*   **Idea Wall**: A real-time marquee of user-submitted ideas, powered by Firestore.
*   **Survey CTA**: A call-to-action that launches the AI-powered survey.

### 4.2. Tool Pages
Dedicated pages for each of the core tools, currently designed with placeholder functionality:
*   Mock Interview
*   Daily Quiz
*   Newspaper Analysis
*   Writing Practice

Each page is styled consistently and tailored with options relevant to Indian government exams.

### 4.3. AI-Powered Survey (`survey-modal.tsx`)
A key user interaction point that has been transformed from a static form into an engaging chatbot.
*   **Conversational Flow**: Asks questions one by one in a chat-like interface.
*   **AI Analysis**: On submission, it calls a Genkit flow (`analyzeSurveyFlow`).
*   **Personalized Feedback**: The AI analyzes the user's frustrations and requests to generate a unique, personalized thank-you message.
*   **Content Moderation**: The AI flow includes a crucial content safety check. It uses Gemini's safety filters to ensure no inappropriate or unethical content is saved to the database.
*   **Anonymous Persona Generation**: To maintain user privacy, the AI generates an anonymous author persona (e.g., "Top Rank Aspirant," "UPSC Student") based on survey answers.

### 4.4. Real-time Idea Wall
A live-updating component that displays moderated ideas from the community.
*   **Firebase Integration**: Uses `onSnapshot` from the Firebase SDK to listen for real-time updates to the `ideas` collection in Firestore.
*   **Seamless Updates**: New ideas appear on the wall instantly for all users without requiring a page refresh.
*   **Visual Appeal**: Ideas are displayed in a scrolling marquee on cards with a unique glow effect.

## 5. Environment Setup

To run the project and connect to Firebase, you need to set up your environment variables.

1.  Create a file named `.env` in the root of the project.
2.  Add the following Firebase project credentials:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY_HERE"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN_HERE"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID_HERE"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET_HERE"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID_HERE"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID_HERE"
```
You can find these values in your Firebase project settings on the Firebase Console.

## 6. How to Run the Project

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run the Development Server**:
    The application runs on two parallel processes: the Next.js frontend and the Genkit AI server.
    *   In one terminal, run the Next.js app:
        ```bash
        npm run dev
        ```
    *   In a second terminal, run the Genkit development server:
        ```bash
        npm run genkit:watch
        ```

The application will be available at `http://localhost:9002`, and the Genkit development UI at `http://localhost:4000`.
