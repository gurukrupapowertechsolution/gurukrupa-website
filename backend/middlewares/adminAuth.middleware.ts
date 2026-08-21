/**
 * middlewares/adminAuth.middleware.ts
 *
 * Verifies the JWT issued by POST /api/v1/admin/auth/login
 * (controllers/adminAuth.controller.ts). Expects `Authorization: Bearer <token>`.
 *
 * There is a single configured admin account (env-defined — no user
 * database exists in this project, see Handoff_Notes.md §3). This replaces
 * the earlier shared-secret-header placeholder.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getEnvString } from "../config/env";
import { AppError } from "../errors/AppError";

export interface AdminTokenPayload {
  sub: string;
  role: "admin";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

export function requireAdminAuth(req: Request, _res: Response, next: NextFunction) {
  const jwtSecret = getEnvString("ADMIN_JWT_SECRET", "");

  if (!jwtSecret) {
    return next(
      new AppError("ADMIN_AUTH_NOT_CONFIGURED", "Admin API access is not configured on this server.")
    );
  }

  const authHeader = req.header("authorization") || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("UNAUTHORIZED", "Missing or malformed admin authorization header."));
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as AdminTokenPayload;
    req.admin = payload;
    next();
  } catch {
    return next(new AppError("UNAUTHORIZED", "Invalid or expired admin session — please log in again."));
  }
}
