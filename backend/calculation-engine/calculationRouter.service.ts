/**
 * calculation-engine/calculationRouter.service.ts
 *
 * Routes a validated QuotationRequest to the correct calculation module(s),
 * per Document 3 §10 (Calculation Modules) and §14 (Estimate Generation Flow).
 *
 * This service performs ROUTING ONLY. It contains no formulas itself —
 * all math lives in the individual modules under ./modules/.
 *
 * Updated: Build Finalization Pass — Tasks A9, A10.
 * A9: Added inferHybridSystemCapacityKw() — when hybridSystemCapacityKw is not
 *     supplied by the frontend, the system size is inferred from total appliance
 *     wattage using the sizing rule below.
 * A10: DEFAULT_BATTERY_TYPE confirmed as V51_2_AH100 (51.2V/100Ah).
 */

import { QuotationRequest, InternalCalculationResult } from "../types/quotation.types";
import { BATTERY_RATES_RS, BatteryTypeId } from "../config/priceListConfig";
import { AppError } from "../errors/AppError";
import { calculateHybridNightBackup } from "./modules/hybridNightBackup.module";
import { calculateHybridDayBackup } from "./modules/hybridDayBackup.module";
import { deriveHybridConsumption } from "./modules/hybridConsumption.module";
import { calculateOnGrid } from "./modules/onGrid.module";
import { APPLIANCE_WATTAGE, isValidApplianceId } from "../config/applianceConstants";

/** Voltage/Ah pairs corresponding to each documented battery type (Doc 3 §12). */
const BATTERY_SPECS: Record<BatteryTypeId, { voltage: number; ah: number }> = {
  V51_2_AH100: { voltage: 51.2, ah: 100 },
  V25_2_AH100: { voltage: 25.2, ah: 100 },
};

/**
 * A10: Default battery type — 51.2V/100Ah (confirmed as the standard default
 * for all Hybrid quotes that don't specify a battery preference).
 */
const DEFAULT_BATTERY_TYPE: BatteryTypeId = "V51_2_AH100";

/**
 * A9 — Hybrid Solar Sizing Rule.
 *
 * ⚠ ASSUMPTION — CONFIRM WITH BUSINESS: This rule was provided as an example
 * answer and may not be an independently verified business rule.
 * Confirm with business this is correct, not an accidentally-accepted example.
 *
 * Rule: sum all appliance wattages. Map to system capacity:
 *   < 3000W  → 3 kW
 *   3000W–5000W → 5 kW
 *   > 5000W but ≤ 7500W → 7.5 kW
 *   > 7500W → 10 kW
 * Always rounds UP to the next available size from [3, 5, 7.5, 10 kW].
 * These are the IP67 series capacities from Document 2.
 */
const HYBRID_CAPACITY_STEPS_KW = [3, 5, 7.5, 10] as const;

function inferHybridSystemCapacityKw(applications: QuotationRequest["applications"]): number {
  if (!applications || applications.length === 0) return HYBRID_CAPACITY_STEPS_KW[0];

  // Sum total connected load in watts.
  const totalWatts = applications.reduce((sum, entry) => {
    if (!isValidApplianceId(entry.applianceId)) return sum;
    return sum + APPLIANCE_WATTAGE[entry.applianceId] * (entry.quantity || 0);
  }, 0);

  // ⚠ ASSUMPTION — CONFIRM WITH BUSINESS (see function header above).
  for (const step of HYBRID_CAPACITY_STEPS_KW) {
    if (totalWatts <= step * 1000) return step;
  }
  // Exceeds 10kW range: cap at 10kW (the largest listed Hybrid capacity).
  return HYBRID_CAPACITY_STEPS_KW[HYBRID_CAPACITY_STEPS_KW.length - 1];
}

