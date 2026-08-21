import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Sun,
  Zap,
  BatteryCharging,
  Plug,
  Plus,
  Trash2,
  Mail,
  MapPin,
  Clock,
  Calculator,
  Building2,
  FileText,
  Download,
  Info,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  User,
  Phone,
  BadgeCheck,
  ShieldCheck,
  Wifi,
  Battery,
  Wrench,
  Star,
  ArrowUp,
  ChevronRight,
  Pencil,
  Lock,
} from "lucide-react";
import WhatsAppIcon from "./components/WhatsAppIcon";
import Logo from "./components/Logo";
import SchemeCTA from "./components/SchemeCTA";
import SessionRecoveryModal from "./components/SessionRecoveryModal";
import UnsavedQuoteModal from "./components/UnsavedQuoteModal";
import FlowTabs, { QUOTE_TABS } from "./components/FlowTabs";
import { QUOTATION_ENDPOINT } from "./lib/api";
import useNavigationGuard, { BACK_NAVIGATION } from "./lib/useNavigationGuard";
import {
  activateSession,
  clearSession,
  hasAnsweredLeadGate,
  isRecoveryPending,
  journeyCrumbs,
  journeyOnArrival,
  markLeadGateAnswered,
  quoteDraftHasContent,
  quoteDraftHasUserInput,
  readJourney,
  readQuoteDraft,
  readStoredLead,
  resolveRecovery,
  writeQuoteDraft,
  writeStoredLead,
  clearQuoteDraft,
} from "./lib/quoteSession";
import { PROJECTS } from "./data/projectsData";
import {
  ADDRESS_LINES,
  COMPANY_NAME,
  EMAIL,
  EMAIL_HREF,
  PHONE_DISPLAY,
  PHONE_HREF,
  WHATSAPP_HREF,
  WORKING_DAYS,
  WORKING_HOURS,
} from "./data/businessInfo";

/* ---------------------------------------------------------
   Reference data (labels only — wattage mapping is a
   backend-only calculation per Doc 3 §17 and is never
   exposed in the frontend).
--------------------------------------------------------- */
const APPLIANCES = [
  { id: "AC", label: "AC" },
  { id: "OVEN", label: "Oven" },
  { id: "FRIDGE_2DOOR", label: "Refrigerator (2 Door)" },
  { id: "FRIDGE_1DOOR", label: "Refrigerator (1 Door)" },
  { id: "TV", label: "TV" },
  { id: "WIFI", label: "WiFi Router" },
  { id: "CCTV_4", label: "CCTV (4 Camera)" },
  { id: "CCTV_8", label: "CCTV (8 Camera)" },
  { id: "CCTV_16", label: "CCTV (16 Camera)" },
  { id: "FAN_REGULAR", label: "Fan (Regular)" },
  { id: "FAN_BLDC", label: "Fan (BLDC)" },
  { id: "TUBE_LIGHT", label: "Tube Light" },
  { id: "CEILING_LIGHT", label: "Ceiling Light" },
  { id: "PC", label: "PC" },
  { id: "LAPTOP", label: "Laptop" },
  // A8: New appliances (researched typical wattage values — confirm with business)
  { id: "AIR_PURIFIER", label: "Air Purifier" },
  { id: "WATER_PURIFIER", label: "Water Purifier (RO/UV)" },
  { id: "WASHING_MACHINE", label: "Washing Machine" },
  { id: "MICROWAVE", label: "Microwave" },
  { id: "IRON", label: "Iron" },
  { id: "MIXER_GRINDER", label: "Mixer / Grinder" },
];

let rowIdCounter = 1;
const nextRowId = () => `row-${rowIdCounter++}`;

/* ---------------------------------------------------------
   Backend integration (Phase 8).
   The origin moved to lib/api.js in Phase 3 — the EMI calculator became a
   second caller, and two hardcoded origins is how one page ends up pointed at
   production while the other still talks to localhost.
--------------------------------------------------------- */

/* ---------------------------------------------------------
   Session draft.

   The storage wrappers, the keys and the shape of a draft used to be declared
   here. They moved to lib/quoteSession.js in Phase 3 round 2, when the return
   trip from /roi-calculator had to become a real thing rather than a one-way
   handoff over query params: the calculator could not see any of this from
   inside a page component's module scope, so both ends now read one store.

   What survives a trip to /roi-calculator and back:

     · the quotation form's inputs, so "go back and edit your quotation" edits
       something rather than starting over;
     · the calculated estimate itself — base cost, subsidy and final figure — so
       the returning visitor sees the estimate they left, not an empty panel
       above a filled-in form;
     · whether the contact-permission question has already been answered, so a
       visitor who returns to adjust a figure is not interrogated again on every
       recalculation. Being asked "may we contact you?" three times in one visit
       reads as nagging, and the answer has not changed since the first time.
--------------------------------------------------------- */

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

/* The tab list and the strip that renders it moved to components/FlowTabs.jsx
   so /roi-calculator can render the identical strip — see the note there. */

