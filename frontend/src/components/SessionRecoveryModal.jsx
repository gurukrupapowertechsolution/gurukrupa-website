import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, Sparkles, FileText, Calculator } from 'lucide-react';

/**
 * "Welcome back — resume, or start fresh?"
 *
 * Shown when a visitor returns to /quote or /roi-calculator after leaving the
 * journey for an unrelated page. It is the only thing standing between a parked
 * session and the visitor's data, so two rules shape it:
 *
 *   · Escape and a backdrop click resolve to RESUME, not to dismiss. The two
 *     outcomes here are not symmetrical — one restores work and the other
 *     destroys it — and a stray keypress must never be able to take the
 *     destructive branch. Starting fresh costs one deliberate click, which is
 *     the right price for it.
 *
 *   · There is no third exit. Closing without choosing would leave the page in
 *     a state where the form is empty but the stored draft still holds the old
 *     answers, and the first keystroke would overwrite them anyway. An option
 *     that silently means "start new" is worse than one that says so.
 *
 * Styling is self-contained rather than borrowed from either host page:
 * /quote's .modal-glass lives inside its own GlobalStyles block and
 * /roi-calculator has no modal styling at all, so a shared component that
 * depended on the host would render unstyled on one of the two pages.
 *
 * ── Why this one is portalled and the page's other modals are not ──────────
 * Both host pages render inside <main className="page-scale">, which carries
 * `zoom: 0.93`. A zoomed ancestor becomes the containing block for fixed
 * descendants, so `fixed inset-0` inside it resolves to 93% of the viewport and
 * leaves a live strip along the right and bottom edges. The three lead-flow
 * modals on /quote have always had that, and it is survivable there because
 * they are dismissible by design.
 *
 * This one is not. It stands between the visitor and their data, it has to
 * paint over the fixed site header, and a gap at the edge is a hole through
 * which the page underneath can be clicked while the question is unanswered.
 * Portalling to document.body puts it outside the zoom entirely.
 */
export default function SessionRecoveryModal({ open, summary, onResume, onStartNew }) {
  const resumeRef = useRef(null);

  /* Escape resolves to resume — see the note above. Scroll is locked because
     the page behind this is a form the visitor must not be able to start typing
     into before they have said which set of answers they want. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onResume();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onResume]);

  useEffect(() => {
    if (open && resumeRef.current) resumeRef.current.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="gk-recovery-root fixed inset-0 z-[120] flex items-center justify-center p-4">
      <style>{`
        .gk-recovery-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(6, 16, 30, 0.62);
          backdrop-filter: blur(10px) saturate(140%);
          -webkit-backdrop-filter: blur(10px) saturate(140%);
          animation: gkRecoveryFade 220ms ease both;
        }
        @keyframes gkRecoveryFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* The card. Same machined vocabulary as the hero indicator and the nav
           discs: a top-lit surface, a real double edge, a layered cast shadow,
           and one warm ring so it reads as belonging to this brand rather than
           as a generic system dialog. */
        .gk-recovery-card {
          position: relative;
          width: 100%;
          max-width: 30rem;
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
          animation: gkRecoveryPop 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes gkRecoveryPop {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .gk-recovery-backdrop, .gk-recovery-card { animation: none; }
        }

        /* Gold hairline across the top edge, fading at both ends — the same
           detail the site header carries along its bottom. */
        .gk-recovery-card::before {
          content: '';
          position: absolute;
          left: 1.25rem; right: 1.25rem; top: 0;
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(245, 166, 35, 0.75) 50%,
            transparent 100%);
          pointer-events: none;
        }

        .gk-recovery-badge {
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

        /* What is actually being offered back. A prompt that says only "resume
           your previous session" asks the visitor to remember what that was;
           naming the system type and the estimate lets them recognise it. */
        .gk-recovery-summary {
          border-radius: 0.85rem;
          padding: 0.85rem 1rem;
          background: linear-gradient(163deg, #FFFDF7 0%, #FEF8EA 100%);
          border: 1px solid rgba(245, 166, 35, 0.30);
        }
        .gk-recovery-summary-row {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-size: 0.8125rem;
          color: #0A2540;
        }
        .gk-recovery-summary-row + .gk-recovery-summary-row { margin-top: 0.45rem; }

        .gk-recovery-btn {
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
        .gk-recovery-btn-primary {
          background: linear-gradient(180deg, #FFC85A 0%, #F5A623 52%, #E2900E 100%);
          border: 1px solid #D9880A;
          color: #0A2540;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.6),
            0 6px 20px rgba(245, 166, 35, 0.38);
        }
        .gk-recovery-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.6),
            0 10px 28px rgba(245, 166, 35, 0.48);
        }
        .gk-recovery-btn-ghost {
          background: rgba(10, 37, 64, 0.04);
          border: 1px solid rgba(10, 37, 64, 0.16);
          color: #0A2540;
        }
        .gk-recovery-btn-ghost:hover {
          background: rgba(10, 37, 64, 0.08);
          border-color: rgba(10, 37, 64, 0.28);
          transform: translateY(-1px);
        }
        .gk-recovery-btn:active { transform: scale(0.98); }
        @media (prefers-reduced-motion: reduce) {
          .gk-recovery-btn { transition: none; }
          .gk-recovery-btn:hover, .gk-recovery-btn:active { transform: none; }
        }
        .gk-recovery-focus:focus-visible {
          outline: 2.5px solid #F5A623;
          outline-offset: 2px;
        }
      `}</style>

      <div className="gk-recovery-backdrop" onClick={onResume} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gk-recovery-title"
        aria-describedby="gk-recovery-desc"
        className="gk-recovery-card"
      >
        <div className="flex items-start gap-3.5 mb-4">
          <span className="gk-recovery-badge flex-shrink-0" aria-hidden="true">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h2
              id="gk-recovery-title"
              className="text-lg font-bold leading-snug"
              style={{ color: '#0A2540' }}
            >
              Welcome back — pick up where you left off?
            </h2>
            <p
              id="gk-recovery-desc"
              className="text-sm leading-relaxed mt-1.5"
              style={{ color: '#5A6270' }}
            >
              We still have the answers you gave us earlier in this visit. Resume
              them, or clear everything and start a fresh quotation.
            </p>
          </div>
        </div>

        {summary && summary.length > 0 && (
          <div className="gk-recovery-summary mb-5">
            {summary.map((row) => (
              <p key={row.label} className="gk-recovery-summary-row">
                {row.icon === 'calculator' ? (
                  <Calculator className="w-4 h-4 flex-shrink-0" style={{ color: '#9C6509' }} />
                ) : (
                  <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#9C6509' }} />
                )}
                <span style={{ color: '#5A6270' }}>{row.label}</span>
                <span className="ml-auto font-semibold">{row.value}</span>
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            ref={resumeRef}
            type="button"
            onClick={onResume}
            className="gk-recovery-btn gk-recovery-btn-primary gk-recovery-focus"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Resume my quotation
          </button>
          <button
            type="button"
            onClick={onStartNew}
            className="gk-recovery-btn gk-recovery-btn-ghost gk-recovery-focus"
          >
            Start a new one
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
