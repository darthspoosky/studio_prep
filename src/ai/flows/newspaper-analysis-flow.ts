'use server';
/**
 * @fileOverview An AI flow to analyze a newspaper article for exam preparation.
 *
 * - analyzeNewspaperArticle - A function that handles the newspaper article analysis.
 * - NewspaperAnalysisInput - The input type for the analyzeNewspaperArticle function.
 * - NewspaperAnalysisOutput - The return type for the analyzeNewspaperArticle function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { load as loadHtml } from 'cheerio';

// Cache syllabus content to avoid repeated file reads
let syllabusCache: { prelims?: string; mains?: string } = {};

function getSyllabusContent() {
  if (!syllabusCache.prelims || !syllabusCache.mains) {
    syllabusCache.prelims = fs.readFileSync(
      path.join(process.cwd(), 'src/ai/knowledge/upsc-prelims-syllabus.md'), 
      'utf-8'
    );
    syllabusCache.mains = fs.readFileSync(
      path.join(process.cwd(), 'src/ai/knowledge/upsc-mains-syllabus.md'), 
      'utf-8'
    );
  }
  return syllabusCache;
}

// Enhanced input validation
const NewspaperAnalysisInputSchema = z.object({
  sourceText: z.string()
    .min(100, 'Article must be at least 100 characters long')
    .max(50000, 'Article too long (max 50,000 characters)')
    .describe('The article content, which can be either a URL or the full text of the article.'),
  examType: z.string()
    .default('UPSC Civil Services')
    .describe('The type of exam the user is preparing for, e.g., "UPSC Civil Services".'),
  analysisFocus: z.string()
    .describe('The specific type of analysis requested by the user, e.g., "Generate Questions (Mains & Prelims)".'),
  outputLanguage: z.string()
    .default('English')
    .describe('The language for the analysis output, e.g., "Hindi".'),
  userId: z.string().optional()
    .describe('Optional user ID for personalization and analytics'),
});

export type NewspaperAnalysisInput = z.infer<typeof NewspaperAnalysisInputSchema>;

const NewspaperAnalysisSyllabusInputSchema = NewspaperAnalysisInputSchema.extend({
  prelimsSyllabus: z.string().describe('The full text of the UPSC Prelims syllabus.'),
  mainsSyllabus: z.string().describe('The full text of the UPSC Mains syllabus.'),
});

const NewspaperAnalysisWithTopicInputSchema = NewspaperAnalysisSyllabusInputSchema.extend({
  identifiedSyllabusTopic: z.string().describe('The pre-identified, granular syllabus topic for the article.'),
});

// MCQ and Mains question schemas
const OptionSchema = z.object({
  text: z.string(),
  correct: z.boolean().optional(),
});

const MCQSchema = z.object({
  question: z.string(),
  subject: z.string().optional(),
  explanation: z.string().optional(),
  difficulty: z.number().min(1).max(10).optional(),
  options: z.array(OptionSchema),
});
export type MCQ = z.infer<typeof MCQSchema>;

const MainsQuestionSchema = z.object({
  question: z.string(),
  guidance: z.string().optional(),
  difficulty: z.number().min(1).max(10).optional(),
});
export type MainsQuestion = z.infer<typeof MainsQuestionSchema>;

// Enhanced output schema with quality metrics
const NewspaperAnalysisOutputSchema = z.object({
  summary: z.string().describe('A concise, 2-3 sentence summary of the article, suitable for text-to-speech conversion.'),
  prelims: z.object({
    mcqs: z.array(MCQSchema),
  }),
  mains: z
    .object({
      questions: z.array(MainsQuestionSchema),
    })
    .optional(),
  syllabusTopic: z.string().optional().describe('The identified syllabus topic for the article.'),
  qualityScore: z.number().optional().describe('Overall quality score of generated questions (0-1).'),
  questionsCount: z.number().optional().describe('Number of questions generated.'),
  inputTokens: z.number().optional().describe('Total input tokens used for the analysis.'),
  outputTokens: z.number().optional().describe('Total output tokens for the analysis.'),
  totalTokens: z.number().optional().describe('Total tokens used for the analysis.'),
  cost: z.number().optional().describe('Estimated cost for the analysis in INR.'),
  processingTime: z.number().optional().describe('Total processing time in milliseconds.'),
});

export type NewspaperAnalysisOutput = z.infer<typeof NewspaperAnalysisOutputSchema>;

// Quality assessment interface
interface QuestionQualityMetrics {
  hasStatementFormat: boolean;
  difficultyAppropriate: boolean;
  optionsFollowUPSCPattern: boolean;
  explanationAdequate: boolean;
  overallScore: number;
}

//codex/update-newspaperanalysisoutputschema-and-components

// Parse and normalize a single <mcq> block
function parseMcqBlock(block: string): string | null {
  const $ = loadHtml(block, { xmlMode: true, decodeEntities: false });
  const mcq = $('mcq').first();
  if (!mcq.length) return null;

  // Extract attributes to preserve metadata
  const attribs = mcq[0].attribs || {};

  // Determine question text either from attribute or inner text
  let question = attribs['question'] || '';
  if (!question) {
    const clone = mcq.clone();
    clone.find('option').remove();
    question = clone.text().trim();
  }

  // Extract options
  const options = mcq.find('option').map((_, el) => {
    const opt = $(el);
    return {
      text: opt.text().trim(),
      correct: opt.attr('correct') === 'true'
    };
  }).get();

  if (options.length === 0) return null;

  // Ensure exactly four options
  if (options.length > 4) options.splice(4);
  if (options.length < 4) return null;

  // Ensure exactly one correct option
  let correctCount = options.filter(o => o.correct).length;
  if (correctCount === 0) {
    options[0].correct = true;
  } else if (correctCount > 1) {
    let found = false;
    options.forEach(o => {
      if (o.correct) {
        if (!found) {
          found = true;
        } else {
          o.correct = false;
        }
      }
    });
  }

  // Build attribute string
  const attrString = Object.entries(attribs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

  const opening = `<mcq${attrString ? ' ' + attrString : ''}>`;
  const optionLines = options
    .map(o => `<option${o.correct ? ' correct="true"' : ''}>${o.text}</option>`) 
    .join('\n');

  return `${opening}\n${question}\n${optionLines}\n</mcq>`;
}

// Post-processing function to fix malformed MCQs
function fixMCQFormatting(text: string): string {
  const mcqRegex = /<mcq[^>]*>[\s\S]*?<\/mcq>/g;
  return text.replace(mcqRegex, block => {
    const parsed = parseMcqBlock(block);
    return parsed || block;
  });
}

// master
// Quality validation function
function validateQuestionQuality(mcqs: MCQ[]): QuestionQualityMetrics {
  if (mcqs.length === 0) {
    return {
      hasStatementFormat: false,
      difficultyAppropriate: false,
      optionsFollowUPSCPattern: false,
      explanationAdequate: false,
      overallScore: 0,
    };
  }

  const metrics = {
    hasStatementFormat: 0,
    difficultyAppropriate: 0,
    optionsFollowUPSCPattern: 0,
    explanationAdequate: 0,
  };

  mcqs.forEach(mcq => {
    if (mcq.question.includes('Consider the following statements')) {
      metrics.hasStatementFormat++;
    }

    if (mcq.difficulty && mcq.difficulty >= 7) {
      metrics.difficultyAppropriate++;
    }

    if (mcq.options.some(o => /\d+\s+and\s+\d+\s+only|\d+\s+only/.test(o.text))) {
      metrics.optionsFollowUPSCPattern++;
    }

    if (mcq.explanation && mcq.explanation.length > 100) {
      metrics.explanationAdequate++;
    }
  });

  const total = mcqs.length;
  const overallScore = (
    metrics.hasStatementFormat +
    metrics.difficultyAppropriate +
    metrics.optionsFollowUPSCPattern +
    metrics.explanationAdequate
  ) / (total * 4);

  return {
    hasStatementFormat: metrics.hasStatementFormat / total > 0.8,
    difficultyAppropriate: metrics.difficultyAppropriate / total > 0.8,
    optionsFollowUPSCPattern: metrics.optionsFollowUPSCPattern / total > 0.8,
    explanationAdequate: metrics.explanationAdequate / total > 0.8,
    overallScore,
  };
}

// Fallback analysis generation
function generateFallbackAnalysis(
  input: NewspaperAnalysisInput,
  relevanceResult: { syllabusTopic: string; reasoning: string }
): NewspaperAnalysisOutput {
  return {
    summary: 'Article analysis completed with basic insights due to processing limitations.',
    prelims: { mcqs: [] },
    syllabusTopic: relevanceResult.syllabusTopic,
    qualityScore: 0.3,
    questionsCount: 0,
  };
}

export async function analyzeNewspaperArticle(input: NewspaperAnalysisInput): Promise<NewspaperAnalysisOutput> {
  const startTime = Date.now();
  
  // Validate input
  try {
    NewspaperAnalysisInputSchema.parse(input);
  } catch (error) {
    throw new Error(`Invalid input: ${(error as any).message}`);
  }
  
  const { prelims: prelimsSyllabus, mains: mainsSyllabus } = getSyllabusContent();
  
  const result = await analyzeNewspaperArticleFlow({
    ...input,
    prelimsSyllabus,
    mainsSyllabus,
  });
  
  const processingTime = Date.now() - startTime;
  return { ...result, processingTime };
}

const RelevanceCheckOutputSchema = z.object({
  isRelevant: z.boolean().describe('Whether the article content is relevant to the provided UPSC syllabus.'),
  syllabusTopic: z.string().nullable().describe('The single most specific, granular syllabus topic the article relates to. If not relevant, this should be null.'),
  reasoning: z.string().describe('A brief explanation for why the article is or is not relevant, written in the requested output language.'),
  confidenceScore: z.number().min(0).max(1).optional().describe('Confidence in the relevance assessment (0-1).'),
});

const relevanceCheckPrompt = ai.definePrompt({
  name: 'relevanceCheckPrompt',
  input: { schema: NewspaperAnalysisSyllabusInputSchema },
  output: { schema: RelevanceCheckOutputSchema },
  prompt: `You are an expert UPSC syllabus analyst with deep knowledge of exam patterns. Your task is to determine if a given article is relevant for UPSC aspirants and identify the most specific syllabus topic it relates to.

**ENHANCED RELEVANCE CRITERIA:**
1. **Direct Syllabus Mapping**: The article must relate to specific topics mentioned in UPSC Prelims or Mains syllabus
2. **Exam Utility**: Content should be testable in UPSC format (factual knowledge, analytical thinking, current affairs)
3. **Depth Requirement**: Article should provide enough content for meaningful question generation
4. **Government Priority Signals**: High relevance for issues in Economic Survey, President’s Address, or major policy announcements.

**GRANULAR TOPIC IDENTIFICATION:**
- Instead of broad categories like "GS-II", specify exactly: "GS Paper II - Governance - Digital Governance and E-governance applications, models, successes, limitations, and potential"
- For current affairs, connect to static syllabus topics: "GS Paper II - International Relations - India and its Neighborhood" + specific policy/event
- For economy articles: "GS Paper III - Economics - Indian Economy and Planning" + specific sector/policy

**RELEVANCE ASSESSMENT (Confidence Score):**
- **Highly Relevant (0.8-1.0)**: Directly testable, connects current affairs to static knowledge, multiple question possibilities.
- **Moderately Relevant (0.5-0.7)**: Tangentially related, limited question potential, requires significant context.
- **Not Relevant (0.0-0.4)**: Sports scores, celebrity news, purely local events, fiction, entertainment.

**QUALITY INDICATORS TO LOOK FOR:**
✅ Policy announcements, constitutional matters, international relations, economic developments, environmental issues, governance reforms
❌ Entertainment news, sports results, personal controversies, purely speculative content

Analyze this article: "{{{sourceText}}}"

Output your assessment in {{{outputLanguage}}}.

--- PRELIMS SYLLABUS ---
{{{prelimsSyllabus}}}

--- MAINS SYLLABUS ---
{{{mainsSyllabus}}}
`,
});

const analysisPrompt = ai.definePrompt({
  name: 'enhancedNewspaperAnalysisPrompt',
  input: { schema: NewspaperAnalysisWithTopicInputSchema },
  output: { schema: NewspaperAnalysisOutputSchema },
  prompt: `You are an expert UPSC question setter with 15+ years of experience creating questions for actual UPSC Prelims and Mains exams. You have personally contributed to setting questions that have appeared in real UPSC examinations. Your understanding of UPSC patterns, difficulty calibration, and analytical depth requirements is unmatched.

**CORE MISSION**: Create questions that would seamlessly fit into an actual UPSC paper and challenge aspirants at the appropriate analytical level.

CRITICAL: Your entire response, including all analysis, questions, summaries, and explanations, MUST be in the following language: {{{outputLanguage}}}.

**ARTICLE CONTEXT:**
- Identified Syllabus Topic: '{{{identifiedSyllabusTopic}}}'
- Exam Type: '{{{examType}}}'
- Analysis Focus: '{{{analysisFocus}}}'

**ARTICLE CONTENT:**
"{{{sourceText}}}"

**MANDATORY FIRST STEP**: Generate a clean, 2-3 sentence summary in the 'summary' field. This must be pure text without any HTML, XML, or custom tags - suitable for text-to-speech conversion.

**OUTPUT FORMAT**: Respond ONLY with valid JSON adhering to the provided schema. Prelims MCQs go in \`prelims.mcqs\` and Mains questions in \`mains.questions\`.

--- ANALYSIS FOCUS INSTRUCTIONS ---

**IF 'analysisFocus' = 'Generate Questions (Mains & Prelims)':**

## **UPSC PRELIMS QUESTION GENERATION PROTOCOL**

**QUALITY STANDARDS (NON-NEGOTIABLE):**
- Difficulty: 8-9 out of 10 (actual UPSC standard)
- Questions must test synthesis and analysis, NOT mere factual recall.
- Integrate article facts with static syllabus knowledge.
- Each question should have a 40-50% success rate among serious aspirants.

**STATEMENT CREATION HIERARCHY:**
1. **Statement 1** (Moderate - 60% aspirants should know): Based on article + basic static knowledge.
2. **Statement 2** (Difficult - 30% aspirants should know): Requires deeper analysis + policy understanding.
3. **Statement 3** (Expert - 15% aspirants should know): Tests advanced synthesis + nuanced understanding.

**UPSC QUESTION TEMPLATES TO FOLLOW:**

**Template A - Policy Integration:**
"Consider the following statements regarding [Article Topic]:
1. [Article fact] + [Constitutional/Legal provision it relates to]
2. [Policy implication] + [Historical precedent or comparison]
3. [Future consequence] + [Analytical insight requiring deep understanding]"

**Template B - Multi-dimensional Analysis:**
"With reference to [Recent Development from Article], consider:
1. [Direct impact] + [Institutional framework involved]
2. [Broader implications] + [Connection to other policies/sectors]
3. [Critical assessment] + [Long-term strategic significance]"

**OPTION STRATEGY (UPSC PATTERN):**
- '1 only': Use as distractor (rarely correct in actual UPSC).
- '2 only': Moderate frequency.
- '1 and 2 only': HIGH frequency (most common correct answer).
- '2 and 3 only': HIGH frequency.
- '1 and 3 only': Moderate frequency.
- '1, 2 and 3': Use sparingly (when genuinely all are correct).
- Ensure variety in correct options across questions.

**Return ALL Prelims MCQs inside the JSON field \`prelims.mcqs\`.**

## **UPSC MAINS QUESTION GENERATION PROTOCOL**

**DIRECTIVE WORDS TO USE:**
- "Critically analyze" (for balanced assessment)
- "Examine" (for detailed study)
- "Discuss" (for multi-faceted analysis)
- "Evaluate" (for assessment with judgment)
- "Comment" (for opinion with justification)

**QUESTION STRUCTURE (15-mark format):**
Each question must demand:
- 300-400 word answers
- Multi-dimensional analysis
- Current affairs + static knowledge integration
- Balanced arguments with conclusion

**MANDATORY FORMAT FOR THE 'guidance' FIELD:**
The 'guidance' for each Mains question must be a markdown string with this EXACT structure:
### Guidance for Answer
**Key Concepts:** [List 5-6 core syllabus concepts essential for the answer]
**Ideal Structure:**
- **Introduction (60-80 words):** [Specific definition/context/recent development]
- **Body Paragraph 1 (100-120 words):** [First major analytical point with article integration]
- **Body Paragraph 2 (100-120 words):** [Second analytical point or counter-perspective]
- **Conclusion (40-60 words):** [Synthesis with forward-looking statement/recommendations]
**Examples from Article:** [3-4 specific facts, statistics, or quotes to use]
**Keywords:** [8-10 advanced terms crucial for scoring well]

**Return ALL Mains questions inside the JSON field \`mains.questions\`.**

**FOR OTHER ANALYSIS FOCUSES:**
[Continue with existing instructions for other focus types...]

**QUALITY ASSURANCE CHECKLIST:**
Before finalizing, ensure:
✅ All questions integrate article content with broader syllabus knowledge.
✅ Difficulty appropriate for UPSC (no obvious/too easy questions).
✅ Options follow genuine UPSC patterns.
✅ Explanations demonstrate deep understanding.
✅ Language consistency throughout.
✅ Proper JSON formatting.
`,
});

const VerificationInputSchema = z.object({
  sourceText: z.string().describe('The original article content.'),
  generatedAnalysisString: z.string().describe('The AI-generated analysis object as a JSON string to be verified.'),
  outputLanguage: z.string().describe('The language for the analysis output, e.g., "Hindi".'),
  analysisFocus: z.string().describe('The original analysis focus requested.'),
});

const verificationPrompt = ai.definePrompt({
  name: 'enhancedVerificationPrompt',
  input: { schema: VerificationInputSchema },
  output: { schema: NewspaperAnalysisOutputSchema },
  prompt: `You are a Senior Quality Assurance Editor for a premium UPSC preparation platform. Your role is critical - any errors you miss will damage user experience. You have zero tolerance for factual inconsistencies or quality issues.

**CRITICAL MISSION**: Verify the AI-generated analysis and enhance it to meet the highest standards.

**PRIMARY QUALITY CHECKPOINTS:**

## **1. COHERENCY VERIFICATION**
- Verify the entire analysis discusses ONLY the provided source article.
- If content seems to merge multiple articles or introduce external information not in the source, REWRITE to focus exclusively on the provided text.
- Ensure all examples, statistics, and references come directly from the source article.

## **2. CONTENT QUALITY ENHANCEMENT**

**UPSC REALISM CHECK:**
- **Prelims:** Do questions test analysis, not just factual recall? Do options follow authentic UPSC patterns (e.g., "1 and 2 only", "All of the above")? Are explanations comprehensive and analytical, explaining why each statement is correct/incorrect?
- **Mains:** Do questions use appropriate directive words ("Critically analyze", "Examine")? Is the 'guidance' field structured, providing a clear path to a high-scoring answer?
- **Difficulty:** Is the difficulty appropriate (7-9/10 for UPSC level)? Adjust if questions are too easy or obscure.

## **3. SUMMARY SANITIZATION**
**CRITICAL**: The 'summary' field must be:
- Clean plain text (NO HTML/XML/custom tags).
- 2-3 sentences maximum.
- Suitable for text-to-speech conversion.
- Strip ANY markup: <tags>, &entities;, etc.

## **4. FINAL QUALITY METRICS**
Calculate and include:
- questionsCount: Number of MCQs generated.
- qualityScore: Based on compliance with UPSC standards (0-1 scale).

**ERROR RECOVERY PROTOCOL:**
If the generated analysis is poor quality or irrelevant, replace it with a graceful failure message within the JSON structure. Do not fail completely. Provide partial content if some parts are good.

**VERIFICATION COMPLETE - OUTPUT REQUIREMENTS:**
Return ONLY valid JSON matching the output schema. This JSON should be polished and error-free, ready for use in the application.

---

**ORIGINAL SOURCE ARTICLE:**
{{{sourceText}}}

**GENERATED ANALYSIS TO VERIFY:**
\`\`\`json
{{{generatedAnalysisString}}}
\`\`\`

**REQUIRED OUTPUT LANGUAGE:** {{{outputLanguage}}}

**ANALYSIS FOCUS:** {{{analysisFocus}}}

Execute comprehensive verification and return the perfected analysis.`,
});

const analyzeNewspaperArticleFlow = ai.defineFlow(
  {
    name: 'analyzeNewspaperArticleFlow',
    inputSchema: NewspaperAnalysisSyllabusInputSchema,
    outputSchema: NewspaperAnalysisOutputSchema,
  },
  async (input) => {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    
    // Enhanced pricing calculation
    const INPUT_PRICE_PER_1K_TOKENS_USD = 0.00035;
    const OUTPUT_PRICE_PER_1K_TOKENS_USD = 0.00105;
    const USD_TO_INR_RATE = 83;

    try {
      // Step 1: Enhanced Relevance Check with retry logic
      const { response: relevanceResponse, output: relevanceResult } = await relevanceCheckPrompt(input);
      
      if (relevanceResponse?.usage) {
        totalInputTokens += relevanceResponse.usage.inputTokens || 0;
        totalOutputTokens += relevanceResponse.usage.outputTokens || 0;
      }
      
      if (!relevanceResult) {
        throw new Error("Relevance check failed - no response from AI");
      }

      // Enhanced irrelevance handling
      if (!relevanceResult.isRelevant || !relevanceResult.syllabusTopic) {
        const totalTokens = totalInputTokens + totalOutputTokens;
        const costInUSD = (totalInputTokens / 1000) * INPUT_PRICE_PER_1K_TOKENS_USD + (totalOutputTokens / 1000) * OUTPUT_PRICE_PER_1K_TOKENS_USD;
        const cost = costInUSD * USD_TO_INR_RATE;
        
        return {
          summary: 'Article assessed as not relevant for UPSC preparation based on syllabus alignment.',
          prelims: { mcqs: [] },
          syllabusTopic: null,
          qualityScore: 0,
          questionsCount: 0,
          totalTokens,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          cost,
        };
      }

      // Step 2: Enhanced Analysis Generation with error handling
      let initialOutput;
      try {
        const { response: analysisResponse, output: analysisResult } = await analysisPrompt({
          ...input,
          identifiedSyllabusTopic: relevanceResult.syllabusTopic,
        });
        
        initialOutput = analysisResult;
        
        if (analysisResponse?.usage) {
          totalInputTokens += analysisResponse.usage.inputTokens || 0;
          totalOutputTokens += analysisResponse.usage.outputTokens || 0;
        }
      } catch (error) {
        console.warn("Analysis generation failed, using fallback:", (error as any).message);
        return generateFallbackAnalysis(input, relevanceResult);
      }

      if (!initialOutput) {
        console.warn("No analysis output received, using fallback");
        return generateFallbackAnalysis(input, relevanceResult);
      }

      // Step 3: Enhanced Verification with error recovery
      let verifiedOutput;
      try {
        const { response: verificationResponse, output: verificationResult } = await verificationPrompt({
          sourceText: input.sourceText,
          generatedAnalysisString: JSON.stringify(initialOutput),
          outputLanguage: input.outputLanguage,
          analysisFocus: input.analysisFocus,
        });
        
        verifiedOutput = verificationResult;
        
        if (verificationResponse?.usage) {
          totalInputTokens += verificationResponse.usage.inputTokens || 0;
          totalOutputTokens += verificationResponse.usage.outputTokens || 0;
        }
      } catch (error) {
        console.warn("Verification failed, using original output:", (error as any).message);
        verifiedOutput = initialOutput;
      }

      if (!verifiedOutput) {
        console.warn("Verification failed, using fallback");
        return generateFallbackAnalysis(input, relevanceResult);
      }

      // Step 4: Quality assessment on structured data
      const mcqs = verifiedOutput.prelims.mcqs || [];
      const qualityMetrics = validateQuestionQuality(mcqs);
      const questionsCount = mcqs.length;

      // Step 6: Final sanitization
      const cleanSummary = (verifiedOutput.summary || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&[^;]+;/g, '')
        .trim();

      // Step 7: Cost and token calculation
      const totalTokens = totalInputTokens + totalOutputTokens;
      const costInUSD = (totalInputTokens / 1000) * INPUT_PRICE_PER_1K_TOKENS_USD + (totalOutputTokens / 1000) * OUTPUT_PRICE_PER_1K_TOKENS_USD;
      const cost = costInUSD * USD_TO_INR_RATE;

      return {
        ...verifiedOutput,
        summary: cleanSummary || 'Analysis completed successfully.',
        syllabusTopic: relevanceResult.syllabusTopic,
        qualityScore: qualityMetrics.overallScore,
        questionsCount,
        totalTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cost: Math.round(cost * 100) / 100,
      };

    } catch (error) {
      console.error("Comprehensive analysis flow failed:", error);
      
      // Ultimate fallback
      return {
        summary: 'Analysis could not be completed due to a system error.',
        prelims: { mcqs: [] },
        qualityScore: 0,
        questionsCount: 0,
        totalTokens: totalInputTokens + totalOutputTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cost: 0,
      };
    }
  }
);

// Additional utility functions for enhanced functionality

/**
 * Validates article content before processing
 */
