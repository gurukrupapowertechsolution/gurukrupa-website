import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bird,
  Building2,
  CheckCircle2,
  Clock,
  CloudLightning,
  ExternalLink,
  FileText,
  Gavel,
  HardHat,
  IndianRupee,
  Info,
  Landmark,
  ListChecks,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Receipt,
  Scale,
  Shield,
  ShieldCheck,
  Siren,
  Truck,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  ADDRESS_LINES,
  COMPANY_NAME,
  EMAIL,
  EMAIL_HREF,
  PHONE_DISPLAY,
  PHONE_HREF,
  WORKING_HOURS_SHORT,
} from './data/businessInfo';
import useScrollSpy, { useKeepActiveInView } from './lib/useScrollSpy';

/**
 * /terms-and-conditions — the full commercial terms, rewritten from the Task C
 * draft.
 *
 * ── What changed and why ──────────────────────────────────────────────────
 *
 * The original was ten short clauses covering the WEBSITE. It said almost
 * nothing about the thing a solar customer actually gets into a dispute about:
 * whose warranty it is, who pays for a replacement, and who is responsible
 * when PGVCL or the subsidy portal takes six months. Those three questions are
 * the entire post-sale risk surface of a residential EPC job, and a terms page
 * that leaves them unanswered transfers the argument to whoever shouts loudest
 * at the time.
 *
 * This version answers them in writing, before the sale. That is a commercial
 * position as much as a legal one — most competitor pages in this market say
 * "25 years warranty" and stop, which is precisely the sentence that produces
 * an angry customer in year six.
 *
 * ── Clause numbering is DERIVED, not typed ────────────────────────────────
 *
 * TOC is the single source of truth: a clause's number is its index in that
 * array, and cross-references in the prose call clauseNo('id') rather than
 * hard-coding a numeral. Insert a clause anywhere in TOC and every number and
 * every "see clause N" updates itself. The previous revision hard-coded both,
 * which meant inserting one clause silently broke five cross-references — the
 * kind of defect nobody notices until a customer cites the wrong clause back
 * at you.
 *
 * ── Every warranty figure and where it comes from ─────────────────────────
 *
 * NOTHING here is rounded up in our favour. The distinctions this page draws
 * that the market generally does not:
 *
 *   · Panel PRODUCT warranty (defects, delamination, junction box) is 10–12
 *     years — Adani 10, Waaree 12 on the N-type TOPCon Elite series.
 *   · Panel PERFORMANCE warranty (guaranteed output) is 25–30 years — Adani
 *     25-year linear, Waaree 30-year on current TOPCon series. The site's FAQ
 *     and /why-solar quote 27 years, which sits inside that band and reflects
 *     the DCR series we most commonly install.
 *   · On-grid inverters are NOT uniformly 10 years. UTL is 10 as standard and
 *     is an ON-SITE warranty; Polycab ships 5–8 standard with extension to 10
 *     on several models. The page says so rather than quoting the best number
 *     in the range.
 *   · UTL's warranty carries a 180-day rule: the purchase date must fall
 *     within 180 days of the manufacturing date. Old stock silently voids
 *     cover. Stated here because it is the customer's single best defence
 *     against being sold last year's inventory — by us or by anyone else.
 *   · Hybrid inverter 5 years, battery 5 years — consistent with faqData.js
 *     'on-grid-warranty' and 'hybrid-battery-life'.
 *
 * ⚠ These are OEM commercial terms and they move. Re-verify against the OEM
 * warranty certificates at least annually, and whenever the supplied brand
 * list changes. The governing document is always the certificate issued
 * against the customer's own serial numbers — the page says that too, which is
 * what stops a stale figure here from becoming a misrepresentation claim.
 *
 * ⚠ Consistency contract: the warranty terms, subsidy slabs and PGVCL process
 * described here are also stated in src/data/faqData.js. If one changes, both
 * change together — a FAQ that contradicts the T&C is worse than neither.
 *
 * ── Deliberately NOT removed ──────────────────────────────────────────────
 *
 * The advocate-review notice at the foot. Content accuracy and legal
 * enforceability are different things; nothing here has been settled by a
 * practising advocate, and under Indian consumer law several of these clauses
 * (limitation of liability in particular) are only as good as their drafting.
 * Remove that block when a lawyer has actually signed off, not before.
 */

const EFFECTIVE_DATE = '18 August 2026';
const VERSION = '2.1';

/* ── Table of contents — the source of truth for clause numbering ─────────
   Order here IS the clause order. See the header note. */
const TOC = [
  { id: 'scope', label: 'Scope & acceptance' },
  { id: 'definitions', label: 'Definitions' },
  { id: 'estimates', label: 'Online estimates' },
  { id: 'survey', label: 'Site survey & final proposal' },
  { id: 'pricing', label: 'Pricing, taxes & payment' },
  { id: 'scope-of-supply', label: 'Scope of supply & exclusions' },
  { id: 'title-risk', label: 'Title, risk & site readiness' },
  { id: 'warranty-structure', label: 'Warranty structure' },
  { id: 'oem-warranties', label: 'OEM warranty periods' },
  { id: 'claim-process', label: 'Warranty claim process' },
  { id: 'claim-costs', label: 'Who pays for what' },
  { id: 'claim-example', label: 'Worked claim examples' },
  { id: 'not-covered', label: 'What warranties exclude' },
  { id: 'insurance', label: 'Insurance advisory' },
  { id: 'net-metering', label: 'Net metering & PGVCL' },
  { id: 'subsidy', label: 'PM Surya Ghar subsidy' },
  { id: 'generation', label: 'Generation, savings & EMI figures' },
  { id: 'customer-obligations', label: 'Your obligations' },
  { id: 'transfer', label: 'Selling the property' },
  { id: 'communications', label: 'Contact & photography consent' },
  { id: 'force-majeure', label: 'Force majeure' },
  { id: 'liability', label: 'Limitation of liability' },
  { id: 'cancellation', label: 'Cancellation & refunds' },
  { id: 'ip', label: 'Intellectual property' },
  { id: 'grievance', label: 'Grievance redressal' },
  { id: 'law', label: 'Governing law' },
  { id: 'changes', label: 'Changes & contact' },
];

/** id → clause number. Derived once; never typed by hand. */
const CLAUSE_NO = TOC.reduce((acc, item, i) => {
  acc[item.id] = i + 1;
  return acc;
}, {});

/** Cross-reference helper. `clause {clauseNo('liability')}` survives reordering. */
const clauseNo = (id) => CLAUSE_NO[id];

/** Clause ids in document order, for the contents rail's scroll-spy. Module
 *  scope so the reference is stable — see the note on useScrollSpy. */
const TOC_IDS = TOC.map((item) => item.id);

/* ── OEM warranty matrix ──────────────────────────────────────────────────
   Two warranty columns, not one, because conflating them is the single most
   common misrepresentation in this industry: a "30 year panel" has a 30-year
   output guarantee and a 12-year defect guarantee, and the customer who finds
   that out in year 15 finds it out the hard way. */
const WARRANTY_ROWS = [
  {
    component: 'Solar PV modules (panels)',
    brands: 'Waaree, Adani and other ALMM/DCR-listed makes',
    product: '10 – 12 years',
    performance: '25 – 30 years (typically 27 on the DCR series we most commonly supply)',
  },
  {
    component: 'On-Grid (grid-tied) inverter',
    brands: 'UTL, Solaryaan, Polycab and similar',
    product: 'Up to 10 years, by brand and model — UTL 10 years on-site as standard; Polycab 5 – 8 as standard, extendable to 10 on several models',
    performance: 'Not applicable',
  },
  {
    component: 'Hybrid inverter',
    brands: 'UTL, Solaryaan and similar',
    product: '5 years (typical)',
    performance: 'Not applicable',
  },
  {
    component: 'Lithium battery bank',
    brands: 'As specified in your work order',
    product: '5 years (typical), subject to cycle-life conditions',
    performance: 'Capacity retention per the OEM certificate',
  },
  {
    component: 'Mounting structure & BOS',
    brands: 'Fabricated or sourced to specification',
    product: 'Per supplier terms; galvanising to the grade stated in the work order',
    performance: 'Not applicable',
  },
  {
    component: 'Installation workmanship',
    brands: `${COMPANY_NAME} — our own warranty, not an OEM's`,
    product: '1 year from the date of commissioning',
    performance: 'Not applicable',
  },
];

/* Official OEM warranty resources. Verified live at the revision date; these
   are manufacturer-operated pages and can move without notice to us, which
   the page says in as many words. */
const OEM_LINKS = [
  {
    brand: 'Waaree Energies',
    detail: 'Warranty statement, warranty registration and service support',
    href: 'https://web.waaree.com/documents/warranty-statement/',
    display: 'web.waaree.com/documents/warranty-statement',
  },
  {
    brand: 'Adani Solar',
    detail: 'Warranty certificate lookup — enter your module serial numbers to download the certificate that governs your system',
    href: 'https://www.adanisolar.com/warranty-certificate',
    display: 'adanisolar.com/warranty-certificate',
  },
  {
    brand: 'UTL Solar (a brand of Fujiyama Power Systems Limited)',
    detail: 'Product / warranty registration. UTL requires the product to be registered with its serial number and purchase invoice',
    href: 'https://www.upsinverter.com/utl/register/',
    display: 'upsinverter.com/utl/register',
  },
  {
    brand: 'UTL Solar — service',
    detail: 'Complaint and service-request portal. UTL states that uploading the warranty document is mandatory or the complaint is not logged',
    href: 'https://tracker.utlsolar.net/tracker/complaints/complaints_register.php',
    display: 'tracker.utlsolar.net — complaint registration',
  },
];

/* ── Claim timeline ───────────────────────────────────────────────────────
   The two OEM-controlled stages (evaluation, dispatch) are the ones that
   actually consume the calendar, and they are the two we cannot compress.
   Showing them as separate rows is the point — a customer told "5 to 9 weeks"
   with no breakdown assumes the installer is sitting on it. */
