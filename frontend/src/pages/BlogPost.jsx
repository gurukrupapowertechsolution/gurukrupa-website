import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, ExternalLink, Calendar } from 'lucide-react';
import { BLOG_POSTS, getPostBySlug } from '../data/blogPosts';

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <div className="gps-root min-h-screen w-full bg-[#F4F6FB] pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-3xl font-bold mb-4" style={{ color: '#0A2540' }}>Article not found</h1>
          <p className="mb-8" style={{ color: '#5A6270' }}>
            That article does not exist, or its link has changed.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold"
            style={{ background: '#F5A623', color: '#0A2540' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to all articles
          </Link>
        </div>
      </div>
    );
  }

  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="gps-root min-h-screen w-full bg-[#F4F6FB] pb-20">
      <style>{`
        .gps-root {
          --color-primary: #F5A623;
          --color-primary-text: #9C6509;
          --color-secondary: #0A2540;
          --color-text-muted: #5A6270;
          --color-border: #E2E5EA;
        }
        .text-primary-token { color: var(--color-primary); }
        .text-eyebrow-token { color: var(--color-primary-text); }
        .text-secondary-token { color: var(--color-secondary); }
        .text-muted-token { color: var(--color-text-muted); }
        .border-token { border-color: var(--color-border); }
        .focus-ring:focus-visible { outline: 2.5px solid var(--color-primary); outline-offset: 2px; }

        .article-body h2 {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--color-secondary);
          margin-top: 2.5rem;
          margin-bottom: 0.9rem;
          line-height: 1.3;
        }
        .article-body p {
          color: #33404F;
          line-height: 1.85;
          margin-bottom: 1.15rem;
          font-size: 1.02rem;
        }
        .article-body ul {
          margin: 0 0 1.4rem 0;
          padding: 0;
          list-style: none;
        }
        .article-body li {
          position: relative;
          padding-left: 1.6rem;
          margin-bottom: 0.75rem;
          color: #33404F;
          line-height: 1.75;
          font-size: 1.02rem;
        }
        .article-body li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.62em;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--color-primary);
        }
        .resource-link {
          transition: background .25s ease, border-color .25s ease, transform .25s ease;
        }
        .resource-link:hover {
          background: rgba(245,166,35,0.09);
          border-color: rgba(245,166,35,0.5);
          transform: translateY(-2px);
        }
        @media (prefers-reduced-motion: reduce) {
          .resource-link { transition: none !important; transform: none !important; }
        }
      `}</style>

      {/* -------- Hero -------- */}
      <div className="w-full" style={{ background: 'linear-gradient(135deg, #0A2540 0%, #12365C 55%, #0F2D52 100%)' }}>
        <div className="container-narrow pt-14 pb-16">
          <Link
            to="/blog"
            className="focus-ring rounded-md inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> All articles
          </Link>

          <span
            className="inline-block rounded-full px-3 py-1 mb-5 text-[11px] font-bold tracking-wider uppercase"
            style={{ background: 'rgba(245,166,35,0.16)', color: '#F5C46B', border: '1px solid rgba(245,166,35,0.3)' }}
          >
            {post.category}
          </span>

          <h1
            className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-white/55 flex-wrap">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {post.date}</span>
            <span aria-hidden="true">•</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {post.readTime}</span>
          </div>
        </div>
      </div>

      {/* -------- Cover image -------- */}
      <div className="container-narrow -mt-8">
        <div className="rounded-2xl overflow-hidden border border-token shadow-lg bg-[#0A2540] aspect-[3/2]">
          <img src={post.image} alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* -------- Body -------- */}
      <article className="container-narrow pt-10">
        <p className="text-lg leading-relaxed text-secondary-token font-medium pb-6 mb-2 border-b border-token">
          {post.excerpt}
        </p>

        <div className="article-body">
          {post.content.map((block, i) => {
            if (block.type === 'h2') return <h2 key={i}>{block.text}</h2>;
            if (block.type === 'ul') {
              return (
                <ul key={i}>
                  {block.items.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              );
            }
            return <p key={i}>{block.text}</p>;
          })}
        </div>

        {/* -------- Resource Link -------- */}
        <div className="mt-12 pt-8 border-t border-token">
          <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">
            Resource Link
          </p>
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link focus-ring flex items-center justify-between gap-4 rounded-xl border border-token bg-white px-5 py-4"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-secondary-token truncate">
                {post.sourceName}
              </span>
              <span className="block text-xs text-muted-token mt-0.5">
                Read this publication's coverage of the topic
              </span>
            </span>
            <ExternalLink className="w-4 h-4 text-primary-token flex-shrink-0" />
          </a>
          <p className="text-xs text-muted-token leading-relaxed mt-4">
            This briefing was written by Gurukrupa Powertech Solutions. The resource link points to
            a publication covering the same subject and is offered as further reading — it is not
            the source of this text. Figures quoted were accurate at the time of writing; confirm
            current scheme terms on the relevant government portal before acting on them.
          </p>
        </div>

        {/* -------- CTA -------- */}
        <div
          className="mt-12 rounded-2xl px-7 py-8 md:px-9"
          style={{ background: 'linear-gradient(135deg, #0A2540 0%, #12365C 100%)' }}
        >
          <h2 className="text-xl font-bold text-white mb-2">Want this applied to your own roof?</h2>
          <p className="text-sm text-white/65 leading-relaxed mb-6 max-w-lg">
            We size systems against your actual consumption and handle the subsidy and discom
            paperwork end to end.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/quote"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold"
              style={{ background: '#F5A623', color: '#0A2540' }}
            >
              Get a Quotation <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/quote?tab=contact"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold text-white"
              style={{ border: '1.5px solid rgba(255,255,255,0.4)' }}
            >
              Talk to our team
            </Link>
          </div>
        </div>
      </article>

      {/* -------- Related -------- */}
      <div className="container-site mt-16">
        <h2 className="text-xl font-bold text-secondary-token mb-6">More from the briefing</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {related.map((r) => (
            <Link
              key={r.id}
              to={`/blog/${r.slug}`}
              className="focus-ring group bg-white rounded-2xl border border-token overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              <div className="aspect-[3/2] overflow-hidden bg-[#0A2540]">
                <img
                  src={r.image}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="text-[11px] text-muted-token mb-2">{r.date}</p>
                <h3 className="text-sm font-bold text-secondary-token leading-snug group-hover:text-primary-token transition-colors">
                  {r.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
