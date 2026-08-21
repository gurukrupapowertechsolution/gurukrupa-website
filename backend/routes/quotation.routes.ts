/**
 * routes/quotation.routes.ts
 *
 * Customer-facing quotation API. Mounted at /api/v1/quotations in server.ts.
 *
 *   POST /api/v1/quotations/calculate
 *     Body: QuotationRequest (see types/quotation.types.ts)
 *     Returns: sanitized QuotationResponse (estimateCost only — Doc 5 §15)
 *
 *   POST /api/v1/quotations/system-size                          [Phase 3]
 *     Body: { monthlyBillRs: number }
 *     Returns: { recommendedSizeKw: number, clamped: boolean }
 *     Indicative sizing for the EMI / ROI calculator — NOT a quotation.
 *     Lives under /quotations rather than on its own resource because it is the
 *     same customer-facing pre-sales surface and shares the engine constants.
 */

import { Router } from "express";
import { validateBody } from "../middlewares/validateRequest.middleware";
import { quotationRequestSchema } from "../validators/quotationRequest.schema";
import { systemSizeRequestSchema } from "../validators/systemSizeRequest.schema";
import {
  calculateQuotationController,
  calculateSystemSizeController,
} from "../controllers/quotation.controller";

const router = Router();

router.post("/calculate", validateBody(quotationRequestSchema), calculateQuotationController);

router.post(
  "/system-size",
  validateBody(systemSizeRequestSchema),
  calculateSystemSizeController
);

export default router;
