/**
 * services/leadStore.service.ts
 *
 * Durable lead persistence. Replaces the in-memory config/runtimeLeadStore.ts,
 * taking over the exact seam that file's header predicted: `pushLead` and
 * `getLeads` keep their names, and both are now async.
 *
 * It lives under services/ rather than config/ because it is no longer a
 * runtime *config* store — sitting next to config/runtimeConfigStore.ts would
 * misdescribe it.
 *
 * Write path, in order, each step guarded independently:
 *   1. Supabase / Postgres       (db/001_create_leads_table.sql)
 *   2. Append-only JSONL on disk (only when step 1 is unavailable or fails)
 *   3. console.error with the full record (only when step 2 also fails)
 *   4. Fire-and-forget notification email (always attempted, never awaited)
 *
 * This file owns the ONLY camelCase↔snake_case mapping in the project. The
 * database columns are snake_case (Postgres convention, and what reads best in
 * the Supabase Table Editor your sales team uses); the TypeScript surface stays
 * camelCase. Nothing outside this file needs to know either fact.
 *
 * The consequence that matters: a database outage costs us the admin list
 * view and nothing else. No lead is lost, and no customer sees an error.
 *
 * Access control: `getLeads` is exposed exclusively via the Admin API
 * (routes/admin.routes.ts → GET /api/v1/admin/leads), behind requireAdminAuth.
 * It must never be wired to a customer-facing endpoint.
 */

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { LeadInfo, StoredLead, ProductType } from "../types/quotation.types";
import { getSupabase, isDatabaseConnected, LEADS_TABLE } from "../config/database";
import { getEnvString, getEnvNumber } from "../config/env";
import { sendLeadNotificationEmail } from "./emailNotifier.service";
import { AppError } from "../errors/AppError";

/** Everything the store needs in order to record one lead. */
export interface LeadCaptureInput {
  lead: LeadInfo;
  productType: ProductType;
  /** Raw pre-rounding total from the pricing engine. */
  estimateCostRs: number;
  /** calculationResult.solarCapacityKw — omit when the engine produced none. */
  systemSizeKw?: number;
}

/**
 * Resolved against process.cwd(), NOT __dirname.
 *
 * Both npm scripts run from the backend/ folder (`ts-node-dev ... server.ts`
 * and `node dist/server.js`), so cwd is backend/ either way. __dirname would
 * differ between the two — backend/services in dev, backend/dist/services
 * after a build — and would silently put the safety-net file in two different
 * places depending on how the server was started.
 */
const FALLBACK_FILE = path.resolve(
  process.cwd(),
  getEnvString("LEAD_FALLBACK_FILE", "data/leads-fallback.jsonl")
);

/**
 * Records a lead durably, then triggers the notification email.
 *
 * Never throws — the caller's quotation must succeed regardless of what the
 * storage layer is doing.
 *
 * @returns The fully-stamped `StoredLead` that was recorded.
 */
export async function pushLead(input: LeadCaptureInput): Promise<StoredLead> {
  const record: StoredLead = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    name: input.lead.name,
    whatsapp: input.lead.whatsapp,
    city: input.lead.city,
    productType: input.productType,
    systemSizeKw: input.systemSizeKw ?? null,
    estimateCostRs: input.estimateCostRs,
  };

  let persisted = false;

  if (isDatabaseConnected()) {
    try {
      const { error } = await getSupabase().from(LEADS_TABLE).insert({
        id: record.id,
        name: record.name,
        whatsapp: record.whatsapp,
        city: record.city,
        product_type: record.productType,
        system_size_kw: record.systemSizeKw,
        estimate_cost_rs: record.estimateCostRs,
        captured_at: record.timestamp,
      });

      /* supabase-js does NOT throw on a failed query — it resolves with an
         `error` object. Forgetting this line is the single most common way to
         silently lose writes on this client, so it is deliberate and explicit:
         turn it into a throw and let the existing catch handle it exactly as
         it handled a Mongo write error. */
      if (error) throw new Error(`${error.code ?? "?"} ${error.message}`);

      persisted = true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `[LeadStore] DB write failed for lead ${record.id}; using fallback file.`,
        err
      );
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      `[LeadStore] No database connection; lead ${record.id} goes to the fallback file.`
    );
  }

  if (!persisted) {
    await appendToFallbackFile(record);
  }

  // Fire-and-forget (behaviour unchanged from the in-memory store). The
  // .catch() only suppresses an unhandled-promise warning — the notifier is
  // designed never to throw, but this is the safety net.
  sendLeadNotificationEmail(record).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[LeadStore] Unexpected error from sendLeadNotificationEmail:", err);
  });

  return record;
}

