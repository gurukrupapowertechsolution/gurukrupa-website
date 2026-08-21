import React, { useState, useMemo, useDeferredValue } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, X, HelpCircle, MessageCircle } from 'lucide-react';
import FaqAccordion from '../components/FaqAccordion';
import { FAQS, FAQ_CATEGORIES, groupFaqsByCategory } from '../data/faqData';
import { FAQ_HERO_IMAGE, hideOnImageError } from '../data/sectionImages';

export default function Faq() {
  const [query, setQuery] = useState('');
  // Keeps typing responsive as the dataset grows toward 100 entries.
  const deferredQuery = useDeferredValue(query);
  const [activeCategory, setActiveCategory] = useState('all');

  const trimmedQuery = deferredQuery.trim();
  const isSearching = trimmedQuery.length > 0;

  const filtered = useMemo(() => {
    const needle = trimmedQuery.toLowerCase();
    return FAQS.filter((faq) => {
      if (activeCategory !== 'all' && faq.category !== activeCategory) return false;
      if (!needle) return true;
      // Answers are searched too — people look for "anti-islanding" or "DCR",
      // which are terms that live in the body rather than the question.
      return (
        faq.q.toLowerCase().includes(needle) || faq.a.toLowerCase().includes(needle)
      );
    });
  }, [trimmedQuery, activeCategory]);

  const groups = useMemo(() => groupFaqsByCategory(filtered), [filtered]);

  return (
    <div className="gps-root min-h-screen w-full bg-[#F4F6FB] pb-20">
      <style>{`
        .gps-root {
          --color-primary: #F5A623;
          --color-primary-text: #9C6509;
          --color-secondary: #0A2540;
          --color-bg: #F4F6FB;
          --color-text-muted: #5A6270;
          --color-border: #E2E5EA;
        }
        .bg-primary-token { background: var(--color-primary); }
        .text-primary-token { color: var(--color-primary); }
        .text-eyebrow-token { color: var(--color-primary-text); }
        .text-secondary-token { color: var(--color-secondary); }
        .text-muted-token { color: var(--color-text-muted); }
        .border-token { border-color: var(--color-border); }
        .focus-ring:focus-visible { outline: 2.5px solid var(--color-primary); outline-offset: 2px; }

        .faq-search {
          transition: border-color .2s ease, box-shadow .2s ease;
          box-shadow: 0 2px 12px rgba(10,37,64,0.05);
        }
        .faq-search:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 4px 20px rgba(245,166,35,0.16), 0 0 0 3px rgba(245,166,35,0.16);
        }
        .faq-search input:focus { outline: none; }

        .faq-chip {
          border: 1px solid var(--color-border);
          background: #fff;
          color: var(--color-text-muted);
          transition: background .2s ease, color .2s ease, border-color .2s ease;
        }
        .faq-chip:hover { border-color: rgba(245,166,35,0.5); color: var(--color-secondary); }
        .faq-chip.is-active {
          background: var(--color-secondary);
          border-color: var(--color-secondary);
          color: #fff;
        }
        /* Phase 3 — photographic hero. This page is ~440 lines of prose and had
           no image on it at all; a photograph behind the masthead gives it
           something to look at before the wall of text.
           Phase 2 (round 2) — that photograph used to be one of Gurukrupa's own
           installations (IRSHAD_BHAI__002). Project photographs are now
           reserved for the gallery, so this is a licensed architectural frame
           instead. See data/sectionImages.js.

           Phase 2 (round 3) — the frame is now the portrait from the homepage
           FAQ band. That changes what the treatment has to do: an architectural
           canopy works as a 34%-opacity texture because it has no subject, but
           a person flattened to a third of their contrast just looks like a
           smudge behind the headline. Full opacity now, anchored right so her
           face lands in the open half of the band, with the scrim below doing
           the legibility work instead of the opacity.

           object-position is the load-bearing bit at narrow widths: the subject
           sits centre-left in the source, so a plain cover crop on a wide short
           band would cut her out entirely. */
        .faq-hero-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 70% 28%;
          opacity: 0.9;
        }
        /* Below lg the copy needs the whole band, so the photograph drops back
           to being texture — there is no room for it to be a subject as well. */
        @media (max-width: 1023px) {
          .faq-hero-photo { opacity: 0.22; object-position: 60% 30%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .faq-search, .faq-chip { transition: none !important; }
        }
      `}</style>

      {/* -------- Photographic hero -------- */}
      <div className="band-deep relative overflow-hidden">
        <img
          src={FAQ_HERO_IMAGE}
          alt=""
          aria-hidden="true"
          className="faq-hero-photo"
          fetchPriority="high"
          onError={hideOnImageError}
        />
        {/* Scrim. Reweighted for a photograph with a subject in it: near-opaque
            under the copy column on the left, then falling away to almost
            nothing past 72% so the portrait is actually visible rather than
            being drowned. The copy sits in a max-w-2xl column that ends well
            inside the dark end of the ramp, so it keeps the same AA headroom it
            had over the old flat scrim. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(100deg, rgba(7,26,46,0.96) 0%, rgba(9,32,56,0.92) 38%, rgba(10,37,64,0.72) 60%, rgba(10,37,64,0.24) 82%, rgba(10,37,64,0.10) 100%)',
          }}
        />
        {/* Below lg the photo is back to being texture, so the band needs its
            own flat scrim or the right-hand copy would sit on bare photograph. */}
        <div
          className="absolute inset-0 pointer-events-none lg:hidden"
          style={{ background: 'rgba(9,32,56,0.72)' }}
        />
        <div className="container-site pt-14 pb-16 relative z-10">
          <p className="text-xs font-semibold tracking-wide uppercase text-primary-token mb-3">
            Knowledge Base
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            Frequently asked questions
          </h1>
          <p className="text-white/70 max-w-2xl text-lg leading-relaxed">
            Straight answers on sizing, subsidy, net metering and what our climate actually
            does to a rooftop system — written for Gujarat, where PGVCL is the discom and dust
            and salt air are the two realities every installation has to survive.
          </p>
        </div>
      </div>

      <div className="container-site pt-12">

        {/* -------- Search -------- */}
        <div className="mb-5">
          <label htmlFor="faq-search" className="sr-only">Search frequently asked questions</label>
          <div className="faq-search flex items-center gap-3 bg-white border border-token rounded-xl px-4 py-3">
            <Search className="w-5 h-5 text-muted-token flex-shrink-0" aria-hidden="true" />
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search — try “net metering”, “battery”, “DCR” or “cleaning”"
              className="flex-1 bg-transparent text-sm text-secondary-token placeholder:text-muted-token/70 min-w-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="focus-ring rounded-full p-1 text-muted-token hover:text-secondary-token flex-shrink-0"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* -------- Category filter -------- */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            aria-pressed={activeCategory === 'all'}
            className={`faq-chip focus-ring rounded-full px-4 py-1.5 text-xs font-semibold ${
              activeCategory === 'all' ? 'is-active' : ''
            }`}
          >
            All ({FAQS.length})
          </button>
          {FAQ_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              aria-pressed={activeCategory === category.id}
              className={`faq-chip focus-ring rounded-full px-4 py-1.5 text-xs font-semibold ${
                activeCategory === category.id ? 'is-active' : ''
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* -------- Result count (announced to screen readers) -------- */}
        <p className="text-xs text-muted-token mb-8" role="status" aria-live="polite">
          {filtered.length === 0
            ? 'No matching questions'
            : `Showing ${filtered.length} of ${FAQS.length} questions`}
          {isSearching && ` for “${trimmedQuery}”`}
        </p>

        {/* -------- Results -------- */}
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-token bg-white p-10 text-center">
            <HelpCircle className="w-10 h-10 mx-auto mb-4 text-muted-token/40" />
            <p className="text-base font-semibold text-secondary-token mb-2">
              Nothing matched “{trimmedQuery}”
            </p>
            <p className="text-sm text-muted-token leading-relaxed max-w-md mx-auto mb-6">
              Try a broader term, or clear the filters. If it is something we have not covered
              here, ask us directly — we will answer, and it will probably end up on this page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => { setQuery(''); setActiveCategory('all'); }}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-token px-5 py-2.5 text-sm font-semibold text-secondary-token hover:bg-white"
              >
                Clear filters
              </button>
              <Link
                to="/quote?tab=contact"
                className="bg-primary-token text-secondary-token focus-ring inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold"
              >
                Ask us directly <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {groups.map((group) => (
              <section key={group.id} aria-labelledby={`faq-cat-${group.id}`}>
                <div className="mb-5">
                  <h2
                    id={`faq-cat-${group.id}`}
                    className="text-xl md:text-2xl font-bold text-secondary-token mb-1.5"
                  >
                    {group.label}
                    <span className="text-sm font-medium text-muted-token ml-2">
                      ({group.faqs.length})
                    </span>
                  </h2>
                  <p className="text-sm text-muted-token leading-relaxed">{group.blurb}</p>
                </div>
                <FaqAccordion
                  faqs={group.faqs}
                  idPrefix={`faqpage-${group.id}`}
                  highlight={trimmedQuery}
                  autoExpandKey={trimmedQuery}
                />
              </section>
            ))}
          </div>
        )}

        {/* -------- Still stuck -------- */}
        <div
          className="mt-16 rounded-2xl px-7 py-9 md:px-10 md:py-10 text-center"
          style={{
            background: 'linear-gradient(135deg, #0A2540 0%, #12365C 55%, #0F2D52 100%)',
            boxShadow: '0 20px 60px rgba(10,37,64,0.30), 0 0 0 1px rgba(245,166,35,0.12)',
          }}
        >
          <MessageCircle className="w-9 h-9 mx-auto mb-4 text-primary-token" />
          <h2 className="text-2xl font-bold text-white mb-3">Still have a question?</h2>
          <p className="text-white/65 leading-relaxed max-w-lg mx-auto mb-7">
            Talk to Sagar Bhimani directly about sizing, subsidy paperwork or a site visit.
            No obligation, and no scripted sales call.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/quote?tab=contact"
              className="bg-primary-token text-secondary-token focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold"
            >
              Talk to our team <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/quote"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold text-white border border-white/30 hover:bg-white/10"
            >
              Get a free quotation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
