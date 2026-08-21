import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Gauge,
  MapPin,
  ShieldCheck,
  Target,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { ABOUT_IMAGES, hideOnImageError } from '../data/sectionImages';
import { useScrollReveal } from '../lib/useScrollReveal';
import {
  ADDRESS_LINES,
  COMPANY_NAME,
  ENGINEERING_YEARS,
  SOLAR_YEARS,
} from '../data/businessInfo';

/**
 * /about — the company page.
 *
 * Phase 2 merges what used to be two homepage sections, components/AboutUs.jsx
 * ("who we are") and components/WhyGurukrupa.jsx ("why us"), into one document.
 * They always argued the same point from two directions — the second is the
 * evidence for the first — and splitting them across the homepage scroll meant
 * the reader met the claim and its support several screens apart, with the
 * product range in between. Both source components are deleted; this file is
 * the only home for that copy now.
 *
 * Every factual claim below is carried over verbatim from those components and
 * is sourced from material already published elsewhere on the site:
 *   · 28 / 5 years, address, company name — data/businessInfo.js
 *   · Solar EPC scope, Sagar Bhimani as the named contact — PrivacyPolicy.jsx
 *     and the quotation flow
 *   · Earthing / surge / lightning protection quoted as one scope — faqData.js
 *     ("what exactly am I paying for"), explicit that cheaper quotations omit it
 *   · 1.9 MW in five months, 27-year warranty, <48hr assessment — the homepage
 *     achievement banner and stats row
 * Nothing new is asserted. The 1230+ customer figure is still absent on
 * purpose: it carries an unresolved "⚠ CONFIRM WITH BUSINESS" note on the
 * homepage, so it is not repeated here as a hard claim.
 */

const FACTS = [
  {
    icon: <Building2 className="w-5 h-5" />,
    label: 'What we are',
    value: 'Solar EPC — engineering, procurement and construction, under one scope',
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    label: 'Where we are',
    value: ADDRESS_LINES.join(', '),
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: 'Who you deal with',
    value: 'Sagar Bhimani, directly — on sizing, subsidy and site visits',
  },
];

const DIFFERENTIATORS = [
  {
    icon: <Wrench className="w-5 h-5" />,
    title: 'Engineered, not estimated',
    body:
      'The system is sized against your actual billing units and the load you really run — not against a subsidy ceiling or a round number that sounds right. That single decision determines whether you see the savings you were shown.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'The parts cheaper quotes leave out',
    body:
      'Earthing, lightning protection and surge devices are inside our scope, not extras. In a coastal, high-irradiance environment they are what stops one fault taking out an inverter worth more than the rest of the balance of system.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Specified for Gujarat, not for a catalogue',
    body:
      'Heat, dust and salt air are the three things that age a rooftop system here. Mounting, cabling and component selection are chosen against those conditions, because a system that survives its warranty is the only one that ever pays back.',
  },
  {
    icon: <Gauge className="w-5 h-5" />,
    title: 'Paperwork handled end to end',
    body:
      'Subsidy application and the PGVCL net metering process are ours to run, from portal registration through to the bidirectional meter going on the wall. You are buying a commissioned system, not a box of parts and a phone number.',
  },
];

const PROOF = [
  { value: '1.9 MW', label: 'Commissioned in the last 5 months' },
  { value: '27 yr', label: 'Panel performance warranty' },
  { value: '<48 hr', label: 'Site assessment turnaround' },
];

