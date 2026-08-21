/**
 * Pure finance helpers for the /roi-calculator page.
 *
 * Kept free of React so the arithmetic can be reasoned about (and tested) on its
 * own. Nothing here reads backend pricing constants — `config/priceListConfig.ts`
 * and `config/calculationConstants.ts` are explicitly BACKEND-ONLY, so the
 * calculator takes system cost as an input instead of deriving it from the
 * engine. When the visitor arrives from a completed quote we use the exact
 * quoted cost; otherwise they get an editable indicative figure.
 */

/**
 * Business rule (Phase 4): the standalone calculator models savings as a flat
 * 95% reduction in the electricity bill, assuming a correctly sized system.
 *
 * This differs from the /quote ROI panel, which derives the offset from actual
 * system capacity and only caps it at 95%. An undersized system will not deliver
 * 95% in practice — hence the sizing helper and the assumptions note on the page.
 */
export const BILL_OFFSET_PCT = 0.95;

/**
 * ⚠ CONFIRM WITH BUSINESS — indicative market rate only, used to pre-fill an
 * editable field for visitors who arrive without a quote. This is NOT sourced
 * from the pricing engine and is not a quotation.
 */
export const INDICATIVE_COST_PER_KW_RS = 60000;

/** ⚠ CONFIRM WITH BUSINESS — typical solar loan rate, editable by the user. */
export const DEFAULT_INTEREST_RATE_PCT = 9;

/** Parses a form field into a finite number, or null when unusable. */
export const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

/**
 * Equated Monthly Instalment on a reducing-balance loan.
 *
 *   EMI = P·r·(1+r)^n / ((1+r)^n − 1)
 *
 * where r is the monthly rate and n the number of instalments. A zero rate
 * degenerates to a straight P/n, which the formula above cannot express.
 */
export function calculateEmi(principal, annualRatePct, tenureYears) {
  if (!(principal > 0) || !(tenureYears > 0)) return null;

  const n = Math.round(tenureYears * 12);
  if (!(n > 0)) return null;

  const r = annualRatePct / 12 / 100;

  const emi = r === 0 ? principal / n : (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1);

  if (!Number.isFinite(emi) || emi <= 0) return null;

  const totalPayable = emi * n;

  return {
    emi,
    months: n,
    totalPayable,
    totalInterest: totalPayable - principal,
    principal,
  };
}

/**
 * Full picture for the results panel.
 *
 * @param {object} input
 * @param {number} input.monthlyBillRs   Current average monthly electricity bill
 * @param {number} input.systemCostRs    Total system cost (quoted or indicative)
 * @param {number} input.downPaymentRs   Upfront contribution
 * @param {number} input.interestRatePct Annual loan rate
 * @param {number} input.tenureYears     Loan tenure
 */
export function calculateRoi({
  monthlyBillRs,
  systemCostRs,
  downPaymentRs = 0,
  interestRatePct,
  tenureYears,
}) {
  if (!(monthlyBillRs > 0) || !(systemCostRs > 0)) return null;

  const currentAnnualBillRs = monthlyBillRs * 12;
  const annualSavingsRs = currentAnnualBillRs * BILL_OFFSET_PCT;
  const newAnnualBillRs = currentAnnualBillRs - annualSavingsRs;
  const monthlySavingsRs = annualSavingsRs / 12;

  // Clamp the down payment so a stray input cannot produce a negative principal.
  const safeDownPayment = Math.min(Math.max(downPaymentRs, 0), systemCostRs);
  const principal = systemCostRs - safeDownPayment;

  const loan = principal > 0 ? calculateEmi(principal, interestRatePct, tenureYears) : null;

  // Simple payback on the full system cost. Deliberately excludes panel
  // degradation and future tariff escalation — we have no business-supplied
  // figures for either, and inventing them would overstate precision.
  const simplePaybackYears = annualSavingsRs > 0 ? systemCostRs / annualSavingsRs : null;

  return {
    currentAnnualBillRs,
    newAnnualBillRs,
    annualSavingsRs,
    monthlySavingsRs,
    savingsPct: BILL_OFFSET_PCT * 100,
    downPaymentRs: safeDownPayment,
    loan,
    // Positive => the instalment exceeds the saving; negative => it is covered.
    netMonthlyOutflowRs: loan ? loan.emi - monthlySavingsRs : -monthlySavingsRs,
    simplePaybackYears,
    twentyFiveYearSavingsRs: annualSavingsRs * 25,
  };
}

/**
 * Rough capacity needed to actually achieve the modelled offset, so the sizing
 * field and the savings figure stay consistent with each other. Uses the same
 * indicative cost rate rather than the protected engine constants.
 */
export const costForSizeKw = (sizeKw) =>
  sizeKw > 0 ? Math.round(sizeKw * INDICATIVE_COST_PER_KW_RS) : null;
