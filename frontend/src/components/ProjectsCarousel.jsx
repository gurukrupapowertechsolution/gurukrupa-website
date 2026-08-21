import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProjectLightbox from './ProjectLightbox';

/* Pixels per second. Slow enough to read as drift rather than as playback — at
   this rate a 400px card takes about 17 seconds to cross its own width, so the
   row is legible while standing still and never demands to be chased. */
const AUTO_SCROLL_PX_PER_SEC = 24;

export default function ProjectsCarousel({ images }) {
  const scrollContainerRef = useRef(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // Get the width of the first child to know how much to scroll
      const itemWidth = container.firstElementChild?.clientWidth || 300;
      container.scrollBy({ left: direction * itemWidth, behavior: 'smooth' });
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setLightboxIndex(index);
    }
  };

  /* ── Continuous auto-scroll ───────────────────────────────────────────────
     The list is rendered twice (see the render below) and this drives the
     scrollLeft of the real container, wrapping at the halfway mark. That is
     what makes the loop seamless: at the wrap point the second copy is showing
     exactly what the first copy showed at scrollLeft 0, so resetting the
     position is invisible.

     Driven by rAF with an explicit delta rather than by a CSS marquee on a
     translated track, because this element has to stay a genuine scroll
     container — it is the same element the arrows scrollBy() and the same one a
     visitor flicks on a touchscreen. A transform-based marquee would take both
     of those away.

     Fractional pixels are accumulated in a ref instead of being handed to
     scrollLeft: at 24px/sec a 60Hz frame advances 0.4px, and browsers that
     round scrollLeft to integers would floor every one of those to zero and
     the row would simply never move.

     ── It never pauses ──────────────────────────────────────────────────────
     This used to stop on anything that read as intent to look: pointer over
     the rail, keyboard focus inside it, a touch in progress, or the lightbox
     being open. All of it is gone at the business's request — the row is meant
     to read as continuous motion, and stopping the moment a cursor crosses it
     was the specific complaint. The only remaining brake is
     prefers-reduced-motion, which disables the loop outright.

     Two consequences worth knowing rather than rediscovering:
       · the arrows still work. `scrollBy({behavior:'smooth'})` and this drive
         both write scrollLeft, so a click lands its full card width and the
         drift resumes from wherever it ends up — no fight, no reset
       · a touch-drag now has 0.4px per frame added underneath it. The drag
         itself is unaffected (it is a real scroll container), but iOS momentum
         scrolling is cancelled by a programmatic scrollLeft write, so a flick
         stops where the finger left it instead of coasting. That is the price
         of "without stopping under any circumstances" and it is the intended
         trade, not an oversight. */
  const scrollAccumulator = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const container = scrollContainerRef.current;
    if (!container || images.length === 0) return undefined;

    let frame = 0;
    let lastTime = 0;

    const step = (time) => {
      frame = requestAnimationFrame(step);
      if (!lastTime) {
        lastTime = time;
        return;
      }
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Skip while the tab is hidden — rAF is throttled in the background
      // anyway, but a long delta on return would jump the row.
      if (document.hidden || delta > 0.5) return;

      /* The wrap distance is the offset of the first clone, NOT scrollWidth / 2.
         Those differ: the duplicated track has 2n cards and therefore 2n-1 flex
         gaps, so half the scroll width lands half a gap short of the repeat and
         the row would visibly jump 12px on every loop. Measuring the clone's
         own position gets the period exactly right, gap included, and it stays
         right if the card widths change at a breakpoint. */
      const first = container.children[0];
      const firstClone = container.children[images.length];
      if (!first || !firstClone) return;
      const period = firstClone.offsetLeft - first.offsetLeft;
      if (period <= 0) return;

      scrollAccumulator.current += AUTO_SCROLL_PX_PER_SEC * delta;
      const whole = Math.floor(scrollAccumulator.current);
      if (whole >= 1) {
        scrollAccumulator.current -= whole;
        const next = container.scrollLeft + whole;
        container.scrollLeft = next >= period ? next - period : next;
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [images.length]);

  /* The track is duplicated so the wrap has something to wrap into. The second
     copy is aria-hidden and its cards are removed from the tab order — it is
     the same nine projects, and a screen reader or a Tab key finding eighteen
     would be reporting content that is not there. */
  const track = [
    ...images.map((proj, i) => ({ proj, i, clone: false })),
    ...images.map((proj, i) => ({ proj, i, clone: true })),
  ];

  return (
    <div className="relative group/carousel">
      {/* Carousel container.

          `snap-x snap-mandatory` (and `snap-start` on each card) used to live
          here and had to go: mandatory snapping and a continuous scrollLeft
          drive are mutually exclusive. The browser re-snaps to the nearest card
          after every programmatic sub-pixel nudge, so the row would either sit
          locked in place or jitter between two neighbours. The arrows still
          advance by exactly one card width, which is what the snapping was
          there to guarantee. */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto hide-scrollbar pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {track.map(({ proj, i, clone }) => {
          // Support both old shape ({src, location}) and new shape ({thumb, full, alt}).
          // Dealer names are deliberately never surfaced.
          const thumbSrc = proj.thumb || proj.src;
          const label = proj.location || '';
          const altText = proj.alt || (label ? `Solar installation — ${label}` : 'Solar installation');

          return (
            <div
              key={`${clone ? 'clone' : 'real'}-${proj.id || i}`}
              className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] flex-shrink-0 rounded-2xl border border-token overflow-hidden bg-white card-hover relative group cursor-pointer"
              style={{ aspectRatio: '4/3' }}
              onClick={() => setLightboxIndex(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              tabIndex={clone ? -1 : 0}
              aria-hidden={clone ? 'true' : undefined}
              role="button"
              aria-label={label ? `View project — ${label}` : 'View project photo'}
            >
              <img
                src={thumbSrc}
                alt={clone ? '' : altText}
                loading="lazy"
                width={600}
                height={450}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/85 via-[#0F172A]/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {label && (
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    {label}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 md:-translate-x-4 z-10 p-3 bg-white text-secondary-token rounded-full shadow-lg border border-token hover:scale-110 transition-transform focus-ring opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 md:translate-x-4 z-10 p-3 bg-white text-secondary-token rounded-full shadow-lg border border-token hover:scale-110 transition-transform focus-ring opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ProjectLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNext={() => setLightboxIndex((prev) => (prev + 1) % images.length)}
          onPrev={() => setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)}
        />
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
