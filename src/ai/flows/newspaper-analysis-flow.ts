
'use server';
/**
 * @fileOverview A multi-agent AI workflow to analyze newspaper articles for exam preparation.
 * This flow now supports streaming results back to the client.
 *
 * - analyzeNewspaperArticle: The public-facing flow that orchestrates the workflow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Cache syllabus content
const syllabusCache: { prelims?: string; mains?: string } = {};
function getSyllabusContent() {
  if (!syllabusCache.prelims || !syllabusCache.mains) {
    syllabusCache.prelims = fs.readFileSync(path.join(process.cwd(), 'src/ai/knowledge/upsc-prelims-syllabus.md'), 'utf-8');
    syllabusCache.mains = fs.readFileSync(path.join(process.cwd(), 'src/ai/knowledge/upsc-mains-syllabus.md'), 'utf-8');
  }
  return syllabusCache;
}

// --- Input and Output Schemas ---

const NewspaperAnalysisInputSchema = z.object({
  sourceText: z.string().min(100).max(50000),
  examType: z.string().default('UPSC Civil Services'),
  analysisFocus: z.string(),
  outputLanguage: z.string().default('English'),
});
export type NewspaperAnalysisInput = z.infer<typeof NewspaperAnalysisInputSchema>;

// Internal schemas for agent communication
const SyllabusInputSchema = NewspaperAnalysisInputSchema.extend({
  prelimsSyllabus: z.string(),
  mainsSyllabus: z.string(),
});

const AnalysisWithTopicInputSchema = SyllabusInputSchema.extend({
  identifiedSyllabusTopic: z.string(),
});

// Schemas for structured question generation
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

// Schemas for Knowledge Graph
const KnowledgeGraphNodeSchema = z.object({
  id: z.string().describe("A unique, descriptive ID for the node (e.g., 'NarendraModi', 'SupremeCourtOfIndia')."),
  label: z.string().describe("The full name of the entity."),
  type: z.enum(["Person", "Organization", "Location", "Policy", "Concept", "Date", "Statistic"]).describe("The type of entity."),
});
const KnowledgeGraphEdgeSchema = z.object({
  source: z.string().describe("The ID of the source node."),
  target: z.string().describe("The ID of the target node."),
  label: z.string().min(3).max(40).describe("A concise description of the relationship (e.g., 'criticized by', 'announced', 'impacts')."),
});
const KnowledgeGraphSchema = z.object({
  nodes: z.array(KnowledgeGraphNodeSchema),
  edges: z.array(KnowledgeGraphEdgeSchema),
}).optional();
export type KnowledgeGraph = z.infer<typeof KnowledgeGraphSchema>;


// Final output schema for the entire flow (used for client-side state)
const NewspaperAnalysisOutputSchema = z.object({
  summary: z.string().optional(),
  prelims: z.object({ mcqs: z.array(MCQSchema) }),
  mains: z.object({ questions: z.array(MainsQuestionSchema) }).optional(),
  knowledgeGraph: KnowledgeGraphSchema,
  syllabusTopic: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().describe("A list of 2-3 broader syllabus tags related to the topic (e.g., 'Polity', 'Governance', 'International Relations')."),
  qualityScore: z.number().optional(),
  questionsCount: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  cost: z.number().optional(),
  processingTime: z.number().optional(),
});
export type NewspaperAnalysisOutput = z.infer<typeof NewspaperAnalysisOutputSchema>;

// NEW: Define the shape of each streamed chunk
const NewspaperAnalysisChunkSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal('summary'), data: z.string().describe("The summary of the article.") }),
  z.object({ type: z.literal('prelims'), data: MCQSchema.describe("A single Prelims MCQ question.") }),
  z.object({ type: z.literal('mains'), data: MainsQuestionSchema.describe("A single Mains question.") }),
  z.object({ type: z.literal('knowledgeGraph'), data: KnowledgeGraphSchema.unwrap().optional().describe("The full knowledge graph.") }),
  z.object({ type: z.literal('metadata'), data: z.object({
    syllabusTopic: z.string().optional().nullable(),
    qualityScore: z.number().optional(),
    tags: z.array(z.string()).optional(),
    questionsCount: z.number().optional(),
    totalTokens: z.number().optional(),
    cost: z.number().optional()
  }).describe("Final metadata about the analysis.") }),
  z.object({ type: z.literal('error'), data: z.string().describe("An error message if the analysis failed.") }),
]);
export type NewspaperAnalysisChunk = z.infer<typeof NewspaperAnalysisChunkSchema>;


const VerificationInputSchema = NewspaperAnalysisOutputSchema.extend({
    sourceText: z.string(),
    outputLanguage: z.string(),
    analysisFocus: z.string(),
    generatedAnalysisString: z.string(),
});


// --- AGENT 1: Relevance Analyst (definition remains the same) ---
const RelevanceAnalystOutputSchema = z.object({
  isRelevant: z.boolean().describe('Whether the article content is relevant to the provided UPSC syllabus.'),
  syllabusTopic: z.string().nullable().describe('The single most specific, granular syllabus topic. Null if not relevant.'),
  reasoning: z.string().optional().describe('Brief explanation for relevance assessment.'),
  confidenceScore: z.number().min(0).max(1).describe('Confidence in the relevance assessment (0-1).'),
});

const relevanceAnalystAgent = ai.definePrompt({
  name: 'relevanceAnalystAgent',
  input: { schema: SyllabusInputSchema },
  output: { schema: RelevanceAnalystOutputSchema },
  prompt: `Think step by step to assess UPSC question probability:

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
{{{mainsSyllabus}}}
`,
});

// --- AGENT 2: Question Generator (definition remains the same) ---
const questionGeneratorAgent = ai.definePrompt({
  name: 'questionGeneratorAgent',
  input: { schema: AnalysisWithTopicInputSchema },
  output: { schema: NewspaperAnalysisOutputSchema },
  prompt: `You are an expert UPSC question setter with 15+ years of experience. Your task is to create high-quality, exam-standard questions from the provided article, focusing on the identified syllabus topic.

CRITICAL: Your entire response MUST be in {{{outputLanguage}}}.

**ARTICLE CONTEXT:**
- Identified Syllabus Topic: '{{{identifiedSyllabusTopic}}}'
- Exam Type: '{{{examType}}}'
- Analysis Focus: '{{{analysisFocus}}}'

**ARTICLE CONTENT:**
"{{{sourceText}}}"

**MANDATORY FIRST STEP**: Generate a clean, 2-3 sentence summary in the 'summary' field. This must be pure text without any HTML, XML, or custom tags.

**OUTPUT FORMAT**: Respond ONLY with valid JSON adhering to the provided schema.

--- ANALYSIS FOCUS: 'Generate Questions (Mains & Prelims)' ---

## **UPSC PRELIMS (MCQs)**
Adhere strictly to authentic UPSC Civil Services (P) Examination patterns. Generate a mix of the following question types based on what is most appropriate for the article's content. A penalty of 1/3rd marks is applied for wrong answers, so questions should test deep understanding.

### **1. Multiple Statement Evaluation (High Priority)**
- **Structure:** Present 2-4 factual statements, EACH prefixed with a number (e.g., "1.", "2."). The question should be "Which of the statements given above is/are correct?".
- **Options:** Use formats like "(a) 1 and 2 only", "(b) 2 and 3 only", etc. Or, if appropriate for the question, "Only one", "Only two", "All three", "None".
- **Goal:** Test comprehensive, nuanced knowledge, not just recall.

### **2. Assertion-Reason / Statement I & Statement II (Relationship Analysis)**
- **Structure:** Present two statements labelled "Statement-I" and "Statement-II". The question must be "Which one of the following is correct in respect of the above statements?".
- **Options:** Must be exactly these four:
    - (a) Both Statement-I and Statement-II are correct and Statement-II is the correct explanation for Statement-I.
    - (b) Both Statement-I and Statement-II are correct and Statement-II is not the correct explanation for Statement-I.
    - (c) Statement-I is correct but Statement-II is incorrect.
    - (d) Statement-I is incorrect but Statement-II is correct.
- **Goal:** Test the understanding of cause-and-effect and logical coherence.

### **3. Matching Pairs (Numerical Count)**
- **Structure:** Present two columns of items (e.g., historical figures and their roles, locations and significance). Each pair MUST be on a new line and prefixed with a number (e.g., "1. Burzahom : Rock-cut shrines"). Ask "How many pairs given above are correctly matched?".
- **Options:** Must be numerical counts like "Only one pair", "Only two pairs", etc.
- **Goal:** Test specific factual associations and precise recall.

### **4. Direct Question (Single-Best Answer)**
- **Structure:** A direct query followed by four unique alternatives.
- **Goal:** Test direct recall of facts, definitions, or the identification of a single concept.

**General Instructions for all MCQs:**
- **Difficulty:** Provide an integer score from 1 (easiest) to 10 (hardest). Aim for a difficulty of 8 or 9.
- **Explanations:** For every question, provide a detailed, professional explanation for why each option is correct or incorrect, linking to static syllabus knowledge. **Crucially, do not use phrases like "as the passage states."** The explanation should stand on its own.


## **UPSC MAINS**
- **Directives:** Use words like "Critically analyze," "Examine," "Discuss."
- **Difficulty:** Provide an integer score from 1 (easiest) to 10 (hardest). Aim for a difficulty of 8 or 9.
- **Guidance:** For each question, provide structured guidance in markdown. The guidance should be a mini-essay plan that a top-ranker would create before writing.

  ### Guidance for Answer
  **1. Deconstruct the Question:**
  - **Core Subject:** (e.g., Polity, International Relations)
  - **Key Directive:** (e.g., Critically Analyze, Discuss)
  - **Main Theme/Topic:** (e.g., India's Neighbourhood Policy)
  - **Specific Scope:** (e.g., Focusing on the impact of recent agreements)

  **2. Answer Structure Blueprint:**
  - **Introduction (Hook):** Start with a relevant fact from the article, a constitutional article, or a recent report to set the context. State the main argument or scope of the answer.
  - **Body Paragraph 1 (Dimension A):** [Explain the first dimension of the answer, e.g., Political Implications]. Use 1-2 examples from the article.
  - **Body Paragraph 2 (Dimension B):** [Explain the second dimension, e.g., Economic Impact]. Use 1-2 examples from the article.
  - **Body Paragraph 3 (Counter-Argument/Challenge - for 'Critically Analyze' type questions):** Present a counter-viewpoint or a significant challenge.
  - **Conclusion (Forward-Looking):** Summarize the key arguments and provide a balanced, futuristic, or solution-oriented conclusion. Avoid introducing new points.

  **3. Key Data & Keywords:**
  - **Data Points to Use:** [List 2-3 specific statistics, names of reports, or dates from the article].
  - **Relevant Keywords:** [List 5-7 keywords for Mains answer writing, e.g., 'Cooperative Federalism', 'Strategic Autonomy', 'Inclusive Growth'].

## **ADDITIONAL TASK: KNOWLEDGE GRAPH EXTRACTION**
From the article, identify the key entities and the relationships between them. Structure this as a knowledge graph with nodes and edges.
- **Nodes**: Each node must have a unique 'id' (camelCase or PascalCase), a 'label' (the entity's name), and a 'type' (Person, Organization, Location, Policy, Concept, Date, Statistic).
- **Edges**: Each edge must link two nodes by their 'id's and have a concise 'label' describing their relationship (e.g., "criticized by", "announced", "impacts", "located in").
This information should be populated in the 'knowledgeGraph' field of the JSON output.

## **ADDITIONAL TASK: TAGGING**
Based on the 'Identified Syllabus Topic' and the content, identify 2-3 broader, high-level tags from the syllabus. Examples: 'Indian Society', 'Polity', 'Governance', 'International Relations', 'Economic Development'. Populate these in the 'tags' field.

Generate the questions, knowledge graph, and tags now.`,
});

// --- AGENT 3: Verification Editor (definition remains the same) ---
const verificationEditorAgent = ai.definePrompt({
  name: 'verificationEditorAgent',
  input: { schema: VerificationInputSchema },
  output: { schema: NewspaperAnalysisOutputSchema },
  prompt: `You are a Senior Quality Assurance Editor for a premium UPSC preparation platform. Your job is to verify and enhance the AI-generated analysis.

**MISSION**: Verify the analysis for coherency, quality, and adherence to UPSC standards.

**1. COHERENCY CHECK**: Ensure the analysis is based ONLY on the source article. Remove any external or hallucinated information.
**2. QUALITY ENHANCEMENT**:
   - **Prelims:** Are explanations analytical? Do options follow real UPSC patterns?
   - **Mains:** Is the 'guidance' structured and genuinely helpful for writing a high-scoring answer?
   - **Difficulty:** Ensure the difficulty score for each question is an integer between 1 and 10. Adjust if questions are too easy or too obscure.
**3. SUMMARY SANITIZATION**: The 'summary' MUST be 2-3 sentences of clean text. If the summary is missing, empty, or inadequate in the input, you MUST generate a new one from the source article. Strip all tags.
**4. KNOWLEDGE GRAPH VERIFICATION**: Ensure the extracted nodes and edges are factual and directly supported by the article text. The graph should be coherent and relationships logical. Node IDs must be valid identifiers.
**5. METRICS**: Calculate and include 'questionsCount' and a 'qualityScore' (0-1).
**6. TAGS**: Ensure the 'tags' array contains 2-3 relevant, high-level topics.

Return the perfected analysis as a valid JSON object.

--- ORIGINAL SOURCE ARTICLE ---
{{{sourceText}}}

--- GENERATED ANALYSIS TO VERIFY ---
\`\`\`json
{{{generatedAnalysisString}}}
\`\`\`

--- REQUIRED LANGUAGE & FOCUS ---
Language: {{{outputLanguage}}}
Focus: {{{analysisFocus}}}

Execute comprehensive verification now.`,
});


// --- ORCHESTRATOR: The Main Flow (Now Streaming) ---

const analyzeNewspaperArticleFlow = ai.defineFlow(
  {
    name: 'analyzeNewspaperArticleFlow',
    inputSchema: NewspaperAnalysisInputSchema,
    streamSchema: NewspaperAnalysisChunkSchema,
  },
  async function* (input) {
    // Load syllabus content inside the flow
    const { prelims: prelimsSyllabus, mains: mainsSyllabus } = getSyllabusContent();

    const flowInputWithSyllabus: SyllabusInputSchema = {
      ...input,
      prelimsSyllabus: prelimsSyllabus as string,
      mainsSyllabus: mainsSyllabus as string,
    };

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const USD_TO_INR_RATE = 83;
    const INPUT_PRICE_PER_1K_TOKENS_USD = 0.00035;
    const OUTPUT_PRICE_PER_1K_TOKENS_USD = 0.00105;

    // STEP 1: Run Relevance Analyst Agent
    const relevanceAgentResponse = await relevanceAnalystAgent(flowInputWithSyllabus);
    const relevanceResult = relevanceAgentResponse.output;
    
    // @ts-expect-error - Handling metadata usage which may not be in current type definitions
    if (relevanceAgentResponse.metadata?.usage) {
      // @ts-expect-error - Accessing properties that may not be in current type definitions
      totalInputTokens += relevanceAgentResponse.metadata.usage.inputTokens || 0;
      // @ts-expect-error - Accessing properties that may not be in current type definitions
      totalOutputTokens += relevanceAgentResponse.metadata.usage.outputTokens || 0;
    }

    if (!relevanceResult || !relevanceResult.isRelevant || !relevanceResult.syllabusTopic) {
      const reason = relevanceResult?.reasoning || 'Article assessed as not relevant for UPSC preparation.';
      yield { type: 'error', data: reason };
      return;
    }

    // STEP 2: Run Question Generator Agent
    const questionAgentResponse = await questionGeneratorAgent({
      ...flowInputWithSyllabus,
      identifiedSyllabusTopic: relevanceResult.syllabusTopic || '',
    });
    const initialAnalysis = questionAgentResponse.output;

    // @ts-expect-error - Handling metadata usage which may not be in current type definitions
    if (questionAgentResponse.metadata?.usage) {
      // @ts-expect-error - Accessing properties that may not be in current type definitions
      totalInputTokens += questionAgentResponse.metadata.usage.inputTokens || 0;
      // @ts-expect-error - Accessing properties that may not be in current type definitions
      totalOutputTokens += questionAgentResponse.metadata.usage.outputTokens || 0;
    }

    if (!initialAnalysis) {
      yield { type: 'error', data: 'Question Generator Agent failed to produce an analysis.' };
      return;
    }

    // STEP 3: Run Verification Editor Agent
    const verificationInput = {
        ...initialAnalysis,
        sourceText: input.sourceText,
        generatedAnalysisString: JSON.stringify(initialAnalysis),
        outputLanguage: input.outputLanguage || 'English',
        analysisFocus: input.analysisFocus || 'Generate Questions',
    }
    const verificationAgentResponse = await verificationEditorAgent(verificationInput);
    const verifiedAnalysis = verificationAgentResponse.output;

    // @ts-expect-error - Handling metadata usage which may not be in current type definitions
    if (verificationAgentResponse.metadata?.usage) {
        // @ts-expect-error - Accessing properties that may not be in current type definitions
        totalInputTokens += verificationAgentResponse.metadata.usage.inputTokens || 0;
        // @ts-expect-error - Accessing properties that may not be in current type definitions
        totalOutputTokens += verificationAgentResponse.metadata.usage.outputTokens || 0;
    }

    const finalAnalysis = verifiedAnalysis || initialAnalysis; // Fallback to initial if verification fails
    
    // STEP 4: Stream the results piece by piece
    if (finalAnalysis.summary) {
        yield { type: 'summary', data: finalAnalysis.summary };
    }
    if (finalAnalysis.prelims?.mcqs) {
        for (const mcq of finalAnalysis.prelims.mcqs) {
            yield { type: 'prelims', data: mcq };
        }
    }
    if (finalAnalysis.mains?.questions) {
        for (const question of finalAnalysis.mains.questions) {
            yield { type: 'mains', data: question };
        }
    }
    if (finalAnalysis.knowledgeGraph) {
        yield { type: 'knowledgeGraph', data: finalAnalysis.knowledgeGraph };
    }

    // STEP 5: Final metadata
    const questionsCount = (finalAnalysis.prelims?.mcqs?.length || 0) + (finalAnalysis.mains?.questions?.length || 0);
    const totalTokens = totalInputTokens + totalOutputTokens;
    const cost = ((totalInputTokens / 1000) * INPUT_PRICE_PER_1K_TOKENS_USD + (totalOutputTokens / 1000) * OUTPUT_PRICE_PER_1K_TOKENS_USD) * USD_TO_INR_RATE;
    
    yield {
        type: 'metadata',
        data: {
            syllabusTopic: relevanceResult.syllabusTopic,
            qualityScore: finalAnalysis.qualityScore,
            tags: finalAnalysis.tags,
            questionsCount,
            totalTokens,
            cost: Math.round(cost * 100) / 100,
        }
    };
  }
);

export async function analyzeNewspaperArticle(input: NewspaperAnalysisInput) {
    return analyzeNewspaperArticleFlow(input);
}
