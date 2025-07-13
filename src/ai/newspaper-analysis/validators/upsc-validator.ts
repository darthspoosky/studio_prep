/**
 * @fileOverview UPSC-specific content validation and quality scoring
 */

import { MCQ, MainsQuestion, KnowledgeGraph, QualityMetrics } from '../types';

// UPSC question patterns based on actual exam analysis
const UPSC_PRELIMS_PATTERNS = {
  multipleStatement: {
    questionPrefix: /which\s+of\s+the\s+(following\s+)?(statements?\s+)?(given\s+above\s+)?is\/are\s+correct/i,
    numberedStatements: /^\d+\.\s+/,
    optionFormat: /^\([a-d]\)\s+(only\s+)?\d+(\s+and\s+\d+)*(\s+only)?$/i,
  },
  assertionReason: {
    statementLabels: /statement-i|statement-ii/i,
    questionFormat: /which\s+one\s+of\s+the\s+following\s+is\s+correct\s+in\s+respect\s+of\s+the\s+above\s+statements/i,
    standardOptions: [
      'Both Statement-I and Statement-II are correct and Statement-II is the correct explanation for Statement-I',
      'Both Statement-I and Statement-II are correct and Statement-II is not the correct explanation for Statement-I',
      'Statement-I is correct but Statement-II is incorrect',
      'Statement-I is incorrect but Statement-II is correct'
    ]
  },
  matchingPairs: {
    questionFormat: /how\s+many\s+pairs?\s+given\s+above\s+(is|are)\s+correctly\s+matched/i,
    pairFormat: /^\d+\.\s+.+\s*:\s*.+$/,
    optionFormat: /^(only\s+)?(one|two|three|four|all)\s+(pair|pairs?)$/i,
  }
};

const UPSC_MAINS_DIRECTIVES = [
  'Discuss', 'Critically analyze', 'Examine', 'Evaluate', 'Comment',
  'Bring out', 'Highlight', 'Assess', 'Review', 'Elucidate'
];

const UPSC_SYLLABUS_TOPICS = {
  GS1: [
    'Indian Heritage and Culture',
    'History and Geography of the World and Society',
    'Indian Society'
  ],
  GS2: [
    'Governance, Constitution, Polity, Social Justice',
    'International relations'
  ],
  GS3: [
    'Technology, Economic Development, Bio diversity, Environment, Security and Disaster Management'
  ],
  GS4: [
    'Ethics, Integrity, and Aptitude'
  ]
};

// Timeline relevance - UPSC tends to ask about developments within 6-24 months
const TIMELINE_RELEVANCE_MONTHS = 18;

/**
 * Validates MCQ against UPSC patterns and standards
 */
export function validateMCQ(mcq: MCQ): QualityMetrics {
  const metrics: QualityMetrics = {
    upscPatternCompliance: 0,
    difficultyCalibration: 0,
    explanationQuality: 0,
    syllabusAlignment: 0,
    factualAccuracy: 0,
    overallScore: 0
  };

  // Pattern compliance check
  metrics.upscPatternCompliance = checkMCQPattern(mcq);
  
  // Difficulty calibration (based on empirical UPSC data)
  metrics.difficultyCalibration = validateDifficulty(mcq.difficulty, 'prelims');
  
  // Explanation quality
  metrics.explanationQuality = validateExplanation(mcq.explanation);
  
  // Syllabus alignment
  metrics.syllabusAlignment = validateSyllabusAlignment(mcq.syllabusTopic, 'prelims');
  
  // Overall score calculation
  metrics.overallScore = (
    metrics.upscPatternCompliance * 0.3 +
    metrics.difficultyCalibration * 0.2 +
    metrics.explanationQuality * 0.25 +
    metrics.syllabusAlignment * 0.25
  );

  return metrics;
}

/**
 * Validates Mains question against UPSC standards
 */
export function validateMainsQuestion(question: MainsQuestion): QualityMetrics {
  const metrics: QualityMetrics = {
    upscPatternCompliance: 0,
    difficultyCalibration: 0,
    explanationQuality: 0,
    syllabusAlignment: 0,
    factualAccuracy: 0,
    overallScore: 0
  };

  // Pattern compliance for Mains
  metrics.upscPatternCompliance = checkMainsPattern(question);
  
  // Difficulty calibration
  metrics.difficultyCalibration = validateDifficulty(question.difficulty, 'mains');
  
  // Guidance quality
  metrics.explanationQuality = validateGuidanceQuality(question.guidance);
  
  // Syllabus alignment
  metrics.syllabusAlignment = validateSyllabusAlignment(question.syllabusTopic, 'mains');
  
  // Overall score
  metrics.overallScore = (
    metrics.upscPatternCompliance * 0.35 +
    metrics.difficultyCalibration * 0.2 +
    metrics.explanationQuality * 0.25 +
    metrics.syllabusAlignment * 0.2
  );

  return metrics;
}

