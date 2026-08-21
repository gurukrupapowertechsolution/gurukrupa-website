/**
 * config/calculationConstants.ts
 *
 * Source: Document 3 — Calculation Engine Specification, §8 (Fixed System Constants)
 *         and §12 (Hidden Variables).
 *
 * BACKEND-ONLY. These values must never appear in an API response, error message,
 * or log line reachable by the client. Every value below is env-overridable
 * (Phase 7 requirement) but FALLS BACK to the exact figure documented in Doc 3
 * if no environment variable is set — do not change the fallback numbers.
 */

import { getEnvNumber } from "./env";

export const CALCULATION_CONSTANTS = {
  /** Doc 3 §8 — Standard Cost per unit: 6 rupees. */
  COST_PER_UNIT_RS: getEnvNumber("CALC_COST_PER_UNIT_RS", 6),

  /** Doc 3 §8 — Average Light Bill Margin: +10%. Expressed as a multiplier add-on. */
  AVERAGE_BILL_MARGIN_PCT: getEnvNumber("CALC_AVERAGE_BILL_MARGIN_PCT", 0.10),

  /** Doc 3 §8 — Solar Generation Capacity Standard: 4.5 units/kw. */
  SOLAR_GENERATION_PER_KW: getEnvNumber("CALC_SOLAR_GENERATION_PER_KW", 4.5),

  /** Doc 3 §8 — 3 Phase Light Bill Duration: 1 month (30 days). */
  THREE_PHASE_DURATION_DAYS: getEnvNumber("CALC_THREE_PHASE_DURATION_DAYS", 30),

  /** Doc 3 §8 — 1 Phase Light Bill Duration: 2 months (60 days). */
  ONE_PHASE_DURATION_DAYS: getEnvNumber("CALC_ONE_PHASE_DURATION_DAYS", 60),

  /** Doc 3 §8 — 1 Phase Required Capacity Factor: +15%. */
  ONE_PHASE_CAPACITY_FACTOR_PCT: getEnvNumber("CALC_ONE_PHASE_CAPACITY_FACTOR_PCT", 0.15),

  /** Doc 3 §8 / §11 Module A — Battery Power Factor: 0.9. */
  BATTERY_POWER_FACTOR: getEnvNumber("CALC_BATTERY_POWER_FACTOR", 0.9),

  /** Doc 3 §8 / §11 Module B — Solar Capacity Power Factor: 0.8. */
  SOLAR_POWER_FACTOR: getEnvNumber("CALC_SOLAR_POWER_FACTOR", 0.8),

  /** Doc 3 §11 — Kwh conversion rule: Kwh = 1000w * h  =>  wh -> kwh divisor. */
  WATT_HOURS_PER_KWH: 1000,
} as const;
