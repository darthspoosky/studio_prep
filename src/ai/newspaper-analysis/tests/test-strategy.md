# Comprehensive Testing Strategy for Newspaper Analysis

## Overview
Multi-layered testing approach ensuring both technical reliability and UPSC content quality.

## Testing Pyramid

### 1. Unit Tests (Base Layer)
**Focus**: Individual functions and modules
**Coverage Target**: 90%+

#### Components to Test:
- **Validators**: UPSC pattern matching, difficulty scoring, syllabus alignment
- **Prompts**: Template rendering, parameter injection, version selection
- **Agents**: Input/output schema validation, error handling
- **Utilities**: Text processing, scoring algorithms, data transformations

#### Test Categories:
```typescript
// Pattern validation tests
describe('UPSC Pattern Validation', () => {
  test('validates multiple-statement MCQ pattern', () => {
    const mcq = createMockMCQ({
      question: "Which of the following statements are correct?\n1. Statement one\n2. Statement two",
      options: [
        { text: "(a) 1 only", correct: false },
        { text: "(b) 2 only", correct: false },
        { text: "(c) Both 1 and 2", correct: true },
        { text: "(d) Neither 1 nor 2", correct: false }
      ]
    });
    
    const metrics = validateMCQ(mcq);
    expect(metrics.upscPatternCompliance).toBeGreaterThan(0.8);
  });
});
```

### 2. Integration Tests (Middle Layer)
**Focus**: Agent interactions and data flow
**Coverage Target**: 80%+

#### Test Scenarios:
- **Agent Chaining**: Relevance → Question Generation → Verification
- **Streaming Flow**: Progressive output generation and error recovery
- **Prompt Versioning**: A/B test variant routing
- **Quality Metrics**: End-to-end scoring consistency

### 3. Content Quality Tests (Top Layer)
**Focus**: UPSC expertise validation
**Coverage Target**: 100% for critical patterns

#### Expert Review Framework:
```typescript
interface ContentQualityTest {
  articleSample: string;
  expectedRelevance: boolean;
  expectedSyllabusTopic: string;
  expectedQuestionPatterns: string[];
  expertRating: number; // 1-10 scale
  rationale: string;
}
```

## UPSC-Specific Test Suites

### A. Question Pattern Compliance Tests

#### Multiple Statement Questions
```typescript
const MULTIPLE_STATEMENT_SAMPLES = [
  {
    input: "Article about farm laws and protests",
    expected: {
      questionFormat: /which.*statements.*correct/i,
      numberedStatements: true,
      optionFormat: /\(a\).*only|\(b\).*and.*only/i,
      difficulty: { min: 7, max: 9 }
    }
  }
];
```

#### Assertion-Reason Questions
```typescript
const ASSERTION_REASON_SAMPLES = [
  {
    input: "Supreme Court judgment on Article 370",
    expected: {
      statementLabels: ["Statement-I", "Statement-II"],
      questionFormat: /which.*correct.*respect.*statements/i,
      standardOptions: true, // Must use exact UPSC format
      difficulty: { min: 8, max: 10 }
    }
  }
];
```

### B. Syllabus Alignment Tests

#### GS Paper Mapping
```typescript
const SYLLABUS_MAPPING_TESTS = [
  {
    article: "Digital India initiatives and cyber security",
    expectedPaper: "GS-III",
    expectedTopic: "Science and Technology- developments and their applications and effects in everyday life",
    confidenceThreshold: 0.8
  },
  {
    article: "India-Bangladesh water dispute resolution",
    expectedPaper: "GS-II", 
    expectedTopic: "International Relations",
    confidenceThreshold: 0.9
  }
];
```

### C. Difficulty Calibration Tests

#### Empirical Difficulty Validation
```typescript
const DIFFICULTY_CALIBRATION = {
  prelims: {
    // Based on analysis of 2019-2023 papers
    easyQuestions: { range: [6, 7], percentage: 20 },
    mediumQuestions: { range: [7, 8], percentage: 60 },
    hardQuestions: { range: [8, 10], percentage: 20 }
  },
  mains: {
    // Based on topper analysis and expert evaluation
    moderate: { range: [7, 8], percentage: 40 },
    challenging: { range: [8, 9], percentage: 50 },
    advanced: { range: [9, 10], percentage: 10 }
  }
};
```

