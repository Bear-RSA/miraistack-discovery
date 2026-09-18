'use client';

import { useEffect, useRef } from 'react';

export default function AckModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);

  // Escape dismisses; focus lands on the only action when the sheet opens.
  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={`modal-overlay ${open ? 'active' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ack-title"
      aria-hidden={!open}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box">
        <h2 id="ack-title" className="display-m">Request received</h2>
        <p className="body">Mirai Stack has been notified and will be in touch shortly.</p>
        <div className="modal-actions">
          <button ref={closeBtn} type="button" className="btn btn-accent" onClick={onClose} tabIndex={open ? 0 : -1}>Done</button>
        </div>
      </div>
    </div>
  );
}
