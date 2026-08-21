import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Gauge,
  HardHat,
  Home,
  PlugZap,
  Ruler,
  Sun,
} from 'lucide-react';

/**
 * "How We Work" — the enquiry-to-commissioning process timeline.
 *
 * Extracted from the homepage in Phase 3 and rebuilt. It was two separate
 * things that each had a concrete layout bug:
 *
 *  1. A dark panel holding a hand-coordinated <svg> of the load → capacity →
 *     estimate flow. The nodes were placed at absolute viewBox coordinates while
 *     their captions sat in a separate 3-column grid underneath, so the two were
 *     only ever approximately aligned and the panel's lower ~40% was empty. The
 *     flow is now a flex row where each node owns its own caption and the
 *     connectors are flex items between them — alignment is structural, so it
 *     cannot drift, and the panel fills.
 *
 *  2. A 4-step timeline whose connecting rail ran `left:12.5% → right:12.5%`.
 *     That is the correct geometry for markers centred in a 4-column grid (the
 *     centres land at 12.5% / 37.5% / 62.5% / 87.5%), but the markers were
 *     `md:items-start` — left-aligned — so the rail began and ended in open
 *     space and connected nothing. The markers are centred from md up now, which
 *     is what makes that geometry true, and each step became a real card so the
 *     row reads as a timeline rather than four loose captions.
 *
 * Placement: this lives on /quote. See the relocation note in that file.
 *
 * `ctaTo` is opt-in and deliberately omitted on /quote — the visitor is already
 * on the estimate form, and a "start your free estimate" button there is a
 * dead-end that points at the page it is sitting on.
 */

/* The three-node flow. Captions belong to their node rather than to a parallel
   grid, which is the whole fix for the old alignment drift. */
const FLOW_NODES = [
  { icon: <Sun className="w-6 h-6" />, kicker: 'Your load', value: 'Appliances' },
  { icon: <Gauge className="w-6 h-6" />, kicker: 'We calculate', value: 'Capacity' },
  { icon: <Home className="w-6 h-6" />, kicker: 'You receive', value: 'Estimate' },
];

/* Four steps. `outcome` is new to this rebuild and exists to fill the cards with
   something real rather than padding: each line restates what the customer ends
   up holding after that step, drawn from the step's own description. Nothing new
   is asserted — in particular no durations, because the only two timings on the
   site (the sub-minute estimate and the <48hr assessment) both carry unresolved
   "confirm with business" flags and are not repeated here as step metadata. */
const STEPS = [
  {
    step: '01',
    icon: <Calculator className="w-6 h-6" />,
    title: 'Free Quotation',
    desc: 'Use our online tool or contact us directly. We calculate your load and provide an instant estimate.',
    outcome: 'A calculated cost estimate',
  },
  {
    step: '02',
    icon: <Ruler className="w-6 h-6" />,
    title: 'Site Assessment',
    desc: 'Our engineer visits your location to assess roof structure, orientation, cable routing, and grid conditions.',
    outcome: 'A confirmed system design',
  },
  {
    step: '03',
    icon: <HardHat className="w-6 h-6" />,
    title: 'Installation',
    desc: 'Certified technicians install your system, following all structural and electrical safety standards.',
    outcome: 'A mounted, wired array',
  },
  {
    step: '04',
    icon: <PlugZap className="w-6 h-6" />,
    title: 'Commissioning',
    desc: 'We power up, test every component, and hand over documentation including warranty certificates.',
    outcome: 'Warranty certificates and handover docs',
  },
];

