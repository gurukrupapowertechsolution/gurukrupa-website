import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Wallet,
  TrendingUp,
  PiggyBank,
  Calendar,
  Info,
  Sun,
  BadgeCheck,
  RotateCcw,
  ChevronRight,
  Loader2,
  Receipt,
  Pencil,
} from 'lucide-react';
import {
  calculateRoi,
  formatINR,
  toNumber,
  costForSizeKw,
  INDICATIVE_COST_PER_KW_RS,
  DEFAULT_INTEREST_RATE_PCT,
} from '../lib/finance';
import { fetchRecommendedSystemSize } from '../lib/api';
import SessionRecoveryModal from '../components/SessionRecoveryModal';
import FlowTabs, { CALCULATOR_TAB_ID } from '../components/FlowTabs';
import {
  activateSession,
  clearSession,
  isRecoveryPending,
  journeyArrivedFrom,
  journeyCrumbs,
  journeyOnArrival,
  readJourney,
  readRoiDraft,
  resolveRecovery,
  roiDraftHasContent,
  writeRoiDraft,
} from '../lib/quoteSession';

/**
 * Standalone EMI / ROI calculator.
 *
 * State arrives one of two ways:
 *   1. From a completed quote — /roi-calculator?bill=…&cost=…&savings=…
 *      (auto-filled, and the results panel is populated on first paint)
 *   2. Direct navigation — the visitor fills the fields themselves
 *
 * URL params are used rather than Context so the prefilled state survives a
 * refresh and can be shared as a link.
 *
 * `size` is accepted but /quote never sends it: the backend deliberately does
 * not expose system capacity (see QuotationResponse — engine constants are
 * never returned), so the handoff carries cost directly instead of a size to
 * re-derive it from.
 */
