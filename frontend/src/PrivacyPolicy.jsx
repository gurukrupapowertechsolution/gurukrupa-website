import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FileText,
  Info,
  Landmark,
  ListChecks,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Scale,
  Server,
  Share2,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  XCircle,
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
 * /privacy-policy — rewritten from the Task C draft.
 *
 * ── Written against the code, not against a template ──────────────────────
 *
 * Every collection claim below was checked against what this application
 * actually does. The previous draft was accurate about the lead gate and
 * inaccurate or silent about four things that matter:
 *
 *   1. sessionStorage. src/lib/quoteSession.js parks the whole quotation
 *      journey in sessionStorage so a visitor can resume it. The old policy
 *      said "we do not use cookies" and stopped there, which is true and
 *      misleading — browser storage is still storage, and the DPDP Act does
 *      not care what the API is called. It now has its own clause.
 *   2. Email transmission. backend/services/emailNotifier.service.ts fires
 *      every captured lead to LEAD_NOTIFY_EMAIL over third-party SMTP. The
 *      old text said data is "not disclosed to any third party", which cannot
 *      be squared with routing it through a mail provider. The distinction is
 *      now drawn properly: no SALE or marketing disclosure, but named
 *      processors.
 *   3. Offline collection. The website collects four fields; a subsidy
 *      application collects an electricity bill, ownership proof, identity
 *      documents and bank details. A privacy policy that covers only the web
 *      form describes about a tenth of the personal data this business
 *      actually handles, and the tenth that matters least.
 *   4. Retention reality. Leads live in an in-memory store
 *      (backend/config/runtimeLeadStore.ts) that empties on restart, and are
 *      durable only in the notification mailbox. Saying "held internally"
 *      implied a database that does not exist.
 *
 * ⚠ CONSISTENCY CONTRACT: if the lead schema
 * (backend/validators/quotationRequest.schema.ts), the notifier, or the
 * storage backend changes, clauses 2, 4, 6 and 7 change with it. A privacy
 * policy that describes last quarter's architecture is a compliance defect,
 * not a stale doc.
 *
 * ── Statutory frame ───────────────────────────────────────────────────────
 * Digital Personal Data Protection Act, 2023 and the DPDP Rules, 2025 —
 * commencing in phases from 13 November 2025. Also the Information Technology
 * Act, 2000 and the SPDI Rules, 2011, which still govern sensitive personal
 * data. The Act's vocabulary (Data Fiduciary, Data Principal, notice,
 * consent withdrawal, grievance redressal) is used deliberately.
 *
 * ⚠ OPEN ITEM before launch: the Grievance Officer below must be a NAMED
 * person at a company-domain address. A personal Gmail as the sole statutory
 * contact point is a weak position under both the DPDP Act and the Consumer
 * Protection Act. Flagged, not silently invented.
 *
 * ── Two disclosures added in v2.1, both found by auditing the repo ────────
 *
 *   · Site photography. data/galleryImages.json publishes 46 photographs of
 *     real installations, and the `dealer` field carries personal names
 *     ("KEVALBHAI RAIYANI", "IRSHAD BHAI") which are also embedded in the
 *     public asset paths under /projects/gallery/. Whether or not the UI
 *     renders that field, the names are retrievable from the served bundle
 *     and the image URLs. Publishing a photograph of someone's home is
 *     processing their personal data, and it was previously undisclosed.
 *     Clause on photography consent added, mirrored in TermsAndConditions.
 *   · DND / TRAI. This is a lead-capture business whose primary channel is
 *     WhatsApp and telephone. Contacting a number registered under the
 *     NCPR/DND preference without a recorded consent is the complaint that
 *     actually gets filed against companies like this one. Express consent is
 *     now stated, scoped to the visitor's own enquiry, with a plain opt-out.
 *
 * ⚠ Section numbering is DERIVED from TOC — see the equivalent note in
 * TermsAndConditions.jsx. Never type a section number by hand.
 *
 * ⚠ The advocate-review notice at the foot stays until a practising advocate
 * has signed off. See the equivalent note in TermsAndConditions.jsx.
 */

const EFFECTIVE_DATE = '18 August 2026';
const VERSION = '2.1';

const TOC = [
  { id: 'who-we-are', label: 'Who we are' },
  { id: 'what-we-collect', label: 'What we collect' },
  { id: 'not-collected', label: 'What we do not collect' },
  { id: 'why', label: 'Why we collect it' },
  { id: 'consent', label: 'Consent & withdrawal' },
  { id: 'communications', label: 'Calls, WhatsApp & DND' },
  { id: 'photography', label: 'Photographs of your site' },
  { id: 'sharing', label: 'Who we share it with' },
  { id: 'storage', label: 'Storage & retention' },
  { id: 'security', label: 'Security' },
  { id: 'rights', label: 'Your rights' },
  { id: 'grievance', label: 'Grievance redressal' },
  { id: 'children', label: 'Children' },
  { id: 'changes', label: 'Changes & contact' },
];

