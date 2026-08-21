/**
 * services/systemSizing.service.ts
 *
 * Phase 3 — Derives the recommended rooftop capacity (kW) from a customer's
 * average monthly electricity bill.
 *
 * ── The formula ───────────────────────────────────────────────────────────
 *
 * This is the standard industry sizing method for a grid-tied residential
 * rooftop array, and it is the same one this site already publishes in plain
 * language in the customer-facing FAQ ("take the monthly units from your PGVCL
 * bill, divide by 30 to get your daily consumption, then divide that by about
 * 4 to 4.5"). Three steps:
 *
 *   1. Bill → energy.  Money is not a unit of electricity, so the bill has to
 *      be converted to consumption before anything else can happen:
 *
 *          monthlyUnitsKwh = monthlyBillRs / COST_PER_UNIT_RS
 *
 *   2. Energy → daily demand.  Sizing is a daily-generation problem; billing is
 *      a monthly cycle. A 30-day month is the standard convention and matches
 *      THREE_PHASE_DURATION_DAYS in the engine constants:
 *
 *          dailyUnitsKwh = monthlyUnitsKwh / DAYS_PER_BILLING_MONTH
 *
 *   3. Daily demand → capacity.  The specific yield already folds in irradiance,
 *      module temperature derating, inverter and wiring losses, and the soiling
 *      typical of this region — it is a measured field figure, not a nameplate
 *      one, which is why there is no separate "performance ratio" term here:
 *
 *          requiredKw = dailyUnitsKwh / SOLAR_GENERATION_PER_KW
 *
 * Collapsed, and this is what the function actually computes:
 *
 *          requiredKw = monthlyBillRs
 *                       / (COST_PER_UNIT_RS × DAYS × SOLAR_GENERATION_PER_KW)
 *
 * ── Why the answer is rounded up to a half kW ─────────────────────────────
 *
 * Panels are sold in discrete wattages and inverters in discrete ratings, so a
 * 3.17 kW result is not a buildable system. Rounding to the nearest 0.5 kW
 * matches how capacity is actually quoted. Rounding UP rather than to-nearest is
 * deliberate: an undersized array is the failure mode that produces an unhappy
 * customer, because the 95% bill offset the ROI model promises is only achieved
 * when generation actually covers consumption. Erring high costs a little money;
 * erring low costs the customer the outcome they bought.
 *
 * ── What this is NOT ──────────────────────────────────────────────────────
 *
 * An indicative pre-sales figure, not a quotation. It ignores shadow-free roof
 * area, sanctioned load, phase, and the customer's actual appliance profile —
 * all four are real constraints and all four are handled by the full
 * Calculation Engine at /calculate. This exists so the EMI calculator can fill
 * in a sensible system size from the one number a visitor always knows.
 *
 * ── Exposure boundary ─────────────────────────────────────────────────────
 *
 * ⚠ config/calculationConstants.ts is BACKEND-ONLY: no constant may appear in an
 *   API response. This service therefore returns the derived capacity and
 *   NOTHING ELSE.
 *
 *   In particular it does not return monthlyUnitsKwh, even though that is the
 *   single most useful number for explaining the result to a customer. Given a
 *   known bill, returning it would make COST_PER_UNIT_RS exactly recoverable by
 *   division — which is the precise thing the constants file forbids. The
 *   returned kW leaks only the PRODUCT of the three constants, from which no
 *   individual value can be separated.
 */

import { CALCULATION_CONSTANTS } from "../config/calculationConstants";

/**
 * Days in a billing month for sizing purposes.
 *
 * Uses the 3-phase duration constant rather than a literal 30: that constant IS
 * the documented "1 month" billing period (Doc 3 §8), and hardcoding 30 beside
 * it would create a second source of truth that could silently drift.
 *
 * The 1-phase constant is deliberately NOT used here even though 1-phase bills
 * cover 60 days. This endpoint takes a MONTHLY bill — the customer is asked for
 * a monthly figure and normalises it themselves — so the period is always one
 * month regardless of the connection type they eventually turn out to have.
 */
const DAYS_PER_BILLING_MONTH = CALCULATION_CONSTANTS.THREE_PHASE_DURATION_DAYS;

/** Capacity is quoted in half-kW steps. See the rounding note above. */
const CAPACITY_STEP_KW = 0.5;

/**
 * Sanity bounds. A residential rooftop enquiry outside this range is either a
 * typo or a commercial project that needs a human, and in both cases returning
 * a confidently wrong number is worse than returning nothing.
 */
const MIN_RECOMMENDED_KW = 1;
const MAX_RECOMMENDED_KW = 100;

export interface SystemSizeResult {
  /** Recommended capacity in kW, rounded up to the nearest half kW. */
  recommendedSizeKw: number;
  /** True when the raw figure was clamped to MIN/MAX rather than computed. */
  clamped: boolean;
}

/**
 * Recommends a rooftop capacity for a given average monthly electricity bill.
 *
 * @param monthlyBillRs Average monthly electricity bill in rupees.
 * @returns The recommendation, or null when the input cannot produce a
 *          meaningful figure (non-finite, zero, or negative).
 */
export function calculateSystemSize(monthlyBillRs: number): SystemSizeResult | null {
  if (!Number.isFinite(monthlyBillRs) || monthlyBillRs <= 0) return null;

  const { COST_PER_UNIT_RS, SOLAR_GENERATION_PER_KW } = CALCULATION_CONSTANTS;

  // Guard the divisor rather than trusting the constants: all three are
  // env-overridable (see config/env.ts), so a bad deployment value must fail
  // closed with null instead of propagating Infinity into a customer-facing kW.
  const divisor = COST_PER_UNIT_RS * DAYS_PER_BILLING_MONTH * SOLAR_GENERATION_PER_KW;
  if (!Number.isFinite(divisor) || divisor <= 0) return null;

  const rawKw = monthlyBillRs / divisor;
  if (!Number.isFinite(rawKw) || rawKw <= 0) return null;

  const steppedKw = Math.ceil(rawKw / CAPACITY_STEP_KW) * CAPACITY_STEP_KW;

  const clampedKw = Math.min(Math.max(steppedKw, MIN_RECOMMENDED_KW), MAX_RECOMMENDED_KW);

  return {
    // Floating-point multiples of 0.5 are exact, but the clamp and the division
    // above can still surface a representation artefact (e.g. 3.5000000000000004),
    // so the result is normalised before it crosses the wire.
    recommendedSizeKw: Math.round(clampedKw * 10) / 10,
    clamped: clampedKw !== steppedKw,
  };
}
