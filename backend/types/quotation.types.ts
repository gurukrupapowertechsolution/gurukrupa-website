/**
 * types/quotation.types.ts
 *
 * Shared type contracts for the Calculation Engine and Pricing Engine.
 * Mirrors the QuotationRequest / QuotationResponse data models defined
 * in Phase 2 §5.2–5.3, aligned with Document 3 §7 (User Input Parameters).
 */

import { ApplianceId } from "../config/applianceConstants";
import { BatteryTypeId } from "../config/priceListConfig";

export type ProductType = "ON_GRID" | "HYBRID" | "OFF_GRID";
export type PhaseType = "1_PHASE" | "3_PHASE";

export interface ApplicationEntry {
  applianceId: ApplianceId;
  quantity: number;
}

/**
 * Voluntary contact details captured via the Lead Capture modal on the
 * frontend. All three fields are required when the object is present —
 * the object itself is optional (callers that don't supply it are still
 * processed normally; leads are simply not recorded).
 */
export interface LeadInfo {
  name: string;
  whatsapp: string;
  city: string;
}

/**
 * A single lead record as persisted in Supabase (db/001_create_leads_table.sql) via
 * services/leadStore.service.ts. estimateCostRs is the raw number before
 * Math.round — kept internally for potential future analytics.
 *
 * `status` and `notes` are present only on records read back out of the
 * database; a freshly captured lead has neither yet.
 */
export interface StoredLead {
  id: string;
  timestamp: string; // ISO-8601 UTC
  name: string;
  whatsapp: string;
  city: string;
  productType: ProductType;
  /** From InternalCalculationResult.solarCapacityKw. Null when none was produced. */
  systemSizeKw: number | null;
  estimateCostRs: number;
  status?: string;
  notes?: string;
}

/**
 * Raw customer-facing request payload. This is the ONLY shape of data
 * that should ever originate from the frontend (Doc 3 §7).
 */
export interface QuotationRequest {
  productType: ProductType;

  // Hybrid-path fields
  applications?: ApplicationEntry[];
  backupHoursDay?: number | null;
  backupHoursNight?: number | null;
  batteryType?: BatteryTypeId; // Selected/assigned battery bank type for sizing.

  /**
   * Hybrid system rated capacity (kw), e.g. 3, 5, 7.5, 10 for IP 67,
   * or 3.5 / 6.5 for IP 21.
   *
   * ⚠ DOCUMENTATION GAP: Document 3 provides no formula that DERIVES this
   * value from appliance load — Module B only validates a *given* solar
   * capacity's daytime running load (Doc 3 §11 Module B). Product selection
   * of the hybrid system's rated kw is therefore treated as an explicit
   * input (chosen from the Doc 2 product range), not a calculated output,
   * until the business clarifies a sizing rule.
   */
  hybridSystemCapacityKw?: number;

  // On-Grid-path fields
  phase?: PhaseType;
  lightBill?: { peak: number; bottom: number };

  /**
   * Optional lead-capture data volunteered by the visitor via the
   * Lead Capture modal (frontend/src/RemainingPages.jsx). When present,
   * the quotation service persists this via services/leadStore.service.ts
   * alongside the generated estimate.
   * When absent, the quotation flow completes normally without recording.
   */
  lead?: LeadInfo;
}

/** Internal-only result of Calculation Engine modules. NEVER serialize this to the client. */
export interface InternalCalculationResult {
  productType: ProductType;
  solarCapacityKw?: number; // Module C output (On-Grid) or supplied input (Hybrid)
  requiredBatteryCount?: number; // Module A output (Hybrid)
  batteryType?: BatteryTypeId;
  totalConnectedLoadW?: number; // Module A intermediate
  totalConsumptionKwh?: number; // Module A intermediate
  dayRunningLoadMaxKw?: number; // Module B output

  /* Consumption baseline for the ROI calculation. Populated on BOTH paths as of
     Phase 3 — On-Grid reads it straight out of Module C, Hybrid derives it from
     the sized capacity in Module D (hybridConsumption.module.ts) because that
     path never asks the customer for a bill. Same units and same monthly basis
     either way, which is what lets the response builder stay product-agnostic. */
  totalUnitsConsumed?: number;  // monthly units
  averageLightBillRs?: number;  // monthly bill, margin included
}

/** Internal-only pricing breakdown. NEVER serialize this to the client. */
export interface InternalPriceBreakdown {
  structureCostRs: number;
  batteryCostRs: number;
  inverterCostRs: number;
  extraRatesRs: number;
  totalEstimateCostRs: number;
  /* Subsidy breakdown. Supplied by BOTH pricing paths as of Phase 3 — Hybrid
     gained its subsidy line so the estimate card can render the same Base Cost /
     Estimated Subsidy / Final breakdown it renders for On-Grid. */
  totalCostBeforeSubsidy?: number;
  subsidyAmountRs?: number;
}

/**
 * ROI / Savings estimate. Only safe derived totals; engine constants
 * (₹6/unit, 4.5 units/kW) are NEVER exposed.
 *
 * Returned for On-Grid and Hybrid alike as of Phase 3. Absent only when the
 * inputs would produce nonsense — which the frontend reads as "no savings card
 * and no EMI handoff", the correct outcome in that case for either product.
 */
export interface RoiResponse {
  currentYearlyBillRs: number;
  newYearlyBillRs: number;
  annualSavingsRs: number;
  savingsPct: number;
}

/**
 * Sanitized, customer-facing response. This is the ONLY shape of data
 * the API is permitted to return (Phase 2 §5.3, Doc 5 §15).
 */
export interface QuotationResponse {
  requestId: string;
  productType: ProductType;
  estimateCost: number;
  currency: "INR";
  disclaimerNote?: string;

  /* Subsidy breakdown and savings estimate. Both product types carry all three
     of these from Phase 3 on, and the frontend renders one shared panel from
     them — see the note in services/quotationService.ts on why there is no
     product-type branch behind these fields any more. Omitted only when the
     underlying figures genuinely do not exist. */
  totalCostBeforeSubsidy?: number;
  subsidyAmount?: number;
  roi?: RoiResponse;
}
