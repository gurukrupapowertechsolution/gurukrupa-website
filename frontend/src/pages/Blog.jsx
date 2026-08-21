import React, { useState, useMemo, useDeferredValue } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Search, X, FileText } from 'lucide-react';
import { BLOG_POSTS } from '../data/blogPosts';

export default function Blog() {
  const [query, setQuery] = useState('');
  // Keeps typing responsive if the list grows; filtering stays instant.
  const deferredQuery = useDeferredValue(query);

  const filteredPosts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return BLOG_POSTS;
    return BLOG_POSTS.filter(
      (post) =>
        post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q)
    );
  }, [deferredQuery]);

  const isSearching = deferredQuery.trim().length > 0;
  // The featured hero only makes sense on the unfiltered view; while searching,
  // every match gets equal weight in a plain grid.
  const featuredPost = isSearching ? null : filteredPosts[0];
  const gridPosts = isSearching ? filteredPosts : filteredPosts.slice(1);

  return (
    <div className="gps-root min-h-screen w-full bg-[#F4F6FB] pt-24 pb-20">
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

        .blog-search {
          transition: border-color .2s ease, box-shadow .2s ease;
          box-shadow: 0 2px 12px rgba(10,37,64,0.05);
        }
        .blog-search:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 4px 20px rgba(245,166,35,0.16), 0 0 0 3px rgba(245,166,35,0.16);
        }
        .blog-search input:focus { outline: none; }

        .blog-chip {
          background: rgba(10,37,64,0.05);
          color: var(--color-secondary);
        }

        /* Phase 3 — the cards were carrying Tailwind's flat shadow-xl on hover.
           They use the shared elevation scale now, so a blog card sits at the
           same depth as a product card or a gallery tile. */
        .blog-card {
          background-image: var(--surface-raised);
          box-shadow: var(--elev-1), var(--bevel-light);
          transition:
            transform .32s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow .32s ease,
            border-color .32s ease;
        }
        .blog-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--elev-3), var(--ring-gold), var(--glow-gold-soft), var(--bevel-light);
          border-color: rgba(245,166,35,0.34) !important;
        }
        .blog-feature {
          background-image: var(--surface-raised);
          box-shadow: var(--elev-2), var(--bevel-light);
          transition: transform .32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow .32s ease, border-color .32s ease;
        }
        .blog-feature:hover {
          transform: translateY(-4px);
          box-shadow: var(--elev-4), var(--ring-gold), var(--glow-gold-soft), var(--bevel-light);
          border-color: rgba(245,166,35,0.34) !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .blog-search, .blog-card, .blog-feature { transition: none !important; }
          .blog-card:hover, .blog-feature:hover { transform: none !important; }
        }
      `}</style>

      <div className="container-site">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">Industry Journal</p>
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-token mb-4">Solar &amp; Energy Briefing</h1>
          <p className="text-muted-token max-w-2xl text-lg leading-relaxed">
            Policy, manufacturing and market developments across India's solar sector — summarised
            for homeowners and businesses in Gujarat, with links to the original coverage.
          </p>
        </div>

        {/* -------- Search -------- */}
        <div className="mb-10 max-w-xl">
          <label htmlFor="blog-search" className="sr-only">Search articles</label>
          <div className="blog-search flex items-center gap-3 bg-white border border-token rounded-xl px-4 py-3">
            <Search className="w-5 h-5 text-muted-token flex-shrink-0" aria-hidden="true" />
            <input
              id="blog-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles — try &ldquo;subsidy&rdquo;, &ldquo;grid&rdquo;, &ldquo;storage&rdquo;"
              className="w-full bg-transparent text-sm text-secondary-token placeholder:text-muted-token/70"
              autoComplete="off"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="focus-ring rounded-full p-1 text-muted-token hover:text-secondary-token transition-colors flex-shrink-0"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-token mt-2.5" role="status" aria-live="polite">
            {isSearching
              ? `${filteredPosts.length} ${filteredPosts.length === 1 ? 'article' : 'articles'} matching “${deferredQuery.trim()}”`
              : `${BLOG_POSTS.length} articles`}
          </p>
        </div>

        {/* -------- Empty state -------- */}
        {filteredPosts.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border border-token">
            <FileText className="w-10 h-10 mx-auto mb-4 text-muted-token/50" />
            <p className="text-lg font-semibold text-secondary-token mb-2">No articles found</p>
            <p className="text-sm text-muted-token mb-6">
              Nothing matches “{deferredQuery.trim()}”. Try a broader term like “solar” or “subsidy”.
            </p>
            <button
              onClick={() => setQuery('')}
              className="focus-ring text-sm font-semibold text-secondary-token underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* -------- Featured Hero Post -------- */}
        {featuredPost && (
          <div className="mb-16">
            <Link
              to={`/blog/${featuredPost.slug}`}
              className="blog-feature focus-ring group relative rounded-3xl overflow-hidden bg-white border border-token grid lg:grid-cols-2 block"
            >
              <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[380px] overflow-hidden bg-[#0A2540]">
                <img
                  src={featuredPost.image}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-6 left-6">
                  <span className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-secondary-token text-xs font-bold tracking-wider uppercase">
                    {featuredPost.category}
                  </span>
                </div>
              </div>

              <div className="p-8 md:p-12 lg:p-14 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-sm text-muted-token mb-5 flex-wrap">
                  <span>{featuredPost.date}</span>
                  <span aria-hidden="true">•</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {featuredPost.readTime}</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-secondary-token mb-5 leading-tight group-hover:text-primary-token transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-muted-token leading-relaxed mb-7">
                  {featuredPost.excerpt}
                </p>
                <span className="inline-flex items-center gap-2 text-secondary-token font-semibold group-hover:text-primary-token transition-colors self-start">
                  Read Article <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* -------- Grid Posts -------- */}
        {gridPosts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="blog-card focus-ring group bg-white rounded-2xl border border-token overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0A2540]">
                  <img
                    src={post.image}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-secondary-token text-[10px] font-bold tracking-wider uppercase">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 md:p-7 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-xs text-muted-token mb-3 flex-wrap">
                    <span>{post.date}</span>
                    <span aria-hidden="true">•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                  </div>
                  <h3 className="text-lg font-bold text-secondary-token mb-3 leading-snug group-hover:text-primary-token transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-token text-sm leading-relaxed mb-5 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between gap-3 mt-auto">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-token group-hover:text-primary-token transition-colors">
                      Read More <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="blog-chip text-[10px] font-medium rounded-full px-2.5 py-1 truncate max-w-[55%]">
                      {post.sourceName}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* -------- Editorial note -------- */}
        <p className="mt-14 pt-6 border-t border-token text-xs text-muted-token leading-relaxed max-w-3xl">
          These briefings are written by Gurukrupa Powertech Solutions. Each article links to a
          publication covering the same subject so you can read the original reporting — the link
          is provided as further reading, not as the source of this text.
        </p>
      </div>
    </div>
  );
}
