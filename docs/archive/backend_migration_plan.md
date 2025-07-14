
# PrepTalk: Standalone Backend Migration Plan

## 1. Introduction

This document outlines a comprehensive plan for migrating the existing integrated Next.js backend logic into a new, standalone backend service. The primary goal is to achieve a clear separation of concerns between the frontend (Next.js) and a dedicated backend, enabling independent development, scaling, and maintenance.

This is a significant architectural decision that moves away from the Next.js full-stack model towards a more traditional client-server architecture.

## 2. Recommended Backend Technology Stack

To ensure a smooth transition and leverage existing code, the following stack is recommended:

*   **Runtime**: **Node.js** - The standard for high-performance, scalable JavaScript/TypeScript applications.
*   **Framework**: **Express.js** - A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. It's the de-facto standard for building REST APIs in the Node.js ecosystem.
*   **Language**: **TypeScript** - To maintain type safety, code quality, and alignment with the existing codebase.
*   **AI Integration**: **Genkit Core SDK** - We will run Genkit as a core part of the backend server to execute our AI flows.
*   **Database Client**: **Firebase Admin SDK** - For secure, server-to-server communication with Firestore. This is more appropriate for a backend than the client-side SDK.
*   **Configuration**: **`dotenv`** - To manage environment variables for different environments (development, production).
*   **CORS Management**: **`cors` middleware** - To handle Cross-Origin Resource Sharing, which will be essential for allowing the frontend to communicate with this new backend.

## 3. Core Architectural Principles

*   **RESTful API Design**: The API should be designed around resources using standard HTTP methods.
    *   `POST /api/v1/analysis/newspaper`: Kicks off a new newspaper analysis.
    *   `POST /api/v1/survey`: Submits a user survey.
    *   `GET /api/v1/ideas`: Fetches the latest ideas for the feedback wall.
*   **Stateless Authentication**: While not currently implemented, the architecture should be stateless. If user authentication is added later, use token-based methods like JWT (JSON Web Tokens).
*   **Environment-Driven Configuration**: No secrets (API keys, service account credentials) should be hardcoded. Everything must be loaded from environment variables (`.env` file).
*   **Structured Logging**: Implement a robust logging solution (e.g., Winston or Pino) to create searchable, structured logs for easier debugging and monitoring in production.

## 4. Step-by-Step Migration Plan

### Phase 1: New Backend Project Setup

1.  **Create Project Directory**: Create a new folder, e.g., `preptalk-backend`.
2.  **Initialize Node.js Project**: `npm init -y`
3.  **Setup TypeScript**:
    *   Install dependencies: `npm install --save-dev typescript ts-node @types/node @types/express @types/cors`
    *   Create a `tsconfig.json` file to configure the TypeScript compiler.
4.  **Install Core Dependencies**: `npm install express dotenv firebase-admin cors genkit @genkit-ai/googleai`
5.  **Create Backend Project Structure**:

    ```
    preptalk-backend/
    ├── src/
    │   ├── api/
    │   │   ├── routes/              # Express routes (e.g., analysisRoutes.ts)
    │   │   └── controllers/         # Logic for each route (e.g., analysisController.ts)
    │   ├── config/
    │   │   ├── firebase.ts          # Firebase Admin SDK initialization
    │   │   └── index.ts             # Environment variable loading
    │   ├── services/
    │   │   └── ideasService.ts      # Migrated and updated database logic
    │   ├── ai/
    │   │   ├── flows/               # All existing Genkit flows
    │   │   └── genkit.ts            # Genkit initialization
    │   └── server.ts                # Main Express server setup and entry point
    ├── .env                         # Environment variables
    ├── service-account.json         # Firebase service account key (add to .gitignore!)
    ├── package.json
    └── tsconfig.json
    ```

### Phase 2: Migrating AI and Database Logic

1.  **Move `src/ai` and `src/services`**: Copy these entire directories from the Next.js project into the new `preptalk-backend/src` directory.
2.  **Update Genkit Code**:
    *   Remove the `'use server';` directive from the top of all flow files. It is a Next.js-specific directive and is not needed in a standalone Node.js environment.
