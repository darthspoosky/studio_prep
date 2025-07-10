# Comprehensive Test Documentation - PrepTalk Platform

## Table of Contents

1. [Overview](#overview)
1. [Test Infrastructure Setup](#test-infrastructure-setup)
1. [Frontend Testing](#frontend-testing)
1. [Backend Testing](#backend-testing)
1. [Integration Testing](#integration-testing)
1. [End-to-End Testing](#end-to-end-testing)
1. [Performance Testing](#performance-testing)
1. [Security Testing](#security-testing)
1. [CI/CD Testing Pipeline](#cicd-testing-pipeline)
1. [Test Data Management](#test-data-management)
1. [Monitoring & Reporting](#monitoring--reporting)

-----

## 1. Overview

This document provides comprehensive testing strategies for the PrepTalk platform, covering every component, page, flow, and integration point to ensure robust CI/CD implementation.

### Testing Pyramid

```
                    E2E Tests (5%)
                 Integration Tests (15%)
                    Unit Tests (80%)
```

### Key Testing Principles

- **Test-Driven Development (TDD)** for new features
- **Behavior-Driven Development (BDD)** for user flows
- **Continuous Testing** in CI/CD pipeline
- **Risk-Based Testing** prioritization
- **Shift-Left Testing** approach

-----

## 2. Test Infrastructure Setup

### 2.1 Required Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/user-event": "^14.5.1",
    "@playwright/test": "^1.40.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "msw": "^2.0.0",
    "cypress": "^13.6.0",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.1",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "firebase-functions-test": "^3.1.0",
    "testcontainers": "^10.4.0"
  }
}
```

### 2.2 Test Configuration Files

#### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'
  ]
};
```

#### Playwright Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

-----

## 3. Frontend Testing

### 3.1 Component Testing Strategy

#### A. UI Components Testing

**Button Component Test (`src/components/ui/button.test.tsx`)**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });

  it('disables when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

**Card Component Test (`src/components/ui/card.test.tsx`)**

```typescript
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

describe('Card Components', () => {
  it('renders card structure correctly', () => {
    render(
      <Card data-testid="test-card">
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
        <CardContent>Test Content</CardContent>
      </Card>
    );

    expect(screen.getByTestId('test-card')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
```

#### B. Layout Components Testing

**LeftSidebar Test (`src/app/dashboard/components/layout/LeftSidebar.test.tsx`)**

```typescript
import { render, screen } from '@testing-library/react';
import { LeftSidebar } from '@/app/dashboard/components/layout/LeftSidebar';
import { AuthContext } from '@/contexts/AuthContext';

const mockUser = {
  uid: 'test-user',
  email: 'test@example.com',
  displayName: 'Test User'
};

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, loading: false }}>
      {component}
    </AuthContext.Provider>
  );
};

describe('LeftSidebar', () => {
  it('renders navigation links', () => {
    renderWithAuth(<LeftSidebar />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Newspaper Analysis')).toBeInTheDocument();
    expect(screen.getByText('Mock Interview')).toBeInTheDocument();
    expect(screen.getByText('Quiz')).toBeInTheDocument();
  });

  it('highlights active link', () => {
    // Mock usePathname
    jest.mock('next/navigation', () => ({
      usePathname: () => '/dashboard'
    }));

    renderWithAuth(<LeftSidebar />);
    expect(screen.getByText('Dashboard').closest('a')).toHaveClass('bg-primary/10');
  });
});
```

### 3.2 Page Testing

#### A. Dashboard Page Test (`src/app/dashboard/page.test.tsx`)

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { getUserUsage } from '@/services/usageService';
import { getUserQuizStats } from '@/services/quizAttemptsService';

// Mock services
jest.mock('@/services/usageService');
jest.mock('@/services/quizAttemptsService');
jest.mock('@/contexts/AuthContext');

const mockUsageData = {
  totalAnalyses: 15,
  todaysAnalyses: 3,
  streak: 7,
  weeklyUsage: [2, 4, 3, 5, 2, 3, 4]
};

const mockQuizStats = {
  totalAttempts: 25,
  averageScore: 78,
  streak: 5,
  improvement: 12
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    (getUserUsage as jest.Mock).mockResolvedValue(mockUsageData);
    (getUserQuizStats as jest.Mock).mockResolvedValue(mockQuizStats);
  });

  it('renders dashboard components', async () => {
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Analyses')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  it('handles data fetching errors', async () => {
    (getUserUsage as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard data')).toBeInTheDocument();
    });
  });
});
```

#### B. Newspaper Analysis Page Test

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewspaperAnalysisPage from '@/app/newspaper-analysis/page';
import { analyzeNewspaperArticle } from '@/ai/flows/newspaper-analysis-flow';

jest.mock('@/ai/flows/newspaper-analysis-flow');

describe('Newspaper Analysis Page', () => {
  const user = userEvent.setup();

  it('renders form elements', () => {
    render(<NewspaperAnalysisPage />);
    
    expect(screen.getByLabelText(/article url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/article text/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze article/i })).toBeInTheDocument();
  });

  it('submits form with URL input', async () => {
    const mockAnalysis = {
      prelims: { mcqs: [] },
      mains: { questions: [] },
      knowledgeGraph: []
    };
    
    (analyzeNewspaperArticle as jest.Mock).mockResolvedValue(mockAnalysis);

    render(<NewspaperAnalysisPage />);
    
    await user.type(
      screen.getByLabelText(/article url/i),
      'https://example.com/article'
    );
    
    fireEvent.click(screen.getByRole('button', { name: /analyze article/i }));
    
    await waitFor(() => {
      expect(analyzeNewspaperArticle).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceUrl: 'https://example.com/article'
        })
      );
    });
  });

  it('validates required fields', async () => {
    render(<NewspaperAnalysisPage />);
    
    fireEvent.click(screen.getByRole('button', { name: /analyze article/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/please provide either/i)).toBeInTheDocument();
    });
  });
});
```

#### C. Mock Interview Page Test

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MockInterviewPage from '@/app/mock-interview/page';

// Mock MediaDevices API
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    })
  }
});

