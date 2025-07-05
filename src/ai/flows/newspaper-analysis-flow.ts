
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

// Load syllabus content once at startup
const prelimsSyllabus = fs.readFileSync(path.join(process.cwd(), 'src/ai/knowledge/upsc-prelims-syllabus.md'), 'utf-8');
const mainsSyllabus = fs.readFileSync(path.join(process.cwd(), 'src/ai/knowledge/upsc-mains-syllabus.md'), 'utf-8');

const NewspaperAnalysisInputSchema = z.object({
  sourceText: z.string().describe('The article content, which can be either a URL or the full text of the article.'),
  examType: z.string().describe('The type of exam the user is preparing for, e.g., "UPSC Civil Services".'),
  analysisFocus: z
    .string()
    .describe(
      'The specific type of analysis requested by the user, e.g., "Generate Questions (Mains & Prelims)".'
    ),
  outputLanguage: z.string().describe('The language for the analysis output, e.g., "Hindi".'),
});
export type NewspaperAnalysisInput = z.infer<typeof NewspaperAnalysisInputSchema>;

const NewspaperAnalysisSyllabusInputSchema = NewspaperAnalysisInputSchema.extend({
    prelimsSyllabus: z.string().describe('The full text of the UPSC Prelims syllabus.'),
    mainsSyllabus: z.string().describe('The full text of the UPSC Mains syllabus.'),
});

const NewspaperAnalysisWithTopicInputSchema = NewspaperAnalysisSyllabusInputSchema.extend({
    identifiedSyllabusTopic: z.string().describe('The pre-identified, granular syllabus topic for the article.'),
});

const NewspaperAnalysisOutputSchema = z.object({
  analysis: z.string().describe('The detailed, markdown-formatted analysis. For question generation, this contains ONLY Prelims questions. For all other focuses, it contains the full analysis.'),
  mainsQuestions: z.string().optional().describe('The detailed, markdown-formatted Mains questions. This is ONLY populated when "Generate Questions" is the focus.'),
  summary: z.string().describe('A concise, 2-3 sentence summary of the article, suitable for text-to-speech conversion.'),
  inputTokens: z.number().optional().describe('Total input tokens used for the analysis.'),
  outputTokens: z.number().optional().describe('Total output tokens for the analysis.'),
  totalTokens: z.number().optional().describe('Total tokens used for the analysis.'),
  cost: z.number().optional().describe('Estimated cost for the analysis in INR.'),
});
export type NewspaperAnalysisOutput = z.infer<typeof NewspaperAnalysisOutputSchema>;

export async function analyzeNewspaperArticle(input: NewspaperAnalysisInput): Promise<NewspaperAnalysisOutput> {
  return await analyzeNewspaperArticleFlow({
      ...input,
      prelimsSyllabus,
      mainsSyllabus,
  });
}

const RelevanceCheckOutputSchema = z.object({
    isRelevant: z.boolean().describe('Whether the article content is relevant to the provided UPSC syllabus.'),
    syllabusTopic: z.string().nullable().describe('The single most specific, granular syllabus topic the article relates to. If not relevant, this should be null.'),
    reasoning: z.string().describe('A brief explanation for why the article is or is not relevant, written in the requested output language.'),
});

const relevanceCheckPrompt = ai.definePrompt({
    name: 'relevanceCheckPrompt',
    input: { schema: NewspaperAnalysisSyllabusInputSchema },
    output: { schema: RelevanceCheckOutputSchema },
    prompt: `You are an AI assistant for a UPSC exam preparation tool. Your first task is to determine if a given article is relevant for a UPSC aspirant by tagging it to a specific syllabus topic.

Analyze the source text and compare it against the provided UPSC Prelims and Mains syllabus.
1.  **Identify the single most specific, granular syllabus topic** the article relates to. For example, instead of just "GS-II", specify "GS Paper II - Governance - Role of Civil Services in a Democracy". Be as specific as possible.
2.  **Determine Relevance:**
    *   If you can successfully tag the article to a specific syllabus topic, set 'isRelevant' to 'true' and populate the 'syllabusTopic' field with the identified topic. The 'reasoning' should briefly state the connection.
    *   If the article is completely unrelated (e.g., sports scores, celebrity gossip, local crime, fiction) and you CANNOT tag it to a specific topic, set 'isRelevant' to 'false', set 'syllabusTopic' to 'null', and provide a brief one-sentence 'reasoning' explaining why it's not relevant.

IMPORTANT: You MUST write the 'reasoning' and 'syllabusTopic' (if found) in the language specified here: {{{outputLanguage}}}.

Source Text: "{{{sourceText}}}"

--- PRELIMS SYLLABUS ---
{{{prelimsSyllabus}}}
--- MAINS SYLLABUS ---
{{{mainsSyllabus}}}
---
`,
});

