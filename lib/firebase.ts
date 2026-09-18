import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/* ============================================================
   FIRESTORE (server only)
   Credentials, in order of preference:
     1. FIREBASE_SERVICE_ACCOUNT  — the service-account JSON as a string (Vercel)
     2. FIRESTORE_EMULATOR_HOST   — local emulator, no credentials needed
     3. ./firebase-service-account.json — local dev against the real project
   If none are present getDb() returns null and the site degrades to
   email-only, exactly like it did before the database existed.
=========================================================== */

const LOCAL_KEY_FILE = path.join(process.cwd(), 'firebase-service-account.json');

let app: App | null | undefined;

export type CredentialSource = 'env' | 'emulator' | 'file' | 'none';

// Remembered so /api/health can say what happened without secrets.
const status: { source: CredentialSource; projectId: string | null; error: string | null } = {
  source: 'none', projectId: null, error: null,
};

function parseServiceAccount(raw: string, from: string): ServiceAccount & { project_id: string } {
  let sa: { project_id?: string; private_key?: string; client_email?: string };
  try { sa = JSON.parse(raw); } catch {
    throw new Error(`${from} is not valid JSON (got ${raw.length} chars starting "${raw.slice(0, 12).replace(/\s+/g, ' ')}…")`);
  }
  if (!sa.project_id || !sa.private_key || !sa.client_email) {
    throw new Error(`${from} parsed but is missing project_id, private_key or client_email`);
  }
  return sa as ServiceAccount & { project_id: string };
}

function init(): App | null {
  if (getApps().length) return getApps()[0];

  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) {
    const sa = parseServiceAccount(inline, 'FIREBASE_SERVICE_ACCOUNT');
    status.source = 'env'; status.projectId = sa.project_id;
    return initializeApp({ credential: cert(sa), projectId: sa.project_id });
  }

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    status.source = 'emulator'; status.projectId = process.env.FIREBASE_PROJECT_ID || 'demo-miraistack';
    return initializeApp({ projectId: status.projectId });
  }

  if (fs.existsSync(LOCAL_KEY_FILE)) {
    const sa = parseServiceAccount(fs.readFileSync(LOCAL_KEY_FILE, 'utf8'), 'firebase-service-account.json');
    status.source = 'file'; status.projectId = sa.project_id;
    return initializeApp({ credential: cert(sa), projectId: sa.project_id });
  }

  return null;
}

export function getDb(): Firestore | null {
  if (app === undefined) {
    try { app = init(); } catch (err) {
      status.error = (err as Error).message;
      console.error('Firebase init failed:', err);
      app = null;
    }
  }
  return app ? getFirestore(app) : null;
}

/** Non-secret summary of how Firebase was (or wasn't) configured. */
export function getFirebaseStatus() {
  getDb();
  return { configured: app != null, ...status };
}
