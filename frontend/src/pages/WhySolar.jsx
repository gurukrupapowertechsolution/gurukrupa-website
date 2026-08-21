import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CloudRain,
  Droplets,
  IndianRupee,
  Leaf,
  Sun,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { WHY_SOLAR_IMAGES, hideOnImageError } from '../data/sectionImages';

/**
 * /why-solar — the case for rooftop generation in Gujarat specifically.
 *
 * ── Phase 3 rewrite: scannable, not readable ──────────────────────────────
 *
 * The previous version was three long-form "pillars", each a lede plus two
 * dense paragraphs, alternating left/right down the page. Roughly 900 words of
 * body copy before the caveats. It was well-argued and almost nobody was going
 * to read it: a visitor on this page is deciding whether solar is worth their
 * time, and that decision gets made on numbers, not on prose.
 *
 * The rewrite keeps every fact and changes the form:
 *
 *   · a headline stat band — four figures, no sentences, above the fold
 *   · a worked 27-year example on a real 3 kW system, which is the thing the
 *     brief actually asked for and the thing the old page never did: it argued
 *     "you will save money" without ever showing the arithmetic
 *   · the three arguments as scannable cards — one claim, one number, three
 *     bullets each — replacing ~750 words with ~150
 *   · the caveats section kept close to intact. It was already scannable, and
 *     it is the section that makes the page advice rather than advertising.
 *
 * ── Every figure and where it comes from ──────────────────────────────────
 *
 * NOTHING here is newly invented. Each number is already published elsewhere on
 * this site, and the derived ones are shown with their arithmetic on the page
 * so a reader can check them rather than trust them:
 *
 *   · 4–4.5 units per kW per day — faqData.js 'generation-in-gujarat'.
 *   · ~₹60,000 per kW before subsidy — faqData.js 'cost-per-kw', and the same
 *     INDICATIVE_COST_PER_KW_RS the EMI calculator uses (lib/finance.js).
 *   · ₹78,000 subsidy ceiling, slabs ₹30k / ₹60k / ₹78k, credited after
 *     commissioning — faqData.js 'subsidy-how-much' / 'subsidy-when-paid',
 *     and components/SchemeCTA.jsx.
 *   · 95% bill offset — the documented business rule, BILL_OFFSET_PCT in
 *     lib/finance.js, and the cap in backend/services/roiCalculator.service.ts.
 *   · 27-year performance warranty, ~0.5%/yr degradation — faqData.js and
 *     TermsAndConditions.jsx.
 *   · ₹6 per unit — the backend's COST_PER_UNIT_RS, already surfaced to
 *     customers through every quotation the engine produces.
 *
 * ⚠ The subsidy slabs carry a "CONFIRM WITH BUSINESS / REVIEW PERIODICALLY"
 * note at the top of faqData.js. They are quoted here because they are already
 * quoted there; if they change, both files change together.
 *
 * ⚠ On the 27-year total in WORKED_EXAMPLE: it is deliberately NOT a simple
 * annual-saving × 27. See the note on that constant — the page shows its own
 * working, including what the figure does and does not account for.
 *
 * Deliberately absent, unchanged from the previous version: any CO₂ tonnage.
 * The environmental case is made qualitatively because no one has supplied a
 * grid emissions factor to compute it from, and a fabricated number would be
 * indistinguishable from a real one to a reader. That decision is stated on the
 * page rather than hidden.
 */

/* ── The four numbers that carry the page ─────────────────────────────────
   Above the fold, before any prose. If a visitor reads nothing else on this
   page, these are the four things worth their thirty seconds. */
const HEADLINE_STATS = [
  {
    value: '95%',
    label: 'of your bill, gone',
    note: 'What a correctly sized system removes',
    icon: <Zap className="w-5 h-5" />,
    tint: 'rgba(245,166,35,0.16)',
    color: 'var(--color-primary)',
  },
  {
    value: '4–4.5',
    label: 'units / kW / day',
    note: 'Gujarat annual average — among India’s best',
    icon: <Sun className="w-5 h-5" />,
    tint: 'rgba(245,166,35,0.16)',
    color: 'var(--color-primary)',
  },
  {
    value: '₹78,000',
    label: 'central subsidy',
    note: 'Maximum, credited after commissioning',
    icon: <IndianRupee className="w-5 h-5" />,
    tint: 'rgba(30,158,99,0.14)',
    color: '#1E9E63',
  },
  {
    value: '27 yr',
    label: 'performance warranty',
    note: 'Fading only ~0.5% a year',
    icon: <CalendarDays className="w-5 h-5" />,
    tint: 'rgba(10,37,64,0.08)',
    color: 'var(--color-secondary)',
  },
];

