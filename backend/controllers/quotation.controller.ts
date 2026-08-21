/**
 * controllers/quotation.controller.ts
 *
 * Thin HTTP adapter. Per Phase 2 §3.1, controllers contain NO business logic —
 * they only translate between the HTTP request/response and the orchestrating
 * `quotationService`, which is the sole boundary enforcing what leaves the
 * server (see services/quotationService.ts).
 */

import { Request, Response, NextFunction } from "express";
import { generateQuotation } from "../services/quotationService";
import { calculateSystemSize } from "../services/systemSizing.service";
import { AppError } from "../errors/AppError";

export async function calculateQuotationController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // req.body has already passed quotationRequestSchema (shape) via middleware;
    // generateQuotation() re-validates business rules (validators/quotationValidator.ts)
    // before touching the Calculation Engine.
    //
    // generateQuotation is async as of the database migration — it awaits the
    // durable lead write before resolving. The await must stay INSIDE this
    // try/catch: Express 4 does not catch rejected promises from an async
    // handler, so this shape is required, not stylistic.
    const response = await generateQuotation(req.body);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

/**
 * Phase 3 — POST /api/v1/quotations/system-size
 *
 * Indicative capacity sizing for the EMI / ROI calculator. Same controller
 * contract as above: no business logic here, only HTTP translation.
 *
 * The response is deliberately a single derived field. See the exposure note in
 * services/systemSizing.service.ts for why nothing else is returned.
 */
export function calculateSystemSizeController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = calculateSystemSize(req.body.monthlyBillRs);

    if (result === null) {
      // Reached only if the service rejects a value the schema allowed —
      // in practice a misconfigured env constant making the divisor unusable.
      throw new AppError(
        "SIZING_UNAVAILABLE",
        "A system size could not be calculated for that bill. Please try again or request a full quotation."
      );
    }

    res.status(200).json({
      recommendedSizeKw: result.recommendedSizeKw,
      clamped: result.clamped,
    });
  } catch (err) {
    next(err);
  }
}
