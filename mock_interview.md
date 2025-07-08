
# Mock Interview Feature: End-to-End Documentation

**Version:** 1.0
**Date:** July 8, 2025
**Author:** Gemini

## 1. Overview

The Mock Interview feature is designed to be a premier preparation tool for candidates of various government examinations, including UPSC, State PSCs, Banking (IBPS, RBI), and others. It leverages a sophisticated AI to simulate a realistic interview experience, providing users with real-time, actionable feedback on their performance. The goal is to help aspirants master not just the content of their answers, but also their delivery, confidence, and non-verbal communication.

## 2. Current Development Status (As-Is)

**Status: Backend Genkit Flow Implemented, API Route & Frontend Integration Pending**

As of the current version, the mock interview feature has its core Genkit AI flow implemented, but the API route and frontend integration are still pending.

- **Frontend:** A page exists at `/mock-interview` allowing users to configure a session. It is not yet connected to the backend.
- **Backend:** The core Genkit AI flow (`src/ai/flows/mock-interview-flow.ts`) for single-agent text-based interviews is implemented. The API route (`src/app/api/mock-interview/route.ts`) to expose this flow is pending.
- **Functionality:** The "Start Interview" button is not yet functional with the new backend. User selections are not yet processed by the backend.

## 3. As-Is Architecture

### 3.1. Frontend

The current frontend is a single page built with Next.js and React.

- **File Location:** `src/app/mock-interview/page.tsx`
- **Frameworks/Libraries:**
    - Next.js 14 (App Router)
    - React 18
    - TypeScript
    - Tailwind CSS
    - **UI Components:** `shadcn/ui` is used for all visual elements (`Card`, `Button`, `Select`, `Label`, `Textarea`).
- **Core Components:**
    - `Header` and `Footer`: Standard application layout components.
    - `MockInterviewPage`: The main component that renders the UI.
- **State Management:**
    - `useState` is used for managing simple component-level state (`isLoading`).
    - `useAuth` context is used to ensure only authenticated users can access the page.
- **User Flow:**
    1. User navigates to the `/mock-interview` page.
    2. The UI presents a configuration card.
    3. User can select an "Interview Type", "Difficulty Level", and paste a "Role Profile".
    4. The right side of the screen shows a placeholder for the AI interviewer video feed.
    5. Clicking "Start Interview" shows a toast message.

### 3.2. Backend

There is currently **no backend implementation** for the mock interview feature.

## 4. Future Vision & Enhancement Roadmap

This section outlines a detailed, multi-phased plan to build a world-class AI mock interview tool.

### Phase 1: Core MVP (Minimum Viable Product)

**Goal:** Implement a functional, end-to-end mock interview session with audio analysis.

**Features:**
1.  **AI-Powered Questioning:** The AI asks relevant questions based on the user's selected interview type and difficulty.
2.  **Audio Recording & Transcription:** The user's answers are recorded, converted to text in real-time.
3.  **Content-Based Feedback:** The AI provides a post-interview report analyzing the substance and structure of the user's answers.

**Implementation Guidelines:**

-   **Backend (New File):** Create a new Genkit flow at `src/ai/flows/mock-interview-flow.ts`.
-   **API Endpoint:** The flow will be exposed via a Firebase Function.
-   **Frontend:**
    -   Use `navigator.mediaDevices.getUserMedia({ audio: true })` to request microphone access.
    -   Use the `MediaRecorder` API to capture audio.
    -   Send the audio data to the backend API (e.g., via a WebSocket connection for lower latency).
-   **Backend AI Flow (`mock-interview-flow.ts`):**
    1.  **Initiate Flow:** The flow starts when the user clicks "Start Interview", receiving the configuration (type, difficulty, role profile).
    2.  **Question Generation:** Use a generative model (e.g., Gemini) to generate the first question. The prompt should be: `"Act as an expert interviewer for a [interview_type] exam at [difficulty] level. Ask the first question."`
    3.  **Text-to-Speech (TTS):** Convert the generated question text into audio (e.g., using Google Cloud TTS) and stream it back to the frontend to be played for the user.
    4.  **Speech-to-Text (STT):** As the user speaks, the frontend streams their audio to the backend. Use an STT service (e.g., Google Cloud Speech-to-Text) to transcribe the audio.
    5.  **Answer Analysis:** Once the user finishes answering, send the full transcript to the generative model. Prompt: `"The user provided this answer: '[transcript]'. Evaluate it for clarity, relevance, and structure. Prepare to ask the next follow-up question."`
    6.  **Loop:** Repeat steps 2-5 for a set number of questions (e.g., 5-7 for an MVP).
    7.  **Final Report:** After the last question, compile all answer evaluations into a comprehensive report and store it in Firestore.

