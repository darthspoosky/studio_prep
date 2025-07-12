import { NextRequest, NextResponse } from 'next/server';
import { generate } from '@genkit-ai/ai';
import { gemini15Flash } from '@genkit-ai/googleai';
import { createAuthenticatedHandler, getRateLimitKey, rateLimit } from '@/lib/auth-middleware';
import { z } from 'zod';

// Input validation schema
const inputSchema = z.object({
  type: z.enum(['essay', 'precis', 'argumentative', 'report', 'descriptive', 'letter']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  topic: z.string().max(200, 'Topic too long').optional(),
  examType: z.string().min(1).max(100).default('UPSC Civil Services'),
  customRequirements: z.string().max(500, 'Custom requirements too long').optional()
});

async function handler(request: NextRequest) {
  // Rate limiting - 15 prompt generations per hour per user
  const rateLimitKey = getRateLimitKey(request);
  if (!rateLimit(rateLimitKey, 15, 3600000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    
    const inputValidation = inputSchema.safeParse(body);
    if (!inputValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input parameters',
          details: inputValidation.error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }

    const { type, difficulty, topic, examType, customRequirements } = inputValidation.data;

    // Sanitize and validate inputs
    const sanitizedTopic = topic?.replace(/[<>\"'&]/g, '') || 'Any relevant current affairs or general topic';
    const sanitizedRequirements = customRequirements?.replace(/[<>\"'&]/g, '') || '';
    
    const prompt = `Generate a writing prompt for ${examType} exam preparation.

Requirements:
- Type: ${type}
- Difficulty: ${difficulty}
- Topic area: ${sanitizedTopic}
${sanitizedRequirements ? `- Additional requirements: ${sanitizedRequirements}` : ''}

For essay prompts:
- Should be thought-provoking and analytical
- Allow for multiple perspectives
- Be relevant to current affairs or timeless themes
- Include clear instructions for structure and approach

For précis writing:
- Provide a passage of 300-400 words
- Should be from editorial or opinion pieces
- Include instruction to reduce to 1/3 length

For argumentative essays:
- Present a debatable statement
- Require clear position with supporting arguments
- Include current examples requirement

For report writing:
- Provide a scenario requiring official communication
- Include specific format requirements
- Mention audience and purpose

For descriptive writing:
- Focus on language proficiency
- Include vocabulary and grammar assessment criteria

Return a JSON object with:
{
  "title": "Engaging title for the prompt",
  "content": "The actual prompt text",
  "guidelines": "Specific writing guidelines and structure requirements",
  "timeLimit": number (in minutes),
  "wordLimit": number (optional),
  "tags": ["relevant", "tags"]
}

Make it challenging but fair for the specified difficulty level.`;

    const result = await generate({
      model: gemini15Flash,
      prompt: prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 1000,
      },
    });

    let generatedPrompt;
    try {
      // Try to parse JSON response
      const jsonMatch = result.text().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedPrompt = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback to structured parsing if JSON parsing fails
      const text = result.text();
      generatedPrompt = {
        title: `Generated ${type.charAt(0).toUpperCase() + type.slice(1)} Prompt`,
        content: text,
        guidelines: `Write a well-structured ${type} following standard conventions.`,
        timeLimit: type === 'precis' ? 30 : type === 'essay' ? 90 : 60,
        wordLimit: type === 'precis' ? 150 : type === 'essay' ? 1200 : 800,
        tags: [type, difficulty, 'Generated']
      };
    }

    // Validate and sanitize generated content
    if (!result.text() || result.text().trim().length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate valid prompt. Please try again.' },
        { status: 500 }
      );
    }

    // Ensure all required fields are present
    const finalPrompt = {
      id: 'generated-' + Date.now(),
      title: generatedPrompt.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Practice`,
      content: generatedPrompt.content || 'Write your response to this prompt.',
      type: type,
      difficulty: difficulty,
      timeLimit: generatedPrompt.timeLimit || (type === 'precis' ? 30 : 90),
      wordLimit: generatedPrompt.wordLimit,
      guidelines: generatedPrompt.guidelines || `Follow standard ${type} writing conventions.`,
      tags: generatedPrompt.tags || [type, difficulty, 'AI Generated'],
      metadata: {
        examType,
        generatedAt: new Date().toISOString(),
        customRequirements: !!customRequirements,
        topicSpecified: !!topic
      }
    };

    return NextResponse.json(finalPrompt);
  } catch (error) {
    console.error('Prompt generation error:', error);
    
    // Don't expose internal errors
    return NextResponse.json(
      { error: 'Unable to generate prompt. Please try again with different parameters.' },
      { status: 500 }
    );
  }
}

export const POST = createAuthenticatedHandler(handler);