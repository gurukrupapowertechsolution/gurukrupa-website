/**
 * pricing-engine/pricingEngine.service.ts
 *
 * Source: Document 3 §13 (Pricing Engine) and §14 (Estimate Generation Flow).
 *
 * Updated: Build Finalization Pass — Tasks A3, A4, A5, A6, A7.
 *
 * Pricing sequence (finalized):
 *
 * ON-GRID PATH:
 *   1. Look up On-Grid tier price by calculated solarCapacityKw (round up). [A4]
 *   2. Apply BASE_COST_MARKUP_PCT to tier price. [A5]
 *   3. Apply GST_CORE_PCT (5%) to marked-up tier price. [A6]
 *   4. Add On-Grid inverter cost (⚠ still placeholder — UTL/Solaryaan/Polycab rates not supplied).
 *   5. House wiring = 0 for On-Grid (business only specified Hybrid).
 *   Total = tier × (1 + markup) × (1 + coreGST) + inverterPlaceholder
 *
 * HYBRID PATH:
 *   1. Look up Hybrid inverter tier price (series + capacity + phase). [A3]
 *   2. Apply BASE_COST_MARKUP_PCT to inverter tier price. [A5]
 *   3. Calculate battery cost: requiredBatteryCount × batteryUnitRate.
 *   4. Apply GST_CORE_PCT (5%) to (marked-up inverter price + battery cost). [A6]
 *   5. Calculate house wiring: hybridSystemCapacityKw × HYBRID_WIRING_RATE_PER_KW_RS. [A7]
 *   6. Apply GST_OTHER_PCT (18%) to wiring amount only. [A6]
 *   7. Subtract the PM Surya Ghar capacity subsidy, clamped to the non-battery
 *      cost. [Phase 3 — parity with On-Grid]
 *   Base  = inverterTierWithMarkup + batteryCost + coreGST + wiringWithGST
 *   Total = Base − subsidy
 *
 * This service is intentionally SEPARATE from the Calculation Engine (Phase 2 §3.2)
 * so the price list can be updated without touching calculation formulas.
 */

import {
  InternalCalculationResult,
  InternalPriceBreakdown,
} from "../types/quotation.types";
import {
  getBatteryRate,
  getHybridInverterTier,
  getBaseCostMarkupPct,
  getGstRates,
  getHybridWiringRatePerKw,
  getOnGridRatePerKw,
  getOnGridDiscomCharge,
  getSubsidyConstants,
} from "../config/runtimeConfigStore";

// ─── Subsidy (shared) ─────────────────────────────────────────────────────────

/**
 * PM Surya Ghar: Muft Bijli Yojana, marginal slabs.
 *
 * Shared by both product paths from Phase 3. The scheme is CAPACITY-based, not
 * cost-based — ₹30,000/kW for the first 2 kW, ₹18,000 for the third, capped at
 * ₹78,000 — so the same function is correct for a Hybrid system of a given size
 * as for an On-Grid one. Nothing here needed changing to be reused; it only
 * needed to stop being reachable from one path.
 */
function calculateSubsidy(capacityKw: number): number {
  const { firstTierRate, secondTierRate, maxCap } = getSubsidyConstants();
  const firstTwoKw = Math.min(capacityKw, 2) * firstTierRate;
  const thirdKw = Math.min(Math.max(capacityKw - 2, 0), 1) * secondTierRate;
  const subsidy = firstTwoKw + thirdKw;
  return Math.min(subsidy, maxCap);
}

function calculateOnGridPrice(calc: InternalCalculationResult): InternalPriceBreakdown {
  const capacityKw = calc.solarCapacityKw ?? 0;

  const rawPanelCostRs = capacityKw * getOnGridRatePerKw();
  const totalCostBeforeSubsidy = rawPanelCostRs + getOnGridDiscomCharge();
  const subsidyAmountRs = calculateSubsidy(capacityKw);
  let finalEstimateRs = totalCostBeforeSubsidy - subsidyAmountRs;

  if (finalEstimateRs < 0) {
    // eslint-disable-next-line no-console
    console.warn(`[PricingEngine] On-Grid final estimate < 0 for ${capacityKw}kW. Clamping to 0.`);
    finalEstimateRs = 0;
  }

  return {
    structureCostRs: rawPanelCostRs,
    batteryCostRs: 0,
    inverterCostRs: 0,
    extraRatesRs: getOnGridDiscomCharge(),
    totalEstimateCostRs: finalEstimateRs,
    totalCostBeforeSubsidy,
    subsidyAmountRs,
  };
}

// ─── Hybrid Pricing ───────────────────────────────────────────────────────────