-   **Data Schema (Firestore):**
    -   `mockInterviewSessions` (Collection):
        -   `userId`
        -   `config` (type, difficulty)
        -   `status` (completed, in-progress)
        -   `createdAt`
        -   `finalReport` (string or reference to report document)

### Phase 2: Advanced Analysis & Video Integration

**Goal:** Introduce video analysis for non-verbal feedback and create a rich, interactive experience.

**Features:**
1.  **Video Interviewing:** The user's camera is activated for a face-to-face session with the AI.
2.  **Non-Verbal Feedback:** The AI analyzes body language, eye contact, and facial expressions.
3.  **Speech Pattern Analysis:** The system provides feedback on speaking pace (words per minute), filler word usage (`um`, `ah`), and tone modulation.
4.  **Interactive Dashboard:** A post-interview dashboard with video playback synced to the transcript and feedback.

**Implementation Guidelines:**

-   **Frontend:**
    -   Request camera access: `getUserMedia({ video: true, audio: true })`.
    -   Display the user's video feed in the UI.
    -   Use a library like `RecordRTC` or stream the video feed directly using WebRTC to the backend for analysis.
-   **Backend:**
    -   **Video Analysis:** This is computationally intensive.
        -   **Option A (Cloud Services):** Periodically send frames to a service like Google Cloud Vision AI to detect facial expressions (sentiment) and head pose (eye contact).
        -   **Option B (Custom Model):** For more advanced analysis, a custom computer vision model might be required, which is a significant undertaking.
    -   **Speech Analysis:** The STT service often provides word timings. This can be used to calculate words per minute. Filler words can be identified from the transcript.
    -   **Enhanced AI Prompt:** The prompt to the generative model will now include non-verbal data: `"The user answered: '[transcript]'. During the answer, their sentiment was [neutral/positive], and they used [X] filler words. Evaluate the answer and provide feedback on both content and delivery."`
-   **Post-Interview Dashboard:**
    -   Create a new page, e.g., `/history/mock-interview/[session_id]`.
    -   This page will feature a video player, the transcript, and time-stamped feedback points that highlight specific moments in the interview.

### Phase 3: Hyper-Personalization & Gamification

**Goal:** Make the tool a long-term development partner for the user.

**Features:**
1.  **DAF/Resume Analysis:** Users can upload their Detailed Application Form (UPSC) or resume to generate a highly personalized interview based on their specific background and experience.
2.  **Interviewer Personas:** Allow users to choose the AI's personality (e.g., "Stress Interviewer," "Friendly Chairman," "Technical Expert").
3.  **Progress Tracking:** Visualize user improvement over time across different competencies (e.g., communication, subject knowledge, confidence).
4.  **Peer Benchmarking:** Anonymously compare a user's performance metrics against the average performance of other users preparing for the same exam.

**Implementation Guidelines:**

-   **DAF/Resume Analysis:**
    -   Add a file upload component to the configuration screen.
    -   Use a document parsing library or an AI model to extract key information from the uploaded document (education, work experience, hobbies).
    -   Incorporate this extracted text into the initial prompt for the generative model to create tailored questions. Prompt: `"You are an expert UPSC interviewer. The candidate's DAF contains the following information: [extracted_daf_text]. Start an interview based on this profile."`
-   **Interviewer Personas:** Create different base prompts for the generative model to define its personality and questioning style.
-   **Progress Tracking:** Store all session metrics in Firestore, linked to the `userId`. Use a charting library (e.g., `recharts`) on the user's dashboard to display historical data.

## 5. Conclusion

The Mock Interview feature has the potential to be a cornerstone of the PrepTalk platform. By moving from the current placeholder UI to a fully-featured, AI-driven tool, we can offer an unparalleled training experience. The phased approach outlined above provides a clear path to developing a robust, scalable, and highly valuable product for government exam aspirants.
# Mock Interview Feature Roadmap: UPSC Interview Simulator

## Executive Summary
Based on the analysis of Anudeep Durishetty's interview experience and the IGP 2023-24 guidance, I propose a comprehensive AI-powered mock interview platform that addresses the unique challenges UPSC aspirants face: DAF-centric questioning, multi-member board dynamics, and holistic personality assessment.

