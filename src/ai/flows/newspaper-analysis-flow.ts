
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
  difficulty: z.string().describe('The difficulty level for question generation: Standard, Advanced, or Expert.'),
});
export type NewspaperAnalysisInput = z.infer<typeof NewspaperAnalysisInputSchema>;

const NewspaperAnalysisSyllabusInputSchema = NewspaperAnalysisInputSchema.extend({
    prelimsSyllabus: z.string().describe('The full text of the UPSC Prelims syllabus.'),
    mainsSyllabus: z.string().describe('The full text of the UPSC Mains syllabus.'),
});

const NewspaperAnalysisOutputSchema = z.object({
  analysis: z.string().describe('The detailed, markdown-formatted analysis of the article.'),
  summary: z.string().describe('A concise, 2-3 sentence summary of the article, suitable for text-to-speech conversion.'),
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
    reasoning: z.string().describe('A brief explanation for why the article is or is not relevant.'),
});

const relevanceCheckPrompt = ai.definePrompt({
    name: 'relevanceCheckPrompt',
    input: { schema: NewspaperAnalysisSyllabusInputSchema },
    output: { schema: RelevanceCheckOutputSchema },
    prompt: `You are an AI assistant for a UPSC exam preparation tool. Your first task is to determine if a given article is relevant for a UPSC aspirant.
      
Analyze the source text and determine if its content relates to any topics in the provided UPSC Prelims or Mains syllabus.

- If the article is about topics like politics, international relations, Indian economy, modern history, geography, environment, science & tech policy, social issues, etc., it is RELEVANT.
- If the article is about topics like entertainment, celebrity gossip, sports results, fictional stories, or is purely advertising, it is NOT RELEVANT.

Set 'isRelevant' to true or false. Provide a brief one-sentence reasoning.

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
  input: { schema: NewspaperAnalysisSyllabusInputSchema },
  output: { schema: NewspaperAnalysisOutputSchema },
  prompt: `You are a world-class editor and exam coach AI for Indian competitive exam aspirants, with deep expertise in the UPSC syllabus. Your analysis must be presented in a premium, highly structured, and easy-to-digest format. 
Use markdown extensively and intelligently: leverage headings, subheadings, blockquotes for key takeaways, bold text for keywords, and tables for data comparison.

First, your critical tasks are:
1.  Read the provided article and cross-reference its content with the UPSC syllabus documents below to identify the most specific, granular syllabus topic it relates to. Mention this topic clearly at the beginning of your analysis.
2.  Generate a concise, 2-3 sentence summary of the article's core message. This summary should be plain text and suitable for a text-to-speech engine. Place this in the 'summary' field.

The user is preparing for the '{{{examType}}}' exam.
The requested analysis focus is: '{{{analysisFocus}}}'.
The requested difficulty for question generation is: '{{{difficulty}}}'.

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

Based on the 'analysisFocus', generate a detailed, well-structured response in markdown format for the 'analysis' field.

Follow these specific instructions for the given 'analysisFocus':

1.  If 'analysisFocus' is 'Generate Questions (Mains & Prelims)':
    *   Create a section titled "## Potential Prelims Questions". Under it, generate 3-5 potential Prelims-style MCQs based on the provided Prelims syllabus pattern and the requested '{{{difficulty}}}'.
        *   'Standard' difficulty should focus on direct recall of facts from the article.
        *   'Advanced' difficulty should require connecting multiple facts or understanding nuanced implications.
        *   'Expert' difficulty should involve analytical skills, application of concepts, or 'statement-based' questions (e.g., "Consider the following statements...").
    *   For each MCQ, you MUST wrap it in the following custom tag structure. Each option MUST be on its own line and inside its own <option> tag. Do not combine options into a single line.
    *   <mcq question="The full question text here..." subject="e.g., GS Paper II - Polity & Governance - Federal Structure" explanation="A detailed explanation for why the correct answer is correct and the others are incorrect. This must be thorough.">
    *   <option correct="true">The correct answer option.</option>
    *   <option>An incorrect answer option.</option>
    *   <option>Another incorrect answer option.</option>
    *   <option>A final incorrect answer option.</option>
    *   </mcq>
    *   Ensure you identify the most relevant GS paper or subject AT THE MOST GRANULAR LEVEL POSSIBLE using the syllabus in the 'subject' attribute.
    *   Create another section titled "## Potential Mains Questions". Under it, generate 2-3 potential Mains-style questions based on the Mains syllabus and the requested '{{{difficulty}}}'.
        *   'Standard' questions might be 'Discuss' or 'Explain'.
        *   'Advanced' questions might be 'Critically analyze' or 'Compare and contrast'.
        *   'Expert' questions might ask for 'Elucidate' or present a complex scenario.
    *   After EACH Mains question, add a section titled "### Guidance for Answer". Under this, use bullet points to outline the key concepts, ideal structure (Introduction, Body, Conclusion), and specific examples from the article that should be included for a high-scoring response, referencing Mains syllabus topics where relevant.

2.  If 'analysisFocus' is 'Mains Analysis (Arguments, Keywords, Viewpoints)':
    *   Start with a "## Central Theme" heading and identify the core Mains syllabus topic.
    *   Use headings like "### Main Arguments", "### Counter-Arguments", "### Key Statistics & Data", and "### Important Keywords" to structure your analysis.
    *   Present arguments and viewpoints as bullet points.
    *   Use blockquotes for particularly impactful statements or phrases from the article.

3.  If 'analysisFocus' is 'Prelims Fact Finder (Key Names, Dates, Schemes)':
    *   Scour the article for specific, factual information relevant for Prelims.
    *   When you identify an entity, you MUST wrap it in one of the following custom tags: <person>Name</person>, <place>Location</place>, <scheme>Scheme/Policy Name</scheme>, <date>Date/Time Period</date>, or <org>Organization/Committee</org>.
    *   Present these facts under clear headings for each category (e.g., "### Key People", "### Locations Mentioned", "### Government Schemes").

4.  If 'analysisFocus' is 'Critical Analysis (Tone, Bias, Fact vs. Opinion)':
    *   Use headings: "### Author's Tone", "### Assessment of Bias", "### Fact vs. Opinion", and "### Objective of the Article".
    *   Under "Fact vs. Opinion", use bullet points to list examples of each, clearly labeled.

5.  If 'analysisFocus' is 'Vocabulary Builder for Editorials':
    *   Create a section for each of the 5-7 advanced vocabulary words.
    *   Use a heading for each word. Under it, use bold labels for "Definition:", "Contextual Meaning:", and "Example Sentence:".

6.  If 'analysisFocus' is 'Comprehensive Summary':
    *   Provide a concise summary (approx. 150-200 words) under the heading "## Executive Summary".
    *   Follow it with a "### Key Takeaways" section, using a bulleted list for the 3-4 most important points, linking each to a relevant syllabus topic.

Remember to generate the separate, concise 2-3 sentence 'summary' field first, then generate the detailed 'analysis' field based on the focus.
`,
});


const VerificationInputSchema = z.object({
    sourceText: z.string().describe('The original article content.'),
    generatedAnalysisString: z.string().describe('The AI-generated analysis and summary object as a JSON string to be verified.'),
});

const verificationPrompt = ai.definePrompt({
    name: 'newspaperVerificationPrompt',
    input: { schema: VerificationInputSchema },
    output: { schema: NewspaperAnalysisOutputSchema },
    prompt: `You are a meticulous editor and final reviewer for an AI-powered exam preparation tool. Your job is to perform a final check on an AI-generated analysis before it is shown to a student.

    **CRITICAL INSTRUCTIONS:**
    1.  **FACT-CHECKING:** Scrutinize the 'generatedAnalysis.analysis' markdown and the 'generatedAnalysis.summary' against the 'Original Source Article'. Correct any factual errors, misinterpretations, or claims that are not supported by the source text. Your primary source of truth is the provided article.
    2.  **FORMAT & STRUCTURE VERIFICATION:** Ensure the entire 'analysis' output strictly adheres to the required custom tag format (e.g., \`<mcq question="..." ...>\`, \`<option correct="true">\`, \`<person>\`, etc.). Fix any broken or improperly formatted tags. The structure must be perfect for UI rendering.
    3.  **IMPROVE CLARITY & INSIGHTS:** If possible, enhance the analysis for clarity without introducing new, unverified information. Ensure the syllabus tagging is as precise as possible.
    4.  **SUMMARY CHECK:** Ensure the 'summary' field is a concise, plain-text summary of 2-3 sentences and accurately reflects the article's main point.

    After your review, output the final, corrected, and verified analysis object containing both 'analysis' and 'summary' fields.

    **Original Source Article:**
    ---
    {{{sourceText}}}
    ---

    **Generated Analysis Object to Verify and Correct (as a JSON string):**
    ---json
    {{{generatedAnalysisString}}}
    ---

    Return the final, polished analysis object now.`,
});


const analyzeNewspaperArticleFlow = ai.defineFlow(
  {
    name: 'analyzeNewspaperArticleFlow',
    inputSchema: NewspaperAnalysisSyllabusInputSchema,
    outputSchema: NewspaperAnalysisOutputSchema,
  },
  async (input) => {
    // Step 1: Relevance Check
    const { output: relevanceResult } = await relevanceCheckPrompt(input);
    if (!relevanceResult) {
        throw new Error("Relevance check failed.");
    }

    if (!relevanceResult.isRelevant) {
      return {
        analysis: `## Article Not Relevant\n\n**Reasoning:** ${relevanceResult.reasoning}\n\nThe provided article does not appear to be relevant to the UPSC syllabus. Please provide an article related to topics like national and international current events, government policies, economy, history, geography, or social issues.`,
        summary: ""
      };
    }

    // Step 2: Generate the initial analysis (if relevant)
    const { output: initialOutput } = await analysisPrompt(input);
    if (!initialOutput) {
        throw new Error("Initial analysis generation failed.");
    }

    // Step 3: Verify and fact-check the analysis
    const { output: verifiedOutput } = await verificationPrompt({
        sourceText: input.sourceText,
        generatedAnalysisString: JSON.stringify(initialOutput),
    });
    if (!verifiedOutput) {
        throw new Error("Verification step failed.");
    }
    
    return verifiedOutput;
  }
);
