/**
 * The quotation journey's session store.
 *
 * Two pages share one piece of working state — /quote builds an estimate and
 * /roi-calculator finances it — and a visitor moves between them in both
 * directions. Before this module the storage keys, the read/write wrappers and
 * the shape of a draft were declared inside RemainingPages.jsx, which meant the
 * calculator could not see any of it: the handoff ran entirely through URL
 * query params, and the return trip carried nothing at all.
 *
 * Everything the journey remembers lives here, so the two pages cannot disagree
 * about what a draft contains or where it is kept.
 *
 * ── sessionStorage, not localStorage ───────────────────────────────────────
 * This is one visit's working state, not a saved document. It should not still
 * be sitting there in a week, and it should not follow the visitor into a new
 * tab they opened for something else.
 *
 * Every access is wrapped. Safari in private mode throws on sessionStorage
 * access, and a convenience feature must never be able to take down the
 * quotation form. A failed write means the journey forgets — never that it
 * breaks.
 */

const KEYS = {
  quote: 'gk.quote.draft.v1',
  roi: 'gk.roi.draft.v1',
  lead: 'gk.quote.lead.v1',
  gate: 'gk.quote.leadGateAnswered.v1',
  journey: 'gk.flow.journey.v1',
  active: 'gk.flow.active.v1',
  recovery: 'gk.flow.recoveryPending.v1',
};

function safeGet(key) {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Quota exceeded or storage unavailable — the forms still work, they just
       will not remember. Failing loudly here would be worse than forgetting. */
  }
}

function safeRemove(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* Storage unavailable — nothing was saved to clear. */
  }
}

/* ── The flow ───────────────────────────────────────────────────────────────
   Which routes count as "inside the quotation journey". This is the single
   definition the sentinel, the breadcrumbs and the recovery prompt all read,
   because they have to agree: a route that is in-flow for one and out-of-flow
   for another would either park the session while the visitor is still working
   in it, or never park it at all.

   /quote covers the subsidy check too — SchemeCTA lives on that page and opens
   the national portal in a new tab, so the visitor never leaves this route to
   do it. The homepage's own #subsidy band is deliberately NOT in the flow: it
   is a marketing section on a page the visitor may have arrived at for any
   reason, and treating it as part of the journey would keep the session pinned
   open for someone who has plainly wandered off. */
export const FLOW_STEPS = {
  quote: {
    id: 'quote',
    to: '/quote',
    label: 'Get Quotation',
  },
  roi: {
    id: 'roi',
    to: '/roi-calculator',
    label: 'EMI & ROI Calculator',
  },
};

/** The flow step a pathname belongs to, or null if it is outside the journey. */
export function flowStepFor(pathname) {
  if (pathname === '/quote' || pathname.startsWith('/quote/')) return 'quote';
  if (pathname === '/roi-calculator' || pathname.startsWith('/roi-calculator/')) return 'roi';
  return null;
}

/* ── The trail ──────────────────────────────────────────────────────────────
   An ordered list of the flow steps visited, newest last, used to render the
   breadcrumb. Consecutive repeats collapse: staying on /quote while switching
   tabs is not a journey step, and a re-render must not be able to grow it.

   ── Capped at TWO, down from three ─────────────────────────────────────────
   Three was the bug. There are only two pages in this flow, so a three-deep
   trail can only ever be A › B › A — and it rendered exactly that:

       EMI & ROI Calculator › Get Quotation › Back to EMI & ROI Calculator

   which is not a path, it is a lap. It appeared on the most ordinary route
   through the site there is: open the calculator from the nav, click "get an
   exact quotation", then use the breadcrumb to come back. Every step of that is
   correct behaviour and the rail still came out reading like a glitch.

   A breadcrumb answers "where am I, and what is one level up". With two pages
   the honest answer is never longer than two crumbs: where you came from, and
   where you are. Quote › EMI, or EMI › Quote. Nothing else is reachable.

   Capping the trail rather than trimming at render time is deliberate — the
   stored trail and the rendered rail stay the same object, so there is no
   second place for the two to disagree.

   With repeats impossible at this depth (withStep collapses consecutive ones,
   and two distinct steps cannot repeat inside a window of two), the "Back to …"
   labels that FLOW_STEPS used to carry are unreachable and have been deleted
   with them. */
