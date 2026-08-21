# Handoff Notes — For the Next Development Team

This document is a precise map of every place in the codebase where pending
business data or undefined logic must be supplied. Every item below was
deliberately left as a flagged placeholder rather than an invented value or
formula, per the project's core constraint (see `Document 5`, §21 and the
project instructions). Nothing here is a bug — it's a documented, intentional
gap awaiting business input.

---

## 1. Inverter Rate (Placeholder Pricing)

**What it is:** Document 3 §12 states inverter rates live in an external Excel
sheet that was never supplied. A flat placeholder value is used everywhere an
inverter cost is needed.

**Where to fix it:**
- `backend/config/priceListConfig.ts` — `INVERTER_RATE_PLACEHOLDER_RS` (default `15000`, env-overridable via `PRICE_INVERTER_RATE_PLACEHOLDER`).
- `backend/config/runtimeConfigStore.ts` — seeds `inverterRateRs` from the above at startup; can also be updated live via the Admin API (`PUT /api/v1/admin/config/prices`, see §3 below).

**What "done" looks like:** Once the business supplies real inverter rates
(likely varying by brand/capacity — UTL Solar, Solaryaan, Polycab — none of
which is currently modeled), you will need to:
1. Extend `PriceListConfig`/`runtimeConfigStore` from a single flat number to
   a lookup structure (e.g., by inverter brand + capacity).
2. Update `pricing-engine/pricingEngine.service.ts`'s Step 4 to look up the
   correct rate instead of calling `getInverterRate().rate` unconditionally.
3. Remove the `disclaimerNote` logic in `services/quotationService.ts` (the
   "provisional pricing" message) once `inverterRateIsPlaceholder` is
   permanently false for all cases.

---

## 2. GST / House Wiring Extra Rates

**What it is:** Document 3 §12 mentions "Extra Rates: House wiring rates, GST
extra" with **no formula or figure given anywhere** in Documents 1–3. This was
intentionally left inert rather than guessed.

**Where to fix it:**
- `backend/config/priceListConfig.ts` — `EXTRA_RATES_CONFIG` (`gstRs`, `houseWiringRs`, both default `0`, env-overridable via `PRICE_EXTRA_GST_RS` / `PRICE_EXTRA_HOUSE_WIRING_RS`).
- `backend/pricing-engine/pricingEngine.service.ts` — Step 5 already sums these into the final estimate; no code change needed once real values/formulas exist, **unless** the real rule is more complex than a flat addition (e.g., GST as a percentage of subtotal rather than a fixed rupee amount) — in that case, Step 5 will need a real formula, not just new constants.

**What "done" looks like:** Business confirms either (a) flat rupee figures, in
which case just set the two env vars, or (b) a percentage-based GST rule, in
which case `pricingEngine.service.ts` needs a small logic change (not just a
config change) — flag this distinction to whoever picks this up.

---

## 3. Admin API — In-Memory Price Store (Not Persisted)

**What it is:** The placeholder Admin API (`PUT /api/v1/admin/config/prices`)
updates prices at runtime, but the store backing it resets on every process
restart or redeploy.

**Where it lives:**
- `backend/config/runtimeConfigStore.ts` — the entire mutable state object.
- `backend/middlewares/adminAuth.middleware.ts` / `backend/controllers/adminAuth.controller.ts` — admin auth is now a real JWT login flow (`POST /api/v1/admin/auth/login` with `username`/`password`, checked against `ADMIN_USERNAME`/`ADMIN_PASSWORD_HASH`; issues a JWT signed with `ADMIN_JWT_SECRET` that subsequent admin routes require as `Authorization: Bearer <token>`). There is still only a single admin account defined via env vars — no user table exists. Generate the password hash with `npm run hash-password -- "the-real-password"`.

**What "done" looks like:** Wire `runtimeConfigStore.ts`'s getters/setters to a
real persistence layer (a `price_list` database table is the natural fit, per
Document 5 §17). The function signatures (`getBatteryRate`, `getStructureRatePerKw`,
`getInverterRate`, `getExtraRates`, `updatePriceList`) are already the exact
seam to swap — nothing calling into this module needs to change.

---

## 4. Off-Grid Product Line (No Calculation Logic Exists)

**What it is:** Document 5 §22 explicitly confirms: "The Off Grid column exists
in the UI, but calculation logic for it is entirely omitted for now." This is
not a bug to fix — it's a feature to build once the business defines it.

**Where the seam is:**
- **Frontend:** `RemainingPages.jsx` — the `TypeOption` for "Off Grid" is rendered `disabled` with a "Coming Soon" badge (search for `disabled badge="Coming Soon"`). Homepage's Off Grid product card similarly routes to Contact instead of the quotation flow.
- **Backend routing:** `backend/calculation-engine/calculationRouter.service.ts` — the `OFF_GRID` case in the `switch` statement throws `AppError("OFF_GRID_NOT_SUPPORTED", ...)`. This is the **single** place that rejection happens (consolidated in QA Phase 9).
- **Backend types:** `backend/types/quotation.types.ts` — `ProductType` already includes `"OFF_GRID"` as a valid enum value, so the type system is ready; no interface changes needed to add support.
- **Product data:** `Document 2` §10 (Off-Grid Product Portfolio) is entirely placeholder — no panels, inverters, or compatibility rules exist yet in `Document 2`, `Document 3`, or `Document 4`.

