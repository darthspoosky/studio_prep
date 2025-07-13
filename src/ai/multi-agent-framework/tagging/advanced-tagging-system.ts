/**
 * @fileOverview Advanced Tagging System for UPSC Questions and Articles
 */

import OpenAI from 'openai';
import { SyllabusNode, syllabusMapper } from '../syllabus/upsc-syllabus-taxonomy';
import { Logger } from '../core/logger';

export interface ContentTag {
  topicId: string;
  topicName: string;
  confidence: number;
  relevanceScore: number;
  level: 'paper' | 'subject' | 'unit' | 'topic' | 'subtopic';
  keywords: string[];
  reasoning: string;
  examType: 'prelims' | 'mains' | 'both';
  difficulty: 'easy' | 'medium' | 'hard';
  weightage: number;
}

export interface TaggedContent {
  id: string;
  content: string;
  type: 'article' | 'question' | 'answer' | 'note';
  primaryTags: ContentTag[];
  secondaryTags: ContentTag[];
  metadata: {
    source?: string;
    year?: number;
    examType?: 'prelims' | 'mains' | 'interview';
    questionType?: 'mcq' | 'descriptive' | 'case_study';
    marks?: number;
    timeToSolve?: number;
    difficultyLevel?: number;
    factualAccuracy?: number;
    upscRelevance?: number;
  };
  tags: {
    syllabus: ContentTag[];
    concepts: string[];
    entities: string[];
    geography: string[];
    personalities: string[];
    events: string[];
    policies: string[];
    institutions: string[];
  };
  timestamp: Date;
  lastUpdated: Date;
}

export interface TaggingAnalysis {
  content: string;
  extractedKeywords: string[];
  namedEntities: {
    persons: string[];
    places: string[];
    organizations: string[];
    dates: string[];
    events: string[];
  };
  syllabusMappings: Array<{
    topic: SyllabusNode;
    confidence: number;
    reasoning: string;
  }>;
  conceptualTags: string[];
  difficulty: {
    level: number;
    reasoning: string;
  };
  upscRelevance: {
    score: number;
    reasoning: string;
  };
}

export class AdvancedTaggingSystem {
  private openai: OpenAI;
  private logger: Logger;

  constructor(openai: OpenAI, logger: Logger) {
    this.openai = openai;
    this.logger = logger;
  }

