/**
 * config/priceListConfig.ts
 *
 * Source: Document 3 — Calculation Engine Specification, §12 (Hidden Variables)
 *         and §13 (Pricing Engine).
 *         Updated: Build Finalization Pass — Tasks A3, A4, A5, A6, A7.
 *
 * BACKEND-ONLY. Defines STARTUP DEFAULTS for the price list, env-overridable.
 * At runtime, `config/runtimeConfigStore.ts` seeds itself from these values.
 *
 * --- CHANGE SUMMARY (Finalization Pass) ---
 * A3: HYBRID_INVERTER_RATES — lookup table replacing flat INVERTER_RATE_PLACEHOLDER_RS
 *     for Hybrid pricing. On-Grid inverter cost remains an unresolved placeholder.
 * A4: ON_GRID_TIER_PRICES — replaces STRUCTURE_RATE_PER_KW_RS × capacity for On-Grid.
 * A5: BASE_COST_MARKUP_PCT — 20% markup on Hybrid inverter tier + On-Grid tier price.
 * A6: GST_CORE_PCT / GST_OTHER_PCT — split GST rates (5% core, 18% wiring-only).
 * A7: HYBRID_WIRING_RATE_PER_KW_RS — ₹3,000/kW for Hybrid; On-Grid stays 0.
 */

import { getEnvNumber } from "./env";

export type BatteryTypeId = "V51_2_AH100" | "V25_2_AH100";

export const BATTERY_RATES_RS: Record<BatteryTypeId, number> = {
  /** Doc 3 §12 — 51.2V/100Ah battery rate. */
  V51_2_AH100: getEnvNumber("PRICE_BATTERY_RATE_51_2_AH100", 66240),
  /** Doc 3 §12 — 25.2V/100Ah battery rate. */
  V25_2_AH100: getEnvNumber("PRICE_BATTERY_RATE_25_2_AH100", 36940),
};

/**
 * Doc 3 §12 — Installation/Structure Rate: retained for admin-API compatibility
 * and for any future use, but On-Grid pricing now uses ON_GRID_TIER_PRICES (A4)
 * and Hybrid system cost is bundled into HYBRID_INVERTER_RATES (A3).
 */
export const STRUCTURE_RATE_PER_KW_RS = getEnvNumber("PRICE_STRUCTURE_RATE_PER_KW", 1200);

// =============================================================================
// A3 — HYBRID INVERTER / SYSTEM RATES
// ⚠ ASSUMPTION — CONFIRM WITH BUSINESS:
//   1. The business labeled this "Inverter Rates" but provided complete IP-series
//      system pricing. These are treated as the HYBRID INVERTER component rate.
//      Battery cost is separately calculated (count × battery rate) — it is NOT
//      folded into these numbers.
//   2. "IP65" in the source spreadsheet is treated as "IP67" — IP65 does not
//      appear elsewhere in the project spec; IP67 is the only matching series.
//   3. Unlisted capacities within a series round UP to the next listed tier.
//      No interpolation is performed — we have no formula for that.
// =============================================================================

export type HybridSeries = "IP21" | "IP67";
export type HybridPhase = "1_PHASE" | "3_PHASE";

export interface HybridInverterTier {
  series: HybridSeries;
  capacityKw: number;
  phase: HybridPhase;
  priceRs: number;
}

/**
 * ⚠ ASSUMPTION — CONFIRM WITH BUSINESS (see header note above).
 * Source: business spreadsheet "Inverter Rates" tab.
 */
export const HYBRID_INVERTER_TIERS: HybridInverterTier[] = [
  // IP 21 Series
  { series: "IP21", capacityKw: 3.5,  phase: "1_PHASE", priceRs: 33400 },
  { series: "IP21", capacityKw: 6.5,  phase: "3_PHASE", priceRs: 53000 },
  // IP 67 Series
  { series: "IP67", capacityKw: 3,    phase: "1_PHASE", priceRs: 74000  },
  { series: "IP67", capacityKw: 5,    phase: "1_PHASE", priceRs: 95000  },
  { series: "IP67", capacityKw: 6,    phase: "3_PHASE", priceRs: 145000 },
  { series: "IP67", capacityKw: 8,    phase: "3_PHASE", priceRs: 165000 },
  { series: "IP67", capacityKw: 10,   phase: "3_PHASE", priceRs: 185000 },
];

/**
 * Looks up the Hybrid inverter tier price for a given series + capacity.
 * Rounds UP to the next listed tier if the exact capacity isn't found.
 * Returns null if capacity exceeds all listed tiers for that series+phase.
 */
export function lookupHybridInverterTier(
  series: HybridSeries,
  capacityKw: number,
  phase: HybridPhase
): HybridInverterTier | null {
  const matching = HYBRID_INVERTER_TIERS.filter(
    (t) => t.series === series && t.phase === phase
  ).sort((a, b) => a.capacityKw - b.capacityKw);

  // Find first tier whose capacity >= requested capacity (round-up).
  return matching.find((t) => t.capacityKw >= capacityKw) ?? null;
}

