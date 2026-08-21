/**
 * controllers/adminAuth.controller.ts
 *
 * POST /api/v1/admin/auth/login — issues a short-lived JWT for the single
 * configured admin account. Replaces the old shared-secret header scheme
 * (see middlewares/adminAuth.middleware.ts). There is exactly one admin
 * account, defined entirely via environment variables — no user database
 * exists in this project (see Handoff_Notes.md §3).
 */

import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { getEnvString } from "../config/env";
import { AppError } from "../errors/AppError";

export async function adminLoginController(req: Request, res: Response, next: NextFunction) {
  const expectedUsername = getEnvString("ADMIN_USERNAME", "");
  const expectedPasswordHash = getEnvString("ADMIN_PASSWORD_HASH", "");
  const jwtSecret = getEnvString("ADMIN_JWT_SECRET", "");

  if (!expectedUsername || !expectedPasswordHash || !jwtSecret) {
    return next(
      new AppError("ADMIN_AUTH_NOT_CONFIGURED", "Admin login is not configured on this server.")
    );
  }

  const { username, password } = req.body as { username: string; password: string };

  if (username !== expectedUsername) {
    return next(new AppError("INVALID_CREDENTIALS", "Invalid username or password."));
  }

  const passwordMatches = await bcrypt.compare(password, expectedPasswordHash);
  if (!passwordMatches) {
    return next(new AppError("INVALID_CREDENTIALS", "Invalid username or password."));
  }

  const expiresIn = getEnvString("ADMIN_JWT_EXPIRES_IN", "12h");
  const token = jwt.sign({ sub: username, role: "admin" }, jwtSecret, {
    expiresIn,
  } as SignOptions);

  res.status(200).json({ token, expiresIn });
}