const CLAIM_STAGES = [
  {
    stage: 'You report the fault',
    who: 'You → Gurukrupa',
    time: 'Day 0',
    detail: 'By phone, WhatsApp or email. Quote your commissioning report number if you have it to hand.',
  },
  {
    stage: 'Acknowledgement & remote triage',
    who: 'Gurukrupa',
    time: 'Within 2 working days',
    detail: 'We confirm receipt and try to establish over the phone whether the fault is the module, the inverter, a string connection or the grid supply.',
  },
  {
    stage: 'Site inspection & evidence capture',
    who: 'Gurukrupa',
    time: '2 – 7 working days',
    detail: 'String and IV measurements, thermal or visual inspection, photographs, and capture of the affected serial numbers. No OEM will open a claim without this evidence pack and the warranty document.',
  },
  {
    stage: 'Claim registered with the OEM',
    who: 'Gurukrupa, on your behalf',
    time: 'Same week as inspection',
    detail: 'We file on the manufacturer’s warranty or service portal, submit the evidence pack and the warranty certificate, and become your single point of contact for the file.',
  },
  {
    stage: 'OEM technical evaluation',
    who: 'OEM — outside our control',
    time: '15 – 30 days',
    detail: 'The manufacturer assesses whether the failure is a covered manufacturing defect or an excluded cause. They may require the item to be shipped to their service centre, or may inspect on site.',
  },
  {
    stage: 'Approval, dispatch & transport',
    who: 'OEM — outside our control',
    time: 'A further 7 – 15 days',
    detail: 'If approved, replacement material is released and dispatched. Availability of the identical model governs this stage; an equivalent or superior model may be substituted where the original is discontinued.',
  },
  {
    stage: 'Un-mounting, re-installation & re-commissioning',
    who: 'Gurukrupa',
    time: '1 – 3 working days once material arrives',
    detail: 'We remove the faulty unit, install the replacement, re-test the string and confirm the system is back to expected output.',
  },
];

/* ── Cost allocation ──────────────────────────────────────────────────────
   The clause customers most often discover after the fact: "free replacement"
   means free MATERIAL. Labour, freight and access are not free, and never
   were. Stating it before the sale is the whole purpose of this section. */
const COST_ROWS = [
  { item: 'Replacement module, inverter or part (claim approved)', payer: 'oem', note: 'Supplied free of cost by the manufacturer' },
  { item: 'OEM laboratory testing and technical evaluation', payer: 'oem', note: 'Borne by the manufacturer as part of the claim' },
  { item: 'OEM engineer visit, where the warranty is an on-site warranty', payer: 'oem', note: 'Applies to UTL on-grid inverters, which carry on-site cover as standard. Check your certificate — most module warranties are not on-site' },
  { item: 'Claim registration, evidence pack, OEM follow-up and paperwork', payer: 'gks', note: 'We do not charge for warranty coordination, at any point in the warranty life' },
  { item: 'Freight — site to OEM service point, and return of replacement', payer: 'customer', note: 'Charged at actuals; we will obtain the quote before booking' },
  { item: 'Un-mounting the faulty component', payer: 'customer', note: 'Free of charge during the first year (our workmanship warranty)' },
  { item: 'Re-installation, re-wiring and re-commissioning labour', payer: 'customer', note: 'Free of charge during the first year (our workmanship warranty)' },
  { item: 'Our technician’s site-visit charge', payer: 'customer', note: 'At our prevailing rate, after the first year. Quoted before the visit' },
  { item: 'Scaffolding, crane or any special access equipment', payer: 'customer', note: 'Only where the roof cannot be worked safely with standard access' },
  { item: 'Consumables — connectors, clamps, cable, sealant', payer: 'customer', note: 'At actuals' },
  { item: 'Generation lost while the system is down', payer: 'none', note: `Not compensated by the OEM or by us. See clause ${CLAUSE_NO.liability}` },
];

const PAYER_META = {
  oem: { label: 'OEM', bg: 'rgba(30,158,99,0.12)', color: '#15784B', border: 'rgba(30,158,99,0.30)' },
  gks: { label: 'Gurukrupa', bg: 'rgba(10,37,64,0.08)', color: '#0A2540', border: 'rgba(10,37,64,0.18)' },
  customer: { label: 'Customer', bg: 'rgba(245,166,35,0.16)', color: '#9C6509', border: 'rgba(245,166,35,0.34)' },
  none: { label: 'Nobody', bg: 'rgba(179,38,30,0.09)', color: '#B3261E', border: 'rgba(179,38,30,0.24)' },
};

/* Exclusions, grouped. A flat list of fifteen exclusions reads as fine print;
   four labelled groups read as an explanation. */
const EXCLUSION_GROUPS = [
  {
    icon: <CloudLightning className="w-4 h-4" />,
    title: 'Weather & natural events',
    items: [
      'Hailstorm, cyclone, high wind and storm damage',
      'Lightning strike and the surge that follows it',
      'Flood, waterlogging and earthquake',
      'Fire, whether or not it originated on your property',
    ],
  },
  {
    icon: <Bird className="w-4 h-4" />,
    title: 'Animals, birds & external impact',
    items: [
      'Monkeys, birds, rodents and other animals breaking glass, displacing modules or chewing cabling',
      'Falling branches, construction debris, stones and thrown objects',
      'Theft, vandalism, riot and malicious damage',
      'Damage caused by anyone walking on the modules',
    ],
  },
  {
    icon: <Zap className="w-4 h-4" />,
    title: 'Grid & electrical supply',
    items: [
      'Voltage surges, spikes, sags and fluctuation originating in the PGVCL grid',
      'Neutral failure, phase imbalance and incorrect earthing not carried out by us',
      'Damage from a DG set or any other source connected without our sizing approval',
      'Operating the system outside the voltage and temperature envelope in the OEM manual',
    ],
  },
  {
    icon: <Wrench className="w-4 h-4" />,
    title: 'Handling, modification & neglect',
    items: [
      'Repair, opening or modification by anyone other than the OEM or a Gurukrupa technician',
      'Relocation of the array to a different site or roof',
      'Abrasive cleaning, detergents, scrapers, or washing hot glass with cold water',
      'Shading introduced after commissioning — new construction, a water tank, or a tree left to grow',
      'Removal, defacing or loss of the serial-number label, which is what the claim is filed against',
    ],
  },
];

/* ── Presentational primitives ────────────────────────────────────────────
   Defined here rather than imported because they are specific to the two
   legal pages and identical between them; splitting them into components/
   for exactly two consumers buys nothing. Keep the two copies in step. */

function Section({ id, title, icon, lead, children }) {
  return (
    <section id={id} className="legal-card scroll-mt-28">
      <div className="flex items-start gap-3 mb-4">
        <div className="legal-sec-icon" aria-hidden="true">{icon}</div>
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-eyebrow-token mb-1">
            Clause {CLAUSE_NO[id]}
          </p>
          <h2
            className="text-lg md:text-xl font-semibold text-secondary-token leading-snug"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            {title}
          </h2>
        </div>
      </div>
      {lead && <p className="legal-lead">{lead}</p>}
      <div className="legal-body">{children}</div>
    </section>
  );
}

function Callout({ tone = 'info', icon, title, children }) {
  const tones = {
    info: { bg: 'rgba(10,37,64,0.045)', border: 'rgba(10,37,64,0.16)', color: '#0A2540' },
    warn: { bg: 'rgba(245,166,35,0.10)', border: 'rgba(245,166,35,0.34)', color: '#9C6509' },
    good: { bg: 'rgba(30,158,99,0.09)', border: 'rgba(30,158,99,0.28)', color: '#15784B' },
    stop: { bg: 'rgba(179,38,30,0.07)', border: 'rgba(179,38,30,0.24)', color: '#B3261E' },
  };
  const t = tones[tone] || tones.info;
  return (
    <div className="rounded-xl px-4 py-3.5 my-4" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
      <p className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: t.color }}>
        <span aria-hidden="true" className="flex-shrink-0">{icon}</span>
        {title}
      </p>
      <div className="text-sm leading-relaxed text-muted-token legal-callout-body">{children}</div>
    </div>
  );
}

