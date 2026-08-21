# Deployment Guide — Gurukrupa Powertech Solutions Platform

**Audience:** DevOps / hosting team taking this project from local development to production.
**Scope:** Backend (Node/Express/TypeScript) and Frontend (React components delivered in Phases 4–5, wired in Phase 8).

---

## 1. Architecture Recap

```
┌────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐
│  React Frontend     │ ────────────────────────▶│  Node/Express Backend    │
│  (static build,     │                            │  (Calculation Engine +   │
│  served via CDN/    │◀──────────────────────────│   Pricing Engine + API) │
│  Nginx/Vercel)      │      sanitized JSON        │  Runs as its own service │
└────────────────────┘                            └──────────────────────────┘
```

The two halves are deployed **independently**. The frontend is a static asset
bundle; the backend is a long-running Node process. Nothing about this platform
requires them to share a host, a region, or a deploy pipeline.

---

## 2. Backend Deployment (Node/Express/TypeScript)

### 2.1 Build

```bash
cd backend
npm ci
npm run build      # runs `tsc -p .` -> emits compiled JS to dist/
```

`tsconfig.json` is configured with `rootDir: "."` / `outDir: "dist"`, and now
**excludes `**/__tests__/**`** from the production build (fixed in this phase —
previously the worked-example test file would have compiled into `dist/`
unnecessarily). Verify after building:

```bash
ls dist/server.js                       # should exist
ls dist/calculation-engine/__tests__    # should NOT exist
```

### 2.2 Environment Variables

Copy `.env.example` to `.env` (or inject equivalent variables through your
hosting platform's secrets manager — do not commit `.env` to source control;
`.gitignore` already excludes it). At minimum, set for production:

| Variable | Production requirement |
|---|---|
| `PORT` | Whatever your process manager/reverse proxy expects (often left at the platform default). |
| `CORS_ALLOWED_ORIGINS` | **Required.** Comma-separated list of your real frontend origin(s). See §4. |
| `ADMIN_USERNAME` | **Required if the Admin API is exposed at all.** The single admin login username. |
| `ADMIN_PASSWORD_HASH` | **Required.** Bcrypt hash of the real admin password — generate with `npm run hash-password -- "the-real-password"`. Never store the plaintext password anywhere. |
| `ADMIN_JWT_SECRET` | **Required.** Long random value used to sign/verify admin session JWTs; treat as a secret. |
| `ADMIN_JWT_EXPIRES_IN` | Optional, defaults to `12h`. How long an admin login session lasts before re-login is required. |
| `CALC_*` / `PRICE_*` variables | Leave unset to use the Document 3-sourced defaults, unless the business has supplied confirmed replacement figures (see `Handoff_Notes.md`). |

### 2.3 Running in Production

Two supported options — pick one:

**Option A — PM2 (process manager on a VM/bare server)**
```bash
npm install -g pm2
cd backend
npm run build
pm2 start dist/server.js --name gurukrupa-backend
pm2 save
pm2 startup   # configures PM2 to restart on server reboot
```

**Option B — Docker (recommended for container platforms)**
A production `Dockerfile` is included at `backend/Dockerfile` (multi-stage:
compiles TypeScript in a build stage, ships only compiled output + production
dependencies in the runtime stage).

```bash
cd backend
docker build -t gurukrupa-backend .
docker run -d \
  --name gurukrupa-backend \
  -p 4000:4000 \
  --env-file .env \
  gurukrupa-backend
```

Either way, confirm the service is healthy:
```bash
curl https://your-backend-domain/health
# {"status":"ok"}
```

### 2.4 Logging

