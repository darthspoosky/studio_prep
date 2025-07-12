import { NextRequest, NextResponse } from "next/server";
import { analyzeNewspaperArticle } from "@/ai/flows/newspaper-analysis-flow";
import { createAuthenticatedHandler, getRateLimitKey, rateLimit } from '@/lib/auth-middleware';
import { z } from 'zod';

// Input validation schema
const inputSchema = z.object({
  articleText: z.string().min(100, 'Article text must be at least 100 characters').max(50000, 'Article text too long'),
  articleUrl: z.string().url().optional(),
  analysisType: z.enum(['comprehensive', 'summary', 'factual', 'editorial']).default('comprehensive'),
  focusAreas: z.array(z.string()).optional().default([]),
  examType: z.string().min(1).max(50).default('UPSC Civil Services'),
});

async function handler(req: NextRequest) {
  // Rate limiting - 5 analyses per minute per user
  const rateLimitKey = getRateLimitKey(req);
  if (!rateLimit(rateLimitKey, 5, 60000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    // Parse and validate request body
    const body = await req.json();
    
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

    const input = inputValidation.data;
    
    // Execute the flow on the server side
    const result = await analyzeNewspaperArticle(input);
    
    // Return the analysis result with metadata
    return NextResponse.json({
      ...result,
      metadata: {
        analysisType: input.analysisType,
        examType: input.examType,
        processedAt: new Date().toISOString(),
        articleLength: input.articleText.length,
        focusAreas: input.focusAreas
      }
    });
  } catch (error) {
    console.error("Error in newspaper analysis API:", error);
    
    // Don't expose internal errors
    return NextResponse.json(
      { error: "Unable to analyze article. Please try again with valid article content." },
      { status: 500 }
    );
  }
}

export const POST = createAuthenticatedHandler(handler);