export default function RoiCalculator() {
  const [searchParams] = useSearchParams();

  const quotedBill = toNumber(searchParams.get('bill'));
  const quotedCost = toNumber(searchParams.get('cost'));
  const quotedSize = toNumber(searchParams.get('size'));
  const quotedAnnualSavings = toNumber(searchParams.get('savings'));
  const fromQuote = quotedBill !== null || quotedCost !== null;

  /* Three sources can seed this page, in strict order of authority:

       1. URL params. An explicit handoff from /quote that just happened — it
          outranks everything, and it is never worth prompting about, because
          the visitor pressed the button that produced it seconds ago.
       2. A stored draft, while the session is still active. This is the return
          leg: come back from /quote and the loan terms are as you left them,
          not reset to the 5-year default.
       3. A stored draft with a recovery prompt still armed — offered through
          the modal rather than applied.

     Same shape as the bootstrap on the quotation page, and for the same reason:
     the decision has to be made before the first paint so the panel never
     flashes populated behind a modal asking whether to populate it.

     `isRecoveryPending()` replaces the old `!isSessionActive()`: the prompt is
     now armed by an actual departure from the flow rather than inferred from a
     flag that also read "parked" for a session nothing had got round to
     activating. See the note in lib/quoteSession.js. */
  const bootstrap = React.useMemo(() => {
    const draft = readRoiDraft();
    if (fromQuote) return { initial: null, offer: null };
    const offer = roiDraftHasContent(draft) && isRecoveryPending();
    return { initial: offer ? null : draft, offer: offer ? draft : null };
  }, [fromQuote]);

  const seed = bootstrap.initial;
  const [recoveryOffer, setRecoveryOffer] = useState(bootstrap.offer);

  const [monthlyBill, setMonthlyBill] = useState(
    quotedBill !== null ? String(Math.round(quotedBill)) : seed?.monthlyBill ?? ''
  );
  const [systemSize, setSystemSize] = useState(
    quotedSize !== null ? String(quotedSize) : seed?.systemSize ?? ''
  );
  const [systemCost, setSystemCost] = useState(
    quotedCost !== null ? String(Math.round(quotedCost)) : seed?.systemCost ?? ''
  );
  /* The loan terms are the visitor's own work — the whole reason they opened
     this page — and until now they were the one thing that reset on every
     visit. Someone who modelled 7 years at 8.5%, went back to adjust an
     appliance and returned found 5 years at the default staring at them. */
  const [downPayment, setDownPayment] = useState(seed?.downPayment ?? '');
  const [tenureYears, setTenureYears] = useState(seed?.tenureYears ?? '5');
  const [interestRate, setInterestRate] = useState(
    seed?.interestRate ?? String(DEFAULT_INTEREST_RATE_PCT)
  );

  /* Until the visitor drives the size field themselves, a quoted cost outranks
     anything the size field would derive. Restored with the draft: this decides
     whether automatic sizing is still armed, so dropping it on the return leg
     would silently re-arm the server lookup and overwrite a size the visitor
     had set by hand. */
  const [sizeTouched, setSizeTouched] = useState(seed?.sizeTouched ?? false);

  /* Set by Reset. The figures that arrived in the URL stay in the URL — and so
     survive a refresh — but Reset means "start from scratch", and a quoted cost
     that keeps outranking the derivation would leave the visitor unable to
     model anything else without navigating away. One flag rather than a check
     at each site, so the two guards below cannot drift apart.

     Also restored, for the same reason: a Reset the visitor performed before
     stepping away is a decision, and reinstating the quoted figures underneath
     them on their return would undo it. */
  const [quoteOverridden, setQuoteOverridden] = useState(seed?.quoteOverridden ?? false);
  const activeQuotedCost = quoteOverridden ? null : quotedCost;
  const activeQuotedSize = quoteOverridden ? null : quotedSize;

  /* ── Where these figures came from, once the URL no longer says ────────────
     The "Loaded from your quotation" notice and the closing CTA's "Edit your
     quotation" wording were both read straight off the arrival: the notice from
     the query params, the CTA from the journey trail. Both of those describe
     the navigation, and the navigation is exactly what a detour destroys — the
     params are gone from the URL and clearJourney has dropped the trail. So a
     visitor who came here from a quotation, wandered off to read a blog post
     and pressed "Resume my quotation" got their numbers back stripped of every
     cue explaining what they were: no notice above the form, and a closing
     button offering to produce the quotation they already had.

     The provenance is a fact about the session, not about the last click, so it
     is stored with the draft and restored with it. Held in state rather than
     derived so the recovery prompt can reinstate it at the moment the visitor
     accepts — the same reason applyRoiDraft exists for the fields. */
  const [restoredHandoff, setRestoredHandoff] = useState(() =>
    fromQuote ? null : seed?.handoff ?? null
  );

  /* Phase 3 — system size is calculated by the backend from the bill.
     'idle' | 'loading' | 'auto' | 'failed'
       auto   → the value in the field came from the server
       failed → the lookup is unavailable and the field has been handed back to
                the visitor, which is the whole reason this state exists: the
                cost input is gone, so cost now derives from size, and a size
                field that silently stops filling itself would leave the results
                panel permanently empty with nothing on screen explaining why. */
  const [sizeStatus, setSizeStatus] = useState('idle');

  /* Re-seed when a *different* quotation arrives.
     useState initialisers run once per mount, and React Router reuses the same
     component instance when only the query string changes — so without this,
     arriving a second time with fresh figures would silently keep the first
     set. Keyed on the raw param string so an identical link is a no-op. */
  const quoteKey = `${searchParams.get('bill') ?? ''}|${searchParams.get('cost') ?? ''}|${searchParams.get('size') ?? ''}`;
  const seededKey = useRef(quoteKey);
  useEffect(() => {
    if (seededKey.current === quoteKey) return;
    seededKey.current = quoteKey;
    if (quotedBill !== null) setMonthlyBill(String(Math.round(quotedBill)));
    if (quotedCost !== null) setSystemCost(String(Math.round(quotedCost)));
    if (quotedSize !== null) setSystemSize(String(quotedSize));
    setSizeTouched(false);
    // A genuinely new quotation supersedes an earlier Reset.
    setQuoteOverridden(false);
  }, [quoteKey, quotedBill, quotedCost, quotedSize]);

  /* ── Automatic system sizing ────────────────────────────────────────────
     Asks the backend for the capacity the entered bill needs. The formula is
     server-side on purpose (see lib/api.js and services/systemSizing.service.ts)
     — it is built from the same protected engine constants a real quotation
     uses, so computing it here would create a second set of numbers free to
     disagree with what the customer is actually quoted.

     Three things this has to get right:
       · Debounced. The bill is a text input; firing on every keystroke would
         send a request per character, and "6000" would issue four.
       · Aborted on supersede. Responses can land out of order, and the reply to
         "600" arriving after the reply to "6000" would overwrite the correct
         answer with a stale one.
       · Yields to the visitor. Once they edit the size themselves, or arrived
         with a size from a quotation they have not overridden, the automatic
         value stops being written. */
  const autoSizeBill = sizeTouched ? null : toNumber(monthlyBill);

  useEffect(() => {
    // A size that came with the quotation is already the right answer for this
    // bill — re-deriving it would replace an exact figure with an indicative one.
    if (!sizeTouched && activeQuotedSize !== null) return undefined;
    if (autoSizeBill === null || autoSizeBill <= 0) {
      setSizeStatus('idle');
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSizeStatus('loading');
      fetchRecommendedSystemSize(autoSizeBill, controller.signal)
        .then((data) => {
          setSystemSize(String(data.recommendedSizeKw));
          setSizeStatus('auto');
        })
        .catch((err) => {
          // An abort is this effect superseding itself, not a failure — showing
          // the manual-entry fallback for it would flash an error on every
          // keystroke.
          if (err.name === 'AbortError') return;
          setSizeStatus('failed');
        });
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [autoSizeBill, sizeTouched, activeQuotedSize]);

  /* Derive cost from size.
     Two rules, both learned the hard way:
       - This only ever *fills in* a cost, never clears one. Blanking the size
         field used to blank the cost with it, which on a visit from /quote
         destroyed the quoted figure and emptied the results panel.
       - A quoted cost wins until the visitor actually drives the size field.
         Editing size afterwards is an explicit request to model a different
         system, so the derivation takes over from there.
     Both conditions are stateless predicates rather than a one-shot ref, so the
     effect is idempotent — re-running it (StrictMode does, twice, on mount)
     cannot change the outcome.

     Phase 3 — the visitor can no longer type a cost directly (the input moved
     to the results panel as a read-only figure), so this is now the only path
     to a cost for anyone who did not arrive from a quotation. */
  useEffect(() => {
    if (!sizeTouched && activeQuotedCost !== null) return;
    const derived = costForSizeKw(toNumber(systemSize));
    if (derived === null) return;
    setSystemCost(String(derived));
  }, [systemSize, sizeTouched, activeQuotedCost]);

  // The quoted figure stops being "from your quotation" the moment a size change
  // re-derives it, so the label must not keep claiming otherwise.
  const costIsFromQuote =
    activeQuotedCost !== null && toNumber(systemCost) === Math.round(activeQuotedCost);

  const result = useMemo(
    () =>
      calculateRoi({
        monthlyBillRs: toNumber(monthlyBill) ?? 0,
        systemCostRs: toNumber(systemCost) ?? 0,
        downPaymentRs: toNumber(downPayment) ?? 0,
        interestRatePct: toNumber(interestRate) ?? 0,
        tenureYears: toNumber(tenureYears) ?? 0,
      }),
    [monthlyBill, systemCost, downPayment, interestRate, tenureYears]
  );

  const reset = () => {
    setMonthlyBill('');
    setSystemSize('');
    setSystemCost('');
    setDownPayment('');
    setTenureYears('5');
    setInterestRate(String(DEFAULT_INTEREST_RATE_PCT));
    setSizeStatus('idle');
    /* Retire the quoted figures rather than parking the size field: sizeTouched
       stays FALSE so automatic sizing is armed and ready for the next bill the
       visitor types. Setting it true instead would silently demote the
       calculator to manual sizing for the rest of the visit. */
    setSizeTouched(false);
    setQuoteOverridden(true);
    /* Reset means "start from scratch", so the quotation cues go with the
       figures — a notice reading "loaded from your quotation" above a form the
       visitor has just emptied describes nothing on the page. */
    setRestoredHandoff(null);
  };

  /* The trail as this page will render it — see the matching note on the
     quotation page. Computed with `journeyOnArrival` rather than read back after
     the sentinel writes, so effect ordering cannot change the answer, and
     guarded so a quotation form the visitor never filled in does not become a
     crumb (or make `arrivedViaQuote` below claim an edit that has nothing to
     edit). */
  const journey = React.useMemo(() => journeyOnArrival(readJourney(), 'roi'), []);
  const crumbs = React.useMemo(() => journeyCrumbs(journey), [journey]);

  /* Did this visit come straight out of the quotation form?
     Read from the trail rather than from the URL params, and the two genuinely
     differ. A shared or bookmarked /roi-calculator?bill=…&cost=… link carries
     params into a browser that has never seen the quotation form, so `fromQuote`
     is true there while there is nothing whatsoever to go back and edit. The
     trail only says yes when this browser was on /quote immediately before —
     which is the question the closing CTA below is actually asking. */
  const arrivedViaQuote = journeyArrivedFrom(journey, 'quote');

  /* The live handoff, on the leg where the URL still describes it. Carries the
     two things the page cannot recompute later: the quotation's own savings
     figure, and whether this browser genuinely walked here from /quote (as
     opposed to opening a shared link that merely looks like it did).

     Memoised on its three primitives because the persist effect below takes
     `handoff` as a dependency: a fresh object literal every render would make
     that effect fire on every render too, and it writes to sessionStorage —
     which would mean a JSON serialise per frame while a slider is being
     dragged. All three inputs are themselves stable for a given location. */
  const liveHandoff = React.useMemo(
    () =>
      fromQuote ? { annualSavings: quotedAnnualSavings, viaQuote: arrivedViaQuote } : null,
    [fromQuote, quotedAnnualSavings, arrivedViaQuote]
  );

  /* One value for "these figures came out of a quotation", whether that is
     still visible in the URL or was restored with the draft. Everything below
     reads this rather than `fromQuote`, so a resumed session is
     indistinguishable from a fresh handoff — which is the whole point.

     Declared above the persist effect because that effect lists it as a
     dependency, and a dependency array is evaluated during render, at the
     useEffect call itself — a `const` further down the body would still be in
     its temporal dead zone at that moment. */
  const handoff = liveHandoff ?? restoredHandoff;
  const handoffSavings = handoff?.annualSavings ?? null;
  /* The Edit CTA still defers to a live trail when there is one: `handoff`
     carries the answer from the leg that created it, but a visitor who has
     since navigated /roi → /quote → /roi has a fresher one. */
  const showEditQuotationCta = arrivedViaQuote || Boolean(handoff?.viaQuote);

  /* Persist as it changes — the mirror of the quotation form's own effect.

     Suppressed while a recovery prompt is open for the same load-bearing
     reason: the fields are deliberately empty behind that modal, and a write
     would destroy the draft it is offering back before the visitor can accept
     it. */
  useEffect(() => {
    if (recoveryOffer) return;
    writeRoiDraft({
      monthlyBill,
      systemSize,
      systemCost,
      downPayment,
      tenureYears,
      interestRate,
      sizeTouched,
      quoteOverridden,
      /* Stored so the notice and the "Edit your quotation" CTA can come back
         with the figures — see the note on restoredHandoff. */
      handoff,
    });
  }, [
    recoveryOffer,
    monthlyBill,
    systemSize,
    systemCost,
    downPayment,
    tenureYears,
    interestRate,
    sizeTouched,
    quoteOverridden,
    handoff,
  ]);

  const applyRoiDraft = (draft) => {
    if (!draft) return;
    setMonthlyBill(draft.monthlyBill ?? '');
    setSystemSize(draft.systemSize ?? '');
    setSystemCost(draft.systemCost ?? '');
    setDownPayment(draft.downPayment ?? '');
    setTenureYears(draft.tenureYears ?? '5');
    setInterestRate(draft.interestRate ?? String(DEFAULT_INTEREST_RATE_PCT));
    setSizeTouched(draft.sizeTouched ?? false);
    setQuoteOverridden(draft.quoteOverridden ?? false);
    /* The visual half of the restore. Without this the fields come back and the
       cues that explain them do not, which reads as the page having half
       forgotten. */
    setRestoredHandoff(draft.handoff ?? null);
  };

  const handleResumeSession = () => {
    const draft = recoveryOffer;
    setRecoveryOffer(null);
    activateSession();
    // Answered — the quotation page must not ask again on the way back.
    resolveRecovery();
    applyRoiDraft(draft);
  };

  const handleStartNewSession = () => {
    setRecoveryOffer(null);
    clearSession();
  };

  const selfFinancing = result?.loan && result.netMonthlyOutflowRs <= 0;

  /* Only worth flagging when the gap is visible in the rendered figures —
     rounding alone should not produce a caveat. */
  const savingsDifferFromQuote =
    handoffSavings !== null &&
    result !== null &&
    Math.abs(result.annualSavingsRs - handoffSavings) / handoffSavings > 0.01;

  return (
    <div className="gps-root min-h-screen w-full bg-[#F4F6FB] pb-20">
      <style>{`
        .gps-root {
          --color-primary: #F5A623;
          --color-primary-text: #9C6509;
          --color-secondary: #0A2540;
          --color-text-muted: #5A6270;
          --color-border: #E2E5EA;
        }
        .text-primary-token { color: var(--color-primary); }
        .text-eyebrow-token { color: var(--color-primary-text); }
        .text-secondary-token { color: var(--color-secondary); }
        .text-muted-token { color: var(--color-text-muted); }
        .border-token { border-color: var(--color-border); }
        .focus-ring:focus-visible { outline: 2.5px solid var(--color-primary); outline-offset: 2px; }

        /* ── Journey breadcrumb ─────────────────────────────────────────────
           Sits on the dark hero, so the crumbs are glass chips rather than bare
           links — on this surface an underlined text link reads as body copy
           that happens to be underlined. Re-derived for the navy, not inverted:
           white at 0.88 on #12365C is ~11:1, and the current-page chip uses the
           light gold #FFD98A (~7.4:1) rather than brand #F5A623, which lands
           near 4.3:1 on this ground and has no headroom left for the tint
           behind it. */
        .roi-crumb {
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.20);
          color: rgba(255,255,255,0.88);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: background .2s ease, border-color .2s ease, transform .2s ease, color .2s ease;
        }
        a.roi-crumb:hover {
          background: rgba(255,255,255,0.18);
          border-color: rgba(245,166,35,0.70);
          color: #FFFFFF;
          transform: translateY(-1px);
        }
        /* The current page is a label, not a target: no hover, and the gold
           edge marks it as where you are. */
        .roi-crumb-current {
          background: rgba(245,166,35,0.18);
          border-color: rgba(245,166,35,0.52);
          color: #FFD98A;
          font-weight: 600;
        }

        /* ── "Loaded from your quotation" notice ────────────────────────────
           Back on the hero, and rebuilt for it.

           It has now been in three places, and the two it left both failed the
           same way. At the foot of the hero it sat inside the -mt-12 overlap and
           was cropped by the card rising over it. Moved down onto the light
           layer it stopped being cropped itself and started displacing the form
           instead: a full-width cream card plus a 2rem margin, directly above
           the input column, pushing the first fields down by around 90px on
           every arrival from a quotation.

           Directly under the title is the placement that has neither failure
           mode. It is part of the title block, so it cannot obstruct a field —
           there is no field within reach of it — and it is still read
           immediately before the inputs it describes, on every viewport, which
           a right-hand placement would lose the moment the grid stacked and put
           it after the whole form.

           A warm cream card with a gold edge — the same surface vocabulary the
           recovery modal's summary block uses, which is the site's established
           treatment for "here is what we already know about you". It replaces a
           translucent glass panel that took its colour from the navy behind it:
           the notice is the one thing in this band that is about the visitor's
           own quotation rather than about the page, and a surface that borrowed
           the hero's ground read as part of the hero.

           Being the brightest object in the band is the point of it now, so it
           is opaque rather than tinted — a blurred translucent fill over a
           gradient shifts hue across its own width — and it carries a real cast
           shadow, because a light card on a dark ground with no shadow looks
           cut out of the band rather than laid on it.

           Contrast, re-derived for the cream rather than inherited from the
           navy pass: navy body copy is 14.7:1 on #FEF8EA, the muted caveat line
           #5A6270 is 5.7:1, and the icon drops from brand gold to #9C6509
           (4.6:1) — raw #F5A623 measures about 1.9:1 here and would be a shape
           with no edge. */
        .roi-quote-note {
          background: linear-gradient(163deg, #FFFDF7 0%, #FEF8EA 100%);
          border: 1px solid rgba(245,166,35,0.42);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.92),
            0 2px 6px rgba(2,10,20,0.20),
            0 16px 36px -14px rgba(2,10,20,0.48);
        }

        /* Status chip on the System size label. */
        .roi-size-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          background: rgba(10,37,64,0.06);
          color: var(--color-text-muted);
          white-space: nowrap;
        }
        .roi-size-badge-auto {
          background: rgba(30,158,99,0.12);
          color: #1E7A4E;
        }

        .roi-input {
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
          transition: border-color .2s ease, box-shadow .2s ease;
        }
        .roi-input:focus {
          border-color: var(--color-primary);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.03), 0 0 0 3px rgba(245,166,35,0.22);
          outline: none;
        }
        .roi-panel {
          background: linear-gradient(135deg, rgba(10,37,64,0.97) 0%, rgba(18,54,92,0.94) 55%, rgba(15,45,82,0.97) 100%);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: var(--elev-4), var(--bevel-light-dark);
        }
        /* The input column is the surface the visitor works on; it sits one
           level below the results panel it feeds. */
        .roi-form-card {
          background-image: var(--surface-raised);
          box-shadow: var(--elev-2), var(--bevel-light);
        }
        .roi-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 58% 50% at 90% 4%, rgba(245,166,35,0.20) 0%, transparent 62%);
          pointer-events: none;
        }
        .roi-stat {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
        }
        .roi-cta {
          background: linear-gradient(135deg, #F5A623 0%, #FFD166 100%);
          color: #0A2540;
          border: 1px solid transparent;
          box-shadow: 0 6px 20px rgba(245,166,35,0.28);
          transition: all .3s ease;
        }
        .roi-cta:hover {
          background: transparent;
          color: #F5A623;
          border-color: #F5A623;
          transform: translateY(-2px);
        }
        .roi-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: var(--color-border);
          outline: none;
        }
        .roi-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(245,166,35,0.45);
          cursor: pointer;
        }
        .roi-slider::-moz-range-thumb {
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--color-primary); border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(245,166,35,0.45); cursor: pointer;
        }
        @media (prefers-reduced-motion: reduce) {
          .roi-cta, .roi-input { transition: none !important; transform: none !important; }
        }
      `}</style>

      {/* The same secondary strip /quote carries, in its calculator state. This
          page is the strip's third entry, so a visitor who arrived by pressing
          it used to watch the navigation they had just used disappear at the
          destination — and the way back to the quotation form became the
          breadcrumb, which only renders when the trail says they came from
          there. One component, both routes; see components/FlowTabs.jsx. */}
      <FlowTabs activeId={CALCULATOR_TAB_ID} />

      {/* -------- Hero --------
          Back to the navy ramp it was originally built with — #0A2540 →
          #12365C → #0F2D52, white copy, gold eyebrow. An intervening pass
          swapped it for a honey/cream band on the argument that a near-black
          hero put maximum contrast exactly where the eye should be travelling
          smoothly into the form below.

          That argument was about one seam, and it was paid for with the whole
          band: this is the page where a visitor commits to a number, and the
          dark hero is what gave that page its weight. The seam is worth fixing
          on its own terms instead, which is what the bottom ramp below does —
          the navy lifts toward the page ground across its last 160px, so the
          light card emerges from the band rather than being cut into it.

          Contrast is re-derived for the dark ground, not inherited: the eyebrow
          goes back to brand gold #F5A623, which runs 7.7:1 at the #0A2540 end of
          the ramp and 6.1:1 at the lightest — versus the 1.9:1 it measured on
          the cream, which is why the cream pass had to substitute #9C6509. The
          heading is white (12.3:1) and body copy is white at 0.80. */}
      <div
        className="w-full relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0A2540 0%, #12365C 46%, #0F2D52 100%)',
        }}
      >
        {/* Two soft light sources, same ambient vocabulary the homepage bands
            use — without them a flat navy reads as unfinished rather than as a
            deliberate surface. The gold radial sits top-right, where the site's
            other dark bands (.band-deep, .roi-panel) put theirs. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 54% 78% at 88% 4%, rgba(245,166,35,0.20) 0%, transparent 64%),'
              + 'radial-gradient(ellipse 50% 72% at 2% 96%, rgba(64,132,214,0.16) 0%, transparent 64%)',
          }}
        />
        {/* The dot texture every other dark band on this site carries —
            `.band-deep` on /about and /why-solar, the quotation page's own hero
            strip, the 1.9 MW banner. It was the one piece of the premium dark
            treatment this hero had never been given, which is why it read as a
            plain navy fill next to them rather than as the same surface. Same
            26px grid and same 0.045 alpha as the quotation hero, so the two
            pages of the flow are visibly one pair. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
        {/* The seam. A short ramp to the page's own ground colour across the
            bottom of the band, so the card that overlaps it by -mt-12 rises out
            of a lightening edge instead of landing on hard navy. */}
        <div
          className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(244,246,251,0.16) 0%, transparent 100%)' }}
        />
        {/* Title block, tightened.

            It was pt-8 / pb-20 around a 48px display heading and an 18px lead
            paragraph, and between the breadcrumb above it and the notice that
            used to sit below it the band ran tall enough to push the top of the
            form under the fold on a laptop — and, because of the overlap the
            card below takes, partly under the band itself.

            What changed: the top padding comes in, the heading drops one step at
            md (5xl → 4xl, 48px → 36px) and its margin with it, and the lead
            paragraph is 16px until md rather than 18px throughout. The bottom
            padding is deliberately NOT reduced — it is what the card's -mt-12
            eats into, and cutting it would put the card's corner level with the
            paragraph. */}
        <div className="container-site pt-6 pb-20 relative z-10">
          {/* Journey breadcrumb, now rendered from the trail rather than from
              `fromQuote`.

              The old condition was "did this visit arrive with query params",
              which answered the right question only on the outbound leg. Come
              back here a second time — from /quote, having already been here —
              and the params are gone, so the rail vanished exactly when the
              visitor had the most journey behind them to describe.

              Rendered only once there is more than one step: a single crumb is
              just the page's own name repeated above its heading — which is also
              what a direct arrival from the nav produces, so that visitor
              correctly gets no rail at all.

              At most two crumbs, so from the quotation form this reads exactly
              "Get Quotation › EMI & ROI Calculator" and nothing else. It used to
              be able to run to three and come out as a lap; see the trail cap
              note in lib/quoteSession.js.

              The first crumb is a real link, and that is the point — "edit my
              quotation" is the journey this exists to make possible. The quote
              page restores the form AND the estimate it was left with, and will
              not re-ask the contact-permission question. */}
          {crumbs.length > 1 && (
            <nav aria-label="Breadcrumb" className="mb-5">
              <ol className="flex items-center gap-1.5 text-xs font-medium flex-wrap">
                {crumbs.map((crumb, i) => (
                  <React.Fragment key={crumb.key}>
                    {i > 0 && (
                      <li aria-hidden="true" className="text-white/35">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </li>
                    )}
                    <li>
                      {crumb.current ? (
                        <span
                          aria-current="page"
                          className="roi-crumb roi-crumb-current inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5"
                        >
                          {crumb.label}
                        </span>
                      ) : (
                        <Link
                          to={crumb.to}
                          className="roi-crumb focus-ring inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          {crumb.label}
                        </Link>
                      )}
                    </li>
                  </React.Fragment>
                ))}
              </ol>
            </nav>
          )}

          <p className="text-xs font-semibold tracking-wide uppercase mb-2.5 text-primary-token">
            Finance Planner
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            EMI &amp; ROI Calculator
          </h1>
          <p className="text-white/80 leading-relaxed max-w-2xl text-base md:text-lg">
            Work out what a rooftop system saves you every year, what the monthly
            instalment looks like if you finance it, and how long it takes to pay for itself.
          </p>

          {/* Directly below the title — see the .roi-quote-note block above for
              why this is where it lives now. Capped at the same measure as the
              paragraph so it reads as part of the title block rather than as a
              full-bleed banner across the band. */}
          {/* `handoff`, not `fromQuote`: this has to survive a detour. See the
              note on restoredHandoff — a resumed session shows exactly the same
              notice it was left with, because the fact it states is still
              true. */}
          {handoff && (
            <div className="roi-quote-note rounded-xl px-4 py-3.5 md:px-5 mt-6 max-w-2xl flex items-start gap-3">
              {/* --color-primary-text, not brand gold: on the cream surface
                  #F5A623 is about 1.9:1 and the tick loses its own outline. */}
              <BadgeCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-eyebrow-token" />
              <div className="text-sm leading-relaxed">
                <p className="text-secondary-token">
                  <span className="font-semibold">Loaded from your quotation.</span> Your
                  bill and system cost are filled in below, and the savings and instalment are
                  already worked out — adjust the loan terms to see how the instalment changes.
                </p>
                {/* The two figures come from different models: /quote derives
                    the offset from the capacity actually specified, this page
                    applies a flat 95%. They agree on a correctly sized system
                    and diverge on an undersized one, so say so rather than let
                    the visitor find two numbers and trust neither. */}
                {savingsDifferFromQuote && (
                  <p className="mt-2 text-muted-token">
                    Your quotation put annual savings at {formatINR(handoffSavings)}, based on
                    the capacity we specified for you. The figure here models a flat 95% bill
                    offset, so treat the quotation as the authoritative one.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ⚠ `relative z-10` is load-bearing, and this is the actual cause of the
          cropping this phase was asked to fix.

          The hero above is `position: relative`. This container was static. Two
          siblings in the same stacking context paint in the order CSS 2.1
          Appendix E lays down, and a positioned element with z-index:auto paints
          in step 8 while a static block's background paints in step 4 — so the
          navy band was painting OVER the top of whatever followed it, and what
          followed it is pulled 48px up into that band by -mt-12.

          The visible result was the first 48px of the input card being covered:
          the "Your details" heading, the Reset control and the top edge of the
          first field, hidden behind navy on every single visit. The negative
          margin was doing what it was asked; nothing was ever lifted above the
          band it was being pulled into.

          Anything given a negative top margin against that hero needs to be in
          this container, or it needs its own z-index. */}
      <div className="container-site -mt-12 relative z-10">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* ================= INPUTS ================= */}
          <div className="roi-form-card lg:col-span-3 rounded-2xl border border-token p-6 md:p-8">
            <div className="flex items-center justify-between mb-7">
              <h2 className="text-lg font-bold text-secondary-token">Your details</h2>
              <button
                onClick={reset}
                className="focus-ring rounded-md inline-flex items-center gap-1.5 text-xs font-semibold text-muted-token hover:text-secondary-token transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            <div className="space-y-6">
              <Field
                label="Average monthly electricity bill"
                hint="What you currently pay in a typical month"
                prefix="₹"
              >
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={monthlyBill}
                  onChange={(e) => setMonthlyBill(e.target.value)}
                  placeholder="e.g. 6000"
                  className="roi-input w-full border border-token rounded-md pl-8 pr-3 py-2.5 text-sm text-secondary-token"
                />
              </Field>

              {/* System size is calculated, never asked for, so the field is
                  hidden from the form. The input and its state are deliberately
                  left mounted rather than deleted: `systemSize` is what the
                  cost-derivation effect above reads, and the draft written to
                  storage still carries it, so every downstream figure keeps
                  working exactly as before — only the row is invisible.

                  The one exception is `sizeStatus === 'failed'`. Sizing lives on
                  the server on purpose (see lib/api.js — the formula is built
                  from the protected engine constants and must not be duplicated
                  here), so when that lookup fails there is no capacity and no
                  cost, and the calculator has nothing to compute. Revealing the
                  field in that state alone is the only thing standing between an
                  API hiccup and a permanently dead page; its hint already reads
                  "enter your system size to continue".

                  The hint changes with sizeStatus so the field always says where
                  its value came from; a number that fills itself in with no
                  explanation reads as a bug. */}
              <div className={sizeStatus === 'failed' ? undefined : 'hidden'} aria-hidden={sizeStatus !== 'failed'}>
              <Field
                label="System size"
                labelAccessory={
                  sizeStatus === 'loading' ? (
                    <span className="roi-size-badge">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Calculating
                    </span>
                  ) : sizeStatus === 'auto' && !sizeTouched ? (
                    <span className="roi-size-badge roi-size-badge-auto">
                      <BadgeCheck className="w-3 h-3" />
                      Auto-calculated
                    </span>
                  ) : null
                }
                /* Keyed on where the SIZE came from, never on the cost. Those
                   are different provenances and /quote is exactly the case that
                   separates them: it hands over a cost but no capacity (the
                   backend does not expose system size — see the note at the top
                   of this file), so a quoted cost routinely sits beside a size
                   this page derived itself. Keying this off costIsFromQuote
                   would have the field claim a capacity came from the quotation
                   whenever the cost did. */
                hint={
                  sizeStatus === 'failed'
                    ? 'Automatic sizing is unavailable right now — enter your system size to continue.'
                    : sizeTouched
                      ? `Your figure. Press Reset to go back to automatic sizing. Cost is estimated at about ${formatINR(INDICATIVE_COST_PER_KW_RS)} per kW.`
                      : activeQuotedSize !== null
                        ? 'The capacity we specified in your quotation.'
                        : 'Worked out from your monthly bill using our standard sizing model. Adjust it if you want to model a different system.'
                }
                suffix="kW"
              >
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  inputMode="decimal"
                  value={systemSize}
                  onChange={(e) => {
                    setSizeTouched(true);
                    setSystemSize(e.target.value);
                  }}
                  placeholder={sizeStatus === 'loading' ? 'Calculating…' : 'e.g. 5'}
                  className="roi-input w-full border border-token rounded-md pl-3 pr-12 py-2.5 text-sm text-secondary-token"
                />
              </Field>
              </div>

              {/* "Total system cost" used to be an input here. It is now derived
                  (bill → size → cost) and displayed in the results panel as a
                  figure rather than a question. Asking a visitor for the system
                  cost was asking them for the answer they came to find. */}

              <Field label="Down payment" hint="Paid upfront — the rest is financed" prefix="₹">
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  placeholder="0"
                  className="roi-input w-full border border-token rounded-md pl-8 pr-3 py-2.5 text-sm text-secondary-token"
                />
              </Field>

              <SliderField
                label="Loan tenure"
                value={tenureYears}
                display={`${tenureYears || 0} ${Number(tenureYears) === 1 ? 'year' : 'years'}`}
                min={1}
                max={15}
                step={1}
                onChange={setTenureYears}
              />

              <SliderField
                label="Interest rate"
                value={interestRate}
                display={`${interestRate || 0}% p.a.`}
                min={0}
                max={18}
                step={0.25}
                onChange={setInterestRate}
                hint="Indicative — confirm the actual rate with your lender"
              />
            </div>
          </div>

          {/* ================= RESULTS ================= */}
          <div className="lg:col-span-2 lg:sticky lg:top-28 self-start space-y-5">
            {!result ? (
              <div className="rounded-2xl border border-dashed border-token bg-white p-8 text-center">
                <Sun className="w-9 h-9 mx-auto mb-4 text-muted-token/45" />
                <p className="text-sm font-semibold text-secondary-token mb-1.5">
                  Enter your bill to begin
                </p>
                <p className="text-xs text-muted-token leading-relaxed">
                  One number is enough. We size the system from your monthly bill, then your
                  cost, savings and instalment appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Phase 3 — the system cost, moved out of the form.
                    It leads the results panel because it is the first thing the
                    savings and the instalment below are both measured against:
                    every figure in this column is derived from it, so it reads
                    as the premise rather than as another output. */}
                <div className="bg-white rounded-2xl border border-token p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Receipt className="w-5 h-5 text-primary-token" />
                    <p className="text-sm font-semibold text-secondary-token">Total system cost</p>
                  </div>
                  <p
                    className="text-3xl font-bold text-secondary-token mb-1"
                    style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                  >
                    {formatINR(toNumber(systemCost) ?? 0)}
                  </p>
                  {/* Only pair the cost with a capacity when the two actually
                      describe the same system. A cost from the quotation sits
                      beside a size this page derived from the bill, and those
                      are two different systems — printing "₹93,253 for a 3.5 kW
                      system" would invent a per-kW rate that is not ours. */}
                  {toNumber(systemSize) > 0 && (!costIsFromQuote || activeQuotedSize !== null) && (
                    <p className="text-xs text-muted-token">
                      for a {toNumber(systemSize)} kW system
                    </p>
                  )}
                  <p className="text-[11px] text-muted-token leading-relaxed mt-3 pt-3 border-t border-token">
                    {costIsFromQuote ? (
                      <>
                        <BadgeCheck
                          className="w-3.5 h-3.5 inline-block -mt-0.5 mr-1"
                          style={{ color: '#1E9E63' }}
                        />
                        The exact figure from your quotation.
                      </>
                    ) : (
                      <>
                        Indicative, at about {formatINR(INDICATIVE_COST_PER_KW_RS)} per kW before
                        subsidy.{' '}
                        <Link to="/quote" className="underline text-secondary-token font-medium">
                          Run a quotation
                        </Link>{' '}
                        for a firm price.
                      </>
                    )}
                  </p>
                </div>

                {/* Annual savings */}
                <div className="roi-panel relative overflow-hidden rounded-2xl p-6">
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(52,199,89,0.18)' }}>
                        <TrendingUp className="w-4 h-4" style={{ color: '#34C759' }} />
                      </div>
                      <p className="text-sm font-semibold text-white/90">Annual Savings</p>
                    </div>

                    <p
                      className="text-4xl font-bold mb-1"
                      style={{
                        fontFamily: "'Space Grotesk', system-ui, sans-serif",
                        background: 'linear-gradient(135deg, #F5A623 0%, #FFD700 50%, #F5A623 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 10px rgba(245,166,35,0.28))',
                      }}
                    >
                      {formatINR(result.annualSavingsRs)}
                    </p>
                    <p className="text-xs text-white/50 mb-5">
                      {formatINR(result.monthlySavingsRs)} a month · {result.savingsPct}% bill reduction
                    </p>

                    <div className="space-y-2.5 text-sm border-t border-white/10 pt-4">
                      <Row label="Current yearly bill" value={formatINR(result.currentAnnualBillRs)} muted strike />
                      <Row label="Yearly bill after solar" value={formatINR(result.newAnnualBillRs)} accent="#34C759" />
                      <Row label="Over 25 years" value={formatINR(result.twentyFiveYearSavingsRs)} />
                    </div>
                  </div>
                </div>

                {/* EMI */}
                <div className="bg-white rounded-2xl border border-token p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Wallet className="w-5 h-5 text-primary-token" />
                    <p className="text-sm font-semibold text-secondary-token">EMI Breakdown</p>
                  </div>

                  {result.loan ? (
                    <>
                      <p className="text-3xl font-bold text-secondary-token mb-1" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                        {formatINR(result.loan.emi)}
                        <span className="text-sm font-medium text-muted-token"> / month</span>
                      </p>
                      <p className="text-xs text-muted-token mb-5">
                        over {result.loan.months} instalments
                      </p>

                      <div className="space-y-2.5 text-sm border-t border-token pt-4">
                        <Row label="Loan amount" value={formatINR(result.loan.principal)} light />
                        {result.downPaymentRs > 0 && (
                          <Row label="Down payment" value={formatINR(result.downPaymentRs)} light />
                        )}
                        <Row label="Total interest" value={formatINR(result.loan.totalInterest)} light />
                        <Row label="Total repayable" value={formatINR(result.loan.totalPayable)} light />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-token leading-relaxed">
                      No loan required — the down payment covers the full system cost.
                    </p>
                  )}
                </div>

                {/* Net monthly position */}
                {result.loan && (
                  <div
                    className="rounded-2xl p-5 border"
                    style={
                      selfFinancing
                        ? { background: 'rgba(52,199,89,0.08)', borderColor: 'rgba(52,199,89,0.35)' }
                        : { background: 'rgba(245,166,35,0.07)', borderColor: 'rgba(245,166,35,0.35)' }
                    }
                  >
                    <div className="flex items-start gap-3">
                      <PiggyBank
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: selfFinancing ? '#1E9E63' : '#9C6509' }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-secondary-token mb-1">
                          {selfFinancing
                            ? 'Your savings cover the instalment'
                            : `About ${formatINR(Math.abs(result.netMonthlyOutflowRs))} a month out of pocket`}
                        </p>
                        <p className="text-xs text-muted-token leading-relaxed">
                          {selfFinancing
                            ? `Monthly savings of ${formatINR(result.monthlySavingsRs)} exceed the ${formatINR(result.loan.emi)} instalment — and the savings continue long after the loan ends.`
                            : `The instalment is ${formatINR(result.loan.emi)} against ${formatINR(result.monthlySavingsRs)} of monthly savings. Once the loan is repaid, the full saving is yours.`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payback */}
                {result.simplePaybackYears && (
                  <div className="bg-white rounded-2xl border border-token p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,166,35,0.12)' }}>
                      <Calendar className="w-5 h-5 text-primary-token" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-token mb-0.5">Simple payback (cash purchase)</p>
                      <p className="text-lg font-bold text-secondary-token">
                        {result.simplePaybackYears.toFixed(1)} years
                      </p>
                    </div>
                  </div>
                )}

                {/* Closing CTA, in two voices for two situations.

                    Both go to /quote, and that is exactly why the label has to
                    change: the same destination means opposite things depending
                    on how the visitor got here. Someone who came through the
                    quotation form has one there already — telling them to "get"
                    a quotation reads as though the one they just built has been
                    forgotten, and it is the single most common way a flow makes
                    a visitor doubt it kept their work. Someone who opened the
                    calculator from the nav has nothing to edit, and inviting
                    them to edit it would be asking about a document that does
                    not exist.

                    Keyed on the journey trail, not on the URL params — see the
                    note on `arrivedViaQuote`. The form restores its answers AND
                    the estimate it was left with, so "edit" is a promise the
                    quotation page actually keeps. */}
                <Link
                  to="/quote"
                  className="roi-cta focus-ring w-full inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold"
                >
                  {showEditQuotationCta ? (
                    <>
                      <Pencil className="w-4 h-4" /> Edit your quotation
                    </>
                  ) : (
                    <>
                      Get an exact quotation <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* -------- Assumptions -------- */}
        <div className="mt-12 rounded-2xl border border-token bg-white p-6 md:p-7 flex gap-4">
          <Info className="w-5 h-5 text-secondary-token flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-secondary-token mb-2">How these numbers are worked out</p>
            <ul className="text-xs text-muted-token leading-relaxed space-y-1.5 list-disc pl-4">
              <li>
                Savings assume a <strong>95% reduction</strong> in your electricity bill, which is what a
                correctly sized system achieves. A system smaller than your consumption will save less.
              </li>
              <li>
                EMI is calculated on a reducing-balance basis from the loan amount, rate and tenure you enter.
                Actual terms and processing fees are set by your lender.
              </li>
              <li>
                Simple payback divides system cost by annual savings. It does not model panel degradation or
                future tariff increases — the first works against you, the second in your favour.
              </li>
              <li>
                System cost is indicative unless it came from a quotation. For a firm figure,
                {' '}<Link to="/quote" className="underline text-secondary-token font-medium">run a quotation</Link>.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Abandoned-flow recovery. Never opens on an arrival from /quote — that
          handoff is an explicit instruction and carries its own figures. */}
      <SessionRecoveryModal
        open={Boolean(recoveryOffer)}
        summary={recoveryOffer ? roiDraftSummary(recoveryOffer) : null}
        onResume={handleResumeSession}
        onStartNew={handleStartNewSession}
      />
    </div>
  );
}

/**
 * What the recovery prompt shows about a parked calculator draft. Same job as
 * quoteDraftSummary on the quotation page — let the visitor recognise the
 * session rather than recall it.
 */
function roiDraftSummary(draft) {
  const rows = [];
  const bill = toNumber(draft?.monthlyBill);
  const cost = toNumber(draft?.systemCost);
  if (bill !== null && bill > 0) {
    rows.push({ label: 'Monthly bill', value: formatINR(bill), icon: 'file' });
  }
  if (cost !== null && cost > 0) {
    rows.push({ label: 'System cost', value: formatINR(cost), icon: 'calculator' });
  }
  return rows;
}

/* ---------------- small presentational helpers ---------------- */

function Field({ label, hint, prefix, suffix, children, labelAccessory }) {
  return (
    <div>
      {/* The accessory sits on the label row rather than beside the hint so the
          sizing status is visible without reading the small print. */}
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <label className="block text-sm font-medium text-secondary-token">{label}</label>
        {labelAccessory}
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-token pointer-events-none">
            {prefix}
          </span>
        )}
        {children}
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-token pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted-token mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

function SliderField({ label, value, display, min, max, step, onChange, hint }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-secondary-token">{label}</label>
        <span className="text-sm font-bold text-secondary-token">{display}</span>
      </div>
      <input
        type="range"
        className="roi-slider focus-ring"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      />
      <div className="flex justify-between text-[11px] text-muted-token mt-1.5">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {hint && <p className="text-xs text-muted-token mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}

function Row({ label, value, muted, strike, accent, light }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className={`text-xs ${light ? 'text-muted-token' : muted ? 'text-white/50' : 'text-white/70'}`}>
        {label}
      </span>
      <span
        className={`text-sm font-semibold ${
          light ? 'text-secondary-token' : strike ? 'text-white/50 line-through' : 'text-white'
        }`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
