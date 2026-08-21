import React, { useState, useMemo, useCallback } from 'react';
import galleryImages from '../data/galleryImages.json';
import ProjectLightbox from '../components/ProjectLightbox';

/* Phase 3 — was 24, sized for a ~316-image library. The curated set is now 46
   and the tiles render considerably larger, so 24 was both most of the gallery
   in one go and a very long first paint. 12 fills three rows at the common
   desktop width and leaves the Load More button doing real work. */
const IMAGES_PER_PAGE = 12;

export default function ProjectsGallery() {
  const [visibleCount, setVisibleCount] = useState(IMAGES_PER_PAGE);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Visible slice for pagination
  const visibleImages = useMemo(
    () => galleryImages.slice(0, visibleCount),
    [visibleCount]
  );

  const hasMore = visibleCount < galleryImages.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + IMAGES_PER_PAGE);
  }, []);

  const openLightbox = useCallback((index) => {
    setLightboxIndex(index);
  }, []);

  return (
    <div className="gps-root min-h-screen w-full bg-[#F4F6FB] pt-24 pb-20">
      <style>{`
        .gps-root {
          --color-primary: #F5A623;
          --color-primary-dark: #D98D0F;
          --color-primary-text: #9C6509;
          --color-secondary: #0A2540;
          --color-bg: #F4F6FB;
          --color-text: #1C1F26;
          --color-text-muted: #5A6270;
          --color-border: #E2E5EA;
          --glow-gold: rgba(245,166,35,0.22);
          --glow-gold-strong: rgba(245,166,35,0.38);
          --shadow-card: var(--elev-2);
          --shadow-card-hover: var(--elev-4);
        }
        .bg-primary-token { background: var(--color-primary); }
        .text-primary-token { color: var(--color-primary); }
        .text-eyebrow-token { color: var(--color-primary-text); }
        .text-secondary-token { color: var(--color-secondary); }
        .text-muted-token { color: var(--color-text-muted); }
        .border-token { border-color: var(--color-border); }
        .focus-ring:focus-visible { outline: 2.5px solid var(--color-primary); outline-offset: 2px; }

        /* Premium card hover — matching Homepage treatment */
        .gallery-tile {
          transition: transform .32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow .32s ease, border-color .32s ease;
          box-shadow: var(--shadow-card);
        }
        .gallery-tile:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow:
            var(--shadow-card-hover),
            var(--ring-gold),
            var(--glow-gold-soft);
          border-color: rgba(245,166,35,0.4) !important;
        }
        /* A photograph filling its tile edge to edge has no lit bevel of its
           own, so the inner hairline supplies the raised edge instead. */
        .gallery-tile::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.30);
          pointer-events: none;
          z-index: 1;
        }

        /* Button hover — Phase 1 global 2-color style */
        .btn-primary-token {
          background: var(--color-primary);
          color: var(--color-secondary);
          transition: all .3s ease;
          box-shadow: 0 4px 16px rgba(245,166,35,0.19);
          border: 1px solid transparent;
        }
        .btn-primary-token:hover {
          background: var(--color-secondary);
          color: var(--color-primary);
          border: 1px solid var(--color-primary);
          box-shadow: 0 4px 16px rgba(245,166,35,0.19);
          transform: translateY(-2px) scale(1.02);
        }
        .btn-primary-token:active { transform: scale(0.98); }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .gallery-tile, .btn-primary-token {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="container-site">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">Our Work</p>
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-token mb-4" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
            Recent Installations
          </h1>
          <p className="text-muted-token max-w-2xl text-lg leading-relaxed">
            A selection of our recent residential and commercial solar installations across
            Gujarat — every one designed, installed and commissioned by our own team.
          </p>
        </div>

        {/* Phase 3 — NO COUNTS ANYWHERE ON THIS PAGE.
            Not in the header, not on the Load More button, not as an "x of y"
            progress line. The library was curated down from 316 images to 46,
            and a visible total invites exactly the comparison that makes a
            smaller, better-chosen gallery look like a diminished one. What
            matters is the work in each frame, and a count adds nothing a visitor
            acts on — they scroll until they have seen enough. The button says
            what it does and nothing else. */}

        {/* Responsive grid. Phase 3 — one column fewer at every breakpoint
            (was 2/3/4/5/6): with 46 photographs rather than 316, the page can
            afford to show each one properly, and the previous six-across grid
            rendered thumbnails barely 240px wide on a 1920px display. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-5 md:gap-7">
          {visibleImages.map((img, i) => (
            <div
              key={img.id}
              className="gallery-tile rounded-2xl border border-token overflow-hidden bg-white relative group cursor-pointer"
              style={{ aspectRatio: '4/3' }}
              onClick={() => openLightbox(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openLightbox(i);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="View installation photo"
            >
              {/* width/height are the intrinsic hint that reserves layout space
                  before the file lands; raised with the tiles so the browser is
                  not told to expect a 400px image it then paints at 600. */}
              <img
                src={img.thumb}
                alt={img.alt}
                loading="lazy"
                width={640}
                height={480}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Glass overlay + gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* Load More — a plain loader. The remaining-count span that used to sit
            beside the label is gone; see the no-counts note above. */}
        {hasMore && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleLoadMore}
              className="btn-primary-token focus-ring inline-flex items-center gap-2 rounded-md px-8 py-3.5 text-sm font-semibold"
            >
              Load More
            </button>
          </div>
        )}

        {/* Empty state */}
        {galleryImages.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-token text-lg">No installation photos yet — check back soon.</p>
          </div>
        )}
      </div>

      {/* Lightbox — navigates through the images loaded so far */}
      {lightboxIndex !== null && (
        <ProjectLightbox
          images={visibleImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNext={() =>
            setLightboxIndex((prev) => (prev + 1) % visibleImages.length)
          }
          onPrev={() =>
            setLightboxIndex(
              (prev) => (prev - 1 + visibleImages.length) % visibleImages.length
            )
          }
        />
      )}
    </div>
  );
}
