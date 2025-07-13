/**
 * @fileOverview Relevance analysis prompts with A/B testing support
 */

// Prompt versions for A/B testing
const RELEVANCE_PROMPTS = {
  'relevance-analysis-v1': `Think step by step to assess UPSC question probability:

1. TEMPORAL ANALYSIS:
   - Is this a recent development (within 6 months)?
   - Does it relate to current government priorities (Economic Survey, President's Address)?
   - Are there upcoming anniversaries or milestones?

2. SYLLABUS INTERSECTION:
   - How many UPSC subjects does this topic touch (e.g., GS-I, GS-II, GS-III)?
   - Are there clear static-dynamic connections to the core syllabus?
   - Does it involve constitutional/legal aspects? Identify the most specific, granular topic (e.g., "GS Paper II - Governance - E-governance applications").

3. STAKEHOLDER COMPLEXITY:
   - Are multiple institutions involved?
   - Are Center-state dynamics present?
   - Are there international implications?

4. HISTORICAL PRECEDENT & EXAM UTILITY:
   - Have similar topics been asked in previous years?
   - Is the content testable in an objective (Prelims) or analytical (Mains) format?

Based on this analysis, determine if the article is relevant, identify the single most specific syllabus topic, provide your reasoning, and assign a confidence score.

Output your assessment in {{{outputLanguage}}}.

--- ARTICLE ---
"{{{sourceText}}}"

--- PRELIMS SYLLABUS ---
{{{prelimsSyllabus}}}

--- MAINS SYLLABUS ---
{{{mainsSyllabus}}}`,

  'relevance-analysis-v2': `You are a Senior UPSC Faculty with 15+ years of experience analyzing which current affairs topics become exam questions. Assess this article's UPSC relevance using the proven TIERS framework:

**T - TEMPORAL RELEVANCE** (25%)
- Recent developments (last 18 months) score higher
- Government priority areas (Budget, Policy speeches) get bonus points
- Recurring anniversary topics (75th Independence Day themes) are valuable

**I - INSTITUTIONAL COMPLEXITY** (25%)
- Multi-stakeholder issues (Centre-State, India-World, Public-Private)
- Constitutional/legal dimensions
- Governance challenges and solutions

**E - EXAMINATION UTILITY** (25%)
- Can it generate good Prelims MCQs? (factual, specific, unambiguous)
- Can it create analytical Mains questions? (debate, policy evaluation)
- Does it test static+current affairs integration?

**R - REFERENCE PRECEDENT** (15%)
- Similar topics in past UPSC papers
- Alignment with previous year question patterns
- Subject-wise distribution fit

**S - SYLLABUS MAPPING** (10%)
- Direct mention in official syllabus
- Fits under broader syllabus themes
- Cross-cutting relevance across multiple papers

**SCORING GUIDE:**
- 0.9-1.0: Highly likely to appear (within 2 years)
- 0.7-0.89: Good probability (analytical value)
- 0.5-0.69: Moderate relevance (might appear in current affairs)
- Below 0.5: Low probability

Identify the SINGLE most specific syllabus topic and provide subject areas this touches.

**Critical**: Response must be in {{{outputLanguage}}}.

--- ARTICLE TEXT ---
"{{{sourceText}}}"

--- OFFICIAL UPSC PRELIMS SYLLABUS ---
{{{prelimsSyllabus}}}

--- OFFICIAL UPSC MAINS SYLLABUS ---
{{{mainsSyllabus}}}`,

  'relevance-analysis-v3': `As an Expert UPSC Question Paper Setter, apply the RAPID assessment framework to determine if this article can generate high-quality exam questions:

**R - RECENT & RELEVANT** (20%)
• Is this development within the last 18 months? Recent = Higher probability
• Does it relate to ongoing government schemes/policies mentioned in recent Economic Surveys or President's addresses?
• Timeline score: Very recent (last 6 months) = 1.0, 6-12 months = 0.8, 12-18 months = 0.6, older = 0.3

**A - AUTHORITATIVE & FACTUAL** (20%)
• Can we extract specific, verifiable facts for Prelims questions?
• Are there official government data/reports/committee findings?
• Does it reference constitutional articles, legal provisions, or institutional frameworks?

**P - POLICY & GOVERNANCE ANGLE** (25%)
• Does it involve policy formulation, implementation, or evaluation?
• Are there governance challenges, solutions, or innovations discussed?
• Does it highlight Center-State relations, federalism, or inter-institutional dynamics?

**I - INTERDISCIPLINARY NATURE** (20%)
• How many UPSC subjects/papers does this topic span?
• Does it integrate static knowledge with current developments?
• Can it generate both factual (Prelims) and analytical (Mains) questions?

**D - DIFFICULTY & DISCRIMINATION** (15%)
• Can this topic create questions that discriminate between prepared and unprepared candidates?
• Is there scope for nuanced understanding beyond basic current affairs?
• Does it align with UPSC's focus on testing application rather than rote learning?

**OUTPUT REQUIREMENTS:**
1. Calculate scores for each dimension (0-1 scale)
2. Provide overall confidence score (weighted average)
3. Identify the MOST SPECIFIC syllabus topic (not general headings)
4. List all subject areas this article touches
5. Assess timeline relevance (true/false for last 18 months)
6. Provide reasoning for your assessment

**Response language**: {{{outputLanguage}}}

--- ARTICLE FOR ANALYSIS ---
"{{{sourceText}}}"

--- UPSC PRELIMS SYLLABUS ---
{{{prelimsSyllabus}}}

--- UPSC MAINS SYLLABUS ---
{{{mainsSyllabus}}}`
};

