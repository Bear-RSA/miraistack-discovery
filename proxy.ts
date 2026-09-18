import { NextRequest, NextResponse } from 'next/server';
import { REF_COOKIE, normalizeRefCode, refCookieOptions } from '@/lib/ref-cookie';

// Any page visited with ?ref=<code> stores the attribution cookie and
// redirects to the same URL without the param, so it doesn't linger in the
// address bar or get re-shared. Every landing overwrites: last click wins.
export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const raw = url.searchParams.get('ref');
  if (raw === null) return NextResponse.next();

  url.searchParams.delete('ref');
  const res = NextResponse.redirect(url);
  const code = normalizeRefCode(raw);
  if (code) res.cookies.set(REF_COOKIE, code, refCookieOptions);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = {
  // Pages only: skip API routes, Next internals and static files.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
