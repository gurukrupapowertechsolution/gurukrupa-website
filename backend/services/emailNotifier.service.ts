/**
 * services/emailNotifier.service.ts
 *
 * Task B — Lead email notification.
 *
 * Sends a plain-text email to LEAD_NOTIFY_EMAIL whenever a lead is captured.
 * Uses nodemailer with SMTP credentials from environment variables.
 *
 * CRITICAL SAFETY RULES:
 *   1. If any SMTP credential is missing, log a warning and skip — NEVER crash.
 *   2. If sending fails, log the error and continue — services/leadStore.service.ts
 *      has already persisted the record (MongoDB, or the on-disk fallback);
 *      email is supplementary, not the source of truth.
 *   3. This function is fire-and-forget: callers should NOT await it (it returns
 *      void). Use .catch() only to suppress unhandled-promise warnings.
 *
 * LEAD_NOTIFY_EMAIL default: sagarbhimani001@gmail.com (per current instruction).
 * ⚠ TODO: A staff member named "Jyoti" was mentioned by the business as the
 *   intended lead recipient, but no email address was provided for her.
 *   Update LEAD_NOTIFY_EMAIL in .env once her email address is confirmed.
 */

import { getEnvString, getEnvNumber } from "../config/env";
import { StoredLead } from "../types/quotation.types";

// Lazy import of nodemailer to avoid a hard startup crash if the package
// is somehow not installed in a stripped production build.
let nodemailerModule: typeof import("nodemailer") | null = null;

async function getNodemailer() {
  if (!nodemailerModule) {
    nodemailerModule = await import("nodemailer");
  }
  return nodemailerModule;
}

/**
 * Sends a lead notification email. Fire-and-forget — do not await.
 * Never throws; all errors are caught and logged internally.
 */
export async function sendLeadNotificationEmail(lead: StoredLead): Promise<void> {
  const smtpHost = getEnvString("SMTP_HOST", "");
  const smtpUser = getEnvString("SMTP_USER", "");
  const smtpPass = getEnvString("SMTP_PASS", "");
  const notifyEmail = getEnvString("LEAD_NOTIFY_EMAIL", "sagarbhimani001@gmail.com");
  const smtpPort = getEnvNumber("SMTP_PORT", 587);

  // Guard: skip silently if credentials are not configured.
  if (!smtpHost || !smtpUser || !smtpPass) {
    // eslint-disable-next-line no-console
    console.warn(
      "[LeadNotifier] SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not fully set. " +
      "Lead email notification skipped. The lead itself is safely persisted. " +
      "Set these in .env to enable email delivery."
    );
    return;
  }

  try {
    const nodemailer = await getNodemailer();
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for port 465 (SSL), false for 587 (STARTTLS).
      auth: { user: smtpUser, pass: smtpPass },
    });

    const estimateFormatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(lead.estimateCostRs));

    await transporter.sendMail({
      from: `"Gurukrupa Powertech — Lead Alert" <${smtpUser}>`,
      to: notifyEmail,
      subject: `New Solar Lead: ${lead.name} (${lead.city})`,
      text: [
        "A new lead has been captured via the Gurukrupa Powertech Solutions website.",
        "",
        `Name:         ${lead.name}`,
        `WhatsApp:     ${lead.whatsapp}`,
        `City:         ${lead.city}`,
        `Product Type: ${lead.productType.replace("_", " ")}`,
        `Estimate:     ${estimateFormatted}`,
        `Timestamp:    ${lead.timestamp}`,
        `Lead ID:      ${lead.id}`,
        "",
        "This lead is also stored in the admin dashboard at GET /api/v1/admin/leads.",
      ].join("\n"),
    });

    // eslint-disable-next-line no-console
    console.log(`[LeadNotifier] Email sent to ${notifyEmail} for lead ${lead.id}`);
  } catch (err) {
    // Log but never propagate — email failure must not affect the quotation flow.
    // eslint-disable-next-line no-console
    console.error("[LeadNotifier] Failed to send lead notification email:", err);
  }
}
