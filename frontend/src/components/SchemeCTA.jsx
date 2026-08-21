import React from 'react';
import { BadgeCheck, ExternalLink, IndianRupee, Zap } from 'lucide-react';

/**
 * PM Surya Ghar: Muft Bijli Yojana CTA.
 *
 * Shared by the Homepage and the Quote page so the subsidy figures live in one
 * place. Figures match the Government Notes panel already shown on the On-Grid
 * quotation form (RemainingPages.jsx) — keep the two in step if slabs change.
 */
const SUBSIDY_SLABS = [
  { capacity: '1 kW', amount: '₹30,000' },
  { capacity: '2 kW', amount: '₹60,000' },
  { capacity: '3 kW & above', amount: '₹78,000' },
];

/* Both deep-link into the scheme's myScheme listing — eligibility criteria and
   the full scheme detail respectively. Shared by the Homepage and Quote page. */
const ELIGIBILITY_URL = 'https://www.myscheme.gov.in/schemes/pmsgmb#eligibility';
const DETAILS_URL = 'https://www.myscheme.gov.in/schemes/pmsgmb#details';

export default function SchemeCTA({ className = '' }) {
  return (
    <div
      className={`scheme-cta relative overflow-hidden rounded-2xl px-7 py-9 md:px-12 md:py-12 ${className}`}
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid rgba(226,229,234,0.9)',
        boxShadow: 'var(--elev-3), var(--ring-gold), var(--bevel-light)',
      }}
    >
      <style>{`
        /* Phase 2 — this card was navy (#0A2540 → #12365C). Light now, built from
           the same surface tokens as the rest of the light sections rather than a
           bespoke gradient.

           Every foreground colour was re-derived rather than inverted. The two
           traps on a light card:
             · brand gold #F5A623 is 2.03:1 on white — it fails AA for normal
               text AND the 3:1 large-text threshold, so no readable text is left
               in it. Labels and the ₹ amounts use --color-primary-text (#9C6509,
               4.91:1); gold survives only on icons, borders and the primary
               button's fill, where contrast rules do not apply.
             · the primary button was gold-on-navy and inverted to a transparent
               fill on hover. On a light card that hover state became gold text on
               near-white — 2.03:1. It now darkens to navy on hover instead, so
               both states stay legible. */
        .scheme-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 50% 70% at 88% 10%, rgba(245,166,35,0.10) 0%, transparent 62%),
            radial-gradient(ellipse 40% 60% at 5% 95%, rgba(30,158,99,0.07) 0%, transparent 60%);
          pointer-events: none;
        }
        .scheme-cta > * { position: relative; }
        .scheme-slab {
          background: var(--surface-sunken);
          border: 1px solid rgba(245,166,35,0.30);
          box-shadow: var(--bevel-light);
          transition: background .25s ease, border-color .25s ease, transform .25s ease,
                      box-shadow .25s ease;
        }
        .scheme-slab:hover {
          border-color: rgba(245,166,35,0.60);
          transform: translateY(-2px);
          box-shadow: var(--elev-1), var(--bevel-light);
        }
        .scheme-portal-btn {
          background: linear-gradient(135deg, #F5A623 0%, #FFD166 100%);
          color: #0A2540;
          box-shadow: 0 6px 22px rgba(245,166,35,0.32);
          border: 1px solid transparent;
          transition: all .3s ease;
        }
        .scheme-portal-btn:hover {
          background: var(--color-secondary, #0A2540);
          color: var(--color-primary, #F5A623);
          border-color: var(--color-secondary, #0A2540);
          transform: translateY(-2px);
          box-shadow: 0 8px 26px rgba(10,37,64,0.24);
        }
        .scheme-portal-btn:active { transform: scale(0.98); }
        /* Secondary of the pair — outlined navy so it supports the gold primary
           rather than competing with it. */
        .scheme-details-btn {
          background: #fff;
          color: var(--color-secondary, #0A2540);
          border: 1.5px solid rgba(10,37,64,0.22);
          transition: all .3s ease;
        }
        .scheme-details-btn:hover {
          background: var(--color-secondary, #0A2540);
          color: #fff;
          border-color: var(--color-secondary, #0A2540);
          transform: translateY(-2px);
        }
        .scheme-details-btn:active { transform: scale(0.98); }
        @media (prefers-reduced-motion: reduce) {
          .scheme-slab, .scheme-portal-btn, .scheme-details-btn { transition: none !important; transform: none !important; }
        }
      `}</style>

      <div className="grid lg:grid-cols-5 gap-9 lg:gap-12 items-center">
        <div className="lg:col-span-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-5 text-[11px] font-semibold tracking-wide uppercase text-eyebrow-token"
            style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.34)' }}
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            Government of India Scheme
          </span>

          <h2 className="text-2xl md:text-3xl font-bold text-secondary-token mb-4 leading-tight">
            PM Surya Ghar: Muft Bijli Yojana
          </h2>

          <p className="text-muted-token leading-relaxed mb-5 max-w-xl">
            The central subsidy scheme for residential rooftop solar. Once your system is
            installed and your discom has inspected it, the subsidy is credited straight to
            your bank account — it is not a discount you have to chase. Households can also
            receive up to 300 free units of electricity a month.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6 max-w-lg">
            {SUBSIDY_SLABS.map((slab) => (
              <div key={slab.capacity} className="scheme-slab rounded-xl px-3 py-3.5 text-center">
                <p className="text-[11px] text-muted-token mb-1">{slab.capacity}</p>
                {/* --color-primary-text, not --color-primary: these amounts are
                    16–18px, below the large-text threshold, so they need the full
                    4.5:1 and brand gold only reaches 2.03:1 on this surface. */}
                <p className="text-base md:text-lg font-bold text-eyebrow-token">
                  {slab.amount}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-token leading-relaxed max-w-xl">
            Residential rooftop systems only, using DCR-compliant panels fitted by a registered
            vendor. ₹78,000 is the maximum cap. Final amounts depend on discom verification and
            current portal policy.
          </p>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <a
            href={ELIGIBILITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="scheme-portal-btn focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-4 text-sm font-semibold"
          >
            Check Eligibility
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={DETAILS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="scheme-details-btn focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-4 text-sm font-semibold"
          >
            View Scheme Details
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-[11px] text-muted-token text-center leading-relaxed">
            Both open myscheme.gov.in — the Government of India scheme portal
          </p>

          <div className="mt-2 space-y-3">
            <div className="flex items-start gap-3">
              <IndianRupee className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
              <p className="text-xs text-muted-token leading-relaxed">
                Our estimates already show the subsidy deducted, so you see the real cost.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
              <p className="text-xs text-muted-token leading-relaxed">
                We handle the portal registration, discom application and inspection paperwork
                on your behalf.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
