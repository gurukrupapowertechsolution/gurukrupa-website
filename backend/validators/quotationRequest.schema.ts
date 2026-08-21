/**
 * validators/quotationRequest.schema.ts
 *
 * Zod schema enforcing STRUCTURAL shape validation at the API middleware
 * layer (Phase 7 requirement), before a payload ever reaches the Calculation
 * Engine. This is deliberately layered with `validators/quotationValidator.ts`:
 *
 *   - This schema (middleware layer): rejects malformed JSON shapes fast,
 *     with a standard HTTP 400 response, before any business logic runs.
 *   - `quotationValidator.ts` (service layer): re-validates and performs
 *     business-meaning checks (e.g., known applianceId lookups against the
 *     hidden wattage table) as defense-in-depth, per Doc 5 §15's input
 *     sanitization requirement — the two are not redundant, they guard
 *     different boundaries.
 */

import { z } from "zod";

const applicationEntrySchema = z.object({
  applianceId: z.string().min(1),
  quantity: z.number().positive(),
});

/**
 * Optional lead-capture object. All three sub-fields are required when the
 * object is present (the object itself remains optional for callers who
 * skip the lead gate). Structural validation only — business sanitization
 * happens in quotationValidator.ts.
 */
const leadSchema = z
  .object({
    name: z.string().min(1),
    whatsapp: z.string().min(1),
    city: z.string().min(1),
  })
  .optional();

export const quotationRequestSchema = z.discriminatedUnion("productType", [
  z.object({
    productType: z.literal("OFF_GRID"),
    lead: leadSchema,
  }),
  z.object({
    productType: z.literal("ON_GRID"),
    phase: z.enum(["1_PHASE", "3_PHASE"]),
    lightBill: z.object({
      peak: z.number().nonnegative(),
      bottom: z.number().nonnegative(),
    }),
    lead: leadSchema,
  }),
  z.object({
    productType: z.literal("HYBRID"),
    applications: z.array(applicationEntrySchema).min(1),
    backupHoursDay: z.number().nonnegative().nullable().optional(),
    backupHoursNight: z.number().nonnegative().nullable().optional(),
    hybridSystemCapacityKw: z.number().positive().optional(),
    batteryType: z.enum(["V51_2_AH100", "V25_2_AH100"]).optional(),
    lead: leadSchema,
  }),
]);

export type QuotationRequestSchemaType = z.infer<typeof quotationRequestSchema>;