export default function GurukrupaPages() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const requested = searchParams.get("tab");
    return QUOTE_TABS.some(t => t.id === requested) ? requested : "quotation";
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  /* Keep the panel in step with `?tab=`. The initializer above only runs at
     mount, and this component stays mounted across every /quote → /quote
     navigation — so arriving from the header's Contact link while already on
     the page changed the URL and nothing else. The same staleness is what
     would strand /quote#how-we-work on whichever tab happened to be open.

     A tab clicked in the strip does not touch the URL, so searchParams does not
     change and this never fights the user's own selection. */
  useEffect(() => {
    const requested = searchParams.get("tab");
    setActiveTab(QUOTE_TABS.some((t) => t.id === requested) ? requested : "quotation");
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="gps-root min-h-screen w-full">
      <GlobalStyles />

      <FlowTabs activeId={activeTab} onSelectTab={setActiveTab} />

      <main>
        {activeTab === "quotation" && <QuotationPage />}
        {activeTab === "projects" && <ProjectsPage />}
                {activeTab === "brochure" && <BrochurePage />}
        {activeTab === "contact" && <ContactPage />}
      </main>

      {/* Task D4 — Floating WhatsApp button */}
      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        id="whatsapp-float-btn"
        style={{
          position: "fixed",
          bottom: "1.75rem",
          right: "1.75rem",
          zIndex: 50,
          width: "3.5rem",
          height: "3.5rem",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
          boxShadow: "0 6px 22px rgba(37,211,102,0.45), 0 2px 8px rgba(0,0,0,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform .2s ease, box-shadow .2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.10) translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 10px 32px rgba(37,211,102,0.60), 0 2px 8px rgba(0,0,0,0.14)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "0 6px 22px rgba(37,211,102,0.45), 0 2px 8px rgba(0,0,0,0.14)";
        }}
      >
        <WhatsAppIcon className="w-6 h-6 text-white" />
      </a>

      {/* Floating Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed z-50 p-3.5 rounded-full bg-primary-token text-secondary-token shadow-[0_4px_14px_rgba(245,166,35,0.4)] focus-ring transition-all duration-500 hover:scale-110 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(245,166,35,0.55)] ${showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
          }`}
        style={{ bottom: "6.25rem", right: "1.75rem" }}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}

/**
 * What the recovery prompt shows the visitor about the draft it is offering.
 *
 * "Resume your previous session" asks someone to remember what that session
 * was, which after a detour through the blog they very often cannot. Naming the
 * system type and the estimate turns the decision from a guess into a
 * recognition.
 */
function quoteDraftSummary(draft) {
  const rows = [];
  if (draft?.productType) {
    rows.push({
      label: "System type",
      value: draft.productType.replace("_", " "),
      icon: "file",
    });
  }
  if (draft?.result?.estimateCost != null) {
    rows.push({
      label: "Your estimate",
      value: formatINR(draft.result.estimateCost),
      icon: "calculator",
    });
  }
  return rows;
}

/* ===========================================================
   GET QUOTATION PAGE
=========================================================== */
function QuotationPage() {
  const [searchParams] = useSearchParams();

  /* Restore whatever the visitor last had in this form.
     The journey the breadcrumb on /roi-calculator advertises is "go back and
     edit your quotation", and that is only true if the form still holds the
     answers. This component unmounts on every route change, so without a
     restore the visitor would land on an empty form and have to retype
     everything — which is not editing, it is starting again.

     Whether that restore happens silently depends on how they got here, and
     this is the one read that decides it:

       · still inside the journey (came from /roi-calculator, or never left) →
         `initial` carries the draft and the form comes back filled.
       · returned after wandering off → `offer` carries it instead, the form
         starts empty, and SessionRecoveryModal asks first.

     `isRecoveryPending()` rather than `!isSessionActive()`. The two used to be
     the same read and it could not tell those cases apart: it said "parked" for
     a visitor who had genuinely wandered off AND for one who had simply arrived
     on a view of /quote that does not mount this component, which is every tab
     but this one. It is now armed only by an actual departure from the flow and
     disarmed only by the visitor answering — so a prompt cannot appear inside
     an unbroken journey, and cannot be swallowed by one either.

     One read, two mutually exclusive destinations, computed at render time so
     the very first paint is already correct — no flash of a filled form behind
     a modal asking whether to fill it. */
  const bootstrap = React.useMemo(() => {
    const draft = readQuoteDraft();
    const offer = quoteDraftHasContent(draft) && isRecoveryPending();
    return {
      initial: offer ? null : draft,
      offer: offer ? draft : null,
    };
  }, []);
  const restored = bootstrap.initial;

  const [recoveryOffer, setRecoveryOffer] = useState(bootstrap.offer);

  /* The trail as this page will render it. Computed from the stored trail plus
     this page's own step rather than read back after the sentinel writes it, so
     it cannot depend on which effect happens to run first — `journeyOnArrival`
     is the same function the sentinel uses and both callers put the same value
     in.

     It is also where the input guard bites on this page: a visit to the EMI
     calculator that entered nothing is not a step the rail may claim the
     visitor came through. See lib/quoteSession.js. */
  const crumbs = React.useMemo(
    () => journeyCrumbs(journeyOnArrival(readJourney(), "quote")),
    []
  );

  // Deep-link pre-selection: Homepage's product-card CTAs link here with
  // ?type=ON_GRID or ?type=HYBRID. Read once via a lazy initializer rather
  // than a useEffect, so the correct type is selected on the very first
  // render (no flash of "no type selected").
  //
  // An explicit ?type= in the URL outranks the restored draft: it is a fresh
  // instruction from the click that just happened, whereas the draft is a
  // record of an older one.
  const [productType, setProductType] = useState(() => {
    const requested = searchParams.get("type");
    if (requested === "ON_GRID" || requested === "HYBRID") return requested;
    return restored?.productType ?? null;
  });
  const [applications, setApplications] = useState(
    () =>
      restored?.applications?.length
        ? // rowId is a render key, not data — regenerate rather than trusting a
          // stored value, so a restored row cannot collide with a row the
          // visitor adds afterwards.
          restored.applications.map((a) => ({ ...a, rowId: nextRowId() }))
        : [{ rowId: nextRowId(), applianceId: "", quantity: 1 }]
  );
  const [backupDaytime, setBackupDaytime] = useState(restored?.backupDaytime ?? "");
  const [backupNighttime, setBackupNighttime] = useState(restored?.backupNighttime ?? "");
  const [phase, setPhase] = useState(restored?.phase ?? ""); // '1' | '3'
  const [peakBill, setPeakBill] = useState(restored?.peakBill ?? "");
  const [bottomBill, setBottomBill] = useState(restored?.bottomBill ?? "");

  /* The estimate survives the round trip too, which is the whole of "including
     the Base Cost". The draft used to carry only the inputs, so a visitor who
     went to the calculator and came back found every field filled in and the
     estimate panel empty — the one number they went to the calculator to
     finance had silently disappeared from the page that produced it.

     `status` is derived rather than stored: a persisted "submitting" would
     restore a spinner attached to a fetch that died with the last page. */
  const [status, setStatus] = useState(restored?.result ? "success" : "idle"); // idle | submitting | success | error
  const [result, setResult] = useState(restored?.result ?? null);
  const [errorMessage, setErrorMessage] = useState(null);

  /* ── Has this session already produced an estimate? ───────────────────────
     Seeded from the restored draft, so arriving here from the EMI calculator's
     "Edit your quotation" counts — the visitor is returning to work they have
     already done, not starting.

     Two things read it, and both are about not treating a returning visitor as
     a new one: the lead gate below (which must not re-interrogate them) and the
     system-type lock (which must not let an edit silently become a different
     product). Kept in state rather than read from `restored` at each site so
     Start over and "start a new session" can genuinely clear it. */
  const [hasCalculated, setHasCalculated] = useState(Boolean(restored?.result));

  /* ── System type lock ─────────────────────────────────────────────────────
     The product type of the estimate this session already carries, or null when
     there is nothing to protect.

     Why lock it at all: from the EMI page the promise is "edit your quotation",
     and an On-Grid quotation edited into a Hybrid one is not an edit — it is a
     different quotation wearing the previous one's session. The two paths ask
     for completely different inputs (bill and phase vs appliances and backup
     hours), so switching abandons every answer the visitor gave and leaves the
     estimate card showing a figure derived from a form that no longer exists.

     Deliberately seeded from the RESTORED draft rather than from live state, so
     it can only ever engage on a return visit. Someone who calculates On-Grid
     on this mount and then decides to try Hybrid is exploring, not editing, and
     is left alone. Start over is the escape hatch, and the note under the
     selector says so. */
  const [lockedProductType, setLockedProductType] = useState(
    restored?.result?.productType ?? null
  );

  // Task B — Permission-based lead flow (3 steps):
  //   null        → form not submitted yet
  //   "permission"→ PermissionModal shown: "May we contact you?"
  //   "details"   → LeadCaptureModal shown: name / WhatsApp / city
  //   "reminder"  → ReminderModal: "You skipped — here's your estimate anyway"
  // UX rule: the customer must NEVER be blocked from seeing their estimate.
  // Pressing Escape, backdrop-click, or "No thanks" on permission or reminder
  // → falls through to submitQuotation(null) immediately.
  const [leadFlowStep, setLeadFlowStep] = useState(null); // null|"permission"|"details"|"reminder"
  const [capturedLead, setCapturedLead] = useState(() => readStoredLead());

  const totalApplications = useMemo(
    () => applications.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0),
    [applications]
  );

  // QA Phase 9 (Issue F5): wrapped in useCallback with empty dependency arrays.
  // Each only uses a functional setState update, so it never needs to close
  // over changing state — this keeps the function reference stable across
  // renders, which is what lets React.memo on <ApplianceRow> actually skip
  // re-rendering rows the user isn't currently editing.
  const addApplianceRow = useCallback(() => {
    setApplications((prev) => [...prev, { rowId: nextRowId(), applianceId: "", quantity: 1 }]);
  }, []);

  const removeApplianceRow = useCallback((rowId) => {
    setApplications((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  }, []);

  const updateApplianceRow = useCallback((rowId, field, value) => {
    setApplications((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r))
    );
  }, []);

  const isHybridValid =
    productType === "HYBRID" &&
    applications.some((a) => a.applianceId && Number(a.quantity) > 0) &&
    (backupDaytime !== "" || backupNighttime !== "");

  const isOnGridValid =
    productType === "ON_GRID" &&
    phase !== "" &&
    Number(peakBill) > 0 &&
    Number(bottomBill) > 0;

  const canSubmit = isHybridValid || isOnGridValid;

  // submitQuotation accepts the lead object as a direct parameter to avoid
  // a React async-state race: handleLeadCaptured calls setCapturedLead AND
  // submitQuotation in the same tick, so the state update hasn't flushed yet
  // when submitQuotation runs. Passing `lead` explicitly sidesteps this.
  const submitQuotation = async (lead) => {
    if (!canSubmit) return;
    setStatus("submitting");
    setResult(null);
    setErrorMessage(null);

    /* -----------------------------------------------------
       FRONTEND BOUNDARY NOTICE:
       This is the exact QuotationRequest payload sent to the
       backend (Phase 2 §5.2 / backend/types/quotation.types.ts).
       No calculation happens here — the frontend only collects
       inputs and renders whatever the backend returns.
       The optional `lead` field carries the visitor's contact
       details to the backend for in-memory storage
       (backend/config/runtimeLeadStore.ts).
    ----------------------------------------------------- */
    const basePayload =
      productType === "HYBRID"
        ? {
          productType,
          applications: applications
            .filter((a) => a.applianceId && Number(a.quantity) > 0)
            .map((a) => ({ applianceId: a.applianceId, quantity: Number(a.quantity) })),
          backupHoursDay: backupDaytime === "" ? null : Number(backupDaytime),
          backupHoursNight: backupNighttime === "" ? null : Number(backupNighttime),
        }
        : {
          productType,
          phase: phase === "1" ? "1_PHASE" : "3_PHASE",
          lightBill: { peak: Number(peakBill), bottom: Number(bottomBill) },
        };

    // Attach lead data when present — backend accepts it as optional.
    const payload = lead ? { ...basePayload, lead } : basePayload;

    try {
      const response = await fetch(QUOTATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        // Backend returns a sanitized { error: { code, message } } shape
        // (middlewares/errorHandler.middleware.ts) — never a stack trace.
        const message =
          body?.error?.message ||
          "The quotation request could not be processed. Please check your inputs and try again.";
        setErrorMessage(message);
        setStatus("error");
        return;
      }

      setResult({
        estimateCost: body.estimateCost,
        productType: body.productType,
        disclaimerNote: body.disclaimerNote || null,
        totalCostBeforeSubsidy: body.totalCostBeforeSubsidy,
        subsidyAmount: body.subsidyAmount,
        roi: body.roi || null,
      });
      setStatus("success");
      /* From here on this session has an estimate in it. The lead gate stops
         asking (see openLeadGate) — the question has been put once and the
         answer does not change because a figure was adjusted. */
      setHasCalculated(true);
    } catch (networkErr) {
      // Network failure, server unreachable, CORS issue, etc.
      setErrorMessage(
        "Unable to reach the quotation service right now. Please check your connection and try again."
      );
      setStatus("error");
    }
  };

  /* "Calculate Estimate" → step 1: show the permission question.

     Asked ONCE, and two independent conditions now suppress it. Either alone is
     enough; both are here because each covers a case the other misses.

       1. `hasAnsweredLeadGate()` — the stored answer. This was the original
          guard and it handles the ordinary case: the visitor answered, the
          answer is remembered, nothing is re-asked.

       2. `hasCalculated` — this session has already produced an estimate.

     The second exists because the first has two holes that both surface exactly
     where the business found this bug, on the return from the EMI calculator's
     "Edit your quotation":

       · Dismissing the DETAILS modal deliberately does not mark the gate
         answered (see handleDetailsDismiss — the visitor said yes and then
         abandoned the form, which is an interrupted intent rather than a
         decision). So a visitor who took that path got their estimate, went to
         the calculator, came back to change one number, and was asked "may we
         contact you?" all over again.
       · The flag lives in sessionStorage, and every write in lib/quoteSession.js
         is wrapped because Safari in private mode throws on access. When that
         write fails the flag never sticks, and the gate re-arms on every single
         recalculation for the whole visit.

     Neither hole is reachable any more: if there is an estimate on the page, the
     question has already been put, whatever the storage layer managed to record.
     Editing is frictionless, which is the whole point of the button that sent
     them here.

     Once suppressed, the stored lead is reused rather than dropped. Saying yes
     earlier means the business wants the CORRECTED figures filed against that
     contact, not the stale first pass; saying no means it stays null. Either way
     the estimate is computed immediately with no modal in the way. */
  const openLeadGate = () => {
    if (!canSubmit) return;

    if (hasCalculated || hasAnsweredLeadGate()) {
      submitQuotation(capturedLead);
      return;
    }

    setLeadFlowStep("permission");
  };

  // User said "Yes, contact me" → advance to details form.
  const handlePermissionYes = () => setLeadFlowStep("details");

  // User said "No thanks" on permission → show estimate immediately, show brief reminder.
  const handlePermissionNo = () => {
    markLeadGateAnswered();
    setLeadFlowStep("reminder");
    submitQuotation(null); // No lead attached — estimate still computed.
  };

  // User closed permission modal via Escape/backdrop → same as "No thanks".
  const handlePermissionDismiss = () => {
    markLeadGateAnswered();
    setLeadFlowStep("reminder");
    submitQuotation(null);
  };

  // User filled in details and submitted.
  const handleLeadCaptured = (lead) => {
    markLeadGateAnswered();
    setCapturedLead(lead);
    // Kept for the rest of the session so a recalculation after editing carries
    // the same contact through instead of arriving anonymously.
    writeStoredLead(lead);
    setLeadFlowStep(null);
    // Pass `lead` directly — do NOT read capturedLead state here (async setState).
    submitQuotation(lead);
  };

  /* User dismissed details modal via Escape/backdrop → show estimate anyway.

     This one deliberately does NOT mark the gate answered: they said yes to
     being contacted and then abandoned the form, which is closer to an
     interrupted intent than to a decision. Leaving the gate open lets the
     reminder's "actually, I'll share my details" work, and lets a later
     calculation ask once more. */
  const handleDetailsDismiss = () => {
    setLeadFlowStep("reminder");
    submitQuotation(null);
  };

  // User acknowledged the reminder.
  const handleReminderDismiss = () => setLeadFlowStep(null);

  // User changed mind on reminder: "Actually, I'll share my details".
  const handleReminderShareAfterAll = () => {
    // Reset the result briefly and jump to details form.
    setLeadFlowStep("details");
  };

  /* Set by Start over. Declared above resetForm rather than beside the persist
     effect below purely so the setter is not referenced before the reader can
     see where it comes from. */
  const [draftCleared, setDraftCleared] = useState(false);

  const resetForm = () => {
    setProductType(null);
    setApplications([{ rowId: nextRowId(), applianceId: "", quantity: 1 }]);
    setBackupDaytime("");
    setBackupNighttime("");
    setPhase("");
    setPeakBill("");
    setBottomBill("");
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
    setLeadFlowStep(null);
    setCapturedLead(null);
    /* Start over is the way OUT of the system-type lock, and the note under the
       selector points at it — so it has to release the lock and forget that this
       session ever calculated anything. Otherwise the visitor reads "press Start
       over to change system type", presses it, and finds the other option still
       greyed out. */
    setLockedProductType(null);
    setHasCalculated(false);
    /* "Start over" has to clear the saved draft too, or the next mount would
       restore the very answers the visitor just discarded.

       The permission gate is deliberately left answered. Clearing it would mean
       pressing Start over re-arms the modal, and a visitor who already declined
       being contacted should not be asked again because they reset a form.
       Note that clearing `hasCalculated` above does NOT re-arm it either — that
       flag is a second, independent suppressor, not the record of the answer. */
    setDraftCleared(true);
  };

  /* Apply a stored draft to live state. Used only by the recovery prompt — the
     normal path seeds the same values through the useState initialisers above,
     because on that path the answer is known before the first render. Here it
     is not: the visitor decides after the page is already on screen. */
  const applyQuoteDraft = (draft) => {
    if (!draft) return;
    setProductType(draft.productType ?? null);
    setApplications(
      draft.applications?.length
        ? draft.applications.map((a) => ({ ...a, rowId: nextRowId() }))
        : [{ rowId: nextRowId(), applianceId: "", quantity: 1 }]
    );
    setBackupDaytime(draft.backupDaytime ?? "");
    setBackupNighttime(draft.backupNighttime ?? "");
    setPhase(draft.phase ?? "");
    setPeakBill(draft.peakBill ?? "");
    setBottomBill(draft.bottomBill ?? "");
    setResult(draft.result ?? null);
    setStatus(draft.result ? "success" : "idle");
    setErrorMessage(null);
    /* Resuming a parked session lands the visitor in exactly the state the
       normal restore path produces, so it has to reach the same two flags — the
       mount-time initialisers ran against an empty draft on this path, because
       the decision to resume had not been made yet. Without these, a resumed
       quotation would re-ask the permission question and let the system type be
       switched out from under a live estimate. */
    setHasCalculated(Boolean(draft.result));
    setLockedProductType(draft.result?.productType ?? null);
  };

  const handleResumeSession = () => {
    const draft = recoveryOffer;
    setRecoveryOffer(null);
    activateSession();
    /* Answered — so the calculator does not put the same question again when
       the visitor moves on to it. */
    resolveRecovery();
    /* Re-arm persistence before applying. A visitor who pressed Start over,
       wandered off and came back would otherwise resume into a form that had
       been told to stop saving. */
    setDraftCleared(false);
    applyQuoteDraft(draft);
  };

  const handleStartNewSession = () => {
    setRecoveryOffer(null);
    // Wipes both drafts and the trail, and re-activates. The form is already
    // empty — this is about the store, not the fields.
    clearSession();
    setDraftCleared(false);
    /* Nothing is being edited any more, so nothing is locked. The form is
       already blank; these two are the state that would otherwise still be
       describing the discarded quotation. */
    setHasCalculated(false);
    setLockedProductType(null);
  };

  /* Persist the form as it changes.

     Written from an effect rather than from each setter so there is one place
     that knows what a draft contains — fourteen call sites would be fourteen
     chances to forget a field. rowId is stripped deliberately: it is a render
     key regenerated on restore, not data.

     Two things switch it off:

       · Start over has run, so the cleared state sticks.
       · A recovery prompt is open. This one is load-bearing rather than tidy:
         while the modal is up the form is deliberately EMPTY, and an effect
         that ran would immediately write that emptiness over the draft the
         modal is at that moment offering to restore. The visitor would press
         "Resume my quotation" and get nothing back. */
  useEffect(() => {
    if (recoveryOffer) return;
    if (draftCleared) {
      clearQuoteDraft();
      return;
    }
    writeQuoteDraft({
      productType,
      applications: applications.map(({ applianceId, quantity }) => ({ applianceId, quantity })),
      backupDaytime,
      backupNighttime,
      phase,
      peakBill,
      bottomBill,
      /* Only a settled estimate is worth storing. Persisting an in-flight
         "submitting" would restore a spinner with no request behind it, and
         persisting an error would re-show a failure the visitor may have
         already resolved by editing an input. */
      result: status === "success" ? result : null,
    });
  }, [
    recoveryOffer,
    draftCleared,
    productType,
    applications,
    backupDaytime,
    backupNighttime,
    phase,
    peakBill,
    bottomBill,
    status,
    result,
  ]);

  /* Re-arm persistence the moment the visitor starts filling the form again
     after a reset — otherwise Start over would silently disable saving for the
     rest of the session. */
  useEffect(() => {
    if (draftCleared && productType !== null) setDraftCleared(false);
  }, [draftCleared, productType]);

  /* ── Unsaved-estimate guard ───────────────────────────────────────────────
     A visitor who has filled this form in and NOT pressed Calculate Estimate has
     work that exists nowhere except these fields — there is no estimate, nothing
     has reached the backend, and no lead has been captured. Clicking away from
     /quote at that moment loses all of it silently, which is the one place on
     this page where an accidental click costs the visitor everything they just
     typed.

     Armed on the same predicate the breadcrumb guard uses, so "has entered data"
     means one thing across the whole flow — see quoteDraftHasUserInput in
     lib/quoteSession.js. Fed live state rather than the stored draft because the
     persist effect above runs a commit later, and a guard that is one render
     stale is a guard that misses the first field.

     `result` is deliberately not passed: whether an estimate exists is
     `hasCalculated`'s job, and it survives a Start over → retype cycle that a
     stale draft would not. */
  const navigate = useNavigate();
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const hasUncalculatedInput =
    !hasCalculated &&
    !recoveryOffer &&
    quoteDraftHasUserInput({
      applications,
      backupDaytime,
      backupNighttime,
      phase,
      peakBill,
      bottomBill,
    });

  const handleNavigationAttempt = useCallback((to) => setPendingNavigation(to), []);
  const releaseNavigationGuard = useNavigationGuard(
    hasUncalculatedInput,
    handleNavigationAttempt
  );

  /* "Yes / Leave" — discard the uncalculated inputs and go.

     The draft is cleared directly rather than through `setDraftCleared(true)`,
     which would look like the tidier route and is a trap: the re-arm effect
     immediately above flips that flag back to false whenever a product type is
     selected, and the persist effect would then write every field straight back
     into storage on the way out. Nothing here touches a dependency of the
     persist effect, so it does not re-run and the clear stands.

     `navigate` is programmatic, so it does not go through the click listener the
     guard installed — there is no second prompt to suppress. The Back branch is
     the exception and is why the guard hands back `release`. */
  const handleConfirmLeave = () => {
    const to = pendingNavigation;
    setPendingNavigation(null);
    clearQuoteDraft();

    if (to === BACK_NAVIGATION) {
      /* Resume the Back press we intercepted. Two entries deep, not one: the
         guard is currently sitting on the duplicate it pushed, and the real
         /quote entry is behind it — so -1 would only land back on /quote and
         look to the visitor like their Back press did nothing.

         release() first, or the popstate this triggers re-opens the modal. */
      releaseNavigationGuard();
      window.history.go(-2);
      return;
    }

    if (to) navigate(to);
  };

  /* "No / Stay" — drop the destination and change nothing else. Every field is
     still exactly as the visitor left it; the guard was the only thing that
     acted. */
  const handleCancelLeave = () => setPendingNavigation(null);

  return (
    <div>
      {/* Quotation page — dark hero accent strip */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #050F1F 0%, #0A2540 55%, #0D2E56 100%)', paddingTop: '44px', paddingBottom: '56px' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 80% at 82% 50%, rgba(245,166,35,0.13) 0%, transparent 62%)' }} />
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 48, background: 'linear-gradient(to bottom, transparent, rgba(244,246,251,0.18))' }} />
        <div className="container-site relative z-10">
          {/* Journey breadcrumb — the mirror of the one on /roi-calculator.
              Rendered only once there is a journey to describe: a single crumb
              would just be the page's own name repeated above its heading.

              Exactly two crumbs when it shows at all: "EMI & ROI Calculator ›
              Get Quotation". It used to be able to run to three, which with only
              two pages in the flow could only ever produce a lap — see the trail
              cap note in lib/quoteSession.js for what that looked like and why
              it is now impossible. */}
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
                          className="quote-crumb quote-crumb-current inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5"
                        >
                          {crumb.label}
                        </span>
                      ) : (
                        <Link
                          to={crumb.to}
                          className="quote-crumb focus-ring inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5"
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

          <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: 'var(--color-primary)' }}>Get Quotation</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Build your estimate</h1>
          <p className="leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Select a system type and tell us about your usage. Your estimate appears once you submit.
          </p>
        </div>
      </div>

      <section className="container-site py-12 md:py-16">
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* -------- FORM COLUMN -------- */}
          <div className="lg:col-span-3 space-y-6">
            {/* Product type selector */}
            {/* `lockedProductType` is non-null only when this mount restored a
                submitted estimate — i.e. the visitor is editing rather than
                starting. In that state the OTHER live option is locked out; see
                the declaration for why an edit must not be allowed to become a
                different product.

                Off Grid keeps its own `disabled` regardless: it is unavailable
                for a different reason (no calculation module exists) and must
                not appear to unlock when the lock is released. */}
            <div className="panel-premium bg-white rounded-2xl border border-token p-6">
              <p className="text-sm font-semibold text-secondary-token mb-4">1. Choose your system type</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <TypeOption
                  icon={<Zap className="w-5 h-5" />}
                  label="On Grid"
                  active={productType === "ON_GRID"}
                  onClick={() => setProductType("ON_GRID")}
                  disabled={lockedProductType === "HYBRID"}
                  locked={lockedProductType === "HYBRID"}
                  badge={lockedProductType === "HYBRID" ? "Locked" : undefined}
                  title={
                    lockedProductType === "HYBRID"
                      ? "You are editing a Hybrid quotation. Start a new quotation to switch to On Grid."
                      : undefined
                  }
                />
                <TypeOption
                  icon={<BatteryCharging className="w-5 h-5" />}
                  label="Hybrid"
                  active={productType === "HYBRID"}
                  onClick={() => setProductType("HYBRID")}
                  disabled={lockedProductType === "ON_GRID"}
                  locked={lockedProductType === "ON_GRID"}
                  badge={lockedProductType === "ON_GRID" ? "Locked" : undefined}
                  title={
                    lockedProductType === "ON_GRID"
                      ? "You are editing an On Grid quotation. Start a new quotation to switch to Hybrid."
                      : undefined
                  }
                />
                <TypeOption
                  icon={<Plug className="w-5 h-5" />}
                  label="Off Grid"
                  disabled
                  badge="Coming Soon"
                />
              </div>

              {/* A control that is greyed out with no stated reason reads as a
                  bug. This says which quotation is being edited, why the other
                  option is unavailable, and exactly which button releases it —
                  the same button named in resetForm's comment. */}
              {lockedProductType && (
                <p className="text-xs text-muted-token leading-relaxed mt-4 flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary-token" />
                  <span>
                    You're editing your{" "}
                    <span className="font-semibold text-secondary-token">
                      {lockedProductType.replace("_", " ")}
                    </span>{" "}
                    quotation, so the other system type is locked — adjust your figures and
                    recalculate. To price a different system, use{" "}
                    <span className="font-semibold text-secondary-token">Start a new quotation</span>{" "}
                    on your estimate.
                  </span>
                </p>
              )}
            </div>

            {/* HYBRID PATH */}
            {productType === "HYBRID" && (
              <div className="panel-premium bg-white rounded-2xl border border-token p-6 fade-in">
                <p className="text-sm font-semibold text-secondary-token mb-4">2. Add your applications</p>
                <div className="space-y-3">
                  {applications.map((row) => (
                    <ApplianceRow
                      key={row.rowId}
                      row={row}
                      canRemove={applications.length > 1}
                      onUpdate={updateApplianceRow}
                      onRemove={removeApplianceRow}
                    />
                  ))}
                </div>
                <button
                  onClick={addApplianceRow}
                  className="focus-ring mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary-token btn-outline-token rounded-md px-4 py-2.5"
                >
                  <Plus className="w-4 h-4" /> Add Appliance
                </button>
                <p className="text-xs text-muted-token mt-3">
                  Total applications added: <span className="font-semibold text-secondary-token">{totalApplications}</span>
                </p>

                <p className="text-sm font-semibold text-secondary-token mt-6 mb-4">3. Backup preference</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FieldLabel label="Backup during Daytime (hours)">
                    <input
                      type="number"
                      min={0}
                      value={backupDaytime}
                      onChange={(e) => setBackupDaytime(e.target.value)}
                      placeholder="e.g. 4"
                      className="input-premium focus-ring w-full border border-token rounded-md px-3 py-2.5 text-sm text-secondary-token"
                    />
                  </FieldLabel>
                  <FieldLabel label="Backup during Night time (hours)">
                    <input
                      type="number"
                      min={0}
                      value={backupNighttime}
                      onChange={(e) => setBackupNighttime(e.target.value)}
                      placeholder="e.g. 6"
                      className="input-premium focus-ring w-full border border-token rounded-md px-3 py-2.5 text-sm text-secondary-token"
                    />
                  </FieldLabel>
                </div>
              </div>
            )}

            {/* ON GRID PATH */}
            {productType === "ON_GRID" && (
              <div className="panel-premium bg-white rounded-2xl border border-token p-6 fade-in">
                <p className="text-sm font-semibold text-secondary-token mb-4">2. Phase selection</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <PhaseOption label="1 Phase" active={phase === "1"} onClick={() => setPhase("1")} />
                  <PhaseOption label="3 Phase" active={phase === "3"} onClick={() => setPhase("3")} />
                </div>

                <p className="text-sm font-semibold text-secondary-token mb-4">3. Total light bill</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FieldLabel label="Peak amount (₹)">
                    <input
                      type="number"
                      min={0}
                      value={peakBill}
                      onChange={(e) => setPeakBill(e.target.value)}
                      placeholder="e.g. 10000"
                      className="input-premium focus-ring w-full border border-token rounded-md px-3 py-2.5 text-sm text-secondary-token"
                    />
                  </FieldLabel>
                  <FieldLabel label="Bottom amount (₹)">
                    <input
                      type="number"
                      min={0}
                      value={bottomBill}
                      onChange={(e) => setBottomBill(e.target.value)}
                      placeholder="e.g. 2000"
                      className="input-premium focus-ring w-full border border-token rounded-md px-3 py-2.5 text-sm text-secondary-token"
                    />
                  </FieldLabel>
                </div>
              </div>
            )}

            {/* Government Notes panel (On-Grid only) */}
            {productType === "ON_GRID" && (
              <div className="rounded-2xl border border-token p-5 flex gap-3" style={{ background: "rgba(10,37,64,0.04)" }}>
                <Info className="w-5 h-5 text-secondary-token flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-secondary-token mb-1">Government Notes</p>
                  <p className="text-xs text-muted-token leading-relaxed">
                    PM Surya Ghar: Muft Bijli Yojana — Central government subsidy for residential rooftop solar: ₹30,000 for 1 kW, ₹60,000 for 2 kW, and ₹78,000 for 3 kW and above (maximum cap). These are estimated values. Actual subsidies depend on discom verification and portal policies.
                  </p>
                </div>
              </div>
            )}

            {productType && (
              <button
                onClick={openLeadGate}
                disabled={!canSubmit || status === "submitting"}
                className="btn-shimmer btn-primary-token focus-ring w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md px-8 py-3.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Calculating…
                  </>
                ) : (
                  <>
                    Calculate Estimate <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* -------- SUMMARY / RESULT COLUMN -------- */}
          <div className="lg:col-span-2 lg:sticky lg:top-24 space-y-5">
            <div className="panel-premium bg-white rounded-2xl border border-token p-6">
              <p className="text-sm font-semibold text-secondary-token mb-4">Your summary</p>
              <ul className="space-y-3 text-sm">
                <SummaryRow label="System type" value={productType ? productType.replace("_", " ") : "—"} />
                {productType === "HYBRID" && (
                  <>
                    <SummaryRow label="Applications added" value={String(totalApplications)} />
                    <SummaryRow
                      label="Backup"
                      value={
                        backupDaytime || backupNighttime
                          ? `${backupDaytime || 0}h day / ${backupNighttime || 0}h night`
                          : "—"
                      }
                    />
                  </>
                )}
                {productType === "ON_GRID" && (
                  <>
                    <SummaryRow label="Phase" value={phase ? `${phase} Phase` : "—"} />
                    <SummaryRow
                      label="Light bill"
                      value={peakBill || bottomBill ? `₹${peakBill || 0} / ₹${bottomBill || 0}` : "—"}
                    />
                  </>
                )}
              </ul>
            </div>

            {status === "success" && result && (
              <div className="estimate-card rounded-2xl p-6 fade-in">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.2)' }}>
                      <CheckCircle2 className="w-5 h-5 text-primary-token" />
                    </div>
                    <p className="text-sm font-semibold text-white/90">Estimate Cost</p>
                  </div>
                  <Logo className="h-14 md:h-16" onDark />
                </div>
                {result.totalCostBeforeSubsidy !== undefined && result.subsidyAmount !== undefined ? (
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-sm text-white/80 mb-2">
                      <span>Base Cost</span>
                      <span>{formatINR(result.totalCostBeforeSubsidy)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-green-400 mb-3 border-b border-white/10 pb-3">
                      <span>Estimated Subsidy</span>
                      <span>- {formatINR(result.subsidyAmount)}</span>
                    </div>
                    <p className="text-4xl font-bold font-display mb-1" style={{ color: 'var(--color-primary)', textShadow: '0 0 30px rgba(245,166,35,0.4)' }}>
                      {formatINR(result.estimateCost)}
                    </p>
                    <p className="text-xs text-white/50">{result.productType.replace("_", " ")} System · Final Estimate Cost</p>
                  </div>
                ) : (
                  <>
                    <p className="text-4xl font-bold font-display mb-1" style={{ color: 'var(--color-primary)', textShadow: '0 0 30px rgba(245,166,35,0.4)' }}>
                      {formatINR(result.estimateCost)}
                    </p>
                    <p className="text-xs text-white/50 mb-4">{result.productType.replace("_", " ")} System · Preliminary estimate</p>
                  </>
                )}
                {result.disclaimerNote && (
                  <p className="text-xs text-white/55 leading-relaxed border-t border-white/10 pt-3">{result.disclaimerNote}</p>
                )}
                <button
                  onClick={resetForm}
                  className="focus-ring mt-4 text-xs font-semibold text-white/70 hover:text-white underline transition-colors"
                >
                  Start a new quotation
                </button>
              </div>
            )}

            {/* Phase 4 — brief savings summary only. The full ROI / EMI breakdown
                now lives on the dedicated /roi-calculator page, which we hand off
                to with the quoted bill and system cost pre-filled. */}
            {status === "success" && result && result.roi && (
              <div className="fade-in-delay rounded-2xl p-6" style={{
                background: 'linear-gradient(135deg, rgba(10,37,64,0.92) 0%, rgba(18,54,92,0.96) 100%)',
                border: '1px solid rgba(245,166,35,0.15)',
                boxShadow: '0 16px 48px rgba(10,37,64,0.35), 0 0 32px rgba(245,166,35,0.08)',
              }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(52,199,89,0.18)' }}>
                    <Sun className="w-4 h-4" style={{ color: '#34C759' }} />
                  </div>
                  <p className="text-sm font-semibold text-white/90">Annual Savings Estimate</p>
                </div>

                <p className="text-3xl font-bold font-display mb-1" style={{
                  background: 'linear-gradient(135deg, #F5A623 0%, #FFD700 50%, #F5A623 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 8px rgba(245,166,35,0.3))',
                }}>
                  {formatINR(result.roi.annualSavingsRs)}
                </p>
                <p className="text-xs text-white/50 mb-5">
                  saved every year, against a current bill of {formatINR(result.roi.currentYearlyBillRs)}
                </p>

                <Link
                  /* Everything the calculator can seed itself from. `savings`
                     is carried so that page can reconcile its flat-95% model
                     against the capacity-derived figure shown here, rather than
                     quietly contradicting it. The backend does not expose
                     system capacity, so there is no size to pass. */
                  to={`/roi-calculator?bill=${Math.round(result.roi.currentYearlyBillRs / 12)}&cost=${Math.round(result.estimateCost)}&savings=${Math.round(result.roi.annualSavingsRs)}`}
                  className="focus-ring w-full inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-xs font-semibold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, #FFD700 100%)',
                    color: 'var(--color-secondary)',
                    boxShadow: '0 4px 16px rgba(245,166,35,0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, var(--color-secondary) 0%, #12365C 100%)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, var(--color-primary) 0%, #FFD700 100%)';
                    e.currentTarget.style.color = 'var(--color-secondary)';
                  }}
                >
                  <Calculator className="w-3.5 h-3.5" /> View Full EMI &amp; ROI Breakdown
                </Link>

                <p className="text-[10px] text-white/35 leading-relaxed mt-3">
                  Your bill and quoted cost carry across automatically — no re-typing.
                </p>
              </div>
            )}

            {status === "error" && errorMessage && (
              <div
                className="rounded-2xl border p-6 fade-in flex gap-3"
                style={{ borderColor: "#E5484D", background: "rgba(229,72,77,0.06)" }}
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#E5484D" }} />
                <div>
                  <p className="text-sm font-semibold text-secondary-token mb-1">We couldn't calculate that</p>
                  <p className="text-xs text-muted-token leading-relaxed">{errorMessage}</p>
                  <button
                    onClick={() => {
                      setStatus("idle");
                      setErrorMessage(null);
                    }}
                    className="focus-ring mt-3 text-xs font-semibold text-secondary-token underline"
                  >
                    Adjust inputs and try again
                  </button>
                </div>
              </div>
            )}

            {status === "idle" && !productType && (
              <div className="rounded-2xl border border-dashed border-token p-6 text-center">
                <p className="text-xs text-muted-token">
                  Choose a system type to begin. Your estimate will appear here once submitted.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Phase 2 (round 3) — <ProcessTimeline /> ("How We Work") has moved
            back to the homepage, directly under the About Us teaser. Phase 3
            had brought it here on the argument that a process description
            belongs where the enquiry is made; the homepage placement wins on a
            different one — the visitor asks "who are you and how do you work?"
            while deciding whether to enquire at all, not after. Answering it on
            the front page is what earns the enquiry, and a visitor who has
            already reached this form has stopped asking.

            The anchor id moved with it: the header now points at /#how-we-work.
            See the render site in Homepage.jsx. */}

        {/* Government scheme CTA — visible regardless of system type, since
            subsidy eligibility is usually the first thing customers ask about. */}
        <div className="mt-14 md:mt-16">
          <SchemeCTA />
        </div>

        {/* Task B — 3-step permission lead flow */}
        <PermissionModal
          open={leadFlowStep === "permission"}
          onYes={handlePermissionYes}
          onNo={handlePermissionNo}
          onDismiss={handlePermissionDismiss}
        />
        <LeadCaptureModal
          open={leadFlowStep === "details"}
          onClose={handleDetailsDismiss}
          onSubmit={handleLeadCaptured}
        />
        <ReminderModal
          open={leadFlowStep === "reminder"}
          onDismiss={handleReminderDismiss}
          onShareAfterAll={handleReminderShareAfterAll}
        />

        {/* Abandoned-flow recovery. Only ever open when the visitor left the
            journey and came back to something worth restoring — see the
            bootstrap read at the top of this component. */}
        <SessionRecoveryModal
          open={Boolean(recoveryOffer)}
          summary={recoveryOffer ? quoteDraftSummary(recoveryOffer) : null}
          onResume={handleResumeSession}
          onStartNew={handleStartNewSession}
        />

        {/* Leaving /quote with figures typed in and no estimate calculated —
            see the guard block above this component's return. */}
        <UnsavedQuoteModal
          open={pendingNavigation !== null}
          onLeave={handleConfirmLeave}
          onStay={handleCancelLeave}
        />
      </section>
    </div>
  );
}

