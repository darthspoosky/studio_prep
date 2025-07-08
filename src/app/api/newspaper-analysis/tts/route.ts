import { NextRequest, NextResponse } from "next/server";
import { textToSpeechFlow } from "@/ai/flows/text-to-speech-flow";
import { run } from "@genkit-ai/flow";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: "Text parameter is required and must be a string" },
        { status: 400 }
      );
    }
    
    // Use the flow directly on the server
    const result = await run(textToSpeechFlow, text) as { text: string, audio: Buffer };
    
    // For API responses, convert Buffer to base64 string
    return NextResponse.json({
      text: result.text,
      audio: result.audio.toString('base64')
    });
  } catch (error) {
    console.error("Error in text-to-speech API:", error);
    return NextResponse.json(
      { error: "Failed to convert text to speech" },
      { status: 500 }
    );
  }
}
