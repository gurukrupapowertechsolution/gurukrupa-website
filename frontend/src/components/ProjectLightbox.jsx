import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, ImageOff } from 'lucide-react';

/**
 * The full-size project image viewer.
 *
 * ── Why this stopped opening anything ──────────────────────────────────────
 * The manifest gives every photo two paths — `thumb` (500px, used by the grid
 * and the carousel) and `full` (~1600px, used only here). `full/` is currently
 * EMPTY on disk: 46 files in `thumbs/`, none in `full/`. So the one URL this
 * component asked for 404'd on every single photo, `onLoad` never fired, and
 * the spinner it gates on had nothing that could ever turn it off. Clicking a
 * tile produced a black screen with a spinner in it, permanently.
 *
 * Two separate defects, both fixed here rather than in the manifest:
 *
 *   1. NO FALLBACK. `full` was read and nothing checked whether it arrived.
 *      A gallery whose lightbox is dark whenever one derivative is missing is
 *      one bad deploy away from broken, so the source is now a LIST, tried
 *      best-first, and `onError` steps down it. When `full/` is repopulated the
 *      first candidate wins again with no code change; until then the visitor
 *      gets the 500px file, which is a smaller picture rather than no picture.
 *   2. NO TERMINAL STATE. `imageLoaded` had no third value for "this will not
 *      load", so failure and still-loading were indistinguishable — to the
 *      component and to the visitor. `status` now ends at 'failed' and says so
 *      on screen.
 *
 * The cached-image trap is handled too: a file already in the browser's memory
 * cache can finish before React attaches `onLoad`, so the event never arrives
 * and the spinner sticks for exactly the images the visitor has already seen.
 * `complete` is the only thing that knows that happened, and it is checked
 * directly. (`key={activeSrc}` on the <img> makes the element itself fresh per
 * source, which is what guarantees a load/error event per candidate.)
 */

/* URLs that have already 404'd this visit. With `full/` empty, re-opening a
   photo the visitor has seen before would otherwise repeat the same failing
   request every time; skipping a known-dead candidate outright also means the
   fallback paints immediately rather than after a round trip. Module scope, not
   state — it is a fact about the server, not about one mounted lightbox. */
const deadSources = new Set();

/** Candidate URLs for one gallery entry, best first, de-duplicated.
 *  Supports both the old shape ({src, location}) and the current one
 *  ({thumb, full, alt}). Dealer names are deliberately never surfaced.
 *
 *  Everything known-dead is dropped — unless that would leave nothing, in which
 *  case the list is kept as-is so the viewer can report a real failure rather
 *  than render an empty frame. */
function sourcesFor(image) {
  if (!image) return [];
  const all = [image.full, image.src, image.thumb].filter(
    (src, i, list) => Boolean(src) && list.indexOf(src) === i
  );
  const live = all.filter((src) => !deadSources.has(src));
  return live.length > 0 ? live : all;
}

export default function ProjectLightbox({ images, currentIndex, onClose, onNext, onPrev }) {
  const modalRef = useRef(null);
  const imgRef = useRef(null);

  const currentImage =
    currentIndex === null || currentIndex === undefined ? null : images?.[currentIndex] ?? null;

  const sources = useMemo(() => sourcesFor(currentImage), [currentImage]);

  /* One state object, stamped with the photo it describes.

     Which candidate is showing and whether it has arrived are two halves of one
     fact, and they are reset together on every arrow press. Held apart, and
     reset from an effect, they spend the render between the arrow press and the
     effect describing the PREVIOUS photo — long enough to index past the end of
     a shorter candidate list and paint a frame with no image and no spinner in
     it. Stamping the state and correcting it during render is React's own
     answer to that: the re-render happens before anything is committed, so the
     stale combination is never on screen. */
  const [load, setLoad] = useState({ at: currentIndex, sourceIndex: 0, status: 'loading' });
  if (load.at !== currentIndex) {
    setLoad({ at: currentIndex, sourceIndex: 0, status: 'loading' });
  }
  const sourceIndex = load.at === currentIndex ? load.sourceIndex : 0;
  const status = load.at === currentIndex ? load.status : 'loading';

  const activeSrc = sources[sourceIndex] ?? null;

  const setStatus = useCallback(
    (next) => setLoad((prev) => (prev.status === next ? prev : { ...prev, status: next })),
    []
  );

  /* Step down to the next candidate, or give up honestly. The `deadSources`
     write is kept out of the updater deliberately — updaters are called twice
     under StrictMode and must stay free of side effects. */
  const handleFailed = useCallback(() => {
    const failed = sources[sourceIndex];
    if (failed) deadSources.add(failed);
    if (sourceIndex + 1 < sources.length) {
      setLoad({ at: currentIndex, sourceIndex: sourceIndex + 1, status: 'loading' });
    } else {
      setStatus('failed');
    }
  }, [sources, sourceIndex, currentIndex, setStatus]);

  /* An entry with no usable URL at all can never resolve — say so rather than
     spinning. Also covers the cached case described above: a file already in the
     browser's memory cache can finish before React attaches onLoad, and then no
     event ever arrives. */
  useEffect(() => {
    if (!activeSrc) {
      if (sources.length === 0) setStatus('failed');
      return;
    }
    const el = imgRef.current;
    if (!el || !el.complete) return;
    if (el.naturalWidth > 0) setStatus('ready');
    else handleFailed();
  }, [activeSrc, sources.length, handleFailed, setStatus]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();

      // Focus trapping
      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll('button');
        if (focusable && focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, onNext, onPrev]);

  if (!currentImage) return null;

  const imageAlt = currentImage.alt || `Project in ${currentImage.location || ''}`;
  const label = currentImage.location || '';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Project image viewer"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-7xl max-h-screen p-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors focus-ring"
          aria-label="Close lightbox"
          autoFocus
        >
          <X className="w-6 h-6" />
        </button>

        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors focus-ring"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <div className="relative w-full flex-1 flex flex-col items-center justify-center overflow-hidden">
          {/* Loading spinner — shown only while a candidate is actually in
              flight. It is no longer the default resting state. */}
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-10 h-10 text-primary-token animate-spin" />
              <span className="sr-only">Loading image</span>
            </div>
          )}

          {status === 'failed' ? (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-md border border-white/15 bg-white/[0.04] px-10 py-16 text-center"
              role="alert"
            >
              <ImageOff className="w-9 h-9 text-white/45" aria-hidden="true" />
              <p className="text-sm text-white/70">This photo could not be loaded.</p>
              <p className="text-xs text-white/40">Use the arrows to see the rest of the gallery.</p>
            </div>
          ) : (
            activeSrc && (
              <img
                /* Keyed on the URL so each candidate gets its own element, and
                   therefore its own load/error event. Without this a fallback
                   would reuse an element the browser already considers
                   `complete` and fire nothing. */
                key={activeSrc}
                ref={imgRef}
                src={activeSrc}
                alt={imageAlt}
                className={`max-w-full max-h-[80vh] object-contain rounded-md transition-opacity duration-300 ${
                  status === 'ready' ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setStatus('ready')}
                onError={handleFailed}
              />
            )
          )}

          {/* Counter + location label */}
          <div className="mt-4 flex items-center gap-4 text-white/90 text-sm sm:text-base">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 font-mono text-xs sm:text-sm">
              {currentIndex + 1} / {images.length}
            </span>
            {label && <span className="font-medium text-white/90">{label}</span>}
          </div>
        </div>

        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors focus-ring"
          aria-label="Next image"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
