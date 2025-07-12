import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { createAuthenticatedHandler, getRateLimitKey, rateLimit } from '@/lib/auth-middleware';
import { z } from 'zod';

// URL validation schema
const urlSchema = z.string().url().refine((url) => {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Block private IP ranges and localhost
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^fe80:/,
      /^fc00:/,
      /^fd00:/,
    ];
    
    if (blockedPatterns.some(pattern => pattern.test(hostname))) {
      return false;
    }
    
    // Block common internal domains
    const blockedDomains = [
      'internal', 'corp', 'local', 'intranet', 'private',
      'metadata.google.internal', 'instance-data'
    ];
    
    if (blockedDomains.some(domain => hostname.includes(domain))) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}, {
  message: 'URL is not allowed or contains blocked patterns'
});

// Allowed domains for news articles (can be expanded)
const allowedDomains = [
  'thehindu.com',
  'indianexpress.com',
  'livemint.com',
  'economictimes.indiatimes.com',
  'business-standard.com',
  'financialexpress.com',
  'moneycontrol.com',
  'ndtv.com',
  'cnn.com',
  'bbc.com',
  'reuters.com',
  'apnews.com',
  'bloomberg.com',
  'wsj.com',
  'ft.com',
  'guardian.co.uk',
  'nytimes.com',
  'washingtonpost.com'
];

function isAllowedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return allowedDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

async function handler(req: NextRequest) {
  // Rate limiting
  const rateLimitKey = getRateLimitKey(req);
  if (!rateLimit(rateLimitKey, 10, 60000)) { // 10 requests per minute
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  
  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Validate URL format and security
  const urlValidation = urlSchema.safeParse(targetUrl);
  if (!urlValidation.success) {
    return NextResponse.json(
      { error: 'Invalid or blocked URL format' },
      { status: 400 }
    );
  }

  // Check if domain is allowed
  if (!isAllowedDomain(targetUrl)) {
    return NextResponse.json(
      { error: 'Domain not allowed. Only trusted news sources are permitted.' },
      { status: 403 }
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const resp = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'PrepTalk-Bot/1.0 (Educational Use)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      return NextResponse.json(
        { error: `The website returned an error: ${resp.status} ${resp.statusText}` },
        { status: resp.status }
      );
    }

    // Limit response size to prevent memory issues
    const contentLength = resp.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { error: 'Content too large' },
        { status: 413 }
      );
    }

    const html = await resp.text();
    
    // Additional size check after download
    if (html.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Content too large' },
        { status: 413 }
      );
    }

    const dom = new JSDOM(html, { url: targetUrl });
    const reader = new Readability(dom.window.document);
    const parsed = reader.parse();
    
    if (!parsed || !parsed.textContent) {
      return NextResponse.json({ error: 'Unable to parse article' }, { status: 400 });
    }

    // Sanitize the extracted text
    const sanitizedText = parsed.textContent
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, 100000); // Limit text length

    return NextResponse.json({ 
      text: sanitizedText,
      title: parsed.title || 'Untitled',
      excerpt: parsed.excerpt || '',
      source: new URL(targetUrl).hostname
    });
    
  } catch (err) {
    console.error('Article fetch error:', err);
    
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }
    
    return NextResponse.json(
      { error: 'Unable to fetch article. Please check the URL and try again.' },
      { status: 500 }
    );
  }
}

export const GET = createAuthenticatedHandler(handler);
