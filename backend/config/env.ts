/**
 * config/env.ts
 *
 * Central environment-variable loader. Every hidden constant in this
 * codebase is read through these helpers so that:
 *   - Document 3's documented values are always the FALLBACK default
 *     (nothing breaks if .env is absent), and
 *   - An admin/ops engineer can override any rate or factor by setting
 *     an environment variable, with no recompilation (Doc 5 §20).
 */

import dotenv from "dotenv";

dotenv.config();

export function getEnvNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getEnvString(key: string, fallback: string): string {
  const raw = process.env[key];
  return raw === undefined || raw === "" ? fallback : raw;
}

export function getEnvBoolean(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  return raw.toLowerCase() === "true";
}