## 1. Feature Matrix

### Must-Have Features (MVP - Sprint 1-3)

| Feature | Description | Rationale |
|---------|-------------|-----------|
| **Real-time Streaming Conversation** | • WebSocket-based bidirectional streaming<br>• Sub-200ms latency for natural flow<br>• Interrupt handling ("Sorry, can you repeat?") | Per Anudeep: "30-40 minute" sessions require natural conversation flow |
| **Multi-Agent Board Simulation** | • 5 distinct AI personas (1 Chair + 4 members)<br>• Role-based questioning patterns<br>• 20-25 questions per session | IGP doc shows actual board composition varies; authenticity matters |
| **DAF-Powered Question Bank** | • Auto-parse uploaded DAF<br>• Generate 50+ personalized questions<br>• Link hobbies/background to current affairs | Anudeep: "pre-empt as many questions as possible from your DAF" |
| **Basic Analytics Dashboard** | • Per-question scores (clarity/content)<br>• Filler word count<br>• Session duration tracking | Critical for self-assessment post-interview |
| **Voice Analysis** | • Real-time STT with pace detection<br>• Speaking rate (WPM)<br>• Volume/confidence meter | IGP: "speak slowly, softly, and clearly" |

### Delightful Features (Sprint 4-5)

| Feature | Description | Rationale |
|---------|-------------|-----------|
| **Stress & Bouncer Detection** | • Tag questions as core/followup/stress<br>• Highlight "bouncer" moments<br>• Composure scoring during stress | Anudeep faced "Aryan migration" bouncer; aspirants need practice |
| **Live Transcript with Annotations** | • Rolling transcript display<br>• Color-coded speaker identification<br>• Bookmark key moments | Helps review specific exchanges |
| **Bilingual Support** | • Hindi/English code-switching<br>• Regional accent TTS options<br>• Vernacular question variants | IGP myth-buster: "English not mandatory" |
| **Body Language Coaching** | • Optional webcam for posture tracking<br>• Eye contact measurement<br>• "Slouch alerts" | IGP emphasizes "gait and posture" importance |
| **Heat-map Timeline** | • Visual timeline of performance<br>• Deviation/pause indicators<br>• Clickable replay segments | Anudeep: "hyper-conscious" candidates need granular feedback |

### Future Features (Sprint 6+)

| Feature | Description | Rationale |
|---------|-------------|-----------|
| **Board Persona Selector** | • Choose specific board chairs (Soni/Shukla)<br>• Adjust member specializations<br>• Historical board pattern analysis | Different boards have different styles (per IGP profiles) |
| **Peer Benchmarking** | • Anonymous score comparisons<br>• Success rate by question type<br>• Community-sourced tips | Motivates improvement through healthy competition |
| **AI Interview Coach** | • Pre-session confidence booster<br>• Mid-session subtle hints<br>• Post-session action plan | Anudeep's meditation/exercise routine shows mental prep matters |
| **VR/AR Integration** | • Immersive Dholpur House replica<br>• Spatial audio for realism<br>• Haptic feedback for stress | Ultimate immersion for final-stage prep |

## 2. Feature Rationale Deep-Dive

### Real-time Streaming Architecture
**Pain Point**: Traditional chatbots feel robotic; UPSC interviews are conversational.
**Solution**: WebSocket streaming with chunked LLM responses + parallel TTS generation ensures <200ms perceived latency. Users can interrupt mid-sentence, mimicking real board dynamics.

### Multi-Agent Orchestration
**Insight from IGP**: Board members have distinct backgrounds (e.g., Lt. Gen. Raj Shukla = defense focus).
**Implementation**:
```
1. Chair opens with DAF warm-up (2-3 Qs)
2. Hand-off to subject expert (optional/graduation)
3. Current affairs member probes recent events
4. Stress-tester injects 1-2 "bouncer" questions
5. Ethics member poses situational dilemmas
6. Chair concludes with "missed areas" check
```

### DAF Intelligence
**Anudeep's Advice**: "Prepare a question bank of most probable questions from your DAF"
**Feature**: ML-powered DAF parser extracts entities (hobbies, hometown, education) → Vector similarity search against 10K+ real UPSC questions → Generates personalized variations.

### Analytics That Matter
**What Users Need** (from docs):
- **Clarity Score**: Based on grammar, structure, coherence
- **Content Depth**: Keywords matched against expected answer frameworks
- **Composure Index**: Variance in speech rate, pitch during stress questions
- **Filler Word Density**: "Um", "uh", "basically" per minute