`server.ts` logs its startup line and `errorHandler.middleware.ts` logs
unexpected (non-`AppError`) exceptions via `console.error`. In production,
route stdout/stderr into whatever log aggregation your host provides (PM2 logs,
Docker log driver, or your platform's built-in log stream) — no code changes
are required for this, just infrastructure wiring.

---

## 3. Frontend Deployment (React)

The components delivered in this project (`Homepage.jsx`, `RemainingPages.jsx`)
are **components**, not a full application shell. Before deploying, they need
to be placed inside a build tool (Vite is recommended; Next.js also works if
you prefer file-based routing/SSR).

### 3.1 Recommended: Vite static build

```bash
npm create vite@latest gurukrupa-frontend -- --template react
cd gurukrupa-frontend
npm install
npm install lucide-react
# Configure Tailwind for Vite (see Tailwind's official Vite guide) — the
# components use Tailwind utility classes for layout/spacing alongside their
# own CSS-variable-based design tokens.
```

Copy `Homepage.jsx` and `RemainingPages.jsx` into `src/`, and route between
them (e.g., with `react-router-dom`, or by extending the existing tab-based
navigation in `RemainingPages.jsx` to include the homepage as another tab).

**Before building for production**, update the API origin. Currently it's a
hardcoded constant in `RemainingPages.jsx`:
```js
const API_BASE_URL = "http://localhost:4000";
```
Replace this with a build-time environment variable:
```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```
and set `VITE_API_BASE_URL=https://your-backend-domain` in your Vite
`.env.production` file (or your hosting platform's environment variable UI).

```bash
npm run build      # outputs static assets to dist/
```

### 3.2 Hosting the static build

Any static host works. Two common paths:

**Vercel / Netlify (simplest)** — connect the repo, set the build command to
`npm run build`, output directory `dist`, and set `VITE_API_BASE_URL` as an
environment variable in the platform's dashboard.

**Nginx (self-hosted)** — copy the `dist/` output to your web root and serve it
as static files, with a fallback to `index.html` for client-side routing:
```nginx
server {
    listen 80;
    server_name gurukrupapowertech.com;
    root /var/www/gurukrupa-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
Put HTTPS in front of this via a reverse proxy (Nginx with Certbot/Let's
Encrypt, or a managed load balancer) — never serve the quotation form over
plain HTTP in production, since it collects contact-adjacent usage data.

---

## 4. CORS Configuration for Production

The backend's CORS behavior (`server.ts`) was hardened in this phase:

- **Local development:** if `CORS_ALLOWED_ORIGINS` is unset, the server accepts
  requests from any origin and logs a `[CORS WARNING]` at startup — convenient
  for local testing, impossible to miss if it accidentally ships.
- **Production:** set `CORS_ALLOWED_ORIGINS` to an explicit comma-separated
  list of your real frontend origin(s), e.g.:
  ```
  CORS_ALLOWED_ORIGINS=https://gurukrupapowertech.com,https://www.gurukrupapowertech.com
  ```
  Once set, the backend only accepts cross-origin requests from those exact
  origins — everything else is rejected by the `cors` middleware before it
  reaches any route.

**Checklist before go-live:**
- [ ] `CORS_ALLOWED_ORIGINS` set to the real production frontend domain(s), not `localhost`.
- [ ] No `[CORS WARNING]` line appears in production startup logs.
- [ ] Frontend's `API_BASE_URL` / `VITE_API_BASE_URL` points at the real backend domain, not `localhost:4000`.

---

## 5. Production Readiness Checklist

- [ ] Backend built via `npm run build`, running compiled `dist/server.js` (not `ts-node` in production).
- [ ] `.env` populated from `.env.example`, with `CORS_ALLOWED_ORIGINS`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `ADMIN_JWT_SECRET` explicitly set to real production values (not the dev defaults).
- [ ] HTTPS terminated in front of both frontend and backend (reverse proxy, load balancer, or platform default).
- [ ] Frontend static build served with the correct production `API_BASE_URL`.
- [ ] Health check (`GET /health`) wired into your host's uptime monitoring.
- [ ] Log aggregation configured for backend stdout/stderr.
- [ ] Reviewed `Handoff_Notes.md` for pending business data that must be supplied before this is a fully "real" production system (inverter rate, GST/wiring rates, Off-Grid support, Government Notes copy).

---

## 6. What This Guide Does Not Cover

- CI/CD pipeline configuration (left to your team's existing tooling/conventions).
- Database provisioning — none exists yet; the Admin API's price store is
  in-memory only (see `Handoff_Notes.md` §3).
- Horizontal scaling/load balancing specifics — the backend is stateless per
  request (aside from the in-memory price store, which is a known limitation
  under multi-instance deployment — see `Handoff_Notes.md` §3) and can be
  replicated behind a load balancer once that limitation is addressed.