/** id → section number. Derived once; never typed by hand. */
const SECTION_NO = TOC.reduce((acc, item, i) => {
  acc[item.id] = i + 1;
  return acc;
}, {});

/** Section ids in document order, for the contents rail's scroll-spy. Module
 *  scope so the reference is stable — see the note on useScrollSpy. */
const TOC_IDS = TOC.map((item) => item.id);

/* ── Collection inventory ─────────────────────────────────────────────────
   Grouped by the point of collection rather than by data type, because that
   is how a reader reconstructs it: "I filled in that box — what did I just
   give them?" The `source` line names the actual mechanism so this stays
   auditable against the code. */
const COLLECTION_GROUPS = [
  {
    id: 'quote',
    icon: <FileText className="w-4 h-4" />,
    title: 'Quotation & lead capture',
    source: 'The quotation tool at /quote — optional lead gate',
    voluntary: true,
    fields: [
      { field: 'Full name', why: 'To address you correctly and identify your enquiry' },
      { field: 'WhatsApp number', why: 'The only channel we use to send your estimate and arrange a site visit' },
      { field: 'City or location', why: 'To route the enquiry to the right engineer and check we serve your area' },
      { field: 'System type requested (On-Grid / Hybrid)', why: 'To prepare the right kind of proposal' },
      { field: 'Electricity bill figures — your peak and off-peak monthly amounts', why: 'To size the system against your actual consumption' },
      { field: 'Appliance list and backup hours, for Hybrid enquiries', why: 'To size the battery bank and inverter' },
      { field: 'The estimate our calculator produced for you', why: 'So our engineer sees the same figure you saw' },
    ],
  },
  {
    id: 'contact',
    icon: <Mail className="w-4 h-4" />,
    title: 'Contact & callback forms',
    source: 'The contact form and callback requests across the site',
    voluntary: true,
    fields: [
      { field: 'Name', why: 'To reply to you' },
      { field: 'Phone number and email address', why: 'To reply to you by the channel you chose' },
      { field: 'Your message', why: 'To answer the question you actually asked' },
    ],
  },
  {
    id: 'survey',
    icon: <Building2 className="w-4 h-4" />,
    title: 'Site survey & project execution',
    source: 'Collected in person or over WhatsApp, only after you engage us',
    voluntary: false,
    fields: [
      { field: 'Site address and roof photographs', why: 'To design the array and the mounting structure' },
      { field: 'Consumer number, connection details and a copy of your electricity bill', why: 'To verify sanctioned load and phase, and to file the PGVCL application' },
      { field: 'Proof of ownership, or the owner’s no-objection certificate', why: 'A mandatory document for the DISCOM and subsidy applications' },
      { field: 'Identity and address proof as required by the DISCOM and the national portal', why: 'Statutory requirement of the application process' },
      { field: 'Bank account details for the subsidy credit', why: 'Submitted to the national portal so the Government can credit the subsidy directly to you. We never take payment from this account and never hold it as a payment instrument' },
      { field: 'Installation, commissioning and service records, including equipment serial numbers', why: 'To operate your warranty and to service the system for its life' },
      { field: 'Photographs of the completed installation', why: `Project records and quality control, and — unless you decline — our published portfolio. See section ${SECTION_NO.photography}` },
    ],
  },
  {
    id: 'technical',
    icon: <Server className="w-4 h-4" />,
    title: 'Technical & server data',
    source: 'Generated automatically when any website is visited',
    voluntary: false,
    fields: [
      { field: 'IP address, browser type, device type and timestamps in server logs', why: 'Security, abuse prevention and diagnosing faults. Not used to build a profile of you' },
    ],
  },
];

/* Purpose / basis grid. The DPDP Act's demand is that purpose be stated
   specifically, not as "business purposes". */
const PURPOSE_ROWS = [
  { purpose: 'Calculating your solar requirement and preparing an estimate', data: 'Bill figures, appliance list, backup hours, system type', basis: 'Your request' },
  { purpose: 'Contacting you to arrange a site visit and discuss the proposal', data: 'Name, WhatsApp number, city', basis: 'Your consent at the lead gate' },
  { purpose: 'Answering an enquiry you sent us', data: 'Contact form fields', basis: 'Your request' },
  { purpose: 'Designing, quoting and executing the installation', data: 'Site survey data, connection details', basis: 'Performance of our contract with you' },
  { purpose: 'Filing your PGVCL net metering application', data: 'Consumer number, bill copy, ownership and identity documents', basis: 'Your instruction, and DISCOM requirement' },
  { purpose: 'Registering and declaring your PM Surya Ghar subsidy claim', data: 'Portal application data, bank account details', basis: 'Your instruction, and scheme requirement' },
  { purpose: 'Registering and pursuing an OEM warranty claim on your behalf', data: 'Name, site address, contact number, equipment serial numbers', basis: 'Performance of our contract with you' },
  { purpose: 'Statutory records — invoices, GST and tax records', data: 'Name, address, invoice data', basis: 'Legal obligation' },
  { purpose: 'Keeping the website working and secure', data: 'Server logs', basis: 'Our legitimate operational need' },
];