/* ── The worked example ───────────────────────────────────────────────────
   A real 3 kW system, every step shown. This is the section the brief asked
   for: "bold impactful digits, 90% reduction over 27 years with proper
   examples". The old page asserted the outcome; this one derives it.

   Arithmetic, all of it checkable from the constants cited in the file header:

     capacity        3 kW
     generation      3 kW × 4.2 units/kW/day × 365   ≈ 4,600 units/year
                     (4.2 is the midpoint of the published 4–4.5 band)
     gross cost      3 kW × ₹60,000                  = ₹1,80,000
     subsidy         capped                          = ₹78,000
     net cost        1,80,000 − 78,000               = ₹1,02,000
     bill today      ₹2,500/month                    = ₹30,000/year
     saved           ₹30,000 × 95%                   = ₹28,500/year
     payback         1,02,000 / 28,500               ≈ 3.6 years

   ⚠ The 27-year total is NOT 28,500 × 27 (₹7.7 lakh). Two things pull in
   opposite directions over that horizon and only one of them is quantified
   anywhere on this site: panels lose ~0.5% output a year (documented), while
   grid tariffs rise (NOT documented — no business-supplied escalation rate
   exists, and inventing one is exactly what the CO₂ note refuses to do).

   So the figure below applies ONLY the degradation, which is the conservative
   direction: 27 years at a mean output factor of ~0.93 gives roughly
   28,500 × 27 × 0.93 ≈ ₹7.15 lakh, rounded down to ₹7.1 lakh. Understating is
   the correct way to be wrong here, and the page says so in the footnote
   rather than presenting the number as precise. */
const WORKED_EXAMPLE = {
  systemKw: 3,
  monthlyBill: '₹2,500',
  steps: [
    { label: 'System size', value: '3 kW', note: 'Typical for a ₹2,500 monthly bill' },
    { label: 'Cost before subsidy', value: '₹1,80,000', note: 'At about ₹60,000 per kW' },
    { label: 'Central subsidy', value: '− ₹78,000', note: 'Credited after commissioning', good: true },
    { label: 'What you actually pay', value: '₹1,02,000', note: 'Net cost to you', emphasis: true },
  ],
  outcomes: [
    { value: '₹28,500', label: 'saved every year', note: '95% of a ₹30,000 annual bill' },
    { value: '3.6 yrs', label: 'to pay for itself', note: '₹1,02,000 ÷ ₹28,500' },
    { value: '~₹7.1 L', label: 'saved over 27 years', note: 'After panel degradation' },
  ],
};

/* ── The three arguments, compressed ──────────────────────────────────────
   One claim, one number, three bullets. Same three arguments the long-form
   version made — resource, money, environment — at a fifth of the word count. */
const PILLARS = [
  {
    id: 'resource',
    icon: <Sun className="w-6 h-6" />,
    eyebrow: 'The resource',
    title: 'You are sitting in one of India’s best solar belts',
    stat: { value: '4–4.5', unit: 'units / kW / day' },
    points: [
      'A 3 kW array makes roughly 360–400 units a month.',
      'Output peaks March–May and dips through the monsoon — judge a system on twelve months, never on one bill.',
      'Net metering banks your April surplus as credit and spends it in August.',
    ],
    image: WHY_SOLAR_IMAGES.irradiance,
    accent: 'rgba(245,166,35,0.16)',
    iconColor: 'var(--color-primary)',
  },
  {
    id: 'money',
    icon: <Wallet className="w-6 h-6" />,
    eyebrow: 'The money',
    title: 'The energy charge goes to almost nothing',
    stat: { value: '95%', unit: 'typical bill offset' },
    points: [
      'Fixed charges stay. The energy charge — nearly all of what you pay — does not.',
      'About ₹60,000 per kW before subsidy; roughly ₹1 lakh net on a 3 kW system.',
      'For many households the monthly saving lands near the EMI. After the loan closes, all of it is yours.',
    ],
    image: WHY_SOLAR_IMAGES.bill,
    accent: 'rgba(30,158,99,0.14)',
    iconColor: '#1E9E63',
  },
  {
    id: 'environment',
    icon: <Leaf className="w-6 h-6" />,
    eyebrow: 'The environment',
    title: 'Clean units, made where they are used',
    stat: { value: '27 yr', unit: 'of displaced coal' },
    points: [
      'Every unit your roof makes is a unit the grid does not burn coal to supply.',
      'No transmission losses — generation and consumption are metres apart.',
      'Still producing the large majority of its first-day output in 2050.',
    ],
    image: WHY_SOLAR_IMAGES.environment,
    accent: 'rgba(10,37,64,0.08)',
    iconColor: 'var(--color-secondary)',
  },
];

