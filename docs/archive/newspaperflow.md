# PrepTalk: Newspaper Analysis End-to-End Flow

This document provides a comprehensive, step-by-step breakdown of the Newspaper Analysis feature, from user interaction to the final display of AI-generated questions.

## 1. Frontend: User Initiates Analysis

The process begins on the `/newspaper-analysis` page.

1.  **Input Selection**: The user chooses to provide an article either by pasting a URL into an input field or by pasting the full article text into a textarea.
2.  **Configuration**: The user selects their desired `analysisFocus` (e.g., "Generate Questions"), `outputLanguage`, and `examType` from dropdown menus.
3.  **Submission**: The user clicks the "Analyze Article" button.
4.  **UI State**: The frontend immediately enters a loading state, showing spinners and disabling the form to prevent duplicate submissions.

## 2. Frontend: Article Fetching (URL Mode Only)

If the user provided a URL, the frontend performs a crucial pre-processing step.

-   **API Call**: An asynchronous `fetch` request is made to our own backend API endpoint: `GET /api/readArticle?url=<encoded_article_url>`.
-   **Purpose**: This is done to bypass browser CORS (Cross-Origin Resource Sharing) restrictions that would prevent the user's browser from directly fetching content from another website (like a news site).

## 3. Backend: Article Parsing (`/api/readArticle`)

This server-side API endpoint is a dedicated utility for cleaning up web pages.

1.  **Fetch HTML**: The server receives the URL, uses `fetch` to download the raw HTML of the news article.
2.  **Create Virtual DOM**: It uses the `jsdom` library to create a server-side "virtual browser" environment and loads the fetched HTML into it.
3.  **Extract Core Content**: The `@mozilla/readability` library is used to process this virtual DOM. Readability is an algorithm (originally from Firefox's Reader View) that intelligently finds the main "reader-able" content of a page, stripping away all non-essential elements like ads, navigation bars, footers, and sidebars.
4.  **Return Clean Text**: The endpoint sends a JSON response `{ "text": "The full, clean article text..." }` back to the frontend.

At this point, the frontend has the clean article text, whether it was fetched from a URL or pasted directly by the user.

## 4. Frontend -> Backend: Invoking the AI Flow

-   **Server Action Call**: The frontend calls the `analyzeNewspaperArticle` function, which is a Next.js Server Action. This is the entry point into the main AI logic.
-   **Payload**: It passes an object containing the `sourceText`, `examType`, `analysisFocus`, and other user-selected options.

## 5. The AI Agent: `analyzeNewspaperArticleFlow`

This is the core of the system, defined in `src/ai/flows/newspaper-analysis-flow.ts`. It executes a multi-step, logical process.

### **Step 5.1: Setup & Knowledge Loading**

-   The flow receives the input payload.
-   It loads the UPSC syllabus content from the markdown files located in `src/ai/knowledge/`. This text is used as a foundational knowledge base for the AI, ensuring its analysis is grounded in the actual exam curriculum. This data is cached in memory to speed up subsequent requests.

### **Step 5.2: The First AI Gate - The "Relevance Analyst"**

The system first determines if the article is even worth analyzing. This saves significant processing time and cost on irrelevant articles.

-   **Prompt Execution**: The flow calls `relevanceCheckPrompt`.
-   **AI Persona**: The AI is instructed to act as a **UPSC Syllabus Analyst**.
-   **AI Task**:
    -   It compares the `sourceText` against the loaded `prelimsSyllabus` and `mainsSyllabus`.
    -   It uses strict criteria to assess relevance, looking for direct syllabus mappings and exam utility.
    -   It identifies the single most specific, granular syllabus topic the article relates to (e.g., not just "GS-II", but "GS Paper II - Governance - E-governance applications").
-   **AI Output**: The model is forced to return a structured `RelevanceCheckOutputSchema` object: `{ isRelevant: boolean, syllabusTopic: string | null, reasoning: string, confidenceScore: number }`.
-   **Decision Gate**:
    -   If `isRelevant` is `false`, the flow **terminates immediately**. It returns a user-friendly message explaining why the article was rejected.
    -   If `isRelevant` is `true`, the flow proceeds to the next step, carrying the `syllabusTopic` forward.

### **Step 5.3: The Second AI Gate - The "UPSC Question Setter"**

This is the main content generation step. The prompt used depends on the `analysisFocus`. We'll focus on "Generate Questions".

-   **Prompt Execution**: The flow calls the `questionGenerationPrompt`.
-   **AI Persona**: The AI is instructed to act as an **expert UPSC Question Setter with 15+ years of experience**. The prompt is highly detailed, providing strict templates, quality standards, and option strategies.
-   **AI Task**:
    -   Generate a 2-3 sentence, text-only summary.
    -   Generate an array of **JSON objects** for Prelims MCQs. Each object contains keys like `question`, `options` (which is an array of strings), `explanation`, `subject`, and `difficulty`. **Crucially, the AI is NOT asked to generate XML here.**
    -   Generate an array of **JSON objects** for Mains questions, with keys like `question` and `guidance`.
-   **AI Output**: The model returns a single, large JSON object conforming to `QuestionGenerationOutputSchema`, containing the summary and the two arrays of question data.

### **Step 5.4: Deterministic Formatting (Code, Not AI)**

This is the critical step that ensures reliable, perfectly formatted output. This logic resides in the TypeScript flow, not in a prompt.

1.  **Process Prelims Questions**:
    -   The flow gets the `prelims` array from the AI's JSON output.
    -   It iterates (loops) through this array.
    -   For each question object, it uses simple string concatenation to programmatically build the final XML string.
    -   Example: `const mcqString = \`<mcq question="${q.question}" ...>\` + q.options.map(o => \`<option ...>${o.text}</option>\`).join('\\n') + \`</mcq>\`;`
    -   This guarantees that every MCQ has the correct tags, attributes, and structure, completely eliminating the risk of AI formatting errors.

2.  **Process Mains Questions**:
    -   It iterates through the `mains` array.
    -   For each object, it programmatically builds a markdown string with the correct `##` and `###` headings.

### **Step 5.5: Final Packaging & Return**

-   The flow assembles the final `NewspaperAnalysisOutput` object. This contains the perfectly formatted `analysis` (Prelims MCQs) and `mainsQuestions` strings, the `summary`, token usage statistics, and calculated `cost`.
-   This complete object is returned from the Server Action to the frontend.

## 6. Frontend: Displaying the Results

The `/newspaper-analysis` page receives the final object and updates its state.

1.  **Loading State Ends**: The spinners are hidden, and the UI becomes active.
2.  **Render Summary**: The `summary` string is displayed, and the "Listen" button becomes active.
3.  **Render MCQs**:
    -   The `analysis` string (containing the XML for Prelims questions) is passed to the `MCQList` component.
    -   This component uses a simple string parsing method (`match(/<mcq...>/g)`) to split the string into individual question blocks.
    -   For each block, it extracts the `question`, `explanation`, `options`, etc., using regex or string splitting.
    -   It then renders an interactive `<MCQ>` component for each question.
4.  **Render Mains Questions**:
    -   The `mainsQuestions` string (containing markdown) is passed to the `MainsQuestionList` component.
    -   This component uses the `ReactMarkdown` library to safely render the markdown into styled HTML.

This detailed, multi-gate process with a clear separation between AI content generation and code-based formatting is designed to be robust, efficient, and reliable.
