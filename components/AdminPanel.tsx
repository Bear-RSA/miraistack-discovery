'use client';

/* ============================================================
   ADMIN: PROMOTER SUMMARY
   Thin client over /api/admin/*. The token lives in sessionStorage
   only, so closing the tab signs out.
=========================================================== */
import { useCallback, useEffect, useState } from 'react';
import Topbar from './Topbar';
import Footer from './Footer';
import type { Lead, Summary, Counts } from '@/lib/referral';

const TOKEN_KEY = 'mirai_admin_token';
type Filter = '' | 'organic' | string;

const getToken = () => { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken(), ...(init.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) throw Object.assign(new Error('Invalid token'), { unauthorized: true });
  if (!res.ok || !body.success) throw new Error(body.error || `Request failed (${res.status})`);
  return body as T;
}

export default function AdminPanel() {
  const [screen, setScreen] = useState<'loading' | 'login' | 'summary'>('loading');
  const [token, setToken] = useState('');
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('');
  const [showFlagged, setShowFlagged] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    const body = await api<Summary & { success: true }>('/api/admin/summary');
    setData(body);
  }, []);

  function logout() {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    setToken('');
    setData(null);
    setScreen('login');
  }

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try { await load(); setScreen('summary'); return; } catch { /* fall through */ }
      }
      setScreen('login');
    })();
  }, [load]);

  async function login() {
    setLoginError('');
    if (!token.trim()) { setLoginError('Token required.'); return; }
    try { sessionStorage.setItem(TOKEN_KEY, token.trim()); } catch { /* ignore */ }
    setBusy(true);
    try {
      await load();
      setScreen('summary');
    } catch (e) {
      setLoginError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(lead: Lead, field: 'attended' | 'booked' | 'flagged', value: boolean) {
    setPending(lead.referenceId + field);
    try {
      await api('/api/admin/leads', { method: 'PATCH', body: JSON.stringify({ referenceId: lead.referenceId, [field]: value }) });
      await load(); // counts changed; cheapest correct thing is a refetch
    } catch (e) {
      if ((e as { unauthorized?: boolean }).unauthorized) logout();
      else setError((e as Error).message);
    } finally {
      setPending(null);
    }
  }

  function copyLink(code: string) {
    navigator.clipboard.writeText(`${location.origin}/p/${code}`).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 1200);
    });
  }

  if (screen === 'loading') return null;

  if (screen === 'login') {
    return (
      <div className="screen">
        <Topbar />
        <div className="adm-wrap adm-wrap-narrow">
          <div className="section-tag label" style={{ marginTop: 0 }}>Internal</div>
          <div className="q-title display-m">Promoter summary</div>
          <div className="q-help body">Enter the admin token to view referral attribution.</div>
          <input
            className="field" type="password" placeholder="Admin token" autoComplete="off"
            value={token} onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') login(); }}
          />
          <div className="adm-error">{loginError}</div>
          <div className="nav-row" style={{ marginTop: 20 }}>
            <span />
            <button className="btn btn-primary" onClick={login} disabled={busy}>View summary</button>
          </div>
        </div>
        <Footer linkHref="/" linkLabel="Back to site" />
      </div>
    );
  }

  const organic: Counts = data?.organic ?? { leads: 0, booked: 0, attended: 0, flagged: 0 };
  const leads = (data?.leads ?? []).filter((l) => {
    if (filter === 'organic' && l.refCode) return false;
    if (filter && filter !== 'organic' && l.refCode !== filter) return false;
    if (!showFlagged && l.flagged) return false;
    return true;
  });

  const Toggle = ({ lead, field, value, label, title }: { lead: Lead; field: 'attended' | 'booked' | 'flagged'; value: boolean; label: string; title: string }) => (
    <td>
      <label className="adm-toggle" title={title}>
        <input type="checkbox" checked={value} disabled={pending === lead.referenceId + field} onChange={(e) => toggle(lead, field, e.target.checked)} /> {label}
      </label>
    </td>
  );

  return (
    <div className="screen">
      <Topbar>
        <div className="adm-topbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => load().catch((e) => setError(e.message))}>Refresh</button>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
        </div>
      </Topbar>

      <div className="adm-wrap">
        <div className="section-tag label" style={{ marginTop: 0 }}>Internal</div>
        <div className="q-title display-m">Promoter summary</div>
        <div className="q-help body">Leads attributed by referral link. <strong>Attended</strong> is the payout trigger and is set manually here once the consultation has taken place. Flagged leads are probable duplicates and are excluded from credited counts.</div>

        <div className="adm-error">{error}</div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr>
              <th>Promoter</th><th>Code</th>
              <th className="num">Leads</th><th className="num">Booked</th><th className="num">Attended</th><th className="num">Flagged</th>
              <th>Payout terms</th><th>Since</th>
            </tr></thead>
            <tbody>
              {!data?.promoters.length && (
                <tr><td colSpan={8} className="adm-empty">No promoters yet — add a document to the <code>promoters</code> collection in Firebase (see README).</td></tr>
              )}
              {data?.promoters.map((p) => (
                <tr key={p.code} className={`clickable ${filter === p.code ? 'selected' : ''} ${p.active ? '' : 'inactive'}`} onClick={() => setFilter(filter === p.code ? '' : p.code)}>
                  <td>
                    <div>{p.name} {!p.active && <span className="adm-badge">inactive</span>}</div>
                    <div className="faint">{p.email || ''}</div>
                  </td>
                  <td>
                    <span className="adm-code">{p.code}</span>
                    <button className="adm-link-btn" onClick={(e) => { e.stopPropagation(); copyLink(p.code); }}>{copied === p.code ? 'Copied' : 'Copy link'}</button>
                  </td>
                  <td className="num">{p.leads}</td>
                  <td className="num">{p.booked}</td>
                  <td className="num"><strong>{p.attended}</strong></td>
                  <td className={`num ${p.flagged ? '' : 'faint'}`}>{p.flagged}</td>
                  <td className="dim">{p.payoutTerms || '—'}</td>
                  <td className="faint">{fmtDate(p.createdAt)}</td>
                </tr>
              ))}
              <tr className={`clickable ${filter === 'organic' ? 'selected' : ''}`} onClick={() => setFilter(filter === 'organic' ? '' : 'organic')}>
                <td><div>Organic / direct</div><div className="faint">No referral code</div></td>
                <td className="faint">—</td>
                <td className="num">{organic.leads}</td>
                <td className="num">{organic.booked}</td>
                <td className="num"><strong>{organic.attended}</strong></td>
                <td className={`num ${organic.flagged ? '' : 'faint'}`}>{organic.flagged}</td>
                <td className="faint">—</td>
                <td className="faint">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ent-section-title">Recent leads</div>
        <div className="adm-filter-row">
          <select className="field adm-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All promoters</option>
            <option value="organic">Organic / direct</option>
            {data?.promoters.map((p) => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)}
          </select>
          <label className="adm-check"><input type="checkbox" checked={showFlagged} onChange={(e) => setShowFlagged(e.target.checked)} /> Show flagged</label>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr>
              <th>Ref</th><th>Contact</th><th>Email</th><th>Service</th><th>Promoter</th><th>Status</th>
              <th></th><th></th><th></th><th>Submitted</th>
            </tr></thead>
            <tbody>
              {!leads.length && <tr><td colSpan={10} className="adm-empty">No leads match this filter.</td></tr>}
              {leads.map((l) => (
                <tr key={l.referenceId}>
                  <td className="faint mono">{l.referenceId}</td>
                  <td><div>{l.contactName || '—'}</div><div className="faint">{l.businessName || ''}</div></td>
                  <td className="dim">{l.email || '—'}</td>
                  <td className="dim">{l.service}{l.recommendedTier ? ` · ${l.recommendedTier}` : ''}</td>
                  <td>{l.refCode ? <span className="adm-code">{l.refCode}</span> : <span className="faint">organic</span>}</td>
                  <td>{l.flagged
                    ? <span className="adm-badge adm-badge-warn" title={l.flagReason || ''}>flagged</span>
                    : <span className="adm-badge adm-badge-ok">ok</span>}</td>
                  <Toggle lead={l} field="booked" value={!!l.bookedAt} label="Booked" title={l.bookedAt ? 'Booked ' + fmtDate(l.bookedAt) : 'Not booked'} />
                  <Toggle lead={l} field="attended" value={!!l.attendedAt} label="Attended" title={l.attendedAt ? 'Attended ' + fmtDate(l.attendedAt) : 'Not attended'} />
                  <Toggle lead={l} field="flagged" value={l.flagged} label="Flag" title="Untick to credit a false-positive duplicate" />
                  <td className="faint">{fmtDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer linkHref="/" linkLabel="Back to site" />
    </div>
  );
}
