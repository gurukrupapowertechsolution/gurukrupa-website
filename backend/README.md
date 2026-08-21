# Gurukrupa Powertech Solutions — Enterprise Platform

Corporate website enhancement and quote automation system, built end-to-end
across 10 phases from requirements analysis through deployment preparation.

## Project Documents (Business Requirements — Source of Truth)
1. Document 1 — Website Requirements Specification
2. Document 2 — Product & Business Logic
3. Document 3 — Calculation Engine Specification
4. Document 4 — UI/UX Design Specification
5. Document 5 — Claude AI Development Specification

## Delivered Artifacts, by Phase

| Phase | Deliverable | File(s) |
|---|---|---|
| 1 | Project Analysis | (in-conversation) |
| 2 | Software Architecture | `Phase2-Software-Architecture.md` |
| 3 | UI/UX Design System | `Phase3-UIUX-Design-System.md` |
| 4 | Homepage | `Homepage.jsx` |
| 5 | Remaining Pages (Quotation, Projects, Clients, Brochure, Contact) | `RemainingPages.jsx` |
| 6 | Calculation Engine | `backend/calculation-engine/`, `backend/pricing-engine/`, `backend/config/`, `backend/types/`, `backend/validators/quotationValidator.ts`, `backend/services/`, `backend/errors/` |
| 7 | Backend API Layer | `backend/server.ts`, `backend/routes/`, `backend/controllers/`, `backend/middlewares/`, `backend/config/env.ts`, `backend/config/runtimeConfigStore.ts` |
| 8 | Frontend/Backend Integration | Updated `RemainingPages.jsx`, `Integration_Guide.md` |
| 9 | Quality Assurance | `QA_Audit_Report.md`, further-updated `Homepage.jsx` / `RemainingPages.jsx`, backend dedup fixes |
| 10 | Deployment Preparation | `Deployment_Guide.md`, `Handoff_Notes.md`, `backend/Dockerfile`, `backend/.gitignore`, `backend/.dockerignore`, tsconfig/server.ts hardening |

## Quick Start

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev              # http://localhost:4000

# Frontend — see Integration_Guide.md for full scaffolding steps
```

Full local setup: **`Integration_Guide.md`**
Production deployment: **`Deployment_Guide.md`**
Pending business data / next-team roadmap: **`Handoff_Notes.md`**

## System Summary

- **Products:** On Grid, Hybrid (IP 67 / IP 21), Off Grid (UI-present, "Coming
  Soon" — no calculation logic exists per Document 5 §22).
- **Quotation engine:** three isolated backend modules (Hybrid Night Backup,
  Hybrid Day Backup, On-Grid) implementing Document 3's formulas exactly, with
  full test coverage against Document 3's own worked examples.
- **Security boundary:** every formula, power factor, rate, and margin lives
  in backend-only config/calculation modules. The API returns only a
  sanitized `estimateCost` plus safe metadata — verified end-to-end from
  Phase 6 through the Phase 9 QA pass.
- **Accessibility:** WCAG 2.1 AA contrast verified by computed ratio (not
  visual inspection) across every text/background pairing in the design
  system; keyboard navigation, focus states, and ARIA labeling audited in
  Phase 9.
- **Extensibility:** Off-Grid, real inverter/GST pricing, and Hybrid capacity
  sizing are all pre-wired seams (typed, routed, documented) rather than
  missing pieces — see `Handoff_Notes.md` for exact file/line pointers.

## What Is NOT Yet Production-Complete

Per `Handoff_Notes.md`: real inverter pricing, GST/wiring rates, Off-Grid
calculations, persistent admin price storage, final Government Notes copy, and
client-approved brand colors. None of these block launching the currently
scoped On-Grid/Hybrid quotation flow — each is a flagged, intentional
placeholder, never an invented value.
