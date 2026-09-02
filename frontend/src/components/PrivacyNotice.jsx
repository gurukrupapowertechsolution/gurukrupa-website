import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

/**
 * The bottom-corner privacy notice.
 *
 * ── Why this is NOT a cookie consent banner ────────────────────────────────
 * The usual "we use cookies — Accept All / Reject" bar exists to obtain consent
 * for tracking. This site has nothing to obtain consent for: PrivacyPolicy.jsx
 * states plainly that it "runs no analytics suite, no advertising or
 * retargeting scripts, and sets no tracking cookies", and that is accurate —
 * there is no analytics package anywhere in this codebase.
 *
 * Shipping a consent gate anyway would print a false statement on every page
 * and contradict our own policy, which is a worse outcome than having no bar at
 * all. So this notice tells the truth instead, and here the truth is a selling
 * point: it says what is stored (the quotation draft, in this browser only),
 * what is not, and links to the two legal pages a visitor may want.
 *
 * If analytics or an advertising pixel is ever added, this component stops
 * being sufficient — that change needs real consent handling, and the copy
 * below plus PrivacyPolicy.jsx must be revised together.
 *
 * ── Placement ──────────────────────────────────────────────────────────────
 * Anchored bottom-LEFT on desktop rather than as a full-width band, because the
 * floating WhatsApp button owns the bottom-right corner (fixed, 3.5rem, 1.75rem
 * inset, z-index 50 — see Homepage.jsx and RemainingPages.jsx). A full-width
 * bar would cover the single most valuable control on the page. Below 640px
 * there is no room beside it, so the card goes full width and clears the button
 * vertically instead.
 *
 * z-index 110 sits above the floating buttons (50) and below the two modals
 * (120 / 130), so a session-recovery or unsaved-changes dialog still wins.
 *
 * Portalled to document.body for the same reason SessionRecoveryModal is: the
 * host pages render inside `<main className="page-scale">`, whose `zoom: 0.93`
 * makes it the containing block for fixed descendants, so `position: fixed`
 * inside it resolves against 93% of the viewport rather than the viewport.
 */

/* Versioned: bump the suffix to show the notice again after a policy change.
   A plain key would leave every returning visitor unaware it had been revised. */
const ACK_KEY = 'gk-privacy-notice-ack-v1';

/** localStorage throws outright in some privacy modes — never let that break the page. */
function readAck() {
  try {
    return window.localStorage.getItem(ACK_KEY) === '1';
  } catch {
    /* Treat unreadable storage as "already acknowledged". An undismissable bar
       on every navigation is worse than no bar. */
    return true;
  }
}

function writeAck() {
  try {
    window.localStorage.setItem(ACK_KEY, '1');
  } catch {
    /* Dismissal still works for this page view; it simply will not persist. */
  }
}

export default function PrivacyNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readAck()) return undefined;
    /* A short delay so the notice arrives after the hero has painted, rather
       than competing with it for the first impression. */
    const timer = window.setTimeout(() => setVisible(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    writeAck();
    setVisible(false);
  };

  return createPortal(
    <>
      <style>{`
        .gk-notice {
          position: fixed;
          z-index: 110;
          left: 1rem;
          right: 1rem;
          bottom: 6.25rem;      /* clears the 3.5rem WhatsApp button + 1.75rem inset */
          border-radius: 1rem;
          padding: 1.1rem 1.15rem;
          background: linear-gradient(158deg, #123A5F 0%, #0A2540 55%, #071B2E 100%);
          border: 1px solid rgba(245,166,35,0.30);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.10),
            0 2px 6px rgba(2,10,20,0.35),
            0 20px 44px -14px rgba(2,10,20,0.65);
          animation: gkNoticeIn 460ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (min-width: 640px) {
          .gk-notice {
            right: auto;
            bottom: 1.75rem;
            left: 1.75rem;
            max-width: 30rem;
          }
        }
        @keyframes gkNoticeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .gk-notice { animation: none; }
        }

        /* Gold hairline along the top edge — the same detail the hero eyebrow
           and both modals carry, so this reads as part of one system. */
        .gk-notice::before {
          content: '';
          position: absolute;
          left: 1rem; right: 1rem; top: 0;
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%, rgba(245,166,35,0.75) 50%, transparent 100%);
          pointer-events: none;
        }

        .gk-notice-link {
          color: #FFD07A;
          text-decoration: underline;
          text-underline-offset: 0.16em;
          text-decoration-thickness: 1px;
        }
        .gk-notice-link:hover { color: #FFE0A3; }

        .gk-notice-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.6rem;
          padding: 0.55rem 1.1rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: #0A2540;
          background: linear-gradient(180deg, #FFC85A 0%, #F5A623 52%, #E2900E 100%);
          border: 1px solid #D9880A;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.55), 0 4px 14px rgba(245,166,35,0.32);
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .gk-notice-btn:hover {
          transform: translateY(-1px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.55), 0 7px 20px rgba(245,166,35,0.42);
        }
        .gk-notice-close { color: rgba(255,255,255,0.55); transition: color .2s ease; }
        .gk-notice-close:hover { color: #FFFFFF; }
        @media (prefers-reduced-motion: reduce) {
          .gk-notice-btn { transition: none; }
          .gk-notice-btn:hover { transform: none; }
        }
        .gk-notice-focus:focus-visible {
          outline: 2.5px solid #F5A623;
          outline-offset: 2px;
          border-radius: 0.4rem;
        }
      `}</style>

      {/* A region, not a dialog: it is informational, it does not block the page,
          and it must not trap keyboard focus the way the two modals do. */}
      <section className="gk-notice" role="region" aria-label="Privacy and cookies notice">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 mt-0.5" style={{ color: '#F5A623' }} aria-hidden="true">
            <ShieldCheck className="w-5 h-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold mb-1" style={{ color: '#FFFFFF' }}>
              We don&rsquo;t track you.
            </p>
            <p className="text-[0.82rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.76)' }}>
              This site sets{' '}
              <strong style={{ color: 'rgba(255,255,255,0.94)' }}>no tracking cookies</strong>{' '}
              and runs no advertising scripts. Your quotation details stay in this browser until you
              choose to send them. See our{' '}
              <Link to="/privacy-policy" className="gk-notice-link gk-notice-focus" onClick={dismiss}>
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/terms-and-conditions" className="gk-notice-link gk-notice-focus" onClick={dismiss}>
                Terms &amp; Conditions
              </Link>
              .
            </p>

            <div className="mt-3">
              <button type="button" onClick={dismiss} className="gk-notice-btn gk-notice-focus">
                Got it
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss privacy notice"
            className="gk-notice-close gk-notice-focus flex-shrink-0 -mt-0.5 -mr-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </section>
    </>,
    document.body
  );
}