const analysisPrompt = ai.definePrompt({
  name: 'newspaperAnalysisPrompt',
  input: { schema: NewspaperAnalysisWithTopicInputSchema },
  output: { schema: NewspaperAnalysisOutputSchema },
  prompt: `You are an expert UPSC question setter with 15+ years of experience creating questions for the actual UPSC Prelims and Mains exams. You understand the exact patterns, difficulty levels, and analytical depth required. Your analysis must be premium, highly structured, and easy-to-digest.

CRITICAL: Your entire response, including all analysis, questions, summaries, and explanations, MUST be in the following language: {{{outputLanguage}}}. The only exception is the structural heading '## Potential Mains Questions', which must ALWAYS be in English.

First, your critical tasks are:
1.  The article relates to the syllabus topic: '{{{identifiedSyllabusTopic}}}'. You MUST use this exact topic and mention it clearly.
2.  Generate a concise, 2-3 sentence summary of the article's core message. CRITICAL: The summary MUST NOT contain any HTML, XML, or custom tags. It must be pure, clean, plain text suitable for a text-to-speech engine. Place this in the 'summary' field.

The user is preparing for the '{{{examType}}}' exam. The requested analysis focus is: '{{{analysisFocus}}}'.

Here is the source material to analyze:
"{{{sourceText}}}"

Based on the 'analysisFocus', generate a detailed, well-structured response.

--- SPECIFIC INSTRUCTIONS FOR EACH ANALYSIS FOCUS ---

1.  If 'analysisFocus' is 'Generate Questions (Mains & Prelims)':
    *   **UPSC PRELIMS QUESTION GENERATION RULES (CRITICAL):**
        *   **Quality Standard**: Generate 3-5 analytical MCQs with a difficulty of 7-9 out of 10. Questions must test analytical thinking, not factual recall, by integrating multiple concepts from the syllabus. Use article facts as triggers for deeper knowledge testing.
        *   **Statement Creation Formula**:
            *   Statement 1: Moderate difficulty (based on article).
            *   Statement 2: Difficult (requires synthesis with static knowledge).
            *   Statement 3: Very nuanced (tests deep analytical ability).
        *   **EXACT FORMAT REQUIRED (NO DEVIATIONS):**
            *   You MUST use the following custom tag structure for each MCQ. Each option MUST be on its own line and inside its own <option> tag. Do not combine options. The 'subject' attribute must be as granular as the identified topic.
            *   <mcq question="The full question text here..." subject="e.g., GS Paper II - Polity & Governance" explanation="A thorough explanation of the answer." difficultyScore="7">
            *   <option correct="true">Correct answer.</option>
            *   <option>Incorrect answer.</option>
            *   <option>Incorrect answer.</option>
            *   <option>Incorrect answer.</option>
            *   </mcq>
        *   **CRITICAL FORMATTING RULES:**
            *   NEVER write options like this: "1 only2 only1 and 3 only".
            *   ALWAYS use separate <option> tags on individual lines.
            *   NEVER skip the closing </mcq> tag.
            *   ALWAYS include a difficultyScore attribute (1-10).
    *   **CRITICAL: Place the entire generated Prelims questions markdown into the 'analysis' field of the output JSON.**
    *
    *   **UPSC MAINS QUESTION GENERATION RULES:**
        *   Frame 2-3 questions using UPSC directive words (Critically analyze, Elucidate, Discuss, etc.) and a 10-15 mark structure.
        *   **CRITICAL FORMATTING**: For EACH Mains question, you MUST format it as a markdown H2 heading and append the difficulty. For example: '## This is the Mains Question? (Difficulty: 8/10)'.
        *   After EACH Mains question heading, you MUST provide a detailed "### Guidance for Answer" section. This is critical. This guidance should be highly structured and include the following as bullet points:
            *   **Key Concepts:** List 4-5 core syllabus concepts.
            *   **Ideal Structure:** Provide a clear, step-by-step structure (Introduction, Body Paragraphs with specific points, Conclusion with forward-looking statements).
            *   **Examples from Article:** List specific facts, stats, or quotes from the source article to be used.
            *   **Keywords:** List 7-8 advanced keywords essential for a good score.
    *   **CRITICAL: Place the entire generated Mains questions markdown into the 'mainsQuestions' field of the output JSON.**

2.  If 'analysisFocus' is 'Mains Analysis (Arguments, Keywords, Viewpoints)':
    *   Place the entire analysis in the 'analysis' field. Go beyond summarizing. Identify the central thesis, dissect the main arguments with supporting evidence from the text, present potential counter-arguments (even if not explicitly in the text), and extract key statistics and data. Also, analyze the author's tone and potential biases. Structure with clear headings like "## Central Theme", "### Main Arguments", "### Counter-Arguments", "### Key Statistics & Data", "### Author's Tone & Bias".

3.  If 'analysisFocus' is 'Prelims Fact Finder (Key Names, Dates, Schemes)':
    *   Place the entire analysis in the 'analysis' field. Your goal is to extract facts that are highly relevant for the Prelims exam. When you identify an entity, you MUST wrap it in one of the following custom tags: <person>Name</person>, <place>Location</place>, <scheme>Scheme/Policy Name</scheme>, <date>Date/Time Period</date>, or <org>Organization/Committee</org>.

4.  If 'analysisFocus' is 'Critical Analysis (Tone, Bias, Fact vs. Opinion)':
    *   Place the entire analysis in the 'analysis' field. Provide a deep critical analysis by identifying the author's main thesis, the evidence used to support it, any logical fallacies, underlying biases (e.g., pro-government, anti-industry), and compare the viewpoint with a neutral, objective stance. Structure with headings like "## Author's Thesis", "## Evidence Evaluation", "## Potential Biases", etc.

5.  If 'analysisFocus' is 'Vocabulary Builder for Editorials':
    *   Place the entire analysis in the 'analysis' field. Identify 5-7 advanced words from the article that are relevant for competitive exams. For each word, provide: 1) The word and its definition in the context of the article. 2) A synonym and an antonym. 3) An example sentence relevant to UPSC/exam preparation. Format this clearly, perhaps using a list or table.

6.  For any other 'analysisFocus', generate the appropriate, detailed markdown response that reflects a deep understanding of the exam patterns and place it entirely within the 'analysis' field. Ensure the 'mainsQuestions' field is not included in the output JSON.

Remember to generate the separate, concise 2-3 sentence 'summary' field first, then generate the detailed 'analysis' and 'mainsQuestions' fields based on the focus.
`,
});


