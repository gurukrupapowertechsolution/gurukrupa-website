/**
 * Tests for the quotation-session state machine.
 *
 *   node src/lib/quoteSession.test.mjs        (from frontend/)
 *
 * No test runner: the project has none, and adding one to check a handful of
 * pure functions would be a bigger change than the thing being checked. This
 * runs on plain node, exits non-zero on failure, and can be dropped into CI as
 * a single command.
 *
 * Why it exists at all — this logic decides whether a visitor's half-finished
 * quotation is restored, hidden behind a prompt, or destroyed, and now also
 * which of two things the calculator's closing CTA offers. Every one of those
 * outcomes looks identical from the outside until it is the wrong one, and the
 * interesting cases (parked-but-not-deleted, the two-crumb cap, the
 * Safari-private-mode path) are all awkward to reach by hand in a browser.
 */

// ── Fake sessionStorage, installed before the module under test is loaded ───
const store = new Map();
globalThis.window = {
  sessionStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
};

const S = await import('./quoteSession.js');

let pass = 0;
let fail = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    fail++;
    console.log(`  FAIL ${name}\n         expected ${e}\n         actual   ${a}`);
  }
}

console.log('\nflowStepFor');
check('/quote is in flow', S.flowStepFor('/quote'), 'quote');
check('/roi-calculator is in flow', S.flowStepFor('/roi-calculator'), 'roi');
check('/ is out of flow', S.flowStepFor('/'), null);
check('/about is out of flow', S.flowStepFor('/about'), null);
check('/blog/x is out of flow', S.flowStepFor('/blog/x'), null);
// A prefix match on '/quote' alone would swallow this.
check('/quotes is NOT quote', S.flowStepFor('/quotes'), null);

console.log('\nwithStep');
check('appends', S.withStep([], 'quote'), ['quote']);
check('collapses repeat', S.withStep(['quote'], 'quote'), ['quote']);
check('appends different', S.withStep(['quote'], 'roi'), ['quote', 'roi']);
// The cap is what stops the trail turning into a lap. A round trip drops the
// oldest step rather than growing to three, so the rail can never read
// "EMI › Get Quotation › Back to EMI".
check('round trip caps at 2', S.withStep(['quote', 'roi'], 'quote'), ['roi', 'quote']);
check('and again, still 2', S.withStep(['roi', 'quote'], 'roi'), ['quote', 'roi']);
check('handles junk', S.withStep(null, 'quote'), ['quote']);

console.log('\njourneyCrumbs');
check(
  'quote -> roi',
  S.journeyCrumbs(['quote', 'roi']).map((c) => [c.label, c.current]),
  [['Get Quotation', false], ['EMI & ROI Calculator', true]]
);
check(
  'roi -> quote',
  S.journeyCrumbs(['roi', 'quote']).map((c) => [c.label, c.current]),
  [['EMI & ROI Calculator', false], ['Get Quotation', true]]
);
check('single step renders one crumb', S.journeyCrumbs(['quote']).length, 1);
// The rail is hidden at one crumb, so this is the "no breadcrumb" case.
check('direct arrival is a single crumb', S.journeyCrumbs(S.withStep([], 'roi')).length, 1);

console.log('\njourneyArrivedFrom');
check('quote -> roi came from quote', S.journeyArrivedFrom(['quote', 'roi'], 'quote'), true);
check('direct arrival did not', S.journeyArrivedFrom(['roi'], 'quote'), false);
check('roi -> quote is not "from quote"', S.journeyArrivedFrom(['roi', 'quote'], 'quote'), false);
check('handles junk', S.journeyArrivedFrom(null, 'quote'), false);

