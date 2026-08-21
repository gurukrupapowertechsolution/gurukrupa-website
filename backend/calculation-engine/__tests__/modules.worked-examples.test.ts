/**
 * calculation-engine/__tests__/modules.worked-examples.test.ts
 *
 * Per Document 5 §19 (Testing Strategy): "Feed the engine the exact
 * 'Worked Examples' provided in Document 3." This suite exists to make
 * any future change to constants or formulas fail loudly if it drifts
 * from the documented business math.
 *
 * Framework-agnostic assertions are used (plain `assert`) so this file
 * can be run under Jest, Vitest, or Node's built-in test runner with
 * minimal adaptation.
 */

import assert from "node:assert";
import { calculateHybridNightBackup } from "../modules/hybridNightBackup.module";
import { calculateHybridDayBackup } from "../modules/hybridDayBackup.module";
import { calculateOnGrid } from "../modules/onGrid.module";

function approxEqual(actual: number, expected: number, tolerance = 0.01) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ~${expected}, got ${actual} (tolerance ${tolerance})`
  );
}

/* -------------------------------------------------------------
   MODULE A — Doc 3 §11 Worked Example
   AC(2200) + Fridge(600) + 4×Fan(70=280) + 4×Tube(22=88) = 3168W
   3 hrs => 9504 wh => 9.504 kwh
   51.2V/100Ah => 4608 wh = 4.608 kwh/battery => 2 batteries required
------------------------------------------------------------- */
(function testModuleA() {
  const result = calculateHybridNightBackup({
    applications: [
      { applianceId: "AC", quantity: 1 },
      { applianceId: "FRIDGE_2DOOR", quantity: 1 },
      { applianceId: "FAN_REGULAR", quantity: 4 },
      { applianceId: "TUBE_LIGHT", quantity: 4 },
    ],
    backupHoursNight: 3,
    battery: { voltage: 51.2, ah: 100, typeId: "V51_2_AH100" },
  });

  assert.strictEqual(result.totalConnectedLoadW, 3168, "Total load should equal 3168W");
  approxEqual(result.consumptionWh, 9504, 1);
  approxEqual(result.totalConsumptionKwh, 9.504, 0.001);
  approxEqual(result.batteryCapacityWh, 4608, 1);
  approxEqual(result.batteryCapacityKwh, 4.608, 0.001);
  assert.strictEqual(result.requiredBatteryCount, 2, "Should require 2 batteries");

  console.log("✅ Module A worked example passed.");
})();

/* -------------------------------------------------------------
   MODULE B — Doc 3 §11 Worked Example
   Solar capacity 3.24 kW × 0.8 = 2.5 kW running load (max)
------------------------------------------------------------- */
(function testModuleB() {
  const result = calculateHybridDayBackup({ solarCapacityKw: 3.24 });
  approxEqual(result.dayRunningLoadMaxKw, 2.592, 0.001);
  // Note: Doc 3's own worked example rounds 3.24 × 0.8 to "2.5 KW" in prose;
  // the precise arithmetic result is 2.592 kW. This test asserts the exact
  // formula output rather than the document's rounded narrative figure.
  console.log("✅ Module B worked example passed (formula preserved exactly; Doc 3 prose rounds to ~2.5kW).");
})();

/* -------------------------------------------------------------
   MODULE C — Doc 3 §11 Worked Example
   Peak=10000, Bottom=2000
   Average = 6000 + 10% = 6600
   Units = 6600 / 6 = 1100
   Base Capacity = 1100 / 4.5 = 244.44
   3 Phase: 244.44 / 30 = 8.14
   1 Phase: 244.44 / 60 = 4.07 (+15%)
------------------------------------------------------------- */
(function testModuleC() {
  const threePhase = calculateOnGrid({ peak: 10000, bottom: 2000, phase: "3_PHASE" });
  approxEqual(threePhase.averageLightBillRs, 6600, 0.01);
  approxEqual(threePhase.totalUnitsConsumed, 1100, 0.01);
  approxEqual(threePhase.baseSolarCapacityKw, 244.44, 0.01);
  approxEqual(threePhase.finalSolarCapacityKw, 8.148, 0.01);

  const onePhase = calculateOnGrid({ peak: 10000, bottom: 2000, phase: "1_PHASE" });
  approxEqual(onePhase.baseSolarCapacityKw, 244.44, 0.01);
  const expectedPreFactor = 244.44 / 60; // 4.074
  approxEqual(expectedPreFactor, 4.074, 0.01);
  approxEqual(onePhase.finalSolarCapacityKw, expectedPreFactor * 1.15, 0.01);

  console.log("✅ Module C worked example passed (3-phase and 1-phase branches).");
})();

console.log("All Document 3 worked-example tests passed.");
