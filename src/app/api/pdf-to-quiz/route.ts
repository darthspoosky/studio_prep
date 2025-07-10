
import { NextRequest, NextResponse } from 'next/server';
import { run } from '@genkit-ai/flow';
import { pdfToQuizFlow } from '@/ai/flows/pdf-to-quiz-flow';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const examType = formData.get('examType') as string || 'UPSC Prelims';
    const questionCount = parseInt(formData.get('questionCount') as string || '10', 10);

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Only PDF is supported.' }, { status: 400 });
    }

    // Convert the file to a Base64 data URI
    const fileBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(fileBuffer).toString('base64');
    const pdfDataUri = `data:application/pdf;base64,${base64String}`;
    
    // Run the Genkit flow with the prepared input
    const result = await run(pdfToQuizFlow, {
        pdfDataUri,
        examType,
        questionCount,
    });
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[PDF to Quiz API Error]', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during PDF processing.' }, 
      { status: 500 }
    );
  }
}
