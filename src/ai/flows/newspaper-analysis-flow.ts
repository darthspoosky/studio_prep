
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

// Enhanced output schema with quality metrics
const NewspaperAnalysisOutputSchema = z.object({
  analysis: z.string().describe('The detailed, markdown-formatted analysis. For question generation, this contains ONLY Prelims questions. For all other focuses, it contains the full analysis.'),
  mainsQuestions: z.string().optional().describe('The detailed, markdown-formatted Mains questions. This is ONLY populated when "Generate Questions" is the focus.'),
  summary: z.string().describe('A concise, 2-3 sentence summary of the article, suitable for text-to-speech conversion.'),
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

// Post-processing function to fix malformed MCQs
function fixMCQFormatting(text: string): string {
  const mcqRegex = /<mcq([^>]*)>(.*?)<\/mcq>/gs;
  
  return text.replace(mcqRegex, (match, attributes, content) => {
    // Check if options are properly formatted
    if (!content.includes('<option>')) {
      // Extract question and options parts
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      if (lines.length < 2) return match;
      
      // Try to find option patterns in the content
      const optionPattern = /(?:\d+\s+only|\d+[,\s]*and\s*\d+\s*only|\d+,\s*\d+\s*and\s*\d+|None of the above|All of the above)/gi;
      const fullContent = content.replace(/\n/g, ' ');
      const options = fullContent.match(optionPattern) || [];
      
      if (options.length >= 2) {
        // Extract question part (everything before options)
        let questionPart = fullContent;
        options.forEach(opt => {
          questionPart = questionPart.replace(opt, '');
        });
        questionPart = questionPart.trim();
        
        // Format options properly
        const formattedOptions = options.map((opt, index) => 
          `<option${index === 0 ? ' correct="true"' : ''}>${opt.trim()}</option>`
        ).join('\n');
        
        return `<mcq${attributes}>\n${questionPart}\n${formattedOptions}\n</mcq>`;
      }
    }
    return match;
  });
}

// Quality validation function
function validateQuestionQuality(analysis: string): QuestionQualityMetrics {
  const mcqMatches = analysis.match(/<mcq[^>]*>.*?<\/mcq>/gs) || [];
  
  if (mcqMatches.length === 0) {
    return {
      hasStatementFormat: false,
      difficultyAppropriate: false,
      optionsFollowUPSCPattern: false,
      explanationAdequate: false,
      overallScore: 0
    };
  }
  
  let totalScore = 0;
  const metrics = {
    hasStatementFormat: 0,
    difficultyAppropriate: 0,
    optionsFollowUPSCPattern: 0,
    explanationAdequate: 0
  };
  
  mcqMatches.forEach(mcqBlock => {
    // Check for statement-based format
    if (mcqBlock.includes('Consider the following statements')) {
      metrics.hasStatementFormat++;
    }
    
    // Check difficulty score
    const difficultyMatch = mcqBlock.match(/difficultyScore="(\d+)"/);
    if (difficultyMatch && parseInt(difficultyMatch[1]) >= 7) {
      metrics.difficultyAppropriate++;
    }
    
    // Check for UPSC option patterns
    if (/\d+\s+and\s+\d+\s+only|\d+\s+only/.test(mcqBlock)) {
      metrics.optionsFollowUPSCPattern++;
    }
    
    // Check explanation length
    const explanationMatch = mcqBlock.match(/explanation="([^"]*)"/);
    if (explanationMatch && explanationMatch[1].length > 100) {
      metrics.explanationAdequate++;
    }
  });
  
  const total = mcqMatches.length;
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
    overallScore
  };
}