describe('Mock Interview Page', () => {
  it('renders interview setup form', () => {
    render(<MockInterviewPage />);
    
    expect(screen.getByText('Interview Type')).toBeInTheDocument();
    expect(screen.getByText('Difficulty Level')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start interview/i })).toBeInTheDocument();
  });

  it('starts interview session', async () => {
    render(<MockInterviewPage />);
    
    // Fill form
    fireEvent.click(screen.getByText('Interview Type'));
    fireEvent.click(screen.getByText('Technical'));
    
    fireEvent.click(screen.getByText('Difficulty Level'));
    fireEvent.click(screen.getByText('Intermediate'));
    
    // Start interview
    fireEvent.click(screen.getByRole('button', { name: /start interview/i }));
    
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: true
      });
    });
  });
});
```

### 3.3 Hook Testing

#### Custom Hook Test (`src/hooks/useAuth.test.ts`)

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/config/firebase';

jest.mock('@/config/firebase');

describe('useAuth Hook', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
  });

  it('returns user when authenticated', async () => {
    const mockUser = { uid: 'test-user', email: 'test@example.com' };
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback(mockUser);
      return () => {};
    });

    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });
  });
});
```

-----

## 4. Backend Testing

### 4.1 API Route Testing

#### Newspaper Analysis API Test (`src/app/api/newspaper-analysis/route.test.ts`)

```typescript
import { POST } from '@/app/api/newspaper-analysis/route';
import { analyzeNewspaperArticle } from '@/ai/flows/newspaper-analysis-flow';

jest.mock('@/ai/flows/newspaper-analysis-flow');

describe('/api/newspaper-analysis', () => {
  it('processes valid article analysis request', async () => {
    const mockAnalysis = {
      prelims: { mcqs: [] },
      mains: { questions: [] }
    };
    
    (analyzeNewspaperArticle as jest.Mock).mockResolvedValue(mockAnalysis);

    const request = new Request('http://localhost:3000/api/newspaper-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceText: 'Test article content',
        examType: 'UPSC',
        analysisFocus: 'Generate Questions'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockAnalysis);
  });

  it('handles validation errors', async () => {
    const request = new Request('http://localhost:3000/api/newspaper-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const response = await POST(request);
    
    expect(response.status).toBe(400);
  });

  it('handles AI flow errors', async () => {
    (analyzeNewspaperArticle as jest.Mock).mockRejectedValue(
      new Error('AI processing failed')
    );

    const request = new Request('http://localhost:3000/api/newspaper-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceText: 'Test content',
        examType: 'UPSC'
      })
    });

    const response = await POST(request);
    
    expect(response.status).toBe(500);
  });
});
```

### 4.2 Service Layer Testing

#### Ideas Service Test (`src/services/ideasService.test.ts`)

