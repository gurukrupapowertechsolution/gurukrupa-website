/**
 * controllers/admin.controller.ts
 *
 * Placeholder Admin Layer controller (Phase 7 §4, Doc 5 §8). Proves the
 * architecture can support future price-list management: reading the
 * current in-memory price list and applying partial updates to it.
 * Also exposes the persisted lead list for CRM/follow-up use.
 *
 * ⚠ SCOPE: The PRICE LIST is still in-memory only (see the header note in
 * config/runtimeConfigStore.ts). Leads are no longer — they are read from
 * MongoDB via services/leadStore.service.ts.
 * Sits behind `requireAdminAuth` — never mounted without it.
 */

import { Request, Response, NextFunction } from "express";
import { getPriceListSnapshot, updatePriceList } from "../config/runtimeConfigStore";
import { getLeads } from "../services/leadStore.service";

export function getPriceListController(_req: Request, res: Response) {
  res.status(200).json({ priceList: getPriceListSnapshot() });
}

export function updatePriceListController(req: Request, res: Response, _next: NextFunction) {
  const updated = updatePriceList(req.body);
  res.status(200).json({ message: "Price list updated.", priceList: updated });
}

/**
 * GET /api/v1/admin/leads
 *
 * Returns captured leads from MongoDB, NEWEST FIRST, capped at
 * ADMIN_LEADS_PAGE_SIZE (default 500). Optional query param: ?limit=n
 * (itself capped at 1000, so a bad value cannot pull the whole collection).
 *
 * For admin use only — never expose via a customer-facing endpoint.
 */
export async function getLeadsController(req: Request, res: Response, next: NextFunction) {
  try {
    const rawLimit = Number(req.query.limit);
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 1000) : undefined;

    const leads = await getLeads(limit);
    res.status(200).json({ count: leads.length, leads });
  } catch (err) {
    next(err);
  }
}
