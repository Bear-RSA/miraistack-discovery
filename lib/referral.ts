import 'server-only';
import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import { FieldValue, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { getDb } from './firebase';
import { REF_COOKIE, normalizeRefCode } from './ref-cookie';
import type { Answers } from './scoring';

/* ============================================================
   REFERRAL DATA LAYER
   Collections:
     promoters/{code}        one doc per promoter, keyed by their link code
     leads/{referenceId}     one doc per questionnaire submission
   A lead with refCode === null is organic. A flagged lead is still a
   real submission (and still emailed) but doesn't count toward credit.
=========================================================== */

// Repeat submissions from the same email or IP inside this window are flagged.
export const DEDUPE_WINDOW_MINUTES = 60;

export interface Promoter {
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  payoutRate: number | null;   // ZAR per attended consultation. Reserved; not used in any view yet.
  payoutTerms: string | null;
  active: boolean;
  createdAt: string;
}

export interface Lead {
  referenceId: string;
  service: string;
  contactName: string | null;
  businessName: string | null;
  email: string | null;
  industry: string | null;
  rawScore: number | null;
  recommendedTier: string | null;
  refCode: string | null;
  flagged: boolean;
  flagReason: string | null;
  bookedAt: string | null;
  attendedAt: string | null;
  createdAt: string;
}

const iso = (t: unknown): string | null => (t instanceof Timestamp ? t.toDate().toISOString() : null);

function toPromoter(id: string, d: DocumentData): Promoter {
  return {
    code: id,
    name: d.name ?? id,
    email: d.email ?? null,
    phone: d.phone ?? null,
    payoutRate: typeof d.payoutRate === 'number' ? d.payoutRate : null,
    payoutTerms: d.payoutTerms ?? null,
    active: d.active !== false,
    createdAt: iso(d.createdAt) ?? new Date(0).toISOString(),
  };
}

function toLead(id: string, d: DocumentData): Lead {
  return {
    referenceId: id,
    service: d.service ?? '',
    contactName: d.contactName ?? null,
    businessName: d.businessName ?? null,
    email: d.email ?? null,
    industry: d.industry ?? null,
    rawScore: typeof d.rawScore === 'number' ? d.rawScore : null,
    recommendedTier: d.recommendedTier ?? null,
    refCode: d.refCode ?? null,
    flagged: d.flagged === true,
    flagReason: d.flagReason ?? null,
    bookedAt: iso(d.bookedAt),
    attendedAt: iso(d.attendedAt),
    createdAt: iso(d.createdAt) ?? new Date(0).toISOString(),
  };
}

/* ---------- request helpers ---------- */

// Cookie is the source of truth (last click wins because every landing
// overwrites it). The body field is a fallback for cookie-blocking visitors.
export function refCodeFromRequest(req: NextRequest, body: { refCode?: unknown } | null): string | null {
  return normalizeRefCode(req.cookies.get(REF_COOKIE)?.value) || normalizeRefCode(body?.refCode);
}

export function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}

export function hashIp(ip: string | null): string | null {
  return ip ? crypto.createHash('sha256').update(ip).digest('hex') : null;
}

// Admin endpoints share one bearer token. Constant-time compare.
export function isAdmin(req: NextRequest): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---------- promoters ---------- */

/** Returns the code only if the promoter exists and is active. */
export async function resolvePromoterCode(code: string | null): Promise<string | null> {
  const db = getDb();
  if (!db || !code) return null;
  const snap = await db.collection('promoters').doc(code).get();
  return snap.exists && snap.get('active') !== false ? code : null;
}

/* ---------- leads ---------- */

export interface NewLead {
  referenceId: string;
  service: string;
  client: { contactName?: string; businessName?: string; email?: string; industry?: string };
  answers: Answers;
  scoring: { rawScore?: number; recommendedTier?: string; tierDetails?: { name?: string } };
}

export interface RecordResult {
  refCode: string | null;
  verified: boolean;       // false when there was no database to check against
  flagged: boolean;
  flagReason: string | null;
  stored: boolean;
}

async function findDuplicate(email: string | undefined, ipHash: string | null): Promise<{ referenceId: string; reason: string } | null> {
  const db = getDb();
  if (!db) return null;
  const cutoff = Timestamp.fromMillis(Date.now() - DEDUPE_WINDOW_MINUTES * 60_000);
  const leads = db.collection('leads');

  if (email) {
    const byEmail = await leads
      .where('emailLower', '==', email.trim().toLowerCase())
      .where('createdAt', '>', cutoff)
      .limit(1).get();
    if (!byEmail.empty) return { referenceId: byEmail.docs[0].id, reason: 'duplicate_email' };
  }
  if (ipHash) {
    const byIp = await leads
      .where('ipHash', '==', ipHash)
      .where('createdAt', '>', cutoff)
      .limit(1).get();
    if (!byIp.empty) return { referenceId: byIp.docs[0].id, reason: 'duplicate_ip' };
  }
  return null;
}

