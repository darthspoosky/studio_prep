# PrepTalk Changelog & Development Guide

## 1. Introduction

This document is the central hub for tracking all future changes, enhancements, and bug fixes for the PrepTalk application. It serves as a transparent record of our development process and a clear blueprint for what I, the AI coding partner, will implement next.

Our goal is to move from ad-hoc changes to a structured, ticket-based system to ensure quality and maintainability.

## 2. Guiding Principle: Surgical Precision

All code modifications must be executed with surgical precision. This means:
*   **Minimalism**: We will only change the absolute minimum amount of code required to achieve the agreed-upon goal.
*   **Targeted Changes**: Changes will be focused and targeted, avoiding unrelated refactoring or "nice-to-have" tweaks that are outside the scope of the current task.
*   **No Unnecessary Deletions**: We will not remove code unless it is made explicitly redundant by the new implementation.

This principle minimizes the risk of introducing unintended side effects and ensures that every change is deliberate, understood, and directly contributes to the task at hand.

## 3. How This Document Works

1.  **User Request**: You provide a high-level goal or report a bug (e.g., "The MCQ explanations are unprofessional," "The app crashes when I do X").
2.  **AI Analysis & Plan**: I will analyze the request and create a new "Ticket" in this changelog. Each ticket will detail:
    *   **Problem Statement**: A clear diagnosis of the issue.
    *   **Proposed Solution**: A comprehensive plan to address the issue, including architectural decisions.
    *   **Affected Files**: A list of all files that will be modified.
    *   **Implementation Details**: Specific changes to prompts, logic, or UI components.
3.  **User Approval**: You review the plan in the ticket. If you agree, you can simply say "Proceed" or "Approved."
4.  **Implementation**: Upon your approval, I will generate the `<changes>` block to implement the plan exactly as described in the ticket, adhering to our principle of surgical precision.

---

## 4. Active Tickets

### Ticket-001: Overhaul MCQ Generation for Reliability & Professional Explanations

- **Status**: Awaiting Approval
- **Date**: 2024-07-26

#### Problem Statement

The "explanation" part of the MCQs is either missing, of low quality, or causes the entire MCQ block to break. Phrases like "as the passage states" are unprofessional and do not meet the standards for UPSC preparation.

The root cause is a fundamental architectural flaw: we are asking the AI model to generate complex, nested XML (`<mcq>`, `<option>`) as part of a single text string. AI models are not reliable for generating perfectly-structured data formats like this, leading to frequent formatting errors. When the format breaks, the frontend cannot parse it, and data like the explanation gets lost. Previous attempts to "patch" this with verification prompts have been unreliable.

#### Proposed Solution

To permanently fix this and elevate the quality, we will implement a more robust, two-step architecture based on the principle of "separation of concerns."

1.  **AI Generates Content, Not Format**: The AI's job will be simplified to what it does best: generating high-quality content. We will instruct the AI to return its analysis as a structured **JSON object**, not an XML string. This JSON will contain clean text for the question, options, and a professional-grade explanation.

2.  **Code Guarantees Formatting**: The TypeScript code within the Genkit flow will then take this clean JSON object from the AI and programmatically build the final, perfectly-formatted XML string. This step is 100% reliable and guarantees that the output sent to the frontend is always syntactically correct.

This change isolates the unpredictable AI from the strict requirements of formatting, eliminating the root cause of the problem.

#### Affected Files

1.  `src/ai/flows/newspaper-analysis-flow.ts`

#### Implementation Details

1.  **Modify `newspaper-analysis-flow.ts`**:
    *   The core `analysisPrompt` will be rewritten. Its output schema will be changed from a single string to a structured Zod schema representing the JSON we want (e.g., `QuestionGenerationOutputSchema` containing an array of MCQ objects).
    *   The prompt's instructions will be heavily enhanced to demand **professional, analytical explanations** for *each statement*, explicitly forbidding generic phrases and requiring connections to static syllabus knowledge.
    *   A new deterministic step will be added inside the `analyzeNewspaperArticleFlow` function. This code will take the JSON output from the AI and loop through it to build the final XML string. This string will then be placed into the `analysis` field of the final return object, ensuring the contract with the frontend does not change.
    *   The complex and unreliable `verificationPrompt` and `fixMCQFormatting` functions will be **removed**, as they are now obsolete.

This architectural improvement ensures that the `explanation` is always present and correctly formatted, and allows us to focus the AI's power on making its *content* world-class.

### Ticket-002: Add CI pipeline and sample tests
- **Status**: Completed
- **Date**: 2024-07-26

#### Problem Statement

Automated tests and a continuous integration workflow were missing, as noted in issue #4 of `issues.md`.

#### Proposed Solution

Introduce a minimal Jest setup with one component test and a GitHub Actions workflow to run lint, type checks, and tests on each push.

#### Affected Files

1. `.github/workflows/ci.yml`
2. `jest.config.js`
3. `package.json`
4. `src/test/setup.ts`
5. `src/components/ui/button.test.tsx`

#### Implementation Details

- Added a CI workflow that installs dependencies and runs `npm run lint`, `npm run typecheck`, and `npm test`.
- Created Jest configuration with coverage thresholds and a setup file.
- Added a simple button component test and a `test` npm script.