/**
 * Get prompt by version with fallback
 */
export function getPrompt(version: string = 'relevance-analysis-v2'): string {
  if (version in RELEVANCE_PROMPTS) {
    return RELEVANCE_PROMPTS[version as keyof typeof RELEVANCE_PROMPTS];
  }
  
  console.warn(`Prompt version ${version} not found, falling back to v2`);
  return RELEVANCE_PROMPTS['relevance-analysis-v2'];
}

/**
 * Get all available prompt versions for A/B testing
 */
export function getAvailableVersions(): string[] {
  return Object.keys(RELEVANCE_PROMPTS);
}

/**
 * Prompt metadata for analysis
 */
export const PROMPT_METADATA = {
  'relevance-analysis-v1': {
    description: 'Original step-by-step analysis',
    focus: 'Systematic evaluation',
    expectedLength: 'Medium',
    optimizedFor: 'Comprehensiveness'
  },
  'relevance-analysis-v2': {
    description: 'TIERS framework with expert persona',
    focus: 'Structured scoring system',
    expectedLength: 'Detailed',
    optimizedFor: 'Accuracy and calibration'
  },
  'relevance-analysis-v3': {
    description: 'RAPID framework with discrimination focus',
    focus: 'Question generation potential',
    expectedLength: 'Comprehensive',
    optimizedFor: 'Exam utility assessment'
  }
};

/**
 * Select prompt version based on configuration
 */
export function selectPromptVersion(config?: {
  experiment?: string;
  userGroup?: string;
  articleLength?: number;
}): string {
  // A/B testing logic
  if (config?.experiment === 'framework-comparison') {
    // Randomly assign users to different frameworks
    const versions = ['relevance-analysis-v2', 'relevance-analysis-v3'];
    const hash = config.userGroup ? hashString(config.userGroup) : Math.random();
    return versions[Math.floor(hash * versions.length)];
  }
  
  // Length-based selection
  if (config?.articleLength) {
    if (config.articleLength < 500) {
      return 'relevance-analysis-v1'; // Faster for short articles
    } else if (config.articleLength > 2000) {
      return 'relevance-analysis-v3'; // More thorough for long articles
    }
  }
  
  // Default to v2 (current best performer)
  return 'relevance-analysis-v2';
}

/**
 * Simple string hashing for consistent user assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) / 2147483647; // Normalize to 0-1
}