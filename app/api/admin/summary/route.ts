import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, loadSummary } from '@/lib/referral';
import { getDb } from '@/lib/firebase';

// GET /api/admin/summary — per-promoter funnel counts + recent leads.
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!getDb()) {
    return NextResponse.json({ success: false, error: 'Firebase is not configured' }, { status: 503 });
  }
  try {
    const summary = await loadSummary();
    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error('Admin summary error:', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
