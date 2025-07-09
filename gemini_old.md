Implement the Mock Interview feature as detailed in `mock_interview.md`.

**Execution Plan:** Follow the phased rollout plan to build the feature.

### Phase 1: Foundation & MVP (Sprint 1-2)

**Goal:** Create a basic, functional prototype of the mock interview simulator.

1.  **Backend: Single-Agent Flow**
    *   Create the backend Genkit flow at `src/ai/flows/mock-interview-flow.ts`.
    *   Implement a single-agent (one interviewer) text-based conversation loop.
    *   Set up a new API route to expose this flow.

2.  **Frontend: Basic Interaction**
    *   Modify `src/app/mock-interview/page.tsx` to connect to the new API endpoint.
    *   Replace the static placeholder with a simple chat interface for the text interview.
    *   Ensure the "Start Interview" button initiates a session with the backend.

3.  **Backend: Audio Processing**
    *   Integrate a Speech-to-Text (STT) service within the backend flow to transcribe user audio.
    *   Implement a basic Text-to-Speech (TTS) service to voice the AI's questions.

4.  **Frontend: Audio Integration**
    *   Implement audio recording using the `MediaRecorder` API.
    *   Stream the recorded audio to the backend for transcription.
    *   Play the TTS audio received from the backend.

5.  **Data & Analytics**
    *   Define and create the `mockInterviewSessions` collection in Firestore.
    *   Implement a basic scoring algorithm based on the text transcript.
    *   Save the session transcript and basic score to Firestore upon completion.
    *   Create a simple results page to display the final transcript and score.
