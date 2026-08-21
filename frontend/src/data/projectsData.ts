/**
 * src/data/projectsData.ts
 *
 * Task E — Structured local config for Projects and Clients data.
 *
 * This mirrors the business's real folder hierarchy conceptually:
 *   Dealer → Customer → Site Photos
 *
 * TODO (Future Integration Point):
 * The business stores project photos in Google Drive (Dealer → Customer → Site Photo
 * folder structure) and broader solar data in Odoo ERP. Before migrating to real
 * data, a scoping conversation is needed to:
 *   1. Obtain Google Drive API credentials and define OAuth scopes.
 *   2. Define the Odoo API endpoint, authentication, and data model mapping.
 *   3. Decide whether to poll on-demand (per page load) or pre-cache (build time).
 * Once integration is built, this file can be replaced by a fetcher that populates
 * the same ProjectEntry / ClientEntry shape programmatically — no UI code changes needed.
 */

export interface ProjectEntry {
  id: string;
  dealerName: string;
  customerName: string;
  projectSizeKw: number;
  location: string;
  systemType: "ON_GRID" | "HYBRID" | "OFF_GRID";
  /** Relative paths or remote URLs to site photos. Empty array = placeholder state. */
  photoPaths: string[];
  completedYear?: number;
}

export interface ClientEntry {
  id: string;
  name: string;
  location: string;
  logoPath?: string;
}

/**
 * PLACEHOLDER DATA — replace with real project records supplied by the business.
 * All entries below are structural placeholders matching the Dealer→Customer hierarchy.
 * TODO: Populate from Google Drive / Odoo once API credentials are available.
 */
export const PROJECTS: ProjectEntry[] = [
  {
    id: "proj-001",
    dealerName: "Placeholder Dealer",
    customerName: "Residential Client — Bhuj",
    projectSizeKw: 5,
    location: "Bhuj, Gujarat",
    systemType: "HYBRID",
    photoPaths: [],
    completedYear: 2024,
  },
  {
    id: "proj-002",
    dealerName: "Placeholder Dealer",
    customerName: "Commercial Client — Gandhidham",
    projectSizeKw: 20,
    location: "Gandhidham, Gujarat",
    systemType: "ON_GRID",
    photoPaths: [],
    completedYear: 2024,
  },
  {
    id: "proj-003",
    dealerName: "Placeholder Dealer",
    customerName: "Residential Client — Anjar",
    projectSizeKw: 3,
    location: "Anjar, Gujarat",
    systemType: "ON_GRID",
    photoPaths: [],
    completedYear: 2025,
  },
  {
    id: "proj-004",
    dealerName: "Placeholder Dealer",
    customerName: "Industrial Client — Mundra",
    projectSizeKw: 100,
    location: "Mundra, Gujarat",
    systemType: "ON_GRID",
    photoPaths: [],
    completedYear: 2025,
  },
  {
    id: "proj-005",
    dealerName: "Placeholder Dealer",
    customerName: "Residential Client — Madhapar",
    projectSizeKw: 7.5,
    location: "Madhapar, Gujarat",
    systemType: "HYBRID",
    photoPaths: [],
    completedYear: 2025,
  },
  {
    id: "proj-006",
    dealerName: "Placeholder Dealer",
    customerName: "Commercial Client — Rapar",
    projectSizeKw: 15,
    location: "Rapar, Gujarat",
    systemType: "ON_GRID",
    photoPaths: [],
    completedYear: 2025,
  },
];

/**
 * PLACEHOLDER CLIENT DATA — replace with real logos and names from the business.
 * TODO: Populate from Google Drive / Odoo once API credentials are available.
 */
export const CLIENTS: ClientEntry[] = [
  { id: "client-001", name: "Client Placeholder 1", location: "Bhuj, Gujarat" },
  { id: "client-002", name: "Client Placeholder 2", location: "Gandhidham, Gujarat" },
  { id: "client-003", name: "Client Placeholder 3", location: "Anjar, Gujarat" },
  { id: "client-004", name: "Client Placeholder 4", location: "Mundra, Gujarat" },
  { id: "client-005", name: "Client Placeholder 5", location: "Nakhatrana, Gujarat" },
  { id: "client-006", name: "Client Placeholder 6", location: "Rapar, Gujarat" },
  { id: "client-007", name: "Client Placeholder 7", location: "Mandvi, Gujarat" },
  { id: "client-008", name: "Client Placeholder 8", location: "Abdasa, Gujarat" },
  { id: "client-009", name: "Client Placeholder 9", location: "Lakhpat, Gujarat" },
];

/**
 * PHASE 2: Single source of truth for project images used in Carousel and Gallery.
 */
export const GALLERY_IMAGES = [
  { src: "/projects/1.jpeg", location: "Bhuj, Gujarat" },
  { src: "/projects/2.jpeg", location: "Mandvi, Gujarat" },
  { src: "/projects/3.jpeg", location: "Ludava, Gujarat" },
  { src: "/projects/4.jpeg", location: "Bhuj, Gujarat" },
  { src: "/projects/5.jpeg", location: "Kukma, Gujarat" },
  { src: "/projects/6.jpeg", location: "Mandvi, Gujarat" }
];
