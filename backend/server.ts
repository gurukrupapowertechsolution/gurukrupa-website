/**
 * server.ts
 *
 * Application entrypoint. Wires together:
 *   - JSON body parsing, security headers, CORS
 *   - Customer-facing Quotation API (/api/v1/quotations)
 *   - Placeholder Admin API (/api/v1/admin)
 *   - 404 handling
 *   - Global sanitized error handler (MUST be registered last)
 *
 * Run with: `npm run dev` (see package.json)
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { getEnvNumber, getEnvString } from "./config/env";
import { connectDatabase } from "./config/database";
import quotationRoutes from "./routes/quotation.routes";
import adminRoutes from "./routes/admin.routes";
import { errorHandler } from "./middlewares/errorHandler.middleware";

const app = express();

app.use(helmet());

/**
 * CORS (Phase 10 — Deployment Preparation).
 * `CORS_ALLOWED_ORIGINS` is a comma-separated allow-list, e.g.
 *   CORS_ALLOWED_ORIGINS=https://gurukrupapowertech.com,https://www.gurukrupapowertech.com
 * If unset, the server falls back to reflecting any origin (`origin: true`) —
 * fine for local development, but a startup warning is logged so this can
 * never silently ship to production wide open. See Deployment_Guide.md §4.
 */
const allowedOriginsRaw = getEnvString("CORS_ALLOWED_ORIGINS", "");
const allowedOrigins = allowedOriginsRaw
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  // eslint-disable-next-line no-console
  console.warn(
    "[CORS WARNING] CORS_ALLOWED_ORIGINS is not set — accepting requests from any origin. " +
      "Set this explicitly before deploying to production (see Deployment_Guide.md §4)."
  );
}

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/quotations", quotationRoutes);
app.use("/api/v1/admin", adminRoutes);

// Unknown route fallback.
app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found." } });
});

// Global error handler — MUST be the last middleware registered.
app.use(errorHandler);

const PORT = getEnvNumber("PORT", 4000);

/**
 * Bootstrap. The database connects BEFORE the port opens, so the very first
 * request can never race the connection.
 *
 * A failed connection does NOT stop the server: connectDatabase() returns
 * false and the API keeps serving estimates, with leads routed to the on-disk
 * fallback by services/leadStore.service.ts. For a customer-facing marketing
 * site, staying up while degraded beats refusing to boot — but the warning
 * below is deliberately loud, matching the CORS warning above.
 */
async function bootstrap() {
  const dbReady = await connectDatabase();

  if (!dbReady) {
    // eslint-disable-next-line no-console
    console.warn(
      "[STARTUP WARNING] Running WITHOUT a lead database. Leads will be written " +
        "to the fallback file and GET /api/v1/admin/leads will return an error."
    );
  }

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Gurukrupa Powertech backend listening on port ${PORT}`);
  });
}

bootstrap();

export default app;
