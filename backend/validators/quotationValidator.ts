/**
 * validators/quotationValidator.ts
 *
 * Validates and sanitizes incoming QuotationRequest payloads before they
 * reach any business logic or calculation module.
 *
 * Source: Document 3 §16 (Validation Rules — largely unspecified/placeholder
 * in the source docs), Document 5 §12 & §15 (input sanitization requirement).
 *
 * Doc 3 §16 explicitly leaves precise validation thresholds as a placeholder
 * ("Explicit validation rules... are not provided"). The checks below are
 * therefore limited to structural/type-safety validation (required fields,
 * non-negative numbers, known enum values) — NOT business-rule invention
 * (e.g., no invented minimum bill amount). Anything beyond structural safety
 * is intentionally left for future business clarification.
 */

import { isValidApplianceId } from "../config/applianceConstants";
import { QuotationRequest, LeadInfo } from "../types/quotation.types";
import { AppError } from "../errors/AppError";

export function validateQuotationRequest(payload: unknown): QuotationRequest {
  if (typeof payload !== "object" || payload === null) {
    throw new AppError("INVALID_PAYLOAD", "Request payload must be a JSON object.");
  }

  const body = payload as Record<string, unknown>;

  if (body.productType !== "ON_GRID" && body.productType !== "HYBRID" && body.productType !== "OFF_GRID") {
    throw new AppError("INVALID_PRODUCT_TYPE", "productType must be ON_GRID, HYBRID, or OFF_GRID.");
  }

  // Parse the optional lead object — shared across all product-type paths.
  const lead = sanitizeLead(body.lead);

  if (body.productType === "OFF_GRID") {
    // Structurally valid, but not yet routable — see calculationRouter.service.ts.
    return { productType: "OFF_GRID", lead };
  }

  if (body.productType === "HYBRID") {
    const applications = body.applications;
    if (!Array.isArray(applications) || applications.length === 0) {
      throw new AppError("MISSING_APPLICATIONS", "At least one application entry is required for Hybrid.");
    }

    const sanitizedApplications = applications.map((entry, index) => {
      if (typeof entry !== "object" || entry === null) {
        throw new AppError("INVALID_APPLICATION_ENTRY", `Application entry at index ${index} is malformed.`);
      }
      const { applianceId, quantity } = entry as Record<string, unknown>;
      if (typeof applianceId !== "string" || !isValidApplianceId(applianceId)) {
        throw new AppError("UNKNOWN_APPLIANCE", `Unknown applianceId at index ${index}: "${String(applianceId)}".`);
      }
      if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
        throw new AppError("INVALID_QUANTITY", `Quantity at index ${index} must be a positive number.`);
      }
      return { applianceId, quantity };
    });

    const backupHoursDay = normalizeOptionalNonNegativeNumber(body.backupHoursDay, "backupHoursDay");
    const backupHoursNight = normalizeOptionalNonNegativeNumber(body.backupHoursNight, "backupHoursNight");

    if (backupHoursDay === null && backupHoursNight === null) {
      throw new AppError("MISSING_BACKUP_PREFERENCE", "At least one of backupHoursDay or backupHoursNight is required.");
    }

    const hybridSystemCapacityKw = normalizeOptionalNonNegativeNumber(
      body.hybridSystemCapacityKw,
      "hybridSystemCapacityKw"
    );

    return {
      productType: "HYBRID",
      applications: sanitizedApplications,
      backupHoursDay,
      backupHoursNight,
      hybridSystemCapacityKw: hybridSystemCapacityKw ?? undefined,
      batteryType: body.batteryType === "V51_2_AH100" || body.batteryType === "V25_2_AH100" ? body.batteryType : undefined,
      lead,
    };
  }

  // ON_GRID
  if (body.phase !== "1_PHASE" && body.phase !== "3_PHASE") {
    throw new AppError("INVALID_PHASE", "phase must be 1_PHASE or 3_PHASE.");
  }

  const lightBill = body.lightBill;
  if (typeof lightBill !== "object" || lightBill === null) {
    throw new AppError("MISSING_LIGHT_BILL", "lightBill with peak and bottom amounts is required for On-Grid.");
  }
  const { peak, bottom } = lightBill as Record<string, unknown>;
  if (typeof peak !== "number" || !Number.isFinite(peak) || peak < 0) {
    throw new AppError("INVALID_PEAK_BILL", "lightBill.peak must be a non-negative number.");
  }
  if (typeof bottom !== "number" || !Number.isFinite(bottom) || bottom < 0) {
    throw new AppError("INVALID_BOTTOM_BILL", "lightBill.bottom must be a non-negative number.");
  }

  return {
    productType: "ON_GRID",
    phase: body.phase,
    lightBill: { peak, bottom },
    lead,
  };
}

/**
 * Sanitizes the optional lead object from the raw request body.
 * Validates structural integrity only (no invented business rules):
 * if the object is present, all three sub-fields must be non-empty strings.
 * Returns undefined when the object is absent — callers treat this as
 * "visitor did not provide contact details" and skip lead recording.
 */
function sanitizeLead(raw: unknown): LeadInfo | undefined {
  if (raw === undefined || raw === null) return undefined;

  if (typeof raw !== "object") {
    throw new AppError("INVALID_LEAD", "lead must be an object if provided.");
  }

  const { name, whatsapp, city } = raw as Record<string, unknown>;

  if (typeof name !== "string" || name.trim() === "") {
    throw new AppError("INVALID_LEAD_NAME", "lead.name must be a non-empty string.");
  }
  if (typeof whatsapp !== "string" || whatsapp.trim() === "") {
    throw new AppError("INVALID_LEAD_WHATSAPP", "lead.whatsapp must be a non-empty string.");
  }
  if (typeof city !== "string" || city.trim() === "") {
    throw new AppError("INVALID_LEAD_CITY", "lead.city must be a non-empty string.");
  }

  return { name: name.trim(), whatsapp: whatsapp.trim(), city: city.trim() };
}

function normalizeOptionalNonNegativeNumber(value: unknown, fieldName: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new AppError("INVALID_FIELD", `${fieldName} must be a non-negative number if provided.`);
  }
  return value;
}
