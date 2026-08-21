import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Forces the window back to the top on every route change.
 *
 * Without this, clicking a footer link renders the new page but leaves the
 * scroll position where it was — i.e. at the bottom of the document.
 *
 * `behavior: 'instant'` is required because index.css sets
 * `html { scroll-behavior: smooth }`, which would otherwise animate the jump.
 */
function jumpToTop() {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } catch {
    // Older browsers reject the 'instant' keyword.
    window.scrollTo(0, 0);
  }
}

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // An in-page anchor is an explicit request to land somewhere else.
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView();
        return undefined;
      }

      /* Missing on this pass does not mean missing. The target can belong to a
         view that mounts one render later than this effect runs — /quote picks
         its panel from a `?tab=` sync effect, so #how-we-work does not exist in
         the DOM until after that has committed. One frame's grace, then fall
         back to the top rather than leaving the visitor mid-page. */
      const frame = requestAnimationFrame(() => {
        const late = document.querySelector(hash);
        if (late) late.scrollIntoView();
        else jumpToTop();
      });
      return () => cancelAnimationFrame(frame);
    }

    jumpToTop();
    return undefined;
  }, [pathname, search, hash]);

  return null;
}
