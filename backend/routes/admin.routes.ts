/**
 * routes/admin.routes.ts
 *
 * Admin Layer routing (Phase 7 §4, Doc 5 §8).
 *
 *   POST /api/v1/admin/auth/login
 *     Body: { username, password } — public route, not behind requireAdminAuth.
 *     Returns a short-lived JWT (see controllers/adminAuth.controller.ts).
 *
 * Every route below this point sits behind `requireAdminAuth`, which expects
 * `Authorization: Bearer <token>` using the JWT returned by the login route.
 *
 *   GET /api/v1/admin/config/prices
 *     Returns the current in-memory price list snapshot.
 *
 *   PUT /api/v1/admin/config/prices
 *     Body: partial price-list patch (see validators/adminPriceList.schema.ts)
 *     Applies an in-memory update — proves the architecture supports future
 *     price-list management without recompiling the code (Doc 5 §21).
 *
 *   GET /api/v1/admin/leads
 *     Optional query: ?limit=n (default 500, hard cap 1000)
 *     Returns leads captured via the frontend Lead Capture modal, persisted
 *     in MongoDB via services/leadStore.service.ts, newest-first.
 */

import { Router } from "express";
import { requireAdminAuth } from "../middlewares/adminAuth.middleware";
import { validateBody } from "../middlewares/validateRequest.middleware";
import { priceListUpdateSchema } from "../validators/adminPriceList.schema";
import { adminLoginSchema } from "../validators/adminAuth.schema";
import { getPriceListController, updatePriceListController, getLeadsController } from "../controllers/admin.controller";
import { adminLoginController } from "../controllers/adminAuth.controller";

const router = Router();

router.post("/auth/login", validateBody(adminLoginSchema), adminLoginController);

router.use(requireAdminAuth);

router.get("/config/prices", getPriceListController);
router.put("/config/prices", validateBody(priceListUpdateSchema), updatePriceListController);
router.get("/leads", getLeadsController);

export default router;
