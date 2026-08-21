import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ctaBg from "./assets/cta-parallax.jpg";
import {
  Sun,
  BatteryCharging,
  Menu,
  X,
  Mail,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Users,
  Zap,
  ListChecks,
  Calculator,
  BadgeCheck,
  MessageCircle,
  Star,
  Shield,
  Clock,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import WhatsAppIcon from "./components/WhatsAppIcon";
import CountUp from "./components/CountUp";
import ProjectsCarousel from "./components/ProjectsCarousel";
import ProcessTimeline from "./components/ProcessTimeline";
import SchemeCTA from "./components/SchemeCTA";
import FaqAccordion from "./components/FaqAccordion";
import { FAQS, getTopFaqs } from "./data/faqData";
import { useScrollReveal } from "./lib/useScrollReveal";
import { HOME_IMAGES, hideOnImageError } from "./data/sectionImages";
import {
  ADDRESS_LINES,
  ENGINEERING_YEARS,
  EXPERIENCE_STAT_LABEL,
  EXPERIENCE_STAT_VALUE,
  SOLAR_YEARS,
  WHATSAPP_HREF,
} from "./data/businessInfo";
import galleryImages from "./data/galleryImages.json";
const HOMEPAGE_CAROUSEL_IMAGES = galleryImages.slice(0, 9);
const TOP_FAQS = getTopFaqs();

/* ── Phase 1 — Hero carousel ──────────────────────────────────────────────
   Four slides, each pairing a real solar photograph with the message for one
   pillar of the site: who we are, what we sell, how the quote works, and what
   it pays back. Photo IDs were checked against the Unsplash CDN and visually
   reviewed — several plausible-looking solar IDs turned out to be wind farms.
   If the CDN is unreachable the <img> onError swaps in the bundled local
   background so the hero never renders empty.

   Sizing: w=2560&q=82, up from w=1920&q=72. The hero reads as *blurry* rather
   than merely dark, and none of that came from a CSS filter — there is no blur
   on these layers. It came from resolution. A 1920px frame stretched across a
   1920px viewport and then pushed to scale(1.20) by the Ken Burns sweep is
   sampling 2304 device pixels out of 1920, before the q=72 artefacts get
   magnified along with everything else. At 2560 the sweep stays inside the
   source resolution on every common desktop width. */
/* Cinematic pacing, retuned. The first pass overcorrected an old 4s slideshow
   into a 9s hold behind a 2.2s dissolve, which crossed the line from stately
   into inert — for most of each cycle nothing on screen was visibly moving. The
   deck now turns over noticeably faster while keeping the dissolve (rather than
   a cut) that makes it read as film. 5.5s is the floor for this deck: the copy
   entrance finishes around 1.3s, which leaves just over four seconds of settled
   time — enough to read the headline and take in the photograph, and the point
   below which the hero starts rushing the reader rather than moving for them. */
const HERO_INTERVAL_MS = 5500;
/* Length of the dissolve. Short enough that the change registers as an event,
   long enough that it is still a dissolve and not a cut. It stays comfortably
   inside HERO_INTERVAL_MS so every slide gets a settled stretch; the Ken Burns
   push on the photograph runs through that stretch, so nothing looks parked.
   Left at 1.3s deliberately while the rest of the hero was sped up further —
   this is the one number that was already sitting right, and shortening it any
   more turns the dissolve into a cut. */
const HERO_TRANSITION_MS = 1300;
/* One full Ken Burns sweep (in *or* out). It alternates rather than looping, so
   the photograph reverses at each end instead of snapping back — no seam, and a
   slide can sit as long as it likes and still be drifting.
   Down from 26s in two steps. This is the number that actually governs how much
   the *background* appears to move, since the interval only controls how often
   the picture changes. At 12s a slide traverses roughly 45% of the sweep during
   its time on screen — visible drift throughout, still slow enough that the eye
   never catches it starting. */
const HERO_KENBURNS_MS = 12000;
const HERO_FALLBACK_IMAGE = "/gurukrupa_hero_bg.png";

const HERO_SLIDES = [
  {
    id: "about",
    navLabel: "About Us",
    // Solar array at dusk in front of a modern commercial building
    image: "https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?auto=format&fit=crop&w=2560&q=82",
    /* "Kutch" belongs in a physical address. The site-wide switch to "Gujarat"
       was about showing reach across the whole state in claims about where we
       work — it was never meant to take the district out of where we actually
       are. Kept in step with the /about masthead, which carries the same line. */
    eyebrow: "About Us · Madhapar, Bhuj, Kutch, Gujarat",
    title: (
      <>
        <span className="text-primary-token">28 years</span> of engineering legacy,{" "}
        5 years of solar excellence.
      </>
    ),
    body:
      "Gurukrupa Powertech Solutions has spent 28 years earning its name across Gujarat on a single principle — a system is only as good as the engineering behind it. Five years ago we brought that discipline to solar, and the legacy now powers 1.9 MW of rooftop generation commissioned in the last five months alone, home by home, business by business.",
    /* Single CTA by design. This slide is the brand statement, not a sales
       pitch — the quotation and product CTAs repeat on the three slides that
       follow, and one uncontested button here reads far more confident.
       NOTE: /about is built in the next phase; the route does not exist yet. */
    primary: { label: "Discover Our Legacy", to: "/about" },
  },
  {
    id: "products",
    navLabel: "Product Range",
    // Rooftop solar installation catching the low evening sun
    image: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=2560&q=82",
    eyebrow: "Our Product Range",
    title: (
      <>
        On-Grid and Hybrid systems,{" "}
        <span className="text-primary-token">built for Gujarat</span>.
      </>
    ),
    body:
      "On-Grid systems sized against your actual billing units — no battery to maintain, full subsidy eligibility, maximum bill savings. Hybrid systems add battery backup so the lights never flicker through an outage. Both are specified for Gujarat heat, dust and coastal air, and both carry a 27-year panel warranty.",
    primary: { label: "Explore Our Products", href: "#products" },
    secondary: { label: "Get Your Free Quotation", to: "/quote" },
  },
  {
    id: "quotation",
    navLabel: "Get Quotation",
    /* Rooftop array in the foreground with a small wind turbine behind it — a
       hybrid renewable installation, which is on-brand (the wordmark's own
       strapline reads "Solar EPC | Rooftop Solar | Wind Energy"). The old comment
       here described technicians fitting a panel to a rail, which is not this
       photograph.
       `focus` exists for this frame. The source is portrait (2560×3413) in a
       landscape hero, so object-fit: cover shows only the middle ~47% of it —
       which is open sky and the turbine, with the panels cropped almost entirely
       out of the bottom. That directly contradicted the brief to make the real
       panels clearly visible, and it is a framing bug rather than a wrong
       picture. Pulling the focal point down to 82% puts the array in frame and
       leaves the turbine reading as background. */
    image: "https://images.unsplash.com/photo-1595437193398-f24279553f4f?auto=format&fit=crop&w=2560&q=82",
    focus: "center 82%",
    eyebrow: "Get Quotation",
    title: (
      <>
        Solar power, sized to your{" "}
        <span className="text-primary-token">exact load</span> — not a guess.
      </>
    ),
    body:
      "Gurukrupa Powertech Solutions designs On-Grid and Hybrid solar systems for homes and businesses across Gujarat. Tell us what you run day to day, and get a real, calculated cost estimate — not a rough approximation.",
    primary: { label: "Get Your Free Quotation", to: "/quote" },
    secondary: { label: "View Our Products", href: "#products" },
  },
  {
    id: "roi",
    navLabel: "EMI / ROI",
    // Aerial view of neatly arranged rows of solar panel arrays
    image: "https://images.unsplash.com/photo-1594818379496-da1e345b0ded?auto=format&fit=crop&w=2560&q=82",
    eyebrow: "EMI / ROI Calculator",
    title: (
      <>
        See your <span className="text-primary-token">95% savings</span> before
        you spend a rupee.
      </>
    ),
    body:
      "Enter one number — your monthly electricity bill — and the calculator returns the rest: annual and lifetime savings, the monthly EMI on any tenure and interest rate, and the exact year the system pays for itself. Free, instant, and no details required.",
    primary: { label: "Open EMI & ROI Calculator", to: "/roi-calculator" },
    secondary: { label: "Get Your Free Quotation", to: "/quote" },
  },
];

/* ── Phase 3 — ambient section decoration ─────────────────────────────────
   Presets rather than free-form props: the arrangements are a design decision
   that belongs in one place, and a `<Atmosphere orbs={…} panels={…} />` API
   would invite every future section to invent its own. Adding a section means
   adding a preset here, which is exactly the review point we want.

   The whole tree is aria-hidden and pointer-events:none — it is texture, and
   nothing in it is content. Positions are percentages so the composition holds
   from 360px to 2560px without a media query.

   Host sections must carry `atmos-host` (clip + stacking context). Without it
   the orbs escape their section and widen the document. */
const ATMOSPHERE_PRESETS = {
  /* Stats band — the first light surface after the dark hero and banner, so it
     stays quiet: one warm orb high right, one cool orb low left. */
  stats: (
    <>
      <span className="atmos-orb atmos-orb-amber" style={{ '--x': '86%', '--y': '8%', '--r': '30rem', '--dur': '28s' }} />
      <span className="atmos-orb atmos-orb-navy" style={{ '--x': '6%', '--y': '88%', '--r': '26rem', '--dur': '24s', '--dx': '-20px', '--dy': '18px' }} />
    </>
  ),

  /* The `process` preset was removed in Phase 3 along with its only consumer —
     the How We Work section, now <ProcessTimeline /> on /quote. Presets are
     deliberately not free-form props (see the note above), so an orphaned one is
     dead weight rather than a spare part: nothing can reach it without a code
     change, and that change is the review point. If the timeline ever needs
     ambient decoration on its new page, add a preset for that page here. */

  /* Product range — the largest section on the page and previously the flattest
     (three white cards on body white). It gets the fullest treatment: two glass
     panels bracketing the grid diagonally, both orbs, and the mesh. */
  products: (
    <>
      <span className="atmos-mesh" />
      <span className="atmos-orb atmos-orb-amber" style={{ '--x': '90%', '--y': '4%', '--r': '34rem', '--dur': '27s' }} />
      <span className="atmos-orb atmos-orb-navy" style={{ '--x': '2%', '--y': '58%', '--r': '30rem', '--dur': '31s', '--dx': '22px', '--dy': '20px' }} />
      <span className="atmos-panel" style={{ '--x': '84%', '--y': '68%', '--s': '210px', '--o': 0.45, '--dur': '26s' }} />
      <span className="atmos-panel" style={{ '--x': '5%', '--y': '10%', '--s': '140px', '--o': 0.38, '--dur': '21s', '--d': '-7s' }} />
    </>
  ),

  /* Subsidy + brochure — two short sections that used to sit on bare white with
     nothing between them. One shared band, one ring to give the pair a centre. */
  offer: (
    <>
      <span className="atmos-orb atmos-orb-amber" style={{ '--x': '50%', '--y': '26%', '--r': '40rem', '--dur': '29s', '--dx': '18px', '--dy': '-16px' }} />
      <span className="atmos-wave" style={{ '--x': '50%', '--y': '26%', '--r': '26rem', '--dur': '13s' }} />
      <span className="atmos-wave" style={{ '--x': '50%', '--y': '26%', '--r': '26rem', '--dur': '13s', '--d': '-6.5s' }} />
      <span className="atmos-panel" style={{ '--x': '88%', '--y': '76%', '--s': '160px', '--o': 0.34, '--dur': '23s' }} />
    </>
  ),

  /* FAQ — a long accordion column; decoration stays at the edges so it never
     sits behind body copy. */
  faq: (
    <>
      <span className="atmos-orb atmos-orb-navy" style={{ '--x': '4%', '--y': '14%', '--r': '28rem', '--dur': '30s', '--dx': '20px' }} />
      <span className="atmos-orb atmos-orb-amber" style={{ '--x': '96%', '--y': '82%', '--r': '30rem', '--dur': '25s', '--dx': '-22px', '--dy': '-18px' }} />
    </>
  ),

  /* Projects — the carousel is dense and photographic, so this is the lightest
     preset on the page: a single orb behind the heading. */
  projects: (
    <span className="atmos-orb atmos-orb-amber" style={{ '--x': '12%', '--y': '6%', '--r': '28rem', '--dur': '26s' }} />
  ),
};

function Atmosphere({ preset }) {
  const content = ATMOSPHERE_PRESETS[preset];
  if (!content) return null;
  return (
    <div className="atmos" aria-hidden="true">
      {content}
    </div>
  );
}

/* Slide CTAs are either in-app routes (`to`) or same-page anchors (`href`). */
function HeroCta({ cta, className, showArrow }) {
  const content = (
    <>
      {cta.label}
      {showArrow && <ArrowRight className="w-4 h-4" />}
    </>
  );
  return cta.to ? (
    <Link to={cta.to} className={className}>
      {content}
    </Link>
  ) : (
    <a href={cta.href} className={className}>
      {content}
    </a>
  );
}

/* ── Component brand marks ──────────────────────────────────────────────────
   Monogram badges, not logo files.

   There are no vendor logos in this repository — public/ holds Gurukrupa's own
   wordmark, three product photographs and the project gallery, and nothing
   else. The two ways to get real logos here are both bad: hot-linking them off
   a manufacturer's CDN is an unreliable dependency on someone else's server and
   an uncleared use of their trademark, and committing scraped copies is the
   same problem with the reliability removed. Either would also drop five
   mismatched raster marks — different aspect ratios, different padding, some
   with baked-in white backgrounds — into a spec table that is currently clean.

   So each brand gets a tinted monogram built from the site's own surface
   vocabulary. It does the job the request wanted from a logo: the eye finds the
   brand before it reads the row. `tint` is a plausible house colour per vendor,
   deliberately desaturated to sit inside this palette rather than an attempt to
   reproduce anyone's exact brand value.

   Swapping in real artwork later is a one-line change per entry — replace
   `initials` with a `src` and render an <img> in the same 1.75rem box. */
const BRAND_MARKS = {
  Waree: { initials: 'W', tint: '#1E63B8' },
  UTL: { initials: 'U', tint: '#D64518' },
  Adani: { initials: 'A', tint: '#1B4E9B' },
  Solaryaan: { initials: 'S', tint: '#1E9E63' },
  Polycab: { initials: 'P', tint: '#C81E2D' },
};

function BrandMark({ name }) {
  const mark = BRAND_MARKS[name];
  if (!mark) return null;
  return (
    <span className="brand-mark" style={{ '--brand-tint': mark.tint }} aria-hidden="true">
      {mark.initials}
    </span>
  );
}

/* Grouped by manufacturer rather than one row per panel. The flat list repeated
   "Waree", "UTL" and "Adani" twice each, which with a mark against every row
   would have stamped the same badge down the column six times. */
const PANEL_BRANDS = [
  { brand: 'Waree', variants: [['Topcon', '585W'], ['Bificial', '540W']] },
  { brand: 'UTL', variants: [['Topcon', '590W'], ['Bificial', '550W / 600W']] },
  { brand: 'Adani', variants: [['Topcon', '620W'], ['Bificial', '540W / 555W']] },
];

export default function Homepage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  /* The outgoing slide stays mounted and fully opaque underneath the incoming
     one for the length of the dissolve, so the fade never shows the section
     background through the middle of the transition. */
  const [prevSlide, setPrevSlide] = useState(null);
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  /* Bumped on every manual click so the autoplay effect re-runs and restarts
     its timer. Without it, pressing an arrow a moment before the interval fires
     would advance the deck twice in quick succession. */
  const [navNonce, setNavNonce] = useState(0);

  /* The interval closure is created once and must not capture a stale slide
     index, so it reads position from a ref rather than the render scope. */
  const activeSlideRef = useRef(0);
  useEffect(() => {
    activeSlideRef.current = activeSlide;
  }, [activeSlide]);

  /* Advance/retreat. The transition is a dissolve, so it is symmetric — the
     loop looks identical running on its own as it does under manual control,
     in either direction. */
  const goToSlide = React.useCallback((next) => {
    const target = (next + HERO_SLIDES.length) % HERO_SLIDES.length;
    const current = activeSlideRef.current;
    if (target === current) return;
    setPrevSlide(current);
    setActiveSlide(target);
    setNavNonce((n) => n + 1);
  }, []);

  const nextSlide = React.useCallback(
    () => goToSlide(activeSlideRef.current + 1),
    [goToSlide]
  );
  const previousSlide = React.useCallback(
    () => goToSlide(activeSlideRef.current - 1),
    [goToSlide]
  );

  /* Autoplay runs unconditionally — no hover or focus pause. The loop is meant
     to read as continuous motion, and the arrows are always available if the
     visitor wants to drive it themselves.

     Reduced-motion is the one exception and stays: an auto-advancing carousel
     that cannot be stopped is precisely what that setting exists to prevent.
     Those visitors get a static first slide plus working arrows. */
  useEffect(() => {
    if (prefersReducedMotion.current) return;
    const timer = setInterval(() => {
      // Don't burn through slides while the tab is in the background.
      if (document.hidden) return;
      const current = activeSlideRef.current;
      setPrevSlide(current);
      setActiveSlide((current + 1) % HERO_SLIDES.length);
    }, HERO_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [navNonce]);

  // Dynamic navbar & back-to-top visibility
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* D5 — scroll-entrance animations. The observer that used to be written out
     here moved to lib/useScrollReveal.js when entry direction became a
     site-wide rule rather than a homepage one: /about needs the same behaviour
     and was otherwise going to get a second copy of the same effect.
     Scoped to this page's root rather than to `document`, which is the one
     behavioural change — nothing outside this tree used those classes. */
  const revealRoot = useScrollReveal();

  /* A `navLinks` array used to sit here, left over from when this page rendered
     its own nav bar. It had been dead for several phases — the site header owns
     navigation now — and its "#brochure" entry pointed at a section that no
     longer exists, so it is deleted rather than left as a misleading record of
     what this page contains. */

  return (
    <div ref={revealRoot} className="gps-root min-h-screen w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .gps-root {
          --color-primary: #F5A623;
          --color-primary-dark: #D98D0F;
          /* QA Phase 9 fix: gold #F5A623 measures 2.03:1 on white — fails
             WCAG AA (needs 4.5:1). This darker variant measures 4.91:1 and
             is used ONLY for small text on light backgrounds (eyebrow/kicker
             labels). The original --color-primary is untouched and still
             used for buttons/icons/dark-background text, where it already
             passed contrast checks. */
          --color-primary-text: #9C6509;
          --color-secondary: #0A2540;
          --color-secondary-light: #12365C;
          --color-success: #1E9E63;
          --color-bg: #F4F6FB;
          --color-text: #1C1F26;
          --color-text-muted: #5A6270;
          --color-border: #E2E5EA;
          /* Premium tokens */
          --glow-gold: rgba(245,166,35,0.22);
          --glow-gold-strong: rgba(245,166,35,0.38);
          --shadow-card: var(--elev-2);
          --shadow-card-hover: var(--elev-4);
          --glass-bg: rgba(255,255,255,0.82);
          --glass-border: rgba(255,255,255,0.55);
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--color-text);
          background: linear-gradient(160deg, #F5F7FD 0%, #EEF0F8 52%, #F1F3FA 100%);
        }
        .gps-root h1, .gps-root h2, .gps-root h3, .gps-root .font-display {
          font-family: 'Space Grotesk', system-ui, sans-serif;
        }
        .bg-primary-token { background: var(--color-primary); }
        .text-primary-token { color: var(--color-primary); }
        .text-eyebrow-token { color: var(--color-primary-text); }
        .bg-secondary-token { background: var(--color-secondary); }
        .bg-secondary-light-token { background: var(--color-secondary-light); }
        .text-secondary-token { color: var(--color-secondary); }
        .text-muted-token { color: var(--color-text-muted); }
        .border-token { border-color: var(--color-border); }
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
        .btn-outline-token {
          border: 1.5px solid var(--color-secondary);
          color: var(--color-secondary);
          transition: background .15s ease, color .15s ease;
        }
        .btn-outline-token:hover { background: var(--color-secondary); color: #fff; }
        .btn-outline-light {
          border: 1.5px solid rgba(255,255,255,0.42);
          color: #fff;
          backdrop-filter: blur(6px);
          background: rgba(255,255,255,0.07);
          transition: background .3s ease, border-color .3s ease, box-shadow .3s ease, transform .3s ease;
        }
        .btn-outline-light:hover {
          background: rgba(255,255,255,0.15);
          border-color: rgba(255,255,255,0.8);
          box-shadow: 0 4px 20px rgba(255,255,255,0.15), 0 0 15px rgba(255,255,255,0.1);
          transform: translateY(-2px) scale(1.02);
        }

        /* Premium card — Phase 3: the shadow now comes from the global
           elevation scale, and the card gets the two things that actually make
           it read as a physical panel rather than a white rectangle: a top-lit
           gradient surface and a lit top bevel. */
        .card-hover {
          transition: transform .32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow .32s ease, border-color .32s ease;
          background-image: var(--surface-raised);
          box-shadow: var(--shadow-card), var(--bevel-light);
        }
        .card-elevated {
          box-shadow: var(--shadow-card), var(--ring-gold), var(--glow-gold-soft), var(--bevel-light);
        }
        .card-hover:hover {
          transform: translateY(-8px) scale(1.015);
          box-shadow:
            var(--shadow-card-hover),
            var(--ring-gold),
            var(--glow-gold-soft),
            var(--bevel-light);
          border-color: rgba(245,166,35,0.4) !important;
        }

        /* Parallax base classes */
        .parallax-bg {
          background-attachment: fixed;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
        }

        /* ── Hero carousel ──────────────────────────────────────────────
           Full-bleed photo layers that dissolve into one another while the
           photograph itself breathes on a slow Ken Burns push. Three rules keep
           it on the compositor: only transform and opacity animate, every
           transform is 3D so each layer gets its own GPU layer, and nothing
           reads layout mid-transition. */
        .hero-carousel {
          /* The header is now fixed and floats over this section rather than
             occupying a row above it, so the hero owns the whole first
             viewport. Its py-24/md:py-28 padding clears the 6rem bar. */
          min-height: 100vh;
          background: #071A2E;
          /* First-paint entry for the section as a whole: a plain fade up from
             the navy ground, so the hero arrives rather than appearing. Runs
             once — the section mounts once and is never keyed.

             Opacity only, deliberately. A transform here would make this a
             containing block for any fixed-position descendant, and it also
             would not compose with the Ken Burns transform already running on
             the photo inside. The upward drift lives on the copy instead, which
             is where it is legible anyway. */
          animation: heroSectionIn 800ms ease-out both;
        }
        @keyframes heroSectionIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .hero-slide-layer {
          position: absolute;
          inset: 0;
          opacity: 0;
          overflow: hidden;
          will-change: opacity;
        }
        /* True crossfade with no mid-point dip. The incoming layer sits on top
           and fades up from nothing; the outgoing layer underneath holds at
           full opacity for most of the transition and only drops once it is
           already completely covered. Fading both at once is what produces the
           cheap flash of background through the middle of a dissolve. */
        .hero-slide-layer.is-active {
          z-index: 2;
          animation: heroDissolveIn ${HERO_TRANSITION_MS}ms cubic-bezier(0.37, 0, 0.24, 1) both;
        }
        .hero-slide-layer.is-leaving {
          z-index: 1;
          animation: heroDissolveOut ${HERO_TRANSITION_MS}ms linear both;
        }
        @keyframes heroDissolveIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes heroDissolveOut {
          0%, 82% { opacity: 1; }
          100%    { opacity: 0; }
        }

        .hero-slide-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          /* Resting scale matches the start of the Ken Burns keyframes, so a
             layer that is not animating (reduced motion) still fills the frame
             with no exposed edge. */
          transform: scale(1.04);
          will-change: transform;
        }
        /* Ken Burns. A push from 1.04 to 1.13 with a touch of drift, easing at
           both ends and reversing rather than restarting — the frame is always
           moving but never appears to start or stop. It runs on the outgoing
           layer too, so nothing freezes while it dissolves away.
           Slack check: at scale 1.04 there is 2% of overscan per side and the
           drift asks for 1%, so an edge can never be exposed.
           The ceiling came down from 1.20 as part of the sharpness fix — every
           percent of scale is upsampling, and the top of the old sweep was
           magnifying the photograph by a fifth. Shorter travel over a shorter
           duration nets out as *more* apparent movement, not less. */
        .hero-slide-layer.is-active .hero-slide-img,
        .hero-slide-layer.is-leaving .hero-slide-img {
          animation: heroKenBurns ${HERO_KENBURNS_MS}ms ease-in-out infinite alternate;
        }
        /* Alternating slides start from the far end of the sweep, so the deck
             does not push in on every single frame — two zoom in, two pull back.
             The layers are the first four children of the section. */
        .hero-slide-layer:nth-child(even) .hero-slide-img {
          animation-direction: alternate-reverse;
        }
        @keyframes heroKenBurns {
          from { transform: scale(1.04) translate3d(-1%, 0.8%, 0); }
          to   { transform: scale(1.13) translate3d(1%, -0.8%, 0); }
        }

        /* Legibility scrim, rebalanced. The previous values were tuned purely for
           worst-case contrast and the result was that the photographs stopped
             being photographs — a 0.46 floor even at the far right edge, over a
           full-frame 0.22 darkener, left every slide reading as a navy wash with
           a suggestion of solar panel in it.

           The wedge now falls away much harder toward the right, so the actual
           subject of each frame (the array) sits in near-clear air, and the
           darkness is concentrated where it is doing work: the left column where
           the type lives. Three stacked layers, three jobs — the copy-column
           wedge, a light full-frame darkener for overall cohesion, and a bottom
           riser.

           Contrast held, not guessed. Worst case for the body copy is the right
           edge of the paragraph measure (max-w-2xl ends near 48% of a 1440px
           viewport) over the brightest sky any of the four frames carries,
           ~rgb(200,215,235). At 48% the wedge is 0.74 and the full-frame layer
           adds 0.16, compositing to 0.78 — that blend lands near rgb(48,63,81),
           relative luminance 0.049, so white type measures about 10.4:1. Even the
           title's far edge (max-w-3xl, ~55%) holds near 9.9:1. AAA either way. */
        .hero-scrim {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(100deg,
              rgba(4,14,27,0.92) 0%,
              rgba(5,20,37,0.86) 26%,
              rgba(6,23,42,0.74) 48%,
              rgba(8,30,53,0.40) 74%,
              rgba(10,37,64,0.18) 100%),
            linear-gradient(to top,
              rgba(3,12,24,0.68) 0%,
              rgba(4,16,30,0.22) 38%,
              rgba(4,16,30,0.16) 100%),
            linear-gradient(to bottom,
              rgba(3,12,24,0.34) 0%,
              transparent 24%);
          pointer-events: none;
        }
        @media (max-width: 767px) {
          /* Portrait crops land on the middle of the frame, which on several
             slides is open sky — the brightest part of the photograph and the
             worst case for white text, so mobile gets a vertical scrim instead
             of the desktop wedge. Type runs the full width here, so this cannot
             open up the way the desktop wedge does; it comes down only as far as
             the same ~10:1 budget allows. Against a bright sky, 0.70 still
             leaves white type near 12:1. */
          .hero-scrim {
            background:
              linear-gradient(180deg,
                rgba(3,12,24,0.66) 0%,
                rgba(5,20,37,0.74) 45%,
                rgba(4,14,27,0.86) 100%);
          }
        }

        /* ⚠ Overlay stacking — do not remove these z-indexes.
           .hero-slide-layer.is-active carries z-index:2 so the incoming photo
           can dissolve over the outgoing one. Every overlay below is a later
           sibling but sat at z-index:auto, which puts it in paint step 8 while
           the photo is in step 9 — so all four overlays, the legibility scrim
           included, were rendering UNDERNEATH the photograph. The hero only
           looked acceptable because slide 1's desktop crop happens to be dark;
           at mobile widths the same crop is bright sky and the white copy was
           sitting straight on it.

           Anything decorative added to this section needs a z-index in the
           3–9 band: above the photo layers (1–2), below the copy (10) and the
           carousel controls (20). */
        .hero-scrim,
        .hero-glow,
        .hero-dot-pattern,
        .hero-bottom-fade,
        .hero-particles { z-index: 3; }

        /* Copy block is keyed on the active slide, so it remounts and replays
           this entrance every time the carousel advances — it is both the
           page-load entry and the per-slide entry.

           Two rewrites. The original animated filter: blur(6px) down to 0
           alongside a vertical rise, and the blur was the problem — a large
           display face resolving out of a 6px gaussian is unpleasant to look at,
           it makes the eye try to focus something that cannot be focused yet, and
           it forces a full-raster repaint of the text on every frame (the one
           property here that cannot ride the compositor).

           Now horizontal: each element slides in from the left on a staggered
           delay, so the block assembles top-down rather than arriving at once.
           Travel is the full 40px from md up, trimmed to 28px on phones where the
           copy column starts only 64px from the viewport edge.

           Easing is expo-out — nearly all the distance is covered in the first
           third of the duration and it glides to a stop with no overshoot, which
           is what reads as "smooth" on a long slide. A symmetric ease-in-out over
           40px looks mechanical; anything with a bounce fights the photograph.

           Re-trigger is structural, not scripted: the wrapper is keyed on
           activeSlide, so React remounts the whole block on every advance and the
           CSS animation replays from zero. That covers the initial load and each
           slide change with one mechanism, and it cannot fall out of sync with
           the carousel the way a class-toggling effect could. */
        @keyframes heroCopyIn {
          from { opacity: 0; transform: translate3d(var(--hero-slide-from, -40px), 0, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .hero-copy-item {
          --hero-slide-from: -28px;
          animation: heroCopyIn 850ms cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: opacity, transform;
        }
        @media (min-width: 768px) {
          .hero-copy-item { --hero-slide-from: -40px; }
        }
        /* Second line of defence behind the scrim. The shadows are wide and
           soft rather than tight and dark, so they read as depth rather than as
           an outline, and they hold the text even on the brightest frame of the
           Ken Burns sweep. */
        .hero-title {
          text-shadow:
            0 1px 2px rgba(2,10,20,0.55),
            0 4px 20px rgba(2,10,20,0.60),
            0 12px 56px rgba(2,10,20,0.45);
        }
        .hero-body {
          text-shadow:
            0 1px 3px rgba(2,10,20,0.60),
            0 2px 18px rgba(2,10,20,0.50);
        }
        /* ── Slide eyebrow ──────────────────────────────────────────────
           This was a glass capsule: a dark plate, a gold hairline border, a
           looping specular sweep, a pulsing dot, and the label itself filled
           with a gold gradient. Each was well-made in isolation, and together
           they added up to what the business called clunky — a short caption
           wearing a large amount of chrome, over a photograph that is already
           doing the work.

           It is now type and one rule. Nothing encloses the label.

           Why this reads as more premium rather than merely as less:
             · Wide tracking on small caps is the oldest signal in typography
               for "this is a considered label". At 0.24em these few words read
               as a masthead line rather than as a tag
             · The label is near-white, not gold. Gold type on a gold-tinted
               plate was the source of the yellow cast the business objected
               to; white on photography is what the premium end of the market
               actually does, and it holds on every frame of the Ken Burns sweep
             · A single hairline carries the brand colour instead. One gold
               element, one pixel tall, is worth more than a filled chip

           ── Why the rule draws once and does not loop ─────────────────
           The old capsule looped a sheen to say "this is live". It does not
           need to: the nav dots at the foot of the hero already run a gold fill
           across the active track over exactly HERO_INTERVAL_MS, which is a
           real progress readout. A second looping animation up here would be
           the same information twice, competing for the same glance.

           So the rule animates once, as the last beat of the slide's entrance
           choreography — eyebrow at 60ms, headline at 200ms, rule at 320ms —
           and then rests. It is a reveal, not a meter.

           The text-shadow is load-bearing rather than decorative. This is the
           smallest type in the hero and it now sits directly on the photograph
           with no plate behind it, so the shadow is what makes its legibility a
           property of the component instead of a property of whichever frame
           happens to be underneath. */
        .hero-eyebrow {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.55rem;
        }
        .hero-eyebrow-label {
          color: rgba(255,255,255,0.87);
          text-shadow:
            0 1px 3px rgba(2,10,20,0.70),
            0 2px 16px rgba(2,10,20,0.55);
        }
        /* align-self:stretch makes the rule exactly as wide as the label above
           it — a column box is sized by its widest child, and that child is the
           text. So the rule re-measures itself on every slide, from the short
           "Get Quotation" to the long Madhapar line, with nothing to configure.

           The gradient puts brand gold at the start and lets it fall away to
           almost nothing, so the rule reads as lit from the left rather than as
           a drawn border with two ends. */
        .hero-eyebrow-rule {
          align-self: stretch;
          height: 1px;
          border-radius: 1px;
          background: linear-gradient(90deg,
            #F5A623 0%,
            rgba(245,166,35,0.62) 34%,
            rgba(255,255,255,0.16) 100%);
          box-shadow: 0 0 10px rgba(245,166,35,0.42);
          transform-origin: left center;
          animation: heroEyebrowRule 820ms cubic-bezier(0.16, 1, 0.3, 1) 320ms both;
        }
        @keyframes heroEyebrowRule {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          /* Unlike the sheen this replaced, the rule has a meaningful resting
             state — so it is kept, simply already drawn. */
          .hero-eyebrow-rule { animation: none; transform: none; opacity: 1; }
        }

        /* Manual controls — vertically centred against the left and right edges
           of the slide, which is where a visitor's hand goes looking for them.
           They used to sit in the two bottom corners: technically reachable, but
           it read as a caption row bolted under the photograph rather than as
           controls belonging to it, and on a 100vh hero they were most of a
           screen away from the vertical centre of attention.

           Premium treatment, four ingredients that separate this from a flat
           translucent circle:
             · a top-lit glass gradient, so the disc has a light source
             · a real double edge — outer hairline ring plus an inset bevel —
               which is what makes a control look machined rather than drawn
             · a layered cast shadow (contact + ambient) so it floats above the
               photograph instead of being printed on it
             · gold arrives only on interaction, and arrives on the whole disc
               (fill, ring, glow, arrow) at once */
        .hero-nav-btn {
          position: relative;
          /* 2.75rem = 44px, the floor for a touch target. Moving the controls to
             the vertical centre puts them alongside the copy rather than below
             it, so on a phone every pixel of disc is a pixel the paragraph has to
             give up — this is as small as it is allowed to get. */
          width: 2.75rem;
          height: 2.75rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          color: rgba(255,255,255,0.95);
          background:
            linear-gradient(158deg,
              rgba(255,255,255,0.20) 0%,
              rgba(255,255,255,0.10) 46%,
              rgba(255,255,255,0.05) 100%);
          border: 1px solid rgba(255,255,255,0.34);
          backdrop-filter: blur(16px) saturate(170%);
          -webkit-backdrop-filter: blur(16px) saturate(170%);
          box-shadow:
            0 2px 6px rgba(3,12,24,0.28),
            0 12px 32px -8px rgba(3,12,24,0.44),
            inset 0 1px 0 rgba(255,255,255,0.38),
            inset 0 -1px 0 rgba(3,12,24,0.18);
          transition: background .32s ease, border-color .32s ease, color .32s ease,
                      transform .32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow .32s ease;
        }
        /* Outer halo ring, drawn as a pseudo-element so it can scale on hover
           independently of the disc. At rest it is almost invisible; on hover it
           becomes the gold rim. */
        .hero-nav-btn::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.14);
          opacity: 0;
          transform: scale(0.92);
          transition: opacity .32s ease, transform .32s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color .32s ease;
          pointer-events: none;
        }
        .hero-nav-btn:hover {
          background:
            linear-gradient(158deg,
              rgba(245,166,35,0.34) 0%,
              rgba(245,166,35,0.18) 50%,
              rgba(245,166,35,0.10) 100%);
          border-color: rgba(245,166,35,0.82);
          color: #FFF4DC;
          box-shadow:
            0 2px 6px rgba(3,12,24,0.30),
            0 16px 40px -10px rgba(3,12,24,0.50),
            0 0 28px rgba(245,166,35,0.30),
            inset 0 1px 0 rgba(255,255,255,0.44),
            inset 0 -1px 0 rgba(3,12,24,0.16);
        }
        .hero-nav-btn:hover::before {
          opacity: 1;
          transform: scale(1);
          border-color: rgba(245,166,35,0.42);
        }
        /* Directional nudge on hover, scale on press. Both are set on the same
           property, so the :active rule has to restate the translate or pressing
           a hovered button would snap it back to centre mid-gesture. */
        .hero-nav-btn-prev:hover { transform: translateX(-3px); }
        .hero-nav-btn-next:hover { transform: translateX(3px); }
        .hero-nav-btn-prev:active { transform: translateX(-3px) scale(0.93); }
        .hero-nav-btn-next:active { transform: translateX(3px) scale(0.93); }
        @media (min-width: 768px) {
          .hero-nav-btn { width: 3.75rem; height: 3.75rem; }
        }

        /* ── Slide indicators ─────────────────────────────────────────────────
           Same glass vocabulary as the arrow discs, so the two read as one
           control set rather than as two designers' work: top-lit gradient,
           hairline ring, blur behind. The rail is a single plate holding four
           targets — grouping them keeps the row legible over a photograph that
           changes every 5.5 seconds, where four unbacked dots would sometimes
           land on white cloud and vanish. */
        .hero-dots {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.7rem;
          border-radius: 999px;
          background:
            linear-gradient(158deg,
              rgba(255,255,255,0.18) 0%,
              rgba(255,255,255,0.09) 50%,
              rgba(255,255,255,0.05) 100%);
          border: 1px solid rgba(255,255,255,0.28);
          backdrop-filter: blur(16px) saturate(170%);
          -webkit-backdrop-filter: blur(16px) saturate(170%);
          box-shadow:
            0 2px 6px rgba(3,12,24,0.26),
            0 12px 32px -10px rgba(3,12,24,0.42),
            inset 0 1px 0 rgba(255,255,255,0.34);
        }
        /* The button is the touch target; the visible dot is drawn inside it.
           A 10px dot is well under the 44px minimum, so the padding here is
           doing accessibility work rather than layout work — which is why the
           height is generous and the visible mark is not. */
        .hero-dot {
          position: relative;
          width: 0.7rem;
          height: 1.6rem;
          padding: 0;
          border: 0;
          background: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: width .45s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero-dot::before {
          content: '';
          position: absolute;
          left: 0; right: 0;
          height: 0.45rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.40);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.35);
          transition: background .32s ease, height .45s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero-dot:hover::before { background: rgba(255,255,255,0.72); }
        /* Active: the dot stretches into a track and the fill runs across it. */
        .hero-dot.is-active { width: 3.25rem; }
        .hero-dot.is-active::before {
          height: 0.45rem;
          background: rgba(3,12,24,0.34);
        }
        .hero-dot-fill {
          position: absolute;
          left: 0;
          height: 0.45rem;
          width: 0;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--color-primary) 0%, #FFD166 100%);
          box-shadow: 0 0 12px rgba(245,166,35,0.55);
          pointer-events: none;
        }
        .hero-dot.is-active .hero-dot-fill {
          animation: heroDotProgress ${HERO_INTERVAL_MS}ms linear both;
        }
        @keyframes heroDotProgress {
          from { width: 0; }
          to   { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-dot, .hero-dot::before { transition: none; }
          /* Autoplay is disabled under this setting, so there is no countdown to
             report — the active dot is simply filled. */
          .hero-dot.is-active .hero-dot-fill { animation: none; width: 100%; }
        }

        /* Clearance for the centred controls. Moving them from the bottom corners
           to the vertical middle puts them level with the copy instead of below
           it, so the column has to step in or the left disc lands on top of the
           headline. This is the one place that has to know about the button size,
           hence the note: .hero-nav-btn is 2.75rem below md and 3.75rem above,
           and the wrapper's gutter is px-1 / sm:px-4 / lg:px-8. Every pairing
           below leaves ≥12px between a disc and the nearest character.

           The right side needs clearing too, but only up to ~900px, and the band
           is worth being exact about rather than padding everywhere:

             · below md the text runs the full width — both sides need it
             · 768px–880px the column is as wide as the gap between the gutters
               allows, so its right edge lands straight on the next-slide disc.
               Measured at 820px: column right edge 792, disc starts at 744 — a
               48px overlap that a left-only inset does nothing about
             · from ~880px the max-w-3xl cap (768px) stops the column growing
               while the disc keeps moving outward, so the two separate on their
               own and a right inset would only narrow the headline for nothing.
               1440px has 540px of clear air between them

           Hence a right inset that switches off past 900px. That is what keeps
           the desktop headline on three lines instead of four. */
        .hero-copy-col {
          padding-left: 3rem;
          padding-right: 3rem;
        }
        @media (min-width: 768px) {
          .hero-copy-col {
            padding-left: 4rem;
            padding-right: 0;
          }
        }
        @media (min-width: 768px) and (max-width: 900px) {
          .hero-copy-col { padding-right: 4rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          /* Cut the dissolve and the Ken Burns, keep the swap. The arrows still
             work; nothing moves on its own. */
          .hero-carousel { animation: none; opacity: 1; }
          .hero-slide-layer.is-active { animation: none; opacity: 1; }
          .hero-slide-layer.is-leaving { animation: none; opacity: 0; }
          .hero-slide-layer.is-active .hero-slide-img,
          .hero-slide-layer.is-leaving .hero-slide-img {
            animation: none;
            transform: scale(1.04);
          }
          .hero-copy-item { animation: none; }
          .hero-nav-btn, .hero-nav-btn::before { transition: none; }
          .hero-nav-btn:hover, .hero-nav-btn:active,
          .hero-nav-btn-prev:hover, .hero-nav-btn-next:hover,
          .hero-nav-btn-prev:active, .hero-nav-btn-next:active { transform: none; }
          .hero-nav-btn:hover::before { transform: none; }
        }


        /* ── Ambient 3D atmosphere ─────────────────────────────────────
           The light half of this page was a stack of flat fills — #F9FAFE in
           the process band, rgba(10,37,64,0.03) in the stats band, and three
           sections (products, subsidy, brochure) carrying no background at all,
           sitting straight on body white. Against a dark cinematic hero and a
           navy header that read as a flat document.

           Rather than inventing a bespoke decoration per section, everything
           below composes from four primitives: a glowing orb, an isometric
           glass solar panel, a perspective mesh floor, and an expanding energy
           ring. Sections pick an arrangement via <Atmosphere preset="…" />.

           Budget discipline, so this reads as atmosphere and not as clutter:
             · at most four decorative elements in any one section
             · orbs cap at 0.16 alpha at their centre, mesh lines at 0.05
             · only transform and opacity animate, on 18–30s loops, so the
               motion is below the threshold of being noticed directly
             · nothing takes a pointer event, nothing is in the a11y tree
             · every animation is dropped under prefers-reduced-motion */
        .atmos {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        /* A host clips its own decoration (so no orb can widen the document and
           produce a horizontal scrollbar) and lifts real content above it. */
        .atmos-host {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }
        .atmos-host > *:not(.atmos) { position: relative; z-index: 1; }

        /* Primitive 1 — glowing orb. Positioned by centre, not by corner, so
           --x/--y read the way a designer would expect. */
        .atmos-orb {
          position: absolute;
          left: var(--x); top: var(--y);
          width: var(--r); height: var(--r);
          margin: calc(var(--r) / -2);
          border-radius: 50%;
          filter: blur(30px);
          animation: atmosDrift var(--dur, 26s) ease-in-out infinite alternate;
          animation-delay: var(--d, 0s);
        }
        .atmos-orb-amber {
          background: radial-gradient(circle at 50% 50%,
            rgba(245,166,35,0.16) 0%, rgba(245,166,35,0.06) 42%, transparent 70%);
        }
        .atmos-orb-navy {
          background: radial-gradient(circle at 50% 50%,
            rgba(18,54,92,0.14) 0%, rgba(10,37,64,0.05) 45%, transparent 72%);
        }
        @keyframes atmosDrift {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to   { transform: translate3d(var(--dx, 26px), var(--dy, -22px), 0) scale(1.08); }
        }

        /* Primitive 2 — isometric glass solar panel. Two gridline layers over a
           glass gradient give it photovoltaic cells; the rotateX/rotateZ pair is
           a flat isometric projection rather than a perspective one, which keeps
           the shape predictable at every viewport width. */
        .atmos-panel {
          position: absolute;
          left: var(--x); top: var(--y);
          width: var(--s);
          height: calc(var(--s) * 0.66);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.75);
          background-image:
            linear-gradient(rgba(10,37,64,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10,37,64,0.055) 1px, transparent 1px),
            linear-gradient(135deg, rgba(255,255,255,0.62) 0%, rgba(233,240,252,0.30) 55%, rgba(255,255,255,0.10) 100%);
          background-size:
            calc(var(--s) / 6) calc(var(--s) / 6),
            calc(var(--s) / 6) calc(var(--s) / 6),
            100% 100%;
          box-shadow:
            0 26px 60px rgba(10,37,64,0.10),
            inset 0 1px 0 rgba(255,255,255,0.9);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          opacity: var(--o, 0.5);
          transform: rotateX(54deg) rotateZ(-36deg);
          animation: atmosFloat var(--dur, 22s) ease-in-out infinite alternate;
          animation-delay: var(--d, 0s);
        }
        @keyframes atmosFloat {
          from { transform: rotateX(54deg) rotateZ(-36deg) translate3d(0, 0, 0); }
          to   { transform: rotateX(54deg) rotateZ(-36deg) translate3d(0, -26px, 0); }
        }

        /* Primitive 3 — perspective mesh floor. Masked out toward the top so it
           dissolves rather than ending on a hard line. */
        .atmos-mesh {
          position: absolute;
          left: -10%; right: -10%; bottom: -12%;
          height: 46%;
          background-image:
            linear-gradient(rgba(10,37,64,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10,37,64,0.05) 1px, transparent 1px);
          background-size: 46px 46px;
          transform: perspective(560px) rotateX(66deg);
          transform-origin: bottom center;
          -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.95), transparent 76%);
          mask-image: linear-gradient(to top, rgba(0,0,0,0.95), transparent 76%);
        }
        /* Dark-band variant — the navy sections need light lines, not dark. */
        .atmos-mesh-light {
          background-image:
            linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px);
        }

        /* Primitive 4 — energy ring. One slow expanding pulse, used sparingly:
           it is the only element here that draws the eye on purpose. */
        .atmos-wave {
          position: absolute;
          left: var(--x); top: var(--y);
          width: var(--r); height: var(--r);
          margin: calc(var(--r) / -2);
          border-radius: 50%;
          border: 1px solid rgba(245,166,35,0.20);
          opacity: 0;
          animation: atmosPulse var(--dur, 11s) ease-out infinite;
          animation-delay: var(--d, 0s);
        }
        @keyframes atmosPulse {
          0%   { transform: scale(0.5);  opacity: 0; }
          18%  { opacity: 0.5; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .atmos-orb, .atmos-panel, .atmos-wave { animation: none !important; }
          /* The rings only exist as motion, so give them a resting state
             rather than leaving three invisible circles on the page. */
          .atmos-wave { opacity: 0.3; }
        }

        /* ── CTA ── dark overlay with CTA image */
        .cta-section-bg {
          background:
            linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(10,37,64,0.88) 100%),
            url(${ctaBg});
        }

        /* The map frame. An iframe is a hole in the page — it has no shadow of
           its own and nothing lights its edge, so at the old white-10 hairline
           it read as a rectangle cut out of the section. This gives it the same
           treatment every other object on a dark band gets: a hairline edge, a
           lit top bevel, a gold ring at low alpha to tie it to the brand, and a
           deep ambient shadow so it sits on the section rather than in it. */
        .contact-map {
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow:
            0 0 0 1px rgba(245,166,35,0.18),
            inset 0 1px 0 rgba(255,255,255,0.14),
            var(--elev-4);
        }

        /* Layered atmospheric glow: golden sunburst + ambient deep blues.
           The two navy radials used to sit at 0.55 and 0.50 — on top of the
           scrim they were the single biggest reason the photographs looked hazy
           rather than dark, because a wide low-contrast blue veil over an image
           is exactly what an out-of-focus lens looks like. Both are now light
           enough to read as light in the room instead of fog in front of it. */
        .hero-glow {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 55% 75% at 72% 42%, rgba(245,166,35,0.13) 0%, rgba(245,166,35,0.035) 45%, transparent 65%),
            radial-gradient(ellipse 45% 55% at 15% 80%, rgba(18,54,92,0.30) 0%, transparent 58%),
            radial-gradient(ellipse 75% 48% at 50% -8%, rgba(15,46,88,0.26) 0%, transparent 55%);
          pointer-events: none;
        }

        /* Subtle enterprise dot-grid texture over hero */
        .hero-dot-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px);
          background-size: 30px 30px;
          pointer-events: none;
        }

        /* Seamless gradient fade at hero bottom */
        .hero-bottom-fade {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 72px;
          background: linear-gradient(to bottom, transparent, rgba(244,246,251,0.16));
          pointer-events: none;
        }

        /* Floating ambient particles */
        @keyframes floatA {
          0%,100% { transform: translateY(0px) scale(1);   opacity: .22; }
          50%      { transform: translateY(-20px) scale(1.15); opacity: .40; }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0px);  opacity: .13; }
          50%      { transform: translateY(-28px); opacity: .30; }
        }
        @keyframes floatC {
          0%,100% { transform: translateY(0px) scale(1);   opacity: .08; }
          50%      { transform: translateY(-15px) scale(1.1); opacity: .20; }
        }
        .particle-a { animation: floatA 6s ease-in-out infinite; }
        .particle-b { animation: floatB 8.5s ease-in-out infinite; }
        .particle-c { animation: floatC 5.5s ease-in-out infinite; }

        .flow-line { stroke-dasharray: 6 8; animation: flowmove 2.6s linear infinite; }
        @keyframes flowmove { to { stroke-dashoffset: -140; } }
        .pulse-dot { animation: pulseDot 2.2s ease-in-out infinite; }
        @keyframes pulseDot { 0%,100% { opacity: .5; r: 4; } 50% { opacity: 1; r: 6; } }

        /* The 1.9 MW banner, the second and last thing that animates on first
           paint. Brought into line with the hero copy: a shorter fall on a
           decelerate curve rather than a 36px arrival on a near-elastic one,
           which was landing almost a second after the hero had already settled
           and read as a separate, later event. */
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translate3d(0, 16px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .hero-fade-up {
          animation: heroFadeUp 900ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .particle-a, .particle-b, .particle-c,
          .flow-line, .pulse-dot, .card-hover,
          .hero-fade-up,
          .slide-up, .slide-in-left, .slide-in-right, .pop-scale, .soft-cascade,
          .stat-float { animation: none !important; transition: none !important; }
          .hero-fade-up,
          .slide-up, .slide-in-left, .slide-in-right, .pop-scale, .soft-cascade
            { opacity: 1 !important; transform: none !important; filter: none !important; }
        }

        /* ── Component brand marks ───────────────────────────────────────────
           A monogram in a tinted, bevelled square. Two details keep it from
           reading as a coloured box with a letter in it: the 145deg gradient
           gives the tile a light source, and the inset top highlight plus the
           tinted ring give it an edge — the same treatment the product cards
           use, at 28px. flex-shrink is set because these sit beside text that
           wraps at the narrow end of the two-column card. */
        .brand-mark {
          flex-shrink: 0;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 0.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-size: 0.8125rem;
          font-weight: 700;
          line-height: 1;
          color: var(--brand-tint, var(--color-secondary));
          background: linear-gradient(145deg,
            color-mix(in srgb, var(--brand-tint) 16%, #FFFFFF) 0%,
            color-mix(in srgb, var(--brand-tint) 7%, #FFFFFF) 100%);
          border: 1px solid color-mix(in srgb, var(--brand-tint) 26%, transparent);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.85),
            0 1px 2px rgba(10,37,64,0.06);
        }
        /* color-mix is Baseline 2023 and every browser this site targets has it,
           but the fallback matters: without it an older engine renders the tile
           with no background at all and the monogram floats on white. A flat
           tint underneath means the worst case is a solid chip. */
        @supports not (background: color-mix(in srgb, red 10%, white)) {
          .brand-mark {
            background: rgba(10,37,64,0.06);
            border-color: rgba(10,37,64,0.14);
          }
        }
        .brand-chip {
          background: rgba(10,37,64,0.05);
          color: var(--color-secondary);
          border: 1px solid rgba(10,37,64,0.09);
        }

        /* ── About Us entry ──────────────────────────────────────────────────
           .about-reveal used to live here: a rise, a scale up from 0.97, and a
           6px gaussian resolving to sharp, on both columns of the teaser.

           It is gone, and the blur is why. A large photograph resolving out of a
           6px blur is unpleasant to look at — it makes the eye try to focus
           something that cannot be focused yet — and it is the one property in
           that stack that cannot ride the compositor, so it forced a full raster
           repaint of an image-sized element on every frame. The business
           described it as harsh on the eyes, which is the same finding arrived
           at from the other side.

           Both columns now use the shared directional reveals in index.css:
           the photograph is in the left column so it enters from the left, the
           copy is in the right column so it enters from the right, and they
           converge on the centre of the section. That is the site-wide rule
           now, not a decision local to this section. Stagger comes from
           --reveal-delay rather than a bespoke --about-delay. */

        /* ── Happy-clients stat, continuous float ────────────────────────────
           Slow enough to be ambient rather than animated: 7s for the rise and
           fall, 9s for the halo behind it. The two periods are deliberately
           coprime-ish so they drift against each other and the pair never
           settles into an obvious repeating beat.

           The card overhangs the photograph's corner, so it is the one element
           in the section that reads as physically detached — which is exactly
           what makes a float legible here rather than gratuitous.

           The animation is on a wrapper, not on the card: a keyframe holding a
           transform on the card itself would fight nothing today but would
           silently break the moment anyone adds a hover-lift to it. */
        .stat-float {
          animation: statFloat 7s ease-in-out infinite;
        }
        @keyframes statFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-9px); }
        }
        /* Gold halo breathing behind the card — the "pulsing" half of the pair.
           Sits behind via a negative-inset pseudo-element so it never affects
           the card's own hit area or layout. */
        .stat-float::before {
          content: '';
          position: absolute;
          inset: -18px;
          border-radius: 1.5rem;
          background: radial-gradient(ellipse at center,
            rgba(245,166,35,0.30) 0%,
            rgba(245,166,35,0.10) 45%,
            transparent 72%);
          animation: statPulse 9s ease-in-out infinite;
          pointer-events: none;
          z-index: -1;
        }
        @keyframes statPulse {
          0%, 100% { opacity: 0.45; transform: scale(0.94); }
          50%      { opacity: 1;    transform: scale(1.06); }
        }

        /* D5 — Scroll entrance animations */
        .slide-up {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .slide-up.animate-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .slide-in-left {
          opacity: 0;
          transform: translateX(-40px);
          transition: opacity 0.7s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .slide-in-left.animate-visible {
          opacity: 1;
          transform: translateX(0);
        }

        .slide-in-right {
          opacity: 0;
          transform: translateX(40px);
          transition: opacity 0.7s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .slide-in-right.animate-visible {
          opacity: 1;
          transform: translateX(0);
        }

        .pop-scale {
          opacity: 0;
          transform: scale(0.95);
          transition: opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .pop-scale.animate-visible {
          opacity: 1;
          transform: scale(1);
        }

        .soft-cascade {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .soft-cascade.animate-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* D1 — 1.9MW banner gradient */
        .banner-gradient {
          background: linear-gradient(135deg, #050F1F 0%, #0A2540 60%, #0E2E50 100%);
        }

        .focus-ring:focus-visible {
          outline: 2.5px solid var(--color-primary);
          outline-offset: 2px;
        }

        /* .dashed-card lived here and styled exactly one element — the Off-Grid
           "Coming Soon" panel, removed in Phase 2. Deleted with it rather than
           left behind: a dashed-border treatment with no owner is an invitation
           to reuse it for something that is not a placeholder. */

        /* ── Quotation CTA — frosted glass with conic sunray accent ── */
        .section-frosted {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(22px) saturate(160%);
          -webkit-backdrop-filter: blur(22px) saturate(160%);
          border-top: 1px solid rgba(255,255,255,0.85);
          border-bottom: 1px solid rgba(226,229,234,0.55);
          position: relative;
          overflow: hidden;
        }
        .section-frosted::before {
          content: '';
          position: absolute;
          top: -120px; right: -80px;
          width: 440px; height: 440px;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,   rgba(245,166,35,0.025) 8deg,
            transparent 16deg,  rgba(245,166,35,0.025) 24deg,
            transparent 32deg,  rgba(245,166,35,0.020) 40deg,
            transparent 48deg,  rgba(245,166,35,0.025) 56deg,
            transparent 64deg
          );
          pointer-events: none;
          border-radius: 50%;
        }
      `}</style>

      {/* ============ HERO CAROUSEL ============ */}
      <section
        id="home"
        className="hero-carousel relative overflow-hidden flex items-center"
        aria-roledescription="carousel"
        aria-label="Gurukrupa Powertech Solutions highlights"
      >
        {/* Photo layers. Exactly two carry animation classes at any time: the
            incoming slide and the one it is dissolving over. Direction no
            longer matters — a crossfade has no side to come in from. */}
        {HERO_SLIDES.map((slide, i) => {
          let stateClass = "";
          if (i === activeSlide) {
            stateClass = "is-active";
          } else if (i === prevSlide) {
            stateClass = "is-leaving";
          }
          return (
            <div
              key={slide.id}
              className={`hero-slide-layer ${stateClass}`}
              aria-hidden="true"
            >
              <img
                src={slide.image}
                alt=""
                className="hero-slide-img"
                /* Per-slide focal point, defaulting to centre. Only the hybrid
                   frame sets it — see the note on that slide. */
                style={slide.focus ? { objectPosition: slide.focus } : undefined}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                onError={(e) => {
                  if (e.currentTarget.src.endsWith(HERO_FALLBACK_IMAGE)) return;
                  e.currentTarget.src = HERO_FALLBACK_IMAGE;
                }}
              />
            </div>
          );
        })}
        <div className="hero-scrim" />
        <div className="hero-glow" />
        <div className="hero-dot-pattern" />
        <div className="hero-bottom-fade" />
        {/* Animated floating particles. `hero-particles` carries the z-index
            that lifts this above the photo layers — see the overlay stacking
            note in the style block. */}
        <div className="hero-particles absolute inset-0 overflow-hidden pointer-events-none">
          <div className="particle-a absolute rounded-full bg-primary-token" style={{ top: '13%', left: '7%', width: 14, height: 14, filter: 'blur(1px)' }} />
          <div className="particle-b absolute rounded-full bg-primary-token" style={{ top: '70%', left: '5%', width: 8, height: 8 }} />
          <div className="particle-a absolute rounded-full" style={{ top: '27%', left: '90%', width: 20, height: 20, background: 'rgba(245,166,35,0.18)', filter: 'blur(2px)', animationDelay: '2s' }} />
          <div className="particle-c absolute rounded-full bg-primary-token" style={{ top: '83%', left: '86%', width: 10, height: 10, animationDelay: '1s' }} />
          <div className="particle-b absolute rounded-full" style={{ top: '47%', left: '51%', width: 6, height: 6, background: 'rgba(245,166,35,0.22)', animationDelay: '3s' }} />
          <div className="particle-c absolute rounded-full" style={{ top: '58%', left: '74%', width: 5, height: 5, background: 'rgba(245,166,35,0.15)', animationDelay: '0.8s' }} />
        </div>
        {/* Padding is symmetric again. The old pb-36/md:pb-40 existed purely to
            keep the copy clear of the controls when they lived in the bottom
            corners; with them centred on the side edges the extra bottom weight
            was just pushing the copy off-centre in a section that is already
            `flex items-center`. */}
        <div className="container-site pt-28 pb-28 md:pt-32 md:pb-32 relative z-10">
          {/* Keyed on activeSlide so the whole block remounts and replays its
              entrance each time the carousel advances. */}
          <div key={activeSlide} className="hero-copy-col max-w-3xl">
            {/* Names the frame, and nothing else. The capsule that used to
                enclose this — and the 01 / 04 counter before it — are both gone
                at the business's request; see the .hero-eyebrow note in the
                style block for what carries the label now.

                Position is still available to anyone who needs it — the live
                region further down announces "Slide N of M: <name>" on every
                advance, which is where a screen reader was getting it from all
                along. The rule below is decoration and is hidden from it. */}
            <span
              className="hero-copy-item hero-eyebrow mb-6"
              style={{ animationDelay: "60ms" }}
            >
              <span className="hero-eyebrow-label text-[11px] md:text-xs font-semibold uppercase tracking-[0.24em]">
                {HERO_SLIDES[activeSlide].eyebrow}
              </span>
              <span className="hero-eyebrow-rule" aria-hidden="true" />
            </span>
            <h1
              className="hero-copy-item hero-title text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.12] mb-6"
              style={{ animationDelay: "200ms" }}
            >
              {HERO_SLIDES[activeSlide].title}
            </h1>
            <p
              className="hero-copy-item hero-body text-base md:text-lg text-white/90 leading-relaxed mb-9 max-w-2xl"
              style={{ animationDelay: "340ms" }}
            >
              {HERO_SLIDES[activeSlide].body}
            </p>
            <div
              className="hero-copy-item flex flex-col sm:flex-row gap-4"
              style={{ animationDelay: "480ms" }}
            >
              <HeroCta
                cta={HERO_SLIDES[activeSlide].primary}
                showArrow
                className="btn-primary-token focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold"
              />
              {/* The About slide deliberately carries a single CTA. */}
              {HERO_SLIDES[activeSlide].secondary && (
                <HeroCta
                  cta={HERO_SLIDES[activeSlide].secondary}
                  className="btn-outline-light focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold"
                />
              )}
            </div>
          </div>

        </div>

        {/* Manual controls, pinned to the vertical centre of the slide against
            the left and right edges. `inset-0` + `items-center` centres them on
            the section box rather than on the copy column, so they stay level
            with the middle of the photograph regardless of how tall the copy on
            the current slide happens to run.

            The wrapper spans the whole hero, so it must stay transparent to the
            pointer or it would swallow every click meant for the CTAs behind it
            — only the two buttons take events.

            Gutter is a plain px-* rather than .container-site: the controls
            belong to the edge of the frame, not to the text column, and at
            ≥1536px the container's 4–5rem gutter would park them well inside the
            photograph. */}
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-between px-1 sm:px-4 lg:px-8">
          <button
            type="button"
            onClick={previousSlide}
            aria-controls="home"
            aria-label={`Previous slide (${HERO_SLIDES[(activeSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length].navLabel})`}
            className="hero-nav-btn hero-nav-btn-prev focus-ring pointer-events-auto"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Position is announced rather than drawn — the deck is decorative
              and a visible counter would undo the minimal treatment. `sr-only`
              is position:absolute, so this third child costs the flex row
              nothing and the two buttons still sit hard against the edges. */}
          <p className="sr-only" role="status" aria-live="polite">
            Slide {activeSlide + 1} of {HERO_SLIDES.length}:{" "}
            {HERO_SLIDES[activeSlide].navLabel}
          </p>

          <button
            type="button"
            onClick={nextSlide}
            aria-controls="home"
            aria-label={`Next slide (${HERO_SLIDES[(activeSlide + 1) % HERO_SLIDES.length].navLabel})`}
            className="hero-nav-btn hero-nav-btn-next focus-ring pointer-events-auto"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Slide indicators.

            The brief was that the deck "feels like an endless loop" — which is a
            complaint about not knowing where you are in it, not about the
            rotation itself. Plain dots would answer half of that: they say which
            of four you are on, but not that the fifth event is the deck starting
            over rather than continuing forever.

            So the active dot is a pill carrying a gold progress fill timed to
            HERO_INTERVAL_MS. It reports position AND how long is left, which is
            what turns "this never stops" into "this is a four-item loop and I
            can see the cycle". Restarting is free: the element that holds
            .is-active changes on every advance, so the CSS animation begins from
            zero each time rather than needing to be reset in JS.

            Under reduced motion the autoplay effect above never starts, so the
            fill is pinned full rather than animating — a progress bar counting
            down to an advance that will not happen would simply be lying. */}
        <div className="absolute bottom-6 md:bottom-9 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <div
            className="hero-dots pointer-events-auto"
            role="tablist"
            aria-label="Choose a slide"
          >
            {HERO_SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={i === activeSlide}
                aria-controls="home"
                aria-label={slide.navLabel}
                onClick={() => goToSlide(i)}
                className={`hero-dot focus-ring ${i === activeSlide ? 'is-active' : ''}`}
              >
                <span className="hero-dot-fill" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ D1: 1.9 MW ACHIEVEMENT BANNER ============ */}
      <div className="hero-fade-up banner-gradient relative overflow-hidden" style={{ animationDelay: '560ms' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.038) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 100% at 100% 50%, rgba(245,166,35,0.12) 0%, transparent 65%)' }} />
        <div className="container-site py-10 md:py-12 flex flex-col md:flex-row items-center gap-6 md:gap-12 relative z-10">
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.25), rgba(245,166,35,0.10))', border: '1px solid rgba(245,166,35,0.25)' }}>
              <Zap className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>1.9 MW</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Residential solar installed</p>
            </div>
          </div>
          <div className="hidden md:block w-px self-stretch bg-white/10" />
          <div className="flex-1">
            <p className="text-white font-semibold text-lg leading-snug mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Gurukrupa Powertech achieved 1.9&nbsp;MW of residential solar installations in the last 5 months.
            </p>
            <p className="text-white/55 text-sm leading-relaxed">
              A milestone for clean energy adoption across Gujarat — and we're just getting started.
            </p>
          </div>
          <Link
            to="/quote"
            className="btn-primary-token focus-ring inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold flex-shrink-0"
          >
            Join them <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ============ ABOUT US TEASER ============ */}
      {/* Placed directly under the hero unit — meaning after the 1.9 MW banner
          rather than between it and the hero. The banner is part of the hero
          visually (same dark gradient, and it shares the hero's entry animation
          on a delay), so slotting a light section in between would split a pair
          that reads as one thing. This is the first light surface on the page and
          the first content section a visitor meets.

          Copy is lifted from /about rather than newly written: the whole point of
          a teaser is that it promises what the page delivers, and Phase 1's
          audit note on that page is explicit that nothing new should be
          asserted anywhere. */}
      <section id="about-teaser" className="atmos-host w-full" style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFE 46%, #F3F6FC 100%)',
      }}>
        <Atmosphere preset="projects" />
        <div className="container-site py-16 md:py-20">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Photograph. Left on desktop so the eye lands on the image first
                coming off the dark banner, then reads right into the copy.

                From lg up the column stretches to the row height and the frame
                fills it, so the photograph ends level with the CTA row. A fixed
                portrait ratio here ran roughly 160px taller than the copy, which
                left the text floating in the middle of its own column. */}
            {/* Enters from the left, because it sits in the left column — the
                site-wide directional rule. See the reveal block in index.css. */}
            <div className="lg:col-span-5 relative lg:self-stretch reveal-left">
              <div className="photo-3d rounded-3xl bg-[#0A2540] aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[24rem]">
                <img
                  src={HOME_IMAGES.aboutTeaser.src}
                  alt={HOME_IMAGES.aboutTeaser.alt}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={hideOnImageError}
                />
              </div>

              {/* Happy-clients stat, overlapping the frame's bottom edge so the
                  number belongs to the photograph rather than sitting under it as
                  a caption.

                  It tucks inside the frame below sm instead of being hidden. The
                  first version dropped it on phones because a card hanging off
                  the corner of a full-width image has nowhere to go — but this is
                  the one stat the section was asked to carry, so hiding it on the
                  majority of traffic was the wrong trade. Inset on mobile,
                  overhanging from sm up. */}
              <div className="stat-float absolute bottom-4 right-4 sm:-bottom-6 sm:-right-3 lg:-right-6">
                <div className="glass-3d rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(30,158,99,0.12)' }}
                    >
                      <Star className="w-5 h-5" style={{ color: '#1E9E63' }} />
                    </span>
                    <div>
                      {/* ⚠ ASSUMPTION — CONFIRM WITH BUSINESS: same unverified
                          figure as the stats band below, reused rather than
                          re-invented so the two cannot drift apart. */}
                      <p
                        className="text-2xl md:text-3xl font-bold text-secondary-token leading-none"
                        style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                      >
                        1230+
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-token mt-1">
                        Happy clients
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy. Right column, so it comes in from the right and meets the
                photograph in the middle. */}
            <div className="lg:col-span-7 reveal-right" style={{ '--reveal-delay': '140ms' }}>
              <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">
                About Us
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-token mb-5 leading-tight">
                The electrical engineering came first.{' '}
                <span className="text-primary-token">The solar was built on top of it.</span>
              </h2>
              <div className="space-y-4 text-muted-token leading-relaxed prose-measure">
                <p>
                  Gurukrupa Powertech Solutions is a solar EPC based in Madhapar, Bhuj. The
                  business is {ENGINEERING_YEARS} years old and has spent {SOLAR_YEARS} of them on
                  solar — and that order is the whole point. It is why our answer to almost every
                  question starts with your actual load rather than with a product.
                </p>
                <p>
                  A panel is a commodity you can buy from anyone in Bhuj. The array, its
                  protection and its connection to a grid that browns out in May are not.
                </p>
              </div>

              {/* Two supporting facts. Deliberately not more: the stats band is
                  the next section and four cards of numbers immediately below a
                  row of numbers is the redundancy this is meant to avoid. */}
              <div className="grid sm:grid-cols-2 gap-4 mt-8">
                {[
                  {
                    icon: <BadgeCheck className="w-5 h-5" />,
                    title: 'Whole scope, one roof',
                    body: 'Design, supply, install and commission — including the earthing and protection quoted separately elsewhere.',
                  },
                  {
                    icon: <Users className="w-5 h-5" />,
                    title: 'One named contact',
                    body: 'Sagar Bhimani, directly, on sizing, subsidy and site visits — not a call centre.',
                  },
                ].map((item) => (
                  <div key={item.title} className="surface-3d-flat lift-3d rounded-xl p-5">
                    <span className="text-primary-token inline-flex mb-3">{item.icon}</span>
                    <p className="text-sm font-semibold text-secondary-token mb-1.5">{item.title}</p>
                    <p className="text-xs text-muted-token leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/about"
                  className="btn-primary-token focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold"
                >
                  Read More About Us <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/quote"
                  className="btn-outline-token focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold"
                >
                  Get Your Free Quotation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW WE WORK ============ */}
      {/* Phase 2 (round 3) — returned from /quote and placed directly under the
          About Us teaser, which is the sequence the header now advertises:
          Home → About Us → How We Work → Our Product Range.

          It reads correctly here. The teaser above establishes who the company
          is; this answers the question that immediately follows — how does
          working with them actually go — and it does so before the product
          cards ask the visitor to choose a system. The counter-argument for
          /quote was that the section describes what happens *after* an enquiry;
          the answer is that the visitor is weighing whether to enquire at all,
          and that is precisely when "then what happens?" is worth answering.

          `ctaTo` is supplied here, unlike on /quote: from the homepage the
          "start with a free estimate" button has somewhere to go.

          `--proc-ring` matches this band's top stop (#FFFFFF) so the halo behind
          each timeline marker dissolves into the surface rather than showing as
          a pale disc. */}
      <section
        id="how-we-work"
        className="atmos-host w-full"
        style={{
          background: 'linear-gradient(180deg, #F3F6FC 0%, #FFFFFF 40%, #FAFBFE 100%)',
          '--proc-ring': '#FFFFFF',
        }}
      >
        <Atmosphere preset="stats" />
        <div className="container-site py-16 md:py-20">
          <ProcessTimeline ctaTo="/quote" />
        </div>
      </section>

      {/* ============ D2: STATS / WHY CHOOSE US ============ */}
      <section
        className="atmos-host"
        style={{
          /* Was a flat rgba(10,37,64,0.03) wash. A two-stop gradient plus the
             ambient orbs gives the band a light source instead of a tint. */
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F7FD 58%, #EFF3FB 100%)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <Atmosphere preset="stats" />
        <div className="container-site py-16 md:py-20">
          <div className="max-w-2xl mx-auto text-center mb-12 flex flex-col items-center">
            <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3 slide-in-left">Why Choose Gurukrupa</p>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-token mb-4 slide-in-right">Numbers that speak for themselves</h2>
            <p className="text-muted-token leading-relaxed text-sm slide-up" style={{ transitionDelay: '0.2s' }}>
              Every installation is engineered, not estimated. Here's what that means in practice.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                // ⚠ ASSUMPTION — CONFIRM WITH BUSINESS: placeholder stat values.
                value: "1.9 MW", label: "Installed in last 5 months", icon: <Zap className="w-6 h-6" />,
                color: "rgba(245,166,35,0.15)", iconColor: "var(--color-primary)",
              },
              {
                // ⚠ ASSUMPTION — CONFIRM WITH BUSINESS: placeholder stat values.
                value: "1230+", label: "Happy customers", icon: <Star className="w-6 h-6" />,
                color: "rgba(30,158,99,0.12)", iconColor: "#1E9E63",
              },
              {
                value: EXPERIENCE_STAT_VALUE, label: EXPERIENCE_STAT_LABEL, icon: <Shield className="w-6 h-6" />,
                color: "rgba(10,37,64,0.08)", iconColor: "var(--color-secondary)",
              },
              {
                // ⚠ ASSUMPTION — CONFIRM WITH BUSINESS: placeholder stat values.
                value: "<48 hrs", label: "Site assessment turnaround", icon: <Clock className="w-6 h-6" />,
                color: "rgba(245,166,35,0.10)", iconColor: "var(--color-primary-text)",
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-token p-6 card-hover pop-scale text-center"
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: stat.color }}>
                  <span style={{ color: stat.iconColor }}>{stat.icon}</span>
                </div>
                {/* Each figure counts up from zero every time it scrolls into
                    view — the observer no longer unobserves after the first
                    run, so scrolling back up replays the count rather than
                    finding the numbers already sitting at their targets.
                    <CountUp> animates only the numeric run and leaves the rest
                    of the string alone, which is what keeps "<48 hrs" and
                    "1230+" saying what they say — the symbols are the claim,
                    not decoration. */}
                <p className="text-2xl md:text-3xl font-bold text-secondary-token mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <CountUp value={stat.value} />
                </p>
                <p className="text-xs text-muted-token leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Phase 2 (round 2) — "Why Solar", "Why Gurukrupa" and "About Us" used to
          sit here, three long narrative sections between the proof and the
          offer. They are pages now: /why-solar and /about (which merges the
          latter two). The homepage goes stats → process → products, which is
          the sequence a visitor who already wants a quotation actually needs;
          the narrative is one click away for the visitor who does not. */}

      {/* Phase 3 — the "How We Work" process timeline used to sit here, between
          the stats band and the product range. It has moved to /quote as
          <ProcessTimeline />, and the homepage now runs stats → products.

          Why it left: the section describes what happens *after* an enquiry, so
          on the homepage it was answering a question nobody had asked yet — the
          visitor had not enquired. It sat between the proof (stats) and the offer
          (products), interrupting that pair with delivery detail. On /quote it
          lands where the enquiry is actually made and where "then what happens?"
          is the live question. The full reasoning is on the render site. */}

      {/* ============ PRODUCT RANGE ============ */}
      {/* Phase 3 — this carried no background at all: three white cards on body
          white, over the tallest section of the page. `container-site` moved off
          the <section> and onto an inner wrapper so the section can own a
          surface and clip its decoration. */}
      <section id="products" className="atmos-host" style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F6F8FD 40%, #EDF1FA 100%)',
      }}>
        <Atmosphere preset="products" />
        <div className="container-site py-16 md:py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">Our Product Range</p>
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-token mb-4">
            Three system types. One right fit for you.
          </h2>
          <p className="text-muted-token leading-relaxed">
            Every installation starts with matching your site and usage pattern to the correct
            architecture — grid-tied, battery-backed, or fully independent.
          </p>
        </div>

        {/* Row 1 — Flagship cards: On-Grid + Hybrid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">

          {/* ON GRID */}
          <div className="group card-hover card-elevated bg-white rounded-2xl border border-token overflow-hidden flex flex-col slide-up" style={{ borderTop: '3px solid var(--color-primary)' }}>
            {/* Image — cinematic top banner */}
            <div className="relative w-full h-64 md:h-72 overflow-hidden flex-shrink-0">
              <img
                src="/products/ongrid-solar.png"
                alt="On-Grid solar rooftop installation"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
              <div
                className="absolute top-3 right-3 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full z-10 motion-reduce:transition-none"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 4px 12px var(--glow-gold-strong)' }}
              >
                MOST POPULAR
              </div>
            </div>
            {/* Content — 2-column split below image */}
            <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: The 'Why' — description & features */}
              <div className="flex flex-col">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.20) 0%, rgba(245,166,35,0.07) 100%)" }}>
                  <Zap className="w-6 h-6 text-secondary-token" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-token mb-2">On Grid</h3>
                <p className="text-sm text-muted-token mb-5 leading-relaxed">
                  Connected directly to the utility grid, sized against your monthly billing units.
                </p>
                <ul className="text-sm text-muted-token space-y-2">
                  <li><span className="font-semibold text-secondary-token">🔋 Zero Battery Maintenance</span> — Pure solar generation. Nothing to monitor, service, or replace.</li>
                  <li><span className="font-semibold text-secondary-token">💰 100% Subsidy Eligible</span> — Get the full government subsidy on your system.</li>
                  <li><span className="font-semibold text-secondary-token">⚡ Grid-Synced Safety</span> — Automatically pauses during outages (anti-islanding protection) to keep utility crews safe.</li>
                  <li><span className="font-semibold text-secondary-token">🔌 Grid-Connected</span> — Works alongside your existing power connection, not instead of it.</li>
                  <li><span className="font-semibold text-secondary-token">📉 Built For: Maximum Bill Savings</span> — Shrinks your electricity bill through net metering.</li>
                </ul>
              </div>
              {/* Right: The 'What' — specs & CTA */}
              <div className="flex flex-col">
                {/* A1 — Warranty badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2.5 py-1" style={{ background: 'rgba(30,158,99,0.10)', color: '#1E9E63' }}>
                    <Shield className="w-3 h-3" /> 27yr Panel Warranty
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2.5 py-1" style={{ background: 'rgba(10,37,64,0.07)', color: 'var(--color-secondary)' }}>
                    <Shield className="w-3 h-3" /> 10yr Inverter Warranty
                  </span>
                </div>
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-token mb-2.5">Solar Panels</p>
                  <ul className="space-y-2.5">
                    {PANEL_BRANDS.map(({ brand, variants }) => (
                      <li key={brand} className="flex items-start gap-2.5">
                        <BrandMark name={brand} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-secondary-token leading-tight">{brand}</p>
                          <ul className="mt-1 space-y-0.5">
                            {variants.map(([tech, watts]) => (
                              <li key={tech} className="flex justify-between gap-3 text-xs text-muted-token">
                                <span>{tech}</span>
                                <span className="font-medium text-secondary-token">{watts}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-token mb-2.5">Inverter Brands</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'UTL Solar', mark: 'UTL' },
                      { label: 'Solaryaan', mark: 'Solaryaan' },
                      { label: 'Polycab', mark: 'Polycab' },
                    ].map((b) => (
                      <span key={b.label} className="brand-chip inline-flex items-center gap-1.5 text-xs font-medium rounded-full pl-1 pr-3 py-1">
                        <BrandMark name={b.mark} />
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
                <Link to="/quote?type=ON_GRID" className="mt-auto text-sm font-semibold text-secondary-token inline-flex items-center gap-1.5 focus-ring rounded-md hover:gap-2.5 transition-all">
                  Get an On-Grid estimate <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* HYBRID */}
          <div className="group card-hover card-elevated bg-white rounded-2xl border border-token overflow-hidden flex flex-col slide-up" style={{ borderTop: '3px solid var(--color-primary)', transitionDelay: '0.1s' }}>
            {/* Image — cinematic top banner */}
            <div className="relative w-full h-64 md:h-72 overflow-hidden flex-shrink-0">
              <img
                src="/products/hybrid-solar.png"
                alt="Hybrid solar system with battery storage"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
              <div
                className="absolute top-3 right-3 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full z-10 motion-reduce:transition-none"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 4px 12px var(--glow-gold-strong)' }}
              >
                RECOMMENDED
              </div>
            </div>
            {/* Content — 2-column split below image */}
            <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: The 'Why' — description & features */}
              <div className="flex flex-col">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.20) 0%, rgba(245,166,35,0.07) 100%)" }}>
                  <BatteryCharging className="w-6 h-6 text-secondary-token" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-token mb-2">Hybrid</h3>
                <p className="text-sm text-muted-token mb-5 leading-relaxed">
                  Solar generation with battery backup, for daytime and night-time reliability.
                </p>
                <ul className="text-sm text-muted-token space-y-2 mb-2">
                  <li><span className="font-semibold text-secondary-token">🔋 Battery-Backed Reliability</span> — Solar generation and battery storage, working together.</li>
                  <li><span className="font-semibold text-secondary-token">💰 Subsidy Eligible*</span> — Applies to panels & inverter.</li>
                  <li><span className="font-semibold text-secondary-token">⚡ Seamless Power-Cut Protection</span> — Switches to battery automatically. The lights never flicker.</li>
                  <li><span className="font-semibold text-secondary-token">🔌 Best of Both Worlds</span> — Grid-connected for savings, battery-backed for independence.</li>
                  <li><span className="font-semibold text-secondary-token">🛡️ Built For: Uninterrupted Power + Bill Reduction</span> — Save on bills and stay powered through every outage.</li>
                </ul>
                <p className="text-xs text-muted-token mt-2">*Battery typically excluded from subsidy calculation.</p>
              </div>
              {/* Right: The 'What' — specs & CTA */}
              <div className="flex flex-col">
                {/* A1 — Warranty badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2.5 py-1" style={{ background: 'rgba(30,158,99,0.10)', color: '#1E9E63' }}>
                    <Shield className="w-3 h-3" /> 27yr Panel Warranty
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2.5 py-1" style={{ background: 'rgba(10,37,64,0.07)', color: 'var(--color-secondary)' }}>
                    <Shield className="w-3 h-3" /> 5yr Inverter Warranty
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2.5 py-1" style={{ background: 'rgba(245,166,35,0.10)', color: 'var(--color-primary-text)' }}>
                    <Shield className="w-3 h-3" /> 5yr Battery Warranty
                  </span>
                </div>
                <div className="mb-4 pb-4 border-b border-token">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-token mb-2">IP 67 Series</p>
                  <ul className="text-sm text-secondary-token space-y-1.5">
                    <li>3KW – 10KW range</li>
                    <li>Requires a battery bank</li>
                    <li>Lead-acid or Lithium, 48VDC in 5KWH multiples</li>
                    <li>1 phase – 3 phase operation</li>
                  </ul>
                </div>
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-token mb-2">IP 21 Series</p>
                  <ul className="text-sm text-secondary-token space-y-1.5">
                    <li>3.5KW – 6.5KW range</li>
                    <li>Can operate without a battery</li>
                    <li>3.5KW → 24VDC, 1 phase</li>
                    <li>6.5KW → 48VDC, 3 phase</li>
                  </ul>
                </div>
                <Link to="/quote?type=HYBRID" className="mt-auto text-sm font-semibold text-secondary-token inline-flex items-center gap-1.5 focus-ring rounded-md hover:gap-2.5 transition-all">
                  Get a Hybrid estimate <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>{/* end product cards */}

        {/* Phase 2 — the Off-Grid card used to sit here as a third row: a
            centred, dashed-border "Coming Soon" panel with no specifications in
            it, no price, and a CTA that went to the contact form.

            Removed outright rather than hidden. It was the only card on the page
            asking the visitor to do work (write in and ask) in return for a
            product we cannot yet quote, and it closed the section on an absence
            — the last thing read before the quotation CTA was a list of what is
            not available. On-Grid and Hybrid are the two systems that can
            actually be specified and sold, and the section is stronger ending on
            the pair than on the pair plus a placeholder.

            /quote still offers Off-Grid in its system-type selector, so nothing
            is unreachable for a visitor who genuinely wants one. */}
        </div>{/* end container-site */}
      </section>

      {/* ============ QUOTATION CTA / PREVIEW ============ */}
      <section id="quotation" className="section-frosted">
        <div className="container-site py-16 md:py-20">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* The pitch arrives first from the left, then the three steps rise
                in sequence beside it — so the row reads in the order it is meant
                to be read rather than appearing all at once. */}
            <div className="lg:col-span-2 reveal-left">
              <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">Get Quotation</p>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-token mb-4">
                How your estimate works
              </h2>
              <p className="text-muted-token leading-relaxed mb-8">
                No technical knowledge required. Tell us what runs in your home or business, and
                we handle the engineering math in the background.
              </p>
              <Link
                to="/quote"
                className="btn-primary-token focus-ring inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold"
              >
                Start Your Quotation <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-muted-token mt-3">
                Opens the full quotation form — takes about a minute.
              </p>
            </div>

            <div className="lg:col-span-3 grid sm:grid-cols-3 gap-5">
              {[
                {
                  icon: <ListChecks className="w-5 h-5 text-secondary-token" />,
                  step: "01",
                  title: "List your applications",
                  desc: "Add appliances like TVs, fans, fridges, or lights — however many you like.",
                },
                {
                  icon: <Calculator className="w-5 h-5 text-secondary-token" />,
                  step: "02",
                  title: "We calculate your load",
                  desc: "Your backup needs and, for On-Grid, your billing pattern determine sizing.",
                },
                {
                  icon: <CheckCircle2 className="w-5 h-5 text-secondary-token" />,
                  step: "03",
                  title: "Get your estimate",
                  desc: "A clear, final cost estimate — ready to discuss with our team.",
                },
              ].map((s, i) => (
                <div
                  key={s.step}
                  className="bg-white rounded-2xl border border-token p-6 card-hover reveal-up"
                  style={{ '--reveal-delay': `${140 + i * 110}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,166,35,0.12)" }}>
                      {s.icon}
                    </div>
                    <span className="text-xs font-semibold text-muted-token">{s.step}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-secondary-token mb-1.5">{s.title}</h3>
                  <p className="text-xs text-muted-token leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ EMI / ROI CALCULATOR TEASER ============ */}
      {/* ── The finance beat, in honey ──────────────────────────────────────
          This band and the subsidy band below it are the page's money section —
          what it costs, what it saves, what the government pays for. They now
          share one warm surface so they read as a single chapter between the
          cool frosted quotation band above and the cool FAQ band below, instead
          of as two more entries in an unbroken run of blue-greys.

          Yellow over green, and not as a coin toss. Honey is brand gold
          #F5A623 diluted to a surface tint, so the band is the same family as
          the eyebrow chips, the primary button and the gold rings already on
          these cards. Green would have been a defensible "savings" cue, but the
          only green in this system is the single success token on the size
          badge — put a mint band behind it and that token stops meaning
          anything, which is a real cost paid for a decorative gain.

          How deep the honey is allowed to go is set by one measurement, not by
          taste. The eyebrow token #9C6509 is the palest thing the site prints as
          small text, and it measures 4.91:1 on white — only 0.41 of headroom
          over the 4.5:1 AA floor. Tinting the surface underneath spends that
          headroom directly:

            #FCF1D9 → 4.38:1   fails
            #FDF4E0 → 4.49:1   fails, by a hair
            #FDF6E6 → 4.56:1   passes

          So #FDF6E6 is the floor for any warm stop with body text on it, and the
          three bands in this chapter are all built up from it. A richer honey
          was drafted first and measured second, which is the wrong order: it put
          the Subsidy eyebrow at 4.38:1 and the Projects eyebrow at 4.26:1. The
          paler ramp is not a compromise on the look — against the cool frosted
          band above and the cool FAQ band below, this reads unmistakably warm.

          Everything else is unchanged and stays inside AA, because honey is
          still a light surface: navy body copy is >11:1 here. What does change
          is the white cards — on cool grey they were near-invisible against
          their own band, and on honey they read as lit panels sitting on it. */}
      <section
        id="emi-calculator"
        className="w-full"
        style={{ background: 'linear-gradient(180deg, #FFFDF7 0%, #FEFAF0 55%, #FDF6E6 100%)' }}
      >
        <div className="container-site py-16 md:py-20">
          {/* Phase 2 — was a navy card on a light band, which made the whole
              finance beat read as the darkest thing on the page. It is now built
              from the shared light surface system (surface-3d + depth-ring +
              bevel) rather than a bespoke gradient, so it matches the product and
              stats cards instead of being a one-off.

              Contrast had to be re-derived, not just recoloured. Brand gold
              #F5A623 measures 2.03:1 on white and fails even the 3:1 large-text
              threshold, so nothing readable is left in it: small labels use the
              existing --color-primary-text (#9C6509, 4.91:1) and the 95% numeral
              gets a deep gold gradient whose lightest stop, #C8830D, is 3.13:1 —
              inside AA for 36px bold. The gold is kept for icons and borders,
              where contrast rules do not apply. */}
          <div
            className="surface-3d depth-ring rounded-2xl overflow-hidden relative"
            style={{ boxShadow: 'var(--elev-3), var(--ring-gold), var(--bevel-light)' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse 46% 62% at 88% 8%, rgba(245,166,35,0.10) 0%, transparent 62%)',
            }} />
            {/* Entry runs inside the card rather than on it: the copy comes in
                from the left, the savings panel and its CTA follow on a delay.
                A reveal on the card itself would fade the whole panel — shadow,
                ring and all — which reads as the section loading rather than as
                its contents arriving.

                Both parts use left/up rather than a mirrored left/right pair.
                This band is one of the few with no `overflow: hidden` on it, and
                a right-hand reveal starting 56px out would push past the card's
                own padding at phone widths and widen the document. */}
            <div className="relative grid lg:grid-cols-5 gap-9 lg:gap-12 items-center px-7 py-10 md:px-12 md:py-14">
              <div className="lg:col-span-3 reveal-left">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-5 text-[11px] font-semibold tracking-wide uppercase text-eyebrow-token"
                  style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.34)' }}>
                  <Calculator className="w-3.5 h-3.5" />
                  Finance Planner
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-secondary-token mb-4 leading-tight">
                  Can your electricity bill pay for your solar system?
                </h2>
                <p className="text-muted-token leading-relaxed mb-6 max-w-xl">
                  For most households the answer is close to yes. Our EMI &amp; ROI calculator shows
                  what you save each year, what the monthly instalment looks like if you finance the
                  system, and how the two compare — before you commit to anything.
                </p>
                <ul className="space-y-2.5 mb-2">
                  {[
                    "Annual and lifetime savings on your actual bill",
                    "Monthly EMI on any tenure and interest rate",
                    "Simple payback period for a cash purchase",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted-token">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary-token" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-4 reveal-up" style={{ '--reveal-delay': '180ms' }}>
                {/* Warm sunken rather than --surface-sunken. The shared token is
                    a cool #f4f6fb ramp; against the honey band and the gold
                    numeral it sat inside, it read as a grey patch cut into a
                    warm card. Same recipe, warm stops. */}
                <div className="rounded-xl p-5" style={{
                  background: 'linear-gradient(163deg, #FFF8E9 0%, #FDF1D8 100%)',
                  border: '1px solid rgba(245,166,35,0.28)',
                  boxShadow: 'var(--bevel-light)',
                }}>
                  <p className="text-xs text-muted-token mb-1">Typical bill reduction</p>
                  {/* Midpoint darkened from #C8830D to #BE7C0C. The comment
                      above this card cites 3.13:1 for the old value, which is
                      its ratio on WHITE — but this numeral has never sat on
                      white. It sits on the sunken box, and there it measured
                      2.77:1 against the old cool fill: a large-text AA failure
                      that predates the repaint and was masked by measuring the
                      wrong pair. #BE7C0C is 3.09:1 on the warm fill and stays
                      visibly gold. */}
                  <p className="text-4xl font-bold mb-1" style={{
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    background: 'linear-gradient(135deg, #9C6509 0%, #BE7C0C 50%, #9C6509 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>95%</p>
                  <p className="text-xs text-muted-token leading-relaxed">
                    with a correctly sized rooftop system
                  </p>
                </div>
                <Link
                  to="/roi-calculator"
                  className="btn-primary-token focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-4 text-sm font-semibold"
                >
                  Open EMI &amp; ROI Calculator <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-[11px] text-muted-token text-center leading-relaxed">
                  Free, instant, and no details required
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ GOVERNMENT SCHEME ============ */}
      {/* Phase 3 — the subsidy copy and the SchemeCTA had no background at all
          and floated on bare body white. They sit on a banded surface now, with
          one ambient composition rather than none.

          Phase 2 (round 3) — the "Technical brochure" section used to close this
          band: a navy card offering specification sheets behind a permanently
          disabled "Coming Soon" button. Removed from the homepage. A download
          that cannot be downloaded is a dead end dressed up as an offer, and it
          was the last thing on the band before the FAQs — so the page's finance
          beat ended on something the visitor could not act on. It comes back
          when there is an actual PDF to serve; /quote keeps its Brochure tab in
          the meantime.

          The band now closes on SchemeCTA, so the bottom padding moves onto the
          subsidy section itself. */}
      {/* Continues the honey band above — it opens on the exact stop the EMI
          section closes on (#FDF6E6) so the two read as one surface, then lifts
          back toward white by the bottom because the FAQ band that follows opens
          on #FFFFFF. The warm chapter opens and closes cleanly.

          This band is the one that set the #FDF6E6 floor: its eyebrow, heading
          and body copy all sit directly on the surface rather than inside a
          card, so the darkest stop here is load-bearing for contrast in a way
          the EMI band's is not. */}
      <div className="atmos-host" style={{
        background: 'linear-gradient(180deg, #FDF6E6 0%, #FEFAF1 40%, #FFFEFA 100%)',
      }}>
      <Atmosphere preset="offer" />

      <section id="subsidy" className="container-site pt-16 pb-16 md:pt-20 md:pb-20">
        {/* Heading rises, then the scheme panel follows it. Both are centred
            blocks rather than side-placed, so `reveal-up` is the right primitive
            — a sideways entry on a centred column reads as a mistake. */}
        <div className="mb-8 text-center max-w-2xl mx-auto reveal-up">
          <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">Subsidy</p>
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-token mb-4">
            Your rooftop is partly funded by the government
          </h2>
          <p className="text-muted-token leading-relaxed">
            Residential rooftop solar in Gujarat qualifies for a central subsidy of up to ₹78,000.
            Check what your home is eligible for on the official portal.
          </p>
        </div>
        <div className="reveal-up" style={{ '--reveal-delay': '150ms' }}>
          <SchemeCTA />
        </div>
      </section>

      </div>{/* end subsidy band */}

      {/* ============ FAQ ============ */}
      {/* Phase 3 — the bottom of the page now runs FAQs → Projects → Contact →
          Footer. The FAQ teaser used to sit *after* Contact, which put a block
          of objection-handling behind the section that asks for the enquiry:
          anyone still hesitating had already scrolled past the point of action.
          Answering first, then showing the work, then asking, is the order the
          rest of the page is already built around. */}
      <section id="faq" className="atmos-host w-full" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F7FD 55%, #EEF2FA 100%)' }}>
        <Atmosphere preset="faq" />
        {/* Phase 2 — this was a centred 768px column inside a full-bleed
            container, so at 1440px roughly 480px of empty band sat either side of
            the accordion and at 1920px well over 900px. Two columns now: the
            accordion keeps the reading position on the left, and a stacked pair of
            photographs fills the right.

            The pair is chosen to answer the section rather than decorate it — an
            array for the generation questions and the transmission grid for the
            net-metering and PGVCL ones, which is most of what this list is
            actually about. Each carries a label chip saying so, because an
            unlabelled stock photo beside an FAQ is decoration and a labelled one
            is a signpost. */}
        <div className="container-site py-16 md:py-24">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-7">
              <div className="mb-8 max-w-2xl">
                <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">FAQs</p>
                <h2 className="text-3xl md:text-4xl font-bold text-secondary-token mb-4">
                  Questions we get asked in Gujarat
                </h2>
                <p className="text-muted-token leading-relaxed">
                  The five we are asked most often. The full knowledge base covers {FAQS.length} questions
                  across On-Grid and Hybrid systems, net metering, PGVCL and subsidy.
                </p>
              </div>
              {/* Phase 3 — teaser only. The full, searchable set lives at /faq. */}
              <FaqAccordion
                faqs={TOP_FAQS}
                idPrefix="home"
                defaultOpenIds={[TOP_FAQS[0].id]}
              />
              <div className="mt-9 flex flex-col sm:flex-row sm:items-center gap-4">
                <Link
                  to="/faq"
                  className="btn-primary-token focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold"
                >
                  View All {FAQS.length} FAQs <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/quote?tab=contact"
                  className="btn-outline-token focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold"
                >
                  Still have a question? Talk to our team <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Phase 2 (round 3) — this was a stacked pair of hardware
                photographs: an array for the generation questions, transmission
                pylons for the net-metering ones, each with its own label chip.

                One portrait now, and the subject changed rather than just the
                crop. Two photographs of equipment beside a list of questions are
                decoration — they illustrate the answers, which the answers
                already do. The section is about the moment before the answer:
                someone who does not yet understand any of this. Putting that
                person here makes the column argue for the accordion instead of
                sitting next to it, and it is the one image on the page a visitor
                can see themselves in.

                The frame keeps a fixed 4:5 ratio at every breakpoint. It used to
                stretch to the accordion's height (`lg:self-stretch` + `h-full`
                against a `lg:aspect-auto`), which meant every answer that opened
                or closed changed the box's height while the width stayed put —
                and `object-cover` re-cropped to fit, so the photograph visibly
                zoomed and shifted on each toggle. Pinning the ratio decouples
                the image from the accordion entirely: the crop is now a function
                of the column width alone, so it holds perfectly still. */}
            {/* Right column, so it enters from the right — the same directional
                rule as the About teaser photograph, mirrored.

                The "Everyone starts here" chip that used to hang in the bottom
                left of this frame is removed at the business's request, and the
                bottom scrim went with it: that gradient existed only to give the
                chip a plate to sit on, and the note beside it said as much. With
                nothing to back, it was darkening the lower quarter of a
                photograph for no reason. */}
            <div className="lg:col-span-5 lg:self-start reveal-right">
              <div className="photo-3d rounded-3xl bg-[#0A2540] relative aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]">
                <img
                  src={HOME_IMAGES.faq.src}
                  alt={HOME_IMAGES.faq.alt}
                  loading="lazy"
                  className="w-full h-full object-cover rounded-3xl"
                  style={{ objectPosition: '50% 24%' }}
                  onError={hideOnImageError}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROJECTS ============ */}
      {/* Warmed to match the finance chapter, and doing a second job on the way
          out: this is the last light band before the navy contact section, so it
          deepens as it falls rather than sitting flat. Ivory at the top, close
          enough in value to the FAQ band's #EEF2FA that the seam reads as a hue
          shift rather than a step, then down to a warm sand at the bottom edge
          where the navy takes over.

          Readability was the constraint and it holds: the section header sits
          directly on this band, so the same #FDF6E6 floor the finance chapter
          documents applies here too — the deepest stop is #FBF6EC at 4.56:1 for
          the eyebrow, with navy headings far above that. The carousel gains from
          the change as well: photographs of installations under a Gujarat sun
          sit far better on warm neutral than on the blue-grey this was.

          Hairlines go gold at low alpha instead of the old neutral grey, which
          is what the site uses everywhere else it wants an edge to belong to the
          brand rather than merely divide two boxes. */}
      <section
        id="projects"
        className="atmos-host"
        style={{
          background: 'linear-gradient(180deg, #FCFAF5 0%, #FEFAF1 44%, #FBF6EC 100%)',
          borderTop: '1px solid rgba(245,166,35,0.20)',
          borderBottom: '1px solid rgba(245,166,35,0.28)',
        }}
      >
        <Atmosphere preset="projects" />
        <div className="container-site py-16 md:py-20">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-eyebrow-token mb-3">Projects</p>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-token">Recent installations</h2>
            </div>
            <Link
              to="/projects"
              className="btn-primary-token focus-ring inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold"
            >
              View All Projects <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ProjectsCarousel images={HOMEPAGE_CAROUSEL_IMAGES} />
        </div>
      </section>

      {/* ============ CONTACT ============ */}
      {/* Two columns of equal weight, pulling in opposite directions: a stack of
          text on the left and a map on the right, each ending at a different
          height, with nothing above them to tie the pair together. The heading
          belonged to the left column, so the section had no centre at all — it
          began at the far left margin and the map was something parked beside
          it.

          Restructured as a centred masthead over an asymmetric pair. The
          heading, being centred and narrow, gives the section one axis and one
          place to start reading; the row beneath it is deliberately NOT 50/50,
          because two equal columns is the arrangement that was reading as
          unbalanced in the first place. 2:3 gives the map the dominant share,
          the details column becomes a glass panel so it holds its side as an
          object rather than as loose text, and `items-stretch` ends both at the
          same line — which is the thing that actually makes a split row look
          composed. */}
      <section id="contact" className="parallax-bg cta-section-bg w-full">
        <div className="container-site py-24 md:py-32">
          <div className="max-w-2xl mx-auto text-center mb-12 md:mb-14">
            <p className="text-xs font-semibold tracking-wide uppercase text-primary-token mb-3">Contact</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
              Let's design your system
            </h2>
            <p className="text-white/70 leading-relaxed">
              Reach out directly, or use the quotation tool for an instant estimate before we talk.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-2 glass-3d-dark rounded-3xl p-7 md:p-8 flex flex-col">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.20) 0%, rgba(245,166,35,0.07) 100%)" }}>
                    <Users className="w-5 h-5 text-primary-token" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Primary Contact</p>
                    <p className="text-sm font-semibold text-white">Sagar Bhimani</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.20) 0%, rgba(245,166,35,0.07) 100%)" }}>
                    <Mail className="w-5 h-5 text-primary-token" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Email</p>
                    <a href="mailto:sagarbhimani001@gmail.com" className="text-sm font-semibold text-white focus-ring rounded-md">
                      sagarbhimani001@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.20) 0%, rgba(245,166,35,0.07) 100%)" }}>
                    <MapPin className="w-5 h-5 text-primary-token" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Location</p>
                    <p className="text-sm font-semibold text-white leading-snug">
                      {ADDRESS_LINES.map((line) => (
                        <span key={line} className="block">{line}</span>
                      ))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.20) 0%, rgba(245,166,35,0.07) 100%)" }}>
                    <Clock className="w-5 h-5 text-primary-token" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Working Hours</p>
                    <p className="text-sm font-semibold text-white">9 AM – 7 PM, Mon–Sat</p>
                  </div>
                </div>
              </div>

              {/* mt-auto rather than a fixed margin: the panel is stretched to
                  the map's height, and the actions belong at the foot of it
                  whatever slack that leaves above them. */}
              <div className="mt-auto pt-9 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
                <Link
                  to="/quote?tab=contact"
                  className="btn-primary-token focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold"
                >
                  Contact Us <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/quote"
                  className="btn-outline-light focus-ring inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold"
                >
                  Get a Quotation
                </Link>
              </div>
            </div>

            {/* The map was 320px tall in half the row. It is the only thing on
                the page that answers "where are you", and at that size it was
                showing a couple of streets and no context — big enough to prove
                a map existed, too small to read one. Three fifths of a wider row
                and up to 544px tall, with a real frame on it. */}
            <div className="lg:col-span-3 flex flex-col">
              <div className="contact-map rounded-3xl overflow-hidden relative flex-1 min-h-[20rem] md:min-h-[26rem] lg:min-h-[34rem]">
                <iframe
                  src="https://www.google.com/maps?q=23.247090969260054,69.70118065865935&z=16&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Gurukrupa Powertech Solutions location map"
                  className="absolute inset-0"
                />
              </div>
              {/* Kept below the frame rather than floated on top of it: every
                  corner of an embedded Google map is already spoken for —
                  fullscreen, the wordmark, the terms link — and a chip laid over
                  any of them covers a control the visitor may want. */}
              <a
                href="https://www.google.com/maps?q=23.247090969260054,69.70118065865935"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-light focus-ring mt-3 self-start inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-xs font-semibold"
              >
                <MapPin className="w-3.5 h-3.5" />
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact is the last section on the page — the FAQ teaser that used to
          follow it now sits above Projects. See the note there. */}

      {/* ============ FOOTER ============ */}
      {/* Task D4 — Floating WhatsApp button */}
      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        id="whatsapp-float-btn-home"
        style={{
          position: "fixed",
          bottom: "1.75rem",
          right: "1.75rem",
          zIndex: 50,
          width: "3.5rem",
          height: "3.5rem",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
          boxShadow: "0 6px 22px rgba(37,211,102,0.45), 0 2px 8px rgba(0,0,0,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform .2s ease, box-shadow .2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.10) translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 10px 32px rgba(37,211,102,0.60), 0 2px 8px rgba(0,0,0,0.14)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "0 6px 22px rgba(37,211,102,0.45), 0 2px 8px rgba(0,0,0,0.14)";
        }}
      >
        <WhatsAppIcon className="w-6 h-6 text-white" />
      </a>

      {/* Floating Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed z-50 p-3.5 rounded-full bg-primary-token text-secondary-token shadow-[0_4px_14px_rgba(245,166,35,0.4)] focus-ring transition-all duration-500 hover:scale-110 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(245,166,35,0.55)] ${
          showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        style={{ bottom: "6.25rem", right: "1.75rem" }}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div >
  );
}
