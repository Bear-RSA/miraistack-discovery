import { NextResponse } from 'next/server';
import { getFirebaseStatus } from '@/lib/firebase';

// GET /api/health
// Plain yes/no view of the server's configuration so a broken deploy can be
// diagnosed by eye. Reports presence and shape only, never values.
export const dynamic = 'force-dynamic';

export async function GET() {
  const firebase = getFirebaseStatus();
  let firestoreReachable: boolean | null = null;
  let firestoreError: string | null = null;

  if (firebase.configured) {
    try {
      const { getDb } = await import('@/lib/firebase');
      await getDb()!.collection('promoters').limit(1).get();
      firestoreReachable = true;
    } catch (err) {
      firestoreReachable = false;
      firestoreError = (err as Error).message;
    }
  }

  const ok = firebase.configured && firestoreReachable === true && !!process.env.RESEND_API_KEY && !!process.env.ADMIN_TOKEN;

  return NextResponse.json({
    ok,
    firebase: {
      configured: firebase.configured,
      source: firebase.source,          // env | emulator | file | none
      projectId: firebase.projectId,
      reachable: firestoreReachable,     // true = a real read succeeded
      error: firebase.error ?? firestoreError,
    },
    resendKeyPresent: !!process.env.RESEND_API_KEY,
    adminTokenPresent: !!process.env.ADMIN_TOKEN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
  }, { status: ok ? 200 : 503 });
}