/**
 * Check if MCQ follows authentic UPSC patterns
 */
function checkMCQPattern(mcq: MCQ): number {
  let score = 0;
  const question = mcq.question.toLowerCase();
  
  // Check for multiple statement pattern
  if (UPSC_PRELIMS_PATTERNS.multipleStatement.questionPrefix.test(question)) {
    score += 0.3;
    
    // Check for numbered statements
    if (UPSC_PRELIMS_PATTERNS.multipleStatement.numberedStatements.test(mcq.question)) {
      score += 0.2;
    }
    
    // Check option format
    const hasCorrectOptions = mcq.options.some(opt => 
      UPSC_PRELIMS_PATTERNS.multipleStatement.optionFormat.test(opt.text)
    );
    if (hasCorrectOptions) score += 0.2;
  }
  
  // Check for assertion-reason pattern
  if (UPSC_PRELIMS_PATTERNS.assertionReason.statementLabels.test(question)) {
    score += 0.3;
    
    if (UPSC_PRELIMS_PATTERNS.assertionReason.questionFormat.test(question)) {
      score += 0.4;
    }
  }
  
  // Check for matching pairs pattern
  if (UPSC_PRELIMS_PATTERNS.matchingPairs.questionFormat.test(question)) {
    score += 0.4;
    
    const hasCorrectPairFormat = UPSC_PRELIMS_PATTERNS.matchingPairs.pairFormat.test(mcq.question);
    if (hasCorrectPairFormat) score += 0.3;
  }
  
  // Basic structure checks
  if (mcq.options.length === 4) score += 0.1;
  if (mcq.options.filter(opt => opt.correct).length === 1) score += 0.1;
  
  return Math.min(score, 1);
}

/**
 * Check if Mains question follows UPSC patterns
 */
function checkMainsPattern(question: MainsQuestion): number {
  let score = 0;
  const questionText = question.question;
  
  // Check for proper directive
  const hasValidDirective = UPSC_MAINS_DIRECTIVES.some(directive => 
    questionText.toLowerCase().includes(directive.toLowerCase())
  );
  if (hasValidDirective) score += 0.4;
  
  // Check word limit appropriateness (150/250 words typical)
  const wordCount = questionText.split(' ').length;
  if (wordCount >= 10 && wordCount <= 50) score += 0.2;
  
  // Check for specific, exam-oriented phrasing
  if (questionText.includes('India') || questionText.includes('government') || 
      questionText.includes('policy') || questionText.includes('development')) {
    score += 0.2;
  }
  
  // Check guidance structure
  if (question.guidance && question.guidance.includes('Introduction') && 
      question.guidance.includes('Body') && question.guidance.includes('Conclusion')) {
    score += 0.2;
  }
  
  return Math.min(score, 1);
}

/**
 * Validate difficulty scoring against empirical UPSC data
 */
function validateDifficulty(difficulty: number | undefined, examType: 'prelims' | 'mains'): number {
  if (!difficulty) return 0;
  
  // UPSC difficulty distribution (based on analysis of past papers)
  const expectedRanges = {
    prelims: { min: 6, max: 9, optimal: 7.5 },
    mains: { min: 7, max: 10, optimal: 8 }
  };
  
  const range = expectedRanges[examType];
  
  if (difficulty < range.min || difficulty > range.max) {
    return 0.3; // Outside typical UPSC range
  }
  
  // Closer to optimal = higher score
  const deviation = Math.abs(difficulty - range.optimal);
  return Math.max(0, 1 - (deviation / 3));
}

/**
 * Validate explanation quality
 */
function validateExplanation(explanation: string | undefined): number {
  if (!explanation) return 0;
  
  let score = 0;
  
  // Length check (should be substantial but not excessive)
  const wordCount = explanation.split(' ').length;
  if (wordCount >= 30 && wordCount <= 150) score += 0.3;
  
  // Check for educational value
  if (explanation.includes('because') || explanation.includes('therefore') || 
      explanation.includes('thus') || explanation.includes('hence')) {
    score += 0.2;
  }
  
  // Check for factual references
  if (explanation.includes('Article') || explanation.includes('Constitution') ||
      explanation.includes('Act') || explanation.includes('Committee')) {
    score += 0.3;
  }
  
  // Check for UPSC-specific terminology
  const upscTerms = ['governance', 'polity', 'democracy', 'federalism', 'fundamental rights'];
  const hasUpscTerms = upscTerms.some(term => 
    explanation.toLowerCase().includes(term)
  );
  if (hasUpscTerms) score += 0.2;
  
  return Math.min(score, 1);
}