/**
 * Writes the lead and works out attribution + abuse flags. Never throws: the
 * email is still the team's primary record and must go out regardless.
 */
export async function recordLead(req: NextRequest, payload: NewLead): Promise<RecordResult> {
  const result: RecordResult = { refCode: null, verified: false, flagged: false, flagReason: null, stored: false };
  const db = getDb();
  const requested = refCodeFromRequest(req, payload as { refCode?: unknown });

  if (!db) {
    // No database: surface the raw code so the team can attribute by hand.
    result.refCode = requested;
    return result;
  }

  try {
    result.refCode = await resolvePromoterCode(requested);
    result.verified = true;

    const ipHash = hashIp(clientIp(req));
    const dupe = await findDuplicate(payload.client.email, ipHash);
    if (dupe) {
      result.flagged = true;
      result.flagReason = `${dupe.reason} of ${dupe.referenceId}`;
    }

    const { client, scoring } = payload;
    await db.collection('leads').doc(payload.referenceId).create({
      service: payload.service,
      contactName: client.contactName || null,
      businessName: client.businessName || null,
      email: client.email || null,
      emailLower: client.email ? client.email.trim().toLowerCase() : null,
      industry: client.industry || null,
      rawScore: scoring?.rawScore ?? null,
      recommendedTier: scoring?.tierDetails?.name || scoring?.recommendedTier || null,
      answers: payload.answers,
      refCode: result.refCode,
      ipHash,
      flagged: result.flagged,
      flagReason: result.flagReason,
      bookedAt: null,
      attendedAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    result.stored = true;
  } catch (err: unknown) {
    // ALREADY_EXISTS = same reference id posted twice; treat as a no-op.
    if ((err as { code?: number }).code !== 6) console.error('Lead persistence error (continuing to email):', err);
  }
  return result;
}

/** Sets bookedAt once. Returns the lead's refCode so the email can mention it. */
export async function markBooked(referenceId: string | undefined): Promise<string | null> {
  const db = getDb();
  if (!db || !referenceId) return null;
  try {
    const ref = db.collection('leads').doc(referenceId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    if (!snap.get('bookedAt')) await ref.update({ bookedAt: FieldValue.serverTimestamp() });
    return snap.get('refCode') ?? null;
  } catch (err) {
    console.error('Booking update error (continuing to email):', err);
    return null;
  }
}

/* ---------- admin ---------- */

export interface Counts { leads: number; booked: number; attended: number; flagged: number }
export interface PromoterSummary extends Promoter, Counts {}

export interface Summary {
  promoters: PromoterSummary[];
  organic: Counts;
  leads: Lead[];
}

const emptyCounts = (): Counts => ({ leads: 0, booked: 0, attended: 0, flagged: 0 });

function tally(c: Counts, l: Lead) {
  if (l.flagged) { c.flagged++; return; }
  c.leads++;
  if (l.bookedAt) c.booked++;
  if (l.attendedAt) c.attended++;
}

export async function loadSummary(): Promise<Summary> {
  const db = getDb();
  if (!db) throw new Error('Database is not configured');

  const [promoterSnap, leadSnap] = await Promise.all([
    db.collection('promoters').orderBy('createdAt', 'asc').get(),
    db.collection('leads').orderBy('createdAt', 'desc').get(),
  ]);

  const leads = leadSnap.docs.map((d) => toLead(d.id, d.data()));
  const byCode = new Map<string, PromoterSummary>();
  promoterSnap.docs.forEach((d) => byCode.set(d.id, { ...toPromoter(d.id, d.data()), ...emptyCounts() }));
  const organic = emptyCounts();

  for (const l of leads) {
    const p = l.refCode ? byCode.get(l.refCode) : undefined;
    tally(p ?? organic, l);
  }

  return { promoters: [...byCode.values()], organic, leads: leads.slice(0, 500) };
}

export interface LeadPatch { attended?: boolean; booked?: boolean; flagged?: boolean }

export async function updateLead(referenceId: string, patch: LeadPatch): Promise<Lead | null> {
  const db = getDb();
  if (!db) throw new Error('Database is not configured');
  const ref = db.collection('leads').doc(referenceId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const update: DocumentData = {};
  if (typeof patch.attended === 'boolean') {
    update.attendedAt = patch.attended ? (snap.get('attendedAt') ?? FieldValue.serverTimestamp()) : null;
  }
  if (typeof patch.booked === 'boolean') {
    update.bookedAt = patch.booked ? (snap.get('bookedAt') ?? FieldValue.serverTimestamp()) : null;
  }
  if (typeof patch.flagged === 'boolean') {
    update.flagged = patch.flagged;
    if (!patch.flagged) update.flagReason = null;
  }
  await ref.update(update);
  const fresh = await ref.get();
  return toLead(fresh.id, fresh.data()!);
}