/* The honest counterweight. Nothing here is a new claim either — each item is
   the plain-language form of an answer already given in faqData.js. A page
   arguing one side without this section is advertising; with it, it is advice.

   Kept from the previous version essentially intact: it was already four short
   scannable cards, which is exactly the format the rest of the page has now
   been rewritten into. Bodies trimmed, arguments unchanged. */
const CAVEATS = [
  {
    icon: <CloudRain className="w-5 h-5" />,
    title: 'The monsoon weeks are genuinely worse',
    body:
      'Output dips, sometimes sharply, for a few weeks a year. Net metering credits carry you through it. Anyone who tells you the seasonal dip does not exist is selling you something.',
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'On-Grid solar does not work during a power cut',
    body:
      'It disconnects on purpose, so it cannot backfeed a line someone may be working on. If backup during outages is what you need, that is a Hybrid system with storage — a different product at a different price.',
  },
  {
    icon: <Droplets className="w-5 h-5" />,
    title: 'Dust and salt air are real, and cleaning is on you',
    body:
      'Gujarat gives you exceptional irradiance and then puts a film of dust on the glass to take some of it back. The maintenance burden is small but it is not zero.',
  },
  {
    icon: <CalendarDays className="w-5 h-5" />,
    title: 'The subsidy arrives after commissioning, not before',
    body:
      'You pay for the system, the discom inspects and fits the bidirectional meter, and only then is the money credited. Be wary of anyone offering the subsidy upfront as a discount.',
  },
];