const JOURNEY_MAX = 2;

/** Pure, so the sentinel that persists the trail and the page that renders it
 *  cannot compute different answers from the same starting point. */
export function withStep(trail, step) {
  const safe = Array.isArray(trail) ? trail : [];
  if (safe[safe.length - 1] === step) return safe;
  return [...safe, step].slice(-JOURNEY_MAX);
}

export function readJourney() {
  const trail = safeGet(KEYS.journey);
  return Array.isArray(trail) ? trail.filter((id) => FLOW_STEPS[id]) : [];
}

/* ── The input guard on the trail ───────────────────────────────────────────
   Merely LANDING on a flow page used to record it as a step, and the rail said
   so. Open /roi-calculator from the nav, touch nothing, click through to
   /quote, and the quotation page printed

       EMI & ROI Calculator › Get Quotation

   as if the visitor had modelled a loan and gone off to price it. They had
   walked past an empty form. A breadcrumb is a claim about how someone got
   here; a page they passed through without using is not part of that story, and
   printing it invites them to click back to a form they will find blank.

   So a step earns its place in the trail by having been USED. The current page
   is always the last crumb — that is just where you are — but a PREVIOUS step
   only survives if its own page holds data the visitor put there. When it does
   not, the trail resets to the current step alone, which renders as one crumb,
   which both pages already hide.

   ── "Used" is stricter than "resumable" ────────────────────────────────────
   quoteDraftHasContent() answers a different question — is there anything here
   worth offering back — and counts a bare productType, because restoring a
   chosen system type is worth doing. It cannot be reused here: /quote is linked
   from the homepage product cards as /quote?type=ON_GRID, which selects a type
   before the visitor has touched anything at all. Counting that as interaction
   would resurrect the exact false trail this guard exists to remove, on the
   commonest entry path there is.

   The predicates below therefore ask only about fields a human had to fill in.
   Defaulted fields are excluded for the same reason: the calculator seeds
   tenure at 5 years and interest at the standard rate on mount, so those two
   are true of every visit and prove nothing. */

/** Did a human enter or modify data in the quotation form? */
export function quoteDraftHasUserInput(draft) {
  if (!draft) return false;
  /* A calculated estimate is proof of input by construction — the button that
     produces one is disabled until the form validates. */
  if (draft.result) return true;
  if (Array.isArray(draft.applications) && draft.applications.some((a) => a.applianceId)) return true;
  return Boolean(
    draft.backupDaytime ||
    draft.backupNighttime ||
    draft.phase ||
    draft.peakBill ||
    draft.bottomBill
  );
}

/** Did a human enter or modify data in the EMI / ROI calculator?
 *  Bill and cost are the only two fields that are not defaulted, and cost is
 *  derived from the bill — so a non-empty either way means someone typed. */
export function roiDraftHasUserInput(draft) {
  if (!draft) return false;
  return Boolean(draft.monthlyBill || draft.systemCost);
}

/** Has the page behind this flow step actually been filled in? */
export function stepHasUserInput(step) {
  if (step === 'quote') return quoteDraftHasUserInput(readQuoteDraft());
  if (step === 'roi') return roiDraftHasUserInput(readRoiDraft());
  return false;
}

/**
 * The trail as it should read on arrival at `step`.
 *
 * The single definition of the guard above. Both the sentinel (which persists
 * the trail) and the two pages (which render it during their own first paint,
 * BEFORE the sentinel's effect runs) call this, so they cannot disagree about
 * what the rail says — the same reason `withStep` was pure.
 */
export function journeyOnArrival(trail, step) {
  const safe = Array.isArray(trail) ? trail : [];
  const previous = safe[safe.length - 1];
  if (previous && previous !== step && !stepHasUserInput(previous)) return [step];
  return withStep(safe, step);
}

