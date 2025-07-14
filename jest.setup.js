// Jest setup file for testing environment
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  useParams: () => ({ type: 'free-daily' }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/daily-quiz/session/free-daily'
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    loading: false,
    error: null
  })
}));

// Mock cn utility function
jest.mock('@/lib/utils', () => ({
  cn: (...args) => args.filter(Boolean).join(' ')
}));

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => [])
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn()
}));

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve(''))
  },
  writable: true,
});

// Mock fetch globally
global.fetch = jest.fn();

// Console error suppression for expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: React.createFactory() is deprecated'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Setup test environment
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  (fetch as jest.MockedFunction<typeof fetch>).mockClear();
});

// Global test utilities
global.testUtils = {
  mockQuestionData: {
    id: 'q1',
    question: 'Sample question text',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 'A',
    explanation: 'Sample explanation',
    subject: 'General Studies',
    difficulty: 'medium'
  },
  
  mockSessionData: {
    id: 'test-session',
    userId: 'test-user',
    quizType: 'free-daily',
    timeLimit: 900,
    startTime: new Date(),
    currentQuestionIndex: 0,
    answers: [null],
    bookmarked: [false],
    completed: false,
    metadata: {
      difficulty: 'medium',
      subject: 'General Studies',
      tier: 'free',
      maxQuestions: 5
    }
  },
  
  mockApiResponse: (data, status = 200) => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: status < 400,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data)
    } as Response);
  },
  
  mockApiError: (error = 'Network error', status = 500) => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
      new Error(error)
    );
  }
};

// Performance monitoring for slow tests
const SLOW_TEST_THRESHOLD = 2000; // 2 seconds

beforeEach(() => {
  const testStart = Date.now();
  
  afterEach(() => {
    const testDuration = Date.now() - testStart;
    if (testDuration > SLOW_TEST_THRESHOLD) {
      console.warn(`⚠️  Slow test detected: ${expect.getState().currentTestName} (${testDuration}ms)`);
    }
  });
});