**What "done" looks like, in order:**
1. Business supplies Off-Grid product specs (equivalent to what Document 2 §8–9 gives for On-Grid/Hybrid) and the calculation formulas (equivalent to Document 3 §11 Modules A/B/C).
2. Add `backend/calculation-engine/modules/offGrid.module.ts` following the exact pattern of the three existing modules (pure function, Doc-referenced comments, no shared state).
3. Add an `OFF_GRID` case to `calculationRouter.service.ts` that calls the new module instead of throwing.
4. Extend `quotationValidator.ts` and `quotationRequest.schema.ts` to accept Off-Grid-specific input fields (mirroring how `ON_GRID`/`HYBRID` branches already work).
5. Extend `pricingEngine.service.ts` if Off-Grid needs new price components (e.g., a different battery/inverter combination) — check with the business before assuming it reuses the existing battery/structure rates.
6. Frontend: remove the `disabled` prop from the Off-Grid `TypeOption`, and build the Off-Grid-specific form fields (whatever they turn out to be) following the same pattern as the existing Hybrid/On-Grid conditional sections in `QuotationPage`.

---

## 5. Hybrid System Capacity — Documented Gap (Approved, Not Yet Resolved)

**What it is:** flagged and explicitly approved during Phase 6 — Document 3
provides no formula that derives the Hybrid system's solar capacity (kW) from
appliance load. Module B only validates a *given* capacity's daytime running
load; it doesn't size the system.

**Where it lives:**
- `backend/types/quotation.types.ts` — `hybridSystemCapacityKw` is an optional field on `QuotationRequest`, with a comment explaining the gap.
- `backend/calculation-engine/calculationRouter.service.ts` — the Hybrid path simply omits the structure/installation cost component if this field is absent.

**What "done" looks like:** Business defines a sizing rule (likely: map total
connected load or backup requirement to one of the fixed product-line
capacities from Document 2 — 3/5/7.5/10 kW for IP 67, 3.5/6.5 kW for IP 21).
Once defined, implement it as a new, clearly-commented function — do not
silently fold it into Module A or B, since neither owns "capacity sizing" as a
responsibility today.

---

## 6. Government Notes (Static Content, Not Code)

**What it is:** Document 1 §17.6 and Document 4 §12.4 require a Government
Notes panel in the Get Quotation UI. No copy has ever been supplied.

**Where to paste the real text:**
- `RemainingPages.jsx` — inside `QuotationPage`, search for the block with the
  heading `Government Notes`. The current placeholder paragraph reads:
  > "Placeholder — official government notes and subsidy information will be
  > published here once provided by the business."

  Replace that `<p>` element's text content directly. No other code changes
  are needed — the styled Callout/Alert container is already built per
  Document 4 §12.4's spec (Secondary/Neutral color, visually separated from
  the interactive calculator).

- If the copy needs to be editable without a code deploy (recommended for
  wording business staff will want to tweak), wire it to the lightweight
  Headless CMS / structured content approach described in Document 5 §14
  instead of hardcoding it — that architecture was planned for but not built
  in this project's scope.

---

## 7. BOS Details, Warranty Details, Inverter Capacities

**What it is:** Document 1 §17.2 and Document 2 §8/§14 mark BOS (Balance of
System) specs, warranty terms, and detailed inverter capacities (beyond brand
names) as pending.

**Where they'd surface:** These are **content/display-only** gaps, not
calculation gaps — they belong on the Products page (`Homepage.jsx`'s product
cards, and any future dedicated Products page built out from
`RemainingPages.jsx`'s pattern). No backend calculation currently depends on
these values. When supplied, add them as additional fields to the product card
content — no architectural change required.

---

## 8. Brand Colors & Typography (Design, Not Business Logic)

**What it is:** Document 4 §9–10 and §22 state no colors/fonts were ever
client-mandated; Phase 3's palette (solar gold `#F5A623` / deep trust blue
`#0A2540`, Space Grotesk + Inter) is a recommendation pending sign-off.

**Where to update:** Every color is a CSS custom property defined once at the
top of each component's `<style>` block (`--color-primary`, `--color-secondary`,
etc. — see the `GlobalStyles` component in `RemainingPages.jsx` and the
equivalent block in `Homepage.jsx`). Approving a final palette requires editing
**only these variable declarations** — no component-level changes, since every
component references the tokens, never raw hex values (with the sole
intentional exception of the QA-Phase-9 accessible-contrast overrides —
`--color-primary-text`, used for eyebrow labels on light backgrounds; keep that
one separately tunable if the approved gold changes, since it may need its own
independent contrast recalculation).

---

## 9. Quick Reference Table

| Gap | File(s) | Type | Blocking? |
|---|---|---|---|
| Inverter rate | `priceListConfig.ts`, `runtimeConfigStore.ts`, `pricingEngine.service.ts` | Pricing data | No — placeholder works, flagged to user via `disclaimerNote` |
| GST/wiring extras | `priceListConfig.ts`, `pricingEngine.service.ts` | Pricing data + possible formula | No — reserved at 0 |
| Admin price persistence | `runtimeConfigStore.ts` | Infra (DB needed) | No — in-memory works for single-instance deployment |
| Off-Grid calculations | New module + router + validator + frontend | Full feature | No — UI clearly marks "Coming Soon" |
| Hybrid capacity sizing rule | `quotation.types.ts`, `calculationRouter.service.ts` | Formula (approved gap) | No — pricing simply omits structure cost when absent |
| Government Notes copy | `RemainingPages.jsx` | Static content | No — placeholder text is honest about its own status |
| BOS/Warranty/Inverter capacity | Product display components | Static content | No — purely informational |
| Brand colors/typography | CSS custom properties, both `.jsx` files | Design | No — current tokens are usable, pending approval |

**Nothing in this list blocks a production launch of the currently-scoped
features** (On-Grid and Hybrid quotation, with clearly-labeled provisional
pricing). Each item is a planned enhancement, not a defect.
