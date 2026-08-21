/**
 * config/database.ts
 *
 * Supabase (PostgreSQL) connection manager.
 *
 * Replaces the previous Mongoose/MongoDB Atlas implementation. The exported
 * surface is deliberately UNCHANGED — connectDatabase / isDatabaseConnected /
 * disconnectDatabase keep their names and signatures — so server.ts needed no
 * edit at all, and services/leadStore.service.ts only had its two query blocks
 * swapped. That was the point of routing every database call through this file
 * in the first place.
 *
 * Design rule, carried over verbatim from the Mongo implementation:
 * infrastructure failures are logged, never thrown. A missing or unreachable
 * database must degrade lead capture (see services/leadStore.service.ts) — it
 * must never take down the quotation API. The estimate is the customer-facing
 * product and it needs no database at all to be produced.
 *
 * ⚠ ONE BEHAVIOURAL DIFFERENCE FROM MONGOOSE, AND IT MATTERS
 *
 * supabase-js speaks HTTP. There is no persistent socket, therefore no
 * "disconnected" / "reconnected" events to listen for. isDatabaseConnected()
 * reflects the reachability probe run once at startup — it CANNOT notice an
 * outage that begins afterwards. Both callers are already written for this:
 *   • pushLead treats a failed insert as "not persisted" and falls through to
 *     the append-only JSONL file, exactly as it did on a Mongo write error.
 *   • getLeads inspects the error on every read and raises the same sanitized
 *     LEADS_UNAVAILABLE AppError the Mongo path raised.
 * So a mid-flight Supabase outage still costs us the admin list view and
 * nothing else. No lead is lost, and no customer sees an error.
 *
 * Every tunable is read through config/env.ts so it can be overridden per
 * environment with no recompilation (Doc 5 §20).
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getEnvString, getEnvNumber } from "./env";

/** The single table this project persists to. Schema: db/001_create_leads_table.sql */
export const LEADS_TABLE = "leads";

let client: SupabaseClient | null = null;
let connected = false;

/**
 * True only when connectDatabase() completed a successful reachability probe.
 *
 * See the header note: this is a startup fact, not a live heartbeat. Treat it
 * as "was the database configured and reachable when we booted?" — never as a
 * guarantee that the next query will succeed.
 */
export function isDatabaseConnected(): boolean {
  return connected && client !== null;
}

/**
 * The configured Supabase client.
 *
 * Throws if called before a successful connectDatabase(). Callers must gate on
 * isDatabaseConnected() first — leadStore.service.ts does.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    throw new Error(
      "getSupabase() called before a successful connectDatabase(). " +
        "Gate the call on isDatabaseConnected()."
    );
  }
  return client;
}

/**
 * Connects to Supabase and verifies the `leads` table is actually reachable.
 * Call once from server.ts before app.listen(). Never throws.
 *
 * @returns true if connected, false if the server is running without a database.
 */
export async function connectDatabase(): Promise<boolean> {
  const url = getEnvString("SUPABASE_URL", "");
  const serviceKey = getEnvString("SUPABASE_SERVICE_ROLE_KEY", "");

  if (!url || !serviceKey) {
    // eslint-disable-next-line no-console
    console.warn(
      "[Database] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — starting " +
        "WITHOUT a database. Leads will be appended to the local fallback file only. " +
        "Set both in .env before production."
    );
    return false;
  }

  const timeoutMs = getEnvNumber("SUPABASE_TIMEOUT_MS", 8000);

  client = createClient(url, serviceKey, {
    auth: {
      /* This is a server process, not a browser. There is no user session to
         persist and no token to refresh — leaving these on makes supabase-js
         start background timers that keep the Node event loop alive and stop
         the process exiting cleanly in scripts. */
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      /* supabase-js has no timeout option of its own. Without this, a network
         black-hole would hang a lead insert indefinitely and the customer's
         quotation request would stall — the exact failure mode
         serverSelectionTimeoutMS protected us from on Mongo. */
      fetch: (input, init) =>
        fetch(input as RequestInfo, {
          ...init,
          signal: AbortSignal.timeout(timeoutMs),
        }),
    },
  });

  try {
    /* head: true fetches no rows — we only want the HTTP status. This proves
       three things at once: the URL resolves, the service key is accepted, and
       the `leads` table exists. A key that is valid but pointed at a project
       where the migration was never run fails HERE, at boot, with a clear log
       line, instead of silently at the first customer's lead. */
    const { error } = await client
      .from(LEADS_TABLE)
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    connected = true;
    // eslint-disable-next-line no-console
    console.log(`[Database] Connected to Supabase (table: ${LEADS_TABLE}).`);
    return true;
  } catch (err) {
    connected = false;
    client = null;
    // eslint-disable-next-line no-console
    console.error(
      "[Database] Initial connection FAILED. The API will still serve estimates; " +
        "leads go to the fallback file. Check SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, " +
        `and that db/001_create_leads_table.sql has been run on this project.`,
      err
    );
    return false;
  }
}

/**
 * Releases the client. Used by scripts so the process can exit cleanly.
 *
 * There is no socket to close — this only drops the reference and flips the
 * flag, so a script that calls it cannot accidentally keep querying.
 */
export async function disconnectDatabase(): Promise<void> {
  client = null;
  connected = false;
}
