
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
1.  **Identify the single most specific, granular syllabus topic** the article relates to. For example, instead of just "GS-II", specify "GS Paper II - Governance - Role of Civil Services in a Democracy".
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
  prompt: `You are a world-class editor and exam coach AI for Indian competitive exam aspirants, with deep expertise in the UPSC syllabus. Your analysis must be presented in a premium, highly structured, and easy-to-digest format. Your primary goal is to generate insights and questions that genuinely reflect the pattern and difficulty of the actual UPSC exams. Avoid simple, surface-level questions. Focus on testing analytical, critical, and inferential skills.
Use markdown extensively and intelligently: leverage headings, subheadings, blockquotes for key takeaways, bold text for keywords, and tables for data comparison.

IMPORTANT: Your entire response, including all analysis, questions, summaries, and explanations, MUST be in the following language: {{{outputLanguage}}}. The only exception is the structural heading '## Potential Mains Questions', which must ALWAYS be in English.

First, your critical tasks are:
1.  The article has already been identified as relating to the following syllabus topic: '{{{identifiedSyllabusTopic}}}'. You MUST use this exact topic and mention it clearly at the beginning of your analysis.
2.  Generate a concise, 2-3 sentence summary of the article's core message. CRITICAL: The summary MUST NOT contain any HTML, XML, or custom tags. It must be pure, clean, plain text suitable for a text-to-speech engine. Place this in the 'summary' field.

The user is preparing for the '{{{examType}}}' exam.
The requested analysis focus is: '{{{analysisFocus}}}'.

Here is the source material to analyze:
"{{{sourceText}}}"

Here is the UPSC Prelims Syllabus for your reference:
--- PRELIMS SYLLABUS START ---
{{{prelimsSyllabus}}}
--- PRELIMS SYLLABUS END ---

Here is the UPSC Mains Syllabus for your reference:
--- MAINS SYLLABUS START ---
{{{mainsSyllabus}}}
--- MAINS SYLLABUS END ---

Based on the 'analysisFocus', generate a detailed, well-structured response.

Follow these specific instructions for the given 'analysisFocus':

1.  If 'analysisFocus' is 'Generate Questions (Mains & Prelims)':
    *   **Prelims Questions**: Your objective is to create questions that mirror the analytical and multi-statement style of the actual UPSC Prelims exam, not simple factual recall. Generate 3-5 potential MCQs. For each MCQ, you MUST assign a difficulty score from 1 (very easy) to 10 (expert-level) and include it as an attribute.
        *   Frame questions as "statement-based" (e.g., "Consider the following statements... Which of the statements given above is/are correct?") where possible to test analytical skills.
        *   For each MCQ, you MUST wrap it in the following custom tag structure. Each option MUST be on its own line and inside its own <option> tag. Do not combine options into a single line. The 'subject' attribute must be as granular as possible.
    *   <mcq question="The full question text here..." subject="e.g., GS Paper II - Polity & Governance" explanation="A thorough explanation of the answer." difficultyScore="7">
    *   <option correct="true">Correct answer.</option>
    *   <option>Incorrect answer.</option>
    *   <option>Incorrect answer.</option>
    *   <option>Incorrect answer.</option>
    *   </mcq>
    *   **CRITICAL: Place the entire generated Prelims questions markdown into the 'analysis' field of the output JSON.**
    *
    *   **Mains Questions**: Frame 2-3 questions that demand critical thinking, analysis, and a structured argument, reflecting the style of the UPSC Mains exam. The questions should use directive words like 'Critically analyze', 'Elucidate', 'Discuss', 'Comment', or 'Examine'.
    *   For each Mains question, you MUST rate its difficulty on a scale of 1-10 and include it in the heading.
    *   **CRITICAL FORMATTING**: For EACH Mains question, you MUST format it as a markdown H2 heading and append the difficulty. For example: '## This is the Mains Question? (Difficulty: 8/10)'.
    *   After EACH Mains question heading, you MUST provide a detailed "### Guidance for Answer" section. This is critical. This guidance should be highly structured and include the following as bullet points:
        *   **Key Concepts:** List the core theoretical concepts from the syllabus (e.g., Federalism, Judicial Review, Fiscal Policy) that are central to answering the question.
        *   **Ideal Structure:** Provide a clear, step-by-step structure.
            *   **Introduction:** Suggest a strong opening sentence or two.
            *   **Body:** Break down the main arguments into 2-3 distinct paragraphs. For each paragraph, suggest the main point to cover.
            *   **Conclusion:** Suggest a way to summarize the arguments and provide a forward-looking statement.
        *   **Examples from Article:** Explicitly list facts, statistics, or direct quotes from the source article that MUST be used to support the answer.
        *   **Keywords:** List 5-7 important keywords (e.g., 'Electoral Integrity', 'Voter Disenfranchisement', 'Constitutional Mandate') that should be used in the answer.
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
    1.  **COHERENCY CHECK**: First, ensure the entire analysis is about the SINGLE 'Original Source Article' provided. If the generated analysis seems to combine different articles, you MUST rewrite it to focus only on the provided source text.
    2.  **FORMAT & STRUCTURE VERIFICATION (TOP PRIORITY):** This is your most important task. Scrutinize the 'generatedAnalysis' markdown.
        *   If '{{{analysisFocus}}}' was 'Generate Questions (Mains & Prelims)':
            *   Check the 'analysis' field for Prelims questions and the 'mainsQuestions' field for Mains questions.
            *   Find every '<mcq>' tag in the 'analysis' field. Ensure it has a closing '</mcq>' tag and a 'difficultyScore' attribute.
            *   Inside each '<mcq>', ensure there are multiple '<option>' tags.
            *   Ensure each '<option>' tag is on its own separate line.
            *   In the 'mainsQuestions' field, ensure EVERY question is preceded by a markdown '##' heading and that the heading includes the difficulty rating, like '(Difficulty: X/10)'.
            *   Fix any and all broken, incomplete, or improperly formatted tags or markdown headings.
        *   If '{{{analysisFocus}}}' was 'Prelims Fact Finder (...)':
            *   Fix any broken custom tags (e.g., '<person>', '<place>', etc.).
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
