/**
 * validators/systemSizeRequest.schema.ts
 *
 * Structural validation for POST /api/v1/quotations/system-size, applied by the
 * same validateBody middleware the quotation endpoint uses.
 *
 * The upper bound is a shape guard, not the business rule — services/
 * systemSizing.service.ts owns the real clamping. It exists here so an absurd
 * payload is rejected at the boundary with a 400 rather than travelling into
 * the service to be silently clamped into a plausible-looking answer.
 */

import { z } from "zod";

export const systemSizeRequestSchema = z.object({
  /**
   * Average monthly electricity bill in rupees.
   *
   * `finite()` is doing real work: JSON.parse accepts `1e400`, which becomes
   * Infinity, and `positive()` alone would let it through — Infinity is greater
   * than zero.
   */
  monthlyBillRs: z.number().finite().positive().max(10_000_000),
});

export type SystemSizeRequestSchemaType = z.infer<typeof systemSizeRequestSchema>;
