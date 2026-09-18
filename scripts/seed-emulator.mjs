// Seeds the local Firestore emulator with sample promoters for development.
// Usage: npm run emulator (in one terminal), then: node scripts/seed-emulator.mjs
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
const app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-miraistack' });
const db = getFirestore(app);

const promoters = [
  { code: 'jane23', name: 'Jane Doe', email: 'jane@example.com', payoutTerms: 'Paid monthly on attended', active: true },
  { code: 'sam', name: 'Sam Promoter', email: null, payoutTerms: null, active: true },
  { code: 'bob', name: 'Bob Retired', email: null, payoutTerms: null, active: false },
];

for (const p of promoters) {
  const { code, ...rest } = p;
  await db.collection('promoters').doc(code).set({ ...rest, phone: null, payoutRate: null, createdAt: FieldValue.serverTimestamp() });
  console.log('seeded promoter', code);
}
process.exit(0);
