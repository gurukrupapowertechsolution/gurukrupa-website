/**
 * services/roiCalculator.service.ts
 *
 * Phase 4 — Derives read-only ROI / Savings estimates from the same engine
 * constants and calculated capacity already used to produce the On-Grid quote.
 *
 * CONFIRMED APPROACH: every ROI figure is computed LIVE — nothing is hardcoded.
 * The ROI panel renders directly beneath the estimate and must never contradict it.
 *
 * Formulas (all inputs come from the On-Grid calculation module):
 *   annualUnitsConsumed   = totalUnitsConsumed × 12
 *   currentYearlyBillRs   = averageLightBillRs × 12
 *   annualSolarGeneration = capacityKw × SOLAR_GENERATION_PER_KW × 365
 *   rawOffset             = annualSolarGeneration / annualUnitsConsumed
 *   offsetPct             = min(rawOffset, 0.95)
 *                           ⚠ Capped at 95%. Never claim 100% offset.
 *   newYearlyBillRs       = currentYearlyBillRs × (1 − offsetPct)
 *   annualSavingsRs       = currentYearlyBillRs − newYearlyBillRs
 *   savingsPct            = offsetPct × 100
 *
 * Guard: if annualUnitsConsumed is 0 or would produce NaN/Infinity → return null.
 *
 * ⚠ SECURITY: Do NOT expose SOLAR_GENERATION_PER_KW, COST_PER_UNIT_RS, capacityKw,
 *   or annualSolarGeneration in the returned object. Only safe, derived totals.
 *
 * EXPLICITLY OUT OF SCOPE — DO NOT INVENT:
 *   Payback-period, IRR, ROI percentage, panel-degradation curves, or 25-year
 *   cumulative savings. Those require financing terms, degradation rates, and
 *   tariff-escalation assumptions the business has not supplied.
 *   TODO: Add payback-period and cumulative savings when business supplies
 *   financing terms, degradation rates, and tariff escalation assumptions.
 */

import { CALCULATION_CONSTANTS } from "../config/calculationConstants";

export interface RoiResult {
  currentYearlyBillRs: number;
  newYearlyBillRs: number;
  annualSavingsRs: number;
  savingsPct: number;
}

/**
 * Calculates the ROI / annual savings estimate for an On-Grid system.
 *
 * @param totalUnitsConsumed  — from On-Grid module (monthly units consumed)
 * @param averageLightBillRs  — from On-Grid module (monthly averaged bill)
 * @param capacityKw          — the final solar capacity from the On-Grid module
 * @returns RoiResult or null if inputs would produce nonsense figures
 */
export function calculateRoi(
  totalUnitsConsumed: number,
  averageLightBillRs: number,
  capacityKw: number
): RoiResult | null {
  // Guard: prevent division by zero and NaN propagation
  if (
    !totalUnitsConsumed ||
    totalUnitsConsumed <= 0 ||
    !averageLightBillRs ||
    averageLightBillRs <= 0 ||
    !capacityKw ||
    capacityKw <= 0
  ) {
    return null;
  }

  const annualUnitsConsumed = totalUnitsConsumed * 12;
  const currentYearlyBillRs = averageLightBillRs * 12;
  const annualSolarGeneration =
    capacityKw * CALCULATION_CONSTANTS.SOLAR_GENERATION_PER_KW * 365;

  const rawOffset = annualSolarGeneration / annualUnitsConsumed;

  // ⚠ Cap at 95%. Never claim 100% offset — it is not achievable in practice.
  const offsetPct = Math.min(rawOffset, 0.95);

  const newYearlyBillRs = currentYearlyBillRs * (1 - offsetPct);
  const annualSavingsRs = currentYearlyBillRs - newYearlyBillRs;
  const savingsPct = offsetPct * 100;

  // Final NaN/Infinity guard
  if (
    !Number.isFinite(currentYearlyBillRs) ||
    !Number.isFinite(newYearlyBillRs) ||
    !Number.isFinite(annualSavingsRs) ||
    !Number.isFinite(savingsPct)
  ) {
    return null;
  }

  return {
    currentYearlyBillRs,
    newYearlyBillRs,
    annualSavingsRs,
    savingsPct,
  };
}