  /**
   * Perform comprehensive content analysis and tagging
   */
  async analyzeAndTag(
    content: string,
    type: 'article' | 'question' | 'answer' | 'note',
    metadata: Partial<TaggedContent['metadata']> = {}
  ): Promise<TaggedContent> {
    this.logger.info('Starting comprehensive content analysis', { 
      contentLength: content.length,
      type 
    });

    const startTime = Date.now();

    try {
      // Step 1: Extract keywords and entities
      const keywordAnalysis = await this.extractKeywordsAndEntities(content);
      
      // Step 2: Perform syllabus mapping
      const syllabusMapping = await this.performSyllabusMapping(content, keywordAnalysis.extractedKeywords);
      
      // Step 3: Deep conceptual analysis
      const conceptualAnalysis = await this.performConceptualAnalysis(content, type);
      
      // Step 4: Difficulty and relevance assessment
      const assessmentResults = await this.assessDifficultyAndRelevance(content, type, metadata);
      
      // Step 5: Generate comprehensive tags
      const tags = await this.generateComprehensiveTags(content, {
        ...keywordAnalysis,
        ...syllabusMapping,
        ...conceptualAnalysis,
        ...assessmentResults
      });

      const processingTime = Date.now() - startTime;
      this.logger.info('Content analysis completed', { 
        processingTime,
        primaryTags: tags.primaryTags.length,
        secondaryTags: tags.secondaryTags.length
      });

      return {
        id: `tagged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        type,
        primaryTags: tags.primaryTags,
        secondaryTags: tags.secondaryTags,
        metadata: {
          ...metadata,
          difficultyLevel: assessmentResults.difficulty.level,
          upscRelevance: assessmentResults.upscRelevance.score,
          factualAccuracy: await this.assessFactualAccuracy(content),
          timeToSolve: this.estimateTimeToSolve(content, type, assessmentResults.difficulty.level)
        },
        tags: tags.comprehensiveTags,
        timestamp: new Date(),
        lastUpdated: new Date()
      };

    } catch (error) {
      this.logger.error('Content analysis failed', error as Error, { contentLength: content.length });
      throw error;
    }
  }

  /**
   * Extract keywords and named entities from content
   */
  private async extractKeywordsAndEntities(content: string): Promise<{
    extractedKeywords: string[];
    namedEntities: TaggingAnalysis['namedEntities'];
  }> {
    const prompt = `
    Analyze the following content and extract:
    1. Key terms and concepts relevant to UPSC preparation
    2. Named entities (persons, places, organizations, dates, events)
    
    Content: "${content}"
    
    Provide response in JSON format:
    {
      "keywords": ["keyword1", "keyword2", ...],
      "namedEntities": {
        "persons": ["person1", "person2", ...],
        "places": ["place1", "place2", ...],
        "organizations": ["org1", "org2", ...],
        "dates": ["date1", "date2", ...],
        "events": ["event1", "event2", ...]
      }
    }`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    });

    try {
      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        extractedKeywords: result.keywords || [],
        namedEntities: result.namedEntities || {
          persons: [],
          places: [],
          organizations: [],
          dates: [],
          events: []
        }
      };
    } catch (error) {
      this.logger.error('Failed to parse keyword extraction response', error as Error);
      return {
        extractedKeywords: [],
        namedEntities: { persons: [], places: [], organizations: [], dates: [], events: [] }
      };
    }
  }

  /**
   * Map content to UPSC syllabus topics with confidence scores
   */
  private async performSyllabusMapping(content: string, keywords: string[]): Promise<{
    syllabusMappings: Array<{
      topic: SyllabusNode;
      confidence: number;
      reasoning: string;
    }>;
  }> {
    // First, use keyword-based mapping
    const keywordMappings = syllabusMapper.findTopicsByKeywords(keywords, 0.2);
    
    // Then, use AI for deeper semantic mapping
    const aiMappings = await this.aiSyllabusMapping(content);
    
    // Combine and deduplicate results
    const combinedMappings = new Map<string, any>();
    
    // Add keyword-based mappings
    keywordMappings.forEach(mapping => {
      combinedMappings.set(mapping.node.id, {
        topic: mapping.node,
        confidence: mapping.relevanceScore * 0.8, // Slightly lower confidence for keyword-only
        reasoning: `Keyword match: ${mapping.matchedKeywords.join(', ')}`
      });
    });
    
    // Add/enhance with AI mappings
    aiMappings.forEach(mapping => {
      const existing = combinedMappings.get(mapping.topic.id);
      if (existing) {
        // Enhance existing mapping
        existing.confidence = Math.max(existing.confidence, mapping.confidence);
        existing.reasoning += ` | AI analysis: ${mapping.reasoning}`;
      } else {
        combinedMappings.set(mapping.topic.id, mapping);
      }
    });

    return {
      syllabusMappings: Array.from(combinedMappings.values())
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10) // Top 10 mappings
    };
  }

  /**
   * AI-powered syllabus mapping
   */
  private async aiSyllabusMapping(content: string): Promise<Array<{
    topic: SyllabusNode;
    confidence: number;
    reasoning: string;
  }>> {
    const prompt = `
    As a UPSC expert, analyze this content and identify the most relevant UPSC syllabus topics.
    
    Content: "${content}"
    
    Consider these aspects:
    1. Direct syllabus relevance
    2. Historical importance
    3. Current affairs connection
    4. Conceptual depth
    5. Exam pattern alignment
    
    Provide top 5 relevant topics with confidence scores (0-1) and reasoning.
    
    Response format:
    {
      "mappings": [
        {
          "topicArea": "topic name",
          "confidence": 0.85,
          "reasoning": "explanation of relevance"
        }
      ]
    }`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 800
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const mappings: Array<{ topic: SyllabusNode; confidence: number; reasoning: string }> = [];

      result.mappings?.forEach((mapping: any) => {
        // Find matching syllabus nodes
        const matches = syllabusMapper.findTopicsByKeywords([mapping.topicArea], 0.1);
        if (matches.length > 0) {
          mappings.push({
            topic: matches[0].node,
            confidence: mapping.confidence || 0.5,
            reasoning: mapping.reasoning || 'AI-identified relevance'
          });
        }
      });

      return mappings;
    } catch (error) {
      this.logger.error('AI syllabus mapping failed', error as Error);
      return [];
    }
  }

  /**
   * Perform conceptual analysis for deeper understanding
   */
  private async performConceptualAnalysis(content: string, type: string): Promise<{
    conceptualTags: string[];
  }> {
    const prompt = `
    Perform deep conceptual analysis of this ${type}:
    
    "${content}"
    
    Identify:
    1. Core concepts and theories
    2. Interconnected topics
    3. Analytical frameworks
    4. Cause-effect relationships
    5. Contemporary relevance
    
    Provide a list of conceptual tags that capture the essence of this content.
    
    Response format:
    {
      "concepts": ["concept1", "concept2", ...]
    }`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        conceptualTags: result.concepts || []
      };
    } catch (error) {
      this.logger.error('Conceptual analysis failed', error as Error);
      return { conceptualTags: [] };
    }
  }

  /**
   * Assess difficulty level and UPSC relevance
   */
  private async assessDifficultyAndRelevance(
    content: string, 
    type: string, 
    metadata: any
  ): Promise<{
    difficulty: { level: number; reasoning: string };
    upscRelevance: { score: number; reasoning: string };
  }> {
    const prompt = `
    As a UPSC expert, assess this ${type}:
    
    "${content}"
    
    Evaluate:
    1. Difficulty level (1-10 scale):
       - 1-3: Basic/Beginner
       - 4-6: Intermediate
       - 7-8: Advanced
       - 9-10: Expert/Complex
    
    2. UPSC relevance (0-100 scale):
       - Consider syllabus alignment
       - Exam pattern match
       - Question probability
       - Current importance
    
    Response format:
    {
      "difficulty": {
        "level": 6,
        "reasoning": "explanation"
      },
      "upscRelevance": {
        "score": 85,
        "reasoning": "explanation"
      }
    }`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 400
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        difficulty: result.difficulty || { level: 5, reasoning: 'Default assessment' },
        upscRelevance: result.upscRelevance || { score: 50, reasoning: 'Default assessment' }
      };
    } catch (error) {
      this.logger.error('Difficulty assessment failed', error as Error);
      return {
        difficulty: { level: 5, reasoning: 'Assessment failed' },
        upscRelevance: { score: 50, reasoning: 'Assessment failed' }
      };
    }
  }

  /**
   * Generate comprehensive tag structure
   */
  private async generateComprehensiveTags(content: string, analysis: any): Promise<{
    primaryTags: ContentTag[];
    secondaryTags: ContentTag[];
    comprehensiveTags: TaggedContent['tags'];
  }> {
    const primaryTags: ContentTag[] = [];
    const secondaryTags: ContentTag[] = [];

    // Process syllabus mappings into tags
    analysis.syllabusMappings?.forEach((mapping: any, index: number) => {
      const tag: ContentTag = {
        topicId: mapping.topic.id,
        topicName: mapping.topic.name,
        confidence: mapping.confidence,
        relevanceScore: mapping.confidence * 100,
        level: mapping.topic.level,
        keywords: mapping.topic.keywords,
        reasoning: mapping.reasoning,
        examType: mapping.topic.examType,
        difficulty: mapping.topic.difficulty,
        weightage: mapping.topic.weightage
      };

      if (index < 3 && mapping.confidence > 0.6) {
        primaryTags.push(tag);
      } else {
        secondaryTags.push(tag);
      }
    });

    const comprehensiveTags: TaggedContent['tags'] = {
      syllabus: [...primaryTags, ...secondaryTags],
      concepts: analysis.conceptualTags || [],
      entities: [
        ...analysis.namedEntities?.persons || [],
        ...analysis.namedEntities?.organizations || []
      ],
      geography: analysis.namedEntities?.places || [],
      personalities: analysis.namedEntities?.persons || [],
      events: analysis.namedEntities?.events || [],
      policies: this.extractPolicies(content),
      institutions: this.extractInstitutions(content)
    };

    return { primaryTags, secondaryTags, comprehensiveTags };
  }

  /**
   * Assess factual accuracy of content
   */
  private async assessFactualAccuracy(content: string): Promise<number> {
    // This would involve fact-checking against reliable sources
    // For now, return a baseline score
    const wordCount = content.split(' ').length;
    const hasNumbers = /\d/.test(content);
    const hasProperNouns = /[A-Z][a-z]+/.test(content);
    
    let score = 70; // Base score
    if (hasNumbers) score += 10;
    if (hasProperNouns) score += 10;
    if (wordCount > 100) score += 5;
    
    return Math.min(score, 95);
  }

  /**
   * Estimate time to solve based on content and difficulty
   */
  private estimateTimeToSolve(content: string, type: string, difficulty: number): number {
    const wordCount = content.split(' ').length;
    
    let baseTime = 0;
    switch (type) {
      case 'question':
        baseTime = wordCount < 50 ? 2 : wordCount < 100 ? 5 : 10;
        break;
      case 'article':
        baseTime = Math.ceil(wordCount / 200) * 3; // 3 min per 200 words
        break;
      default:
        baseTime = Math.ceil(wordCount / 150) * 2;
    }
    
    // Adjust for difficulty
    const difficultyMultiplier = 1 + (difficulty - 5) * 0.2;
    return Math.ceil(baseTime * difficultyMultiplier);
  }

  /**
   * Extract policy names from content
   */
  private extractPolicies(content: string): string[] {
    const policyKeywords = [
      'policy', 'scheme', 'act', 'bill', 'mission', 'yojana', 'program', 'initiative'
    ];
    
    const policies: string[] = [];
    policyKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b\\w+\\s+${keyword}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        policies.push(...matches);
      }
    });
    
    return [...new Set(policies)];
  }

  /**
   * Extract institution names from content
   */
  private extractInstitutions(content: string): string[] {
    const institutionKeywords = [
      'ministry', 'commission', 'committee', 'board', 'council', 'authority', 
      'corporation', 'bank', 'university', 'institute'
    ];
    
    const institutions: string[] = [];
    institutionKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b\\w+\\s+${keyword}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        institutions.push(...matches);
      }
    });
    
    return [...new Set(institutions)];
  }

  /**
   * Bulk tag multiple contents
   */
  async bulkTagContents(
    contents: Array<{
      content: string;
      type: 'article' | 'question' | 'answer' | 'note';
      metadata?: Partial<TaggedContent['metadata']>;
    }>
  ): Promise<TaggedContent[]> {
    const results: TaggedContent[] = [];
    
    for (const item of contents) {
      try {
        const tagged = await this.analyzeAndTag(item.content, item.type, item.metadata);
        results.push(tagged);
      } catch (error) {
        this.logger.error('Failed to tag content in bulk operation', error as Error, {
          contentLength: item.content.length,
          type: item.type
        });
      }
    }
    
    return results;
  }

  /**
   * Re-analyze and update tags for existing content
   */
  async updateTags(existingContent: TaggedContent): Promise<TaggedContent> {
    const updatedContent = await this.analyzeAndTag(
      existingContent.content,
      existingContent.type,
      existingContent.metadata
    );
    
    return {
      ...updatedContent,
      id: existingContent.id,
      timestamp: existingContent.timestamp,
      lastUpdated: new Date()
    };
  }
}

/**
 * Tag filtering and search utilities
 */
export class TagSearchEngine {
  /**
   * Search tagged content by various criteria
   */
  static searchByTags(
    contents: TaggedContent[],
    criteria: {
      syllabusTopic?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      examType?: 'prelims' | 'mains' | 'both';
      relevanceThreshold?: number;
      concepts?: string[];
      entities?: string[];
    }
  ): TaggedContent[] {
    return contents.filter(content => {
      // Filter by syllabus topic
      if (criteria.syllabusTopic) {
        const hasTopicMatch = content.tags.syllabus.some(tag => 
          tag.topicName.toLowerCase().includes(criteria.syllabusTopic!.toLowerCase()) ||
          tag.topicId === criteria.syllabusTopic
        );
        if (!hasTopicMatch) return false;
      }

      // Filter by difficulty
      if (criteria.difficulty) {
        const difficultyMap = { easy: [1, 3], medium: [4, 6], hard: [7, 10] };
        const [min, max] = difficultyMap[criteria.difficulty];
        if (!content.metadata.difficultyLevel || 
            content.metadata.difficultyLevel < min || 
            content.metadata.difficultyLevel > max) {
          return false;
        }
      }

      // Filter by exam type
      if (criteria.examType && criteria.examType !== 'both') {
        const hasExamTypeMatch = content.tags.syllabus.some(tag => 
          tag.examType === criteria.examType || tag.examType === 'both'
        );
        if (!hasExamTypeMatch) return false;
      }

      // Filter by relevance threshold
      if (criteria.relevanceThreshold) {
        if (!content.metadata.upscRelevance || 
            content.metadata.upscRelevance < criteria.relevanceThreshold) {
          return false;
        }
      }

      // Filter by concepts
      if (criteria.concepts && criteria.concepts.length > 0) {
        const hasConceptMatch = criteria.concepts.some(concept =>
          content.tags.concepts.some(contentConcept =>
            contentConcept.toLowerCase().includes(concept.toLowerCase())
          )
        );
        if (!hasConceptMatch) return false;
      }

      // Filter by entities
      if (criteria.entities && criteria.entities.length > 0) {
        const hasEntityMatch = criteria.entities.some(entity =>
          content.tags.entities.some(contentEntity =>
            contentEntity.toLowerCase().includes(entity.toLowerCase())
          )
        );
        if (!hasEntityMatch) return false;
      }

      return true;
    });
  }

  /**
   * Get content recommendations based on user's study pattern
   */
  static getRecommendations(
    contents: TaggedContent[],
    userProfile: {
      completedTopics: string[];
      weakAreas: string[];
      studyTime: number; // minutes per day
      targetExam: 'prelims' | 'mains' | 'both';
      preferredDifficulty: 'easy' | 'medium' | 'hard';
    }
  ): TaggedContent[] {
    return contents
      .filter(content => {
        // Filter by target exam
        const examMatch = content.tags.syllabus.some(tag =>
          tag.examType === userProfile.targetExam || tag.examType === 'both'
        );
        
        // Prioritize weak areas
        const isWeakArea = content.tags.syllabus.some(tag =>
          userProfile.weakAreas.includes(tag.topicId)
        );
        
        // Avoid already mastered topics (unless review needed)
        const isCompleted = content.tags.syllabus.every(tag =>
          userProfile.completedTopics.includes(tag.topicId)
        );

        return examMatch && (isWeakArea || !isCompleted);
      })
      .sort((a, b) => {
        // Sort by priority: weak areas first, then by relevance
        const aIsWeak = a.tags.syllabus.some(tag =>
          userProfile.weakAreas.includes(tag.topicId)
        );
        const bIsWeak = b.tags.syllabus.some(tag =>
          userProfile.weakAreas.includes(tag.topicId)
        );
        
        if (aIsWeak && !bIsWeak) return -1;
        if (!aIsWeak && bIsWeak) return 1;
        
        // Then by UPSC relevance
        return (b.metadata.upscRelevance || 0) - (a.metadata.upscRelevance || 0);
      })
      .slice(0, 20); // Return top 20 recommendations
  }
}