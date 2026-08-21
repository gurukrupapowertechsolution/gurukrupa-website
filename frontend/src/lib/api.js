/**
 * Backend API base and the small set of calls the site makes.
 *
 * The base URL used to be a bare const inside RemainingPages.jsx. Phase 3 added
 * a second caller (the EMI calculator's sizing lookup), and two hardcoded
 * origins is how a deployment ends up with one page pointed at production and
 * the other at localhost. One export, imported by both.
 *
 * Override for a deployed environment by setting VITE_API_BASE_URL at build
 * time; the localhost fallback is the Phase 7 Express server.
 */
export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000';

export const QUOTATION_ENDPOINT = `${API_BASE_URL}/api/v1/quotations/calculate`;
export const SYSTEM_SIZE_ENDPOINT = `${API_BASE_URL}/api/v1/quotations/system-size`;

/**
 * Asks the backend what capacity a given monthly bill needs.
 *
 * The sizing formula lives on the server (services/systemSizing.service.ts)
 * because it is built from the same protected engine constants that drive a
 * real quotation — duplicating it here would create a second set of numbers
 * that could disagree with the ones a customer is actually quoted.
 *
 * @param {number} monthlyBillRs
 * @param {AbortSignal} [signal] Lets the caller cancel a superseded lookup.
 * @returns {Promise<{recommendedSizeKw: number, clamped: boolean}>}
 * @throws  On network failure or a non-2xx response. Callers are expected to
 *          catch and fall back to manual entry — see RoiCalculator.
 */
export async function fetchRecommendedSystemSize(monthlyBillRs, signal) {
  const response = await fetch(SYSTEM_SIZE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthlyBillRs }),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || 'System size lookup failed.');
  }

  return response.json();
}