console.log('\nresumable predicates');
check('null draft', S.quoteDraftHasContent(null), false);
check(
  'merely opening the page is not content',
  S.quoteDraftHasContent({
    productType: null,
    applications: [{ applianceId: '', quantity: 1 }],
    peakBill: '',
  }),
  false
);
check('type chosen', S.quoteDraftHasContent({ productType: 'ON_GRID' }), true);
check('appliance chosen', S.quoteDraftHasContent({ applications: [{ applianceId: 'fan', quantity: 2 }] }), true);
check('bill entered', S.quoteDraftHasContent({ peakBill: '6000' }), true);
check('result present', S.quoteDraftHasContent({ result: { estimateCost: 1 } }), true);
check('roi empty', S.roiDraftHasContent({ monthlyBill: '', systemCost: '' }), false);
check('roi bill', S.roiDraftHasContent({ monthlyBill: '6000' }), true);

/* ── The stricter predicate the breadcrumb guard runs on ────────────────────
   "Worth offering back" and "the visitor interacted with this page" are
   different questions and the trail needs the second one. The divergence that
   matters is productType: restoring it is worth doing, but /quote?type=ON_GRID
   is linked from every homepage product card, so it is set before the visitor
   has touched anything. */
console.log('\nuser-input predicates');
check('null draft', S.quoteDraftHasUserInput(null), false);
check(
  'a deep-linked type is NOT interaction',
  S.quoteDraftHasUserInput({ productType: 'ON_GRID' }),
  false
);
check('...but it IS resumable content', S.quoteDraftHasContent({ productType: 'ON_GRID' }), true);
check(
  'an empty appliance row is not interaction',
  S.quoteDraftHasUserInput({ productType: 'HYBRID', applications: [{ applianceId: '', quantity: 1 }] }),
  false
);
check(
  'a chosen appliance is',
  S.quoteDraftHasUserInput({ applications: [{ applianceId: 'AC', quantity: 1 }] }),
  true
);
check('a bill is', S.quoteDraftHasUserInput({ peakBill: '6000' }), true);
check('a phase is', S.quoteDraftHasUserInput({ phase: '1' }), true);
check('backup hours are', S.quoteDraftHasUserInput({ backupNighttime: '4' }), true);
check('an estimate proves input', S.quoteDraftHasUserInput({ result: { estimateCost: 1 } }), true);
// The calculator seeds tenure and rate on mount, so they are true of every
// visit including the ones that touched nothing.
check(
  'defaulted loan terms are not interaction',
  S.roiDraftHasUserInput({ monthlyBill: '', systemCost: '', tenureYears: '5', interestRate: '8.5' }),
  false
);
check('a typed bill is', S.roiDraftHasUserInput({ monthlyBill: '6000' }), true);

/* ── The trail's input guard ────────────────────────────────────────────────
   The reported bug: open /roi-calculator from the nav, touch nothing, click
   through to /quote, and the quotation page printed "EMI & ROI Calculator ›
   Get Quotation" as if the visitor had modelled a loan first. */
console.log('\njourneyOnArrival — the input guard');

store.clear();
S.enterJourneyStep('roi'); // walked past the calculator, entered nothing
check('the untouched calculator does not become a crumb', S.enterJourneyStep('quote'), ['quote']);
check('so the rail is hidden', S.journeyCrumbs(S.readJourney()).length, 1);

store.clear();
S.enterJourneyStep('roi');
S.writeRoiDraft({ monthlyBill: '6000', tenureYears: '5' }); // actually used it
check('a used calculator does', S.enterJourneyStep('quote'), ['roi', 'quote']);

store.clear();
S.enterJourneyStep('quote'); // walked past the quotation form, entered nothing
check('the untouched quote page does not either', S.enterJourneyStep('roi'), ['roi']);

store.clear();
S.enterJourneyStep('quote');
S.writeQuoteDraft({ peakBill: '6000' });
check('a filled-in quote page does', S.enterJourneyStep('roi'), ['quote', 'roi']);
// And the calculator's closing CTA reads the same trail — it must not offer to
// "edit your quotation" for someone who never wrote one.
check('the Edit CTA follows the guard', S.journeyArrivedFrom(S.readJourney(), 'quote'), true);

