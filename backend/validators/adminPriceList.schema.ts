/**
 * validators/adminPriceList.schema.ts
 *
 * Shape validation for the placeholder Admin API's price-update endpoint
 * (Phase 7 §4). All fields optional — an admin may update one rate at a time.
 */

import { z } from "zod";

export const priceListUpdateSchema = z.object({
  batteryRates: z
    .object({
      V51_2_AH100: z.number().positive().optional(),
      V25_2_AH100: z.number().positive().optional(),
    })
    .partial()
    .optional(),
  structureRatePerKwRs: z.number().positive().optional(),
  inverterRateRs: z.number().positive().optional(),
  extraRates: z
    .object({
      gstRs: z.number().nonnegative().optional(),
      houseWiringRs: z.number().nonnegative().optional(),
    })
    .partial()
    .optional(),
});

export type PriceListUpdateSchemaType = z.infer<typeof priceListUpdateSchema>;