/* Named recipients. "Trusted partners" is the phrase that means nothing;
   these are the actual four, and each says what leaves and why. */
const RECIPIENTS = [
  {
    icon: <Landmark className="w-4 h-4" />,
    name: 'PGVCL / your DISCOM, and the PM Surya Ghar national portal',
    what: 'Your application documents — connection details, bill copy, ownership and identity proof, and the bank account for the subsidy credit.',
    when: 'Only when you have engaged us and instructed us to file. Governed by the DISCOM’s and the portal’s own terms once submitted.',
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    name: 'Equipment manufacturers (Waaree, Adani, UTL, Solaryaan, Polycab and others)',
    what: 'Your name, site address, contact number and the affected equipment serial numbers.',
    when: 'Only when registering a warranty claim on your behalf, and only the data the manufacturer requires to open the claim.',
  },
  {
    icon: <Server className="w-4 h-4" />,
    name: 'Our hosting and email service providers',
    what: 'Lead and enquiry details pass through, and are stored in, the mail service that delivers our notifications, and the infrastructure that runs this website.',
    when: 'Continuously, as a technical necessity of running the site and receiving enquiries. They process on our instruction; they are not permitted to use your data for their own purposes.',
  },
  {
    icon: <Scale className="w-4 h-4" />,
    name: 'Statutory and legal recipients',
    what: 'Whatever a specific, lawful demand requires.',
    when: 'Where we are required by law, a court, or a regulator, or where it is necessary to establish or defend a legal claim.',
  },
];

/* Rights under the DPDP Act, 2023, in the plainest wording that stays
   accurate. */
const RIGHTS = [
  { icon: <Eye className="w-4 h-4" />, title: 'Access', body: 'Ask what personal data we hold about you, what we have done with it, and who we have shared it with.' },
  { icon: <CheckCircle2 className="w-4 h-4" />, title: 'Correction & completion', body: 'Have inaccurate or incomplete data corrected, completed or updated. Tell us if your phone number or address changes — a wrong number on a subsidy application costs you weeks.' },
  { icon: <Trash2 className="w-4 h-4" />, title: 'Erasure', body: 'Ask us to delete your personal data, unless we are required to keep it for a legal purpose such as tax and invoice records, or for an active warranty obligation.' },
  { icon: <XCircle className="w-4 h-4" />, title: 'Withdraw consent', body: 'Withdraw consent as easily as you gave it. Tell us to stop contacting you and we will, and we will delete the lead record unless a contract is already running.' },
  { icon: <ListChecks className="w-4 h-4" />, title: 'Grievance redressal', body: `Raise a complaint with us about how your data has been handled, and receive a response — see section ${SECTION_NO.grievance}.` },
  { icon: <UserCheck className="w-4 h-4" />, title: 'Nominate', body: 'Nominate another person to exercise these rights on your behalf in the event of your death or incapacity.' },
];

/* ── Presentational primitives ────────────────────────────────────────────
   Mirror of the pair in TermsAndConditions.jsx. Keep the two copies in step. */