/** Record arrival at a flow step, guarded. The sentinel's half of the above,
 *  and the ONLY writer of the trail. The unguarded `pushJourneyStep` it replaced
 *  is gone rather than kept beside it: a second way to write the trail is a
 *  second place for the stored trail and the rendered rail to disagree, which is
 *  the thing this module is organised to prevent. */
export function enterJourneyStep(step) {
  const next = journeyOnArrival(readJourney(), step);
  safeSet(KEYS.journey, next);
  return next;
}

/**
 * Forget the trail.
 *
 * Called when the visitor leaves the flow for an unrelated page. The trail is a
 * record of an unbroken run through the journey, and once it is broken it stops
 * describing how the visitor got where they are: someone who went
 * quote → calculator → homepage and then opened the calculator again from the
 * nav did NOT arrive through the quotation page, and a rail still claiming they
 * did is the same class of untruth as the lap it replaced.
 *
 * Only the trail goes. Drafts, the lead details and the permission answer all
 * survive — parking, not deleting, is the whole distinction this module is
 * built around. What the visitor typed is still there when they come back; only
 * the claim about their route is dropped.
 */
export function clearJourney() {
  safeRemove(KEYS.journey);
}

/**
 * Did the visitor reach the last step in this trail directly from `step`?
 *
 * The one question both the breadcrumb and the calculator's closing CTA need
 * answering, asked in one place so they cannot give different answers about the
 * same visit.
 */
export function journeyArrivedFrom(trail, step) {
  const safe = Array.isArray(trail) ? trail : [];
  return safe[safe.length - 2] === step;
}

/**
 * Turn a trail into rendered crumbs.
 *
 * At most two, and the last is always the page you are on — see the cap note
 * above. So this is "where you came from › where you are", with the first crumb
 * a real link: that link is the journey the rail exists to make possible.
 */
export function journeyCrumbs(trail) {
  return trail
    .map((id, i) => {
      const step = FLOW_STEPS[id];
      if (!step) return null;
      return {
        key: `${id}-${i}`,
        label: step.label,
        to: step.to,
        current: i === trail.length - 1,
      };
    })
    .filter(Boolean);
}

/* ── Active vs parked ───────────────────────────────────────────────────────
   The session is ACTIVE while the visitor is working inside the journey, and
   PARKED the moment they leave it for an unrelated page.

   Parking does not delete anything. It is the difference between "restore this
   silently, they are mid-task" and "ask first, they went away". Someone who
   read three blog posts and then opened /quote should not find a half-filled
   form they have forgotten the contents of — but they should not have to
   rebuild it from memory either, which is what deleting on exit would force.

   Written by QuoteFlowSentinel and nothing else. It used to be activated by the
   two page components instead, which is the whole reason the recovery prompt
   fired inside an unbroken flow: on /quote the activation lived in the
   QuotationPage panel, and that panel does not mount for ?tab=brochure or
   ?tab=contact. A visitor who came in on the Brochure view therefore never
   activated anything, and the calculator they opened from the strip one click
   later read a session that had never stopped looking parked. The route is what
   knows whether the visitor is in the flow, so the route watcher owns the
   flag.

   ⚠ This is NOT what decides whether the recovery prompt opens. It answers
   "is the visitor inside the flow right now", which is a question about the
   present; the prompt turns on whether a departure has been answered for, which
   is a question about the past. Wiring a page's bootstrap to this read is
   precisely the bug the block below exists to prevent — use isRecoveryPending()
   there. */
export const isSessionActive = () => safeGet(KEYS.active) === true;
export const activateSession = () => safeSet(KEYS.active, true);

