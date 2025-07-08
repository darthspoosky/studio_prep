# Project Backlog

This backlog captures improvements and fixes identified while reviewing the codebase.

## Bugs
- **TypeScript errors**: `npm run typecheck` reports missing properties and type mismatches in `src/ai/flows/newspaper-analysis-flow.ts` and missing module declarations in `src/app/api/readArticle/route.ts`.
- **Implicit any types**: `src/services/ideasService.ts` uses variables typed as `any`.

## Technical Debt
- ESLint is not configured. Running `npm run lint` prompts for setup. The project should include a shared configuration and remove `ignoreDuringBuilds` from `next.config.ts`.
- TypeScript checks are ignored in `next.config.ts` via `ignoreBuildErrors`. Enforcing strict checks will improve quality.
- Automated tests are absent. Consider adding unit tests and a CI workflow.
- **Dashboard Revamp - Component Extraction**: Create widget components (ActivityHistoryWidget, PerformanceWidget, ScheduleWidget).
- **Dashboard Revamp - Data Management**: Set up React Query for data fetching; create custom data hooks (useDashboardData, useUserProgress); implement TypeScript interfaces for widget types, dashboard data models, and user statistics.
- **Dashboard Revamp - Testing Infrastructure**: Set up testing framework for components; create test utilities for mocking data; create initial component tests.

## Features
- Improve documentation in `README.md` with setup and development instructions.
- Add scripts for running lint and type checks without prompts.
- Document AI flows and data models for easier onboarding.
- **Major Quiz System Overhaul**: A complete redesign of the quiz feature to include three distinct modes (Past Year Papers, PDF-to-Quiz, Curated Bank), a dedicated performance analytics tab with AI insights, and new dashboard widgets. (See `quizpage.md` for full design document).
- **Mock Interview - API Route**: Create the API route for the mock interview flow (`src/app/api/mock-interview/route.ts`).
- **Mock Interview - Frontend Interaction**: Implement the frontend interaction for the mock interview (chat interface, "Start Interview" button functionality).
- **Mock Interview - Audio Processing**: Integrate Speech-to-Text (STT) and Text-to-Speech (TTS) services into the mock interview backend flow.
- **Mock Interview - Audio Integration**: Implement audio recording and playback on the frontend for mock interviews.
- **Mock Interview - Data & Analytics**: Implement Firestore integration for saving mock interview session data and final reports.