export function routeCalculation(request: QuotationRequest): InternalCalculationResult {
  switch (request.productType) {
    case "ON_GRID":
      return calculateOnGridPath(request);

    case "HYBRID":
      return calculateHybridPath(request);

    case "OFF_GRID":
      // Doc 5 §22: "The Off Grid column exists in the UI, but calculation
      // logic for it is entirely omitted for now." No module exists to
      // route to — fail loudly and explicitly rather than guessing.
      throw new AppError(
        "OFF_GRID_NOT_SUPPORTED",
        "Off-Grid quotation calculations are not yet available."
      );

    default:
      throw new AppError("UNSUPPORTED_PRODUCT_TYPE", "Unrecognized product type for calculation routing.");
  }
}

function calculateOnGridPath(request: QuotationRequest): InternalCalculationResult {
  if (!request.phase || !request.lightBill) {
    throw new AppError("MISSING_ON_GRID_FIELDS", "phase and lightBill are required for On-Grid calculations.");
  }

  const result = calculateOnGrid({
    peak: request.lightBill.peak,
    bottom: request.lightBill.bottom,
    phase: request.phase,
  });

  return {
    productType: "ON_GRID",
    solarCapacityKw: result.finalSolarCapacityKw,
    // Phase 4 — thread intermediates for ROI calculation
    totalUnitsConsumed: result.totalUnitsConsumed,
    averageLightBillRs: result.averageLightBillRs,
  };
}

function calculateHybridPath(request: QuotationRequest): InternalCalculationResult {
  if (!request.applications || request.applications.length === 0) {
    throw new AppError("MISSING_HYBRID_APPLICATIONS", "applications are required for Hybrid calculations.");
  }

  const batteryTypeId = request.batteryType ?? DEFAULT_BATTERY_TYPE;
  const batterySpec = BATTERY_SPECS[batteryTypeId];

  let requiredBatteryCount: number | undefined;
  let totalConnectedLoadW: number | undefined;
  let totalConsumptionKwh: number | undefined;

  // Module A — only runs if a night-time backup requirement was supplied.
  if (request.backupHoursNight && request.backupHoursNight > 0) {
    const nightResult = calculateHybridNightBackup({
      applications: request.applications,
      backupHoursNight: request.backupHoursNight,
      battery: { voltage: batterySpec.voltage, ah: batterySpec.ah, typeId: batteryTypeId },
    });
    requiredBatteryCount = nightResult.requiredBatteryCount;
    totalConnectedLoadW = nightResult.totalConnectedLoadW;
    totalConsumptionKwh = nightResult.totalConsumptionKwh;
  }

  // A9: If no hybridSystemCapacityKw was supplied by the frontend, infer it
  // from the appliance load using the sizing rule above.
  // ⚠ ASSUMPTION — CONFIRM WITH BUSINESS: See inferHybridSystemCapacityKw above.
  const resolvedCapacityKw =
    request.hybridSystemCapacityKw ?? inferHybridSystemCapacityKw(request.applications);

  // Module B — runs as a validation check using the resolved capacity.
  const dayResult = calculateHybridDayBackup({ solarCapacityKw: resolvedCapacityKw });
  const dayRunningLoadMaxKw = dayResult.dayRunningLoadMaxKw;

  /* Module D — consumption baseline for ROI (Phase 3).
     The Hybrid form never asks for a bill, so this derives the monthly
     consumption implied by the capacity the system was just sized to, using
     Module C's own constants run backwards. See the module header for the
     derivation and for why it cannot disagree with an On-Grid quote.

     Threaded onto the same two fields the On-Grid path populates, so
     sanitizeForClient does not have to know which product type it is looking
     at — that branch is exactly what caused the parity gap this closes. */
  const consumption = deriveHybridConsumption(resolvedCapacityKw);

  return {
    productType: "HYBRID",
    solarCapacityKw: resolvedCapacityKw,
    requiredBatteryCount,
    batteryType: batteryTypeId,
    totalConnectedLoadW,
    totalConsumptionKwh,
    dayRunningLoadMaxKw,
    totalUnitsConsumed: consumption?.totalUnitsConsumed,
    averageLightBillRs: consumption?.averageLightBillRs,
  };
}

export { BATTERY_RATES_RS };
