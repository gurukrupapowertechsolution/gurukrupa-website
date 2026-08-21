/**
 * calculation-engine/__tests__/systemSizing.test.ts
 *
 * Phase 3 — covers services/systemSizing.service.ts.
 *
 * Same conventions as modules.worked-examples.test.ts: plain `node:assert`, no
 * framework, self-executing blocks, run with ts-node.
 *
 * Expected values are worked by hand from the documented constants
 * (COST_PER_UNIT_RS 6, THREE_PHASE_DURATION_DAYS 30, SOLAR_GENERATION_PER_KW
 * 4.5) so that changing a constant fails this suite loudly rather than silently
 * shifting what customers are told:
 *
 *     divisor = 6 × 30 × 4.5 = 810
 *     rawKw   = monthlyBillRs / 810,  then ceil to the next 0.5 kW
 */

import assert from "node:assert";
import { calculateSystemSize } from "../../services/systemSizing.service";

/* -------------------------------------------------------------
   Typical residential bills.
   3000 / 810 = 3.70  -> 4.0
   6000 / 810 = 7.41  -> 7.5
   2430 / 810 = 3.00  -> 3.0  (exact multiple: must NOT round up to 3.5)
------------------------------------------------------------- */
(function testTypicalBills() {
  assert.strictEqual(calculateSystemSize(3000)?.recommendedSizeKw, 4);
  assert.strictEqual(calculateSystemSize(6000)?.recommendedSizeKw, 7.5);

  // Guards the boundary: Math.ceil on a value already at a step must be a
  // no-op. A naive `ceil(x / 0.5 + 1) * 0.5` would push this to 3.5.
  assert.strictEqual(calculateSystemSize(2430)?.recommendedSizeKw, 3);

  console.log("✅ Typical residential bills size correctly.");
})();

/* -------------------------------------------------------------
   Rounding direction. An undersized array is the failure mode that
   breaks the 95% offset promise, so sizing rounds UP, never to-nearest.
   2440 / 810 = 3.012 — to-nearest would give 3.0; we require 3.5.
------------------------------------------------------------- */
(function testRoundsUpNotNearest() {
  assert.strictEqual(calculateSystemSize(2440)?.recommendedSizeKw, 3.5);
  console.log("✅ Capacity rounds up to the next half kW, not to nearest.");
})();

/* -------------------------------------------------------------
   Result is always a clean half-kW multiple — no floating-point
   artefacts (3.5000000000000004) crossing the API boundary.
------------------------------------------------------------- */
(function testNoFloatingPointArtefacts() {
  for (let bill = 500; bill <= 60000; bill += 137) {
    const kw = calculateSystemSize(bill)?.recommendedSizeKw;
    assert.ok(kw !== undefined, `No result for bill ${bill}`);
    assert.strictEqual(
      Math.round(kw! * 2) / 2,
      kw,
      `Bill ${bill} produced a non-half-kW value: ${kw}`
    );
  }
  console.log("✅ Every result is an exact half-kW multiple.");
})();

/* -------------------------------------------------------------
   Clamping. Tiny bills floor at 1 kW, absurd ones cap at 100 kW,
   and both report clamped:true so the UI can soften its wording.
------------------------------------------------------------- */
(function testClamping() {
  const tiny = calculateSystemSize(100);
  assert.strictEqual(tiny?.recommendedSizeKw, 1);
  assert.strictEqual(tiny?.clamped, true);

  const huge = calculateSystemSize(5_000_000);
  assert.strictEqual(huge?.recommendedSizeKw, 100);
  assert.strictEqual(huge?.clamped, true);

  // A normal bill must NOT be flagged as clamped.
  assert.strictEqual(calculateSystemSize(6000)?.clamped, false);

  console.log("✅ Clamping bounds and the clamped flag behave correctly.");
})();

/* -------------------------------------------------------------
   Unusable inputs return null rather than NaN, Infinity or 0 kW.
   The controller turns null into a sanitized 500, so anything that
   slips past the schema still fails closed.
------------------------------------------------------------- */
(function testRejectsUnusableInput() {
  for (const bad of [0, -1, -5000, NaN, Infinity, -Infinity]) {
    assert.strictEqual(
      calculateSystemSize(bad),
      null,
      `Expected null for input ${bad}`
    );
  }
  console.log("✅ Unusable inputs return null.");
})();

/* -------------------------------------------------------------
   Monotonicity: a larger bill must never recommend a smaller system.
   This is the property a customer would actually notice being violated.
------------------------------------------------------------- */
(function testMonotonic() {
  let previous = 0;
  for (let bill = 1000; bill <= 80000; bill += 250) {
    const kw = calculateSystemSize(bill)!.recommendedSizeKw;
    assert.ok(kw >= previous, `Bill ${bill} recommended ${kw}, down from ${previous}`);
    previous = kw;
  }
  console.log("✅ Recommendation is monotonic in the bill.");
})();

console.log("\n🎉 systemSizing.service.ts — all assertions passed.");
