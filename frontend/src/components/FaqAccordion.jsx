import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * FAQ accordion.
 *
 * Content lives in ../data/faqData.js — this component only renders whatever
 * list it is handed, so the Homepage teaser (top 5) and the /faq page (grouped
 * by category) share one implementation.
 *
 * Phase 3: items open independently. Open state is a Set of FAQ ids rather than
 * a single index, so opening one no longer closes the rest, and the identity is
 * the id — a filtered search re-ordering the list can't hand an open state to
 * the wrong question the way a positional index did.
 *
 * Styles are global, in index.css, because /faq mounts one instance per
 * category.
 *
 * @param {object[]} faqs           Entries to render: { id, q, a }.
 * @param {string}   idPrefix       Namespaces DOM ids across multiple instances.
 * @param {string[]} defaultOpenIds Open on first render.
 * @param {string}   highlight      Term to <mark> within questions and answers.
 * @param {string}   autoExpandKey  When this changes, every listed item is
 *                                  expanded (empty/undefined collapses all).
 *                                  The /faq page passes the search query, so
 *                                  each new search reveals its answers.
 */
export default function FaqAccordion({
  faqs,
  idPrefix = 'faq',
  defaultOpenIds = [],
  highlight = '',
  autoExpandKey,
}) {
  const [openIds, setOpenIds] = useState(() => new Set(defaultOpenIds));

  // Adjusting state during render on a prop change — the pattern React
  // documents for derived state, and cheaper than an effect that would paint
  // the collapsed list first and expand on a second pass.
  const [lastAutoKey, setLastAutoKey] = useState(autoExpandKey);
  if (autoExpandKey !== lastAutoKey) {
    setLastAutoKey(autoExpandKey);
    setOpenIds(autoExpandKey ? new Set(faqs.map((faq) => faq.id)) : new Set());
  }

  const toggle = useCallback((id) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* Phase 2 — staggered entry reveal.
     Owned by this component rather than by the Homepage's page-level observer,
     for two reasons: that observer only ever scans the elements present at
     mount, and /faq has no observer at all — it renders one accordion per
     category, several of which are far below the fold. Self-contained here, the
     reveal works identically in both places and survives the /faq list being
     re-rendered by a search.

     Fires once and then unobserves: these are list rows, and replaying the
     cascade every time the section scrolls back into view would be noise. */
  const listRef = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const root = listRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 },
    );
    root.querySelectorAll('.faq-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    /* Re-runs when the rendered set changes, so rows introduced by a search or
       a category filter are picked up rather than staying at opacity 0. */
  }, [faqs]);

  return (
    <div className="faq-accordion">
      <div className="flex flex-col gap-3" ref={listRef}>
        {faqs.map((faq, index) => {
          const isOpen = openIds.has(faq.id);
          const questionId = `${idPrefix}-question-${faq.id}`;
          const answerId = `${idPrefix}-answer-${faq.id}`;

          return (
            /* The reveal rides a wrapper, not the .faq-item itself. Both want
               `transform` — the item already uses it for the hover lift and the
               open state — and an entry animation holding a filled end value on
               that same property beats the hover rule in the cascade, so the
               card would go dead to the pointer the moment it finished
               animating in. Separate elements, separate properties. */
            <div
              key={faq.id}
              className="faq-reveal"
              /* Capped at six steps: past that the last rows in a long /faq
                 category would sit blank for most of a second waiting their
                 turn, which reads as a loading bug rather than as choreography. */
              style={{ '--faq-reveal-delay': `${Math.min(index, 6) * 70}ms` }}
            >
            <div
              id={faq.id}
              className={`faq-item rounded-2xl scroll-mt-28 ${isOpen ? 'is-open' : ''}`}
            >
              <h3>
                <button
                  type="button"
                  className="faq-question focus-ring rounded-2xl px-5 py-5 md:px-6"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  id={questionId}
                  onClick={() => toggle(faq.id)}
                >
                  <span className="text-sm md:text-base font-semibold text-secondary-token pr-2">
                    {renderHighlighted(faq.q, highlight)}
                  </span>
                  <ChevronDown
                    className="faq-chevron w-5 h-5 flex-shrink-0 mt-0.5 text-primary-token"
                    aria-hidden="true"
                  />
                </button>
              </h3>
              <div
                className="faq-answer-wrap"
                id={answerId}
                role="region"
                aria-labelledby={questionId}
              >
                <div className="faq-answer">
                  {/* prose-measure: the FAQ page now runs edge to edge, so the
                      answer paragraphs need their own cap or they stretch to
                      the full viewport width. */}
                  <div className="px-5 md:px-6 pb-5 pt-0 prose-measure">
                    {faq.a.split('\n\n').map((para, p) => (
                      <p key={p} className="text-sm text-muted-token leading-relaxed mb-3 last:mb-0">
                        {renderHighlighted(para, highlight)}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Escapes regex metacharacters so a query like "3 kW (DCR)" can't throw. */
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Wraps occurrences of `term` in <mark>. Returns the plain string when there is
 * nothing to highlight, so the common case allocates nothing.
 */
function renderHighlighted(text, term) {
  const needle = term.trim();
  if (!needle) return text;

  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'));
  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    // Odd indices are the captured matches.
    i % 2 === 1 ? (
      <mark key={i} className="faq-mark">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