export default function ProcessTimeline({ className = '', ctaTo, ctaLabel }) {
  return (
    <div className={`proc ${className}`}>
      <style>{`
        /* ── Marker geometry ────────────────────────────────────────────────
           One number governs this whole block: the marker is 4rem, so its centre
           sits 2rem down. The horizontal rail is pinned at 2rem and the vertical
           mobile connectors start at 4rem. Change --proc-marker and all three
           follow; hard-code any of them separately and the rail drifts off the
           markers again, which is the bug this rebuild exists to fix. */
        .proc { --proc-marker: 4rem; }

        .proc-marker {
          width: var(--proc-marker);
          height: var(--proc-marker);
          border-radius: 1.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          color: var(--color-primary, #F5A623);
          background: linear-gradient(150deg, #143A63 0%, #0A2540 100%);
          box-shadow:
            0 2px 4px rgba(10,37,64,0.14),
            0 12px 28px -10px rgba(10,37,64,0.40),
            inset 0 1px 0 rgba(255,255,255,0.14);
          /* Ring in the page colour, not a border: it lets the rail pass behind
             the marker and stop cleanly at its edge instead of touching it. */
          outline: 6px solid var(--proc-ring, #FBFCFE);
          transition: transform .32s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow .32s ease;
        }
        .proc-step:hover .proc-marker {
          transform: translateY(-3px);
          box-shadow:
            0 2px 4px rgba(10,37,64,0.14),
            0 18px 36px -10px rgba(10,37,64,0.46),
            0 0 26px rgba(245,166,35,0.28),
            inset 0 1px 0 rgba(255,255,255,0.18);
        }

        /* ── Rails ──────────────────────────────────────────────────────────
           Horizontal from lg up, per-step vertical segments below it.

           lg and not md: four cards across a 768–1023px viewport leaves each one
           about 170px wide, which wraps "A calculated cost estimate" onto three
           lines and makes the row read as cramped. The vertical timeline is the
           better layout at tablet width, so the horizontal one waits for 1024px
           where the cards have room.

           The vertical segments are per-step rather than one full-height line
           because the rows have unequal heights, so a single line could only
           guess where the last marker is; a segment bounded by its own row is
           always right. Its bottom inset matches the grid gap below lg (gap-5). */
        .proc-rail-h {
          position: absolute;
          top: calc(var(--proc-marker) / 2);
          left: 12.5%;
          right: 12.5%;
          height: 2px;
          transform: translateY(-1px);
          border-radius: 2px;
          background: linear-gradient(90deg,
            rgba(10,37,64,0.10) 0%,
            rgba(245,166,35,0.55) 18%,
            rgba(245,166,35,0.55) 82%,
            rgba(10,37,64,0.10) 100%);
        }
        .proc-rail-v {
          position: absolute;
          left: calc(var(--proc-marker) / 2 - 1px);
          top: var(--proc-marker);
          bottom: -1.25rem; /* spans the grid gap into the next row's marker */
          width: 2px;
          border-radius: 2px;
          background: linear-gradient(180deg,
            rgba(245,166,35,0.55) 0%,
            rgba(245,166,35,0.30) 100%);
        }

        .proc-card {
          position: relative;
          overflow: hidden;
          background: var(--surface-raised, #fff);
          border: 1px solid rgba(226,229,234,0.9);
          border-radius: 1rem;
          box-shadow: var(--elev-1), var(--bevel-light);
          transition: transform .32s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow .32s ease, border-color .32s ease;
        }
        /* Gold hairline across the top edge — the accent that makes the card read
           as part of the timeline rather than a generic panel. */
        .proc-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg,
            transparent 0%, rgba(245,166,35,0.65) 50%, transparent 100%);
          opacity: 0;
          transition: opacity .32s ease;
        }
        .proc-step:hover .proc-card {
          transform: translateY(-4px);
          box-shadow: var(--elev-3), var(--bevel-light);
          border-color: rgba(245,166,35,0.34);
        }
        .proc-step:hover .proc-card::before { opacity: 1; }

        /* Ghost step number sitting behind the card copy. Big, very faint, and
           purely typographic — it fills the card's dead corner without adding
           another element that has to be read.
           Sits fully inside the card. A negative top looked like a deliberate
           bleed until it met the 1rem corner radius, at which point the digits
           were being sliced by the rounded edge and just read as clipped. */
        .proc-ghost {
          position: absolute;
          top: 0.35rem;
          right: 0.6rem;
          font-size: 3.5rem;
          line-height: 1;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: rgba(10,37,64,0.055);
          pointer-events: none;
          user-select: none;
        }

        /* ── Flow panel ─────────────────────────────────────────────────────── */
        .proc-flow {
          background: linear-gradient(150deg, #143A63 0%, #0A2540 55%, #071A2E 100%);
          box-shadow: 0 24px 60px -18px rgba(10,37,64,0.45),
                      inset 0 1px 0 rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.10);
        }
        .proc-node-icon {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary, #F5A623);
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(245,166,35,0.30);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
        }
        /* Fixed-width nodes so the captions below each icon stay centred on it.
           Narrower on phones: at 5.5rem the three nodes ate almost the whole
           panel and left the connectors about 25px each, which read as a stub
           rather than a flow. */
        .proc-node { width: 4.5rem; }
        @media (min-width: 400px) { .proc-node { width: 5.5rem; } }

        /* pt matches half the icon height (1.75rem), so the dash meets the icons'
           centre line rather than floating above or below it. */
        .proc-link {
          flex: 1 1 0%;
          min-width: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding-top: 1.75rem;
          transform: translateY(-1px);
        }
        .proc-dash {
          flex: 1;
          height: 2px;
          background-image: linear-gradient(90deg,
            rgba(245,166,35,0.75) 0 7px, transparent 7px 14px);
          background-size: 14px 2px;
          background-repeat: repeat-x;
          animation: procDash 1.05s linear infinite;
        }
        @keyframes procDash { to { background-position-x: 14px; } }

        @media (prefers-reduced-motion: reduce) {
          .proc-dash { animation: none; }
          .proc-marker, .proc-card { transition: none; }
          .proc-step:hover .proc-marker,
          .proc-step:hover .proc-card { transform: none; }
        }
      `}</style>

      {/* Intro + flow panel. Two columns from lg: the promise on the left, the
          mechanic on the right. */}
      {/* Entry follows the site-wide directional rule (see the reveal block in
          index.css): the intro is in the left column so it comes in from the
          left, the flow panel is in the right column so it comes in from the
          right, and they meet in the middle.

          The panel is the section's principal visual — this section has no
          photograph, the dark "how the estimate is calculated" plate is what
          occupies the image position — so it is what the from-the-right rule
          applies to here.

          Both host pages clip: the homepage section carries `.atmos-host`
          (overflow: hidden), which is what stops the 56px right-hand offset
          widening the document while the reveal is pending. */}
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center mb-14 md:mb-16">
        <div className="reveal-left">
          <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">
            How We Work
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-token mb-4 leading-tight">
            From enquiry to commissioning
          </h2>
          <p className="text-muted-token leading-relaxed mb-6">
            Our end-to-end process ensures your system is correctly sized, properly installed, and
            fully commissioned before we leave your site — with one named contact throughout.
          </p>
          <div className="flex items-start gap-3 mb-2">
            <BadgeCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary-token" />
            <p className="text-sm text-muted-token leading-relaxed">
              Earthing, lightning protection and surge devices are inside the scope at step 03 —
              not quoted back to you later as extras.
            </p>
          </div>
          {ctaTo && (
            <Link
              to={ctaTo}
              className="btn-primary-token focus-ring inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold mt-6"
            >
              {ctaLabel ?? 'Start With a Free Estimate'} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div
          className="proc-flow rounded-2xl px-6 py-8 md:px-9 md:py-10 reveal-right"
          style={{ '--reveal-delay': '120ms' }}
        >
          <p className="text-[11px] font-semibold tracking-wide uppercase text-white/45 mb-7">
            How the estimate is calculated
          </p>
          <div className="flex items-start">
            {FLOW_NODES.map((node, i) => (
              <React.Fragment key={node.value}>
                <div className="proc-node flex flex-col items-center text-center flex-shrink-0">
                  <div className="proc-node-icon mb-4">{node.icon}</div>
                  <p className="text-[11px] text-white/45 leading-tight">{node.kicker}</p>
                  <p className="text-sm font-semibold text-white leading-tight mt-0.5">{node.value}</p>
                </div>
                {i < FLOW_NODES.length - 1 && (
                  <div className="proc-link" aria-hidden="true">
                    <span className="proc-dash" />
                    <ChevronRight className="w-4 h-4 flex-shrink-0 text-primary-token" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-8 pt-6 flex items-start gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
            <Calculator className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary-token" />
            <p className="text-xs text-white/60 leading-relaxed">
              Sizing runs against your actual billing units and the load you really run — never
              against a subsidy ceiling or a round number that sounds right.
            </p>
          </div>
        </div>
      </div>

      {/* The timeline. `--proc-ring` is the halo colour behind each marker and
          must match the surface this component is sitting on, or the ring shows
          as a pale disc. It is set by the host, defaulting to near-white. */}
      <div className="relative">
        <div className="proc-rail-h hidden lg:block" aria-hidden="true" />
        <div className="grid lg:grid-cols-4 gap-5 lg:gap-6">
          {STEPS.map((item, i) => (
            /* Staggered rise, in step order — 01 lands first and 04 last, so
               the row assembles along the rail rather than appearing as a block.
               The reveal is on `.proc-step`, which wraps the marker AND the
               card: animating only the card would leave four markers hanging on
               an empty rail waiting for their captions.

               `reveal-up` and not a directional slide. These are four equal
               cells in a row; there is no left or right for them to belong to,
               and a sideways entry would have half of them travelling against
               the rail's own direction. */
            <div
              key={item.step}
              className="proc-step relative flex flex-row lg:flex-col items-start lg:items-center gap-5 lg:gap-0 reveal-up"
              style={{ '--reveal-delay': `${i * 120}ms` }}
            >
              {/* Vertical connector, below lg only — see the rail note above. */}
              {i < STEPS.length - 1 && (
                <span className="proc-rail-v lg:hidden" aria-hidden="true" />
              )}

              <div className="proc-marker lg:mb-7">{item.icon}</div>

              <div className="proc-card flex-1 w-full p-5 text-left lg:text-center">
                <span className="proc-ghost" aria-hidden="true">{item.step}</span>
                <p className="text-[11px] font-semibold tracking-wide uppercase text-eyebrow-token mb-2 relative">
                  Step {item.step}
                </p>
                <h3
                  className="text-base font-semibold text-secondary-token mb-2 relative"
                  style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-muted-token leading-relaxed relative">{item.desc}</p>
                <div
                  className="mt-4 pt-3.5 flex items-start gap-2 lg:justify-center relative"
                  style={{ borderTop: '1px solid rgba(226,229,234,0.9)' }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary-token" />
                  <p className="text-xs text-secondary-token font-medium leading-snug text-left">
                    {item.outcome}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
