# Daily Quiz Page: A Modern Approach

## 1. Vision

The new Daily Quiz page will be a dynamic and engaging experience, moving beyond a simple static quiz to become a core part of the user's daily learning routine. It will leverage the existing AI infrastructure to provide fresh, relevant, and adaptive quizzes based on current events and UPSC syllabus.

## 2. Key Features

*   **Dynamic Content:** Quizzes will be generated daily from a curated list of news sources (via `newspaper-analysis-flow`) or based on specific UPSC subjects, ensuring that the content is always timely and relevant.
*   **Themed Quizzes:** Users will be able to choose from a variety of quiz themes, such as:
    *   **General Studies:** A mix of questions from various subjects (Polity, History, Geography, Economy).
    *   **Subject-Specific:** Quizzes focused on a particular subject (e.g., Polity, History, Economy, Current Affairs).
    *   **Newspaper-Specific:** Quizzes based on articles from a specific newspaper (e.g., The Hindu, The Indian Express) - *Future Integration with Newspaper Analysis Flow*.
*   **Adaptive Difficulty:** The quiz difficulty will adjust based on the user's performance, providing a challenging but not overwhelming experience. This will be managed by the `daily-quiz-flow`.
*   **Interactive UI:** The quiz interface will be modern, interactive, and visually appealing, consistent with the existing `newspaper-analysis` page design. Features will include:
    *   A progress bar to track the user's progress through the quiz.
    *   Instant feedback on each question (correct/incorrect).
    *   Detailed explanations for each answer.
    *   A comprehensive results page with performance analysis.
*   **Gamification:** The quiz will incorporate gamification elements to make it more engaging, such as:
    *   A scoring system with points for correct answers and bonus points for speed.
    *   A leaderboard to foster a sense of competition (future).
    *   Badges and achievements for reaching milestones (future).
*   **Persistence:** Quiz attempts and results will be saved to the user's history.

## 3. User Flow

1.  **Quiz Configuration:** The user lands on the Daily Quiz page and is presented with options to select:
    *   Subject (e.g., General Studies, Current Affairs, Polity)
    *   Number of Questions (e.g., 5, 10, 15, 20)
    *   Difficulty Level (Easy, Medium, Hard, Adaptive)
2.  **Quiz Start:** The user confirms their selections and starts the quiz. The `daily-quiz-flow` is invoked to generate questions.
3.  **Question Answering:** The user answers a series of multiple-choice questions, one at a time.
4.  **Instant Feedback:** After each question, the user receives immediate feedback (correct/incorrect) and the explanation is revealed.
5.  **Navigation:** The user can move to the next question or quit the quiz.
6.  **Quiz Completion:** Once all questions are answered, the user is taken to the results page.
7.  **Results Page:** The results page displays the user's score, a breakdown of their performance, and options to review answers or start a new quiz.
8.  **History & Stats:** The quiz attempt is saved, and user stats (streak, accuracy) are updated and displayed.

## 4. Component Structure

The Daily Quiz page will be built using existing `components/ui` and new components as needed, following the patterns observed in `src/app/newspaper-analysis/page.tsx`.

*   `DailyQuizPage` (src/app/daily-quiz/page.tsx): The main page component, orchestrating the quiz flow.
*   `QuizConfigForm`: Component for selecting subject, number of questions, and difficulty.
*   `QuizQuestionCard`: Displays a single question with options, handles user selection, and shows feedback/explanation. (Similar to `MCQ` component in newspaper analysis).
*   `QuizProgressBar`: Visualizes progress through the quiz.
*   `QuizResultsDisplay`: Shows the final score and performance summary.
*   `UserStatsCard`: Displays daily streak, overall accuracy, and weekly goals.

## 5. AI Integration

*   The `daily-quiz-flow.ts` (`src/ai/flows/daily-quiz-flow.ts`) will be the primary AI integration point for generating quiz questions.
*   The flow will receive `subject`, `numQuestions`, and `difficulty` as input.
*   The `quizGeneratorAgent` and `quizVerificationAgent` within the flow will ensure high-quality, relevant questions.
*   Future integration: Potentially leverage `analyzeNewspaperArticleFlow` to generate quizzes directly from daily news articles.

## 6. Design Inspiration

The design of the Daily Quiz page will be consistent with the existing design of the PrepTalk platform, particularly drawing inspiration from `src/app/newspaper-analysis/page.tsx`.

*   **Layout:** Two-column layout for configuration/stats and the main quiz area, similar to the input/output sections of newspaper analysis.
*   **Styling:** Utilize `Tailwind CSS` and `shadcn/ui` components for a clean, modern, and responsive design.
*   **Animations:** Employ `framer-motion` for smooth transitions and interactive elements.
*   **Visuals:** Use icons (`lucide-react`), badges, and progress indicators to enhance user engagement.
*   **Theming:** Adhere to the existing light/dark mode theming.

## 7. Technical Implementation

### Service Architecture

* **dailyQuizService.ts**: Core service handling quiz session management including:
  * Creating and retrieving quiz sessions
  * Managing user answers and scoring
  * Tracking daily/weekly streaks
  * Storing quiz attempt statistics
* **daily-quiz-flow.ts**: AI flow responsible for generating quiz questions based on:
  * Selected subject area
  * Difficulty level (easy, medium, hard, adaptive)
  * Number of questions requested

### State Management

* The Daily Quiz page uses React state hooks to manage the quiz flow:
  * `QuizState` enum (`NOT_STARTED`, `LOADING`, `IN_PROGRESS`, `COMPLETED`, `ERROR`) to track the current stage
  * `questionIndex` for navigating through questions
  * `difficultyLevel` using both string representation (UI) and numeric value (API) to ensure type safety
  * `score` and `scorePercentage` for tracking performance
  * Custom state for subject selection, question count, and user selections

### Type System

* Strong TypeScript typing throughout the implementation:
  * `ServiceQuizSession` interface defining the quiz session structure
  * `QuizQuestion` and `QuizAnswer` types for question/answer data
  * Explicit typing for all API responses and state variables
  * Enum types for quiz states and difficulty levels

### Error Handling

* Comprehensive error handling approach:
  * API call failures captured and displayed with user-friendly messages
  * Fallback UI states for error conditions
  * Graceful degradation when AI services are unavailable
  * Type safety checks to prevent runtime errors

## 8. Areas for Consideration

*   **Quality Assurance:** Continue to monitor and improve the quality and accuracy of AI-generated questions.
*   **Scalability:** Ensure the quiz generation and session management can scale with increasing user numbers.
*   **Error Handling:** Robust error handling for AI flow failures or network issues.
*   **User Feedback:** Implement mechanisms for users to report issues with questions or provide feedback.
*   **Accessibility:** Ensure the quiz interface is accessible to all users.
*   **Gamification Expansion:** Plan for future features like leaderboards, more diverse achievements, and social sharing.
*   **Content Diversity:** Explore generating questions beyond multiple-choice, such as fill-in-the-blanks or true/false, in future iterations.