/**
 * Imagery for the standalone /about, /why-solar and /faq pages.
 *
 * ── Sourcing rules (Phase 2) ──────────────────────────────────────────────
 *
 * 1. PROJECT PHOTOGRAPHS ARE RESERVED.
 *    Gurukrupa's own installation photographs — /projects/gallery/**, indexed
 *    by galleryImages.json — appear in exactly two places on this site: the
 *    "Recent installations" carousel on the homepage and the /projects gallery
 *    page. Nowhere else. Not the hero, not /about, not /why-solar, not /faq,
 *    and not as an error fallback.
 *
 *    The previous revision of this file broke that rule six times over
 *    (SONI_ELE_DAYAPAR__004 and __012, Sikander_bhai__006,
 *    JAYESH_BHANUSHALI__003, Raj_bhagat__005, IRSHAD_BHAI__002) plus
 *    BHARAT__001 as a site-wide fallback. All seven are gone. Do not
 *    reintroduce them: the gallery is the proof, and proof loses its force
 *    when it is also used as decoration.
 *
 * 2. EVERY IMAGE IS USED EXACTLY ONCE, SITE-WIDE.
 *    Not once per page — once, full stop. Before adding an id here, grep the
 *    whole of src/ for it. The three ids this file used to re-export were each
 *    already in service elsewhere (two in the homepage hero deck, one on a blog
 *    post), so three images were rendering twice each.
 *
 *    This is also why there is no shared IMAGE_FALLBACK any more. A single
 *    fallback graphic is by definition used many times, so it cannot satisfy
 *    this rule. Render sites use `hideOnImageError` below instead: a CDN miss
 *    hides the <img> and leaves the navy plate its container already paints.
 *
 * 3. REAL PHOTOGRAPHS ONLY — and every one below was actually looked at.
 *    No AI frames, no 3D renders, no vector illustration. Each id here was
 *    downloaded from the CDN and visually inspected before being committed.
 *    That check is not optional and not a formality: of the candidates
 *    reviewed for this pass, one plausible "modern house with solar panels"
 *    result turned out to be a 3D rendering and another set turned out to be
 *    Unsplash+ (paid licence, plus.unsplash.com) rather than free. Both would
 *    have shipped had the ids been taken on the strength of their alt text.
 *
 * 4. FREE LICENCE ONLY. images.unsplash.com/photo-… is the free tier.
 *    plus.unsplash.com/premium_photo-… is not; never hot-link it.
 */

