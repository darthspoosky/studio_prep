/**
 * @fileOverview Unit tests for UPSC validation functions
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { 
  validateMCQ, 
  validateMainsQuestion, 
  validateTimelineRelevance,
  validateKnowledgeGraph,
  calculateOverallQuality 
} from '../../validators/upsc-validator';
import { MCQ, MainsQuestion, KnowledgeGraph } from '../../types';

describe('UPSC MCQ Validation', () => {
  describe('Multiple Statement Pattern', () => {
    test('should validate correct multiple statement MCQ', () => {
      const mcq: MCQ = {
        question: `Consider the following statements about the Digital India initiative:
1. It aims to transform India into a digitally empowered society.
2. It includes the BharatNet project for rural connectivity.
3. Aadhaar is not part of the Digital India framework.

Which of the statements given above is/are correct?`,
        options: [
          { text: "(a) 1 only", correct: false },
          { text: "(b) 1 and 2 only", correct: true },
          { text: "(c) 2 and 3 only", correct: false },
          { text: "(d) 1, 2 and 3", correct: false }
        ],
        subject: "Science and Technology",
        difficulty: 7,
        explanation: "Statement 1 and 2 are correct as they accurately describe the Digital India initiative. Statement 3 is incorrect because Aadhaar is a key component of Digital India framework."
      };

      const metrics = validateMCQ(mcq);
      
      expect(metrics.upscPatternCompliance).toBeGreaterThan(0.8);
      expect(metrics.difficultyCalibration).toBeGreaterThan(0.7);
      expect(metrics.explanationQuality).toBeGreaterThan(0.6);
      expect(metrics.overallScore).toBeGreaterThan(0.7);
    });

    test('should penalize incorrect option format', () => {
      const mcq: MCQ = {
        question: "Which of the following statements are correct?",
        options: [
          { text: "Option A", correct: false }, // Wrong format
          { text: "Option B", correct: true },
          { text: "Option C", correct: false },
          { text: "Option D", correct: false }
        ],
        difficulty: 7
      };

      const metrics = validateMCQ(mcq);
      expect(metrics.upscPatternCompliance).toBeLessThan(0.5);
    });
  });

  describe('Assertion-Reason Pattern', () => {
    test('should validate correct assertion-reason MCQ', () => {
      const mcq: MCQ = {
        question: `Statement-I: The Supreme Court of India has the power of judicial review.
Statement-II: This power is explicitly mentioned in Article 13 of the Constitution.

Which one of the following is correct in respect of the above statements?`,
        options: [
          { text: "(a) Both Statement-I and Statement-II are correct and Statement-II is the correct explanation for Statement-I", correct: false },
          { text: "(b) Both Statement-I and Statement-II are correct and Statement-II is not the correct explanation for Statement-I", correct: true },
          { text: "(c) Statement-I is correct but Statement-II is incorrect", correct: false },
          { text: "(d) Statement-I is incorrect but Statement-II is correct", correct: false }
        ],
        difficulty: 8,
        explanation: "Statement-I is correct as the Supreme Court does have judicial review powers. Statement-II is also correct but it's not the direct explanation since judicial review is derived from multiple constitutional provisions, not just Article 13."
      };

      const metrics = validateMCQ(mcq);
      expect(metrics.upscPatternCompliance).toBeGreaterThan(0.9);
    });
  });

  describe('Difficulty Calibration', () => {
    test('should validate appropriate prelims difficulty range', () => {
      const easyMCQ: MCQ = { 
        question: "Test question", 
        options: [], 
        difficulty: 5 // Too easy for UPSC
      };
      
      const optimalMCQ: MCQ = { 
        question: "Test question", 
        options: [], 
        difficulty: 7 // Optimal
      };
      
      const hardMCQ: MCQ = { 
        question: "Test question", 
        options: [], 
        difficulty: 9 // Appropriately hard
      };

      expect(validateMCQ(easyMCQ).difficultyCalibration).toBeLessThan(0.5);
      expect(validateMCQ(optimalMCQ).difficultyCalibration).toBeGreaterThan(0.8);
      expect(validateMCQ(hardMCQ).difficultyCalibration).toBeGreaterThan(0.7);
    });
  });

  describe('Explanation Quality', () => {
    test('should validate high-quality explanations', () => {
      const goodExplanation = "The correct answer is (b) because Article 356 of the Constitution provides for President's Rule. This constitutional provision allows the central government to suspend state government under specific circumstances, thereby maintaining the federal structure while ensuring governance continues.";
      
      const poorExplanation = "B is correct.";
      
      const mcqGood: MCQ = {
        question: "Test", 
        options: [], 
        explanation: goodExplanation
      };
      
      const mcqPoor: MCQ = {
        question: "Test", 
        options: [], 
        explanation: poorExplanation
      };

      expect(validateMCQ(mcqGood).explanationQuality).toBeGreaterThan(0.7);
      expect(validateMCQ(mcqPoor).explanationQuality).toBeLessThan(0.3);
    });
  });
});

describe('UPSC Mains Question Validation', () => {
  test('should validate well-structured mains question', () => {
    const mainsQuestion: MainsQuestion = {
      question: "Critically analyze the impact of Digital India initiative on rural governance and citizen service delivery. Discuss the challenges and suggest measures for improvement.",
      difficulty: 8,
      guidance: `## Guidance for Answer

**1. Deconstruct the Question:**
- **Core Subject:** Governance and Technology  
- **Key Directive:** Critically Analyze, Discuss
- **Main Theme:** Digital India's impact on rural governance
- **Specific Scope:** Service delivery, challenges, and solutions

**2. Answer Structure Blueprint:**
- **Introduction:** Brief on Digital India initiative and its rural focus
- **Body Paragraph 1:** Positive impacts on rural governance (e-governance, transparency)
- **Body Paragraph 2:** Improvements in citizen service delivery (Jan Aushadhi, Direct Benefit Transfer)
- **Body Paragraph 3:** Challenges (digital divide, infrastructure, literacy)
- **Body Paragraph 4:** Suggested measures (capacity building, infrastructure development)
- **Conclusion:** Balanced assessment with way forward

**3. Key Data & Keywords:**
- **Data Points:** Digital literacy rates, internet penetration in rural areas, e-governance adoption statistics
- **Keywords:** Digital divide, e-governance, citizen-centric services, last-mile connectivity, digital literacy`
    };

    const metrics = validateMainsQuestion(mainsQuestion);
    
    expect(metrics.upscPatternCompliance).toBeGreaterThan(0.8);
    expect(metrics.explanationQuality).toBeGreaterThan(0.8);
    expect(metrics.difficultyCalibration).toBeGreaterThan(0.7);
    expect(metrics.overallScore).toBeGreaterThan(0.7);
  });

  test('should penalize questions without proper directive', () => {
    const poorQuestion: MainsQuestion = {
      question: "Write about Digital India.", // Poor directive
      difficulty: 5
    };

    const metrics = validateMainsQuestion(poorQuestion);
    expect(metrics.upscPatternCompliance).toBeLessThan(0.4);
  });
});

describe('Timeline Relevance Validation', () => {
  test('should validate recent articles as relevant', () => {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 6); // 6 months ago
    
    expect(validateTimelineRelevance(recentDate)).toBe(true);
  });

  test('should mark old articles as less relevant', () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 2); // 2 years ago
    
    expect(validateTimelineRelevance(oldDate)).toBe(false);
  });
});

describe('Knowledge Graph Validation', () => {
  test('should validate well-structured knowledge graph', () => {
    const knowledgeGraph: KnowledgeGraph = {
      nodes: [
        { id: "NarendraModi", label: "Narendra Modi", type: "Person" },
        { id: "DigitalIndia", label: "Digital India Initiative", type: "Policy" },
        { id: "India", label: "India", type: "Location" },
        { id: "ITMinistry", label: "Ministry of Electronics and IT", type: "Organization" }
      ],
      edges: [
        { source: "NarendraModi", target: "DigitalIndia", label: "launched" },
        { source: "DigitalIndia", target: "India", label: "implemented in" },
        { source: "ITMinistry", target: "DigitalIndia", label: "oversees" }
      ]
    };

    const score = validateKnowledgeGraph(knowledgeGraph);
    expect(score).toBeGreaterThan(0.7);
  });

  test('should penalize graphs with poor entity diversity', () => {
    const poorGraph: KnowledgeGraph = {
      nodes: [
        { id: "Person1", label: "Person One", type: "Person" },
        { id: "Person2", label: "Person Two", type: "Person" }
      ],
      edges: [
        { source: "Person1", target: "Person2", label: "meets" }
      ]
    };

    const score = validateKnowledgeGraph(poorGraph);
    expect(score).toBeLessThan(0.5);
  });
});

describe('Overall Quality Calculation', () => {
  test('should calculate balanced overall quality score', () => {
    const prelimsMetrics = [
      { upscPatternCompliance: 0.9, difficultyCalibration: 0.8, explanationQuality: 0.8, syllabusAlignment: 0.9, factualAccuracy: 0.8, overallScore: 0.85 },
      { upscPatternCompliance: 0.8, difficultyCalibration: 0.7, explanationQuality: 0.9, syllabusAlignment: 0.8, factualAccuracy: 0.9, overallScore: 0.82 }
    ];
    
    const mainsMetrics = [
      { upscPatternCompliance: 0.85, difficultyCalibration: 0.9, explanationQuality: 0.8, syllabusAlignment: 0.9, factualAccuracy: 0.8, overallScore: 0.87 }
    ];
    
    const knowledgeGraphScore = 0.8;

    const overallScore = calculateOverallQuality(prelimsMetrics, mainsMetrics, knowledgeGraphScore);
    
    expect(overallScore).toBeGreaterThan(0.8);
    expect(overallScore).toBeLessThan(1.0);
  });
});

// Test data helpers
const createMockMCQ = (overrides: Partial<MCQ> = {}): MCQ => ({
  question: "Sample UPSC question",
  options: [
    { text: "(a) Option 1", correct: false },
    { text: "(b) Option 2", correct: true },
    { text: "(c) Option 3", correct: false },
    { text: "(d) Option 4", correct: false }
  ],
  subject: "General Studies",
  difficulty: 7,
  explanation: "Standard explanation for the question.",
  ...overrides
});

const createMockMainsQuestion = (overrides: Partial<MainsQuestion> = {}): MainsQuestion => ({
  question: "Critically analyze the given topic with suitable examples.",
  difficulty: 8,
  guidance: "Standard guidance for answer structure.",
  ...overrides
});