/**
 * config/runtimeConfigStore.ts
 *
 * Phase 7 requirement: Admin Layer can update price-list values without
 * recompiling. This module is the single mutable source of truth for
 * pricing at runtime.
 *
 * Updated: Build Finalization Pass — Tasks A3, A4, A5, A6, A7.
 * - Hybrid inverter rate is now a lookup (no longer a flat placeholder).
 * - On-Grid inverter rate remains an unresolved placeholder.
 * - New getters: getHybridInverterRate, getOnGridTierPrice, getBaseCostMarkup,
 *   getGstRates, getHouseWiringRatePerKw.
 *
 * ⚠ SCOPE NOTE: This store is in-memory only and resets on process restart.
 * Persisting admin changes to a database/config table is the natural next step
 * (Doc 5 §17 — "Maintain the Price List as an isolated service or database table")
 * and is intentionally NOT implemented here.
 *
 * TODO (Future Phase — Admin Formula Editing):
 * The business requested the ability to "add/delete backend calculations."
 * This is a live rules-engine feature — a major separate undertaking requiring
 * its own architecture review (sandboxed expression evaluator, audit trail,
 * rollback mechanism, etc.). The existing PUT /api/v1/admin/config/prices
 * endpoint (which updates rate VALUES) is the correct scope for this phase.
 * Formula-editing must NOT be added to this module without a dedicated design pass.
 */

import {
  BATTERY_RATES_RS,
  STRUCTURE_RATE_PER_KW_RS,
  EXTRA_RATES_CONFIG,
  BASE_COST_MARKUP_PCT,
  GST_CORE_PCT,
  GST_OTHER_PCT,
  HYBRID_WIRING_RATE_PER_KW_RS,
  HYBRID_INVERTER_TIERS,
  lookupHybridInverterTier,
  BatteryTypeId,
  HybridSeries,
  HybridPhase,
  HybridInverterTier,
  ONGRID_RATE_PER_KW_RS,
  ONGRID_DISCOM_CHARGE_RS,
  SUBSIDY_FIRST_TIER_RATE_RS,
  SUBSIDY_SECOND_TIER_RATE_RS,
  SUBSIDY_MAX_CAP_RS,
} from "./priceListConfig";

interface MutablePriceListState {
  batteryRates: Record<BatteryTypeId, number>;
  structureRatePerKwRs: number;
  /** Hybrid inverter tiers — copy of HYBRID_INVERTER_TIERS, updatable at runtime. */
  hybridInverterTiers: HybridInverterTier[];
  baseCostMarkupPct: number;
  gstCorePct: number;
  gstOtherPct: number;
  hybridWiringRatePerKwRs: number;
  /** Legacy flat extra-rates — kept for admin API compat. */
  extraRates: { gstRs: number; houseWiringRs: number };

  // Phase 3 — On-Grid Pricing
  onGridRatePerKwRs: number;
  onGridDiscomChargeRs: number;
  subsidyFirstTierRateRs: number;
  subsidySecondTierRateRs: number;
  subsidyMaxCapRs: number;
}

let state: MutablePriceListState = {
  batteryRates: { ...BATTERY_RATES_RS },
  structureRatePerKwRs: STRUCTURE_RATE_PER_KW_RS,
  hybridInverterTiers: [...HYBRID_INVERTER_TIERS],
  baseCostMarkupPct: BASE_COST_MARKUP_PCT,
  gstCorePct: GST_CORE_PCT,
  gstOtherPct: GST_OTHER_PCT,
  hybridWiringRatePerKwRs: HYBRID_WIRING_RATE_PER_KW_RS,
  extraRates: {
    gstRs: EXTRA_RATES_CONFIG.gstRs ?? 0,
    houseWiringRs: EXTRA_RATES_CONFIG.houseWiringRs ?? 0,
  },
  onGridRatePerKwRs: ONGRID_RATE_PER_KW_RS,
  onGridDiscomChargeRs: ONGRID_DISCOM_CHARGE_RS,
  subsidyFirstTierRateRs: SUBSIDY_FIRST_TIER_RATE_RS,
  subsidySecondTierRateRs: SUBSIDY_SECOND_TIER_RATE_RS,
  subsidyMaxCapRs: SUBSIDY_MAX_CAP_RS,
};

// ─── Getters ──────────────────────────────────────────────────────────────────

