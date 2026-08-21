/**
 * calculation-engine/modules/onGrid.module.ts
 *
 * MODULE C — On-Grid Calculations
 * Source: Document 3 §11, "Module C: On-Grid Calculations".
 *
 * Formulas preserved EXACTLY as documented:
 *   Average Light Bill    = ((Peak + Bottom) / 2) + 10%
 *   Total Units Consumed  = Average Light Bill / Cost per unit (6 Rs)
 *   Base Capacity          = Total Units Consumed / Solar Generation Capacity (4.5)
 *   If 3 Phase (30 days):  Solar Capacity Required = Base Capacity / 30
 *   If 1 Phase (60 days):  Solar Capacity Required = (Base Capacity / 60) + 15%
 *
 * Worked example validated by this module (Doc 3 §11):
 *   Peak = 10000, Bottom = 2000
 *   Average = (10000+2000)/2 = 6000  =>  +10% = 6600
 *   Units = 6600 / 6 = 1100
 *   Base Capacity = 1100 / 4.5 = 244.44
 *   3 Phase: 244.44 / 30 = 8.14
 *   1 Phase: (244.44 / 60) = 4.07  =>  +15%
 */

import { CALCULATION_CONSTANTS } from "../../config/calculationConstants";
import { PhaseType } from "../../types/quotation.types";

export interface OnGridInput {
  peak: number;
  bottom: number;
  phase: PhaseType;
}

export interface OnGridResult {
  averageLightBillRs: number;
  totalUnitsConsumed: number;
  baseSolarCapacityKw: number;
  finalSolarCapacityKw: number;
  billingDurationDays: number;
}

export function calculateOnGrid(input: OnGridInput): OnGridResult {
  const { peak, bottom, phase } = input;

  // Average Light Bill = ((Peak + Bottom) / 2) + 10% — Doc 3 §11
  const rawAverage = (peak + bottom) / 2;
  const averageLightBillRs = rawAverage * (1 + CALCULATION_CONSTANTS.AVERAGE_BILL_MARGIN_PCT);

  // Total Units Consumed = Average Light Bill / Cost per unit (6 Rs) — Doc 3 §11
  const totalUnitsConsumed = averageLightBillRs / CALCULATION_CONSTANTS.COST_PER_UNIT_RS;

  // Base Capacity = Total Units Consumed / Solar Generation Capacity (4.5) — Doc 3 §11
  const baseSolarCapacityKw = totalUnitsConsumed / CALCULATION_CONSTANTS.SOLAR_GENERATION_PER_KW;

  let finalSolarCapacityKw: number;
  let billingDurationDays: number;

  if (phase === "3_PHASE") {
    // 3 Phase (30 days): Solar Capacity Required = Base Capacity / 30 — Doc 3 §11
    billingDurationDays = CALCULATION_CONSTANTS.THREE_PHASE_DURATION_DAYS;
    finalSolarCapacityKw = baseSolarCapacityKw / billingDurationDays;
  } else {
    // 1 Phase (60 days): Solar Capacity Required = (Base Capacity / 60) + 15% — Doc 3 §11
    billingDurationDays = CALCULATION_CONSTANTS.ONE_PHASE_DURATION_DAYS;
    const preFactorCapacity = baseSolarCapacityKw / billingDurationDays;
    finalSolarCapacityKw = preFactorCapacity * (1 + CALCULATION_CONSTANTS.ONE_PHASE_CAPACITY_FACTOR_PCT);
  }

  return {
    averageLightBillRs,
    totalUnitsConsumed,
    baseSolarCapacityKw,
    finalSolarCapacityKw,
    billingDurationDays,
  };
}
