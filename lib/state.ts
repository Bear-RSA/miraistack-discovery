'use client';

/* ============================================================
   CLIENT STATE
   The questionnaire lives in localStorage (same key as the old
   site) so a visitor can leave and come back mid-way.
=========================================================== */
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Answers } from './scoring';

export interface DiscoveryState {
  step: number;
  answers: Answers;
  selectedService: string | null;
  referenceId: string | null;
  submitted: boolean;
}

const KEY = 'mirai_state';

export const EMPTY_STATE: DiscoveryState = {
  step: 0, answers: {}, selectedService: null, referenceId: null, submitted: false,
};

function parse(raw: string): DiscoveryState {
  try { return raw ? { ...EMPTY_STATE, ...JSON.parse(raw) } : EMPTY_STATE; } catch { return EMPTY_STATE; }
}

export function loadState(): DiscoveryState {
  if (typeof window === 'undefined') return EMPTY_STATE;
  try { return parse(localStorage.getItem(KEY) ?? ''); } catch { return EMPTY_STATE; }
}

// Same-tab writes don't fire the `storage` event, so we notify subscribers ourselves.
const listeners = new Set<() => void>();

export function saveState(s: DiscoveryState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
  listeners.forEach((l) => l());
}

export function newReferenceId(): string {
  return 'MS-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => { listeners.delete(cb); window.removeEventListener('storage', cb); };
}
function getSnapshot(): string { try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; } }
function getServerSnapshot(): string | null { return null; }

/**
 * Returns null during server render / hydration so pages can avoid a flash of
 * the wrong screen. The updater persists synchronously, so a navigation right
 * after an update always sees the new value.
 */
export function useDiscoveryState(): [DiscoveryState | null, (patch: Partial<DiscoveryState> | ((s: DiscoveryState) => DiscoveryState)) => DiscoveryState] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const state = useMemo(() => (raw === null ? null : parse(raw)), [raw]);

  const update = useCallback((patch: Partial<DiscoveryState> | ((s: DiscoveryState) => DiscoveryState)) => {
    const current = loadState();
    const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
    saveState(next);
    return next;
  }, []);

  return [state, update];
}
