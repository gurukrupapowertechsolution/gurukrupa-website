/**
 * Single source of truth for Gurukrupa's business-facing details.
 *
 * These values were previously typed by hand at each render site, which is how
 * the site ended up serving three different phone numbers (…76172 in the header,
 * footer and contact card, …76717 in the footer's WhatsApp link, and a leftover
 * placeholder 8149718106 on both floating WhatsApp buttons) and two different
 * addresses. Import from here rather than re-typing — one edit now propagates
 * everywhere.
 *
 * PHONE_TEL / WHATSAPP_NUMBER are the digit-only forms the `tel:` and `wa.me`
 * schemes require; PHONE_DISPLAY is the human-readable form and the only one
 * that should ever appear in copy.
 */

/* ── Contact ─────────────────────────────────────────────────────────────── */

export const PHONE_DISPLAY = '+91 97259 76717';
export const PHONE_TEL = '+919725976717';
export const PHONE_HREF = `tel:${PHONE_TEL}`;

/** wa.me requires country code, no `+`, no spaces. */
export const WHATSAPP_NUMBER = '919725976717';
export const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}`;

export const EMAIL = 'sagarbhimani001@gmail.com';
export const EMAIL_HREF = `mailto:${EMAIL}`;

export const WORKING_HOURS = '9:00 AM – 7:00 PM';
export const WORKING_DAYS = 'Monday to Saturday';
/** Compact form for the footer / side-panel contact strips. */
export const WORKING_HOURS_SHORT = '9 AM – 7 PM, Mon–Sat';

/* ── Address ─────────────────────────────────────────────────────────────── */

export const COMPANY_NAME = 'Gurukrupa Powertech Solutions';

/** Rendered one line per array entry in the contact card and footer. */
export const ADDRESS_LINES = [
  'Shop No 22, City Center Complex',
  'Near Nad Circle, Junavas, Madhapar',
  'Bhuj, Gujarat 370001',
];

/** Flattened form for single-line contexts (meta tags, schema.org, links). */
export const ADDRESS_FULL = ADDRESS_LINES.join(', ');

/* ── Experience ──────────────────────────────────────────────────────────── */

/* Two distinct figures that were being conflated: the parent electrical
   business is 28 years old, the solar arm is 5. Copy must carry both, with the
   28 leading — it is the credibility claim. */

export const ENGINEERING_YEARS = 28;
export const SOLAR_YEARS = 5;

export const EXPERIENCE_HEADLINE = `${ENGINEERING_YEARS} Years of Engineering Legacy, ${SOLAR_YEARS} Years of Solar Excellence`;

/** Stat-tile form: big number + supporting label. */
export const EXPERIENCE_STAT_VALUE = `${ENGINEERING_YEARS} yrs`;
export const EXPERIENCE_STAT_LABEL = `Engineering legacy · ${SOLAR_YEARS} yrs in solar`;

/** One-line form for footers, side panels and other tight strips. */
export const EXPERIENCE_TAGLINE = `${ENGINEERING_YEARS} years of engineering legacy, ${SOLAR_YEARS} years of solar excellence — powering Gujarat with premium commercial and residential solar.`;