export function getBatteryRate(type: BatteryTypeId): number {
  return state.batteryRates[type];
}

export function getStructureRatePerKw(): number {
  return state.structureRatePerKwRs;
}
/**
 * Hybrid inverter rate lookup. Returns the matching (or round-up) tier, or
 * null if the capacity exceeds all listed tiers for that series+phase.
 * Reads from the mutable runtime state so admin updates are reflected.
 */
export function getHybridInverterTier(
  series: HybridSeries,
  capacityKw: number,
  phase: HybridPhase
): HybridInverterTier | null {
  const matching = state.hybridInverterTiers
    .filter((t) => t.series === series && t.phase === phase)
    .sort((a, b) => a.capacityKw - b.capacityKw);
  return matching.find((t) => t.capacityKw >= capacityKw) ?? null;
}

export function getOnGridRatePerKw(): number {
  return state.onGridRatePerKwRs;
}

export function getOnGridDiscomCharge(): number {
  return state.onGridDiscomChargeRs;
}

export function getSubsidyConstants() {
  return {
    firstTierRate: state.subsidyFirstTierRateRs,
    secondTierRate: state.subsidySecondTierRateRs,
    maxCap: state.subsidyMaxCapRs,
  };
}

/** ⚠ ASSUMPTION — CONFIRM WITH BUSINESS (A5). 20% markup on tier prices. */
export function getBaseCostMarkupPct(): number {
  return state.baseCostMarkupPct;
}

/** ⚠ ASSUMPTION — CONFIRM WITH BUSINESS (A6). Split GST: 5% core / 18% wiring. */
export function getGstRates(): { corePct: number; otherPct: number } {
  return { corePct: state.gstCorePct, otherPct: state.gstOtherPct };
}

/** ⚠ ASSUMPTION — CONFIRM WITH BUSINESS (A7). ₹3,000/kW for Hybrid wiring. */
export function getHybridWiringRatePerKw(): number {
  return state.hybridWiringRatePerKwRs;
}

export function getExtraRates(): { gstRs: number; houseWiringRs: number } {
  return state.extraRates;
}

/** Admin-only read. Never expose via customer-facing quotation API. */
export function getPriceListSnapshot() {
  return JSON.parse(JSON.stringify(state));
}

// ─── Admin Patch Interface ─────────────────────────────────────────────────────

export interface PriceListUpdatePatch {
  batteryRates?: Partial<Record<BatteryTypeId, number>>;
  structureRatePerKwRs?: number;
  baseCostMarkupPct?: number;
  gstCorePct?: number;
  gstOtherPct?: number;
  hybridWiringRatePerKwRs?: number;
  extraRates?: Partial<{ gstRs: number; houseWiringRs: number }>;
  
  // Phase 3 — On-Grid Pricing Updates
  onGridRatePerKwRs?: number;
  onGridDiscomChargeRs?: number;
}

/** Admin-only write. Called exclusively from controllers/admin.controller.ts. */
export function updatePriceList(patch: PriceListUpdatePatch) {
  if (patch.batteryRates) {
    state = { ...state, batteryRates: { ...state.batteryRates, ...patch.batteryRates } };
  }
  if (patch.structureRatePerKwRs !== undefined) {
    state = { ...state, structureRatePerKwRs: patch.structureRatePerKwRs };
  }
  if (patch.onGridRatePerKwRs !== undefined) {
    state = { ...state, onGridRatePerKwRs: patch.onGridRatePerKwRs };
  }
  if (patch.onGridDiscomChargeRs !== undefined) {
    state = { ...state, onGridDiscomChargeRs: patch.onGridDiscomChargeRs };
  }
  if (patch.baseCostMarkupPct !== undefined) {
    state = { ...state, baseCostMarkupPct: patch.baseCostMarkupPct };
  }
  if (patch.gstCorePct !== undefined) {
    state = { ...state, gstCorePct: patch.gstCorePct };
  }
  if (patch.gstOtherPct !== undefined) {
    state = { ...state, gstOtherPct: patch.gstOtherPct };
  }
  if (patch.hybridWiringRatePerKwRs !== undefined) {
    state = { ...state, hybridWiringRatePerKwRs: patch.hybridWiringRatePerKwRs };
  }
  if (patch.extraRates) {
    state = { ...state, extraRates: { ...state.extraRates, ...patch.extraRates } };
  }
  return getPriceListSnapshot();
}