export default function About() {
  /* The story section's photograph is side-placed, so it falls under the
     site-wide directional reveal rule. This page had no observer of its own —
     that machinery used to be written inline in Homepage.jsx and scoped to the
     homepage. It is a shared hook now. */
  const revealRoot = useScrollReveal();

  return (
    <div ref={revealRoot} className="gps-root w-full">
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

        /* Masthead photograph. Same treatment as /faq: the frame is texture,
           and the scrim guarantees the copy's contrast whatever it contains. */
        .about-masthead-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.42;
        }
        @media (prefers-reduced-motion: reduce) {
          .btn-primary-token { transition: none; }
          .btn-primary-token:hover { transform: none; }
        }
      `}</style>

      {/* ── Masthead ────────────────────────────────────────────────────── */}
      <header className="band-deep relative overflow-hidden">
        <img
          src={ABOUT_IMAGES.masthead.src}
          alt=""
          aria-hidden="true"
          className="about-masthead-photo"
          fetchPriority="high"
          onError={hideOnImageError}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(100deg, rgba(5,18,34,0.95) 0%, rgba(8,30,53,0.88) 44%, rgba(10,37,64,0.62) 100%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />

        <div className="container-site pt-16 pb-20 md:pt-20 md:pb-24 relative z-10">
          <p className="text-xs font-semibold tracking-wide uppercase text-primary-token mb-3">
            About Us · Madhapar, Bhuj, Kutch, Gujarat
          </p>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.12] max-w-4xl"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            A Gujarat electrical firm that{' '}
            <span className="text-primary-token">moved onto the roof</span>.
          </h1>
          <p className="text-white/75 max-w-2xl text-base md:text-lg leading-relaxed">
            {COMPANY_NAME} did not arrive with the solar boom. The name was earned across Gujarat
            over nearly three decades of electrical work, on one principle that has not changed:
            a system is only as good as the engineering behind it. Solar is where that discipline
            is pointed now.
          </p>

          {/* Proof strip, promoted into the masthead — on a dedicated page these
              numbers are the reason to keep reading, not a footnote. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-3xl">
            {PROOF.map((stat) => (
              <div key={stat.label} className="glass-3d-dark rounded-2xl px-5 py-4">
                <p
                  className="text-2xl md:text-3xl font-bold text-primary-token leading-none mb-2"
                  style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-white/60 leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── The story ───────────────────────────────────────────────────── */}
      <section className="band-raised relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 44% 58% at 10% 96%, rgba(10,37,64,0.06) 0%, transparent 60%)',
          }}
        />

        <div className="container-site py-16 md:py-24 relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Copy */}
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">
                Who we are
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-token mb-6 leading-tight">
                The electrical engineering came first. The solar was built on top of it.
              </h2>

              <div className="space-y-5 text-muted-token leading-relaxed prose-measure">
                <p>
                  {COMPANY_NAME} is a solar EPC based in Madhapar, Bhuj. We design, supply,
                  install and commission On-Grid and Hybrid rooftop systems for homes and
                  businesses across Gujarat — the whole scope under one roof,
                  including the earthing, protection and paperwork that get quoted separately
                  elsewhere.
                </p>
                <p>
                  The business is {ENGINEERING_YEARS} years old and has spent {SOLAR_YEARS} of
                  them on solar. That order matters: it is why our answer to almost every
                  question starts with your actual load rather than with a product. A panel is a
                  commodity you can buy from anyone in Bhuj. The array, its protection and its
                  connection to a grid that browns out in May are not.
                </p>
                <p>
                  In the last five months alone that discipline has put 1.9&nbsp;MW of rooftop
                  generation into service — home by home, business by business, each one sized
                  against a real electricity bill.
                </p>
              </div>

              {/* Mission — the one statement worth pulling out of the prose. */}
              <div className="surface-3d depth-ring rounded-2xl p-6 md:p-7 mt-9">
                <div className="flex items-center gap-2.5 mb-3">
                  <Target className="w-4 h-4 text-primary-token" />
                  <p className="text-[11px] font-semibold tracking-wide uppercase text-eyebrow-token">
                    Our mission
                  </p>
                </div>
                <p
                  className="text-lg md:text-xl text-secondary-token leading-snug font-semibold"
                  style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                >
                  To put a correctly sized, properly protected solar system on every roof in
                  Gujarat that can carry one — and to be as straight about what it will not do as
                  about what it will.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                {FACTS.map((fact) => (
                  <div
                    key={fact.label}
                    className="surface-3d-flat lift-3d rounded-xl px-5 py-4 flex items-start gap-4"
                  >
                    <span className="text-primary-token flex-shrink-0 mt-0.5">{fact.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-token mb-0.5">
                        {fact.label}
                      </p>
                      <p className="text-sm text-secondary-token font-medium leading-snug">
                        {fact.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photograph — craft, not finished arrays. The finished arrays live
                in the gallery and nowhere else.

                From lg up this column stretches to the row height and the frame
                fills it, so the two columns end on the same line. That is what
                closes the gap the inset photograph used to sit in, and it holds at
                any width — which a taller fixed aspect ratio would not. Measured
                against the copy column, the shortfall after removing the inset ran
                from 12px at 1920 to 590px at 1100, because the frame scales with
                the column while the prose height depends on where the text
                happens to reflow. No single ratio covers that spread; filling the
                cell covers all of it.

                This is also why `lg:sticky lg:top-32` is gone: a sticky element
                the full height of its own scroll container never engages, so the
                two are mutually exclusive. Little was lost — at 1440 the copy
                column is 910px against a 900px viewport, so there was barely 10px
                of travel for it to stick through. */}
            {/* Right column, so it enters from the right — the site-wide
                directional rule (see the reveal block in index.css). The host
                section carries `overflow: hidden`, which is what keeps the 56px
                pending offset from widening the document. */}
            <div className="lg:col-span-5 relative lg:self-stretch reveal-right">
              <div className="photo-3d rounded-3xl bg-[#0A2540] aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[30rem]">
                <img
                  src={ABOUT_IMAGES.craft.src}
                  alt={ABOUT_IMAGES.craft.alt}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={hideOnImageError}
                />
              </div>

              {/* The inset hard-hat photograph that used to hang off the bottom
                  left corner of this frame is gone. It was the third element in a
                  column that only needed two, and it landed level with the "Who
                  you deal with" card, which made a line about a named person read
                  as if it were captioning a stock safety helmet. The single frame
                  plus the legacy badge is the stronger composition. */}

              <div className="glass-3d rounded-2xl px-5 py-4 absolute top-6 -right-2 lg:-right-5">
                <p
                  className="text-2xl md:text-3xl font-bold text-secondary-token leading-none"
                  style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                >
                  {ENGINEERING_YEARS} yrs
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-token mt-1">
                  Engineering legacy
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Gurukrupa ───────────────────────────────────────────────── */}
      <section id="why-gurukrupa" className="band-deep relative overflow-hidden scroll-mt-28">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />

        <div className="container-site py-16 md:py-24 relative z-10">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold tracking-wide uppercase text-primary-token mb-3">
              Why Gurukrupa
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              Four things that decide whether a rooftop system actually pays back.
            </h2>
            <p className="text-white/65 leading-relaxed">
              None of them is the brand printed on the panel. Every quotation in Gujarat offers
              roughly the same hardware; what separates them is the four decisions below, and
              only one of those is visible on a price list.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {DIFFERENTIATORS.map((item) => (
              <article
                key={item.title}
                className="glass-3d-dark lift-3d-lg rounded-2xl p-6 md:p-7 h-full flex flex-col"
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
                  className="text-base md:text-lg font-semibold text-white mb-2 leading-snug"
                  style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">{item.body}</p>
              </article>
            ))}
          </div>

          {/* Closing CTA band */}
          <div className="glass-3d-dark rounded-2xl mt-6 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <p className="text-sm md:text-base text-white/75 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-primary-token flex-shrink-0" />
              Free site assessment, no obligation — and a written scope you can compare
              line for line.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link
                to="/quote"
                className="btn-primary-token focus-ring inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold"
              >
                Get Your Free Quotation <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/projects"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-white border border-white/25 hover:bg-white/10 transition-colors"
              >
                See our work
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Onward links ────────────────────────────────────────────────── */}
      <section className="band-sunken">
        <div className="container-site py-14 md:py-16">
          <div className="grid sm:grid-cols-2 gap-5">
            <Link
              to="/why-solar"
              className="surface-3d lift-3d rounded-2xl p-6 md:p-7 group focus-ring block"
            >
              <p className="text-[11px] font-semibold tracking-wide uppercase text-eyebrow-token mb-2">
                Next
              </p>
              <h3
                className="text-lg font-semibold text-secondary-token mb-2 flex items-center gap-2"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              >
                Why solar, in Gujarat specifically
                <ArrowRight className="w-4 h-4 text-primary-token opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </h3>
              <p className="text-sm text-muted-token leading-relaxed">
                What the sunlight on your roof is actually worth here — the resource, the bill
                it removes, and the emissions it displaces.
              </p>
            </Link>

            <Link
              to="/roi-calculator"
              className="surface-3d lift-3d rounded-2xl p-6 md:p-7 group focus-ring block"
            >
              <p className="text-[11px] font-semibold tracking-wide uppercase text-eyebrow-token mb-2">
                Run the numbers
              </p>
              <h3
                className="text-lg font-semibold text-secondary-token mb-2 flex items-center gap-2"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              >
                EMI &amp; ROI calculator
                <ArrowRight className="w-4 h-4 text-primary-token opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </h3>
              <p className="text-sm text-muted-token leading-relaxed">
                Enter one number — your monthly electricity bill — and see the savings, the EMI
                and the payback year. Free, instant, no details required.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
