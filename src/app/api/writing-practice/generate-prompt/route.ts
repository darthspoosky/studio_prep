import { NextRequest, NextResponse } from 'next/server';
import { generate } from '@genkit-ai/ai';
import { gemini15Flash } from '@genkit-ai/googleai';

export async function POST(request: NextRequest) {
  try {
    const { type, difficulty, topic, examType } = await request.json();

    if (!type || !difficulty) {
      return NextResponse.json(
        { error: 'Type and difficulty are required' },
        { status: 400 }
      );
    }

    const prompt = `Generate a writing prompt for ${examType || 'UPSC Civil Services'} exam preparation.

Requirements:
- Type: ${type}
- Difficulty: ${difficulty}
- Topic area: ${topic || 'Any relevant current affairs or general topic'}

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
      tags: generatedPrompt.tags || [type, difficulty, 'AI Generated']
    };

    return NextResponse.json(finalPrompt);
  } catch (error) {
    console.error('Prompt generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}