/* ===========================================================
   TASK B — PERMISSION MODAL (Step 1 of 3)
   UX Rule: the customer must NEVER be blocked from seeing
   their estimate. Escape / backdrop / "No thanks" all lead
   to submitQuotation(null) + ReminderModal.
=========================================================== */
function PermissionModal({ open, onYes, onNo, onDismiss }) {
  const yesRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    yesRef.current?.focus();
    const handleKeyDown = (e) => { if (e.key === "Escape") onDismiss(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(8,18,38,0.72)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="permission-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="gps-root modal-glass w-full max-w-sm p-7 fade-in"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.20), rgba(245,166,35,0.07))" }}>
            <Sun className="w-5 h-5 text-primary-token" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-eyebrow-token">One quick question</p>
            <h2 id="permission-modal-title" className="text-lg font-semibold text-secondary-token font-display leading-snug">
              May we follow up with you?
            </h2>
          </div>
        </div>
        <p className="text-sm text-muted-token leading-relaxed mb-6">
          Our team would love to discuss your solar requirements and provide a detailed site proposal.
          Would you like to share your contact details?
        </p>
        <div className="flex flex-col gap-3">
          <button
            ref={yesRef}
            onClick={onYes}
            className="btn-shimmer btn-primary-token focus-ring w-full inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold"
          >
            Yes, I'd like to be contacted <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onNo}
            className="focus-ring w-full inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-medium text-muted-token hover:text-secondary-token border border-token hover:border-secondary-token transition-colors"
          >
            No thanks — just show my estimate
          </button>
        </div>
        <p className="text-[10px] text-muted-token text-center mt-4 leading-relaxed">
          Your data is never sold or shared. See our{" "}
          <Link to="/privacy-policy" className="underline focus-ring rounded-sm">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

/* ===========================================================
   LEAD CAPTURE MODAL (Step 2 — shown only when user said Yes)
   Self-contained: owns its own field state and validation.
   Escape / backdrop = treat as "skip" (submitQuotation(null)).
=========================================================== */
function LeadCaptureModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const firstFieldRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const canSubmitLead = name.trim() && whatsapp.trim() && city.trim();

  const handleSubmit = () => {
    if (!canSubmitLead) return;
    onSubmit({ name: name.trim(), whatsapp: whatsapp.trim(), city: city.trim() });
    setName(""); setWhatsapp(""); setCity("");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(8,18,38,0.72)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="gps-root modal-glass w-full max-w-md p-7 fade-in"
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-eyebrow-token mb-2">
              <Sun className="w-3.5 h-3.5" /> Contact Details
            </div>
            <h2 id="lead-modal-title" className="text-xl font-semibold text-secondary-token font-display">
              Where should we send your estimate?
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="focus-ring flex-shrink-0 text-muted-token hover:text-secondary-token rounded-md p-1.5 -mr-1 -mt-1 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-muted-token mb-6 leading-relaxed">
          Just these three details — we'll use them to follow up with a detailed site proposal.
        </p>
        <div className="space-y-4 mb-6">
          <FieldLabel label="Name">
            <div className="relative">
              <User className="w-4 h-4 text-muted-token absolute left-3 top-1/2 -translate-y-1/2" />
              <input ref={firstFieldRef} value={name} onChange={(e) => setName(e.target.value)}
                className="input-premium focus-ring w-full border border-token rounded-md pl-9 pr-3 py-2.5 text-sm text-secondary-token"
                placeholder="Your full name" aria-label="Name" />
            </div>
          </FieldLabel>
          <FieldLabel label="WhatsApp Number">
            <div className="relative">
              <Phone className="w-4 h-4 text-muted-token absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                className="input-premium focus-ring w-full border border-token rounded-md pl-9 pr-3 py-2.5 text-sm text-secondary-token"
                placeholder="e.g. 98765 43210" aria-label="WhatsApp Number" />
            </div>
          </FieldLabel>
          <FieldLabel label="City / Location">
            <div className="relative">
              <MapPin className="w-4 h-4 text-muted-token absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={city} onChange={(e) => setCity(e.target.value)}
                className="input-premium focus-ring w-full border border-token rounded-md pl-9 pr-3 py-2.5 text-sm text-secondary-token"
                placeholder="e.g. Bhuj, Gujarat" aria-label="City or Location" />
            </div>
          </FieldLabel>
        </div>
        <button onClick={handleSubmit} disabled={!canSubmitLead}
          className="btn-shimmer btn-primary-token focus-ring w-full inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
          View My Estimate <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ===========================================================
   REMINDER MODAL (Step 3 — shown when user skipped lead)
   Estimate is already computing / shown behind this.
   Gives user a second chance to share details if they want.
=========================================================== */
function ReminderModal({ open, onDismiss, onShareAfterAll }) {
  const okRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    okRef.current?.focus();
    const handleKeyDown = (e) => { if (e.key === "Escape") onDismiss(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 pointer-events-none"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-modal-title"
        className="gps-root modal-glass w-full max-w-sm p-6 fade-in pointer-events-auto mb-6 sm:mb-0"
        style={{ borderLeft: "4px solid var(--color-primary)" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-success)" }} />
          <h2 id="reminder-modal-title" className="text-sm font-semibold text-secondary-token">Your estimate is ready!</h2>
        </div>
        <p className="text-xs text-muted-token leading-relaxed mb-4">
          No worries — your estimate is shown on the right. If you'd like a personalised site proposal from our team, you can still share your details.
        </p>
        <div className="flex gap-3">
          <button ref={okRef} onClick={onDismiss}
            className="focus-ring flex-1 rounded-md border border-token px-4 py-2.5 text-xs font-semibold text-muted-token hover:text-secondary-token hover:border-secondary-token transition-colors">
            OK, got it
          </button>
          <button onClick={onShareAfterAll}
            className="focus-ring flex-1 btn-primary-token rounded-md px-4 py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5">
            Share my details <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ApplianceRow — extracted from QuotationPage (QA Phase 9, Issue F5) for
 * readability and to enable a real render-count optimization: because
 * updateApplianceRow/removeApplianceRow/addApplianceRow use an immutable
 * map/filter pattern, unedited rows keep the same object reference across
 * renders. Wrapping this in React.memo means typing in one row no longer
 * re-renders every other row in the list.
 */
const ApplianceRow = React.memo(function ApplianceRow({ row, canRemove, onUpdate, onRemove }) {
  return (
    <div className="flex items-center gap-3">
      <select
        value={row.applianceId}
        onChange={(e) => onUpdate(row.rowId, "applianceId", e.target.value)}
        className="input-premium focus-ring flex-1 border border-token rounded-md px-3 py-2.5 text-sm text-secondary-token bg-white"
        aria-label="Select appliance type"
      >
        <option value="">Select appliance…</option>
        {APPLIANCES.map((app) => (
          <option key={app.id} value={app.id}>
            {app.label}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={1}
        value={row.quantity}
        onChange={(e) => onUpdate(row.rowId, "quantity", e.target.value)}
        className="input-premium focus-ring w-20 border border-token rounded-md px-3 py-2.5 text-sm text-secondary-token"
        aria-label="Appliance quantity"
      />
      <button
        onClick={() => onRemove(row.rowId)}
        disabled={!canRemove}
        aria-label="Remove appliance"
        className="focus-ring w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-md text-muted-token hover:text-red-600 disabled:opacity-30 disabled:hover:text-muted-token"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
});

/**
 * A system-type tile.
 *
 * `disabled` covers two different situations and they are drawn differently on
 * purpose, because they mean opposite things to the visitor:
 *
 *   · Off Grid is disabled because it does not exist yet — a dashed border is
 *     the right vocabulary for "not built", the same one a placeholder gets.
 *   · `locked` is disabled because the visitor is mid-edit on the other
 *     product. That option is perfectly real and will be available again the
 *     moment they start a new quotation, so a dashed "unfinished" border would
 *     misdescribe it. It gets a solid, muted tile and a lock badge instead.
 *
 * `title` carries the reason as a native tooltip. The full explanation is
 * printed under the row rather than left to a hover — see the render site —
 * because a tooltip is unreachable on touch, which is most of this traffic.
 */
function TypeOption({ icon, label, active, onClick, disabled, badge, locked, title }) {
  const stateClass = locked
    ? "border-token bg-gray-50/70 cursor-not-allowed opacity-70"
    : disabled
      ? "border-dashed border-token bg-gray-50 cursor-not-allowed"
      : active
        ? "type-option-active border-transparent text-white"
        : "type-option-idle border-token";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={title}
      className={`focus-ring rounded-xl border p-4 text-left transition-all ${stateClass}`}
    >
      <div className={`mb-3 ${disabled ? "text-muted-token" : active ? "text-primary-token" : "text-secondary-token"}`}>
        {icon}
      </div>
      <p className={`text-sm font-semibold ${disabled ? "text-muted-token" : active ? "text-white" : "text-secondary-token"}`}>
        {label}
      </p>
      {badge && (
        <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-token bg-gray-100 rounded-full px-2 py-0.5">
          {locked && <Lock className="w-2.5 h-2.5" />}
          {badge}
        </span>
      )}
    </button>
  );
}

function PhaseOption({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`focus-ring rounded-md border px-4 py-3 text-sm font-semibold transition-colors ${active ? "bg-secondary-token text-white border-transparent" : "border-token text-secondary-token hover:border-secondary-token"
        }`}
    >
      {label}
    </button>
  );
}

function FieldLabel({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-token mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }) {
  return (
    <li className="flex items-center justify-between border-b border-token pb-2.5 last:border-0 last:pb-0">
      <span className="text-muted-token">{label}</span>
      <span className="font-semibold text-secondary-token text-right">{value}</span>
    </li>
  );
}

/* ===========================================================
   PROJECTS PAGE — Task E: data-driven from projectsData.ts
=========================================================== */
const SYSTEM_TYPE_COLOR = {
  ON_GRID: "rgba(34,197,94,0.15)",
  HYBRID: "rgba(245,166,35,0.15)",
  OFF_GRID: "rgba(99,102,241,0.15)",
};
const SYSTEM_TYPE_TEXT = {
  ON_GRID: "On Grid",
  HYBRID: "Hybrid",
  OFF_GRID: "Off Grid",
};

function ProjectsPage() {
  return (
    <section className="container-site py-12 md:py-16">
      <div className="max-w-2xl mb-10">
        <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">Projects</p>
        <h1 className="text-3xl md:text-4xl font-bold text-secondary-token mb-3">Completed installations</h1>
        <p className="text-muted-token leading-relaxed">
          A showcase of our On-Grid and Hybrid deployments across Gujarat.
          {" "}<span className="text-xs italic">(Placeholder entries — real project data to be supplied by the business.)</span>
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PROJECTS.map((proj) => (
          <div key={proj.id} className="rounded-2xl border border-token overflow-hidden bg-white card-hover">
            <div className="h-44 flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #EEF0F8 0%, #E4E7F2 50%, #EBEdf6 100%)' }}>
              <Building2 className="w-8 h-8 text-muted-token" />
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: SYSTEM_TYPE_COLOR[proj.systemType], color: "var(--color-secondary)" }}>
                {SYSTEM_TYPE_TEXT[proj.systemType]} · {proj.projectSizeKw} kW
              </span>
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold text-secondary-token mb-1">{proj.customerName}</p>
              <p className="text-xs text-muted-token">{proj.location}{proj.completedYear ? ` · ${proj.completedYear}` : ""}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ===========================================================
   BROCHURE PAGE
=========================================================== */
function BrochurePage() {
  const docs = [
    { title: "On-Grid System Specification Sheet" },
    { title: "Hybrid System Specification Sheet" },
    { title: "Company Profile" },
  ];
  return (
    <section className="container-site py-12 md:py-16">
      <div className="max-w-2xl mb-10">
        <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">Brochure</p>
        <h1 className="text-3xl md:text-4xl font-bold text-secondary-token mb-3">Technical documents</h1>
        <p className="text-muted-token leading-relaxed">
          Downloadable specification sheets will be available here once supplied by the business.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {docs.map((doc) => (
          <div key={doc.title} className="rounded-2xl border border-token bg-white p-6 flex flex-col">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.20) 0%, rgba(245,166,35,0.07) 100%)" }}>
              <FileText className="w-5 h-5 text-secondary-token" />
            </div>
            <p className="text-sm font-semibold text-secondary-token mb-4 flex-1">{doc.title}</p>
            <button
              disabled
              aria-disabled="true"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs font-semibold bg-gray-100 text-muted-token cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" /> Coming Soon
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ===========================================================
   CONTACT PAGE
=========================================================== */
/* Alphabetic characters and spaces only — no digits, no punctuation. */
const NAME_PATTERN = /^[A-Za-z ]+$/;
/* Exactly ten digits. Deliberately not tolerant of spaces or a +91 prefix:
   the brief asks for a strict ten-digit local number. */
const PHONE_PATTERN = /^[0-9]{10}$/;

const EMPTY_CONTACT_FORM = { name: "", email: "", phone: "", enquiryType: "", message: "" };

function ContactPage() {
  const [form, setForm] = useState(EMPTY_CONTACT_FORM);
  /* Warnings stay hidden until a field is left (or Send is pressed), so a
     half-typed phone number is not flagged mid-keystroke. */
  const [touched, setTouched] = useState({ name: false, phone: false });
  const [attempted, setAttempted] = useState(false);
  const [sent, setSent] = useState(false);

  const isMessageRequired = form.enquiryType === "Other";

  const nameError =
    form.name.trim() === ""
      ? "Please enter your name."
      : !NAME_PATTERN.test(form.name.trim())
        ? "Name can contain letters and spaces only — no numbers or symbols."
        : "";

  const phoneError =
    form.phone.trim() === ""
      ? "Please enter your phone number."
      : !PHONE_PATTERN.test(form.phone.trim())
        ? "Enter exactly 10 digits — numbers only, no spaces or symbols."
        : "";

  const showNameError = (touched.name || attempted) && Boolean(nameError);
  const showPhoneError = (touched.phone || attempted) && Boolean(phoneError);

  /* The two remaining requirements have no field of their own to hang a
     warning on, so they surface as one line above the button. */
  const otherError =
    form.enquiryType === ""
      ? "Please choose what your enquiry is for."
      : isMessageRequired && !form.message.trim()
        ? "Please describe your enquiry in the message box."
        : "";

  const canSend = !nameError && !phoneError && !otherError;

  const handleSubmit = () => {
    /* Reveal any outstanding warnings even on a blocked submit — otherwise a
       user who never blurred a field sees nothing happen and no reason why. */
    setAttempted(true);
    setTouched({ name: true, phone: true });
    if (!canSend) return;
    // UI-only simulation — no backend endpoint exists yet.
    setSent(true);
  };

  return (
    <section className="container-site py-12 md:py-16">
      <style>{`
        .contact-input-premium {
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .contact-input-premium:focus {
          border-color: var(--color-primary);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.03), 0 0 0 3px var(--glow-gold-strong);
          outline: none;
        }

        /* Validation state. The red border survives focus (the focus rule below
           it in specificity order would otherwise repaint it gold the moment
           the visitor clicks back in to fix the value). */
        .contact-input-invalid,
        .contact-input-invalid:focus {
          border-color: #C0392B;
        }
        .contact-input-invalid:focus {
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.03), 0 0 0 3px rgba(192,57,43,0.18);
        }
        .contact-field-error {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-top: 0.375rem;
          font-size: 0.75rem;
          line-height: 1.4;
          font-weight: 500;
          color: #C0392B;
        }

        /* "Get in touch" card — premium dark navy hero surface. The light
           frosted variant this replaces read as a second white panel next to
           the form; the navy slab is what anchors the two-column split and
           matches the hero treatment used elsewhere on the site. */
        .contact-glass {
          background: linear-gradient(135deg, #0A2540 0%, #12365C 52%, #0A2540 100%);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow:
            0 18px 48px rgba(10,37,64,0.30),
            0 2px 8px rgba(10,37,64,0.18),
            inset 0 1px 0 rgba(255,255,255,0.10);
        }
        .contact-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 55% at 92% 4%, rgba(245,166,35,0.18) 0%, transparent 62%),
            radial-gradient(ellipse 55% 50% at 2% 98%, rgba(255,255,255,0.06) 0%, transparent 60%);
          pointer-events: none;
        }
        /* The shared *-token text colours are tuned for light surfaces (navy on
           white). Inside the dark card they invert, or the copy vanishes into
           the slab. Scoped here rather than swapping class names at every call
           site, so GlassDetail stays surface-agnostic.
           Measured on #0A2540: white 15.5:1, the muted grey 8.1:1, gold 7.7:1 —
           all clear of AA. */
        .contact-glass .text-secondary-token { color: #FFFFFF; }
        .contact-glass .text-muted-token { color: rgba(226,232,240,0.78); }
        .contact-glass .text-eyebrow-token { color: #F5A623; }
        .contact-glass-icon {
          background: linear-gradient(135deg, rgba(245,166,35,0.26) 0%, rgba(245,166,35,0.08) 100%);
          border: 1px solid rgba(245,166,35,0.38);
        }
        .contact-glass-link { transition: color .2s ease; }
        /* Raw gold is safe here — 7.66:1 on the navy card, where on the old
           light surface it measured 2.03:1 and needed --color-primary-text. */
        .contact-glass-link:hover .text-secondary-token { color: #F5A623; }
        .contact-glass-cta {
          background: linear-gradient(135deg, #F5A623 0%, #FFD166 100%);
          color: #0A2540;
          border: 1px solid transparent;
          box-shadow: 0 6px 20px rgba(245,166,35,0.32);
          transition: all .3s ease;
        }
        /* Hover brightens the gold instead of flipping to navy — a navy button
           on a navy card is invisible. */
        .contact-glass-cta:hover {
          background: linear-gradient(135deg, #FFD166 0%, #FFE3A3 100%);
          color: #0A2540;
          box-shadow: 0 10px 26px rgba(245,166,35,0.42);
          transform: translateY(-2px);
        }
        .contact-glass-cta:active { transform: scale(0.98); }
        @media (prefers-reduced-motion: reduce) {
          .contact-glass-cta, .contact-glass-link { transition: none !important; transform: none !important; }
        }
      `}</style>
      <div className="max-w-2xl mb-10">
        <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">Contact</p>
        <h1 className="text-3xl md:text-4xl font-bold text-secondary-token mb-3">Contact us</h1>
        <p className="text-muted-token leading-relaxed">
          Have a question before requesting a quotation? Reach out directly.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-5">
          {/* -------- "Get in touch" glass card -------- */}
          <div className="contact-glass rounded-2xl p-6 md:p-7 relative overflow-hidden">
            <div className="relative">
              <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-1.5">
                Reach us directly
              </p>
              <h2 className="text-2xl font-bold text-secondary-token mb-1">Get in touch</h2>
              <p className="text-sm text-muted-token mb-7 leading-relaxed">
                Speak to Sagar Bhimani about sizing, subsidy or site visits.
              </p>

              <div className="space-y-5">
                <GlassDetail
                  icon={<Phone className="w-4 h-4" style={{ color: '#F5A623' }} />}
                  label="Phone"
                  href={PHONE_HREF}
                >
                  {PHONE_DISPLAY}
                </GlassDetail>

                <GlassDetail
                  icon={<Mail className="w-4 h-4" style={{ color: '#F5A623' }} />}
                  label="Email"
                  href={EMAIL_HREF}
                >
                  {EMAIL}
                </GlassDetail>

                <GlassDetail
                  icon={<MapPin className="w-4 h-4" style={{ color: '#F5A623' }} />}
                  label="Address"
                >
                  <span className="block">{COMPANY_NAME}</span>
                  {ADDRESS_LINES.map((line) => (
                    <span key={line} className="block font-normal text-muted-token">{line}</span>
                  ))}
                </GlassDetail>

                <GlassDetail
                  icon={<Clock className="w-4 h-4" style={{ color: '#F5A623' }} />}
                  label="Working Hours"
                >
                  <span className="block">{WORKING_HOURS}</span>
                  <span className="block font-normal text-muted-token">{WORKING_DAYS}</span>
                </GlassDetail>
              </div>

              <a
                href={PHONE_HREF}
                className="contact-glass-cta focus-ring mt-7 w-full inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold"
              >
                <Phone className="w-4 h-4" /> Call now
              </a>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="rounded-2xl border border-token overflow-hidden h-72 relative">
              <iframe
                src="https://www.google.com/maps?q=23.247090969260054,69.70118065865935&z=16&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Gurukrupa Powertech Solutions location map"
                className="absolute inset-0"
              />
            </div>
            <a href="https://www.google.com/maps?q=23.247090969260054,69.70118065865935"
              target="_blank" rel="noopener noreferrer"
              className="text-xs text-muted-token hover:text-secondary-token underline focus-ring rounded-sm self-start">
              Open in Google Maps
            </a>
          </div>
        </div>

        <div className="lg:col-span-3 rounded-2xl border border-token p-6 md:p-8 relative overflow-hidden" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', boxShadow: 'var(--shadow-card)' }}>
          {sent ? (
            <div className="text-center py-10 fade-in">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--color-success)" }} />
              <p className="text-base font-semibold text-secondary-token mb-2">Thank you for reaching out</p>
              <p className="text-sm text-muted-token max-w-sm mx-auto leading-relaxed">
                We have received your query, our team will contact you as soon as possible.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setForm(EMPTY_CONTACT_FORM);
                  setTouched({ name: false, phone: false });
                }}
                className="focus-ring mt-5 text-xs font-semibold text-secondary-token underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <FieldLabel label="Name">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    aria-invalid={showNameError || undefined}
                    aria-describedby={showNameError ? "contact-name-error" : undefined}
                    className={`input-premium focus-ring w-full border rounded-md px-3 py-2.5 text-sm text-secondary-token contact-input-premium ${showNameError ? "contact-input-invalid" : "border-token"}`}
                    placeholder="Your name"
                  />
                  {showNameError && (
                    <p id="contact-name-error" role="alert" className="contact-field-error">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {nameError}
                    </p>
                  )}
                </FieldLabel>
                <FieldLabel label="Phone">
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    aria-invalid={showPhoneError || undefined}
                    aria-describedby={showPhoneError ? "contact-phone-error" : undefined}
                    className={`input-premium focus-ring w-full border rounded-md px-3 py-2.5 text-sm text-secondary-token contact-input-premium ${showPhoneError ? "contact-input-invalid" : "border-token"}`}
                    placeholder="10-digit mobile number"
                  />
                  {showPhoneError && (
                    <p id="contact-phone-error" role="alert" className="contact-field-error">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {phoneError}
                    </p>
                  )}
                </FieldLabel>
              </div>
              <FieldLabel label="Email (optional)">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-premium focus-ring w-full border border-token rounded-md px-3 py-2.5 text-sm text-secondary-token mb-4 contact-input-premium"
                  placeholder="you@example.com"
                />
              </FieldLabel>
              <FieldLabel label="Enquiry for:">
                <select
                  value={form.enquiryType}
                  onChange={(e) => setForm({ ...form, enquiryType: e.target.value })}
                  className="input-premium focus-ring w-full border border-token rounded-md px-3 py-2.5 text-sm text-secondary-token mb-4 bg-white contact-input-premium"
                >
                  <option value="" disabled>-- Select an option --</option>
                  <option value="On-Grid Solar System">On-Grid Solar System</option>
                  <option value="Hybrid Solar System">Hybrid Solar System</option>
                  <option value="Off-Grid Solar System">Off-Grid Solar System</option>
                  <option value="Commercial Installation">Commercial Installation</option>
                  <option value="Maintenance & Service">Maintenance & Service</option>
                  <option value="Other">Other</option>
                </select>
              </FieldLabel>
              <FieldLabel label={isMessageRequired ? "Message" : "Message (optional)"}>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="input-premium focus-ring w-full border border-token rounded-md px-3 py-2.5 text-sm text-secondary-token mb-5 resize-none contact-input-premium"
                  placeholder="How can we help?"
                />
              </FieldLabel>
              {attempted && otherError && (
                <p role="alert" className="contact-field-error mb-3">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {otherError}
                </p>
              )}
              {/* Deliberately not `disabled` while invalid: a dead button gives
                  the visitor no reason, and pressing it is what reveals the
                  per-field warnings. handleSubmit is the real gate. */}
              <button
                onClick={handleSubmit}
                className={`btn-primary-token focus-ring inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold ${canSend ? "" : "opacity-60"}`}
              >
                <Send className="w-4 h-4" /> Send Message
              </button>
            </>
          )}
        </div>
      </div>
      {/* Task C — Legal footer links */}
      <div className="mt-12 pt-6 border-t border-token flex flex-wrap gap-4 items-center text-xs text-muted-token">
        <span>© {new Date().getFullYear()} Gurukrupa Powertech Solutions</span>
        <Link to="/privacy-policy" className="focus-ring rounded-sm hover:underline" style={{ color: "var(--color-secondary)", fontWeight: 500 }}>Privacy Policy</Link>
        <Link to="/terms-and-conditions" className="focus-ring rounded-sm hover:underline" style={{ color: "var(--color-secondary)", fontWeight: 500 }}>Terms &amp; Conditions</Link>
      </div>
    </section>
  );
}

/* One row inside the "Get in touch" glass card. Children rather than a `value`
   prop, so multi-line entries (address, hours) can carry their own markup. */
function GlassDetail({ icon, label, href, children }) {
  const body = <div className="text-sm font-semibold text-secondary-token leading-relaxed">{children}</div>;

  return (
    <div className="flex items-start gap-4">
      <div className="contact-glass-icon w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-token mb-1">{label}</p>
        {href ? (
          <a href={href} className="contact-glass-link focus-ring rounded-sm block break-words">
            {body}
          </a>
        ) : (
          body
        )}
      </div>
    </div>
  );
}

/* ===========================================================
   SHARED STYLES
=========================================================== */
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
      .gps-root {
        --color-primary: #F5A623;
        --color-primary-dark: #D98D0F;
        /* QA Phase 9 fix: gold #F5A623 measures 2.03:1 on white — fails WCAG
           AA (needs 4.5:1). This darker variant measures 4.91:1 and is used
           ONLY for small text on light backgrounds (eyebrow/kicker labels). */
        --color-primary-text: #9C6509;
        --color-secondary: #0A2540;
        --color-secondary-light: #12365C;
        --color-success: #1E9E63;
        --color-bg: #F4F6FB;
        --color-text: #1C1F26;
        --color-text-muted: #5A6270;
        --color-border: #E2E5EA;
        /* Premium tokens */
        --glow-gold: rgba(245,166,35,0.22);
        --shadow-card: var(--elev-2);
        --shadow-card-hover: var(--elev-4);
        --glass-bg: rgba(255,255,255,0.85);
        font-family: 'Inter', system-ui, sans-serif;
        color: var(--color-text);
        background: linear-gradient(160deg, #F5F7FD 0%, #EEF0F8 52%, #F1F3FA 100%);
      }
      .gps-root h1, .gps-root h2, .gps-root h3, .gps-root .font-display { font-family: 'Space Grotesk', system-ui, sans-serif; }
      .bg-primary-token { background: var(--color-primary); }
      .text-primary-token { color: var(--color-primary); }
      .text-eyebrow-token { color: var(--color-primary-text); }
      .bg-secondary-token { background: var(--color-secondary); }
      .text-secondary-token { color: var(--color-secondary); }
      .text-muted-token { color: var(--color-text-muted); }
      .border-token { border-color: var(--color-border); }

      /* ── Journey breadcrumb ─────────────────────────────────────────────
         Sits on this page's dark hero strip, so the crumbs are glass chips
         rather than bare links — the same treatment /roi-calculator gives its
         own rail, because the two are one journey and a visitor stepping
         between them should not see the mechanism change shape.

         Re-derived for the navy, not inverted: white at 0.88 on #0A2540 clears
         13:1, and the current-page chip uses the light gold #FFD98A rather than
         brand #F5A623, which has no headroom left once the gold tint is behind
         it. */
      .quote-crumb {
        background: rgba(255,255,255,0.10);
        border: 1px solid rgba(255,255,255,0.20);
        color: rgba(255,255,255,0.88);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        transition: background .2s ease, border-color .2s ease, transform .2s ease, color .2s ease;
      }
      a.quote-crumb:hover {
        background: rgba(255,255,255,0.18);
        border-color: rgba(245,166,35,0.70);
        color: #FFFFFF;
        transform: translateY(-1px);
      }
      /* The current page is a label, not a target: no hover, and the gold edge
         marks it as where you are. */
      .quote-crumb-current {
        background: rgba(245,166,35,0.18);
        border-color: rgba(245,166,35,0.52);
        color: #FFD98A;
        font-weight: 600;
      }
      @media (prefers-reduced-motion: reduce) {
        .quote-crumb { transition: none; }
        a.quote-crumb:hover { transform: none; }
      }

      /* Premium CTA button with gradient + gold glow */
      .btn-primary-token {
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
        color: #1C1F26;
        transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px rgba(245,166,35,0.35);
      }
      .btn-primary-token:hover {
        box-shadow: 0 8px 28px rgba(245,166,35,0.55), 0 0 20px rgba(245,166,35,0.4);
        transform: translateY(-2px) scale(1.02);
      }
      .btn-primary-token:active { transform: scale(0.98); }
      .btn-primary-token:disabled { box-shadow: none; transform: none; }

      .btn-outline-token { border: 1.5px solid var(--color-secondary); color: var(--color-secondary); background: transparent; transition: background .15s ease, color .15s ease; }
      .btn-outline-token:hover { background: var(--color-secondary); color: #fff; }

      /* Shimmer animation for primary CTA (Calculate / View Estimate) */
      .btn-shimmer { position: relative; overflow: hidden; }
      .btn-shimmer::after {
        content: '';
        position: absolute;
        top: 0; left: -100%; width: 60%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
        transform: skewX(-20deg);
        transition: none;
      }
      .btn-shimmer:not(:disabled):hover::after {
        animation: shimmerSlide .55s ease forwards;
      }
      @keyframes shimmerSlide { to { left: 150%; } }

      /* Panel premium — frosted glass with golden-accent hover lift */
      .panel-premium {
        background: rgba(255,255,255,0.82);
        backdrop-filter: blur(18px) saturate(180%);
        -webkit-backdrop-filter: blur(18px) saturate(180%);
        border: 1px solid rgba(255,255,255,0.7) !important;
        box-shadow: var(--elev-2), var(--bevel-light);
        transition: box-shadow .32s ease, transform .32s cubic-bezier(0.16, 1, 0.3, 1), border-color .32s ease;
      }
      .panel-premium:hover {
        transform: translateY(-4px);
        box-shadow: var(--elev-3), var(--ring-gold), var(--bevel-light);
      }

      /* Glassmorphism navbar — deeper premium glass */
      .nav-glass {
        background: rgba(248,250,255,0.88);
        backdrop-filter: blur(24px) saturate(200%);
        -webkit-backdrop-filter: blur(24px) saturate(200%);
        border-bottom: 1px solid rgba(226,229,234,0.65);
        box-shadow: 0 2px 16px rgba(10,37,64,0.06), 0 1px 0 rgba(245,166,35,0.05);
      }

      /* Premium glassmorphism modal card */
      .modal-glass {
        background: rgba(255,255,255,0.97);
        backdrop-filter: blur(28px) saturate(220%);
        -webkit-backdrop-filter: blur(28px) saturate(220%);
        border-radius: 20px;
        box-shadow:
          0 32px 80px rgba(10,37,64,0.30),
          0 0 0 1px rgba(255,255,255,0.65),
          inset 0 1px 0 rgba(255,255,255,0.9);
        animation: modalPop .25s cubic-bezier(0.34,1.56,0.64,1) forwards;
      }
      @keyframes modalPop {
        from { opacity: 0; transform: scale(0.92) translateY(8px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }

      /* Estimate result card — deep navy gradient + pulsing golden outer glow */
      .estimate-card {
        background: linear-gradient(145deg, #0A2540 0%, #12365C 60%, #0e2e50 100%);
        border: 1px solid rgba(245,166,35,0.28);
        box-shadow:
          0 0 0 1px rgba(245,166,35,0.12),
          0 24px 56px rgba(10,37,64,0.45),
          0 0 50px rgba(245,166,35,0.18);
        animation: estimatePulse 3.2s ease-in-out infinite;
      }
      @keyframes estimatePulse {
        0%,100% {
          box-shadow:
            0 0 0 1px rgba(245,166,35,0.12),
            0 24px 56px rgba(10,37,64,0.45),
            0 0 40px rgba(245,166,35,0.15);
        }
        50% {
          box-shadow:
            0 0 0 1px rgba(245,166,35,0.24),
            0 24px 56px rgba(10,37,64,0.45),
            0 0 64px rgba(245,166,35,0.28);
        }
      }

      /* Input fields — crisp glass with gold focus ring */
      .input-premium {
        background: rgba(255,255,255,0.96);
        box-shadow: 0 1px 3px rgba(10,37,64,0.07);
        transition: box-shadow .18s ease, border-color .18s ease;
      }
      .input-premium:focus {
        box-shadow: 0 0 0 3px rgba(245,166,35,0.20), 0 1px 3px rgba(10,37,64,0.06);
        border-color: var(--color-primary) !important;
        outline: none;
      }

      /* Card hover — matches the homepage treatment exactly, so a card does not
         change character when the visitor moves between the two pages. */
      .card-hover {
        transition: transform .32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow .32s ease, border-color .32s ease;
        background-image: var(--surface-raised);
        box-shadow: var(--shadow-card), var(--bevel-light);
      }
      .card-hover:hover {
        transform: translateY(-6px);
        box-shadow:
          var(--shadow-card-hover),
          var(--ring-gold),
          var(--glow-gold-soft),
          var(--bevel-light);
        border-color: rgba(245,166,35,0.26) !important;
      }

      /* TypeOption — active state: richer gradient + golden glow */
      .type-option-active {
        background: linear-gradient(135deg, #0A2540 0%, #12365C 100%);
        box-shadow: 0 6px 24px rgba(10,37,64,0.28), 0 0 0 1px rgba(245,166,35,0.22);
        border-color: transparent !important;
      }
      .type-option-idle:not(:disabled):hover {
        border-color: rgba(245,166,35,0.35) !important;
        background: rgba(10,37,64,0.03);
        box-shadow: 0 4px 16px rgba(10,37,64,0.10), 0 0 14px rgba(245,166,35,0.06);
      }

      .fade-in { animation: fadeIn .4s ease-out; }
      .fade-in-delay { animation: fadeInDelay .5s ease-out; animation-fill-mode: both; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeInDelay { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in-delay { animation-delay: 200ms; }
      @media (prefers-reduced-motion: reduce) {
        .fade-in, .fade-in-delay, .card-hover, .panel-premium, .btn-shimmer::after, .modal-glass, .estimate-card {
          animation: none !important;
          transition: none !important;
        }
      }
      .focus-ring:focus-visible { outline: 2.5px solid var(--color-primary); outline-offset: 2px; }
      select, input, textarea { border-radius: 6px; }
      table, td, th { border-color: var(--color-border); }
      *, *::before, *::after { box-sizing: border-box; }
    `}</style>
  );
}
