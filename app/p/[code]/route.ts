import { NextRequest, NextResponse } from 'next/server';
import { REF_COOKIE, normalizeRefCode, refCookieOptions } from '@/lib/ref-cookie';

// Branded short link: /p/jane23 sets the 30-day attribution cookie and
// bounces to the landing page. A bad code is just a plain visit.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = normalizeRefCode(code);

  const res = NextResponse.redirect(new URL('/', req.url), 302);
  if (normalized) res.cookies.set(REF_COOKIE, normalized, refCookieOptions);
  res.headers.set('Cache-Control', 'no-store'); // never let the CDN replay one visitor's Set-Cookie
  return res;
}