store.clear();
S.enterJourneyStep('roi');
check('a direct arrival is still one crumb', S.readJourney(), ['roi']);
check('and staying put collapses', S.enterJourneyStep('roi'), ['roi']);

console.log('\nfull journey');
store.clear();

// 1. Land on /quote with nothing stored.
S.enterJourneyStep('quote');
S.activateSession();
check('fresh visit has nothing to resume', S.hasResumableSession(), false);

// 2. Fill in and calculate.
S.writeQuoteDraft({
  productType: 'ON_GRID',
  applications: [],
  peakBill: '6000',
  bottomBill: '4000',
  result: { estimateCost: 250000, totalCostBeforeSubsidy: 328000, subsidyAmount: 78000 },
});
check('now resumable', S.hasResumableSession(), true);

// 3. Hand off to the calculator — still inside the flow.
S.enterJourneyStep('roi');
check('stays active across the handoff', S.isSessionActive(), true);
check(
  'outbound rail is exactly Get Quotation -> EMI',
  S.journeyCrumbs(S.readJourney()).map((c) => c.label),
  ['Get Quotation', 'EMI & ROI Calculator']
);
check('calculator knows it came from the quote', S.journeyArrivedFrom(S.readJourney(), 'quote'), true);
S.writeRoiDraft({ monthlyBill: '6000', systemCost: '250000', tenureYears: '7', interestRate: '8.5' });

// 4. Back to /quote.
S.enterJourneyStep('quote');
check('still active on the return leg', S.isSessionActive(), true);
check('base cost survived the round trip', S.readQuoteDraft().result.totalCostBeforeSubsidy, 328000);
check('loan terms survived the round trip', S.readRoiDraft().tenureYears, '7');
check(
  'return rail is two crumbs, not a lap',
  S.journeyCrumbs(S.readJourney()).map((c) => c.label),
  ['EMI & ROI Calculator', 'Get Quotation']
);

// 4b. And back to the calculator again — the case that used to render
//     "EMI › Get Quotation › Back to EMI".
S.enterJourneyStep('roi');
check(
  'second lap still reads Get Quotation -> EMI',
  S.journeyCrumbs(S.readJourney()).map((c) => c.label),
  ['Get Quotation', 'EMI & ROI Calculator']
);

// 5. Wander off to an unrelated page.
S.parkSession();
S.clearJourney();
check('parked', S.isSessionActive(), false);
check('parking does not delete', S.hasResumableSession(), true);
check('estimate still stored while parked', S.readQuoteDraft().result.totalCostBeforeSubsidy, 328000);
check('loan terms still stored while parked', S.readRoiDraft().tenureYears, '7');
// Leaving the flow drops the claim about the route but not the work. Coming
// back to the calculator from the nav is a direct arrival, so the CTA must
// offer "get a quotation" rather than "edit" one.
check('leaving the flow forgets the route', S.readJourney(), []);
check(
  'return via the nav is a direct arrival',
  S.journeyArrivedFrom(S.withStep(S.readJourney(), 'roi'), 'quote'),
  false
);

// 6. Return — the page offers rather than auto-restoring.
check(
  'return offers instead of restoring',
  !S.isSessionActive() && S.quoteDraftHasContent(S.readQuoteDraft()),
  true
);

// 7a. Resume.
S.activateSession();
check('resume keeps the data', S.readQuoteDraft().result.estimateCost, 250000);
check('resume reactivates', S.isSessionActive(), true);

// 7b. Or start new.
S.parkSession();
S.clearSession();
check('start-new wipes the quote draft', S.readQuoteDraft(), null);
check('start-new wipes the roi draft', S.readRoiDraft(), null);
check('start-new wipes the trail', S.readJourney(), []);
check('start-new reactivates', S.isSessionActive(), true);

