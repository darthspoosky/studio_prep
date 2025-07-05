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

const NewspaperAnalysisInputSchema = z.object({
  sourceText: z.string().describe('The article content, which can be either a URL or the full text of the article.'),
  examType: z.string().describe('The type of exam the user is preparing for, e.g., "UPSC Civil Services".'),
  analysisFocus: z
    .string()
    .describe(
      'The specific type of analysis requested by the user, e.g., "Generate Questions (Mains & Prelims)".'
    ),
});
export type NewspaperAnalysisInput = z.infer<typeof NewspaperAnalysisInputSchema>;

const NewspaperAnalysisOutputSchema = z.object({
  analysis: z.string().describe('The detailed, markdown-formatted analysis of the article.'),
});
export type NewspaperAnalysisOutput = z.infer<typeof NewspaperAnalysisOutputSchema>;

export async function analyzeNewspaperArticle(input: NewspaperAnalysisInput): Promise<NewspaperAnalysisOutput> {
  return await analyzeNewspaperArticleFlow(input);
}

const analysisPrompt = ai.definePrompt({
  name: 'newspaperAnalysisPrompt',
  input: { schema: NewspaperAnalysisInputSchema },
  output: { schema: NewspaperAnalysisOutputSchema },
  prompt: `You are an expert AI assistant for Indian competitive exam aspirants. Your task is to analyze a news article provided either as a URL or as raw text, tailored to the user's specific exam preparation needs.

The user is preparing for the '{{{examType}}}' exam.
The requested analysis focus is: '{{{analysisFocus}}}'.

Here is the source material to analyze:
"{{{sourceText}}}"

Based on the 'analysisFocus', generate a detailed, well-structured response in markdown format. Use headings, bold text, bullet points, and numbered lists to make the output clear and easy to read.

Follow these specific instructions for the given 'analysisFocus':

1.  If 'analysisFocus' is 'Generate Questions (Mains & Prelims)':
    *   Generate 3-5 potential Prelims-style questions (MCQs without the options) based on the factual content of the article.
    *   Generate 2-3 potential Mains-style questions that require analytical and critical thinking, based on the article's core themes.
    *   Clearly label which questions are for "Prelims" and which are for "Mains".

2.  If 'analysisFocus' is 'Mains Analysis (Arguments, Keywords, Viewpoints)':
    *   Identify the central theme of the article.
    *   Extract and list the main arguments presented by the author.
    *   Extract and list any counter-arguments or alternative viewpoints mentioned.
    *   List key statistics, data points, or official reports cited.
    *   Provide a list of important keywords and phrases that can be used in Mains answers.

3.  If 'analysisFocus' is 'Prelims Fact Finder (Key Names, Dates, Schemes)':
    *   Scour the article for specific, factual information relevant for Prelims.
    *   List all key names (people, organizations, committees).
    *   List all important dates or time periods mentioned.
    *   List any government schemes, policies, or legal acts cited.
    *   List key locations (cities, states, countries) if they are central to the article's topic.

4.  If 'analysisFocus' is 'Critical Analysis (Tone, Bias, Fact vs. Opinion)':
    *   Analyze and describe the author's tone (e.g., analytical, critical, prescriptive, optimistic).
    *   Assess the article for potential bias. Explain your reasoning.
    *   Distinguish between factual statements and the author's opinions or interpretations. Provide examples of each from the text.
    *   Briefly state the overall objective or purpose of the article.

5.  If 'analysisFocus' is 'Vocabulary Builder for Editorials':
    *   Identify 5-7 advanced or context-specific vocabulary words from the article.
    *   For each word, provide:
        *   Its definition.
        *   Its meaning in the context of the article.
        *   A new sentence demonstrating its usage.

6.  If 'analysisFocus' is 'Comprehensive Summary':
    *   Provide a concise summary of the article (approx. 150-200 words) that captures the main issue, key arguments, and conclusion. Ensure the summary is neutral and objective.

Begin the analysis now.
`,
});

const analyzeNewspaperArticleFlow = ai.defineFlow(
  {
    name: 'analyzeNewspaperArticleFlow',
    inputSchema: NewspaperAnalysisInputSchema,
    outputSchema: NewspaperAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await analysisPrompt(input);
    return output!;
  }
);
