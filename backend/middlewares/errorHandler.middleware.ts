/**
 * middlewares/errorHandler.middleware.ts
 *
 * Global error-handling middleware (Phase 7 requirement). Must be the LAST
 * middleware registered in server.ts. Catches:
 *   - AppError instances (validation failures, business-rule violations,
 *     the Off-Grid "not supported" case, admin auth failures) and returns
 *     a standardized, sanitized JSON error.
 *   - Any other unexpected error/exception — logged server-side only,
 *     never exposing a stack trace or internal message to the client
 *     (Doc 5 §12, §15 — Data Minimization / no leaking internals).
 */

import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

/** Maps known AppError codes to HTTP status codes. Unlisted codes default to 400. */
const ERROR_STATUS_MAP: Record<string, number> = {
  VALIDATION_ERROR: 400,
  INVALID_PAYLOAD: 400,
  INVALID_PRODUCT_TYPE: 400,
  MISSING_APPLICATIONS: 400,
  INVALID_APPLICATION_ENTRY: 400,
  UNKNOWN_APPLIANCE: 400,
  INVALID_QUANTITY: 400,
  MISSING_BACKUP_PREFERENCE: 400,
  INVALID_PHASE: 400,
  MISSING_LIGHT_BILL: 400,
  INVALID_PEAK_BILL: 400,
  INVALID_BOTTOM_BILL: 400,
  INVALID_FIELD: 400,
  MISSING_ON_GRID_FIELDS: 400,
  MISSING_HYBRID_APPLICATIONS: 400,
  UNSUPPORTED_PRODUCT_TYPE: 400,
  OFF_GRID_NOT_SUPPORTED: 409,
  ADMIN_AUTH_NOT_CONFIGURED: 503,
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 401,
  NOT_FOUND: 404,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    const status = ERROR_STATUS_MAP[err.code] ?? 400;
    return res.status(status).json(err.toSanitizedResponse());
  }

  // Unknown/unexpected error: never leak internals to the client.
  // eslint-disable-next-line no-console
  console.error("[UNHANDLED_ERROR]", err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later.",
    },
  });
}