export default function WhySolar() {
  return (
    <div className="gps-root w-full">
      <style>{`
        .gps-root {
          --color-primary: #F5A623;
          --color-primary-text: #9C6509;
          --color-secondary: #0A2540;
          --color-bg: #F4F6FB;
          --color-text-muted: #5A6270;
          --color-border: #E2E5EA;
        }
        .text-primary-token { color: var(--color-primary); }
        .text-eyebrow-token { color: var(--color-primary-text); }
        .text-secondary-token { color: var(--color-secondary); }
        .text-muted-token { color: var(--color-text-muted); }
        .border-token { border-color: var(--color-border); }
        .btn-primary-token {
          background: var(--color-primary);
          color: var(--color-secondary);
          border: 1px solid transparent;
          box-shadow: 0 4px 16px rgba(245,166,35,0.19);
          transition: all .3s ease;
        }
        .btn-primary-token:hover {
          background: var(--color-secondary);
          color: var(--color-primary);
          border-color: var(--color-primary);
          transform: translateY(-2px) scale(1.02);
        }
        .focus-ring:focus-visible { outline: 2.5px solid var(--color-primary); outline-offset: 2px; }

        .ws-masthead-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.55;
        }

        /* Headline stat tiles. Glass over the dark masthead so the band reads as
           part of the hero rather than as the first section under it — these
           four numbers ARE the argument, and putting them on a separate light
           surface would demote them to a summary of something above. */
        .ws-stat {
          background: linear-gradient(158deg,
            rgba(255,255,255,0.13) 0%,
            rgba(255,255,255,0.07) 52%,
            rgba(255,255,255,0.04) 100%);
          border: 1px solid rgba(255,255,255,0.16);
          backdrop-filter: blur(14px) saturate(160%);
          -webkit-backdrop-filter: blur(14px) saturate(160%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.20), 0 12px 32px -14px rgba(0,0,0,0.6);
          transition: transform .32s cubic-bezier(0.16, 1, 0.3, 1), border-color .32s ease;
        }
        .ws-stat:hover {
          transform: translateY(-4px);
          border-color: rgba(245,166,35,0.42);
        }

        /* The worked example's ledger rows. A hairline between steps rather than
           a boxed table: it is arithmetic being shown, and gridlines would make
           it look like data to scan instead of a sum to follow. */
        .ws-ledger-row + .ws-ledger-row {
          border-top: 1px solid var(--color-border);
        }

        .ws-pillar-card {
          background: var(--surface-raised);
          border: 1px solid var(--color-border);
          box-shadow: var(--elev-2), var(--bevel-light);
          transition: transform .32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow .32s ease;
        }
        .ws-pillar-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--elev-3), var(--ring-gold), var(--bevel-light);
        }

        @media (prefers-reduced-motion: reduce) {
          .btn-primary-token, .ws-stat, .ws-pillar-card { transition: none; }
          .btn-primary-token:hover, .ws-stat:hover, .ws-pillar-card:hover { transform: none; }
        }
      `}</style>

      {/* ── Masthead + headline stats ───────────────────────────────────── */}
      <header className="band-deep relative overflow-hidden">
        <img
          src={WHY_SOLAR_IMAGES.masthead.src}
          alt=""
          aria-hidden="true"
          className="ws-masthead-photo"
          fetchPriority="high"
          onError={hideOnImageError}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(100deg, rgba(4,14,27,0.94) 0%, rgba(7,26,46,0.88) 46%, rgba(10,37,64,0.66) 100%)',
          }}
        />

        <div className="container-site pt-16 pb-14 md:pt-20 md:pb-16 relative z-10">
          <p className="text-xs font-semibold tracking-wide uppercase text-primary-token mb-3">
            Why Solar
          </p>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-[1.12] max-w-4xl"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            Your roof can cover{' '}
            <span className="text-primary-token">95% of your electricity bill</span>.
          </h1>
          {/* One sentence. The old masthead ran a four-line paragraph here; the
              numbers below say the same thing faster. */}
          <p className="text-white/75 max-w-2xl text-base md:text-lg leading-relaxed mb-12">
            Here is what the sunlight on your roof is actually worth — in figures, with the
            arithmetic shown, and with the four things solar will not do for you.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {HEADLINE_STATS.map((stat) => (
              <div key={stat.label} className="ws-stat rounded-2xl p-5 md:p-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: stat.tint, border: '1px solid rgba(255,255,255,0.14)' }}
                >
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                </div>
                <p
                  className="text-3xl md:text-4xl font-bold text-white leading-none mb-2"
                  style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-sm font-semibold text-white/85 leading-snug">{stat.label}</p>
                <p className="text-[11px] text-white/50 mt-1.5 leading-snug">{stat.note}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── The worked example ──────────────────────────────────────────── */}
      <section className="band-raised">
        <div className="container-site py-16 md:py-20">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">
              A real example
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold text-secondary-token mb-4 leading-tight"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              A {WORKED_EXAMPLE.monthlyBill} a month bill, worked all the way through.
            </h2>
            <p className="text-muted-token leading-relaxed">
              Every step is shown so you can check it against your own bill rather than take our
              word for it.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
            {/* The ledger */}
            <div className="lg:col-span-2 surface-3d depth-ring rounded-2xl p-6 md:p-7">
              <p className="text-[11px] font-semibold tracking-wide uppercase text-eyebrow-token mb-5">
                What it costs
              </p>
              {WORKED_EXAMPLE.steps.map((step) => (
                <div key={step.label} className="ws-ledger-row py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <p
                      className={`text-sm ${step.emphasis ? 'font-semibold text-secondary-token' : 'text-muted-token'}`}
                    >
                      {step.label}
                    </p>
                    <p
                      className={
                        step.emphasis
                          ? 'text-xl font-bold text-secondary-token'
                          : 'text-base font-semibold'
                      }
                      style={{
                        fontFamily: "'Space Grotesk', system-ui, sans-serif",
                        color: step.good ? '#1E9E63' : undefined,
                      }}
                    >
                      {step.value}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-token/80 mt-0.5">{step.note}</p>
                </div>
              ))}
            </div>

            {/* The outcomes — the three digits that matter */}
            <div className="lg:col-span-3 grid sm:grid-cols-3 gap-5">
              {WORKED_EXAMPLE.outcomes.map((outcome) => (
                <div
                  key={outcome.label}
                  className="ws-pillar-card rounded-2xl p-6 flex flex-col justify-center text-center"
                >
                  <p
                    className="text-3xl md:text-4xl font-bold text-secondary-token leading-none mb-2"
                    style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                  >
                    {outcome.value}
                  </p>
                  <p className="text-sm font-semibold text-secondary-token leading-snug">
                    {outcome.label}
                  </p>
                  <p className="text-[11px] text-muted-token mt-2 leading-snug">{outcome.note}</p>
                </div>
              ))}

              {/* The honesty footnote. It sits inside the example rather than in
                  a disclaimer block at the bottom of the page, because a reader
                  who takes the ₹7.1 lakh figure away needs to know what is in it
                  at the moment they read it. */}
              <div className="sm:col-span-3 rounded-2xl border border-token bg-white/60 p-5">
                <p className="text-xs text-muted-token leading-relaxed">
                  <strong className="text-secondary-token">What the 27-year figure assumes.</strong>{' '}
                  It applies the documented ~0.5%/year panel degradation, so the array is treated as
                  producing less each year. It does <em>not</em> assume electricity tariffs rise —
                  they almost certainly will, which would push the real total higher, but nobody has
                  given us a sourced escalation rate and we will not invent one. The number is
                  deliberately the conservative end.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The three arguments ─────────────────────────────────────────── */}
      <section className="band-sunken">
        <div className="container-site py-16 md:py-20">
          <div className="max-w-2xl mb-10 md:mb-12">
            <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">
              Three reasons
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold text-secondary-token leading-tight"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              The resource, the money, and the three decades after.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-7">
            {PILLARS.map((pillar) => (
              <article
                key={pillar.id}
                id={pillar.id}
                className="ws-pillar-card rounded-2xl overflow-hidden flex flex-col scroll-mt-28"
              >
                <div className="relative h-44 bg-[#0A2540] flex-shrink-0">
                  <img
                    src={pillar.image.src}
                    alt={pillar.image.alt}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={hideOnImageError}
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to top, rgba(3,12,24,0.80) 0%, transparent 100%)',
                    }}
                  />
                  {/* The number rides the photograph rather than sitting in the
                      body, so it is readable in a scroll-past. */}
                  <div className="absolute bottom-4 left-5">
                    <p
                      className="text-2xl font-bold text-white leading-none"
                      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                    >
                      {pillar.stat.value}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70 mt-1">
                      {pillar.stat.unit}
                    </p>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: pillar.accent,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                      }}
                    >
                      <span style={{ color: pillar.iconColor }}>{pillar.icon}</span>
                    </div>
                    <p className="text-[11px] font-semibold tracking-wide uppercase text-eyebrow-token">
                      {pillar.eyebrow}
                    </p>
                  </div>

                  <h3
                    className="text-lg font-bold text-secondary-token mb-4 leading-snug"
                    style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                  >
                    {pillar.title}
                  </h3>

                  <ul className="space-y-2.5">
                    {pillar.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[0.5rem]"
                          style={{ background: pillar.iconColor }}
                        />
                        <span className="text-sm text-muted-token leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── What solar will not do ──────────────────────────────────────── */}
      <section className="band-deep relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
        <div className="container-site py-16 md:py-20 relative z-10">
          <div className="max-w-2xl mb-10 md:mb-12">
            <p className="text-xs font-semibold tracking-wide uppercase text-primary-token mb-3">
              The other side
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              Four things rooftop solar will not do for you.
            </h2>
            <p className="text-white/65 leading-relaxed">
              Our mission statement commits us to being as straight about what a system will not
              do as about what it will. This is that part.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {CAVEATS.map((item) => (
              <article
                key={item.title}
                className="glass-3d-dark lift-3d-lg rounded-2xl p-6 h-full flex flex-col"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(245,166,35,0.26) 0%, rgba(245,166,35,0.08) 100%)',
                    border: '1px solid rgba(245,166,35,0.28)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16)',
                  }}
                >
                  <span className="text-primary-token">{item.icon}</span>
                </div>
                <h3
                  className="text-base font-semibold text-white mb-2 leading-snug"
                  style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">{item.body}</p>
              </article>
            ))}
          </div>

          {/* The CO₂ note, cut from ~180 words to two sentences. The decision it
              records is worth keeping; the essay explaining it was not. */}
          <p className="text-xs text-white/45 leading-relaxed mt-10 max-w-3xl">
            <strong className="text-white/70">One number you will not find here:</strong> tonnes of
            CO₂ avoided. The arithmetic is easy but it needs a grid emissions factor, and almost
            every site that prints one will not say which factor or which year it came from. When we
            have a sourced, dated figure for the Gujarat grid, it will appear here with its source
            beside it.
          </p>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="band-raised">
        <div className="container-site py-16 md:py-20">
          <div className="surface-3d depth-ring rounded-3xl p-8 md:p-12 text-center max-w-3xl mx-auto">
            <h2
              className="text-2xl md:text-3xl font-bold text-secondary-token mb-4 leading-snug"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              That example was a {WORKED_EXAMPLE.monthlyBill} bill. Run it on yours.
            </h2>
            <p className="text-muted-token leading-relaxed mb-8 max-w-xl mx-auto">
              Every figure on this page is an average. The one that matters is calculated from your
              own consumption — enter one number and the calculator does the rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/roi-calculator"
                className="btn-primary-token focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold"
              >
                <TrendingUp className="w-4 h-4" /> See your numbers
              </Link>
              <Link
                to="/faq"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold text-secondary-token surface-3d-flat lift-3d"
              >
                Read the detail <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
