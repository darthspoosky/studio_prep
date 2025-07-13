/**
 * @fileOverview Relevance Analysis Agent - Determines UPSC relevance and syllabus mapping
 */

import { ai } from '@/ai/genkit';
import { RelevanceAnalysisSchema, NewspaperAnalysisInput } from '../types';
import { validateTimelineRelevance } from '../validators/upsc-validator';
import { getPrompt } from '../prompts/relevance-prompts';

interface RelevanceAgentInput extends NewspaperAnalysisInput {
  prelimsSyllabus: string;
  mainsSyllabus: string;
  articleDate?: Date;
}

/**
 * Enhanced Relevance Analyst Agent with improved UPSC assessment
 */
export const relevanceAnalystAgent = ai.definePrompt({
  name: 'relevanceAnalystAgent',
  input: { 
    schema: RelevanceAnalysisSchema.extend({
      sourceText: RelevanceAnalysisSchema.shape.sourceText,
      prelimsSyllabus: RelevanceAnalysisSchema.shape.prelimsSyllabus,
      mainsSyllabus: RelevanceAnalysisSchema.shape.mainsSyllabus,
      outputLanguage: RelevanceAnalysisSchema.shape.outputLanguage,
    })
  },
  output: { schema: RelevanceAnalysisSchema },
  prompt: getPrompt('relevance-analysis-v2'), // Versioned prompts for A/B testing
});

/**
 * Analyzes article relevance to UPSC with comprehensive scoring
 */
export async function analyzeRelevance(input: RelevanceAgentInput) {
  try {
    // Timeline relevance check
    const timelineRelevant = validateTimelineRelevance(input.articleDate);
    
    // Run AI analysis
    const response = await relevanceAnalystAgent({
      sourceText: input.sourceText,
      prelimsSyllabus: input.prelimsSyllabus,
      mainsSyllabus: input.mainsSyllabus,
      outputLanguage: input.outputLanguage,
    });
    
    const result = response.output;
    
    // Enhanced result with timeline validation
    const enhancedResult = {
      ...result,
      timelineRelevance: timelineRelevant,
      // Adjust confidence based on timeline relevance
      confidenceScore: timelineRelevant ? result.confidenceScore : result.confidenceScore * 0.8,
    };
    
    // Quality assurance checks
    if (enhancedResult.confidenceScore < 0.6 && enhancedResult.isRelevant) {
      console.warn('Low confidence relevance assessment - may need review');
    }
    
    return {
      output: enhancedResult,
      metadata: response.metadata,
    };
    
  } catch (error) {
    console.error('Relevance analysis failed:', error);
    throw new Error(`Relevance analysis failed: ${error.message}`);
  }
}

/**
 * Quick relevance check for batch processing
 */
export async function quickRelevanceCheck(articleText: string): Promise<boolean> {
  // Lightweight keyword-based pre-filter
  const upscKeywords = [
    'government', 'policy', 'constitution', 'parliament', 'supreme court',
    'economy', 'development', 'environment', 'international', 'security',
    'governance', 'reform', 'scheme', 'ministry', 'committee'
  ];
  
  const text = articleText.toLowerCase();
  const keywordMatches = upscKeywords.filter(keyword => text.includes(keyword));
  
  // Require at least 2 keyword matches for relevance
  return keywordMatches.length >= 2;
}

/**
 * Extract subject areas from article for better classification
 */
export function extractSubjectAreas(articleText: string, syllabusTopic?: string): string[] {
  const subjectKeywords = {
    'Polity': ['constitution', 'parliament', 'judiciary', 'governance', 'federalism'],
    'Economy': ['economic', 'fiscal', 'monetary', 'budget', 'gdp', 'inflation'],
    'Environment': ['climate', 'pollution', 'biodiversity', 'forest', 'renewable'],
    'International Relations': ['foreign', 'diplomacy', 'treaty', 'bilateral', 'multilateral'],
    'Geography': ['river', 'mountain', 'climate', 'region', 'location'],
    'History': ['historical', 'heritage', 'culture', 'tradition', 'legacy'],
    'Science & Technology': ['innovation', 'research', 'technology', 'scientific', 'digital'],
    'Security': ['defense', 'terrorism', 'cyber', 'border', 'strategic']
  };
  
  const text = articleText.toLowerCase();
  const detectedSubjects: string[] = [];
  
  Object.entries(subjectKeywords).forEach(([subject, keywords]) => {
    const matches = keywords.filter(keyword => text.includes(keyword));
    if (matches.length >= 2) {
      detectedSubjects.push(subject);
    }
  });
  
  // Add syllabus topic if provided
  if (syllabusTopic) {
    Object.keys(subjectKeywords).forEach(subject => {
      if (syllabusTopic.toLowerCase().includes(subject.toLowerCase())) {
        if (!detectedSubjects.includes(subject)) {
          detectedSubjects.push(subject);
        }
      }
    });
  }
  
  return detectedSubjects;
}