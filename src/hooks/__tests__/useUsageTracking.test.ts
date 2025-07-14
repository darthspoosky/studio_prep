import { renderHook, waitFor } from '@testing-library/react';
import { useUsageTracking } from '../useUsageTracking';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Mock the dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/use-toast');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

// Mock fetch
global.fetch = jest.fn();

describe('useUsageTracking', () => {
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseToast.mockReturnValue({
      toast: mockToast
    });

    (global.fetch as jest.Mock).mockClear();
  });

  it('should fetch usage data on mount', async () => {
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    const mockUsageData = {
      currentUsage: {
        dailyQuizQuestions: 3,
        currentAffairsAnalysis: 1,
        writingAnswers: 0,
        interviewSessions: 0,
        totalQuizQuestions: 50,
        totalAnalysis: 10,
        totalAnswers: 0,
        totalInterviews: 0
      },
      summary: {
        totalDays: 7,
        averageQuizQuestions: 7.14,
        averageAnalysis: 1.43,
        averageAnswers: 0,
        averageInterviews: 0,
        dailyBreakdown: []
      },
      limits: {
        warnings: [],
        suggestions: [],
        shouldPromptUpgrade: false
      },
      streak: {
        currentStreak: 5,
        longestStreak: 10,
        lastActiveDate: '2024-01-01'
      },
      userTier: 'foundation'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockUsageData)
    });

    const { result } = renderHook(() => useUsageTracking());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentUsage).toEqual(mockUsageData.currentUsage);
    expect(result.current.summary).toEqual(mockUsageData.summary);
    expect(result.current.userTier).toBe('foundation');
  });

  it('should validate tool access', async () => {
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    // Mock initial fetch
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          currentUsage: { dailyQuizQuestions: 3 },
          userTier: 'foundation'
        })
      })
      // Mock validation API call
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          allowed: true,
          remaining: 22,
          message: 'Access granted'
        })
      });

    const { result } = renderHook(() => useUsageTracking());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const validationResult = await result.current.validateToolAccess('quiz');

    expect(validationResult.allowed).toBe(true);
    expect(validationResult.remaining).toBe(22);
  });

  it('should record usage successfully', async () => {
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    // Mock initial fetch, record usage, and refetch
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          currentUsage: { dailyQuizQuestions: 3 },
          userTier: 'foundation'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          remaining: 21,
          message: 'Usage recorded'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          currentUsage: { dailyQuizQuestions: 4 },
          userTier: 'foundation'
        })
      });

    const { result } = renderHook(() => useUsageTracking());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const recordResult = await result.current.recordUsage('quiz', 1);

    expect(recordResult.success).toBe(true);
    expect(recordResult.remaining).toBe(21);
  });

  it('should handle usage limit reached', async () => {
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    // Mock initial fetch and usage limit reached
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          currentUsage: { dailyQuizQuestions: 5 },
          userTier: 'free'
        })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue({
          message: 'Daily limit exceeded',
          remaining: 0
        })
      });

    const { result } = renderHook(() => useUsageTracking());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const recordResult = await result.current.recordUsage('quiz', 1);

    expect(recordResult.success).toBe(false);
    expect(recordResult.remaining).toBe(0);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Usage Limit Reached",
      description: "Daily limit exceeded",
      variant: "destructive"
    });
  });

  it('should check if user can use tool', async () => {
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    const mockUsageData = {
      currentUsage: {
        dailyQuizQuestions: 3,
        currentAffairsAnalysis: 1,
        writingAnswers: 0,
        interviewSessions: 0
      },
      userTier: 'foundation'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockUsageData)
    });

    const { result } = renderHook(() => useUsageTracking());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Foundation tier should allow quiz and current affairs
    expect(result.current.canUseTool('quiz')).toBe(true);
    expect(result.current.canUseTool('currentAffairs')).toBe(true);
    expect(result.current.canUseTool('writing')).toBe(false); // Not available in foundation
  });

  it('should get remaining usage correctly', async () => {
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    const mockUsageData = {
      currentUsage: {
        dailyQuizQuestions: 20, // Used 20 out of 25 for foundation
        currentAffairsAnalysis: 3, // Used 3 out of 5 for foundation
        writingAnswers: 0,
        interviewSessions: 0
      },
      userTier: 'foundation'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockUsageData)
    });

    const { result } = renderHook(() => useUsageTracking());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getRemainingUsage('quiz')).toBe(5); // 25 - 20
    expect(result.current.getRemainingUsage('currentAffairs')).toBe(2); // 5 - 3
  });

  it('should handle unlimited tier', async () => {
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    const mockUsageData = {
      currentUsage: {
        dailyQuizQuestions: 100,
        currentAffairsAnalysis: 50,
        writingAnswers: 20,
        interviewSessions: 10
      },
      userTier: 'elite'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockUsageData)
    });

    const { result } = renderHook(() => useUsageTracking());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Elite tier should have unlimited access
    expect(result.current.canUseTool('quiz')).toBe(true);
    expect(result.current.canUseTool('currentAffairs')).toBe(true);
    expect(result.current.canUseTool('writing')).toBe(true);
    expect(result.current.canUseTool('interview')).toBe(true);

    // Unlimited usage should return -1
    expect(result.current.getRemainingUsage('quiz')).toBe(-1);
    expect(result.current.getRemainingUsage('currentAffairs')).toBe(-1);
  });

  it('should detect near limit usage', async () => {
    const mockUser = {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });

    const mockUsageData = {
      currentUsage: {
        dailyQuizQuestions: 3, // 2 remaining out of 5 for free tier
        currentAffairsAnalysis: 1, // 1 remaining out of 2 for free tier
        writingAnswers: 0,
        interviewSessions: 0
      },
      userTier: 'free'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockUsageData)
    });

    const { result } = renderHook(() => useUsageTracking());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isNearLimit('quiz')).toBe(true); // 2 remaining
    expect(result.current.isNearLimit('currentAffairs')).toBe(true); // 1 remaining
  });

  it('should handle unauthenticated user', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    });

    const { result } = renderHook(() => useUsageTracking());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('User not authenticated');
    expect(result.current.currentUsage).toBeNull();
  });
});