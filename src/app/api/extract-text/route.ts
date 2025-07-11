import { NextRequest, NextResponse } from 'next/server';
import { GoogleVision } from '@google-cloud/vision';
import pdfParse from 'pdf-parse';

const vision = new GoogleVision.ImageAnnotatorClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    if (file.type === 'application/pdf') {
      // Extract text from PDF
      try {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } catch (error) {
        console.error('PDF parsing error:', error);
        return NextResponse.json({ error: 'Failed to extract text from PDF' }, { status: 500 });
      }
    } else if (file.type.startsWith('image/')) {
      // Extract text from image using Google Vision API
      try {
        const [result] = await vision.textDetection({
          image: {
            content: buffer.toString('base64'),
          },
        });

        const detections = result.textAnnotations;
        if (detections && detections.length > 0) {
          extractedText = detections[0].description || '';
        } else {
          extractedText = '';
        }
      } catch (error) {
        console.error('Vision API error:', error);
        return NextResponse.json({ error: 'Failed to extract text from image' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No text found in the file' }, { status: 400 });
    }

    return NextResponse.json({ text: extractedText });
  } catch (error) {
    console.error('Text extraction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}