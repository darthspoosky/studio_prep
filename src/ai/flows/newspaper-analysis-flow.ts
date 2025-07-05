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
  prompt: `You are a world-class editor and exam coach AI for Indian competitive exam aspirants. Your analysis must be presented in a premium, highly structured, and easy-to-digest format. 
Use markdown extensively and intelligently: leverage headings, subheadings, blockquotes for key takeaways, bold text for keywords, and tables for data comparison.

Your task is to analyze a news article provided either as a URL or as raw text, tailored to the user's specific exam preparation needs.

The user is preparing for the '{{{examType}}}' exam.
The requested analysis focus is: '{{{analysisFocus}}}'.

Here is the source material to analyze:
"{{{sourceText}}}"

Based on the 'analysisFocus', generate a detailed, well-structured response in markdown format.

Follow these specific instructions for the given 'analysisFocus':

1.  If 'analysisFocus' is 'Generate Questions (Mains & Prelims)':
    *   Create a section titled "Potential Prelims Questions". Under it, generate 3-5 potential Prelims-style questions (MCQs without the options) based on the factual content.
    *   Create another section titled "Potential Mains Questions". Under it, generate 2-3 potential Mains-style questions that require analytical and critical thinking.

2.  If 'analysisFocus' is 'Mains Analysis (Arguments, Keywords, Viewpoints)':
    *   Start with a "Central Theme" heading.
    *   Use headings like "Main Arguments", "Counter-Arguments", "Key Statistics & Data", and "Important Keywords" to structure your analysis.
    *   Present arguments and viewpoints as bullet points.
    *   Use blockquotes for particularly impactful statements or phrases from the article.

3.  If 'analysisFocus' is 'Prelims Fact Finder (Key Names, Dates, Schemes)':
    *   Scour the article for specific, factual information relevant for Prelims.
    *   When you identify an entity, you MUST wrap it in one of the following custom tags: <person>Name</person>, <place>Location</place>, <scheme>Scheme/Policy Name</scheme>, <date>Date/Time Period</date>, or <org>Organization/Committee</org>.
    *   Present these facts under clear headings for each category (e.g., "Key People", "Locations Mentioned", "Government Schemes").

4.  If 'analysisFocus' is 'Critical Analysis (Tone, Bias, Fact vs. Opinion)':
    *   Use headings: "Author's Tone", "Assessment of Bias", "Fact vs. Opinion", and "Objective of the Article".
    *   Under "Fact vs. Opinion", use bullet points to list examples of each, clearly labeled.

5.  If 'analysisFocus' is 'Vocabulary Builder for Editorials':
    *   Create a section for each of the 5-7 advanced vocabulary words.
    *   Use a heading for each word. Under it, use bold labels for "Definition:", "Contextual Meaning:", and "Example Sentence:".

6.  If 'analysisFocus' is 'Comprehensive Summary':
    *   Provide a concise summary (approx. 150-200 words) under the heading "Executive Summary".
    *   Follow it with a "Key Takeaways" section, using a bulleted list for the 3-4 most important points.

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
