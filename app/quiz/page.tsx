'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Page from '@/components/Page';
import Topbar from '@/components/Topbar';
import ProgressBar from '@/components/ProgressBar';
import StepStage, { type StepStageHandle } from '@/components/StepStage';
import { questionsFor, SERVICES, type Question } from '@/lib/config';
import { useDiscoveryState } from '@/lib/state';
import { prefersReducedMotion } from '@/lib/spring';

const CheckSvg = () => (
  <svg viewBox="0 0 10 10" fill="none" aria-hidden><path d="M1.5 5L4 7.5L8.5 2" stroke="#0A0A0C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

function isAnswered(step: Question, val: string | string[] | undefined): boolean {
  if (!step.required) return true;
  if (step.type === 'multi') return Array.isArray(val) && val.length > 0;
  return typeof val === 'string' && val.trim().length > 0;
}

export default function QuizPage() {
  const router = useRouter();
  const [state, update] = useDiscoveryState();
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stage = useRef<StepStageHandle>(null);
  const title = useRef<HTMLHeadingElement>(null);

  // Guard: no service picked (or enterprise / already finished) → send them where they belong.
  useEffect(() => {
    if (!state) return;
    const svc = SERVICES.find((s) => s.id === state.selectedService);
    if (!svc) { router.replace('/'); return; }
    if (svc.enterprise) { router.replace('/enterprise'); return; }
    if (state.step >= questionsFor(state.selectedService).length) router.replace('/results');
  }, [state, router]);

  const stepIndex = state?.step ?? 0;
  const stepKey = state?.selectedService ? questionsFor(state.selectedService)[stepIndex]?.key : undefined;

  // After a step change, move focus to the question so keyboard and screen-reader
  // users land on the new content. Text inputs take focus themselves via autoFocus.
  useEffect(() => {
    if (!stepKey) return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
    title.current?.focus({ preventScroll: true });
  }, [stepKey]);

  if (!state || !state.selectedService) return null;
  const steps = questionsFor(state.selectedService);
  const step = steps[state.step];
  if (!step) return null;
  const total = steps.length;
  const val = state.answers[step.key];
  const answered = isAnswered(step, val);

  function flashSaved() {
    setSaved(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(false), 1200);
  }

  function setAnswer(key: string, value: string | string[]) {
    update((s) => ({ ...s, answers: { ...s.answers, [key]: value } }));
    flashSaved();
  }

  function toggleMulti(key: string, option: string) {
    const arr = Array.isArray(val) ? [...val] : [];
    const idx = arr.indexOf(option);
    if (idx > -1) arr.splice(idx, 1); else arr.push(option);
    setAnswer(key, arr);
  }

  function go(direction: 1 | -1) {
    stage.current?.leave(direction);
    update({ step: state!.step + direction });
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  function next() {
    if (!answered) return;
    if (state!.step < total - 1) go(1);
    else { update({ step: total }); router.push('/results'); }
  }

  const minutesLeft = Math.max(1, Math.round((total - state.step) * 0.4));

  return (
    <Page>
      <Topbar>
        <div className={`autosave ${saved ? 'show' : ''}`} role="status" aria-live="polite"><span className="autosave-dot" />Saved</div>
      </Topbar>

      <div className="progress-shell">
        <div className="progress-meta">
          <span>Step {state.step + 1} of {total}</span>
          <span>~{minutesLeft} min left</span>
        </div>
        <ProgressBar value={state.step / total} label={`Step ${state.step + 1} of ${total}`} />
      </div>

      <form className="q-wrap" onSubmit={(e) => { e.preventDefault(); next(); }}>
        <StepStage ref={stage} stepKey={step.key}>
          <div className="section-tag label">{step.section}</div>
          <h1 className="q-title display-m" ref={title} tabIndex={-1} style={{ outline: 'none' }}>{step.title}</h1>
          {step.help && <p className="q-help body">{step.help}</p>}

          {step.type === 'text' && (
            <input
              key={step.key}
              className="field"
              type={step.key === 'email' ? 'email' : 'text'}
              autoComplete={step.key === 'email' ? 'email' : step.key === 'contactName' ? 'name' : step.key === 'businessName' ? 'organization' : 'off'}
              enterKeyHint="next"
              placeholder={step.placeholder || ''}
              value={typeof val === 'string' ? val : ''}
              onChange={(e) => setAnswer(step.key, e.target.value)}
              autoFocus
            />
          )}

          {step.type === 'textarea' && (
            <textarea
              key={step.key}
              className="field"
              placeholder={step.placeholder || ''}
              value={typeof val === 'string' ? val : ''}
              onChange={(e) => setAnswer(step.key, e.target.value)}
            />
          )}

          {(step.type === 'single' || step.type === 'multi') && (
            <div className="opt-grid" role={step.type === 'single' ? 'radiogroup' : 'group'} aria-label={step.title}>
              {step.options!.map((o) => {
                const selected = step.type === 'single' ? val === o : Array.isArray(val) && val.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    className="opt"
                    role={step.type === 'single' ? 'radio' : 'checkbox'}
                    aria-checked={selected}
                    onClick={() => { if (step.type === 'single') setAnswer(step.key, o); else toggleMulti(step.key, o); }}
                  >
                    <span className={`opt-check ${step.type === 'single' ? 'opt-radio' : ''}`}><CheckSvg /></span>{o}
                  </button>
                );
              })}
            </div>
          )}

          <div className="nav-row">
            <button type="button" className="btn btn-ghost" onClick={() => go(-1)} disabled={state.step === 0}>Back</button>
            <button type="submit" className="btn btn-primary" disabled={!answered}>
              {state.step === total - 1 ? 'See my results' : 'Next'}
            </button>
          </div>
        </StepStage>
      </form>
    </Page>
  );
}
