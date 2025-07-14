# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PrepTalk is a comprehensive UPSC exam preparation platform built with Next.js 15.3.3 and Firebase. It features advanced AI-powered tools for newspaper analysis, mock interviews, quiz generation, and writing practice. The application uses a sophisticated multi-agent framework with multiple AI providers (Google Gemini, OpenAI GPT-4, Anthropic Claude) and Firebase backend services.

### Tech Stack
- **Frontend**: Next.js 15.3.3, React 18.3.1, TypeScript, TailwindCSS
- **Backend**: Next.js API routes, Firebase Functions, Google Genkit AI framework
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth with role-based access control
- **State Management**: Zustand
- **Payment**: Razorpay integration
- **UI Components**: Radix UI primitives with custom component library
- **Testing**: Jest with React Testing Library

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

## Subscription Tiers

The application uses a 6-tier subscription model with stage-based progression:

1. **Free Tier** - Basic features, limited usage
2. **Foundation Tier** - Enhanced daily quiz, basic AI tools
3. **Practice Tier** - Advanced quiz features, writing practice
4. **Mains Tier** - Full writing evaluation, model answers
5. **Interview Tier** - Mock interviews, personality assessment
6. **Elite Tier** - All features, priority support, unlimited usage

## AI Services Architecture

### Multi-Agent Framework
The core AI orchestration system located in `src/ai/multi-agent-framework/`:
- **Base Agent**: Abstract class for all AI agents
- **Orchestrator**: Coordinates multiple agents for complex tasks
- **Agent Registry**: Manages available agents and their capabilities
- **Quality Tracking**: Monitors AI response quality and performance
- **Response Caching**: Reduces API calls and improves response time
- **Rate Limiting**: Manages API quotas across providers

### Specialized AI Flows
Located in `src/ai/flows/`, each flow handles specific functionality:
- **daily-quiz-flow**: Generates UPSC-style questions with difficulty adaptation
- **newspaper-analysis-flow**: Analyzes news for UPSC relevance and creates notes
- **mock-interview-flow**: Simulates interview experience with feedback
- **writing-evaluation-flow**: Multi-agent system for comprehensive answer analysis
- **pdf-to-quiz-flow**: Extracts questions from study materials
- **text-to-speech-flow**: Converts content to audio
- **transcription-flow**: Voice-to-text for interview practice
- **critical-analysis-flow**: Deep dive into complex topics
- **vocabulary-builder-flow**: Language enhancement for answer writing

## Database Structure

### Primary Collections
- `userProfiles` - Core user data and preferences
- `userSubscriptions` - Subscription details and billing
- `userOnboarding` - Onboarding progress tracking
- `userHistory` - Activity logs and usage history
- `quizAttempts` - Quiz performance and analytics
- `mainsAnswers` - Written answer submissions
- `savedQuestions` - Bookmarked questions for revision
- `pastYearQuestions` - Previous year question bank
- `userProgress` - Learning metrics and progress
- `syllabusSections` - UPSC syllabus hierarchy
- `toolUsage` - Feature usage statistics
- `ideas` - User feedback and feature requests

## Security & Authentication

### Authentication Flow
1. Firebase Auth handles user registration/login
2. AuthContext provides authentication state
3. Protected routes check authentication status
4. Admin routes require admin role verification

### Security Measures
- Firestore security rules for data access control
- API route authentication middleware
- Environment variable protection
- Payment signature verification
- Dev mode restrictions in production

## Testing Guidelines

### Running Tests
- `npm test` - Run all tests
- `npm test -- --coverage` - Generate coverage report
- `npm test -- --watch` - Watch mode for development

### Test Organization
- Component tests in `__tests__` folders next to components
- Service tests in `services/__tests__/`
- Hook tests in `hooks/__tests__/`
- Framework tests in `multi-agent-framework/tests/`

### Coverage Requirements
- Minimum 60% coverage for all metrics
- Focus on critical paths and business logic
- Mock external dependencies (Firebase, AI APIs)

## Common Development Tasks

### Adding a New AI Flow
1. Create flow file in `src/ai/flows/`
2. Define input/output schemas
3. Implement flow logic using Genkit
4. Add to flow registry
5. Create API route in `app/api/`
6. Add service layer if needed
7. Update usage tracking

### Creating New Components
1. Use Radix UI primitives when possible
2. Follow the design system in `lib/design-system.ts`
3. Ensure accessibility compliance
4. Add proper TypeScript types
5. Include unit tests

### Implementing New Features
1. Check subscription tier requirements
2. Add feature flag if experimental
3. Implement usage tracking
4. Update relevant services
5. Add appropriate error handling
6. Create tests for new functionality

## Debugging Tips

### AI-Related Issues
- Check Genkit logs in development mode
- Verify API keys in environment variables
- Monitor rate limits and quotas
- Test with different AI models
- Check response caching behavior

### Firebase Issues
- Use Firebase Emulator Suite for local development
- Check Firestore security rules
- Verify Firebase Admin SDK initialization
- Monitor Firestore usage and limits

### Performance Issues
- Use React DevTools Profiler
- Check bundle size with `npm run analyze`
- Monitor Firestore query performance
- Optimize component re-renders
- Implement proper code splitting

## Deployment Checklist

Before deploying:
1. Run `npm run build` successfully
2. Run `npm run typecheck` without errors
3. Run `npm run lint` and fix issues
4. Run tests with `npm test`
5. Check environment variables
6. Verify Firebase configuration
7. Test critical user flows
8. Update version in package.json

## Contact & Support

For questions about the codebase:
- Check existing documentation in `/docs`
- Review component storybook (if available)
- Consult team lead for architectural decisions
- File issues in project repository