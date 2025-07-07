# Project Backlog

This backlog captures improvements and fixes identified while reviewing the codebase.

## Bugs
- **TypeScript errors**: `npm run typecheck` reports missing properties and type mismatches in `src/ai/flows/newspaper-analysis-flow.ts` and missing module declarations in `src/app/api/readArticle/route.ts`.
- **Implicit any types**: `src/services/ideasService.ts` uses variables typed as `any`.

## Technical Debt
- ESLint is not configured. Running `npm run lint` prompts for setup. The project should include a shared configuration and remove `ignoreDuringBuilds` from `next.config.ts`.
- TypeScript checks are ignored in `next.config.ts` via `ignoreBuildErrors`. Enforcing strict checks will improve quality.
- Automated tests are absent. Consider adding unit tests and a CI workflow.

## Features
- Improve documentation in `README.md` with setup and development instructions.
- Add scripts for running lint and type checks without prompts.
- Document AI flows and data models for easier onboarding.
- **Major Quiz System Overhaul**: A complete redesign of the quiz feature to include three distinct modes (Past Year Papers, PDF-to-Quiz, Curated Bank), a dedicated performance analytics tab with AI insights, and new dashboard widgets. (See `quizpage.md` for full design document).