/* ── The recovery prompt's trigger rule ─────────────────────────────────────
   The rule, stated as the business states it: the prompt appears if and only if
   the visitor LEFT the flow and came back. Moving between /quote and
   /roi-calculator — in either direction, through any view of either page —
   must never produce it.

   Modelled rather than asserted piecemeal, because every past bug here was a
   sequence bug: each individual read looked right and the order they ran in was
   what made the prompt wrong. `visit` is QuoteFlowSentinel's effect and
   `promptAt` is the bootstrap useMemo both pages run during render — in the
   real app the render happens first and the sentinel's effect second, which is
   the order used here. */
console.log('\nrecovery prompt trigger rule');

/** One route change. Mirrors QuoteFlowSentinel exactly. */
function visit(pathname) {
  const step = S.flowStepFor(pathname);
  if (step) {
    S.enterJourneyStep(step);
    S.activateSession();
    return;
  }
  S.parkSession();
  S.clearJourney();
}

/** What the rail on `page` renders. Mirrors the useMemo both pages run during
 *  their own first paint — which happens BEFORE the sentinel's effect for the
 *  same navigation, so it recomputes the trail rather than reading it back. The
 *  rail is hidden below two crumbs. */
function railAt(page) {
  return S.journeyCrumbs(S.journeyOnArrival(S.readJourney(), page)).map((c) => c.label);
}

/** Would this page put the prompt up right now? Mirrors both bootstraps. */
function promptAt(page) {
  const draft = page === 'quote' ? S.readQuoteDraft() : S.readRoiDraft();
  const has = page === 'quote' ? S.quoteDraftHasContent(draft) : S.roiDraftHasContent(draft);
  return has && S.isRecoveryPending();
}

/** Arrive at a route: the page renders (and may prompt) before the sentinel
 *  effect for that route runs. */
function arrive(pathname, page) {
  const prompted = page ? promptAt(page) : false;
  visit(pathname);
  return prompted;
}

const FILLED_QUOTE = { productType: 'ON_GRID', peakBill: '6000', result: { estimateCost: 250000 } };
const FILLED_ROI = { monthlyBill: '6000', systemCost: '250000' };

// A: the unbroken flow. Quote → EMI → Quote, with work on both pages.
store.clear();
arrive('/quote', 'quote');
S.writeQuoteDraft(FILLED_QUOTE);
check('A1 quote -> EMI does not prompt', arrive('/roi-calculator', 'roi'), false);
S.writeRoiDraft(FILLED_ROI);
check('A2 EMI -> quote does not prompt', arrive('/quote', 'quote'), false);
check('A3 and back again does not prompt', arrive('/roi-calculator', 'roi'), false);

// B: the bug this phase was reported for. Entering the flow on a view of
//    /quote that does not mount the quotation form — the Brochure tab — used to
//    leave the session looking parked, so the next step of the flow greeted the
//    visitor with a prompt they had not earned.
store.clear();
arrive('/', null);
S.writeQuoteDraft(FILLED_QUOTE);
S.writeRoiDraft(FILLED_ROI);
S.resolveRecovery(); // the visitor already answered earlier in the visit
check('B1 brochure view of /quote does not prompt', arrive('/quote', null), false);
check('B2 brochure -> EMI does not prompt', arrive('/roi-calculator', 'roi'), false);

// C: a genuine abandonment. Leaving for an unrelated page and coming back is
//    the one case that must ask, on whichever flow page is returned to.
store.clear();
arrive('/quote', 'quote');
S.writeQuoteDraft(FILLED_QUOTE);
S.writeRoiDraft(FILLED_ROI);
arrive('/about', null);
check('C1 leaving the flow arms the prompt', S.isRecoveryPending(), true);
check('C2 returning to the quote page asks', arrive('/quote', 'quote'), true);

store.clear();
arrive('/roi-calculator', 'roi');
S.writeRoiDraft(FILLED_ROI);
arrive('/blog/x', null);
check('C3 returning to the calculator asks', arrive('/roi-calculator', 'roi'), true);

// D: abandoning with two empty forms is owed no question at all.
store.clear();
arrive('/quote', 'quote');
arrive('/', null);
check('D1 nothing to resume, nothing armed', S.isRecoveryPending(), false);
check('D2 so the return is silent', arrive('/quote', 'quote'), false);

