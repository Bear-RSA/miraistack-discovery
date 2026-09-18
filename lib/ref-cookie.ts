/* ============================================================
   REFERRAL COOKIE
   Pure helpers with no Node dependencies, so they can run in the
   proxy (edge) as well as in route handlers.
=========================================================== */

export const REF_COOKIE = 'ms_ref';
export const REF_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, in seconds
export const REF_CODE_RE = /^[a-z0-9][a-z0-9_-]{1,31}$/;

/** Lowercases and validates a candidate code; null if it isn't storable. */
export function normalizeRefCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toLowerCase();
  return REF_CODE_RE.test(code) ? code : null;
}

export const refCookieOptions = {
  maxAge: REF_COOKIE_MAX_AGE,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: false, // app code doesn't read it client-side today, but nothing secret in it either
};