export default function TermsAndConditions() {
  /* Which clause the reader is on, so the contents rail highlights it — and so
     the highlight stays inside the rail's own scroll box. With 27 clauses that
     second part is not a nicety: the rail overflows on any normal laptop. */
  const activeId = useScrollSpy(TOC_IDS);
  const railRef = React.useRef(null);
  useKeepActiveInView(railRef, activeId);

  return (
    <div className="gps-root min-h-screen w-full bg-[#F4F6FB] pb-20">
      <style>{`
        .gps-root {
          --color-primary: #F5A623;
          --color-primary-text: #9C6509;
          --color-secondary: #0A2540;
          --color-bg: #F4F6FB;
          --color-text-muted: #5A6270;
          --color-border: #E2E5EA;
        }
        .bg-primary-token { background: var(--color-primary); }
        .text-primary-token { color: var(--color-primary); }
        .text-eyebrow-token { color: var(--color-primary-text); }
        .text-secondary-token { color: var(--color-secondary); }
        .text-muted-token { color: var(--color-text-muted); }
        .border-token { border-color: var(--color-border); }
        .focus-ring:focus-visible { outline: 2.5px solid var(--color-primary); outline-offset: 2px; }

        /* Section cards. Same raised-surface treatment as the FAQ rows and the
           /why-solar stat cards, so a legal page does not read as a different
           website with the header bolted on. */
        .legal-card {
          background: var(--surface-raised, linear-gradient(163deg,#fff 0%,#fdfdff 42%,#f6f8fd 100%));
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: var(--elev-1), var(--bevel-light);
        }
        @media (min-width: 768px) { .legal-card { padding: 2rem 2.25rem; } }

        .legal-sec-icon {
          width: 2.25rem; height: 2.25rem; flex-shrink: 0;
          border-radius: 0.625rem;
          display: flex; align-items: center; justify-content: center;
          background: rgba(10,37,64,0.07);
          color: var(--color-secondary);
        }
        .legal-lead {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: var(--color-secondary);
          font-weight: 500;
          margin-bottom: 1rem;
        }
        .legal-body p { font-size: 0.9375rem; line-height: 1.75; color: var(--color-text-muted); margin-bottom: 0.9rem; }
        .legal-body p:last-child { margin-bottom: 0; }
        .legal-body strong { color: var(--color-secondary); font-weight: 600; }
        .legal-body a { color: var(--color-secondary); font-weight: 500; text-decoration: underline; text-underline-offset: 2px; }
        .legal-body ul { margin: 0 0 1rem 0; padding-left: 1.15rem; }
        .legal-body li { font-size: 0.9375rem; line-height: 1.7; color: var(--color-text-muted); margin-bottom: 0.4rem; list-style-type: disc; }
        .legal-callout-body p { font-size: 0.875rem; margin-bottom: 0.5rem; }
        .legal-callout-body p:last-child { margin-bottom: 0; }
        .legal-callout-body ul { margin: 0.35rem 0 0 0; padding-left: 1.1rem; }
        .legal-callout-body li { font-size: 0.875rem; margin-bottom: 0.25rem; list-style-type: disc; }

        /* Tables scroll inside their own box. A 4-column warranty matrix at
           360px wide would otherwise push the whole document sideways. */
        .legal-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          margin: 0.5rem 0 1rem;
          -webkit-overflow-scrolling: touch;
        }
        .legal-table { width: 100%; border-collapse: collapse; min-width: 560px; font-size: 0.875rem; }
        .legal-table th {
          text-align: left;
          background: rgba(10,37,64,0.045);
          color: var(--color-secondary);
          font-weight: 600;
          font-size: 0.75rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          padding: 0.7rem 0.9rem;
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }
        .legal-table td {
          padding: 0.8rem 0.9rem;
          border-bottom: 1px solid rgba(226,229,234,0.7);
          color: var(--color-text-muted);
          line-height: 1.6;
          vertical-align: top;
        }
        .legal-table tr:last-child td { border-bottom: none; }
        .legal-table td:first-child { color: var(--color-secondary); font-weight: 500; }

        .payer-pill {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          white-space: nowrap;
        }

        /* Sticky contents rail. Hidden below lg — at that width it would eat
           the whole first screen before a single clause was visible. */
        .legal-toc {
          position: sticky;
          top: 7.5rem;
          max-height: calc(100vh - 9rem);
          overflow-y: auto;
        }
        .legal-toc a {
          display: block;
          font-size: 0.8125rem;
          line-height: 1.45;
          color: var(--color-text-muted);
          padding: 0.3rem 0.6rem;
          border-left: 2px solid transparent;
          border-radius: 0 0.25rem 0.25rem 0;
          transition: color .18s ease, border-color .18s ease, background .18s ease;
        }
        .legal-toc a:hover {
          color: var(--color-secondary);
          border-left-color: var(--color-primary);
          background: rgba(245,166,35,0.07);
        }
        /* Scroll-spy: the clause currently being read. Deliberately stronger
           than :hover — hover is a pointer that happens to be passing over an
           entry, this is where the reader actually is, and with 27 clauses in
           this rail the two are regularly on screen at the same time. */
        .legal-toc a.is-active {
          color: var(--color-secondary);
          font-weight: 600;
          border-left-color: var(--color-primary);
          background: rgba(245,166,35,0.13);
        }
        .legal-toc a.is-active .toc-num { color: var(--color-primary-text); }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255,255,255,0.82);
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 999px;
          padding: 0.3rem 0.75rem;
        }

        /* Worked-example blocks. Slightly inset from the section body so the
           two examples read as specimens rather than as more clauses. */
        .worked-example {
          border-radius: 0.875rem;
          border: 1px solid var(--color-border);
          background: rgba(255,255,255,0.55);
          padding: 1.1rem 1.25rem;
          margin: 1rem 0;
        }
        .worked-example > p:first-child { margin-bottom: 0.75rem; }

        @media (prefers-reduced-motion: reduce) {
          .legal-toc a { transition: none !important; }
        }

        /* ── Print / PDF ──────────────────────────────────────────────────
           Terms of supply get printed and attached to a work order more often
           than any other page on this site. Printed without this block they
           carry the fixed site header across page one, a full-bleed navy
           masthead, the navy site footer, and — worst — 15rem of empty gutter
           down EVERY page, because a grid column still occupies its track when
           its only child is sticky and has scrolled away.

           The OEM warranty URLs printing in full matters more here than
           anywhere: a customer filing this document needs to be able to reach
           Waaree, Adani and UTL without the live page in front of them.

           Print-only. Nothing here affects screen rendering.
           ⚠ Mirror of the block in PrivacyPolicy.jsx — keep the two in step. */
        @media print {
          /* Navigation chrome has no meaning on paper. */
          .site-nav,
          footer,
          .legal-toc,
          .print-hide { display: none !important; }

          /* zoom:0.93 compounds with the printer's own scale factor and drops
             body copy below comfortable reading size on paper. */
          .page-scale { zoom: 1 !important; }

          /* Collapse the two-column shell to a single flow. */
          .legal-grid { display: block !important; }

          /* Tints and status pills carry meaning — the OEM / Gurukrupa /
             Customer payer pills are the whole point of the cost table — so
             keep colour rather than letting the print engine drop backgrounds. */
          .gps-root {
            background: #fff !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Reversed-out navy becomes ink on white. A full-bleed dark block is
             unreadable in greyscale and empties a cartridge for nothing. */
          .legal-masthead { background: #fff !important; }
          .legal-masthead h1,
          .legal-masthead p,
          .legal-masthead span { color: #0A2540 !important; }
          .legal-masthead .hero-pill {
            background: transparent !important;
            border-color: #C9CDD4 !important;
            color: #33404F !important;
          }

          /* Keep the border for structure; drop the lift, which prints as a
             grey smear rather than a shadow. */
          .legal-card {
            background: #fff !important;
            box-shadow: none !important;
            border-color: #D4D8DE !important;
          }

          /* A heading stranded at the foot of a page is the classic print
             defect. Deliberately NOT setting break-inside on .legal-card —
             several clauses run longer than a sheet, and forcing them whole
             would eject a near-empty page before each one. */
          .legal-card h2 { break-after: avoid; page-break-after: avoid; }

          /* Rows and worked examples must not split down the middle. */
          .legal-table-wrap { overflow: visible !important; }
          .legal-table { min-width: 0 !important; }
          .legal-table tr { break-inside: avoid; page-break-inside: avoid; }
          .worked-example { break-inside: avoid; page-break-inside: avoid; }

          /* A link the reader cannot click is useless unless it is spelled
             out — this is what puts the OEM warranty URLs on paper. */
          .legal-body a[href^="http"]::after {
            content: " (" attr(href) ")";
            font-size: 0.75em;
            font-weight: 400;
            word-break: break-all;
          }

          a { color: #0A2540 !important; text-decoration: none; }

          @page { margin: 14mm 12mm; }
        }
      `}</style>

      {/* ── Masthead ──────────────────────────────────────────────────────── */}
      <div className="band-deep legal-masthead relative overflow-hidden">
        <div className="container-site pt-12 pb-14 relative z-10">
          <Link
            to="/"
            className="print-hide focus-ring rounded-md inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <p className="text-xs font-semibold tracking-[0.08em] uppercase text-primary-token mb-3">
            Legal · Terms of Supply
          </p>
          <h1
            className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight max-w-3xl"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            Terms &amp; Conditions
          </h1>
          <p className="text-white/70 max-w-3xl text-base md:text-lg leading-relaxed mb-7">
            The commercial terms on which {COMPANY_NAME} quotes, supplies, installs and
            supports rooftop solar systems in Gujarat — including exactly whose warranty covers
            what, who pays for a replacement, and where our responsibility ends and PGVCL&rsquo;s or
            the Government of India&rsquo;s begins. Written to be read before you buy, not after
            something fails.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <span className="hero-pill"><Clock className="w-3.5 h-3.5" /> Effective {EFFECTIVE_DATE}</span>
            <span className="hero-pill"><FileText className="w-3.5 h-3.5" /> Version {VERSION}</span>
            <span className="hero-pill"><Scale className="w-3.5 h-3.5" /> Jurisdiction: Bhuj, Gujarat</span>
            <span className="hero-pill"><Building2 className="w-3.5 h-3.5" /> On-Grid &amp; Hybrid solar EPC</span>
          </div>
        </div>
      </div>

      <div className="container-site pt-10 lg:pt-12">
        <div className="legal-grid lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">

          {/* ── Contents rail ───────────────────────────────────────────── */}
          <nav className="hidden lg:block" aria-label="Contents">
            <div className="legal-toc" ref={railRef}>
              <p className="text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-eyebrow-token mb-3 px-2">
                On this page
              </p>
              <ol>
                {TOC.map((item) => {
                  const isActive = item.id === activeId;
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`focus-ring${isActive ? ' is-active' : ''}`}
                        /* `location` rather than `true`: this is a pointer to a
                           place within the current page, not a claim that the
                           link IS the current page. */
                        aria-current={isActive ? 'location' : undefined}
                      >
                        <span className="toc-num text-muted-token/60 tabular-nums mr-1.5">{CLAUSE_NO[item.id]}.</span>
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ol>
            </div>
          </nav>

          {/* ── Clauses ─────────────────────────────────────────────────── */}
          <div className="min-w-0 space-y-5">

            {/* Summary card — the four things most people are actually here for. */}
            <div className="legal-card">
              <p className="text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-eyebrow-token mb-3">
                The short version
              </p>
              <h2
                className="text-lg md:text-xl font-semibold text-secondary-token mb-4"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              >
                Four things worth knowing before you read the rest
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  {
                    icon: <ShieldCheck className="w-4 h-4" />,
                    title: 'Product warranties are the manufacturer’s',
                    body: 'Panels and inverters are warranted by Waaree, Adani, UTL, Solaryaan or Polycab — not by us. We register and chase every claim for you at no charge, but we are not the warrantor.',
                  },
                  {
                    icon: <Truck className="w-4 h-4" />,
                    title: 'A free replacement is free material only',
                    body: 'The OEM supplies the part at no cost. Un-mounting, re-installation labour and freight are yours to bear after the first year. Nobody in this industry pays those for you.',
                  },
                  {
                    icon: <Landmark className="w-4 h-4" />,
                    title: 'PGVCL and the subsidy run on their own clock',
                    body: 'We file the applications and stay on the file. We cannot commit to a date for a feasibility approval, a net meter, or a subsidy credit, because none of those three are ours to give.',
                  },
                  {
                    icon: <CloudLightning className="w-4 h-4" />,
                    title: 'Warranties cover defects, not weather',
                    body: 'Hail, cyclone, lightning surge, monkeys and theft are excluded by every OEM in this market. That gap is closed with insurance, and we will tell you so in writing.',
                  },
                ].map((c) => (
                  <div
                    key={c.title}
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(10,37,64,0.035)', border: '1px solid rgba(10,37,64,0.09)' }}
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-secondary-token mb-1.5">
                      <span className="text-primary-token flex-shrink-0" aria-hidden="true">{c.icon}</span>
                      {c.title}
                    </p>
                    <p className="text-[0.8125rem] leading-relaxed text-muted-token">{c.body}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-token mt-4 leading-relaxed">
                This summary is a reading aid. It does not replace the clauses below, and where the
                two differ, the clauses govern.
              </p>
            </div>

            <Section
              id="scope"
              title="Scope & acceptance"
              icon={<FileText className="w-4 h-4" />}
              lead={`These terms govern your use of this website and the commercial relationship between you and ${COMPANY_NAME} for the supply and installation of rooftop solar systems.`}
            >
              <p>
                By using this website, submitting an enquiry, requesting a quotation or accepting a
                proposal from us, you agree to these terms. If you do not agree with them, please do
                not use the quotation tool or proceed with an order.
              </p>
              <p>
                We are a solar EPC contractor operating in Gujarat, supplying On-Grid and Hybrid
                systems to residential, commercial and institutional customers, primarily within the
                PGVCL licence area.
              </p>
              <p>
                You agree that acceptance given electronically — by email, WhatsApp, or by signing a
                digital copy — is as binding as a wet signature, in accordance with the Information
                Technology Act, 2000.
              </p>
              <Callout
                tone="info"
                icon={<Info className="w-4 h-4" />}
                title="Where a signed work order exists, it prevails"
              >
                <p>
                  These terms apply to everyone who uses the site. Once you place an order, the
                  signed work order, its annexures and the technical specification sheet become the
                  contract for that installation. Where a work order says something different from
                  this page, <strong>the work order governs</strong> — and if it is silent, this page
                  fills the gap.
                </p>
              </Callout>
            </Section>

            <Section
              id="definitions"
              title="Definitions"
              icon={<ListChecks className="w-4 h-4" />}
              lead="Terms used throughout this document, in the sense the industry uses them."
            >
              <ul>
                <li><strong>OEM</strong> — Original Equipment Manufacturer. The company that made a component and issued its warranty: Waaree or Adani for modules, UTL, Solaryaan or Polycab for inverters.</li>
                <li><strong>EPC</strong> — Engineering, Procurement and Construction. Our role: we design the system, buy the components, and install and commission them.</li>
                <li><strong>DISCOM / PGVCL</strong> — the electricity distribution company. Across Kutch and western Gujarat this is Paschim Gujarat Vij Company Limited.</li>
                <li><strong>Net metering</strong> — the arrangement under which a bidirectional meter, supplied and owned by the DISCOM, records both the units you draw and the units you export.</li>
                <li><strong>Commissioning</strong> — the point at which the installed system has passed DISCOM inspection, the net meter is in place, and the system is formally energised. Warranty periods run from this date.</li>
                <li><strong>PM Surya Ghar / CFA</strong> — the Central Financial Assistance paid under the PM Surya Ghar: Muft Bijli Yojana, credited to an eligible residential consumer&rsquo;s bank account after commissioning.</li>
                <li><strong>DCR</strong> — Domestic Content Requirement. Modules with both cells and modules made in India, a hard eligibility condition for the residential subsidy.</li>
                <li><strong>ALMM</strong> — the Approved List of Models and Manufacturers maintained by the Ministry of New and Renewable Energy.</li>
                <li><strong>STC</strong> — Standard Test Conditions. The laboratory reference conditions against which a module&rsquo;s rated output is measured, and against which performance warranties are assessed.</li>
                <li><strong>On-site warranty</strong> — a warranty under which the manufacturer&rsquo;s own engineer attends your premises. <strong>Carry-in warranty</strong> — one under which the item must be delivered to the manufacturer&rsquo;s service centre. The difference decides who pays freight, and it is stated on your certificate.</li>
              </ul>
            </Section>

            <Section
              id="estimates"
              title="Online estimates are non-binding"
              icon={<Receipt className="w-4 h-4" />}
              lead="The figure our quotation tool returns is a preliminary estimate. It is not an offer, a contract, or a price we are bound to hold."
            >
              <p>
                Our calculator sizes a system from the inputs you provide — your bill figures,
                appliance list or backup requirement — and prices it against standard component
                rates. It is designed to give you an honest order of magnitude in sixty seconds, and
                it is deliberately built to show the subsidy already deducted so you see a net
                figure rather than a headline one.
              </p>
              <p>What it cannot do is see your roof. The actual price depends on:</p>
              <ul>
                <li>Roof structure, orientation, available shadow-free area and load-bearing capacity.</li>
                <li>Shading from adjacent buildings, parapets, water tanks and trees.</li>
                <li>Cable route length from the array to your distribution board, and the condition of that board.</li>
                <li>Your sanctioned load and connection phase, which cap the capacity PGVCL will approve.</li>
                <li>Structure height and any elevated or non-standard mounting your roof requires.</li>
                <li>Prevailing component and freight prices on the date of order.</li>
              </ul>
              <p>
                A <strong>physical site survey by our engineer is required before any firm price is
                issued.</strong> Until then, treat every number on this website — including
                generation and savings figures — as indicative.
              </p>
            </Section>

            <Section
              id="survey"
              title="Site survey & final proposal"
              icon={<HardHat className="w-4 h-4" />}
              lead="The survey is where the estimate becomes a price, and where we tell you if your roof is not suitable."
            >
              <p>
                We will survey the site, measure the usable area, assess shading across the day,
                check the sanctioned load on your electricity bill and inspect the earthing and
                distribution board. You then receive a written proposal listing the exact make and
                model of every major component, the structure specification, the scope of work, the
                price, the payment schedule and the expected timeline.
              </p>
              <p>
                If the survey shows your roof cannot carry the system, that the shadow-free area is
                insufficient, or that your sanctioned load will not support the capacity you want, we
                will say so and tell you what would need to change. We would rather lose an order
                than install a system that will underperform for twenty-five years.
              </p>
              <p>
                A proposal is open for acceptance for the period stated on it. After that it lapses
                and requires re-pricing, because component costs move.
              </p>
            </Section>

            <Section
              id="pricing"
              title="Pricing, taxes & payment"
              icon={<IndianRupee className="w-4 h-4" />}
              lead="Prices are quoted in Indian Rupees and are valid for the period stated on the proposal."
            >
              <ul>
                <li><strong>Taxes.</strong> GST is charged at the rate applicable to solar power generating systems and to the services element on the date of invoice, and is shown separately on the invoice. Where a statutory rate changes between order and invoice, the rate in force on the invoice date applies.</li>
                <li><strong>Payment schedule.</strong> As set out in the work order — typically an advance against order, a stage payment against material delivery at site, and the balance on commissioning. We do not begin procurement against an unpaid order.</li>
                <li><strong>The subsidy is not a discount.</strong> We will never adjust the PM Surya Ghar amount against your invoice or offer it to you upfront. You pay the full contracted price; the Government credits the subsidy directly to your bank account after commissioning. Anyone offering it as an upfront discount has priced a risk they do not control and moved it to you.</li>
                <li><strong>Delayed payment.</strong> Material stored at our premises beyond the agreed schedule, and work held at your instruction, remain at your cost and risk.</li>
                <li><strong>Price validity.</strong> Where the order is delayed beyond the proposal validity for reasons not attributable to us, the price is subject to revision against prevailing component costs.</li>
              </ul>

              <Callout tone="stop" icon={<Lock className="w-4 h-4" />} title="Pay the company, never an individual">
                <p>
                  All payments must be made to the {COMPANY_NAME} bank account named on your invoice,
                  by cheque, NEFT, RTGS or UPI, and you must receive a GST invoice or a numbered
                  receipt for every payment.
                </p>
                <p>
                  <strong>
                    Do not pay cash into any personal account, to any individual&rsquo;s UPI handle, or
                    to any account not printed on our invoice
                  </strong>{' '}
                  — not to an employee, not to a technician, not to anyone introducing themselves as
                  our agent. We take no responsibility for money paid outside this method. If anyone
                  asks you to, call us on{' '}
                  <a href={PHONE_HREF} className="focus-ring">{PHONE_DISPLAY}</a> before paying.
                </p>
              </Callout>
            </Section>

            <Section
              id="scope-of-supply"
              title="Scope of supply & exclusions"
              icon={<Wrench className="w-4 h-4" />}
              lead="Our price covers what is listed in the work order. These items commonly sit outside it."
            >
              <p>
                Unless your work order expressly includes them, the following are excluded and, where
                needed, are charged separately or arranged by you:
              </p>
              <ul>
                <li>Civil work — foundations, pedestals, waterproofing, roof repair or strengthening.</li>
                <li>Upgrading the existing distribution board, earthing pit or internal wiring where it is found unfit at survey.</li>
                <li>Any charge levied by PGVCL: application, processing, meter, testing, security deposit or load-enhancement fees.</li>
                <li>Charges for enhancement of sanctioned load, or for converting a single-phase connection to three-phase.</li>
                <li>Tree cutting or removal of any obstruction causing shading, including obtaining permission for it.</li>
                <li>Lightning protection beyond the standard earthing and SPD scope stated in the work order.</li>
                <li>Fencing, module cleaning systems, remote monitoring subscriptions beyond the included term, and DG interfacing.</li>
                <li>Storage of material at site, and site security, once material has been delivered and accepted.</li>
              </ul>
            </Section>

            <Section
              id="title-risk"
              title="Title, risk & site readiness"
              icon={<Package className="w-4 h-4" />}
              lead="When the equipment becomes yours, when it becomes your risk, and what happens if the site is not ready for us."
            >
              <ul>
                <li><strong>Title.</strong> Ownership of the supplied equipment passes to you on receipt of payment in full. Until then the material remains our property, even where it is already at your site.</li>
                <li><strong>Risk.</strong> Risk of loss or damage passes to you on delivery of material to your site. From that point the material is in your custody, and we recommend you confirm your property insurance covers material stored on site before installation completes.</li>
                <li><strong>Site readiness.</strong> You are responsible for providing clear, safe roof access, a temporary power supply, a water point, and space to store material securely. Where our team attends and cannot work because the site is not ready, that visit is chargeable and the schedule moves.</li>
                <li><strong>Delays not attributable to us.</strong> Timelines quoted assume approvals arrive, the site is available and payments are on schedule. We are not liable for delay caused by DISCOM processing, subsidy portal processing, your own scheduling, or force majeure under clause {clauseNo('force-majeure')}.</li>
                <li><strong>Damage to existing structure.</strong> Installation involves drilling and fixing to your roof. We work to standard practice and make good our own penetrations, but we do not accept liability for pre-existing defects in the building, or for latent weakness in a structure we were not asked to certify.</li>
                <li><strong>Our personnel.</strong> Our technicians remain our responsibility, including their statutory entitlements and safety at your site. You are asked to keep the working area clear of children, animals and obstruction while work is in progress.</li>
              </ul>
            </Section>

            {/* ── The warranty block. The reason this page exists. ────────── */}
            <Section
              id="warranty-structure"
              title="Warranty structure — two separate things"
              icon={<Shield className="w-4 h-4" />}
              lead="Your system carries two distinct warranties from two distinct parties. Confusing them is the single most common cause of dispute in this industry."
            >
              <div className="grid sm:grid-cols-2 gap-3 my-4">
                <div className="rounded-xl p-4" style={{ background: 'rgba(30,158,99,0.07)', border: '1px solid rgba(30,158,99,0.22)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#15784B' }}>
                    Issued by the OEM
                  </p>
                  <p className="text-sm font-semibold text-secondary-token mb-1.5">Product &amp; performance warranties</p>
                  <p className="text-[0.8125rem] leading-relaxed text-muted-token">
                    Cover the equipment itself — manufacturing defects and guaranteed power output.
                    The contract is between you and the manufacturer, evidenced by the warranty
                    certificate issued against your serial numbers.
                  </p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'rgba(245,166,35,0.10)', border: '1px solid rgba(245,166,35,0.30)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1.5 text-eyebrow-token">
                    Issued by us
                  </p>
                  <p className="text-sm font-semibold text-secondary-token mb-1.5">Workmanship warranty — 1 year</p>
                  <p className="text-[0.8125rem] leading-relaxed text-muted-token">
                    Covers our own work: mounting, wiring, terminations, earthing, structure erection
                    and commissioning. Runs for one year from the commissioning date.
                  </p>
                </div>
              </div>

              <p>
                <strong>
                  {COMPANY_NAME} is not the warrantor of any manufactured product we supply, and does
                  not guarantee, underwrite, extend or assume the obligations of any OEM warranty.
                </strong>{' '}
                The product and performance warranties on your panels are Waaree&rsquo;s or
                Adani&rsquo;s; the warranty on your inverter is UTL&rsquo;s, Solaryaan&rsquo;s or
                Polycab&rsquo;s. Those warranties are governed entirely by the terms, conditions and
                exclusions in the certificate the manufacturer issues, and are subject to that
                manufacturer remaining in business and honouring them.
              </p>
              <p>
                This is precisely why we specify established, ALMM-listed brands rather than whatever
                is cheapest in a given quarter. A thirty-year warranty is worth what the company
                behind it is worth.
              </p>

              <Callout tone="good" icon={<BadgeCheck className="w-4 h-4" />} title="What we do commit to">
                <p>
                  We are not the warrantor, but we are your route to it. For the entire warranty
                  life of your system — not just the first year — we will register your claim,
                  assemble the technical evidence pack the OEM requires, submit it, follow the file
                  and keep you informed. <strong>We do not charge for warranty coordination.</strong>
                </p>
                <p>
                  At handover you receive the commissioning report, every OEM warranty certificate,
                  a serial-number register of the installed equipment, the electrical layout and the
                  operation and maintenance instructions. Keep them — a claim is filed against the
                  serial number, and manufacturers will not log a complaint without the warranty
                  document.
                </p>
              </Callout>
            </Section>

            <Section
              id="oem-warranties"
              title="OEM warranty periods"
              icon={<Clock className="w-4 h-4" />}
              lead="Indicative terms for the components we most commonly supply. The certificate issued against your serial numbers is the governing document."
            >
              <div className="legal-table-wrap">
                <table className="legal-table">
                  <thead>
                    <tr>
                      <th scope="col">Component</th>
                      <th scope="col">Typical makes</th>
                      <th scope="col">Product warranty (defects)</th>
                      <th scope="col">Performance warranty (output)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WARRANTY_ROWS.map((r) => (
                      <tr key={r.component}>
                        <td>{r.component}</td>
                        <td>{r.brands}</td>
                        <td>{r.product}</td>
                        <td>{r.performance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Callout
                tone="warn"
                icon={<AlertTriangle className="w-4 h-4" />}
                title="A 30-year panel is not defect-covered for 30 years"
              >
                <p>
                  This is the distinction the market routinely blurs, so we will be explicit. A solar
                  module carries two clocks:
                </p>
                <ul>
                  <li>
                    The <strong>performance warranty</strong> (25 to 30 years) guarantees a minimum
                    power output at points along a degradation curve — typically no worse than about
                    0.4 to 0.5% loss per year after the first.
                  </li>
                  <li>
                    The <strong>product warranty</strong> (10 to 12 years) is the one that covers
                    physical manufacturing defects: delamination, junction box failure, frame or cell
                    defects.
                  </li>
                </ul>
                <p>
                  A module that physically fails in year 15 is outside its product warranty even
                  though its performance warranty still has 15 years to run. Any quotation that
                  advertises &ldquo;30 years warranty&rdquo; without saying which one is quoting you
                  the longer number.
                </p>
              </Callout>

              <Callout
                tone="warn"
                icon={<Clock className="w-4 h-4" />}
                title="Old stock can void a warranty before you switch it on"
              >
                <p>
                  UTL states that its warranty is valid only where the{' '}
                  <strong>purchase date falls within 180 days of the manufacturing date</strong>{' '}
                  printed on the product or invoice. Other manufacturers apply comparable conditions.
                  A unit that sat in a distributor&rsquo;s godown for a year can therefore arrive with
                  materially less cover than you were told, and you would have no way of knowing.
                </p>
                <p>
                  We supply current-production stock and the manufacturing date is verifiable on the
                  equipment and on our purchase invoice. <strong>Ask any installer for it</strong> —
                  including us — and register your product with the OEM promptly after commissioning.
                  We do this registration for you as part of handover.
                </p>
              </Callout>

              <p>Official manufacturer warranty and service resources:</p>
              <ul>
                {OEM_LINKS.map((l) => (
                  <li key={l.href}>
                    <strong>{l.brand}</strong> — {l.detail}:{' '}
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="focus-ring">
                      {l.display} <ExternalLink className="w-3 h-3 inline align-baseline" aria-hidden="true" />
                    </a>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </li>
                ))}
              </ul>
              <p className="text-[0.8125rem]">
                These links are provided for your convenience and point to pages operated by the
                manufacturers, not by us. Their content, availability and the commercial terms
                published on them are controlled by the respective manufacturer and may change
                without notice to us. Warranty periods also vary by product series and by date of
                manufacture, so verify the term applicable to your own system against your own
                certificate.
              </p>
            </Section>

            <Section
              id="claim-process"
              title="How a warranty claim actually works"
              icon={<ListChecks className="w-4 h-4" />}
              lead="The sequence, the realistic timeline, and which stages we control."
            >
              <p>
                Report any suspected fault to us first, not to the manufacturer. We hold the
                commissioning record and the serial-number register, and a claim filed without the
                supporting technical evidence and the warranty document is usually returned unlogged.
              </p>

              <div className="legal-table-wrap">
                <table className="legal-table">
                  <thead>
                    <tr>
                      <th scope="col">Stage</th>
                      <th scope="col">Handled by</th>
                      <th scope="col">Typical time</th>
                      <th scope="col">What happens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CLAIM_STAGES.map((s) => (
                      <tr key={s.stage}>
                        <td>{s.stage}</td>
                        <td>{s.who}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{s.time}</td>
                        <td>{s.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Callout tone="warn" icon={<Clock className="w-4 h-4" />} title="Realistic end-to-end: roughly five to nine weeks">
                <p>
                  <strong>OEM technical evaluation takes 15 to 30 days</strong> from the date the
                  claim is registered. If replacement is approved,{' '}
                  <strong>transportation and dispatch add a further 7 to 15 days.</strong> With
                  inspection and re-installation either side of that, a straightforward approved
                  claim runs about five to nine weeks from your first call.
                </p>
                <p>
                  Those two OEM stages are indicative timelines published by the manufacturers, not
                  commitments given by us. They stretch during peak season, at quarter-end, and
                  where a product series has been discontinued and stock has to be located. We cannot
                  accelerate them, and we do not accept liability for them — but we will tell you
                  where the file actually stands whenever you ask.
                </p>
              </Callout>

              <p>
                Where a claim is rejected by the OEM, we will give you the manufacturer&rsquo;s stated
                reason in writing along with a quotation to replace the component at cost, so you can
                decide what to do with a complete picture.
              </p>
            </Section>

            <Section
              id="claim-costs"
              title="Who pays for what during a claim"
              icon={<IndianRupee className="w-4 h-4" />}
              lead="&ldquo;Free replacement&rdquo; means free material. It has never meant free labour or free freight — here is the full breakdown, before you buy."
            >
              <div className="legal-table-wrap">
                <table className="legal-table">
                  <thead>
                    <tr>
                      <th scope="col">Cost item</th>
                      <th scope="col">Borne by</th>
                      <th scope="col">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COST_ROWS.map((r) => {
                      const m = PAYER_META[r.payer];
                      return (
                        <tr key={r.item}>
                          <td>{r.item}</td>
                          <td>
                            <span
                              className="payer-pill"
                              style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}
                            >
                              {m.label}
                            </span>
                          </td>
                          <td>{r.note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p>
                In short: <strong>the OEM provides approved replacement material free of cost. You
                bear un-mounting, re-installation labour and transportation freight.</strong> During
                the first year our workmanship warranty absorbs the labour and the visit; after that,
                standard service and visit charges apply and will be quoted to you before any work
                begins. We will not carry out chargeable work without your approval of the estimate.
              </p>

              <Callout tone="good" icon={<Info className="w-4 h-4" />} title="One exception in your favour: on-site warranties">
                <p>
                  Where a component carries an <strong>on-site</strong> warranty, the manufacturer&rsquo;s
                  own engineer attends your premises and that visit is the OEM&rsquo;s cost, not yours.
                  UTL on-grid inverters carry on-site cover as standard, with tiered support that
                  starts remotely before an engineer is dispatched.
                </p>
                <p>
                  Module warranties are generally <strong>carry-in</strong>, which is why the freight
                  line above falls to the customer. Check which type applies to each component — it
                  is stated on your certificate, and we will confirm it in writing at handover.
                </p>
              </Callout>
            </Section>

            <Section
              id="claim-example"
              title="Worked examples — a panel claim and an inverter claim"
              icon={<Zap className="w-4 h-4" />}
              lead="Two residential scenarios, day by day, with every cost attributed. They behave differently, and the difference is worth understanding before you need it."
            >
              <div className="worked-example">
                <p className="text-sm font-semibold text-secondary-token">
                  Example A — solar panels, 3 kW On-Grid system in Bhuj, year 6
                </p>
                <p>
                  The customer notices generation down roughly a third against the same month last
                  year. They call us on a Monday.
                </p>
                <ul>
                  <li><strong>Day 0.</strong> Fault reported by phone. We log it against the commissioning record.</li>
                  <li><strong>Day 2.</strong> Remote triage rules out an inverter fault and a grid supply issue — the inverter is reporting low string voltage on one of two strings.</li>
                  <li><strong>Day 5.</strong> Site visit. String and IV measurements confirm two modules underperforming well outside the warranted degradation curve. We photograph them, capture the serial numbers, and record the readings. <em>Site visit charged at our standard rate, as year one has passed.</em></li>
                  <li><strong>Day 7.</strong> Claim registered with the module OEM; evidence pack and warranty certificate submitted.</li>
                  <li><strong>Day 7 – 37.</strong> OEM technical evaluation — <strong>15 to 30 days</strong>. The manufacturer requires the two modules to be shipped to their service centre. <em>Freight to the service centre is borne by the customer.</em> We arrange transport and share the quote first.</li>
                  <li><strong>Day 37.</strong> Claim approved as a manufacturing defect.</li>
                  <li><strong>Day 37 – 50.</strong> Replacement modules released and dispatched — <strong>7 to 15 days</strong>. <em>Return freight is borne by the customer.</em> The original series is discontinued, so a current-generation module of equal or higher rating is supplied — standard practice, and permitted under the warranty.</li>
                  <li><strong>Day 52.</strong> Our technician un-mounts the faulty modules, installs the replacements, re-terminates and re-tests the string, and confirms output. <em>Un-mounting, re-installation labour and the visit charge are borne by the customer.</em> The two replacement modules themselves cost the customer nothing.</li>
                </ul>
              </div>

              <div className="worked-example">
                <p className="text-sm font-semibold text-secondary-token">
                  Example B — on-grid inverter, 5 kW system, year 4, UTL unit under on-site warranty
                </p>
                <p>
                  The system stops exporting overnight. The inverter display shows a fault code and
                  generation has gone to zero — a total outage rather than a gradual decline.
                </p>
                <ul>
                  <li><strong>Day 0.</strong> Fault reported. We check whether the grid supply and the AC isolator are healthy before touching the inverter.</li>
                  <li><strong>Day 1.</strong> Remote triage. The manufacturer&rsquo;s support runs in tiers — chatbot, then a WhatsApp video call with their engineer — and a good proportion of inverter faults are resolved at this stage without anyone attending. <em>No cost.</em></li>
                  <li><strong>Day 2.</strong> Not resolved remotely. We register the complaint on the OEM&rsquo;s service portal with the serial number, installation date and the warranty document, which the manufacturer requires before the complaint will be logged at all.</li>
                  <li><strong>Day 4 – 10.</strong> The manufacturer&rsquo;s service engineer attends site under the on-site warranty. <em>This visit is the OEM&rsquo;s cost, not yours</em> — the main practical difference from Example A.</li>
                  <li><strong>Day 10 – 40.</strong> The board is found faulty and the unit is taken in for evaluation — <strong>15 to 30 days</strong>. Where the unit must go to the factory rather than a regional service centre, this is the stage that stretches.</li>
                  <li><strong>Day 40 – 52.</strong> Repaired or replaced unit dispatched — <strong>7 to 15 days</strong>. Under an on-site warranty the freight on the unit is generally the manufacturer&rsquo;s; under a carry-in warranty it would be yours. Confirm which applies from your certificate.</li>
                  <li><strong>Day 53.</strong> Re-installation, re-configuration of the grid settings, and re-commissioning. <em>Our labour and visit charge apply, as year one has passed</em> — unless the OEM engineer completes the refit under the on-site warranty, in which case there is nothing for us to charge.</li>
                </ul>
                <p className="text-[0.8125rem]">
                  Note the two differences that matter. An inverter failure stops{' '}
                  <strong>all</strong> generation, so downtime costs you more than two weak modules
                  do — report it the same day. And because the inverter is the component most likely
                  to need replacing within the system&rsquo;s life, its warranty type and length
                  deserve more of your attention at quotation stage than the panel headline number
                  usually gets.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 my-4">
                {[
                  { label: 'Customer typically pays', value: 'Freight on carry-in items, un-mounting and re-installation labour, our visit charge after year 1', tone: 'rgba(245,166,35,0.10)', border: 'rgba(245,166,35,0.30)', color: '#9C6509' },
                  { label: 'OEM pays', value: 'Replacement material, testing and evaluation, and the engineer visit where cover is on-site', tone: 'rgba(30,158,99,0.08)', border: 'rgba(30,158,99,0.24)', color: '#15784B' },
                  { label: 'We charge nothing for', value: 'Claim filing, evidence pack, portal registration and OEM follow-up — for the life of the warranty', tone: 'rgba(10,37,64,0.05)', border: 'rgba(10,37,64,0.14)', color: '#0A2540' },
                ].map((b) => (
                  <div key={b.label} className="rounded-xl p-4" style={{ background: b.tone, border: `1px solid ${b.border}` }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: b.color }}>{b.label}</p>
                    <p className="text-[0.8125rem] leading-relaxed text-muted-token">{b.value}</p>
                  </div>
                ))}
              </div>

              <p>
                Both examples are illustrative. Actual timelines and costs depend on the
                manufacturer, the component, stock availability, your site&rsquo;s accessibility and
                the distance to the nearest service point. They are set out here so that nobody
                discovers the shape of it for the first time in year six.
              </p>
            </Section>

            <Section
              id="not-covered"
              title="What OEM warranties do not cover"
              icon={<XCircle className="w-4 h-4" />}
              lead="Every product warranty in this market covers manufacturing defects. None of them cover the events below — this is universal, not particular to us."
            >
              <div className="grid sm:grid-cols-2 gap-3 my-4">
                {EXCLUSION_GROUPS.map((g) => (
                  <div
                    key={g.title}
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(179,38,30,0.045)', border: '1px solid rgba(179,38,30,0.18)' }}
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#B3261E' }}>
                      <span className="flex-shrink-0" aria-hidden="true">{g.icon}</span>
                      {g.title}
                    </p>
                    <ul className="space-y-1">
                      {g.items.map((it) => (
                        <li key={it} className="text-[0.8125rem] leading-relaxed text-muted-token pl-3.5 relative">
                          <span className="absolute left-0 top-[0.55em] w-1 h-1 rounded-full" style={{ background: 'rgba(179,38,30,0.45)' }} aria-hidden="true" />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p>
                Also excluded across the board: normal, warranted degradation of output over time;
                cosmetic marking that does not affect performance or safety; consumables and wear
                items; and cover voided by conditions in the OEM&rsquo;s own certificate, such as the
                purchase-to-manufacture window described in clause {clauseNo('oem-warranties')}. Our
                own one-year workmanship warranty carries the same exclusions — it covers our work,
                not events acting on it.
              </p>
            </Section>

            <Section
              id="insurance"
              title="Insurance — how you close the gap"
              icon={<Siren className="w-4 h-4" />}
              lead="A rooftop solar system is a lakh-scale asset sitting outdoors in a region that gets cyclones, hail and dust storms. Warranty is not insurance, and it was never designed to be."
            >
              <p>
                We strongly advise every customer to arrange <strong>All-Risk cover for the solar
                installation</strong>, either as an add-on endorsement to an existing householder&rsquo;s
                or fire policy, or as a standalone policy. For commercial sites, extend the existing
                property or industrial policy to name the rooftop asset explicitly.
              </p>
              <p>Cover worth asking your insurer about specifically:</p>
              <ul>
                <li>Storm, cyclone, hail and wind damage — the primary exposure on the Kutch coast.</li>
                <li>Lightning strike and consequential electrical surge damage to the inverter.</li>
                <li>Theft of modules and cabling, and malicious damage.</li>
                <li>Impact damage, including from animals and birds.</li>
                <li>Flood and inundation, where the inverter or LT panel is at a low level.</li>
                <li>Loss of generation / business interruption, if the site is commercial.</li>
              </ul>
              <Callout tone="info" icon={<Info className="w-4 h-4" />} title="We do not sell insurance">
                <p>
                  {COMPANY_NAME} is not an insurance intermediary, is not licensed to advise on
                  insurance, and receives no commission from any insurer. This clause is a technical
                  recommendation about a real, uncovered risk, not a financial recommendation. Speak
                  to your own insurer or a licensed broker, and read what the policy actually
                  excludes. We are happy to supply the technical asset details, invoice values and
                  commissioning documentation your insurer will ask for.
                </p>
              </Callout>
            </Section>

            <Section
              id="net-metering"
              title="Net metering & PGVCL approvals"
              icon={<Landmark className="w-4 h-4" />}
              lead="We prepare and file your application and stay on the file to completion. We do not control the outcome or the timeline, because neither belongs to us."
            >
              <p>
                Rooftop solar with net metering is a permissioned activity. The sequence is fixed:
                register the application, obtain technical feasibility approval from PGVCL, install
                only after that approval, then apply for inspection, then meter installation and the
                net metering agreement. We handle the paperwork at each stage.
              </p>
              <p>What sits outside our control, and therefore outside our liability:</p>
              <ul>
                <li><strong>Feasibility rejection or capacity reduction.</strong> PGVCL assesses your sanctioned load, connection phase and whether the distribution transformer serving you has headroom. A refusal is usually about network capacity, not about you or about us.</li>
                <li><strong>Scheduling of inspection.</strong> The queue is set by the DISCOM and lengthens during periods of high scheme uptake.</li>
                <li><strong>Bidirectional meter availability.</strong> The net meter is supplied, installed, sealed and owned by PGVCL. Meter shortages are a recurring reality in Gujarat and can hold a completed installation for weeks. No installer can fit this meter themselves, and anyone offering to has misunderstood the process.</li>
                <li><strong>Changes to regulation.</strong> GERC tariff orders, settlement rules, capacity caps in relation to sanctioned load, and DISCOM procedure can change during your project.</li>
                <li><strong>DISCOM charges.</strong> Application, processing, meter, testing and security deposit charges are levied by PGVCL and are payable by you.</li>
              </ul>
              <p>
                Where the connection is not in your name, or the sanctioned load is inadequate, those
                must be corrected with PGVCL before the solar application can proceed. That is its own
                timeline and it sits with the consumer, though we will tell you exactly what is needed
                and help you assemble it.
              </p>
            </Section>

            <Section
              id="subsidy"
              title="PM Surya Ghar subsidy"
              icon={<Building2 className="w-4 h-4" />}
              lead="The subsidy is a payment from the Government of India to you. It does not pass through us at any point."
            >
              <p>
                For eligible residential rooftop systems, Central Financial Assistance under the PM
                Surya Ghar: Muft Bijli Yojana is credited{' '}
                <strong>directly to the consumer&rsquo;s own bank account by the Government of India</strong>{' '}
                after the DISCOM has inspected the installation, installed the net meter and the
                commissioning details have been submitted on the national portal.
              </p>
              <p>
                We register the application, install as the declared vendor on your portal
                application, submit the commissioning details and stay with the file through to the
                credit landing. That is the extent of what any installer can do.
              </p>

              <Callout tone="warn" icon={<AlertTriangle className="w-4 h-4" />} title="What we cannot be liable for">
                <ul>
                  <li>Delay in disbursement, whatever its cause or duration.</li>
                  <li>Technical failures, downtime, data errors or processing backlogs on the national portal.</li>
                  <li>Revision, reduction, suspension or withdrawal of the scheme, or changes to the slab amounts, after your order is placed.</li>
                  <li>Rejection arising from information you supplied — an incorrect or unlinked bank account, a name mismatch, or a connection not held in the applicant&rsquo;s name.</li>
                  <li>Exhaustion of scheme funds or budgetary allocation for the period.</li>
                  <li>Any change in eligibility rules between quotation and commissioning.</li>
                </ul>
              </Callout>

              <p>
                <strong>Eligibility conditions we will confirm with you in writing before order:</strong>{' '}
                the connection must be a domestic one held in the applicant&rsquo;s name; the system must
                use DCR-compliant modules; it must be installed by a vendor registered on the national
                portal; it must be net-metered through the DISCOM; and the subsidy is claimable once
                per eligible residential connection. Commercial, industrial and agricultural
                connections are outside the scheme entirely.
              </p>
              <p>
                Any subsidy amount shown in our estimates or proposals is the amount you are expected
                to be eligible for under the scheme as it stands on the date of the document. It is an
                illustration of your net cost — not a discount we are giving, not a sum we hold, and
                not an amount we guarantee you will receive.
              </p>
            </Section>

            <Section
              id="generation"
              title="Generation, savings & EMI figures"
              icon={<Zap className="w-4 h-4" />}
              lead="Generation figures are engineering estimates based on long-run irradiance data for Gujarat. They are not a guaranteed output."
            >
              <p>
                Actual generation varies with weather in a given year, dust accumulation between
                cleanings, ambient temperature, shading that develops after commissioning, grid
                availability, and how promptly faults are reported. A system performing within the
                expected band across a year may still be below estimate in any single month.
              </p>
              <p>
                Savings, payback period and return-on-investment figures shown on this website or in
                our proposals additionally assume that tariffs, consumption patterns and net metering
                settlement rules stay broadly as they are. They are illustrative planning figures, not
                a financial guarantee, and they are not investment advice.
              </p>
              <p>
                <strong>EMI and finance figures</strong> shown by our calculators are arithmetic
                illustrations at an assumed rate and tenure. {COMPANY_NAME} is not a bank, an NBFC,
                a lending agent or a direct selling agent, and we neither arrange nor underwrite
                credit. Any loan is a contract between you and your lender on the terms they offer
                after their own appraisal, and their sanctioned rate, tenure, processing fee and
                eligibility will govern — not our illustration.
              </p>
              <p>
                Where the OEM performance warranty is engaged — that is, where measured output falls
                below the manufacturer&rsquo;s warranted curve — the remedy is the one set out in that
                OEM warranty, claimed through the process in clause {clauseNo('claim-process')}.
              </p>
            </Section>

            <Section
              id="customer-obligations"
              title="Your obligations"
              icon={<CheckCircle2 className="w-4 h-4" />}
              lead="A few things only you can do, most of which affect whether a warranty stays valid."
            >
              <ul>
                <li>Provide accurate information — bill data, sanctioned load, ownership documents and bank details. Applications fail most often on a detail supplied at the start.</li>
                <li>Provide safe access to the roof and site during installation and service, plus a water point and a temporary power supply during installation.</li>
                <li>Ensure the roof and any structure we mount on are structurally sound. We survey for suitability; we do not certify the building.</li>
                <li>Clean the modules as advised — plain water, soft brush, early morning or after sunset, no detergent, no abrasive pads, never onto hot glass. Do not walk on the modules.</li>
                <li>Keep the array free of new shading, and keep the inverter area dry, ventilated and accessible.</li>
                <li>Do not modify, extend, relocate or repair the system, or have anyone other than us or the OEM work on it. This voids both the OEM warranty and ours.</li>
                <li>Retain your warranty certificates, commissioning report and serial-number register. Manufacturers will not log a claim without the warranty document.</li>
                <li>Report faults promptly. A fault left running can turn a covered defect into an excluded consequential failure.</li>
                <li>Keep your DISCOM account current — net metering is tied to the connection, and a disconnected or transferred connection interrupts the arrangement.</li>
              </ul>
            </Section>

            <Section
              id="transfer"
              title="If you sell the property"
              icon={<Building2 className="w-4 h-4" />}
              lead="The system stays with the building, and so — with conditions — does its warranty."
            >
              <ul>
                <li><strong>OEM warranties generally transfer.</strong> Manufacturers typically assign the remaining warranty term to a subsequent owner, provided the equipment stays at its original installation site and has not been tampered with, removed or re-installed. Removing the array and re-erecting it elsewhere generally ends the warranty — check the certificate before you plan any relocation.</li>
                <li><strong>Net metering follows the connection.</strong> The arrangement is tied to the electricity connection, so the buyer must complete the DISCOM&rsquo;s standard name-change process, and the net metering agreement is updated into the new consumer&rsquo;s name as part of it. Administrative rather than difficult, but an agreement left in a former owner&rsquo;s name causes problems at settlement time.</li>
                <li><strong>The subsidy does not transfer, and is not repayable on sale</strong> in the ordinary course — but it is claimable only once per eligible connection, so a buyer cannot claim it again on the same connection.</li>
                <li><strong>Hand over the documents.</strong> Give the buyer the commissioning report, warranty certificates and serial-number register. Without them a future claim is very difficult to file.</li>
                <li><strong>Tell us.</strong> Let us know the new owner&rsquo;s details so our service records stay accurate and we can support them. Our own workmanship warranty, if still running, continues for its remaining term at the same site.</li>
              </ul>
            </Section>

            <Section
              id="communications"
              title="How we contact you, and photography at your site"
              icon={<MessageSquare className="w-4 h-4" />}
              lead="Two consents worth stating plainly, because most companies bury both."
            >
              <p>
                <strong>Contacting you.</strong> When you give us your number through the quotation
                tool, a contact form, or in the course of a project, you consent to us contacting you
                by phone, SMS, WhatsApp and email about that enquiry or project —{' '}
                <strong>
                  including where your number is registered under the DND / NCPR preference
                </strong>{' '}
                maintained under the TRAI Telecom Commercial Communications Customer Preference
                Regulations. This consent is for service and transactional communication about your
                own enquiry, not for bulk marketing, and you can withdraw it at any time by telling
                us to stop. We will.
              </p>
              <p>
                <strong>Photography.</strong> We photograph completed installations for our project
                records, for quality control, and for the portfolio on this website. Where such a
                photograph is published we do not publish your name, your full address or your
                contact details alongside it — location is shown no more precisely than the town or
                village.
              </p>
              <ul>
                <li>You may decline site photography for publication, before or after installation, and we will honour it — tell the site engineer or write to us.</li>
                <li>Ask us to remove an already-published photograph of your site and we will take it down.</li>
                <li>We will not use your name, a testimonial, or a recognisable identification of you in marketing without asking you first.</li>
              </ul>
              <p>
                Both consents are covered in more detail, along with everything else we collect, in
                our <Link to="/privacy-policy" className="focus-ring">Privacy Policy</Link>.
              </p>
            </Section>

            <Section
              id="force-majeure"
              title="Force majeure"
              icon={<CloudLightning className="w-4 h-4" />}
              lead="Neither party is liable for failure or delay in performance caused by events beyond its reasonable control."
            >
              <p>
                These include, without limitation: acts of God, cyclone, storm, hailstorm, flood,
                earthquake, lightning and fire; epidemic and pandemic; war, riot, civil commotion and
                terrorism; strikes, lockouts and labour disputes; failure or interruption of the grid
                supply; acts, orders, restrictions or delays of any government, regulatory body or
                distribution licensee; changes in law, duty, tariff or import policy; port congestion,
                transport disruption and shortage of materials in the wider market; and failure of a
                manufacturer or supplier to deliver for reasons of the same kind.
              </p>
              <p>
                The affected party will notify the other without undue delay and both will use
                reasonable efforts to resume performance. Where the event continues for a prolonged
                period, either party may terminate the affected work, and amounts will be settled for
                work actually performed and materials actually procured to that date.
              </p>
            </Section>

            <Section
              id="liability"
              title="Limitation of liability"
              icon={<Scale className="w-4 h-4" />}
              lead="What we are responsible for, and the limits of it."
            >
              <p>
                To the maximum extent permitted by applicable law, and subject to the paragraph below,
                {' '}{COMPANY_NAME} is not liable for:
              </p>
              <ul>
                <li>Indirect, incidental or consequential loss, including loss of generation, loss of expected savings, loss of profit or loss of business.</li>
                <li>Delay or non-performance by any OEM, DISCOM, government portal or statutory authority.</li>
                <li>Any amount payable or not payable to you under a government subsidy scheme.</li>
                <li>Reliance on a website estimate as though it were a firm quotation, or on generation, savings or EMI figures as though they were guarantees.</li>
                <li>Damage arising from a cause excluded under clause {clauseNo('not-covered')}, or from your failure to observe clause {clauseNo('customer-obligations')}.</li>
                <li>Interruption, error or unavailability of this website or the quotation tool.</li>
              </ul>
              <p>
                Our aggregate liability arising out of or in connection with an installation is
                limited to the value of the contract for that installation.
              </p>
              <Callout tone="good" icon={<Lock className="w-4 h-4" />} title="Your statutory rights are not affected">
                <p>
                  Nothing in these terms excludes or limits liability for death or personal injury
                  caused by our negligence, for fraud or fraudulent misrepresentation, or for anything
                  else that cannot lawfully be excluded. In particular,{' '}
                  <strong>
                    nothing here restricts your rights as a consumer under the Consumer Protection
                    Act, 2019
                  </strong>{' '}
                  or your right to approach the appropriate consumer forum. Where any clause on this
                  page is found unenforceable, it is severed and the rest continues to apply.
                </p>
              </Callout>
            </Section>

            <Section
              id="cancellation"
              title="Cancellation, changes & refunds"
              icon={<Receipt className="w-4 h-4" />}
              lead="Where an order is cancelled or altered after acceptance."
            >
              <ul>
                <li><strong>Before procurement.</strong> If you cancel before we have placed component orders, amounts paid are refunded less documented costs actually incurred — survey, design and application fees.</li>
                <li><strong>After procurement.</strong> Once material has been ordered, allocated or delivered, refunds are net of the cost of that material, any supplier restocking or cancellation charge, freight, and work already performed. Custom-fabricated structures are non-returnable.</li>
                <li><strong>Changes in scope.</strong> Any change you request after order — capacity, brand, mounting configuration or location — is priced as a variation and may reset the timeline and the PGVCL application.</li>
                <li><strong>Cancellation by us.</strong> We may withdraw from an order where the site is found unsafe or unsuitable, where required approvals are refused, or where agreed payments are not met. In the first two cases, amounts paid are refunded less costs actually incurred.</li>
                <li><strong>Statutory charges.</strong> Fees already paid to PGVCL or any authority on your behalf are not refundable by us, as they are not held by us.</li>
                <li><strong>Refund method.</strong> Refunds are made to the account from which payment was received, within a reasonable period of the amount being agreed.</li>
              </ul>
            </Section>

            <Section
              id="ip"
              title="Website use & intellectual property"
              icon={<FileText className="w-4 h-4" />}
              lead="What you may and may not do with the material on this site."
            >
              <p>
                All content on this website — text, photographs of our own installations, design,
                the sizing and pricing logic behind the quotation tool, and the {COMPANY_NAME} name
                and branding — is our property or is used under licence. You may read, print and
                share it for your own non-commercial use in evaluating a solar purchase.
              </p>
              <p>
                You may not reproduce, republish or adapt it commercially, scrape or systematically
                extract data from it, reverse-engineer the calculation logic, or use it to train an
                automated system, without our prior written permission. Manufacturer names and marks
                referred to here belong to their respective owners and are used to identify the
                equipment we supply.
              </p>
              <p>
                Do not use the quotation tool to submit false information, someone else&rsquo;s contact
                details, or automated or bulk requests.
              </p>
            </Section>

            <Section
              id="grievance"
              title="Grievance redressal"
              icon={<ShieldCheck className="w-4 h-4" />}
              lead="If something has gone wrong, this is the route — and it is a short one."
            >
              <p>
                Raise it with us first, in writing, at{' '}
                <a href={EMAIL_HREF} className="focus-ring">{EMAIL}</a> or by calling{' '}
                <a href={PHONE_HREF} className="focus-ring">{PHONE_DISPLAY}</a>. Include your name,
                site address, commissioning date and a description of the problem.
              </p>
              <ul>
                <li><strong>Acknowledgement</strong> within 2 working days.</li>
                <li><strong>Substantive response</strong> — our assessment and what we propose to do — within 15 working days, or a status update within that period where a third party such as an OEM or PGVCL is involved and has not yet responded.</li>
                <li><strong>Escalation.</strong> If you are not satisfied, ask for the matter to be escalated to the proprietor, marking your email &ldquo;Escalation&rdquo;.</li>
              </ul>
              <p>
                This process does not limit your right to approach the appropriate consumer forum
                under the Consumer Protection Act, 2019, at any stage.
              </p>
            </Section>

            <Section
              id="law"
              title="Governing law & disputes"
              icon={<Gavel className="w-4 h-4" />}
              lead="Indian law applies, and the courts at Bhuj have jurisdiction."
            >
              <p>
                These terms and any contract formed under them are governed by and construed in
                accordance with the laws of India. Subject to the paragraph below, the courts at
                Bhuj, Kutch, Gujarat have exclusive jurisdiction over any dispute arising out of or
                in connection with them.
              </p>
              <p>
                The parties will first attempt to resolve any dispute through the grievance process
                in clause {clauseNo('grievance')}, and thereafter by good-faith discussion, before
                commencing proceedings. Nothing in this clause restricts a consumer from approaching
                the District, State or National Consumer Disputes Redressal Commission having
                jurisdiction, as provided by the Consumer Protection Act, 2019.
              </p>
            </Section>

            <Section
              id="changes"
              title="Changes to these terms & contact"
              icon={<Info className="w-4 h-4" />}
              lead="We update this page as our practice, our supplier terms and the applicable rules change."
            >
              <p>
                The effective date and version number at the top reflect the current revision.
                Continued use of this website after an update constitutes acceptance of the revised
                terms. <strong>Changes made after your work order is signed do not alter that work
                order</strong> — your contract is the version in force on the date you signed it, and
                we will keep a copy of it.
              </p>

              <div
                className="rounded-xl p-5 mt-5"
                style={{ background: 'rgba(10,37,64,0.04)', border: '1px solid rgba(10,37,64,0.12)' }}
              >
                <p className="text-sm font-semibold text-secondary-token mb-3">{COMPANY_NAME}</p>
                <div className="space-y-2 text-sm text-muted-token">
                  <p className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-token" aria-hidden="true" />
                    <span>{ADDRESS_LINES.join(', ')}</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 flex-shrink-0 text-primary-token" aria-hidden="true" />
                    <a href={PHONE_HREF} className="focus-ring">{PHONE_DISPLAY}</a>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 flex-shrink-0 text-primary-token" aria-hidden="true" />
                    <a href={EMAIL_HREF} className="focus-ring">{EMAIL}</a>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 flex-shrink-0 text-primary-token" aria-hidden="true" />
                    <span>{WORKING_HOURS_SHORT}</span>
                  </p>
                </div>
              </div>
            </Section>

            {/* ── Advocate review notice ──────────────────────────────────────
                DELETE THIS BLOCK ONLY once a practising advocate has reviewed
                and signed off the clauses above. See the file header. */}
            <div
              className="rounded-2xl px-5 py-4"
              style={{ background: 'rgba(245,166,35,0.08)', border: '1.5px solid rgba(245,166,35,0.30)' }}
            >
              <p className="flex items-center gap-2 text-sm font-semibold mb-1.5 text-eyebrow-token">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                Pending advocate review
              </p>
              <p className="text-[0.8125rem] leading-relaxed text-muted-token">
                The commercial and technical content of this page has been verified against our own
                practice and against the manufacturers&rsquo; published warranty terms. It has not yet
                been settled by a practising advocate. It is a statement of how we work, not legal
                advice, and it will be replaced with a lawyer-reviewed version before final launch.
              </p>
            </div>

            {/* ── Footer link row ─────────────────────────────────────────── */}
            <div className="print-hide flex flex-wrap gap-x-6 gap-y-2 items-center text-sm text-muted-token pt-2">
              <Link to="/" className="focus-ring rounded-sm hover:underline text-secondary-token font-medium">← Home</Link>
              <Link to="/privacy-policy" className="focus-ring rounded-sm hover:underline text-secondary-token font-medium">Privacy Policy</Link>
              <Link to="/faq" className="focus-ring rounded-sm hover:underline text-secondary-token font-medium">FAQ</Link>
              <span>© {new Date().getFullYear()} {COMPANY_NAME}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
