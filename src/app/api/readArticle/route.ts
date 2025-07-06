import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }
  try {
    const resp = await fetch(targetUrl);
    if (!resp.ok) {
      return NextResponse.json({ error: 'Failed to fetch article' }, { status: 400 });
    }
    const html = await resp.text();
    const dom = new JSDOM(html, { url: targetUrl });
    const reader = new Readability(dom.window.document);
    const parsed = reader.parse();
    if (!parsed || !parsed.textContent) {
      return NextResponse.json({ error: 'Unable to parse article' }, { status: 400 });
    }
    return NextResponse.json({ text: parsed.textContent });
  } catch (err) {
    console.error('Article fetch error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
