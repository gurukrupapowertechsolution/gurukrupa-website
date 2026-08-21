import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

/**
 * "You have not calculated this estimate yet — leave anyway?"
 *
 * Shown when a visitor has filled in the quotation form but not pressed
 * Calculate Estimate, and then clicks a link that would take them off /quote.
 *
 * ── The two buttons are not symmetrical ────────────────────────────────────
 * Leaving DISCARDS the inputs; staying costs nothing. So Stay is the primary
 * button and the one that takes focus, and Escape and a backdrop click both
 * resolve to Stay — the mirror of the rule in SessionRecoveryModal, and for the
 * same reason: a stray keypress must never be able to take the destructive
 * branch. Leaving is still one plain click away, which is the right price for a
 * decision the visitor actually meant to make.
 *
 * Portalled to document.body, like SessionRecoveryModal, because both host
 * pages render inside `<main className="page-scale">` and its `zoom: 0.93`
 * makes it the containing block for fixed descendants — `fixed inset-0` inside
 * it resolves to 93% of the viewport and leaves a live strip along the right and
 * bottom edges through which the page underneath stays clickable. See the longer
 * note in SessionRecoveryModal.jsx.
 */
export default function UnsavedQuoteModal({ open, onLeave, onStay }) {
  const stayRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onStay();
        return;
      }
      // Focus trap — the only two exits from this question are its two buttons.
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll('button');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onStay]);

  useEffect(() => {
    if (open && stayRef.current) stayRef.current.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="gk-unsaved-root fixed inset-0 z-[130] flex items-center justify-center p-4">
      <style>{`
        .gk-unsaved-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(6, 16, 30, 0.62);
          backdrop-filter: blur(10px) saturate(140%);
          -webkit-backdrop-filter: blur(10px) saturate(140%);
          animation: gkUnsavedFade 200ms ease both;
        }
        @keyframes gkUnsavedFade { from { opacity: 0; } to { opacity: 1; } }

        .gk-unsaved-card {
          position: relative;
          width: 100%;
          max-width: 28rem;
          border-radius: 1.25rem;
          padding: 1.75rem;
          background: linear-gradient(163deg, #FFFFFF 0%, #FDFDFF 44%, #F6F8FD 100%);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            0 0 0 1px rgba(245, 166, 35, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.95),
            0 2px 6px rgba(10, 37, 64, 0.07),
            0 20px 44px -12px rgba(10, 37, 64, 0.24),
            0 48px 96px -24px rgba(10, 37, 64, 0.30);
          animation: gkUnsavedPop 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes gkUnsavedPop {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .gk-unsaved-backdrop, .gk-unsaved-card { animation: none; }
        }

        /* Gold hairline across the top edge — the same detail the site header
           carries along its bottom, and the recovery modal along its top. */
        .gk-unsaved-card::before {
          content: '';
          position: absolute;
          left: 1.25rem; right: 1.25rem; top: 0;
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%, rgba(245, 166, 35, 0.75) 50%, transparent 100%);
          pointer-events: none;
        }

        .gk-unsaved-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 999px;
          color: #9C6509;
          background: linear-gradient(158deg, rgba(245,166,35,0.22) 0%, rgba(245,166,35,0.08) 100%);
          border: 1px solid rgba(245, 166, 35, 0.42);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
        }

        .gk-unsaved-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          border-radius: 0.7rem;
          padding: 0.85rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          transition: background .25s ease, border-color .25s ease,
                      box-shadow .25s ease, transform .25s ease, color .25s ease;
        }
        .gk-unsaved-btn-primary {
          background: linear-gradient(180deg, #FFC85A 0%, #F5A623 52%, #E2900E 100%);
          border: 1px solid #D9880A;
          color: #0A2540;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.6),
            0 6px 20px rgba(245, 166, 35, 0.38);
        }
        .gk-unsaved-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.6),
            0 10px 28px rgba(245, 166, 35, 0.48);
        }
        .gk-unsaved-btn-ghost {
          background: rgba(10, 37, 64, 0.04);
          border: 1px solid rgba(10, 37, 64, 0.16);
          color: #0A2540;
        }
        .gk-unsaved-btn-ghost:hover {
          background: rgba(10, 37, 64, 0.08);
          border-color: rgba(10, 37, 64, 0.28);
          transform: translateY(-1px);
        }
        .gk-unsaved-btn:active { transform: scale(0.98); }
        @media (prefers-reduced-motion: reduce) {
          .gk-unsaved-btn { transition: none; }
          .gk-unsaved-btn:hover, .gk-unsaved-btn:active { transform: none; }
        }
        .gk-unsaved-focus:focus-visible {
          outline: 2.5px solid #F5A623;
          outline-offset: 2px;
        }
      `}</style>

      <div className="gk-unsaved-backdrop" onClick={onStay} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="gk-unsaved-title"
        aria-describedby="gk-unsaved-desc"
        className="gk-unsaved-card"
      >
        <div className="flex items-start gap-3.5 mb-5">
          <span className="gk-unsaved-badge flex-shrink-0" aria-hidden="true">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div>
            <h2
              id="gk-unsaved-title"
              className="text-lg font-bold leading-snug"
              style={{ color: '#0A2540' }}
            >
              Leave without your estimate?
            </h2>
            <p
              id="gk-unsaved-desc"
              className="text-sm leading-relaxed mt-1.5"
              style={{ color: '#5A6270' }}
            >
              You have unsaved estimate details. Are you sure you want to leave
              without calculating your quotation?
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            ref={stayRef}
            type="button"
            onClick={onStay}
            className="gk-unsaved-btn gk-unsaved-btn-primary gk-unsaved-focus"
          >
            No, Stay
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="gk-unsaved-btn gk-unsaved-btn-ghost gk-unsaved-focus"
          >
            Yes, Leave
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
