import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
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

function init(): App | null {
  if (getApps().length) return getApps()[0];

  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) {
    const sa = JSON.parse(inline);
    return initializeApp({ credential: cert(sa), projectId: sa.project_id });
  }

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-miraistack' });
  }

  if (fs.existsSync(LOCAL_KEY_FILE)) {
    const sa = JSON.parse(fs.readFileSync(LOCAL_KEY_FILE, 'utf8'));
    return initializeApp({ credential: cert(sa), projectId: sa.project_id });
  }

  return null;
}

export function getDb(): Firestore | null {
  if (app === undefined) {
    try { app = init(); } catch (err) { console.error('Firebase init failed:', err); app = null; }
  }
  return app ? getFirestore(app) : null;
}
