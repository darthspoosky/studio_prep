# Advanced Question Management System Architecture

## Database Schema Design

### 1. Question Bank Collections

#### `prelims_questions` Collection
```typescript
interface PrelimsQuestion {
  id: string;                           // Auto-generated document ID
  questionId: string;                   // Custom question identifier (e.g., "UPSC-2023-GS1-Q15")
  
  // Question Content
  question: string;                     // Main question text
  questionType: 'MCQ' | 'MSQ' | 'Assertion-Reason' | 'Statement-Based';
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string[];              // Array to support multiple correct answers
  explanation: string;                  // Detailed explanation
  
  // Classification
  year: number;                         // Exam year (2020, 2021, etc.)
  paper: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'CSAT';
  questionNumber: number;               // Position in paper
  
  // UPSC-Specific Tagging
  subject: string[];                    // ['History', 'Geography'] - can span multiple
  subtopics: string[];                  // Granular topics
  syllabusTopic: string[];              // Exact UPSC syllabus mapping
  difficultyLevel: 'Easy' | 'Medium' | 'Hard';
  conceptLevel: 'Basic' | 'Intermediate' | 'Advanced';
  
  // Analytics & Performance
  attemptCount: number;                 // How many times attempted
  correctAttempts: number;              // Successful attempts
  averageTime: number;                  // Average time taken (seconds)
  successRate: number;                  // Percentage of correct attempts
  
  // Content Metadata
  source: string;                       // 'UPSC Official', 'Authentic Source'
  verified: boolean;                    // Content verification status
  imageUrls: string[];                  // Associated images/diagrams
  references: string[];                 // External references
  
  // AI Enhancement
  aiTags: string[];                     // AI-generated topic tags
  conceptGraph: string[];               // Related concepts
  prerequisiteTopics: string[];         // Required background knowledge
  
  // Management
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;                    // Admin user ID
  isActive: boolean;                    // Published status
  version: number;                      // Content versioning
}
```

#### `mains_questions` Collection
```typescript
interface MainsQuestion {
  id: string;
  questionId: string;                   // "UPSC-2023-GS1-Q1a"
  
  // Question Content
  question: string;                     // Main question text
  questionType: 'Essay' | 'Analytical' | 'Case-Study' | 'Map-Based' | 'Diagram-Based';
  subParts: Array<{                     // For multi-part questions
    part: string;                       // 'a', 'b', 'c'
    question: string;
    marks: number;
    expectedLength: number;             // Word count
  }>;
  
  // Classification
  year: number;
  paper: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay';
  questionNumber: number;
  totalMarks: number;
  timeAllocation: number;               // Recommended time in minutes
  
  // Content Analysis
  subject: string[];
  subtopics: string[];
  syllabusTopic: string[];
  difficultyLevel: 'Easy' | 'Medium' | 'Hard';
  conceptLevel: 'Basic' | 'Intermediate' | 'Advanced';
  
  // Answer Framework
  expectedApproach: string[];           // ['Introduction', 'Analysis', 'Conclusion']
  keyPoints: string[];                  // Must-include points
  commonMistakes: string[];             // Typical errors to avoid
  gradingCriteria: Array<{
    criterion: string;
    weightage: number;
    description: string;
  }>;
  
  // Sample Answers
  modelAnswers: Array<{
    id: string;
    content: string;
    score: number;                      // Out of total marks
    feedback: string;
    answerType: 'Excellent' | 'Good' | 'Average' | 'Poor';
  }>;
  
  // Current Affairs Linkage
  currentAffairsTopics: string[];       // Related current events
  recentDevelopments: Array<{
    topic: string;
    date: string;
    relevance: string;
  }>;
  
  // Analytics
  attemptCount: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;                  // Count of scores 80%+
    good: number;                       // 60-80%
    average: number;                    // 40-60%
    poor: number;                       // <40%
  };
  
  // AI Enhancement
  aiTags: string[];
  relatedQuestions: string[];           // IDs of similar questions
  practiceLevel: 'Foundation' | 'Intermediate' | 'Advanced';
  
  // Management
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isActive: boolean;
  version: number;
}
```