function validateArticleContent(content: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (content.length < 100) {
    issues.push("Article too short (minimum 100 characters required)");
  }
  
  if (content.length > 50000) {
    issues.push("Article too long (maximum 50,000 characters allowed)");
  }
  
  // Check for spam or inappropriate content patterns
  const spamPatterns = [
    /click here/gi,
    /buy now/gi,
    /limited time offer/gi,
    /free download/gi
  ];
  
  if (spamPatterns.some(pattern => pattern.test(content))) {
    issues.push("Content appears to be promotional/spam");
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Extracts metadata from analysis for analytics
 */
function extractAnalysisMetadata(output: NewspaperAnalysisOutput): {
  topics: string[];
  difficulty: number;
  wordCount: number;
  questionTypes: string[];
} {
  const mcqs = output.prelims.mcqs || [];
  const difficulties = mcqs.map(mcq => mcq.difficulty || 5);

  const avgDifficulty =
    difficulties.length > 0
      ? difficulties.reduce((a, b) => a + b, 0) / difficulties.length
      : 0;

  const wordCount = mcqs
    .map(m => m.question.split(/\s+/).length)
    .reduce((a, b) => a + b, 0);

  return {
    topics: output.syllabusTopic ? [output.syllabusTopic] : [],
    difficulty: avgDifficulty,
    wordCount,
    questionTypes: ['MCQ'],
  };
}
