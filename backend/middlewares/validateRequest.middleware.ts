/**
 * middlewares/validateRequest.middleware.ts
 *
 * Generic Zod-backed validation middleware (Phase 7 requirement). Rejects
 * a request with a standardized 400 error BEFORE it reaches any controller
 * or the Calculation Engine, if the body doesn't match the given schema.
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../errors/AppError";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const detail = result.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      return next(new AppError("VALIDATION_ERROR", `Invalid request payload — ${detail}`));
    }

    req.body = result.data;
    next();
  };
}