/**
 * Validate guidance quality for Mains questions
 */
function validateGuidanceQuality(guidance: string | undefined): number {
  if (!guidance) return 0;
  
  let score = 0;
  
  // Check for structured approach
  const structures = ['Introduction', 'Body', 'Conclusion', 'Dimension', 'Blueprint'];
  const hasStructure = structures.some(struct => guidance.includes(struct));
  if (hasStructure) score += 0.4;
  
  // Check for specific guidance elements
  if (guidance.includes('examples') || guidance.includes('case study')) score += 0.2;
  if (guidance.includes('arguments') || guidance.includes('viewpoints')) score += 0.2;
  if (guidance.includes('data') || guidance.includes('statistics')) score += 0.2;
  
  return Math.min(score, 1);
}

/**
 * Validate syllabus alignment
 */
function validateSyllabusAlignment(topic: string | undefined, examType: 'prelims' | 'mains'): number {
  if (!topic) return 0;
  
  // Check against official UPSC syllabus topics
  const allTopics = Object.values(UPSC_SYLLABUS_TOPICS).flat();
  const isOfficialTopic = allTopics.some(officialTopic => 
    topic.toLowerCase().includes(officialTopic.toLowerCase()) ||
    officialTopic.toLowerCase().includes(topic.toLowerCase())
  );
  
  if (isOfficialTopic) return 1;
  
  // Check for syllabus keywords
  const syllabusKeywords = [
    'governance', 'constitution', 'polity', 'international relations',
    'economy', 'environment', 'technology', 'security', 'ethics',
    'culture', 'heritage', 'society', 'geography', 'history'
  ];
  
  const hasKeywords = syllabusKeywords.some(keyword => 
    topic.toLowerCase().includes(keyword)
  );
  
  return hasKeywords ? 0.7 : 0.3;
}

/**
 * Validate timeline relevance for UPSC
 */
export function validateTimelineRelevance(articleDate?: Date): boolean {
  if (!articleDate) return true; // Can't validate without date
  
  const monthsOld = (Date.now() - articleDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return monthsOld <= TIMELINE_RELEVANCE_MONTHS;
}

/**
 * Validate knowledge graph entities
 */
export function validateKnowledgeGraph(graph: KnowledgeGraph): number {
  if (!graph || !graph.nodes.length) return 0;
  
  let score = 0;
  
  // Check entity type distribution
  const entityTypes = graph.nodes.map(n => n.type);
  const uniqueTypes = new Set(entityTypes);
  if (uniqueTypes.size >= 3) score += 0.3; // Good diversity
  
  // Check for UPSC-relevant entities
  const upscRelevantTypes = ['Organization', 'Policy', 'Location', 'Person'];
  const hasRelevantTypes = upscRelevantTypes.some(type => 
    entityTypes.includes(type as any)
  );
  if (hasRelevantTypes) score += 0.4;
  
  // Check relationship quality
  if (graph.edges.length > 0) {
    const avgRelationshipLength = graph.edges.reduce((sum, edge) => 
      sum + edge.label.length, 0) / graph.edges.length;
    
    if (avgRelationshipLength >= 10 && avgRelationshipLength <= 30) {
      score += 0.3; // Good relationship descriptions
    }
  }
  
  return Math.min(score, 1);
}

/**
 * Calculate overall analysis quality score
 */
export function calculateOverallQuality(
  prelimsMetrics: QualityMetrics[],
  mainsMetrics: QualityMetrics[],
  knowledgeGraphScore: number
): number {
  const avgPrelims = prelimsMetrics.length > 0 
    ? prelimsMetrics.reduce((sum, m) => sum + m.overallScore, 0) / prelimsMetrics.length 
    : 0;
  
  const avgMains = mainsMetrics.length > 0
    ? mainsMetrics.reduce((sum, m) => sum + m.overallScore, 0) / mainsMetrics.length
    : 0;
  
  // Weighted average based on content availability
  let totalWeight = 0;
  let weightedSum = 0;
  
  if (prelimsMetrics.length > 0) {
    weightedSum += avgPrelims * 0.4;
    totalWeight += 0.4;
  }
  
  if (mainsMetrics.length > 0) {
    weightedSum += avgMains * 0.4;
    totalWeight += 0.4;
  }
  
  if (knowledgeGraphScore > 0) {
    weightedSum += knowledgeGraphScore * 0.2;
    totalWeight += 0.2;
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}