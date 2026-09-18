'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Page from '@/components/Page';
import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import AckModal from '@/components/AckModal';
import { questionsFor, SERVICES, TIER_EXPLAIN } from '@/lib/config';
import { computeScore, tierForScore } from '@/lib/scoring';
import { loadState, newReferenceId, saveState, useDiscoveryState, EMPTY_STATE } from '@/lib/state';

type ConsultStatus = 'idle' | 'sending' | 'sent' | 'error';

export default function ResultsPage() {
  const router = useRouter();
  const [state] = useDiscoveryState();
  const [ready, setReady] = useState(false);
  const [consult, setConsult] = useState<ConsultStatus>('idle');
  const [ackOpen, setAckOpen] = useState(false);
  const started = useRef(false);

  // Validate, then submit exactly once per reference id. A refresh of this
  // page (or React's dev double-effect) must not create a second lead.
  useEffect(() => {
    if (!state || started.current) return;
    const svc = SERVICES.find((s) => s.id === state.selectedService);
    if (!svc || svc.enterprise || state.step < questionsFor(state.selectedService).length) {
      router.replace(svc && !svc.enterprise ? '/quiz' : '/');
      return;
    }
    started.current = true;

    (async () => {
      const fresh = loadState(); // read-through so a second mount sees the first mount's write
      const referenceId = fresh.referenceId || newReferenceId();
      if (!fresh.referenceId) saveState({ ...fresh, referenceId });

      if (!fresh.submitted) {
        const score = computeScore(fresh.answers);
        const tier = tierForScore(score, fresh.answers);
        const a = fresh.answers;
        const payload = {
          submissionType: 'standard',
          service: fresh.selectedService,
          referenceId,
          client: {
            businessName: a.businessName || '',
            industry: a.industry || '',
            email: a.email || '',
            contactName: a.contactName || '',
          },
          answers: a,
          scoring: { rawScore: score, recommendedTier: tier.name, budgetCapped: false, tierDetails: tier },
        };
        // Mark submitted before the request so a mid-flight refresh can't double post.
        saveState({ ...loadState(), referenceId, submitted: true });
        try {
          const res = await fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) console.error('API Error:', await res.json().catch(() => ({})));
        } catch (err) {
          console.error('Submission failed, continuing gracefully...', err);
        }
      }
      setReady(true);
    })();
  }, [state, router]);

  if (!state || !state.selectedService) return null;

  const score = computeScore(state.answers);
  const tier = tierForScore(score, state.answers);
  const businessName = typeof state.answers.businessName === 'string' ? state.answers.businessName : '';

  async function requestConsultation() {
    setConsult('sending');
    const a = loadState().answers;
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: a.contactName || a.businessName, email: a.email, referenceId: loadState().referenceId }),
      });
      if (res.ok) { setConsult('sent'); setAckOpen(true); }
      else { console.error('API Error'); setConsult('error'); }
    } catch (err) {
      console.error('Fetch Error:', err);
      setConsult('error');
    }
  }

  function restart() {
    saveState(EMPTY_STATE);
    router.push('/');
  }

  return (
    <Page>
      <Topbar />
      <div className="res-wrap">
        {!ready ? (
          <div role="status" aria-live="polite">
            <div className="res-eyebrow label">Sending your answers</div>
            <h1 className="display-l">Preparing your brief…</h1>
            <div className="status-bar" aria-hidden />
          </div>
        ) : (
          <div className="materialize">
            <div className="res-check" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 12.5L9.5 18L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="res-eyebrow label">Assessment complete</div>
            <h1 className="display-l">Here&apos;s what we recommend for {businessName || 'your project'}.</h1>
            <p className="res-lede body-l">Your project aligns with our <strong>{tier.name}</strong> solution. This means {TIER_EXPLAIN[tier.name]}</p>

            <div className="tier-card">
              <div className="tier-label label">Recommended plan</div>
              <div className="tier-name display-m">{tier.name}</div>
              <div className="tier-desc body">{tier.desc}</div>
              <div className="tier-meta">
                <div className="tier-meta-item"><div className="l label">Estimated timeline</div><div className="v">{tier.timeline}</div></div>
                <div className="tier-meta-item"><div className="l label">Suggested session</div><div className="v">{tier.consult}</div></div>
              </div>
            </div>

            <div className="res-actions">
              <button type="button" className="btn btn-accent" onClick={requestConsultation} disabled={consult === 'sending' || consult === 'sent'} aria-busy={consult === 'sending'}>
                {consult === 'idle' ? 'Schedule a consultation' : consult === 'sending' ? 'Sending request…' : 'Request sent ✓'}
              </button>
            </div>
            {consult === 'error' && <p className="status-note caption" role="alert">We couldn&apos;t send that just now. Please try again.</p>}

            <div className="ref-tag">
              Reference {state.referenceId} · Submitted {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <Link href="/" className="restart-link" onClick={(e) => { e.preventDefault(); restart(); }}>Start a new assessment</Link>
          </div>
        )}
      </div>
      <Footer />
      <AckModal open={ackOpen} onClose={() => setAckOpen(false)} />
    </Page>
  );
}
