/**
 * validators/adminAuth.schema.ts
 *
 * Shape validation for POST /api/v1/admin/auth/login.
 */

import { z } from "zod";

export const adminLoginSchema = z.object({
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "password is required"),
});

export type AdminLoginSchemaType = z.infer<typeof adminLoginSchema>;
