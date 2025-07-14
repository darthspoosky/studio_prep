import { POST } from '../generate/route';
import { NextRequest } from 'next/server';

// Mock Firebase Admin
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  cert: jest.fn()
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => ({
          exists: true,
          data: () => ({ tier: 'free', status: 'active' })
        }))
      })),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => ({
              docs: [
                {
                  id: 'q1',
                  data: () => ({
                    question: 'Sample question 1',
                    options: ['A', 'B', 'C', 'D'],
                    correctAnswer: 'A',
                    explanation: 'Sample explanation',
                    subject: 'Geography',
                    difficulty: 'easy'
                  })
                }
              ]
            }))
          }))
        }))
      })),
      add: jest.fn(() => ({ id: 'mock-session-id' }))
    }))
  }))
}));

// Mock environment variables
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
process.env.FIREBASE_PRIVATE_KEY = 'test-key';

describe('/api/daily-quiz/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST - Quiz Generation', () => {
    it('should generate quiz successfully for valid request', async () => {
      const request = new NextRequest('http://localhost/api/daily-quiz/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user',
          quizType: 'free-daily',
          difficulty: 'easy',
          subject: 'General Studies',
          maxQuestions: 5
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBeDefined();
      expect(data.questions).toHaveLength(5);
      expect(data.timeLimit).toBe(900); // 15 minutes for free-daily
    });

    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost/api/daily-quiz/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user'
          // Missing other required fields
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 403 for unauthorized quiz type', async () => {
      // Mock user with free tier trying to access premium quiz
      const mockFirestore = require('firebase-admin/firestore').getFirestore();
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ tier: 'free', status: 'active' })
      });

      const request = new NextRequest('http://localhost/api/daily-quiz/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user',
          quizType: 'mock-prelims', // Requires higher tier
          difficulty: 'hard',
          subject: 'General Studies',
          maxQuestions: 100
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Access denied for this quiz type');
    });

    it('should handle invalid quiz type', async () => {
      const request = new NextRequest('http://localhost/api/daily-quiz/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user',
          quizType: 'invalid-quiz-type',
          difficulty: 'easy',
          subject: 'General Studies',
          maxQuestions: 5
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Access denied for this quiz type');
    });

    it('should generate mock questions when insufficient questions available', async () => {
      // Mock empty question pool
      const mockFirestore = require('firebase-admin/firestore').getFirestore();
      mockFirestore.collection().where().where().limit().get.mockResolvedValueOnce({
        docs: [] // No questions available
      });

      const request = new NextRequest('http://localhost/api/daily-quiz/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user',
          quizType: 'free-daily',
          difficulty: 'easy',
          subject: 'General Studies',
          maxQuestions: 5
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions).toHaveLength(5);
      // Should contain mock questions
      expect(data.questions[0].question).toContain('Sample easy level question');
    });

    it('should handle different quiz types with correct configurations', async () => {
      const quizTypes = [
        { type: 'free-daily', expectedTimeLimit: 900, expectedQuestions: 5 },
        { type: 'ncert-foundation', expectedTimeLimit: 1200, expectedQuestions: 10 },
        { type: 'past-year', expectedTimeLimit: 1500, expectedQuestions: 15 }
      ];

      for (const quizType of quizTypes) {
        const request = new NextRequest('http://localhost/api/daily-quiz/generate', {
          method: 'POST',
          body: JSON.stringify({
            userId: 'test-user',
            quizType: quizType.type,
            difficulty: 'easy',
            subject: 'General Studies',
            maxQuestions: quizType.expectedQuestions
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.timeLimit).toBe(quizType.expectedTimeLimit);
        expect(data.questions).toHaveLength(quizType.expectedQuestions);
      }
    });

    it('should log analytics for quiz generation', async () => {
      const mockFirestore = require('firebase-admin/firestore').getFirestore();
      const mockAnalyticsAdd = jest.fn();
      mockFirestore.collection.mockImplementation((collection: string) => {
        if (collection === 'quizAnalytics') {
          return { add: mockAnalyticsAdd };
        }
        return {
          doc: jest.fn(() => ({
            get: jest.fn(() => ({
              exists: true,
              data: () => ({ tier: 'free', status: 'active' })
            }))
          })),
          where: jest.fn(() => ({
            where: jest.fn(() => ({
              limit: jest.fn(() => ({
                get: jest.fn(() => ({
                  docs: [{
                    id: 'q1',
                    data: () => ({
                      question: 'Sample question',
                      options: ['A', 'B', 'C', 'D'],
                      correctAnswer: 'A',
                      explanation: 'Sample explanation',
                      subject: 'Geography',
                      difficulty: 'easy'
                    })
                  }]
                }))
              }))
            }))
          })),
          add: jest.fn(() => ({ id: 'mock-session-id' }))
        };
      });

      const request = new NextRequest('http://localhost/api/daily-quiz/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user',
          quizType: 'free-daily',
          difficulty: 'easy',
          subject: 'General Studies',
          maxQuestions: 5
        })
      });

      await POST(request);

      expect(mockAnalyticsAdd).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'test-user',
        quizType: 'free-daily',
        difficulty: 'easy',
        subject: 'General Studies',
        questionCount: 5
      }));
    });

    it('should handle database connection errors', async () => {
      // Mock database error
      const mockFirestore = require('firebase-admin/firestore').getFirestore();
      mockFirestore.collection().doc().get.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost/api/daily-quiz/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user',
          quizType: 'free-daily',
          difficulty: 'easy',
          subject: 'General Studies',
          maxQuestions: 5
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('GET - Method not allowed', () => {
    it('should return 405 for GET requests', async () => {
      const { GET } = await import('../generate/route');
      const request = new NextRequest('http://localhost/api/daily-quiz/generate', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JSON request body', async () => {
      const request = new NextRequest('http://localhost/api/daily-quiz/generate', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should handle new user without subscription data', async () => {
      // Mock user not found in subscription collection
      const mockFirestore = require('firebase-admin/firestore').getFirestore();
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: false
      });

      const request = new NextRequest('http://localhost/api/daily-quiz/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'new-user',
          quizType: 'free-daily',
          difficulty: 'easy',
          subject: 'General Studies',
          maxQuestions: 5
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should validate maximum question limits', async () => {
      const request = new NextRequest('http://localhost/api/daily-quiz/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user',
          quizType: 'free-daily',
          difficulty: 'easy',
          subject: 'General Studies',
          maxQuestions: 1000 // Unreasonably high
        })
      });

      const response = await POST(request);
      const data = await response.json();

      // Should either limit questions or return error
      expect(response.status).toBeLessThanOrEqual(400);
    });
  });
});