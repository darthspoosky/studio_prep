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
    const resp = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    if (!resp.ok) {
      return NextResponse.json(
        { error: `The website returned an error: ${resp.status} ${resp.statusText}.` },
        { status: resp.status }
      );
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
    return NextResponse.json({ error: 'Unexpected server error while trying to fetch the URL.' }, { status: 500 });
  }
}