**NOT** just pass/fail, but actionable insights: "You lost composure during the ethics case study at 14:32"

## 3. High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React Native  │────▶│  Cloud Run Edge  │────▶│ Firebase Auth   │
│   Mobile App    │     │    Gateway       │     │                 │
└────────┬────────┘     └────────┬─────────┘     └─────────────────┘
         │ WebSocket              │
         ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Cloud Functions (Async)                      │
├─────────────────┬──────────────────┬────────────────────────────┤
│ /interview-flow │ /speech-analysis │ /video-analysis (optional) │
│ • Multi-agent   │ • STT + pace     │ • Pose detection          │
│ • Vertex AI     │ • Filler words   │ • Eye tracking            │
│ • Question gen  │ • Confidence     │ • MediaPipe               │
└─────────────────┴──────────────────┴────────────────────────────┘
         │                   │                    │
         ▼                   ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Firestore     │ │  Cloud Storage  │ │    BigQuery     │
│ • Sessions      │ │ • Audio/Video   │ │ • Analytics     │
│ • Questions     │ │ • Transcripts   │ │ • Benchmarks    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

**Key Design Decisions**:
- **Vertex AI Streaming**: For low-latency LLM responses
- **Cloud Run**: Auto-scales for concurrent interviews
- **Firestore**: Real-time sync for live transcripts
- **BigQuery**: Aggregate analytics across all users

## 4. Phased Rollout Plan

### Sprint 1-2: Foundation (Weeks 1-4)
**Goal**: Basic working prototype
- [ ] Single-agent text interview flow
- [ ] Audio recording + basic STT
- [ ] Simple scoring algorithm
- **KPI**: 50 beta users complete full session

### Sprint 3: Multi-Agent MVP (Weeks 5-6)
**Goal**: Realistic board simulation
- [ ] 5-agent orchestration logic
- [ ] DAF parsing + question generation
- [ ] TTS with emotional modulation
- **KPI**: 80% users rate realism ≥4/5

### Sprint 4: Analytics Dashboard (Weeks 7-8)
**Goal**: Actionable insights
- [ ] Heat-map timeline UI
- [ ] Filler word detection
- [ ] Exportable session reports
- **KPI**: 70% users review analytics post-session

### Sprint 5: Voice & Video (Weeks 9-10)
**Goal**: Comprehensive feedback
- [ ] Real-time confidence meter
- [ ] Optional posture tracking
- [ ] Pace coaching overlays
- **KPI**: 30% enable video, satisfaction ≥4.5/5

### Sprint 6: Scale & Optimize (Weeks 11-12)
**Goal**: Production readiness
- [ ] Load testing (1000 concurrent)
- [ ] Regional CDN for low latency
- [ ] A/B test question difficulties
- **KPI**: <2% error rate, <300ms p95 latency

## 5. Success Metrics & Risks

### North Star Metrics
1. **Session Completion Rate**: Target 85%+ (current mock interviews see 60% dropoff)
2. **Weekly Active Users**: 10K+ by Month 3
3. **User Confidence Lift**: Pre/post session survey shows 40%+ improvement

### Adoption Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| "Too robotic" feedback | Invest in nuanced TTS emotions + human moderator reviews |
| Privacy concerns (video) | Explicit consent, local processing option, GDPR compliance |
| Question quality variance | Curate from 2K+ real transcripts + expert validation |
| Technical complexity | Start text-only, progressive enhancement strategy |

## 6. Competitive Differentiation

Unlike generic interview prep tools, this platform:
1. **Understands UPSC's unique multi-board format** (not just Q&A)
2. **Leverages actual board member profiles** for authentic personas
3. **Integrates DAF deeply** (not just generic questions)
4. **Provides moment-by-moment analytics** (not just final scores)
5. **Supports vernacular interviews** (critical for inclusivity)

## Next Steps
1. **User Research**: Interview 20 recent UPSC candidates on mock interview pain points
2. **Prototype Testing**: Build Sprint 1 MVP, test with 5 mentors/toppers
3. **Partnership**: Collaborate with coaching institutes for question validation
4. **Pricing Strategy**: Freemium model - 2 free sessions, ₹99/session thereafter

---

*This roadmap transforms mock interviews from anxiety-inducing ordeals into empowering practice sessions, directly addressing Anudeep's insight: "Do your best. That's a win."*
