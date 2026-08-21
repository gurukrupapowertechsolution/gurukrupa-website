import assert from "node:assert";
import { calculatePrice } from "../../pricing-engine/pricingEngine.service";
import { InternalCalculationResult } from "../../types/quotation.types";
import { updatePriceList } from "../../config/runtimeConfigStore";

function approxEqual(actual: number, expected: number, tolerance = 0.01) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ~${expected}, got ${actual} (tolerance ${tolerance})`
  );
}

// Setup the expected state in the config store for our tests
updatePriceList({
  onGridRatePerKwRs: 50000,
  onGridDiscomChargeRs: 1500,
});

console.log("Running Pricing Engine Tests...");

(function testOnGrid1Kw() {
  const calc: InternalCalculationResult = {
    productType: "ON_GRID",
    solarCapacityKw: 1,
  };
  const result = calculatePrice(calc);
  
  const expectedBaseCost = (1 * 50000) + 1500; // 51,500
  const expectedSubsidy = 30000;
  
  assert.strictEqual(result.totalCostBeforeSubsidy, expectedBaseCost);
  assert.strictEqual(result.subsidyAmountRs, expectedSubsidy);
  assert.strictEqual(result.totalEstimateCostRs, expectedBaseCost - expectedSubsidy);
})();

(function testOnGrid2Kw() {
  const calc: InternalCalculationResult = {
    productType: "ON_GRID",
    solarCapacityKw: 2,
  };
  const result = calculatePrice(calc);
  
  const expectedBaseCost = (2 * 50000) + 1500; // 101,500
  const expectedSubsidy = 60000;
  
  assert.strictEqual(result.totalCostBeforeSubsidy, expectedBaseCost);
  assert.strictEqual(result.subsidyAmountRs, expectedSubsidy);
  assert.strictEqual(result.totalEstimateCostRs, expectedBaseCost - expectedSubsidy);
})();

(function testOnGrid2_5Kw() {
  const calc: InternalCalculationResult = {
    productType: "ON_GRID",
    solarCapacityKw: 2.5,
  };
  const result = calculatePrice(calc);
  
  const expectedBaseCost = (2.5 * 50000) + 1500; // 126,500
  const expectedSubsidy = 60000 + 9000; // 69000
  
  assert.strictEqual(result.totalCostBeforeSubsidy, expectedBaseCost);
  assert.strictEqual(result.subsidyAmountRs, expectedSubsidy);
  assert.strictEqual(result.totalEstimateCostRs, expectedBaseCost - expectedSubsidy);
})();

(function testOnGrid3Kw() {
  const calc: InternalCalculationResult = {
    productType: "ON_GRID",
    solarCapacityKw: 3,
  };
  const result = calculatePrice(calc);
  
  const expectedBaseCost = (3 * 50000) + 1500; // 151,500
  const expectedSubsidy = 78000;
  
  assert.strictEqual(result.totalCostBeforeSubsidy, expectedBaseCost);
  assert.strictEqual(result.subsidyAmountRs, expectedSubsidy);
  assert.strictEqual(result.totalEstimateCostRs, expectedBaseCost - expectedSubsidy);
})();

(function testOnGrid5Kw() {
  const calc: InternalCalculationResult = {
    productType: "ON_GRID",
    solarCapacityKw: 5,
  };
  const result = calculatePrice(calc);
  
  const expectedBaseCost = (5 * 50000) + 1500; // 251,500
  const expectedSubsidy = 78000;
  
  assert.strictEqual(result.totalCostBeforeSubsidy, expectedBaseCost);
  assert.strictEqual(result.subsidyAmountRs, expectedSubsidy);
  assert.strictEqual(result.totalEstimateCostRs, expectedBaseCost - expectedSubsidy);
})();

console.log("✅ Pricing engine PM Surya Ghar marginal subsidy tests passed.");

// ─── Phase 3 — Hybrid / On-Grid pricing parity ───────────────────────────────
//
// Hybrid used to return no totalCostBeforeSubsidy and no subsidyAmountRs at all,
// which is why the estimate card could not draw the Base Cost / Estimated
// Subsidy / Final breakdown on a Hybrid quote — two of its three numbers were
// missing from the payload. These lock the shape in.

console.log("Running Hybrid pricing parity tests...");

(function testHybridReportsSubsidyBreakdown() {
  const calc: InternalCalculationResult = {
    productType: "HYBRID",
    solarCapacityKw: 3,
    requiredBatteryCount: 2,
    batteryType: "V51_2_AH100",
  };
  const result = calculatePrice(calc);

  assert.notStrictEqual(
    result.totalCostBeforeSubsidy,
    undefined,
    "Hybrid must report a base cost, or the estimate card cannot show the breakdown"
  );
  assert.notStrictEqual(
    result.subsidyAmountRs,
    undefined,
    "Hybrid must report a subsidy amount, or the estimate card cannot show the breakdown"
  );

  // 3 kW sits exactly on the PM Surya Ghar cap: 2 × 30,000 + 1 × 18,000 = 78,000.
  assert.strictEqual(result.subsidyAmountRs, 78000);
  approxEqual(
    result.totalEstimateCostRs,
    result.totalCostBeforeSubsidy! - result.subsidyAmountRs!,
    0.01
  );

  console.log("  ✓ Hybrid reports base cost + subsidy, and final = base − subsidy");
})();

(function testHybridSubsidyNeverPaysForTheBattery() {
  /* The battery is excluded from the subsidy, and the only case where that can
     actually bite is a small system carrying a large battery bank: the capacity
     slab could otherwise exceed the entire non-battery cost and start
     discounting the batteries. 20 batteries at ₹66,240 is far past anything
     real — the point is that the clamp holds at the extreme. */
  const calc: InternalCalculationResult = {
    productType: "HYBRID",
    solarCapacityKw: 3,
    requiredBatteryCount: 20,
    batteryType: "V51_2_AH100",
  };
  const result = calculatePrice(calc);

  const batteryCost = 20 * 66240;
  const nonBatteryCost = result.totalCostBeforeSubsidy! - batteryCost;

  assert.ok(
    result.subsidyAmountRs! <= nonBatteryCost + 0.01,
    `Subsidy ${result.subsidyAmountRs} must not exceed non-battery cost ${nonBatteryCost}`
  );
  assert.ok(result.totalEstimateCostRs >= 0, "Final estimate must never go negative");

  console.log("  ✓ Subsidy is clamped to the non-battery cost");
})();

(function testHybridSubsidyScalesWithCapacityNotCost() {
  // The scheme pays per kW, so a 1 kW hybrid gets exactly the 1 kW slab.
  const oneKw = calculatePrice({
    productType: "HYBRID",
    solarCapacityKw: 1,
    requiredBatteryCount: 2,
    batteryType: "V51_2_AH100",
  });
  assert.strictEqual(oneKw.subsidyAmountRs, 30000);

  // And a 5 kW hybrid is capped at the same ₹78,000 an On-Grid 5 kW gets.
  const fiveKw = calculatePrice({
    productType: "HYBRID",
    solarCapacityKw: 5,
    requiredBatteryCount: 2,
    batteryType: "V51_2_AH100",
  });
  assert.strictEqual(fiveKw.subsidyAmountRs, 78000);

  console.log("  ✓ Subsidy follows capacity slabs, identical to On-Grid");
})();

console.log("✅ Hybrid pricing parity tests passed.");

// ─── Phase 4 — ROI Calculator Tests ──────────────────────────────────────────

import { calculateRoi } from "../../services/roiCalculator.service";

console.log("Running ROI Calculator Tests...");

// Doc 3 §11 Worked Example: Peak=10000, Bottom=2000, 3-Phase
//   averageLightBillRs = 6600, totalUnitsConsumed = 1100, capacityKw = 8.148
(function testRoiWorkedExample() {
  const totalUnitsConsumed = 1100;
  const averageLightBillRs = 6600;
  const capacityKw = 8.148;

  const roi = calculateRoi(totalUnitsConsumed, averageLightBillRs, capacityKw);
  assert.ok(roi !== null, "ROI should not be null for valid inputs");

  // annualUnitsConsumed = 1100 × 12 = 13200
  // currentYearlyBill = 6600 × 12 = 79200
  // annualSolarGeneration = 8.148 × 4.5 × 365 = 13383.09
  // rawOffset = 13383.09 / 13200 = 1.01387 → capped at 0.95
  // newYearlyBill = 79200 × (1 - 0.95) = 3960
  // annualSavings = 79200 - 3960 = 75240
  // savingsPct = 95
  approxEqual(roi!.currentYearlyBillRs, 79200, 0.01);
  approxEqual(roi!.newYearlyBillRs, 3960, 0.01);
  approxEqual(roi!.annualSavingsRs, 75240, 0.01);
  approxEqual(roi!.savingsPct, 95, 0.01);
  
  console.log("  ✓ Worked example (3-phase, high offset → capped at 95%)");
})();

// Low capacity case — should NOT hit the 95% cap
(function testRoiLowCapacity() {
  const totalUnitsConsumed = 1100;
  const averageLightBillRs = 6600;
  const capacityKw = 2; // small system

  const roi = calculateRoi(totalUnitsConsumed, averageLightBillRs, capacityKw);
  assert.ok(roi !== null, "ROI should not be null for valid inputs");

  // annualSolarGeneration = 2 × 4.5 × 365 = 3285
  // rawOffset = 3285 / 13200 = 0.24886
  // savingsPct = ~24.9
  assert.ok(roi!.savingsPct < 95, "Low capacity should NOT be capped at 95%");
  assert.ok(roi!.savingsPct > 20, "Low capacity should still have some savings");
  approxEqual(roi!.currentYearlyBillRs, 79200, 0.01);
  assert.ok(roi!.annualSavingsRs > 0, "Should have positive savings");
  assert.ok(roi!.newYearlyBillRs > 0, "Should still have a positive new bill");
  
  console.log("  ✓ Low capacity (no cap, partial offset)");
})();

// Guard: zero units should return null
(function testRoiNullGuard() {
  const roi1 = calculateRoi(0, 6600, 8);
  assert.strictEqual(roi1, null, "Should return null for 0 units consumed");

  const roi2 = calculateRoi(1100, 0, 8);
  assert.strictEqual(roi2, null, "Should return null for 0 average bill");

  const roi3 = calculateRoi(1100, 6600, 0);
  assert.strictEqual(roi3, null, "Should return null for 0 capacity");
  
  console.log("  ✓ Null guards (0 values return null)");
})();

console.log("✅ ROI calculator tests passed.");

// ─── Phase 3 — Hybrid consumption baseline (Module D) ────────────────────────
//
// The Hybrid form never asks for a bill, so there was no consumption baseline,
// so calculateRoi had nothing to work from, so a Hybrid quote carried no `roi`
// and the savings card + EMI handoff never rendered. Module D closes that by
// running Module C's chain backwards from the sized capacity.

import { deriveHybridConsumption } from "../modules/hybridConsumption.module";
import { calculateOnGrid } from "../modules/onGrid.module";

console.log("Running Hybrid consumption baseline tests...");

(function testDerivationInvertsModuleCExactly() {
  /* Doc 3 §11's own worked example, run forwards through Module C and then
     backwards through Module D. If these two ever stop agreeing, a Hybrid quote
     and an On-Grid quote for the same system size have started telling the
     customer different things — which they can compare in one sitting. */
  const onGrid = calculateOnGrid({ peak: 10000, bottom: 2000, phase: "3_PHASE" });
  approxEqual(onGrid.averageLightBillRs, 6600, 0.01);
  approxEqual(onGrid.totalUnitsConsumed, 1100, 0.01);

  const derived = deriveHybridConsumption(onGrid.finalSolarCapacityKw);
  assert.ok(derived !== null, "A positive capacity must produce a baseline");
  approxEqual(derived!.totalUnitsConsumed, onGrid.totalUnitsConsumed, 0.01);
  approxEqual(derived!.averageLightBillRs, onGrid.averageLightBillRs, 0.01);

  console.log("  ✓ Round-trips Module C's worked example exactly");
})();

(function testDerivationFeedsRoi() {
  // 5 kW hybrid — the baseline must produce a usable ROI, which is the whole
  // reason the module exists.
  const derived = deriveHybridConsumption(5);
  assert.ok(derived !== null);

  const roi = calculateRoi(
    derived!.totalUnitsConsumed,
    derived!.averageLightBillRs,
    5
  );
  assert.ok(roi !== null, "Hybrid must produce an ROI, or there is no savings card");
  assert.ok(roi!.annualSavingsRs > 0, "Savings must be positive");
  assert.ok(roi!.currentYearlyBillRs > roi!.newYearlyBillRs, "The bill must go down");

  /* A system sized to its own load is correctly sized by construction, so it
     lands on the 95% cap — the same figure a correctly sized On-Grid system
     reaches, and the same one the site quotes everywhere. */
  approxEqual(roi!.savingsPct, 95, 0.01);

  console.log("  ✓ Baseline feeds calculateRoi and lands on the 95% cap");
})();

(function testDerivationGuards() {
  assert.strictEqual(deriveHybridConsumption(0), null, "0 kW must return null");
  assert.strictEqual(deriveHybridConsumption(-3), null, "negative kW must return null");
  assert.strictEqual(
    deriveHybridConsumption(Number.NaN),
    null,
    "NaN must return null rather than propagate"
  );

  console.log("  ✓ Guards return null rather than emitting nonsense");
})();

console.log("✅ Hybrid consumption baseline tests passed.");

// ─── Phase 3 — end-to-end response parity ────────────────────────────────────
//
// The frontend renders one shared panel gated on three response fields. This
// asserts a Hybrid request carries the same three an On-Grid request does,
// because that — not the JSX — was the actual difference.

import { generateQuotation } from "../../services/quotationService";

console.log("Running end-to-end response parity tests...");

/* generateQuotation is async as of the database migration (it awaits the
   durable lead write), so these two cases became async with it. Neither
   supplies a `lead`, so no database call is made and the suite still runs
   fully offline — but they must now be awaited in sequence rather than run as
   bare IIFEs, or an assertion failure would surface as an unhandled rejection
   after the success line had already printed. */

async function testResponseShapeParity() {
  const onGrid = await generateQuotation({
    productType: "ON_GRID",
    phase: "3_PHASE",
    lightBill: { peak: 10000, bottom: 2000 },
  });

  const hybrid = await generateQuotation({
    productType: "HYBRID",
    applications: [
      { applianceId: "AC", quantity: 1 },
      { applianceId: "FRIDGE_2DOOR", quantity: 1 },
      { applianceId: "FAN_REGULAR", quantity: 4 },
      { applianceId: "TUBE_LIGHT", quantity: 4 },
    ],
    backupHoursNight: 3,
  });

  for (const field of ["totalCostBeforeSubsidy", "subsidyAmount", "roi"] as const) {
    assert.notStrictEqual(
      onGrid[field],
      undefined,
      `On-Grid response must carry ${field}`
    );
    assert.notStrictEqual(
      hybrid[field],
      undefined,
      `Hybrid response must carry ${field} — the panel is gated on it`
    );
  }

  // The savings card's handoff link is built from these two, so a missing or
  // zero value there is a dead EMI button rather than a cosmetic gap.
  assert.ok(hybrid.roi!.currentYearlyBillRs > 0, "Hybrid ROI needs a current bill");
  assert.ok(hybrid.roi!.annualSavingsRs > 0, "Hybrid ROI needs positive savings");
  assert.ok(hybrid.estimateCost > 0, "Hybrid estimate must be positive");

  assert.strictEqual(
    hybrid.estimateCost,
    Math.round(hybrid.totalCostBeforeSubsidy! - hybrid.subsidyAmount!),
    "Hybrid final must equal base − subsidy, as On-Grid's does"
  );

  console.log("  ✓ Hybrid and On-Grid responses carry the same panel fields");
}

async function testEngineConstantsStayInternal() {
  /* Module D reads three protected constants. Nothing it produces may leak
     them, and the derived bill/units are intermediates rather than outputs —
     the response must carry only the safe totals it always did. */
  const hybrid = await generateQuotation({
    productType: "HYBRID",
    applications: [{ applianceId: "AC", quantity: 1 }],
    backupHoursNight: 3,
  });

  const allowed = new Set([
    "requestId",
    "productType",
    "estimateCost",
    "currency",
    "disclaimerNote",
    "totalCostBeforeSubsidy",
    "subsidyAmount",
    "roi",
  ]);
  for (const key of Object.keys(hybrid)) {
    assert.ok(allowed.has(key), `Unexpected key leaked into the response: ${key}`);
  }

  const roiKeys = Object.keys(hybrid.roi!).sort();
  assert.deepStrictEqual(roiKeys, [
    "annualSavingsRs",
    "currentYearlyBillRs",
    "newYearlyBillRs",
    "savingsPct",
  ]);

  console.log("  ✓ No engine constants or intermediates leak into the response");
}

/* Explicit non-zero exit on failure: this file is the last link in the `&&`
   chain in package.json's test script, so a silently-swallowed rejection here
   would report a green suite. */
(async function runEndToEndTests() {
  await testResponseShapeParity();
  await testEngineConstantsStayInternal();
  console.log("✅ End-to-end response parity tests passed.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
