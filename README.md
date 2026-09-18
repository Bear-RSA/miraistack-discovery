# Mirai Stack Discovery

The project discovery questionnaire, rebuilt on Next.js (App Router, TypeScript) with Firestore for lead and referral tracking and Resend for email.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without any environment variables the site works in email-only mode: leads are logged to the terminal instead of emailed, and nothing is stored.

To run with a local Firestore (no Firebase account needed), open two terminals:

```bash
npm run emulator          # Firestore emulator on 127.0.0.1:8080, UI on http://127.0.0.1:4000
node scripts/seed-emulator.mjs   # optional: adds three sample promoters
```

```bash
npm run dev:emulator      # Next.js pointed at the emulator
```

Set `ADMIN_TOKEN` in `.env.local` to sign in at http://localhost:3000/admin.

## Environment variables

See `.env.example`.

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Sends the team emails. Without it, emails are logged to the console. |
| `FIREBASE_SERVICE_ACCOUNT` | The service account JSON, as a single line. Enables lead storage and referral tracking. |
| `ADMIN_TOKEN` | Password for `/admin` and `/api/admin/*`. Generate with `openssl rand -hex 32`. |

For local development against the real Firebase project you can instead save the downloaded key as `firebase-service-account.json` in the project root. It is gitignored.

## Firebase setup (one time)

1. Firebase console, then Project settings, then Service accounts, then "Generate new private key". Keep the JSON file private.
2. Install the CLI if needed (`npm i -g firebase-tools`), then `firebase login` and `firebase use <your-project-id>`.
3. Deploy the security rules and the two indexes the duplicate check needs:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
   The rules deny all client access. Only the server (Admin SDK) talks to Firestore.
4. In Vercel, add `FIREBASE_SERVICE_ACCOUNT` (paste the whole JSON on one line), `ADMIN_TOKEN` and `RESEND_API_KEY`, then redeploy.

## Data model

Two collections.

`promoters/{code}` — one document per promoter, keyed by their link code (lowercase, `a-z 0-9 _ -`, 2 to 32 chars).

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `email`, `phone` | string or null | |
| `payoutRate` | number or null | ZAR per attended consultation. Reserved, not used in any view yet. |
| `payoutTerms` | string or null | Free text, shown in the admin table. |
| `active` | boolean | `false` stops new attribution but keeps history. |
| `createdAt` | timestamp | |

`leads/{referenceId}` — one document per questionnaire submission, keyed by the `MS-XXXXXX` reference shown to the visitor.

| Field | Notes |
|---|---|
| `service`, `contactName`, `businessName`, `email`, `emailLower`, `industry` | From the form. `emailLower` exists for the duplicate check. |
| `rawScore`, `recommendedTier`, `answers` | Scoring output and raw answers. |
| `refCode` | Promoter code, or `null` for organic. |
| `ipHash` | SHA-256 of the visitor IP. The raw IP is never stored. |
| `flagged`, `flagReason` | Probable duplicate. Still a real lead, but not credited to the promoter. |
| `bookedAt` | Set when the visitor clicks Schedule Consultation. |
| `attendedAt` | Set manually in `/admin`. This is the payout trigger. |
| `createdAt` | timestamp |

## Adding a promoter

In the Firebase console, open Firestore, the `promoters` collection, and click "Add document". Use the promoter's code as the document ID (for example `jane23`) and add the fields above. `createdAt` should be a timestamp; `active` should be `true`.

Their link is then either of:

```
https://<your-domain>/p/jane23
https://<your-domain>/?ref=jane23
```

Both set a 30-day cookie. If a visitor clicks two different promoters' links, the most recent one gets the credit.

## How attribution works

1. A visit through a promoter link stores the code in a cookie (`proxy.ts` handles `?ref=`, `app/p/[code]/route.ts` handles the short link).
2. When the questionnaire is submitted, `app/api/submit/route.ts` reads the cookie, checks the promoter exists and is active, checks for a repeat submission from the same email or IP in the last 60 minutes (flagged if so), stores the lead, and emails the team with the attribution.
3. Clicking Schedule Consultation calls `app/api/consultation/route.ts`, which sets `bookedAt`.
4. `/admin` shows leads, booked and attended per promoter. Tick Attended after the consultation happens.

## Project layout

```
app/
  page.tsx                 landing + service cards
  quiz/page.tsx            questionnaire
  results/page.tsx         recommendation + Schedule Consultation
  enterprise/page.tsx      enterprise intake (visual placeholder, does not submit yet)
  privacy/page.tsx
  admin/page.tsx           promoter summary (token protected)
  p/[code]/route.ts        short referral link
  api/submit, api/consultation, api/admin/summary, api/admin/leads
lib/
  config.ts                services, question banks, tiers
  scoring.ts               scoring engine
  state.ts                 localStorage-backed questionnaire state
  ref-cookie.ts            cookie helpers (edge-safe)
  firebase.ts              Admin SDK init
  referral.ts              Firestore data access, attribution, dedupe, admin summary
  email.ts                 Resend wrapper
components/                Topbar, Footer, ServiceCards, AdminPanel, AckModal
proxy.ts                   turns ?ref= into the cookie on any page
firestore.rules            deny-all (server only)
firestore.indexes.json     composite indexes for the duplicate check
```