const VerificationInputSchema = z.object({
    sourceText: z.string().describe('The original article content.'),
    generatedAnalysisString: z.string().describe('The AI-generated analysis object as a JSON string to be verified.'),
    outputLanguage: z.string().describe('The language for the analysis output, e.g., "Hindi".'),
    analysisFocus: z.string().describe('The original analysis focus requested.'),
});

const verificationPrompt = ai.definePrompt({
    name: 'newspaperVerificationPrompt',
    input: { schema: VerificationInputSchema },
    output: { schema: NewspaperAnalysisOutputSchema },
    prompt: `You are a meticulous Final Quality Control Editor for an AI application. Your job is to ruthlessly check and fix an AI-generated analysis before it is shown to a user. Errors in the output can break the application's UI, so precision is your top priority.

    **CRITICAL INSTRUCTIONS:**
    1.  **COHERENCY CHECK**: First, ensure the entire analysis is about the SINGLE 'Original Source Article' provided. If the generated analysis seems to combine different articles or topics, you MUST rewrite it to focus only on the provided source text.
    
    2.  **FORMAT & STRUCTURE VERIFICATION (TOP PRIORITY):** This is your most important task. Scrutinize the 'generatedAnalysis' markdown.
        *   If '{{{analysisFocus}}}' was 'Generate Questions (Mains & Prelims)':
            *   **AUTO-FIX BROKEN MCQs:** This is a common error you must fix. If you find a pattern like this where options are jumbled together:
                \`<mcq question="..." difficultyScore="7">1 only2 only1 and 3 only1, 2 and 3</mcq>\`
                You MUST fix it to this correct format, assuming the first option is the correct one for the sake of repair:
                \`<mcq question="..." difficultyScore="7">\n<option correct="true">1 only</option>\n<option>2 only</option>\n<option>1 and 3 only</option>\n<option>1, 2 and 3</option>\n</mcq>\`
            *   **FINAL MCQ CHECKLIST:** For EVERY '<mcq>' tag in the 'analysis' field, ensure it has:
                *   A closing '</mcq>' tag.
                *   A 'difficultyScore' attribute between 1 and 10.
                *   At least two '<option>' tags, each on its own separate line.
                *   One, and only one, option with a 'correct="true"' attribute.
            *   **MAINS QUESTION CHECKLIST**: In the 'mainsQuestions' field, ensure EVERY question is preceded by a markdown '##' heading and that the heading includes the difficulty rating, like '(Difficulty: X/10)'.

        *   If '{{{analysisFocus}}}' was 'Prelims Fact Finder (...)':
            *   Fix any broken custom tags (e.g., '<person>', '<place>', etc.). Ensure they are properly opened and closed.

    3.  **FACT-CHECKING:** Cross-reference the analysis with the 'Original Source Article'. Correct any factual errors or claims not supported by the source text.
    4.  **SUMMARY CHECK:** Ensure the 'summary' field is 2-3 sentences of clean, plain text and contains NO HTML or custom tags. Remove any tags you find.

    After your review, output the final, corrected, and verified analysis object.

    **Original Source Article:**
    ---
    {{{sourceText}}}
    ---

    **Generated Analysis Object to Verify and Correct (as a JSON string):**
    ---json
    {{{generatedAnalysisString}}}
    ---
    
    Return the final, polished analysis object now. Ensure the final output strictly adheres to the requested language: {{{outputLanguage}}}.`,
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
    
    // Example pricing for Gemini Flash models.
    const INPUT_PRICE_PER_1K_TOKENS_USD = 0.00035;
    const OUTPUT_PRICE_PER_1K_TOKENS_USD = 0.00105;
    const USD_TO_INR_RATE = 83;

    // Step 1: Relevance Check
    const { response: relevanceResponse, output: relevanceResult } = await relevanceCheckPrompt(input);
    
    if (relevanceResponse?.usage) {
      totalInputTokens += relevanceResponse.usage.inputTokens || 0;
      totalOutputTokens += relevanceResponse.usage.outputTokens || 0;
    }
    
    if (!relevanceResult) {
        throw new Error("Relevance check failed.");
    }

    if (!relevanceResult.isRelevant || !relevanceResult.syllabusTopic) {
      const totalTokens = totalInputTokens + totalOutputTokens;
      const costInUSD = (totalInputTokens / 1000) * INPUT_PRICE_PER_1K_TOKENS_USD + (totalOutputTokens / 1000) * OUTPUT_PRICE_PER_1K_TOKENS_USD;
      const cost = costInUSD * USD_TO_INR_RATE;
      
      return {
        analysis: `## Article Not Relevant\n\n**Reasoning:** ${relevanceResult.reasoning}\n\nPlease provide an article related to subjects like Indian Polity, Governance, Economy, History, Geography, or other topics covered in the UPSC syllabus to get a meaningful analysis.`,
        summary: "",
        totalTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cost,
      };
    }

    // Step 2: Generate the initial analysis (if relevant)
    const { response: analysisResponse, output: initialOutput } = await analysisPrompt({
        ...input,
        identifiedSyllabusTopic: relevanceResult.syllabusTopic,
    });
    if (!initialOutput) {
        throw new Error("Initial analysis generation failed.");
    }
    if (analysisResponse?.usage) {
        totalInputTokens += analysisResponse.usage.inputTokens || 0;
        totalOutputTokens += analysisResponse.usage.outputTokens || 0;
    }


    // Step 3: Verify and fact-check the analysis
    const { response: verificationResponse, output: verifiedOutput } = await verificationPrompt({
        sourceText: input.sourceText,
        generatedAnalysisString: JSON.stringify(initialOutput),
        outputLanguage: input.outputLanguage,
        analysisFocus: input.analysisFocus,
    });
    if (!verifiedOutput) {
        throw new Error("Verification step failed.");
    }
    if (verificationResponse?.usage) {
        totalInputTokens += verificationResponse.usage.inputTokens || 0;
        totalOutputTokens += verificationResponse.usage.outputTokens || 0;
    }
    
    // Step 4: Final sanitization of the summary to ensure it's clean for TTS
    const cleanSummary = verifiedOutput.summary.replace(/<[^>]+>/g, '');

    const totalTokens = totalInputTokens + totalOutputTokens;
    const costInUSD = (totalInputTokens / 1000) * INPUT_PRICE_PER_1K_TOKENS_USD + (totalOutputTokens / 1000) * OUTPUT_PRICE_PER_1K_TOKENS_USD;
    const cost = costInUSD * USD_TO_INR_RATE;

    return {
        ...verifiedOutput,
        summary: cleanSummary,
        totalTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cost,
    };
  }
);