### 2. Content Management Collections

#### `question_sets` Collection
```typescript
interface QuestionSet {
  id: string;
  name: string;                         // "UPSC 2023 Complete Paper"
  description: string;
  type: 'Full Paper' | 'Topic Wise' | 'Mock Test' | 'Custom Set';
  examType: 'Prelims' | 'Mains';
  
  questions: Array<{
    questionId: string;
    order: number;
    marks?: number;                     // For mains
  }>;
  
  metadata: {
    totalQuestions: number;
    totalMarks?: number;
    timeLimit: number;                  // Minutes
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
    subjects: string[];
  };
  
  settings: {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showExplanations: boolean;
    allowReview: boolean;
  };
  
  analytics: {
    attemptCount: number;
    averageScore: number;
    completionRate: number;
  };
  
  createdAt: Timestamp;
  createdBy: string;
  isPublic: boolean;
  isActive: boolean;
}
```

#### `upload_batches` Collection
```typescript
interface UploadBatch {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
  
  status: 'Processing' | 'Completed' | 'Failed' | 'Partial';
  examType: 'Prelims' | 'Mains';
  year: number;
  paper?: string;
  
  stats: {
    totalRecords: number;
    processedRecords: number;
    successfulRecords: number;
    failedRecords: number;
  };
  
  errors: Array<{
    row: number;
    field: string;
    error: string;
    value: string;
  }>;
  
  validation: {
    duplicateQuestions: string[];       // Question IDs already exist
    missingFields: Array<{
      row: number;
      fields: string[];
    }>;
    formatErrors: Array<{
      row: number;
      field: string;
      expected: string;
      received: string;
    }>;
  };
  
  processingLog: Array<{
    timestamp: Timestamp;
    action: string;
    details: string;
  }>;
}
```

### 3. Indexing Strategy

#### Firestore Composite Indexes
```javascript
// For Prelims Questions
{
  collectionGroup: "prelims_questions",
  fields: [
    { fieldPath: "year", order: "DESCENDING" },
    { fieldPath: "paper", order: "ASCENDING" },
    { fieldPath: "questionNumber", order: "ASCENDING" }
  ]
}

{
  collectionGroup: "prelims_questions", 
  fields: [
    { fieldPath: "subject", arrayConfig: "CONTAINS" },
    { fieldPath: "difficultyLevel", order: "ASCENDING" },
    { fieldPath: "successRate", order: "DESCENDING" }
  ]
}

{
  collectionGroup: "prelims_questions",
  fields: [
    { fieldPath: "syllabusTopic", arrayConfig: "CONTAINS" },
    { fieldPath: "year", order: "DESCENDING" },
    { fieldPath: "isActive", order: "ASCENDING" }
  ]
}

// For Mains Questions
{
  collectionGroup: "mains_questions",
  fields: [
    { fieldPath: "year", order: "DESCENDING" },
    { fieldPath: "paper", order: "ASCENDING" },
    { fieldPath: "totalMarks", order: "DESCENDING" }
  ]
}

{
  collectionGroup: "mains_questions",
  fields: [
    { fieldPath: "subject", arrayConfig: "CONTAINS" },
    { fieldPath: "averageScore", order: "ASCENDING" },
    { fieldPath: "attemptCount", order: "DESCENDING" }
  ]
}
```

## File Upload and Processing System

### Supported File Formats
1. **Excel (.xlsx, .xls)** - Structured question data
2. **CSV** - Bulk question import
3. **JSON** - API-friendly format
4. **PDF** - OCR processing for scanned papers
5. **Word (.docx)** - Official question papers

### Processing Pipeline
1. **File Validation** → Format checking, size limits
2. **Content Parsing** → Extract structured data
3. **Data Validation** → Required fields, format validation
4. **Duplicate Detection** → Check against existing questions
5. **AI Enhancement** → Auto-tagging, concept mapping
6. **Quality Review** → Manual verification queue
7. **Database Import** → Batch insertion with rollback
8. **Index Updates** → Search index refresh

This architecture provides a robust foundation for managing UPSC question banks with comprehensive metadata, analytics, and search capabilities.