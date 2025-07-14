# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PrepTalk is a Next.js Firebase Studio application for UPSC exam preparation featuring AI-powered tools for newspaper analysis, mock interviews, quiz generation, and writing practice. The application uses a sophisticated multi-agent framework with Firebase backend services.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack on port 9002
- `npm run build` - Build the application for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks
- `npm run typecheck` - Run TypeScript compiler without emitting files

### Testing
- `npm test` - Run Jest test suite
- `npm run test:stream` - Test AI streaming functionality
- `npm run test:mock-interview` - Test mock interview system

### AI Development (Genkit)
- `npm run genkit:dev` - Start Genkit development server
- `npm run genkit:watch` - Start Genkit with watch mode for auto-reload

## Architecture Overview

### Frontend Structure
- **Next.js 15.3.3** application with TypeScript
- **App Router** pattern in `src/app/`
- **Component Library** using Radix UI and custom components in `src/components/`
- **Tailwind CSS** for styling with custom design system

### Backend & AI Services
- **Firebase Functions** for backend logic in `functions/`
- **Multi-Agent Framework** in `src/ai/multi-agent-framework/` - Central orchestrator for AI tasks
- **Specialized AI Flows** in `src/ai/flows/` for different exam preparation features
- **Newspaper Analysis System** in `src/ai/newspaper-analysis/` with modular architecture

### Key AI Features
1. **Newspaper Analysis** - UPSC-specific content analysis with syllabus validation
2. **Mock Interview System** - AI-powered interview simulation
3. **Quiz Generation** - Dynamic question creation from PDFs and content
4. **Writing Practice & Evaluation** - Essay assistance and scoring
5. **Daily Quiz System** - Adaptive learning with progress tracking

### Database & Storage
- **Firestore** as primary database with custom rules in `firestore.rules`
- **Firebase Storage** for file uploads and media
- **Firebase Auth** for user management

### State Management & Services
- **Zustand** for client-side state management
- **Service Layer** in `src/services/` for business logic
- **Custom Hooks** in `src/hooks/` for reusable logic

## Firebase Configuration

The project uses Firebase for:
- **Hosting** - Static site deployment
- **Functions** - Backend API endpoints
- **Firestore** - Document database
- **Storage** - File storage
- **Authentication** - User management

Firebase configuration files:
- `firebase.json` - Main Firebase configuration
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Database indexes

## Testing Strategy

### Framework Setup
- **Jest** with TypeScript support via `ts-jest`
- **Testing Library** for React component testing
- **Custom test configurations** in `jest.config.js` and `jest.config.framework.js`

### Multi-Agent Framework Testing
- Comprehensive testing suite in `src/ai/multi-agent-framework/tests/`
- Performance testing and quality assurance
- A/B testing framework for prompt optimization

## Important Development Notes

### AI Integration
- Uses **Gemini Pro**, **OpenAI**, and **Anthropic Claude** models
- **Genkit** framework for AI workflow management
- Custom multi-agent orchestrator for intelligent task routing

### Code Quality
- **TypeScript** strict mode enabled
- **ESLint** with Next.js configuration
- Custom paths configured with `@/*` alias for `src/*`

### Performance Considerations
- **Turbopack** for fast development builds
- **Next.js optimizations** for production
- **Firebase Performance Monitoring** integration

## Project Structure Highlights

```
src/
├── ai/                           # AI services and agents
│   ├── multi-agent-framework/    # Central AI orchestrator
│   ├── newspaper-analysis/       # UPSC newspaper analysis
│   └── flows/                    # Specific AI workflows
├── app/                          # Next.js App Router pages
├── components/                   # Reusable UI components
├── services/                     # Business logic services
└── lib/                          # Utility libraries
```

## Key Dependencies

### AI & ML
- `@anthropic-ai/sdk` - Claude AI integration
- `@genkit-ai/*` - Google Genkit AI framework
- `openai` - OpenAI API client

### UI & Styling
- `@radix-ui/*` - Accessible component primitives
- `tailwindcss` - Utility-first CSS framework
- `framer-motion` - Animation library

### Firebase & Backend
- `firebase` - Firebase client SDK
- `firebase-admin` - Firebase admin SDK
- Express.js for API routes