/**
 * config/applianceConstants.ts
 *
 * Source: Document 3 — Calculation Engine Specification, §9 (Appliance Reference Database)
 *         Document 1, Appendix A (Application Load Constants)
 *
 * BACKEND-ONLY. This mapping is explicitly classified as a "Backend-Only Calculation"
 * input in Document 3 §17 ("Wattage mapping"). It must NEVER be imported by, bundled
 * into, or serialized to the frontend. The frontend only ever sends an `applianceId`;
 * this file is the only place that resolves it to a wattage value.
 *
 * Do not alter the original values — they are fixed business constants, not tunable defaults.
 *
 * --- NEW APPLIANCES (Task A8) ---
 * The business requested adding these appliances but said "do the research yourself."
 * The six values below are RESEARCHED TYPICAL VALUES, not business-confirmed exact figures.
 * Each is annotated individually. Replace with business-supplied numbers if they differ.
 */

export type ApplianceId =
  | "AC"
  | "OVEN"
  | "FRIDGE_2DOOR"
  | "FRIDGE_1DOOR"
  | "TV"
  | "WIFI"
  | "CCTV_4"
  | "CCTV_8"
  | "CCTV_16"
  | "FAN_REGULAR"
  | "FAN_BLDC"
  | "TUBE_LIGHT"
  | "CEILING_LIGHT"
  | "PC"
  | "LAPTOP"
  // --- A8: New appliances (researched typical values, not business-confirmed) ---
  | "AIR_PURIFIER"
  | "WATER_PURIFIER"
  | "WASHING_MACHINE"
  | "MICROWAVE"
  | "IRON"
  | "MIXER_GRINDER";

/** Standard wattage per appliance, in Watts (W). Doc 3 §9 / Doc 1 Appendix A. */
export const APPLIANCE_WATTAGE: Record<ApplianceId, number> = {
  AC: 2200,
  OVEN: 1800,
  FRIDGE_2DOOR: 600,
  FRIDGE_1DOOR: 400,
  TV: 200,
  WIFI: 50,
  CCTV_4: 50,
  CCTV_8: 100,
  CCTV_16: 200,
  FAN_REGULAR: 70,
  FAN_BLDC: 45,
  TUBE_LIGHT: 22,
  CEILING_LIGHT: 9,
  PC: 300,
  LAPTOP: 70,

  // --- A8: RESEARCHED TYPICAL VALUES — CONFIRM WITH BUSINESS ---
  // Business explicitly said "do the research yourself" for these. Wattages are
  // typical mid-range values from standard Indian household appliance specs.
  // Replace any figure the business disputes — these are not certified business data.
  AIR_PURIFIER: 50,       // Typical HEPA air purifier (50–80W); using lower-bound.
  WATER_PURIFIER: 60,     // RO+UV purifier motor+UV lamp combined draw.
  WASHING_MACHINE: 500,   // Semi-automatic or basic fully-automatic; top-load typical.
  MICROWAVE: 1200,        // Standard 20–25L microwave (input power, not output).
  IRON: 1000,             // Dry/steam iron mid-range. Some go to 1200W — 1000W is conservative.
  MIXER_GRINDER: 500,     // 500W motor is the most common household mixer-grinder rating.
};

/** Type guard used by the validator before any wattage lookup. */
export function isValidApplianceId(id: string): id is ApplianceId {
  return Object.prototype.hasOwnProperty.call(APPLIANCE_WATTAGE, id);
}
