import { NextRequest, NextResponse } from "next/server";
import { analyzeNewspaperArticle } from "@/ai/flows/newspaper-analysis-flow";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const input = await req.json();
    
    // Execute the flow on the server side
    const result = await analyzeNewspaperArticle(input);
    
    // Return the analysis result
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in newspaper analysis API:", error);
    return NextResponse.json(
      { error: "Failed to analyze newspaper article" },
      { status: 500 }
    );
  }
}