## Test Data Management

### 1. Golden Dataset
**Source**: Manually curated by UPSC experts
**Size**: 200+ articles with expert annotations
**Updates**: Quarterly review and expansion

```typescript
interface GoldenSample {
  id: string;
  article: {
    text: string;
    source: string;
    date: Date;
    topic: string;
  };
  expertAnnotation: {
    relevanceScore: number; // 0-1
    syllabusTopic: string;
    expectedQuestions: Array<{
      type: 'prelims' | 'mains';
      question: string;
      difficulty: number;
      qualityScore: number;
    }>;
    reviewedBy: string;
    reviewDate: Date;
  };
}
```

### 2. Regression Test Suite
**Source**: Previously validated outputs
**Purpose**: Ensure changes don't break existing quality
**Automated**: Daily runs with quality thresholds

### 3. A/B Test Data
**Source**: Live user interactions
**Purpose**: Prompt optimization and model improvement
**Metrics**: Question answering accuracy, user satisfaction

## Continuous Quality Monitoring

### 1. Real-time Metrics Dashboard
```typescript
interface QualityMetrics {
  // Pattern compliance rates
  upscPatternCompliance: {
    multipleStatement: number;
    assertionReason: number;
    matchingPairs: number;
  };
  
  // Difficulty distribution
  difficultyDistribution: {
    prelims: { easy: number; medium: number; hard: number };
    mains: { moderate: number; challenging: number; advanced: number };
  };
  
  // Expert validation scores
  expertValidation: {
    averageRating: number;
    samplesReviewed: number;
    rejectionRate: number;
  };
}
```

### 2. Alert System
**Triggers**:
- Pattern compliance drops below 85%
- Difficulty distribution deviates from expected ranges
- Expert validation scores drop below 7/10
- Processing errors exceed 2%

### 3. Weekly Expert Review
**Process**:
1. Random sample of 20 generated analyses
2. Expert evaluation on 10-point scale
3. Feedback integration into prompt optimization
4. Quality trend analysis

## Performance Testing

### 1. Load Testing
- **Concurrent Users**: 100+ simultaneous analysis requests
- **Response Time**: <30 seconds for complete analysis
- **Throughput**: 50+ articles per minute at peak load

### 2. Token Efficiency Testing
- **Target**: <10,000 tokens per analysis
- **Monitoring**: Cost per quality unit
- **Optimization**: Prompt length vs output quality balance

## Test Automation Framework

### 1. Scheduled Test Runs
```yaml
# .github/workflows/quality-tests.yml
name: UPSC Content Quality Tests
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Pattern Validation Tests
        run: npm run test:patterns
      
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Agent Integration Tests
        run: npm run test:integration
        
  content-quality:
    runs-on: ubuntu-latest
    steps:
      - name: Run Golden Dataset Validation
        run: npm run test:golden-dataset
      - name: Upload Quality Report
        uses: actions/upload-artifact@v3
        with:
          name: quality-report
          path: reports/quality-metrics.json
```

### 2. Quality Gates
**Deployment Blocks**:
- Pattern compliance < 85%
- Expert validation score < 7.5/10
- Regression in golden dataset performance
- Critical test failures

## Expert Validation Process

### 1. Weekly Expert Panel
**Composition**: 3 UPSC faculty members
**Process**: 
- Review 50 random analyses
- Rate on standardized rubric
- Provide specific feedback
- Identify pattern improvements

### 2. Continuous Improvement Loop
1. **Data Collection**: User interactions, expert feedback, performance metrics
2. **Analysis**: Identify improvement opportunities
3. **Implementation**: Prompt updates, model fine-tuning, validation rule changes
4. **Testing**: Validate improvements against golden dataset
5. **Deployment**: Gradual rollout with monitoring

This comprehensive testing strategy ensures both technical reliability and UPSC content quality, providing confidence in the system's ability to generate exam-ready questions consistently.