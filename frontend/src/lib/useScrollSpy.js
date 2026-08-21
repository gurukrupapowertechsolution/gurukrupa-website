import { useEffect, useLayoutEffect, useState } from 'react';

/**
 * Which of a set of in-page sections the reader is currently looking at.
 *
 * Used by the contents rails on /privacy-policy and /terms-and-conditions so the
 * shortcut for the clause on screen highlights as the document scrolls. Both
 * pages render the identical rail from an identical TOC array, so the logic
 * lives here rather than twice.
 *
 * ── Why measured, not IntersectionObserver ─────────────────────────────────
 * An observer answers "is this element intersecting the viewport", and on these
 * pages several sections are intersecting at once — the clauses are short and a
 * tall screen holds four of them. Deciding between four simultaneous hits means
 * re-deriving a "topmost above the line" rule from the entries anyway, at which
 * point the observer is doing none of the work. Measuring against one horizontal
 * line gives exactly one answer by construction.
 *
 * It also survives `zoom: 0.93` on the `.page-scale` wrapper both pages render
 * inside: `getBoundingClientRect()` and `offset` are both in viewport pixels,
 * so the comparison holds whatever the zoom does to layout coordinates. A
 * rootMargin string would have had to be corrected for it.
 *
 * @param {string[]} ids    Section element ids, in document order. Must be a
 *                          stable reference — define it at module scope or
 *                          memoise it, or this re-subscribes every render.
 * @param {number}   offset Distance below the top of the viewport that counts
 *                          as "the reading line". Should clear the fixed site
 *                          header (h-24 = 96px) plus a little breathing room.
 * @returns {string|null} The active id.
 */
export default function useScrollSpy(ids, offset = 140) {
  const [activeId, setActiveId] = useState(ids[0] ?? null);

  useEffect(() => {
    if (!ids || ids.length === 0) return undefined;

    let frame = 0;

    const compute = () => {
      frame = 0;

      /* The last section whose top has passed the reading line. Sections are in
         document order, so the first one still below the line ends the search —
         everything after it is further down. */
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - offset > 0) break;
        current = id;
      }

      /* The final section is usually shorter than the space left under it, so
         its top can cross the line while the page is already scrolled as far as
         it goes — and the rail would freeze one entry early, on the section the
         reader has scrolled past. At the bottom, the bottom entry is the answer
         by definition. */
      const doc = document.documentElement;
      const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
      if (atBottom) current = ids[ids.length - 1];

      setActiveId((prev) => (prev === current ? prev : current));
    };

    /* Coalesced to one measurement per frame. This reads layout, and doing that
       synchronously on every scroll event is the classic way to make a long
       document feel heavy on exactly the low-end phones it should not. */
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ids, offset]);

  return activeId;
}

/**
 * Keep the highlighted entry inside the contents rail's own scroll box.
 *
 * The rail is `position: sticky` with `max-height: calc(100vh - 9rem)` and
 * `overflow-y: auto`. The Terms page has 27 clauses in it, which is taller than
 * that on any normal laptop — so without this the highlight is correct and
 * invisible for the whole back half of the document, which is worse than no
 * highlight at all.
 *
 * Scrolls the RAIL, never the window. `scrollIntoView()` would have moved the
 * page too, which on a scroll-driven highlight is a feedback loop: the rail
 * scrolls the document, the document moves the highlight, the highlight scrolls
 * the rail. Writing `scrollTop` on the container touches nothing else.
 *
 * @param {React.RefObject<HTMLElement>} railRef  The `overflow-y: auto` element.
 * @param {string|null} activeId
 */
export function useKeepActiveInView(railRef, activeId) {
  /* Layout effect: this reads geometry that the class change in the same commit
     can affect (the active entry goes semibold, which reflows the list). Running
     before paint means the correction is never visible as a jump. */
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail || !activeId) return;

    /* Nothing to correct when the rail is not scrolling — either it fits (the
       Privacy page's 14 sections usually do) or it is `display: none`, which is
       what the `hidden lg:block` wrapper does below the lg breakpoint and which
       measures as zero in every direction. */
    if (rail.scrollHeight <= rail.clientHeight) return;

    const entry = rail.querySelector(`a[href="#${CSS.escape(activeId)}"]`);
    if (!entry) return;

    // Only correct when it is genuinely out of the box — an unconditional write
    // would re-centre the rail on every section change and make it twitch.
    const railBox = rail.getBoundingClientRect();
    const entryBox = entry.getBoundingClientRect();
    const margin = 8;

    if (entryBox.top < railBox.top + margin) {
      rail.scrollTop -= railBox.top + margin - entryBox.top;
    } else if (entryBox.bottom > railBox.bottom - margin) {
      rail.scrollTop += entryBox.bottom - (railBox.bottom - margin);
    }
  }, [railRef, activeId]);
}