const unsplash = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=75`;

/* ── /about ───────────────────────────────────────────────────────────────
   The through-line is craft: hands, tools and standards rather than finished
   arrays. The finished arrays are what the gallery is for, and this page is
   about the people who put them there. */

/** Reviewed: worker in a yellow hard hat torquing a module clamp on a large
 *  rooftop array, low warm sun raking across the glass. */
const INSTALLER_CLAMPING_MODULE = unsplash('1719848576338-9516ba7ccd8b');

/** Reviewed: close crop of gloved hands driving a screwdriver into the rail
 *  between two modules. Reads as workmanship, not as a product shot. */
const GLOVED_HANDS_ON_RAIL = unsplash('1668097613572-40b7c11c8727');

/* A third entry, `standards` — a white hard hat resting on a blue array
   (id 1648135327756-b606e2eb8caa) — used to live here and render as an inset
   photograph in the /about story column. Both the entry and its render site are
   gone. It is recorded here rather than silently dropped because rule 2 makes
   this file the register of what is in service: the id is now free, and this note
   is what stops someone re-adding it under the impression it was never reviewed.
   Deleting the export as well as the usage is deliberate — an unused image
   constant is an invitation to reuse it somewhere and quietly break rule 2. */

export const ABOUT_IMAGES = {
  masthead: {
    src: INSTALLER_CLAMPING_MODULE,
    alt: 'Solar technician in a hard hat tightening a module clamp on a rooftop array',
  },
  craft: {
    src: GLOVED_HANDS_ON_RAIL,
    alt: 'Gloved hands fixing a solar module to its mounting rail with a power screwdriver',
  },
};

/* ── Homepage sections (Phase 2) ───────────────────────────────────────────
   Two homepage sections that previously carried no photography: the About
   teaser under the hero, and the FAQ band (whose accordion sat in a 768px
   column with the full container gutter empty on both sides).

   Rule 3 earned its keep here. Forty candidate ids were rendered to a contact
   sheet and inspected before these three were kept: ten were dead links, and of
   the rest the majority that read as "solar" from their id turned out to be
   wind turbines — onshore at sunset, offshore in open water — exactly the trap
   this file warns about. Everything below was looked at. */

/** Reviewed: a ground-mounted array running away from the camera across grass,
 *  under a tall bank of broken cloud. The most editorial of the candidates —
 *  dramatic sky, clear modules, nothing cropped awkwardly. */
const ARRAY_UNDER_BROKEN_CLOUD = unsplash('1509391366360-2e959784a276');

/* Phase 2 — the FAQ band used to carry a stacked pair of hardware photographs:
   ARRAY_WITH_TREELINE (id 1566093097221-ac2335b09e70) for the generation
   questions and TRANSMISSION_LINES_AT_SUNSET (id 1473341304170-971dccb5ac1e)
   for the net-metering ones. Both are gone, and both ids are free again.

   They were answering the wrong question. An FAQ list is not about hardware, it
   is about the person who does not yet understand the hardware — so the section
   now leads with that person instead of with another array. */

/** Reviewed: a young woman against a whitewashed brick wall, one hand at her
 *  chin, looking up and away mid-thought. Real photograph, natural light, free
 *  tier (images.unsplash.com).
 *
 *  Chosen over the other candidate reviewed for this slot — same pose, but shot
 *  against a hard-edged teal/coral/yellow geometric backdrop, which fights the
 *  navy-and-gold palette everywhere it would appear and reads as generic stock.
 *  This frame is muted enough to sit inside the page's own colour scheme, and
 *  the open wall to the right of her leaves room for a label chip. */
const WOMAN_THINKING_AT_BRICK_WALL = unsplash('1758521540744-83f97766e971');

export const HOME_IMAGES = {
  aboutTeaser: {
    src: ARRAY_UNDER_BROKEN_CLOUD,
    alt: 'A ground-mounted solar array stretching across grassland under a cloudy sky',
  },
  /* ⚠ DELIBERATE EXCEPTION TO RULE 2 (one image, one site-wide use).
     This id renders twice: the homepage FAQ band and the /faq masthead. That is
     a direct instruction — the same face is meant to mark "this is the place
     your questions get answered" in both locations, so the repetition is the
     point rather than an oversight. It is the only exception in this file; do
     not treat it as precedent for a third use. */
  faq: {
    src: WOMAN_THINKING_AT_BRICK_WALL,
    alt: 'A young woman resting her chin on her hand, looking up thoughtfully against a whitewashed brick wall',
  },
};

/* ── /why-solar ───────────────────────────────────────────────────────────
   One image per argument: the resource, the bill it replaces, the emissions it
   displaces. */

/** Reviewed: a long row of ground-mounted arrays silhouetted against a deep
 *  magenta-to-orange sunset. Dark enough to carry white masthead copy. */
const ARRAY_AT_SUNSET = unsplash('1463173904305-ba479d2123b7');

/** Reviewed: tilted arrays receding to the horizon under a wide blue sky
 *  streaked with cirrus, on dry open ground. The closest frame reviewed to what
 *  the Gujarat resource actually looks like. */
const ARRAY_UNDER_OPEN_SKY = unsplash('1508514177221-188b1cf16e9d');

/** Reviewed: five weathered analogue electricity meters wired across a painted
 *  brick wall. Deliberately unglamorous — it is the thing being replaced. */
const METERS_ON_BRICK_WALL = unsplash('1555009784-ae7e7d1b97aa');

/** Reviewed: ground-mounted modules stepping down a wooded hillside under
 *  broken cloud. Generation sitting inside a landscape rather than paving it. */
const ARRAY_ON_WOODED_HILLSIDE = unsplash('1592833159057-6faf163494a9');

export const WHY_SOLAR_IMAGES = {
  masthead: {
    src: ARRAY_AT_SUNSET,
    alt: 'Rows of solar panels silhouetted against a deep orange sunset sky',
  },
  irradiance: {
    src: ARRAY_UNDER_OPEN_SKY,
    alt: 'Rows of tilted solar panels stretching to the horizon under a wide blue sky',
  },
  bill: {
    src: METERS_ON_BRICK_WALL,
    alt: 'A row of old analogue electricity meters mounted on a brick wall',
  },
  environment: {
    src: ARRAY_ON_WOODED_HILLSIDE,
    alt: 'Solar panels installed on a wooded hillside beneath broken cloud',
  },
};

/* ── /faq ─────────────────────────────────────────────────────────────────
   Phase 2 — this was the underside of an architectural photovoltaic canopy
   (id 1491677533189-49af044391ed, now free), used as pure masthead texture at
   34% opacity behind a near-opaque scrim. It has been replaced by the same
   portrait the homepage FAQ band uses, and the treatment changed with it: a
   photograph of a person is worth actually seeing, so the scrim now clears the
   right-hand third rather than flattening the whole frame. See the rule 2
   exception noted on HOME_IMAGES.faq. */
export const FAQ_HERO_IMAGE = WOMAN_THINKING_AT_BRICK_WALL;

/**
 * Shared <img onError> handler.
 *
 * Replaces the old IMAGE_FALLBACK constant, which pointed at one of Gurukrupa's
 * own installation photographs and therefore broke both rule 1 (a project
 * photograph outside the gallery) and rule 2 (one file standing in at every
 * render site at once).
 *
 * Every render site paints a navy plate on the image's container, so hiding a
 * failed <img> degrades to a flat brand-coloured panel rather than to a broken
 * image icon. `visibility` rather than `display` so the container keeps the
 * space it reserved and the layout does not jump.
 */
export function hideOnImageError(event) {
  event.currentTarget.style.visibility = 'hidden';
}