// =============================================================================
// A4 — ON-GRID PRICING & SUBSIDY (Updated for Finalization Phase 3)
// ⚠ CONFIRMED WITH BUSINESS:
//   - On-Grid systems use a flat rate of ₹50,000/kW (GST-INCLUSIVE).
//   - There is a flat DISCOM charge of ₹1,500.
//   - PM Surya Ghar subsidy uses a marginal formula:
//       first 2 kW @ ₹30,000/kW
//       third 1 kW @ ₹18,000/kW
//       max cap    @ ₹78,000
// =============================================================================

/** ⚠ CONFIRMED WITH BUSINESS. Flat rate per kW (GST-inclusive). */
export const ONGRID_RATE_PER_KW_RS = getEnvNumber("PRICE_ONGRID_RATE_PER_KW", 50000);

/** ⚠ CONFIRMED WITH BUSINESS. Flat DISCOM charge. */
export const ONGRID_DISCOM_CHARGE_RS = getEnvNumber("PRICE_ONGRID_DISCOM_CHARGE", 1500);

/** PM Surya Ghar subsidy rate for the first 2 kW. */
export const SUBSIDY_FIRST_TIER_RATE_RS = getEnvNumber("SUBSIDY_FIRST_TIER_RATE", 30000);

/** PM Surya Ghar subsidy rate for the 3rd kW. */
export const SUBSIDY_SECOND_TIER_RATE_RS = getEnvNumber("SUBSIDY_SECOND_TIER_RATE", 18000);

/** PM Surya Ghar maximum subsidy cap. */
export const SUBSIDY_MAX_CAP_RS = getEnvNumber("SUBSIDY_MAX_CAP", 78000);

// =============================================================================
// A5 — BASE COST MARKUP
// ⚠ ASSUMPTION — CONFIRM WITH BUSINESS:
//   20% markup applied to: (a) Hybrid inverter/system tier price, and
//   (b) On-Grid tier price — BEFORE GST and wiring extras are added.
//   Does NOT apply to battery rates (already fixed) or GST/wiring amounts.
// =============================================================================

/** ⚠ ASSUMPTION — CONFIRM WITH BUSINESS. Env: PRICE_BASE_MARKUP_PCT. Default: 20%. */
export const BASE_COST_MARKUP_PCT = getEnvNumber("PRICE_BASE_MARKUP_PCT", 20);

// =============================================================================
// A6 — GST RATES (split)
// ⚠ ASSUMPTION — CONFIRM WITH BUSINESS:
//   Business gave a split rate (5% / 18%) but the current architecture doesn't
//   itemize panel-vs-BOS cost. This is the closest safe approximation:
//   - GST_CORE_PCT (5%): applied to main system cost (inverter+battery for Hybrid;
//     tier price for On-Grid, where panels are the dominant cost driver).
//   - GST_OTHER_PCT (18%): applied to house wiring extra amount only.
//   These are configurable constants — never hardcoded inline.
// =============================================================================

/** ⚠ ASSUMPTION — CONFIRM WITH BUSINESS. Env: GST_CORE_PCT. Default: 5%. */
export const GST_CORE_PCT = getEnvNumber("GST_CORE_PCT", 5);

/** ⚠ ASSUMPTION — CONFIRM WITH BUSINESS. Env: GST_OTHER_PCT. Default: 18%. */
export const GST_OTHER_PCT = getEnvNumber("GST_OTHER_PCT", 18);

// =============================================================================
// A7 — HOUSE WIRING EXTRA (Hybrid only)
// ⚠ ASSUMPTION — CONFIRM WITH BUSINESS:
//   Only the per-kW method is implementable without a new "number of points"
//   form input. The alternative "₹300 per point" method is NOT built here.
//   TODO (future enhancement): if the business wants per-point pricing, a
//   "number of wiring points" field must be added to the quotation form first.
//   On-Grid house wiring stays at 0 — the business only specified this for Hybrid.
// =============================================================================

/** Hybrid house wiring rate. ₹3,000 per kW of system capacity. On-Grid uses 0. */
export const HYBRID_WIRING_RATE_PER_KW_RS = getEnvNumber("PRICE_HYBRID_WIRING_PER_KW", 3000);

// =============================================================================
// LEGACY / ON-GRID INVERTER
// Removed. On-grid cost is now entirely driven by ONGRID_RATE_PER_KW_RS.
// =============================================================================

/**
 * Doc 3 §12 — Extra Rates config object.
 * GST and wiring are now computed dynamically in pricingEngine.service.ts
 * using the split rates above. This object is retained for admin-API compat
 * (the PUT /admin/config/prices endpoint still accepts flat gstRs / houseWiringRs
 * overrides). The `isConfigured` flag is now permanently true since A6/A7 data exists.
 */
export const EXTRA_RATES_CONFIG = {
  gstRs: getEnvNumber("PRICE_EXTRA_GST_RS", 0) as number | null,
  houseWiringRs: getEnvNumber("PRICE_EXTRA_HOUSE_WIRING_RS", 0) as number | null,
  isConfigured: true, // Updated: A6/A7 data is now available.
};