// Fallback analysis generation
function generateFallbackAnalysis(
  input: NewspaperAnalysisInput, 
  relevanceResult: { syllabusTopic: string; reasoning: string }
): NewspaperAnalysisOutput {
  const fallbackAnalysis = `## Article Analysis - ${relevanceResult.syllabusTopic}

**Note**: This is a simplified analysis due to processing limitations.

### Key Points:
- Article relates to: ${relevanceResult.syllabusTopic}
- Reasoning: ${relevanceResult.reasoning}

### Study Recommendations:
1. Review the identified syllabus topic in detail
2. Connect this article's content to static knowledge
3. Practice related questions from previous years

*For detailed question generation, please try again or contact support.*`;

  return {
    analysis: fallbackAnalysis,
    summary: "Article analysis completed with basic insights due to processing limitations.",
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

**GRANULAR TOPIC IDENTIFICATION:**
- Instead of broad categories like "GS-II", specify exactly: "GS Paper II - Governance - Digital Governance and E-governance applications, models, successes, limitations, and potential"
- For current affairs, connect to static syllabus topics: "GS Paper II - International Relations - India and its Neighborhood" + specific policy/event
- For economy articles: "GS Paper III - Economics - Indian Economy and Planning" + specific sector/policy

**RELEVANCE ASSESSMENT:**
- **Highly Relevant (0.8-1.0)**: Directly testable, connects current affairs to static knowledge, multiple question possibilities
- **Moderately Relevant (0.5-0.7)**: Tangentially related, limited question potential, requires significant context
- **Not Relevant (0.0-0.4)**: Sports scores, celebrity news, purely local events, fiction, entertainment

**QUALITY INDICATORS:**
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

CRITICAL: Your entire response, including all analysis, questions, summaries, and explanations, MUST be in the following language: {{{outputLanguage}}}. The only exception is the structural heading '## Potential Mains Questions', which must ALWAYS be in English.

**ARTICLE CONTEXT:**
- Identified Syllabus Topic: '{{{identifiedSyllabusTopic}}}'
- Exam Type: '{{{examType}}}'
- Analysis Focus: '{{{analysisFocus}}}'

**ARTICLE CONTENT:**
"{{{sourceText}}}"

**MANDATORY FIRST STEP**: Generate a clean, 2-3 sentence summary in the 'summary' field. This must be pure text without any HTML, XML, or custom tags - suitable for text-to-speech conversion.

--- ANALYSIS FOCUS INSTRUCTIONS ---

**IF 'analysisFocus' = 'Generate Questions (Mains & Prelims)':**

## **UPSC PRELIMS QUESTION GENERATION PROTOCOL**

**QUALITY STANDARDS (NON-NEGOTIABLE):**
- Difficulty: 8-9 out of 10 (actual UPSC standard)
- Questions must test synthesis and analysis, NOT mere factual recall
- Integrate article facts with static syllabus knowledge
- Each question should have a 40-50% success rate among serious aspirants

**STATEMENT CREATION HIERARCHY:**
1. **Statement 1** (Moderate - 60% aspirants should know): Based on article + basic static knowledge
2. **Statement 2** (Difficult - 30% aspirants should know): Requires deeper analysis + policy understanding  
3. **Statement 3** (Expert - 15% aspirants should know): Tests advanced synthesis + nuanced understanding

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

**EXACT FORMATTING REQUIREMENTS:**

<mcq question="Consider the following statements regarding [specific topic]:
1. [Statement integrating article fact with static knowledge]
2. [Statement requiring analytical thinking beyond the article]
3. [Statement testing deep conceptual understanding]
Which of the statements given above is/are correct?" subject="{{{identifiedSyllabusTopic}}}" explanation="Statement 1: [Detailed reasoning with article references and static knowledge]. Statement 2: [Analysis requiring synthesis of multiple concepts]. Statement 3: [Expert-level explanation with broader implications]." difficultyScore="8">
<option>1 only</option>
<option>2 only</option>
<option correct="true">1 and 2 only</option>
<option>1, 2 and 3</option>
</mcq>

**OPTION STRATEGY (UPSC PATTERN):**
- '1 only': Use as distractor (rarely correct in actual UPSC)
- '2 only': Moderate frequency
- '1 and 2 only': HIGH frequency (most common correct answer)
- '2 and 3 only': HIGH frequency  
- '1 and 3 only': Moderate frequency
- '1, 2 and 3': Use sparingly (when genuinely all are correct)

**CRITICAL FORMATTING RULES:**
❌ NEVER: "1 only2 only1 and 3 only" (concatenated)
✅ ALWAYS: Separate <option> tags on individual lines
❌ NEVER: Skip closing </mcq> tag
✅ ALWAYS: Include difficultyScore="8" or "9"

**Place ENTIRE Prelims analysis in 'analysis' field.**

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

**MANDATORY FORMATTING:**
## [Complete Question with directive word]? (Difficulty: 8/10)

### Guidance for Answer
**Key Concepts:** [List 5-6 core syllabus concepts essential for the answer]
**Ideal Structure:**
- **Introduction (60-80 words):** [Specific definition/context/recent development]
- **Body Paragraph 1 (100-120 words):** [First major analytical point with article integration]
- **Body Paragraph 2 (100-120 words):** [Second analytical point or counter-perspective]
- **Conclusion (40-60 words):** [Synthesis with forward-looking statement/recommendations]
**Examples from Article:** [3-4 specific facts, statistics, or quotes to use]
**Keywords:** [8-10 advanced terms crucial for scoring well]

**Place ENTIRE Mains analysis in 'mainsQuestions' field.**

**FOR OTHER ANALYSIS FOCUSES:**
[Continue with existing instructions for other focus types...]

**QUALITY ASSURANCE CHECKLIST:**
Before finalizing, ensure:
✅ All questions integrate article content with broader syllabus knowledge
✅ Difficulty appropriate for UPSC (no obvious/too easy questions)
✅ Options follow genuine UPSC patterns
✅ Explanations demonstrate deep understanding
✅ Language consistency throughout
✅ Proper formatting with all required tags
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
  prompt: `You are a Senior Quality Assurance Editor for a premium UPSC preparation platform. Your role is critical - any errors you miss will break the user interface and damage user experience. You have zero tolerance for formatting errors, factual inconsistencies, or quality issues.

**CRITICAL MISSION**: Transform the AI-generated analysis into a flawless, publication-ready output that meets the highest standards.

**PRIMARY QUALITY CHECKPOINTS:**

## **1. COHERENCY VERIFICATION (CRITICAL)**
- Verify the entire analysis discusses ONLY the provided source article
- If content seems to merge multiple articles or introduce external information not in the source, REWRITE to focus exclusively on the provided text
- Ensure all examples, statistics, and references come directly from the source article

## **2. MCQ FORMATTING REPAIR (EMERGENCY PROTOCOL)**

**COMMON CRITICAL ERROR - AUTO-FIX REQUIRED:**
If you encounter this broken pattern:
\`\`\`
<mcq question="..." difficultyScore="7">
1 only2 only1 and 3 only1, 2 and 3
</mcq>
\`\`\`

**MANDATORY AUTO-FIX TO:**
\`\`\`
<mcq question="..." difficultyScore="7">
<option correct="true">1 only</option>
<option>2 only</option>
<option>1 and 3 only</option>
<option>1, 2 and 3</option>
</mcq>
\`\`\`

**MCQ VALIDATION CHECKLIST (EVERY MCQ MUST PASS):**
✅ Has opening <mcq> tag with all required attributes
✅ Has closing </mcq> tag  
✅ Contains 'difficultyScore' attribute (value 7-10)
✅ Has exactly 4 <option> tags, each on separate lines
✅ Has ONE option with correct="true" attribute
✅ Question follows "Consider the following statements" format
✅ Explanation is comprehensive (minimum 150 characters)

## **3. MAINS QUESTIONS FORMATTING (IF APPLICABLE)**
**MANDATORY FORMAT VALIDATION:**
✅ Every question starts with ## heading
✅ Difficulty rating included: "(Difficulty: X/10)"
✅ "### Guidance for Answer" section present after each question
✅ All subsections properly formatted (Key Concepts, Ideal Structure, etc.)

## **4. CONTENT QUALITY ENHANCEMENT**

**UPSC REALISM CHECK:**
- Questions should test analysis, not just factual recall
- Options must follow authentic UPSC patterns
- Difficulty must be appropriate (8-9 for actual UPSC level)
- Explanations must demonstrate why each statement is correct/incorrect

**LANGUAGE CONSISTENCY:**
- Entire content in {{{outputLanguage}}} except structural headings
- Technical terms used appropriately
- Professional, examination-appropriate tone

## **5. SUMMARY SANITIZATION**
**CRITICAL**: The 'summary' field must be:
- Clean plain text (NO HTML/XML/custom tags)
- 2-3 sentences maximum
- Suitable for text-to-speech conversion
- Strip ANY markup: <tags>, &entities;, etc.

## **6. FINAL QUALITY METRICS**
Calculate and include:
- questionsCount: Number of MCQs generated
- qualityScore: Based on formatting compliance (0-1 scale)

**ERROR RECOVERY PROTOCOL:**
If critical errors cannot be fixed:
- Flag the issue in the analysis
- Provide partial content rather than complete failure
- Include clear guidance for user next steps

**VERIFICATION COMPLETE - OUTPUT REQUIREMENTS:**
Return the polished, error-free analysis that would pass editorial review for publication in a premium UPSC preparation platform.

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
          analysis: `## Article Not Relevant for UPSC Preparation\n\n**Assessment**: ${relevanceResult.reasoning}\n\n**Recommendation**: Please provide articles related to:\n- Indian Polity & Governance\n- Economics & Development\n- International Relations\n- Science & Technology\n- Environment & Ecology\n- Indian History & Culture\n- Geography\n\nThese topics align with UPSC syllabus and will generate meaningful questions for your preparation.`,
          summary: "Article assessed as not relevant for UPSC preparation based on syllabus alignment.",
          syllabusTopic: undefined,
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

      // Step 4: Post-processing and quality enhancement
      const fixedAnalysis = fixMCQFormatting(verifiedOutput.analysis || '');
      const fixedMainsQuestions = verifiedOutput.mainsQuestions ? 
        fixMCQFormatting(verifiedOutput.mainsQuestions) : undefined;

      // Step 5: Quality assessment
      const qualityMetrics = validateQuestionQuality(fixedAnalysis);
      const questionsCount = (fixedAnalysis.match(/<mcq[^>]*>/g) || []).length;

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
        analysis: fixedAnalysis,
        mainsQuestions: fixedMainsQuestions,
        summary: cleanSummary || "Analysis completed successfully.",
        syllabusTopic: relevanceResult.syllabusTopic,
        qualityScore: qualityMetrics.overallScore,
        questionsCount,
        totalTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cost: Math.round(cost * 100) / 100, // Round to 2 decimal places
      };

    } catch (error) {
      console.error("Comprehensive analysis flow failed:", error);
      
      // Ultimate fallback
      return {
        analysis: `## Analysis Error\n\nWe encountered an issue processing this article. This could be due to:\n- Network connectivity issues\n- Article content format\n- System overload\n\n**Suggestion**: Please try again in a few moments or contact support if the issue persists.\n\n**Error Details**: ${(error as any).message}`,
        summary: "Analysis could not be completed due to a system error.",
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
export function validateArticleContent(content: string): { isValid: boolean; issues: string[] } {
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
export function extractAnalysisMetadata(output: NewspaperAnalysisOutput): {
  topics: string[];
  difficulty: number;
  wordCount: number;
  questionTypes: string[];
} {
  const mcqMatches = output.analysis?.match(/<mcq[^>]*>/g) || [];
  const difficulties = mcqMatches.map(match => {
    const diffMatch = match.match(/difficultyScore="(\d+)"/);
    return diffMatch ? parseInt(diffMatch[1]) : 5;
  });
  
  const avgDifficulty = difficulties.length > 0 
    ? difficulties.reduce((a, b) => a + b, 0) / difficulties.length 
    : 0;
  
  const wordCount = (output.analysis || '').split(/\s+/).length;
  
  return {
    topics: output.syllabusTopic ? [output.syllabusTopic] : [],
    difficulty: avgDifficulty,
    wordCount,
    questionTypes: ['MCQ'] // Can be extended for other types
  };
}

    