/**
 * calculation-engine/modules/hybridConsumption.module.ts
 *
 * MODULE D — Hybrid Consumption Baseline (Phase 3)
 *
 * WHY THIS EXISTS
 * ---------------
 * The ROI figures on a quotation are savings against a bill, and savings need a
 * bill to be measured against. The On-Grid path is asked for one directly
 * (peak / bottom) and Module C converts it into units. The Hybrid path is never
 * asked for a bill at all — it collects appliances and backup hours — so there
 * was no consumption baseline, and consequently no ROI, and consequently no
 * savings panel and no handoff to the EMI calculator on a Hybrid quote.
 *
 * That was the whole of the Hybrid/On-Grid parity gap on the ROI side. This
 * module closes it without asking the customer for anything new.
 *
 * THE DERIVATION
 * --------------
 * Module C's On-Grid chain runs bill → units → capacity:
 *
 *   units    = averageLightBillRs / COST_PER_UNIT_RS
 *   baseCap  = units / SOLAR_GENERATION_PER_KW
 *   capacity = baseCap / billingDurationDays          (3-phase, 30 days)
 *
 * A Hybrid quote already knows its capacity — it is sized from the appliance
 * load by the router's sizing rule. So this runs the SAME chain backwards:
 *
 *   units = capacityKw × SOLAR_GENERATION_PER_KW × THREE_PHASE_DURATION_DAYS
 *   bill  = units × COST_PER_UNIT_RS
 *
 * Checked against Doc 3 §11's own worked example, which is the point of doing
 * it this way rather than inventing a model: peak 10000 / bottom 2000 / 3-phase
 * gives averageLightBillRs 6600, units 1100, capacity 8.148 kW. Feeding 8.148
 * back through the two lines above returns 1100 units and ₹6,600 exactly.
 *
 * WHAT THIS DOES AND DOES NOT CLAIM
 * ---------------------------------
 * It is not a measurement of the customer's actual bill — we did not ask for
 * one on this path. It is "the monthly consumption a household this system was
 * sized for would have", expressed in the company's own sizing constants.
 *
 * That framing is what makes it safe. No new constant is introduced here: the
 * only three values used are COST_PER_UNIT_RS, SOLAR_GENERATION_PER_KW and
 * THREE_PHASE_DURATION_DAYS, all already governing every On-Grid quote. So a
 * Hybrid ROI and an On-Grid ROI for the same system size cannot contradict each
 * other — which is the failure mode that matters, because a customer can run
 * both on this site in the same sitting.
 *
 * 30 days, not 60: this is a monthly consumption figure, and the ROI service
 * multiplies by 12 to reach annual. The 1-phase 60-day duration in Module C is
 * a property of how a 1-phase customer is BILLED (two-monthly), not of how much
 * they use, so it has no business in a derivation that has no bill to read.
 *
 * ⚠ Every value here is BACKEND-ONLY, exactly as Module C's intermediates are.
 *   Neither the units figure nor the derived bill is ever serialized: they exist
 *   only to feed services/roiCalculator.service.ts, which returns safe totals.
 */

import { CALCULATION_CONSTANTS } from "../../config/calculationConstants";

export interface HybridConsumptionResult {
  /** Monthly units, the same basis Module C's totalUnitsConsumed carries. */
  totalUnitsConsumed: number;
  /** Monthly bill, the same basis Module C's averageLightBillRs carries. */
  averageLightBillRs: number;
}

/**
 * Derives the monthly consumption baseline implied by a Hybrid system's sized
 * capacity.
 *
 * @param solarCapacityKw — the resolved Hybrid capacity (router sizing rule)
 * @returns the baseline, or null when the capacity is missing or non-positive —
 *          the same "return null rather than emit nonsense" contract the ROI
 *          service uses, so a bad capacity produces no savings panel instead of
 *          a savings panel full of zeroes.
 */
export function deriveHybridConsumption(
  solarCapacityKw: number
): HybridConsumptionResult | null {
  if (!solarCapacityKw || solarCapacityKw <= 0 || !Number.isFinite(solarCapacityKw)) {
    return null;
  }

  const totalUnitsConsumed =
    solarCapacityKw *
    CALCULATION_CONSTANTS.SOLAR_GENERATION_PER_KW *
    CALCULATION_CONSTANTS.THREE_PHASE_DURATION_DAYS;

  const averageLightBillRs = totalUnitsConsumed * CALCULATION_CONSTANTS.COST_PER_UNIT_RS;

  if (!Number.isFinite(totalUnitsConsumed) || !Number.isFinite(averageLightBillRs)) {
    return null;
  }

  return { totalUnitsConsumed, averageLightBillRs };
}
