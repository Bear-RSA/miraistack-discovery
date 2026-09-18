'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import Page from '@/components/Page';
import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import { EMPTY_STATE, saveState } from '@/lib/state';

// Enterprise intake. Same as the original: the form is a visual placeholder
// and does not submit anywhere yet.
const Field = ({ label, textarea, full }: { label: string; textarea?: boolean; full?: boolean }) => {
  const id = useId();
  return (
    <div className="ent-field" style={full ? { gridColumn: '1/-1' } : undefined}>
      <label htmlFor={id}>{label}</label>
      {textarea ? <textarea id={id} className="field" style={{ minHeight: 70 }} /> : <input id={id} className="field" />}
    </div>
  );
};

export default function EnterprisePage() {
  const router = useRouter();
  // Inline status instead of alert(): feedback stays in the page and never blocks it.
  const [note, setNote] = useState<string | null>(null);

  function cancel() {
    saveState(EMPTY_STATE);
    router.push('/');
  }

  return (
    <Page>
      <Topbar />
      <form className="ent-wrap" onSubmit={(e) => { e.preventDefault(); setNote('Enterprise submissions aren’t live in this preview yet. Email hello@miraistack.co.za and we’ll take it from there.'); }}>
        <div className="section-tag label" style={{ marginTop: 0 }}>Enterprise intake</div>
        <h1 className="q-title display-l">Let&apos;s scope this properly.</h1>
        <p className="q-help body">Enterprise engagements skip the standard questionnaire — a member of our team reviews every submission personally.</p>

        <h2 className="ent-section-title">Organisation</h2>
        <div className="ent-grid">
          <Field label="Company name" /><Field label="Registration number" />
          <Field label="Tax number" /><Field label="Industry" />
          <Field label="Annual revenue" /><Field label="Number of employees" />
          <Field label="Countries operating in" full />
        </div>

        <h2 className="ent-section-title">Current environment</h2>
        <div className="ent-grid">
          <Field label="Existing systems" textarea full />
          <Field label="Current technology stack" textarea full />
          <Field label="Current vendors" full />
          <Field label="Current challenges" textarea full />
        </div>

        <h2 className="ent-section-title">Project scope</h2>
        <div className="ent-grid">
          <Field label="Project objectives" textarea full />
          <Field label="Expected outcomes" textarea full />
          <Field label="Security requirements" /><Field label="Compliance requirements" />
          <Field label="Required integrations" full />
          <Field label="Preferred timeline" /><Field label="Project budget" />
        </div>

        <h2 className="ent-section-title">Contacts</h2>
        <div className="ent-grid">
          <Field label="Primary decision maker" /><Field label="Technical contact" />
          <Field label="Business contact" full />
        </div>

        <h2 className="ent-section-title">Supporting documents</h2>
        <button type="button" className="upload-box" onClick={() => setNote('File uploads are disabled in this preview.')}>
          Requirements · Architecture · PDF · Excel · Word · PowerPoint · Infrastructure diagrams
        </button>

        <p className="status-note caption" role="status" aria-live="polite">{note}</p>

        <div className="nav-row">
          <button type="button" className="btn btn-ghost" onClick={cancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">Submit for review</button>
        </div>
      </form>
      <Footer />
    </Page>
  );
}
