import { useEffect, useRef } from 'react';

/**
 * Scroll-entrance reveals, scoped to one subtree.
 *
 * Every element inside the returned ref that carries one of the reveal classes
 * gains `.animate-visible` while it is on screen and loses it again when it
 * scrolls away, so a reveal replays on scroll-back rather than firing once and
 * being spent.
 *
 * This used to be an effect written inline in Homepage.jsx that queried the
 * whole `document`. It moved here when entry direction became a site-wide rule
 * (see the reveal block in index.css): /about needs the same behaviour, and the
 * alternative was a second copy of the same observer on that page.
 *
 * Two class families are watched. `.reveal-*` are the shared primitives in
 * index.css; `.slide-*` / `.pop-scale` / `.soft-cascade` are Homepage's older
 * set, still defined in that file's own <style> block. Both use the same
 * activation class, so one observer drives them.
 */
export const REVEAL_SELECTOR = [
  '.reveal-up',
  '.reveal-left',
  '.reveal-right',
  '.reveal-scale',
  '.slide-up',
  '.slide-in-left',
  '.slide-in-right',
  '.pop-scale',
  '.soft-cascade',
].join(', ');

/**
 * @param {object}  [options]
 * @param {number}  [options.threshold=0.12] fraction of the element that must
 *   be visible. Kept low: several targets are full-height photo columns, and a
 *   high threshold would mean they never qualify on a short viewport.
 * @param {boolean} [options.once=false] stop watching after the first reveal.
 * @returns {import('react').RefObject<HTMLElement>} ref for the container.
 */
export function useScrollReveal({ threshold = 0.12, once = false } = {}) {
  const rootRef = useRef(null);

  useEffect(() => {
    // No-op under reduced motion; the CSS pins these elements visible.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const root = rootRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-visible');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('animate-visible');
          }
        });
      },
      { threshold }
    );

    root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [threshold, once]);

  return rootRef;
}

export default useScrollReveal;
