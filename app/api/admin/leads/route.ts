import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, updateLead, type LeadPatch } from '@/lib/referral';
import { getDb } from '@/lib/firebase';

// PATCH /api/admin/leads  { referenceId, attended?, booked?, flagged? }
// Manual overrides: mark attended (the payout trigger), record an off-site
// booking, or clear a false-positive duplicate flag.
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!getDb()) {
    return NextResponse.json({ success: false, error: 'Firebase is not configured' }, { status: 503 });
  }

  let body: { referenceId?: string } & LeadPatch;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.referenceId !== 'string' || !body.referenceId) {
    return NextResponse.json({ success: false, error: 'Invalid lead reference' }, { status: 400 });
  }
  const patch: LeadPatch = {};
  for (const k of ['attended', 'booked', 'flagged'] as const) {
    if (typeof body[k] === 'boolean') patch[k] = body[k];
  }
  if (!Object.keys(patch).length) {
    return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
  }

  try {
    const lead = await updateLead(body.referenceId, patch);
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    return NextResponse.json({ success: true, lead });
  } catch (err) {
    console.error('Admin lead update error:', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