/**
 * Returns stored leads, NEWEST FIRST.
 *
 * ⚠ Ordering change: the in-memory store returned oldest-first. Newest-first
 * is what an admin list actually wants, and once a `limit` is involved it is
 * the only ordering that stays correct as the collection grows.
 *
 * Admin-only — never call from a customer-facing controller.
 *
 * @param limit Maximum records to return. Defaults to ADMIN_LEADS_PAGE_SIZE (500).
 */
export async function getLeads(limit?: number): Promise<StoredLead[]> {
  if (!isDatabaseConnected()) {
    // Sanitized code per errors/AppError.ts — no driver internals leak out.
    throw new AppError(
      "LEADS_UNAVAILABLE",
      "The lead database is currently unreachable. Please try again shortly."
    );
  }

  const cap = limit ?? getEnvNumber("ADMIN_LEADS_PAGE_SIZE", 500);

  const { data, error } = await getSupabase()
    .from(LEADS_TABLE)
    .select("*")
    .order("captured_at", { ascending: false })
    .limit(cap);

  /* isDatabaseConnected() is a startup fact, not a live heartbeat (see the note
     in config/database.ts), so an outage that began after boot surfaces HERE
     rather than in the guard above. Same sanitized AppError either way — the
     admin UI cannot tell the two cases apart, and should not have to. */
  if (error) {
    // eslint-disable-next-line no-console
    console.error("[LeadStore] Lead list query failed.", error);
    throw new AppError(
      "LEADS_UNAVAILABLE",
      "The lead database is currently unreachable. Please try again shortly."
    );
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    /* Postgres returns timestamptz as an ISO-8601 string already, but not
       always with a trailing Z. Round-tripping through Date normalises it so
       the API contract ("ISO-8601 UTC") holds regardless. */
    timestamp: new Date(row.captured_at).toISOString(),
    name: row.name,
    whatsapp: row.whatsapp,
    city: row.city,
    productType: row.product_type,
    /* numeric columns arrive as strings from the Postgres wire protocol —
       node-postgres will not narrow numeric(14,2) to a JS number for us,
       because it cannot do so without risking precision loss. Convert
       explicitly; StoredLead declares these as numbers. */
    systemSizeKw: row.system_size_kw === null ? null : Number(row.system_size_kw),
    estimateCostRs: Number(row.estimate_cost_rs),
    status: row.status,
    notes: row.notes,
  }));
}

/**
 * Last-resort durability. Append-only, so a partial write can never corrupt
 * leads already on disk. One JSON object per line (JSONL).
 */
async function appendToFallbackFile(record: StoredLead): Promise<void> {
  try {
    await fs.mkdir(path.dirname(FALLBACK_FILE), { recursive: true });
    await fs.appendFile(FALLBACK_FILE, JSON.stringify(record) + "\n", "utf8");
    // eslint-disable-next-line no-console
    console.warn(`[LeadStore] Lead ${record.id} written to ${FALLBACK_FILE}.`);
  } catch (err) {
    // Absolute last resort: dump the full record to the error log so it stays
    // recoverable from the hosting panel's log viewer.
    // eslint-disable-next-line no-console
    console.error(
      "[LeadStore] CRITICAL — lead could not be persisted anywhere. Raw record follows.",
      err,
      JSON.stringify(record)
    );
  }
}
