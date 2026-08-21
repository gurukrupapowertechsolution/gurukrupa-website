/**
 * services/quotationService.ts
 *
 * Orchestrates the full Estimate Generation Flow (Document 3 §14):
 *   1. User Input        -> already validated by validators/quotationValidator.ts
 *   2. Watt Aggregation   -> performed inside Module A (calculation-engine)
 *   3. Module Routing     -> calculation-engine/calculationRouter.service.ts
 *   4. Capacity Calc.     -> calculation modules
 *   5. Pricing Diversion  -> pricing-engine/pricingEngine.service.ts
 *   6. Lead Recording     -> services/leadStore.service.ts (when lead is present)
 *   7. Final Output       -> sanitize() strips everything except estimateCost
 *
 * Updated: Build Finalization Pass — Task B.
 * The disclaimerNote now reflects the new state:
 *   - HYBRID: inverter tier rates are now REAL DATA (no placeholder) → no disclaimer
 *     unless the fallback path was hit (capacity outside tier table).
 *   - ON-GRID: inverter cost is STILL a placeholder → disclaimer shown.
 *
 * Updated: Database migration.
 * Lead recording is now durable (MongoDB Atlas) and therefore asynchronous,
 * which is why this function returns a Promise. Steps 6 and 7 are also
 * executed in the reverse of their documented order — see the note inline.
 */

import { randomUUID } from "crypto";
import { QuotationRequest, QuotationResponse, InternalCalculationResult, InternalPriceBreakdown } from "../types/quotation.types";
import { validateQuotationRequest } from "../validators/quotationValidator";
import { routeCalculation } from "../calculation-engine/calculationRouter.service";
import { calculatePrice } from "../pricing-engine/pricingEngine.service";
import { calculateRoi } from "./roiCalculator.service";
import { pushLead } from "./leadStore.service";

export async function generateQuotation(rawPayload: unknown): Promise<QuotationResponse> {
  // Step 1 — validate & sanitize input.
  const request: QuotationRequest = validateQuotationRequest(rawPayload);

  // Steps 2–4 — module routing + capacity/battery calculation.
  // NOTE (QA Phase 9, Issue B2): Off-Grid rejection is intentionally NOT
  // duplicated here. `routeCalculation` below throws OFF_GRID_NOT_SUPPORTED
  // for that case — it is the single source of truth for that behavior.
  const calculationResult: InternalCalculationResult = routeCalculation(request);

  // Step 5 — pricing diversion.
  const priceBreakdown: InternalPriceBreakdown = calculatePrice(calculationResult);

  // Step 7 runs BEFORE step 6, deliberately. The customer response is built
  // purely from data already in hand, so persistence latency cannot change it
  // and a persistence failure cannot corrupt it.
  //
  // Sanitization rules are unchanged: only estimateCost (and safe metadata)
  // ever leaves this function. `priceBreakdown` and `calculationResult` are
  // intentionally NOT returned, logged to a client-visible channel, or
  // included in any error path from this point forward.
  const response = sanitizeForClient(request, calculationResult, priceBreakdown);

  // Step 6 — durable lead recording (when the visitor provided contact details).
  //
  // Awaited, so a 200 response means the lead really is stored — in Atlas, or
  // in the on-disk fallback. Wrapped in try/catch because no storage failure
  // may ever cost the customer their estimate: pushLead is designed not to
  // throw, and this is the belt to that pair of braces.
  //
  // systemSizeKw comes straight off the engine result — Module C's output on
  // the On-Grid path, the resolved capacity on the Hybrid path.
  if (request.lead) {
    try {
      await pushLead({
        lead: request.lead,
        productType: request.productType,
        estimateCostRs: priceBreakdown.totalEstimateCostRs,
        systemSizeKw: calculationResult.solarCapacityKw,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        "[QuotationService] Lead recording failed; returning the estimate anyway.",
        err
      );
    }
  }

  return response;
}

function sanitizeForClient(
  request: QuotationRequest,
  calculationResult: InternalCalculationResult,
  priceBreakdown: InternalPriceBreakdown
): QuotationResponse {
  const response: QuotationResponse = {
    requestId: randomUUID(),
    productType: request.productType,
    estimateCost: Math.round(priceBreakdown.totalEstimateCostRs),
    currency: "INR",
  };

  /* ── Phase 3 — no product-type branch here, deliberately ──────────────────
     Everything below used to sit inside `if (request.productType === "ON_GRID")`,
     and that single line was the whole of the Hybrid parity bug.

     The frontend's estimate panel is already shared: it shows the Base Cost /
     Estimated Subsidy breakdown when `totalCostBeforeSubsidy` and
     `subsidyAmount` are both present, and it shows the savings card with its
     handoff to the EMI calculator when `roi` is present. Neither is gated on
     product type there. The branch here meant a Hybrid response never carried
     those three fields, so the same JSX rendered two different pages and it
     looked like a UI difference when it was a payload difference.

     Both paths now supply the same intermediates — Hybrid gained a subsidy line
     in the pricing engine and a consumption baseline from Module D — so this
     function reads the breakdown it is given and asks no questions about which
     product produced it. A future product type gets the same treatment for
     free, and cannot silently lose half the panel the way Hybrid did. */

  if (priceBreakdown.totalCostBeforeSubsidy !== undefined) {
    response.totalCostBeforeSubsidy = Math.round(priceBreakdown.totalCostBeforeSubsidy);
  }
  if (priceBreakdown.subsidyAmountRs !== undefined) {
    response.subsidyAmount = Math.round(priceBreakdown.subsidyAmountRs);
  }

  // ROI / Savings, from the same engine intermediates that produced this quote.
  // Returns null — and therefore no `roi` key, and therefore no savings card —
  // whenever the inputs would produce nonsense figures.
  const roiResult = calculateRoi(
    calculationResult.totalUnitsConsumed ?? 0,
    calculationResult.averageLightBillRs ?? 0,
    calculationResult.solarCapacityKw ?? 0
  );
  if (roiResult) {
    response.roi = {
      currentYearlyBillRs: Math.round(roiResult.currentYearlyBillRs),
      newYearlyBillRs: Math.round(roiResult.newYearlyBillRs),
      annualSavingsRs: Math.round(roiResult.annualSavingsRs),
      savingsPct: Math.round(roiResult.savingsPct * 10) / 10, // 1 decimal place
    };
  }

  return response;
}