3.  **Update Firebase Initialization (`src/config/firebase.ts`)**:
    *   Replace the client-side `firebase` SDK with the `firebase-admin` SDK.
    *   You will need to generate a **service account key** from your Firebase project settings (Project settings > Service accounts > Generate new private key).
    *   Save this key as `service-account.json` in the backend's root directory. **CRITICAL: Add `service-account.json` to your `.gitignore` file immediately.**
    *   Initialize the app like this:
        ```typescript
        import * as admin from 'firebase-admin';
        // You'll load the path from an environment variable
        const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });

        export const db = admin.firestore();
        ```
4.  **Update `ideasService.ts`**:
    *   Modify the functions to use the new `db` instance from `firebase-admin`.
    *   The `onIdeasUpdate` function, which relies on a client-side real-time listener, **cannot work** on the backend. You must replace it with a function like `getLatestIdeas()` that performs a one-time fetch. Real-time updates on the frontend will need to be re-implemented later using polling or WebSockets.

### Phase 3: Building the API Endpoints

1.  **Setup Express Server (`src/server.ts`)**:
    *   Import `express` and `cors`.
    *   Create the Express app instance.
    *   Apply the `cors` middleware.
    *   Define a main router that imports and uses the resource-specific routes (e.g., from `src/api/routes/`).
    *   Start the server to listen on a specific port (e.g., 3001).

2.  **Create Controllers and Routes**:
    *   **Analysis Controller (`src/api/controllers/analysisController.ts`)**:
        *   Create an `async` function, e.g., `handleNewspaperAnalysis`.
        *   It will take `req` and `res` as arguments.
        *   It will extract the article data from `req.body`.
        *   It will call the `analyzeNewspaperArticle` flow.
        *   It will send the result back using `res.json(result)` or `res.status(500).json({ error: '...' })` on failure.
    *   **Analysis Route (`src/api/routes/analysisRoutes.ts`)**:
        *   Create an Express router.
        *   Define the route: `router.post('/newspaper', handleNewspaperAnalysis);`
        *   Export the router.

3.  **Repeat for Other Features**: Create similar controllers and routes for the Survey and Ideas Wall features.

### Phase 4: Frontend Refactoring (Future Work)

This is a summary of the work required on the Next.js frontend once the backend is running.

1.  **Remove Backend Code**: Delete the `src/ai/`, `src/services/`, and `src/app/api/` directories from the Next.js project to prevent code duplication and confusion.
2.  **Update Data Fetching Logic**:
    *   In components like `newspaper-analysis/page.tsx`, replace the direct call to `analyzeNewspaperArticle` with a `fetch` call to your new backend API endpoint.
    *   Example: `const response = await fetch('http://localhost:3001/api/v1/analysis/newspaper', { method: 'POST', ... });`
3.  **Manage Environment Variables**: Create a `NEXT_PUBLIC_API_BASE_URL` variable in the frontend's `.env.local` file to point to the backend server's address.
4.  **Re-implement Real-time Features**: For the Idea Wall, change `onIdeasUpdate` to a standard `fetch` call inside a `useEffect` hook that runs when the component mounts. For true real-time functionality, you would need to implement WebSockets, which is a more advanced topic.

## 5. Deployment

*   **Backend Deployment**: The new backend is a standard Node.js application and can be deployed anywhere that supports Node.js.
    *   **Recommended**: **Google Cloud Run**. It's serverless, scales automatically (even to zero), and is perfect for containerized applications. You would need to create a `Dockerfile` for your backend.
    *   **Other Options**: Vercel Serverless Functions, AWS Lambda, Heroku.
*   **Frontend Deployment**: The Next.js frontend can continue to be deployed on its current platform (e.g., Firebase App Hosting, Vercel).
*   **CI/CD**: You will need two separate CI/CD pipelines, one for deploying the frontend and one for the backend.

## 6. Conclusion

Separating the backend is a valid architectural pattern that can offer benefits in terms of team separation and independent scaling. However, it introduces significant complexity in terms of infrastructure management, API contracts, network latency, and deployment. This plan provides the blueprint for a robust implementation should you choose to proceed with this path.