function Section({ id, title, icon, lead, children }) {
  return (
    <section id={id} className="legal-card scroll-mt-28">
      <div className="flex items-start gap-3 mb-4">
        <div className="legal-sec-icon" aria-hidden="true">{icon}</div>
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-eyebrow-token mb-1">
            Section {SECTION_NO[id]}
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

export default function PrivacyPolicy() {
  /* Which section the reader is on, so the contents rail highlights it — and
     so the highlight stays inside the rail's own scroll box. */
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
        /* Scroll-spy: the section currently being read. Deliberately stronger
           than :hover — hover is a pointer that happens to be passing over an
           entry, this is where the reader actually is, and the two are regularly
           on screen at the same time. */
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

        /* Collection group cards — the "what did I just hand over" blocks. */
        .collect-card {
          border-radius: 0.875rem;
          border: 1px solid var(--color-border);
          background: rgba(255,255,255,0.6);
          overflow: hidden;
        }
        .collect-head {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.85rem 1rem;
          background: rgba(10,37,64,0.04);
          border-bottom: 1px solid var(--color-border);
        }
        .collect-row {
          display: grid;
          gap: 0.15rem 1rem;
          padding: 0.7rem 1rem;
          border-bottom: 1px solid rgba(226,229,234,0.6);
        }
        .collect-row:last-child { border-bottom: none; }
        @media (min-width: 640px) {
          .collect-row { grid-template-columns: 15rem minmax(0,1fr); align-items: start; }
        }

        @media (prefers-reduced-motion: reduce) {
          .legal-toc a { transition: none !important; }
        }

        /* ── Print / PDF ──────────────────────────────────────────────────
           A privacy policy is a document people print, file, and hand to a
           lawyer. Printed without this block it carries the fixed site header
           across page one, a full-bleed navy masthead, the navy site footer,
           and — worst — 15rem of empty gutter down EVERY page, because a grid
           column still occupies its track when its only child is sticky and
           has scrolled away.

           Print-only. Nothing here affects screen rendering. */
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

          /* Tints and status pills carry meaning — the "Optional" badge, the
             callout tones — so keep colour rather than letting the print
             engine drop backgrounds. */
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
             several sections run longer than a sheet, and forcing them whole
             would eject a near-empty page before each one. */
          .legal-card h2 { break-after: avoid; page-break-after: avoid; }

          /* Rows and field pairs must not split down the middle. */
          .legal-table-wrap { overflow: visible !important; }
          .legal-table { min-width: 0 !important; }
          .legal-table tr,
          .collect-row { break-inside: avoid; page-break-inside: avoid; }

          /* A link the reader cannot click is useless unless it is spelled
             out. mailto:/tel: are already printed as their own label. */
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
            Legal · Data Protection
          </p>
          <h1
            className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight max-w-3xl"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            Privacy Policy
          </h1>
          <p className="text-white/70 max-w-3xl text-base md:text-lg leading-relaxed mb-7">
            What {COMPANY_NAME} collects, why we collect it, exactly who else sees it, and how you
            get it back or get it deleted. Written field by field against what this website and our
            project process actually do — not as a template with our name pasted on top.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <span className="hero-pill"><Clock className="w-3.5 h-3.5" /> Effective {EFFECTIVE_DATE}</span>
            <span className="hero-pill"><FileText className="w-3.5 h-3.5" /> Version {VERSION}</span>
            <span className="hero-pill"><Shield className="w-3.5 h-3.5" /> DPDP Act, 2023</span>
            <span className="hero-pill"><XCircle className="w-3.5 h-3.5" /> No tracking, no ad pixels</span>
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
                        <span className="toc-num text-muted-token/60 tabular-nums mr-1.5">{SECTION_NO[item.id]}.</span>
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ol>
            </div>
          </nav>

          <div className="min-w-0 space-y-5">

            {/* Four promises, up front. */}
            <div className="legal-card">
              <p className="text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-eyebrow-token mb-3">
                The short version
              </p>
              <h2
                className="text-lg md:text-xl font-semibold text-secondary-token mb-4"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              >
                Four commitments, stated plainly
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: <XCircle className="w-4 h-4" />, title: 'We never sell your data', body: 'Not to lead aggregators, not to other installers, not to financiers, not to anyone. There is no arrangement under which your enquiry is passed on for money or in exchange.' },
                  { icon: <Eye className="w-4 h-4" />, title: 'No tracking, no advertising pixels', body: 'This site runs no analytics suite, no advertising or retargeting scripts, and sets no tracking cookies. Nobody is following you off this website.' },
                  { icon: <ListChecks className="w-4 h-4" />, title: 'Collected for one purpose', body: 'To size your system, file your PGVCL and subsidy applications, and arrange your site visit. Nothing is collected "in case it is useful later".' },
                  { icon: <Trash2 className="w-4 h-4" />, title: 'Deleted on request', body: 'Ask us to delete your data and we will, except where tax law or a live warranty obligation requires us to keep a record. We will tell you which applies.' },
                ].map((c) => (
                  <div key={c.title} className="rounded-xl p-4" style={{ background: 'rgba(10,37,64,0.035)', border: '1px solid rgba(10,37,64,0.09)' }}>
                    <p className="flex items-center gap-2 text-sm font-semibold text-secondary-token mb-1.5">
                      <span className="text-primary-token flex-shrink-0" aria-hidden="true">{c.icon}</span>
                      {c.title}
                    </p>
                    <p className="text-[0.8125rem] leading-relaxed text-muted-token">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <Section
              id="who-we-are"
              title="Who we are, and what this covers"
              icon={<Building2 className="w-4 h-4" />}
              lead={`${COMPANY_NAME} is a solar EPC company based in Madhapar, Bhuj, Kutch, Gujarat, designing and installing On-Grid and Hybrid rooftop systems across the PGVCL area.`}
            >
              <p>
                Under the Digital Personal Data Protection Act, 2023, we are the{' '}
                <strong>Data Fiduciary</strong> for the personal data described here — meaning we
                decide why and how it is processed, and we are accountable for it. You are the{' '}
                <strong>Data Principal</strong>.
              </p>
              <p>
                This policy covers personal data collected through this website{' '}
                <strong>and</strong> through the course of a project — at a site survey, over
                WhatsApp, and in the PGVCL and subsidy applications we file for you. A policy that
                covered only the web form would describe a small fraction of what a solar EPC
                actually handles, and not the important fraction.
              </p>
              <p>
                It is issued in accordance with the DPDP Act, 2023 and the DPDP Rules, 2025, and the
                Information Technology Act, 2000 together with the SPDI Rules, 2011.
              </p>
            </Section>

            <Section
              id="what-we-collect"
              title="What we collect, and where"
              icon={<Database className="w-4 h-4" />}
              lead="Every field, grouped by the point at which you give it to us."
            >
              <div className="space-y-4">
                {COLLECTION_GROUPS.map((g) => (
                  <div key={g.id} className="collect-card">
                    <div className="collect-head">
                      <span className="text-primary-token flex-shrink-0" aria-hidden="true">{g.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-secondary-token leading-tight">{g.title}</p>
                        <p className="text-xs text-muted-token mt-0.5">{g.source}</p>
                      </div>
                      {g.voluntary && (
                        <span
                          className="text-[0.625rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: 'rgba(30,158,99,0.12)', color: '#15784B', border: '1px solid rgba(30,158,99,0.28)' }}
                        >
                          Optional
                        </span>
                      )}
                    </div>
                    {g.fields.map((f) => (
                      <div key={f.field} className="collect-row">
                        <p className="text-[0.8125rem] font-medium text-secondary-token">{f.field}</p>
                        <p className="text-[0.8125rem] leading-relaxed text-muted-token">{f.why}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <Callout tone="good" icon={<CheckCircle2 className="w-4 h-4" />} title="The lead gate is genuinely optional">
                <p>
                  You can run the quotation tool and see your full estimate{' '}
                  <strong>without giving us your name or number.</strong> The contact step is there
                  so we can follow up if you want us to — it is not a wall in front of your result,
                  and we have deliberately built it that way.
                </p>
              </Callout>
            </Section>

            <Section
              id="not-collected"
              title="What we do not collect, and what your browser stores"
              icon={<XCircle className="w-4 h-4" />}
              lead="The absences are as much a part of this policy as the collections."
            >
              <p>This website does not:</p>
              <ul>
                <li>Run Google Analytics or any other analytics suite.</li>
                <li>Load advertising, retargeting or conversion pixels from Meta, Google or any ad network.</li>
                <li>Set tracking or third-party cookies, or share any identifier with an advertising network.</li>
                <li>Embed social media tracking widgets.</li>
                <li>Collect your Aadhaar, PAN or bank details through any form on this website. Where such documents are required for a DISCOM or subsidy application, they are collected directly, offline, only after you have engaged us.</li>
                <li>Take card or payment details on this site. We do not process online payments here.</li>
              </ul>

              <Callout tone="info" icon={<Database className="w-4 h-4" />} title="One thing your browser does store, and we would rather say so">
                <p>
                  The quotation journey is several steps long, and losing it because you switched
                  tabs would be maddening. So the tool saves your progress — the answers you have
                  given so far — in your own browser&rsquo;s{' '}
                  <strong>sessionStorage</strong>. That lets you pick up where you left off.
                </p>
                <p>
                  It is not a cookie, it is not sent to any advertiser, and it is not a tracking
                  identifier. It stays on your device, is readable only by this website, and your
                  browser discards it when you close the tab. Clearing your browser data removes it
                  immediately. We mention it because &ldquo;we use no cookies&rdquo; is a technically
                  true sentence that would leave you with a false impression, and that is not how we
                  want to write this page.
                </p>
              </Callout>
            </Section>

            <Section
              id="why"
              title="Why we collect it"
              icon={<ListChecks className="w-4 h-4" />}
              lead="Each purpose, the data it uses, and the basis on which we process it. We do not use your data for anything not on this list."
            >
              <div className="legal-table-wrap">
                <table className="legal-table">
                  <thead>
                    <tr>
                      <th scope="col">Purpose</th>
                      <th scope="col">Data used</th>
                      <th scope="col">Basis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PURPOSE_ROWS.map((r) => (
                      <tr key={r.purpose}>
                        <td>{r.purpose}</td>
                        <td>{r.data}</td>
                        <td>{r.basis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                We do not use your data for automated decision-making that produces a legal effect
                on you, and we do not build behavioural profiles. The sizing calculation the
                quotation tool performs is a published engineering formula applied to figures you
                typed in yourself, and a human engineer reviews it before any firm proposal is
                issued.
              </p>
            </Section>

            <Section
              id="consent"
              title="Consent, and taking it back"
              icon={<UserCheck className="w-4 h-4" />}
              lead="Where we rely on your consent, you can withdraw it at any time, as easily as you gave it."
            >
              <p>
                Sharing your contact details at the quotation step is voluntary and consent-based.
                Withdraw that consent by telling us — a WhatsApp message, a phone call or an email
                to{' '}
                <a href={EMAIL_HREF} className="focus-ring">{EMAIL}</a> is enough. No form, no
                justification required.
              </p>
              <p>
                On withdrawal we stop contacting you and delete the lead record, unless a contract
                is already running between us or the law requires us to retain something. We will
                tell you which, if either, applies. Withdrawal does not undo processing that was
                lawful before you withdrew.
              </p>
              <p>
                Where you have engaged us for an installation, some processing is necessary to
                perform that contract or to meet a statutory requirement — filing your PGVCL
                application, or keeping GST invoice records. That processing continues for as long
                as the contract or the statutory obligation does, and it is not something consent
                withdrawal can switch off.
              </p>
            </Section>

            <Section
              id="communications"
              title="Calls, WhatsApp, SMS — and the DND register"
              icon={<MessageSquare className="w-4 h-4" />}
              lead="Most companies bury this one. Since telephone and WhatsApp are how we actually reach you, it deserves saying out loud."
            >
              <p>
                When you give us your number — through the quotation tool, a contact form, or during
                a project — you consent to us contacting you by <strong>phone call, SMS, WhatsApp
                and email</strong> in connection with that enquiry or project.
              </p>
              <p>
                That consent expressly extends to contacting you{' '}
                <strong>
                  even if your number is registered under the DND / NCPR preference
                </strong>{' '}
                maintained under the TRAI Telecom Commercial Communications Customer Preference
                Regulations, 2018. Without it, a registered number would block the very callback you
                asked for.
              </p>

              <Callout tone="good" icon={<CheckCircle2 className="w-4 h-4" />} title="Scope, and how to switch it off">
                <p>
                  This consent covers communication <strong>about your own enquiry or your own
                  system</strong> — your estimate, arranging a site visit, application status,
                  service and warranty matters. It is not a subscription to bulk promotional
                  messaging, and we do not add you to any marketing list you did not ask to join.
                </p>
                <p>
                  Withdraw it at any time by replying STOP on WhatsApp, telling the caller, or
                  writing to <a href={EMAIL_HREF} className="focus-ring">{EMAIL}</a>. We will stop.
                  Where a contract is running we may still need to send you essential service
                  notices — a scheduled visit, or a safety matter about your own installation.
                </p>
              </Callout>

              <p>
                We do not share your number with any third party for their own marketing, and we do
                not buy contact lists. If you receive a promotional message about solar that claims
                to be from us and you never contacted us, please report it to us — we would want to
                know.
              </p>
            </Section>

            <Section
              id="photography"
              title="Photographs of your installation"
              icon={<Camera className="w-4 h-4" />}
              lead="We photograph completed installations. Some of those photographs are published on this website, and you get to decide whether yours is one of them."
            >
              <p>Photographs of your site are taken and used for three purposes:</p>
              <ul>
                <li><strong>Project and service records</strong> — the as-built condition of your roof, the array layout and the terminations, which is what lets a technician who has never visited your site diagnose a fault years later.</li>
                <li><strong>Quality control</strong> — internal review of workmanship.</li>
                <li><strong>Our published portfolio</strong> — the project gallery on this website, unless you decline.</li>
              </ul>

              <Callout tone="info" icon={<Eye className="w-4 h-4" />} title="What a published photograph does and does not show">
                <p>
                  Where we publish a photograph of an installation, we do not publish your{' '}
                  <strong>name, your full address, your consumer number or your contact details</strong>{' '}
                  alongside it. Location is described no more precisely than the town or village.
                </p>
                <p>
                  We are aware that a photograph of a building can identify a household to someone
                  who already knows the area, whatever caption sits under it. That is exactly why
                  the decision is yours rather than ours.
                </p>
              </Callout>

              <p>Your choices, all of which we will honour without asking why:</p>
              <ul>
                <li><strong>Decline publication</strong> — before, during or after installation. Tell the site engineer or write to us. We will still take record photographs for your project file, because they are needed to service the system; they simply will not be published.</li>
                <li><strong>Ask for removal</strong> of a photograph already published. We will take it down.</li>
                <li><strong>Named use requires separate permission.</strong> We will not use your name, a testimonial, a video, or any recognisable identification of you or your family in marketing unless you have specifically agreed to that use.</li>
              </ul>
              <p>
                Requests go to <a href={EMAIL_HREF} className="focus-ring">{EMAIL}</a> or{' '}
                <a href={PHONE_HREF} className="focus-ring">{PHONE_DISPLAY}</a>. The same commitment
                is written into our{' '}
                <Link to="/terms-and-conditions" className="focus-ring">Terms &amp; Conditions</Link>,
                so it binds us contractually and not merely as a policy statement.
              </p>
            </Section>

            <Section
              id="sharing"
              title="Who else sees your data"
              icon={<Share2 className="w-4 h-4" />}
              lead="Four categories of recipient, all named. There is no fifth."
            >
              <div className="space-y-3 my-4">
                {RECIPIENTS.map((r) => (
                  <div key={r.name} className="rounded-xl p-4" style={{ background: 'rgba(10,37,64,0.035)', border: '1px solid rgba(10,37,64,0.10)' }}>
                    <p className="flex items-start gap-2 text-sm font-semibold text-secondary-token mb-2">
                      <span className="text-primary-token flex-shrink-0 mt-0.5" aria-hidden="true">{r.icon}</span>
                      {r.name}
                    </p>
                    <p className="text-[0.8125rem] leading-relaxed text-muted-token mb-1.5">
                      <strong className="text-secondary-token font-semibold">What: </strong>{r.what}
                    </p>
                    <p className="text-[0.8125rem] leading-relaxed text-muted-token">
                      <strong className="text-secondary-token font-semibold">When: </strong>{r.when}
                    </p>
                  </div>
                ))}
              </div>

              <Callout tone="stop" icon={<XCircle className="w-4 h-4" />} title="What never happens">
                <p>
                  Your data is <strong>never sold, rented, bartered or licensed.</strong> It is never
                  passed to lead-generation networks, loan or finance brokers, insurance sellers,
                  other solar installers, or any advertising or marketing platform. We do not send
                  marketing on behalf of anyone else, and we do not run a mailing list you did not
                  ask to be on.
                </p>
              </Callout>

              <p>
                Our service providers are located in India or process data on infrastructure
                accessible internationally. Where any transfer outside India occurs, it is limited to
                what is necessary to deliver the service, is subject to that provider&rsquo;s
                contractual commitments, and is made in accordance with the DPDP Act and any
                restrictions notified by the Central Government.
              </p>
            </Section>

            <Section
              id="storage"
              title="Where it is stored, and how long we keep it"
              icon={<Server className="w-4 h-4" />}
              lead="An honest description of the actual arrangement, including its limits."
            >
              <p>
                A quotation lead submitted through this website is recorded by our application server
                and simultaneously sent as a notification email to our own business mailbox, which is
                where it durably lives and from which our team works it. Contact form enquiries reach
                us the same way. Access is restricted to authorised Gurukrupa personnel.
              </p>
              <p>
                Project documents — bills, ownership proof, identity documents, application
                acknowledgements, commissioning records — are held in our project files, in physical
                and digital form, restricted to the staff working on your installation and on your
                after-sales support.
              </p>

              <div className="legal-table-wrap">
                <table className="legal-table">
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col">Retention</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Enquiries and quotation leads that do not convert</td>
                      <td>Up to 24 months from last contact, then deleted. Deleted sooner on request.</td>
                    </tr>
                    <tr>
                      <td>Project, installation and commissioning records</td>
                      <td>For the life of the warranty obligations on your system, so that we can support a claim years later.</td>
                    </tr>
                    <tr>
                      <td>Subsidy and DISCOM application documents</td>
                      <td>Until the application is complete and the retention period required by the scheme and the DISCOM has passed.</td>
                    </tr>
                    <tr>
                      <td>Invoices, GST and statutory financial records</td>
                      <td>As long as Indian tax and company law requires. This is not something we can delete on request.</td>
                    </tr>
                    <tr>
                      <td>Server logs</td>
                      <td>Short-term, for security and diagnostics only.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            <Section
              id="security"
              title="How we protect it"
              icon={<Lock className="w-4 h-4" />}
              lead="Reasonable security safeguards, and a plain statement of what they do and do not guarantee."
            >
              <ul>
                <li>All traffic between your browser and this website is encrypted in transit over HTTPS.</li>
                <li>Administrative interfaces are access-controlled and restricted to authorised personnel.</li>
                <li>Access is on a need-to-know basis — the engineer surveying your roof does not need your bank details, and does not have them.</li>
                <li>Physical project files are kept at our office premises with controlled access.</li>
                <li>Documents collected for a DISCOM or subsidy application are used for that application and are not circulated further.</li>
              </ul>
              <p>
                No system is completely secure, and we will not pretend otherwise. If a personal data
                breach occurs that is likely to affect you, we will notify you and the Data
                Protection Board of India as required under the DPDP Act and its Rules, with a
                description of what happened, what data was involved and what you should do.
              </p>
              <Callout tone="warn" icon={<AlertTriangle className="w-4 h-4" />} title="Two things we will never ask you for">
                <p>
                  We will never ask for your <strong>banking password, card PIN, CVV, or an OTP</strong>{' '}
                  — not by phone, not on WhatsApp, not by email, not ever. The bank details we take
                  for a subsidy application are the account number and IFSC that the Government
                  credits money <em>into</em>. If someone claiming to be from Gurukrupa asks you for
                  a credential or an OTP, it is not us. Call us on{' '}
                  <a href={PHONE_HREF} className="focus-ring">{PHONE_DISPLAY}</a> and tell us.
                </p>
              </Callout>
            </Section>

            <Section
              id="rights"
              title="Your rights"
              icon={<ShieldCheck className="w-4 h-4" />}
              lead="Under the Digital Personal Data Protection Act, 2023, you have the following rights over your personal data. Exercising any of them is free."
            >
              <div className="grid sm:grid-cols-2 gap-3 my-4">
                {RIGHTS.map((r) => (
                  <div key={r.title} className="rounded-xl p-4" style={{ background: 'rgba(10,37,64,0.035)', border: '1px solid rgba(10,37,64,0.10)' }}>
                    <p className="flex items-center gap-2 text-sm font-semibold text-secondary-token mb-1.5">
                      <span className="text-primary-token flex-shrink-0" aria-hidden="true">{r.icon}</span>
                      {r.title}
                    </p>
                    <p className="text-[0.8125rem] leading-relaxed text-muted-token">{r.body}</p>
                  </div>
                ))}
              </div>
              <p>
                To exercise any of these, write to{' '}
                <a href={EMAIL_HREF} className="focus-ring">{EMAIL}</a> or call{' '}
                <a href={PHONE_HREF} className="focus-ring">{PHONE_DISPLAY}</a>. We may need to
                verify your identity before acting — usually by confirming details only you would
                know, such as the number you enquired from. We will respond{' '}
                <strong>within 30 days</strong>, and sooner where we can.
              </p>
              <p>
                One duty runs the other way: please give us accurate information and do not submit
                someone else&rsquo;s contact details as your own. A wrong phone number or an
                incorrectly linked bank account is the most common reason a subsidy claim fails at
                the last step.
              </p>
            </Section>

            <Section
              id="grievance"
              title="Grievance redressal"
              icon={<Scale className="w-4 h-4" />}
              lead="If you are unhappy with how we have handled your data, this is the route."
            >
              <p>
                Contact our Grievance Officer with the details of your complaint. Include your name,
                your contact number, and what you would like done.
              </p>
              <div className="rounded-xl p-5 my-4" style={{ background: 'rgba(10,37,64,0.04)', border: '1px solid rgba(10,37,64,0.12)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-eyebrow-token mb-2">
                  Grievance Officer
                </p>
                <p className="text-sm font-semibold text-secondary-token mb-3">
                  The Proprietor, {COMPANY_NAME}
                </p>
                <div className="space-y-2 text-sm text-muted-token">
                  <p className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 flex-shrink-0 text-primary-token" aria-hidden="true" />
                    <a href={EMAIL_HREF} className="focus-ring">{EMAIL}</a>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 flex-shrink-0 text-primary-token" aria-hidden="true" />
                    <a href={PHONE_HREF} className="focus-ring">{PHONE_DISPLAY}</a>
                  </p>
                  <p className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-token" aria-hidden="true" />
                    <span>{ADDRESS_LINES.join(', ')}</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 flex-shrink-0 text-primary-token" aria-hidden="true" />
                    <span>{WORKING_HOURS_SHORT}</span>
                  </p>
                </div>
              </div>
              <p>
                We acknowledge within <strong>2 working days</strong> and aim to resolve within{' '}
                <strong>30 days</strong>. If you remain dissatisfied, you may complain to the{' '}
                <strong>Data Protection Board of India</strong> under the DPDP Act, 2023. Nothing
                here limits your rights under the Consumer Protection Act, 2019.
              </p>
            </Section>

            <Section
              id="children"
              title="Children"
              icon={<Shield className="w-4 h-4" />}
              lead="This website and our services are directed at adults."
            >
              <p>
                We do not knowingly collect personal data of anyone under 18. Our quotation tool and
                enquiry forms are intended to be used by property owners and decision-makers. We do
                not undertake tracking, behavioural monitoring or targeted advertising directed at
                children, as prohibited by the DPDP Act.
              </p>
              <p>
                If you believe a minor has submitted information through this site, tell us at{' '}
                <a href={EMAIL_HREF} className="focus-ring">{EMAIL}</a> and we will delete it
                promptly.
              </p>
            </Section>

            <Section
              id="changes"
              title="Changes to this policy & contact"
              icon={<Info className="w-4 h-4" />}
              lead="We update this page when our practices, our systems or the applicable law change."
            >
              <p>
                The effective date and version number at the top reflect the current revision. Where
                a change materially affects how we handle data you have already given us, we will
                take reasonable steps to inform you rather than relying on you noticing a date
                change.
              </p>
              <p>
                For anything about this policy, your data, or a request to access, correct or delete
                it:
              </p>

              <div className="rounded-xl p-5 mt-4" style={{ background: 'rgba(10,37,64,0.04)', border: '1px solid rgba(10,37,64,0.12)' }}>
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
                </div>
              </div>

              <p className="mt-4">
                See also our{' '}
                <Link to="/terms-and-conditions" className="focus-ring">Terms &amp; Conditions</Link>,
                which cover warranties, the PGVCL process and the subsidy.
              </p>
            </Section>

            {/* ── Advocate review notice ──────────────────────────────────────
                DELETE THIS BLOCK ONLY once a practising advocate has reviewed
                and signed off the sections above. See the file header. */}
            <div
              className="rounded-2xl px-5 py-4"
              style={{ background: 'rgba(245,166,35,0.08)', border: '1.5px solid rgba(245,166,35,0.30)' }}
            >
              <p className="flex items-center gap-2 text-sm font-semibold mb-1.5 text-eyebrow-token">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                Pending advocate review
              </p>
              <p className="text-[0.8125rem] leading-relaxed text-muted-token">
                The collection, sharing and retention statements on this page have been verified
                against what this website and our project process actually do. The page has not yet
                been settled by a practising advocate against the DPDP Act, 2023 and its Rules, and
                will be replaced with a lawyer-reviewed version before final launch.
              </p>
            </div>

            {/* ── Footer link row ─────────────────────────────────────────── */}
            <div className="print-hide flex flex-wrap gap-x-6 gap-y-2 items-center text-sm text-muted-token pt-2">
              <Link to="/" className="focus-ring rounded-sm hover:underline text-secondary-token font-medium">← Home</Link>
              <Link to="/terms-and-conditions" className="focus-ring rounded-sm hover:underline text-secondary-token font-medium">Terms &amp; Conditions</Link>
              <Link to="/faq" className="focus-ring rounded-sm hover:underline text-secondary-token font-medium">FAQ</Link>
              <span>© {new Date().getFullYear()} {COMPANY_NAME}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
