/* ============================================================
   SCORING ENGINE
   Ported unchanged from the original js/app.js.
=========================================================== */
import { TIERS, type Tier } from './config';

export type Answers = Record<string, string | string[] | undefined>;

const WEIGHTS = {
  pages: (count: number) => (count >= 11 ? 30 : count >= 6 ? 15 : count > 0 ? 5 : 0),
  features: {
    'Bookings': 15, 'Online Payments': 20, 'Client Dashboard': 45, 'Member Login': 20, 'Multi-language': 20,
    'Blog / CMS': 20, 'Admin Panel': 30, 'CRM Integration': 25, 'AI Chatbot': 35, 'API Integrations': 40,
    'Analytics & SEO': 10, 'Contact Forms': 2, 'Newsletter': 3, 'Live Chat': 8, 'WhatsApp Integration': 8,
  } as Record<string, number>,
  styleAnimated: 10,
  contentGapPerItem: 3,
};

const asList = (v: string | string[] | undefined): string[] => (Array.isArray(v) ? v : []);

export function computeScore(a: Answers): number {
  let score = 0;
  score += WEIGHTS.pages(asList(a.pages).length);
  asList(a.features).forEach((f) => { score += WEIGHTS.features[f] || 0; });
  if (asList(a.style).includes('Animated')) score += WEIGHTS.styleAnimated;
  const contentGap = Math.max(0, 7 - asList(a.content).length);
  score += Math.min(20, contentGap * WEIGHTS.contentGapPerItem);
  return score;
}

export function tierForScore(score: number, answers: Answers = {}): Tier {
  let tier: Tier = TIERS.foundation;
  if (score >= 221) tier = TIERS.enterprise;
  else if (score >= 131) tier = TIERS.innovation;
  else if (score >= 61) tier = TIERS.growth;

  const budget = answers.budget;
  if (budget === 'Under R10,000' && score >= 131) {
    tier = TIERS.growth; // Cap at Growth if budget is heavily restricted
  } else if (budget === 'R10,000 – R20,000' && score >= 221) {
    tier = TIERS.innovation; // Cap at Innovation
  }
  return tier;
}