function calculateHybridPrice(calc: InternalCalculationResult): InternalPriceBreakdown {
  const capacityKw = calc.solarCapacityKw ?? 0;

  // Determine series and phase.
  // ⚠ ASSUMPTION — CONFIRM WITH BUSINESS (A3): IP67 is the default series for Hybrid.
  // IP21 series selection would require a distinct frontend input — not yet implemented.
  // Defaulting to IP67 + phase based on capacity:
  //   ≤ 5kW → 1_PHASE, > 5kW → 3_PHASE.
  const series = "IP67" as const;
  const phase = capacityKw <= 5 ? ("1_PHASE" as const) : ("3_PHASE" as const);

  // Step 1 — Hybrid inverter tier lookup (A3).
  const tier = getHybridInverterTier(series, capacityKw, phase);
  let inverterTierPriceRs: number;

  if (tier) {
    inverterTierPriceRs = tier.priceRs;
  } else {
    // Exceeds listed tiers for this series/phase — use fallback placeholder.
    // ⚠ ASSUMPTION — CONFIRM WITH BUSINESS: No tier data exists above 10kW for IP67.
    // eslint-disable-next-line no-console
    console.warn(
      `[PricingEngine] Hybrid ${series} ${phase} capacity ${capacityKw}kW has no tier. ` +
      `Using fallback placeholder. Confirm with business.`
    );
    inverterTierPriceRs = 15000; // Minimal placeholder — must be replaced.
  }

  // Step 2 — Apply markup (A5).
  // ⚠ ASSUMPTION — CONFIRM WITH BUSINESS: 20% markup on Hybrid inverter tier price.
  const markupFactor = 1 + getBaseCostMarkupPct() / 100;
  const markedUpInverterRs = inverterTierPriceRs * markupFactor;

  // Step 3 — Battery cost (unchanged — count × rate, no markup).
  const batteryUnitRate = calc.batteryType ? getBatteryRate(calc.batteryType) : 0;
  const batteryCostRs = (calc.requiredBatteryCount ?? 0) * batteryUnitRate;

  // Step 4 — Core GST (5%) on inverter + battery cost (A6).
  // ⚠ ASSUMPTION — CONFIRM WITH BUSINESS: 5% GST applied to (inverter + battery).
  const { corePct, otherPct } = getGstRates();
  const coreGstRs = (markedUpInverterRs + batteryCostRs) * (corePct / 100);

  // Step 5 — House wiring: ₹3,000/kW of system capacity (A7).
  // ⚠ ASSUMPTION — CONFIRM WITH BUSINESS: Per-kW method only. "₹300/point" requires
  // a "number of points" input that doesn't exist in the current form.
  const wiringCostRs = capacityKw * getHybridWiringRatePerKw();

  // Step 6 — 18% GST on wiring amount only (A6).
  // ⚠ ASSUMPTION — CONFIRM WITH BUSINESS: 18% GST on wiring (not on core cost).
  const wiringGstRs = wiringCostRs * (otherPct / 100);

  const totalCostBeforeSubsidy =
    markedUpInverterRs + batteryCostRs + coreGstRs + wiringCostRs + wiringGstRs;

  /* Step 7 — Subsidy (Phase 3).
     Hybrid was previously priced with no subsidy line at all, which is why the
     estimate card could not show the Base Cost / Estimated Subsidy / Final
     breakdown it shows for On-Grid: two of the three numbers did not exist.

     Hybrid IS subsidy-eligible, and the site already says so — the product card
     on the homepage carries "Subsidy Eligible*" with the footnote "*Battery
     typically excluded from subsidy calculation". So this is not a new business
     claim; it is the backend catching up with what the customer is already told.

     The battery exclusion needs no arithmetic of its own, because the scheme
     pays per kW rather than per rupee: the battery simply sits inside the base
     cost and is never what the subsidy is computed from. The clamp below is
     what enforces it in the one case where it could bite — a very small system
     carrying a very large battery bank, where the capacity slab could otherwise
     exceed the whole non-battery cost and start, in effect, discounting the
     battery. Subsidy can never exceed what the panels, inverter and wiring
     actually cost. */
  const subsidisableCostRs = Math.max(totalCostBeforeSubsidy - batteryCostRs, 0);
  const subsidyAmountRs = Math.min(calculateSubsidy(capacityKw), subsidisableCostRs);

  let totalEstimateCostRs = totalCostBeforeSubsidy - subsidyAmountRs;

  if (totalEstimateCostRs < 0) {
    // Unreachable given the clamp above, kept as the same safety net On-Grid has.
    // eslint-disable-next-line no-console
    console.warn(`[PricingEngine] Hybrid final estimate < 0 for ${capacityKw}kW. Clamping to 0.`);
    totalEstimateCostRs = 0;
  }

  return {
    structureCostRs: markedUpInverterRs, // Inverter tier (with markup) as "structure" for compat.
    batteryCostRs,
    inverterCostRs: 0, // Inverter cost folded into structureCostRs for Hybrid.
    extraRatesRs: coreGstRs + wiringCostRs + wiringGstRs,
    totalEstimateCostRs,
    totalCostBeforeSubsidy,
    subsidyAmountRs,
  };
}

// ─── Main Entry Point ──────────────────────────────────────────────────────────

export function calculatePrice(calc: InternalCalculationResult): InternalPriceBreakdown {
  switch (calc.productType) {
    case "ON_GRID":
      return calculateOnGridPrice(calc);
    case "HYBRID":
      return calculateHybridPrice(calc);
    default:
      // OFF_GRID is rejected before this point in calculationRouter — this is a safety net.
      throw new Error(`Pricing not implemented for product type: ${calc.productType}`);
  }
}