/* ── The prompt that owes the visitor an answer ─────────────────────────────
   "Are we inside the flow" and "is there a parked draft nobody has been asked
   about yet" are two different questions, and collapsing them into the single
   `active` boolean is what made the prompt impossible to get right. Re-entering
   the flow has to clear the first — the visitor is demonstrably back — while
   leaving the second standing, because being back is not an answer to "resume
   or start fresh?".

   So parking arms this, and only the visitor answering disarms it. That is what
   makes the rule hold in both directions:

     · /quote → /roi-calculator, or the calculator's "Edit your quotation" back
       to /quote, never park, so nothing is ever armed and no prompt appears.
     · /quote → /about → /roi-calculator parks on the way through /about, so the
       prompt is armed and the calculator asks on arrival.
     · /quote → /about → /quote?tab=brochure → Get Quotation still asks, on the
       tab switch, because arriving at the route does not disarm it and the
       Brochure view has no form to offer the draft back to. The prompt reaches
       the visitor at the moment it is about something they can see.

   Armed only when there is something to offer. A visitor who wandered off with
   two empty forms is owed no question at all. */
export function parkSession() {
  safeSet(KEYS.active, false);
  if (hasResumableSession()) safeSet(KEYS.recovery, true);
}

/** True while a parked session is still owed a resume/start-new answer. */
export const isRecoveryPending = () => safeGet(KEYS.recovery) === true;

/** The visitor answered — either way. Both branches resolve it: "start a new
 *  one" is as much an answer as "resume", and leaving it armed would re-ask on
 *  the next page of the flow. */
export const resolveRecovery = () => safeRemove(KEYS.recovery);

/* ── Drafts ─────────────────────────────────────────────────────────────── */
export const readQuoteDraft = () => safeGet(KEYS.quote);
export const writeQuoteDraft = (draft) => safeSet(KEYS.quote, draft);
export const clearQuoteDraft = () => safeRemove(KEYS.quote);

export const readRoiDraft = () => safeGet(KEYS.roi);
export const writeRoiDraft = (draft) => safeSet(KEYS.roi, draft);

/* ── Lead capture ───────────────────────────────────────────────────────── */
export const readStoredLead = () => safeGet(KEYS.lead);
export const writeStoredLead = (lead) => safeSet(KEYS.lead, lead);
/** True once the visitor has answered the permission question in this session. */
export const hasAnsweredLeadGate = () => safeGet(KEYS.gate) === true;
/** Records that the question has been put, whatever the answer was. */
export const markLeadGateAnswered = () => safeSet(KEYS.gate, true);

/* ── "Is there anything worth resuming?" ────────────────────────────────────
   The recovery prompt must never appear for a visitor who has nothing to
   recover. Merely opening /quote writes a draft — an empty one — so the mere
   existence of a stored draft proves nothing; these ask whether a human put
   anything in it. */
export function quoteDraftHasContent(draft) {
  if (!draft) return false;
  if (draft.result) return true;
  if (draft.productType) return true;
  if (Array.isArray(draft.applications) && draft.applications.some((a) => a.applianceId)) return true;
  return Boolean(draft.peakBill || draft.bottomBill || draft.backupDaytime || draft.backupNighttime);
}

export function roiDraftHasContent(draft) {
  if (!draft) return false;
  return Boolean(draft.monthlyBill || draft.systemCost);
}

/** Anything, on either page, that the visitor would recognise as their work. */
export function hasResumableSession() {
  return quoteDraftHasContent(readQuoteDraft()) || roiDraftHasContent(readRoiDraft());
}

/**
 * "Start a new one" — discard the journey and everything in it.
 *
 * The lead details and the contact-permission answer deliberately survive. They
 * are facts about the person, not about the quotation being thrown away: the
 * visitor answered "may we contact you?" once, and re-arming that modal because
 * they chose to re-do their figures is the nagging the gate exists to prevent.
 * Nothing here is offered by the recovery prompt, so nothing here is what
 * "start new" is refusing.
 *
 * Re-activates on the way out — the visitor is starting work, not leaving.
 */
export function clearSession() {
  safeRemove(KEYS.quote);
  safeRemove(KEYS.roi);
  safeRemove(KEYS.journey);
  resolveRecovery();
  activateSession();
}