// E: answering resolves it once, for the whole flow — the prompt must not
//    follow the visitor from one page of the journey to the next.
store.clear();
arrive('/quote', 'quote');
S.writeQuoteDraft(FILLED_QUOTE);
S.writeRoiDraft(FILLED_ROI);
arrive('/about', null);
check('E1 armed', arrive('/quote', 'quote'), true);
S.resolveRecovery(); // visitor pressed Resume
check('E2 the calculator does not re-ask', arrive('/roi-calculator', 'roi'), false);
check('E3 nor does the quote page on the way back', arrive('/quote', 'quote'), false);

// F: returning on the Brochure view after a real abandonment still owes the
//    question — it is asked when the visitor opens the form it is about,
//    because arriving at the route is not an answer.
store.clear();
arrive('/quote', 'quote');
S.writeQuoteDraft(FILLED_QUOTE);
arrive('/about', null);
check('F1 brochure view has no form to offer, so it is silent', arrive('/quote', null), false);
check('F2 still armed after arriving', S.isRecoveryPending(), true);
check('F3 switching to the form asks', promptAt('quote'), true);

// G: "Start a new one" is an answer too.
store.clear();
arrive('/quote', 'quote');
S.writeQuoteDraft(FILLED_QUOTE);
arrive('/', null);
check('G1 armed', arrive('/quote', 'quote'), true);
S.clearSession(); // visitor pressed Start a new one
check('G2 disarmed', S.isRecoveryPending(), false);
check('G3 and the calculator is silent', arrive('/roi-calculator', 'roi'), false);

/* ── The breadcrumb, end to end through the router ──────────────────────────
   The bug as reported, and its counterpart. `railAt` runs before `visit` in
   each pair because that is the real order: the arriving page renders its rail
   during the same commit that the sentinel's effect runs after. */
console.log('\nbreadcrumb guard through the router');

// H: EMI → Quote having typed nothing. No cross-page rail at either end.
store.clear();
arrive('/roi-calculator', 'roi');
check('H1 rail on arrival at the calculator is hidden', railAt('roi').length, 1);
check('H2 EMI -> Quote shows no path', railAt('quote'), ['Get Quotation']);
visit('/quote');
check('H3 and nothing false is stored', S.readJourney(), ['quote']);

// I: the same route, having actually used the calculator.
store.clear();
arrive('/roi-calculator', 'roi');
S.writeRoiDraft(FILLED_ROI);
check('I1 EMI -> Quote shows the path', railAt('quote'), ['EMI & ROI Calculator', 'Get Quotation']);
visit('/quote');
check('I2 and it is stored', S.readJourney(), ['roi', 'quote']);

// J: leaving the flow still drops the claim, filled in or not.
arrive('/about', null);
check('J1 the detour forgets the route', S.readJourney(), []);
check('J2 so the return is a direct arrival', railAt('quote').length, 1);

console.log('\nconsent outlives a discarded quotation');
store.clear();
S.markLeadGateAnswered();
S.writeStoredLead({ name: 'A' });
S.writeQuoteDraft({ productType: 'HYBRID' });
S.clearSession();
check('permission answer survives', S.hasAnsweredLeadGate(), true);
check('lead survives', S.readStoredLead(), { name: 'A' });
check('draft does not', S.readQuoteDraft(), null);

console.log('\nstorage denied (Safari private mode)');
globalThis.window.sessionStorage = {
  getItem() { throw new Error('denied'); },
  setItem() { throw new Error('denied'); },
  removeItem() { throw new Error('denied'); },
};
let threw = false;
try {
  S.readQuoteDraft();
  S.writeQuoteDraft({ productType: 'ON_GRID' });
  S.enterJourneyStep('quote');
  S.clearSession();
  S.isSessionActive();
  S.hasResumableSession();
} catch {
  threw = true;
}
check('never throws', threw, false);
check('degrades to "nothing stored"', S.hasResumableSession(), false);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