```typescript
import { addIdea, getIdeas, deleteIdea } from '@/services/ideasService';
import { db } from '@/config/firebase';

jest.mock('@/config/firebase');

const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  add: jest.fn(),
  get: jest.fn(),
  delete: jest.fn()
};

describe('Ideas Service', () => {
  beforeEach(() => {
    (db as any) = mockFirestore;
  });

  describe('addIdea', () => {
    it('adds idea to firestore', async () => {
      const idea = {
        text: 'Test idea',
        category: 'feature',
        authorName: 'Test User'
      };

      mockFirestore.add.mockResolvedValue({ id: 'test-id' });

      const result = await addIdea(idea);

      expect(mockFirestore.collection).toHaveBeenCalledWith('ideas');
      expect(mockFirestore.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...idea,
          timestamp: expect.any(Date),
          votes: 0
        })
      );
      expect(result).toBe('test-id');
    });

    it('throws error for invalid input', async () => {
      await expect(addIdea({ text: '', category: '', authorName: '' }))
        .rejects
        .toThrow('Invalid idea data');
    });
  });

  describe('getIdeas', () => {
    it('retrieves ideas from firestore', async () => {
      const mockIdeas = [
        { id: '1', text: 'Idea 1', votes: 5 },
        { id: '2', text: 'Idea 2', votes: 3 }
      ];

      mockFirestore.get.mockResolvedValue({
        docs: mockIdeas.map(idea => ({
          id: idea.id,
          data: () => idea
        }))
      });

      const result = await getIdeas();

      expect(result).toEqual(mockIdeas);
      expect(mockFirestore.collection).toHaveBeenCalledWith('ideas');
    });
  });
});
```

#### Usage Service Test (`src/services/usageService.test.ts`)

```typescript
import { getUserUsage, incrementUsage } from '@/services/usageService';
import { db } from '@/config/firebase';

jest.mock('@/config/firebase');

describe('Usage Service', () => {
  const userId = 'test-user-id';

  it('gets user usage statistics', async () => {
    const mockUsage = {
      totalAnalyses: 10,
      todaysAnalyses: 2,
      streak: 5,
      weeklyUsage: [1, 2, 3, 2, 1, 0, 2]
    };

    (db.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => mockUsage
        })
      })
    });

    const result = await getUserUsage(userId);
    expect(result).toEqual(mockUsage);
  });

  it('increments usage count', async () => {
    const mockDocRef = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ totalAnalyses: 5 })
      }),
      update: jest.fn().mockResolvedValue(true)
    };

    (db.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue(mockDocRef)
    });

    await incrementUsage(userId, 'newspaper-analysis');

    expect(mockDocRef.update).toHaveBeenCalledWith(
      expect.objectContaining({
        totalAnalyses: 6,
        lastUsed: expect.any(Date)
      })
    );
  });
});
```

### 4.3 AI Flow Testing

#### Newspaper Analysis Flow Test (`src/ai/flows/newspaper-analysis-flow.test.ts`)

```typescript
import { analyzeNewspaperArticle } from '@/ai/flows/newspaper-analysis-flow';
import { generate } from '@genkit-ai/ai';

jest.mock('@genkit-ai/ai');

describe('Newspaper Analysis Flow', () => {
  const mockGenerateResponse = {
    text: JSON.stringify({
      prelims: {
        mcqs: [
          {
            question: "What is the main topic?",
            options: ["A", "B", "C", "D"],
            correct: 0,
            explanation: "Test explanation"
          }
        ]
      },
      mains: {
        questions: ["Discuss the implications..."]
      }
    })
  };

  beforeEach(() => {
    (generate as jest.Mock).mockResolvedValue(mockGenerateResponse);
  });

  it('analyzes article and generates questions', async () => {
    const input = {
      sourceText: 'Test article content about government policy',
      examType: 'UPSC',
      analysisFocus: 'Generate Questions',
      outputLanguage: 'english'
    };

    const result = await analyzeNewspaperArticle(input);

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.any(String),
        prompt: expect.stringContaining('Test article content')
      })
    );

    expect(result.prelims.mcqs).toHaveLength(1);
    expect(result.mains.questions).toHaveLength(1);
  });

  it('handles AI generation errors', async () => {
    (generate as jest.Mock).mockRejectedValue(new Error('AI Error'));

    const input = {
      sourceText: 'Test content',
      examType: 'UPSC'
    };

    await expect(analyzeNewspaperArticle(input))
      .rejects
      .toThrow('AI Error');
  });

  it('validates input parameters', async () => {
    const invalidInput = {
      sourceText: '',
      examType: 'INVALID'
    };

    await expect(analyzeNewspaperArticle(invalidInput))
      .rejects
      .toThrow('Invalid input');
  });
});
```

