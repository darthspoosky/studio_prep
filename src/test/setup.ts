import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  app: {},
}));

// Mock Firebase Auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Zustand store
jest.mock('@/lib/store', () => ({
  useQuizStore: () => ({
    currentQuestion: null,
    answers: {},
    score: 0,
    timeRemaining: 0,
    isCompleted: false,
    setCurrentQuestion: jest.fn(),
    setAnswer: jest.fn(),
    calculateScore: jest.fn(),
    resetQuiz: jest.fn(),
  }),
}));

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console errors in tests unless debugging
if (process.env.NODE_ENV === 'test') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (args[0]?.includes && args[0].includes('Warning:')) {
      return;
    }
    originalError.apply(console, args);
  };
}
