/**
 * calculation-engine/modules/hybridDayBackup.module.ts
 *
 * MODULE B — Hybrid Backup Calculator (Day Time / Sun hours)
 * Source: Document 3 §11, "Module B: Hybrid Backup Calculator (Day Time)".
 *
 * Formula preserved EXACTLY as documented:
 *   Running Load (max) = Solar Capacity × 0.8   [Solar Capacity Power Factor]
 *
 * Worked example validated by this module (Doc 3 §11):
 *   Solar capacity = 3.24 kW  =>  3.24 × 0.8 = 2.5 kW running load (max)
 *
 * NOTE — Purpose of this module is VALIDATION, not sizing: Document 3 does
 * not provide a formula that derives required solar capacity from appliance
 * load for the Hybrid path. This module answers "given a candidate/selected
 * solar capacity, what is the maximum daytime running load it can support?"
 * It does not output a system capacity recommendation.
 */

import { CALCULATION_CONSTANTS } from "../../config/calculationConstants";

export interface HybridDayBackupInput {
  /** Candidate/selected hybrid system solar capacity, in kW. */
  solarCapacityKw: number;
}

export interface HybridDayBackupResult {
  solarCapacityKw: number;
  dayRunningLoadMaxKw: number;
}

export function calculateHybridDayBackup(input: HybridDayBackupInput): HybridDayBackupResult {
  // Running Load (max) = Solar capacity × 0.8 — Doc 3 §11
  const dayRunningLoadMaxKw = input.solarCapacityKw * CALCULATION_CONSTANTS.SOLAR_POWER_FACTOR;

  return {
    solarCapacityKw: input.solarCapacityKw,
    dayRunningLoadMaxKw,
  };
}