-----

## 5. Integration Testing

### 5.1 Database Integration Tests

#### Firestore Integration Test (`src/test/integration/firestore.test.ts`)

```typescript
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { addIdea, getIdeas } from '@/services/ideasService';

describe('Firestore Integration', () => {
  let testEnv: any;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      emulators: {
        firestore: {
          host: 'localhost',
          port: 8080
        }
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it('saves and retrieves ideas correctly', async () => {
    const idea = {
      text: 'Integration test idea',
      category: 'feature',
      authorName: 'Test User'
    };

    const ideaId = await addIdea(idea);
    expect(ideaId).toBeDefined();

    const ideas = await getIdeas();
    expect(ideas).toHaveLength(1);
    expect(ideas[0].text).toBe(idea.text);
  });
});
```

### 5.2 API Integration Tests

#### Full Flow Integration Test (`src/test/integration/newspaper-flow.test.ts`)

```typescript
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/newspaper-analysis/route';

describe('Newspaper Analysis Flow Integration', () => {
  it('completes full analysis workflow', async () => {
    const requestBody = {
      sourceText: 'Sample article about economic reforms...',
      examType: 'UPSC',
      analysisFocus: 'Generate Questions',
      outputLanguage: 'english'
    };

    const request = new NextRequest('http://localhost:3000/api/newspaper-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toHaveProperty('prelims');
    expect(result).toHaveProperty('mains');
    expect(result.prelims.mcqs).toBeInstanceOf(Array);
    expect(result.mains.questions).toBeInstanceOf(Array);

    // Validate structure
    if (result.prelims.mcqs.length > 0) {
      const mcq = result.prelims.mcqs[0];
      expect(mcq).toHaveProperty('question');
      expect(mcq).toHaveProperty('options');
      expect(mcq).toHaveProperty('correct');
      expect(mcq).toHaveProperty('explanation');
    }
  });
});
```

-----

## 6. End-to-End Testing

### 6.1 User Journey Tests

#### Complete Dashboard Journey (`tests/e2e/dashboard-journey.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('user can navigate dashboard and view analytics', async ({ page }) => {
    // Verify dashboard loads
    await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('Dashboard');

    // Check analytics widgets
    await expect(page.locator('[data-testid="total-analyses"]')).toBeVisible();
    await expect(page.locator('[data-testid="quiz-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();

    // Navigate to newspaper analysis
    await page.click('[data-testid="nav-newspaper-analysis"]');
    await page.waitForURL('/newspaper-analysis');
    await expect(page.locator('h1')).toContainText('Newspaper Analysis');

    // Return to dashboard
    await page.click('[data-testid="nav-dashboard"]');
    await page.waitForURL('/dashboard');
  });

  test('responsive navigation works on mobile', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Mobile test for webkit only');
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mobile menu should be visible
    await expect(page.locator('[data-testid="mobile-menu-trigger"]')).toBeVisible();
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-trigger"]');
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // Navigate via mobile menu
    await page.click('[data-testid="mobile-nav-quiz"]');
    await page.waitForURL('/quiz');
  });
});
```

#### Newspaper Analysis Complete Flow (`tests/e2e/newspaper-analysis.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Newspaper Analysis Flow', () => {
  test('complete article analysis workflow', async ({ page }) => {
    await page.goto('/newspaper-analysis');

    // Fill article URL
    await page.fill('[data-testid="article-url-input"]', 'https://example.com/article');

    // Select exam type
    await page.click('[data-testid="exam-type-select"]');
    await page.click('text=UPSC');

    // Select analysis focus
    await page.click('[data-testid="analysis-focus-select"]');
    await page.click('text=Generate Questions');

    // Submit analysis
    await page.click('[data-testid="analyze-button"]');

    // Wait for loading to complete
    await page.waitForSelector('[data-testid="analysis-loading"]', { state: 'detached' });

    // Verify results are displayed
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="prelims-questions"]')).toBeVisible();
    await expect(page.locator('[data-testid="mains-questions"]')).toBeVisible();

    // Test question interaction
    const firstQuestion = page.locator('[data-testid="question-0"]').first();
    await expect(firstQuestion).toBeVisible();

    // Save analysis
    await page.click('[data-testid="save-analysis-button"]');
    await expect(page.locator('text=Analysis saved successfully')).toBeVisible();

    // Navigate to history
    await page.click('[data-testid="nav-history"]');
    await page.waitForURL('/history');
    
    // Verify saved analysis appears in history
    await expect(page.locator('[data-testid="history-item"]').first()).toBeVisible();
  });
});