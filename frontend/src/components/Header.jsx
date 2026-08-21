import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu, X, MapPin, Mail, Clock, Phone, ChevronRight, ChevronDown, FileText, BadgePercent,
} from 'lucide-react';
import Logo from './Logo';
import {
  ADDRESS_LINES,
  EMAIL,
  PHONE_DISPLAY,
  PHONE_HREF,
  WORKING_HOURS_SHORT,
} from '../data/businessInfo';

/* ── Navigation model ───────────────────────────────────────────────────────
   The rail opens on the homepage's own scroll sequence — Home → About (the
   Company group) → How We Work → Our Product Range — so a visitor who has
   scrolled halfway down the page can find their position by reading left to
   right, which is the premise the scroll-spy below depends on.

   The tail no longer follows the page order. FAQ → Projects → Contact is a
   deliberate rhetorical close: answer the doubt, show the proof, then offer the
   conversation. Contact sits last because it hands straight off to the action
   buttons beside it — the bar reads *into* the CTA pair rather than stopping
   short of it and making the reader change direction.

   `rail` is the breakpoint from which an item appears in the desktop bar. The
   bar carries two action buttons as well as the links, so the tail is
   progressively disclosed instead of overflowing between the logo and the menu
   trigger; tiers are monotonic down the list so what is dropped is always a
   suffix, never a hole in the middle. Nothing is lost — the side panel carries
   every destination at every width.

   `to` values that carry a hash are homepage sections; the plain paths are
   routes. Both go through <Link>, and same-page hashes are intercepted in
   handleHashNav so a second click on an already-active anchor still scrolls. */
const COMPANY_LINKS = [
  { id: 'why-solar', label: 'Why Solar', to: '/why-solar', blurb: 'The case for rooftop generation' },
  { id: 'about', label: 'About Us', to: '/about', blurb: '28 years of engineering legacy' },
  { id: 'why-gurukrupa', label: 'Why Gurukrupa', to: '/about#why-gurukrupa', blurb: 'Engineered, not estimated' },
  { id: 'blog', label: 'Blog', to: '/blog', blurb: 'Field notes, guides and updates' },
];

/* Rail only. The side panel used to iterate this same list, which is why it
   once carried `rail: false` entries; it now has its own model (PANEL_GROUPS)
   and every item here is a bar item. An entry without a `rail` would therefore
   render nowhere at all — hence no filter on the render side, so that mistake
   surfaces as a missing link rather than being quietly swallowed. */
const NAV_ITEMS = [
  { id: 'home', label: 'Home', to: '/#home', rail: 'lg' },
  { id: 'company', label: 'Company', children: COMPANY_LINKS, rail: 'lg' },
  { id: 'how-we-work', label: 'How We Work', to: '/#how-we-work', rail: 'lg' },
  { id: 'products', label: 'Our Product Range', to: '/#products', rail: 'lg' },
  { id: 'calculator', label: 'EMI/ROI Calculator', to: '/roi-calculator', rail: 'xl' },
  { id: 'faq', label: 'FAQ', to: '/faq', rail: 'xl' },
  { id: 'projects', label: 'Projects', to: '/projects', rail: '2xl' },
  { id: 'contact', label: 'Contact', to: '/quote?tab=contact', rail: '2xl' },
];

/* ── Company trigger labels ─────────────────────────────────────────────────
   The trigger renames itself for exactly one destination — About Us — and
   reads as the group name everywhere else. It is a wayfinding cue, not a
   breadcrumb: the reader needs to know they are inside the group they are
   looking at, and a label that churns through four different strings as the
   page scrolls stops being a stable target to aim the pointer at.

   Both strings are listed because the trigger reserves the width of the widest
   of them (see .nav-company-sizer). Add a third label here and the reservation
   follows automatically — that is the whole reason this is an array and not two
   loose consts. */
const COMPANY_LABEL_GROUP = 'Company';
const COMPANY_LABEL_ABOUT = 'About Us';
const COMPANY_TRIGGER_LABELS = [COMPANY_LABEL_GROUP, COMPANY_LABEL_ABOUT];

/* Which children count as "inside About Us" for the label. #why-gurukrupa is a
   section *of* the About Us page, so scrolling into it has not left About Us —
   the trigger holds. The dropdown highlight below is finer-grained and does
   still single that row out; the two are deliberately different resolutions. */
const ABOUT_COMPANY_IDS = ['about', 'why-gurukrupa'];

/* ── Side-panel model ───────────────────────────────────────────────────────
   Deliberately NOT a mirror of the rail. The bar is a horizontal orientation
   device whose order encodes the page's own sequence; the panel is a vertical
   index opened by someone who has stopped scrolling and is looking for
   something specific. Mirroring the rail forces that reader to re-derive the
   grouping from a flat run of ten rows every time.

   So the panel is grouped by intent, in the order the questions actually get
   asked on a phone: what can I buy → what will it cost me → who are you →
   where do I get help. Headings do the work the horizontal position did.

   Two consequences worth stating, both intended:
     · Home is inside "Explore" rather than floating above it. It is a
       destination like any other here, and giving it its own ungrouped row
       spent the most valuable strip of the panel on the least-used link.
     · Get Quotation is absent from the list. It is the pinned action at the
       foot of the panel, and a duplicate row would dilute the one place the
       eye is meant to land. */
const PANEL_GROUPS = [
  {
    id: 'explore',
    label: 'Explore',
    items: [
      { id: 'home', label: 'Home', to: '/#home' },
      { id: 'products', label: 'Our Product Range', to: '/#products' },
      { id: 'projects', label: 'Projects', to: '/projects' },
      { id: 'how-we-work', label: 'How We Work', to: '/#how-we-work' },
    ],
  },
  {
    id: 'costs',
    label: 'What It Costs',
    items: [
      { id: 'calculator', label: 'EMI/ROI Calculator', to: '/roi-calculator' },
      { id: 'subsidy', label: 'Subsidy', to: '/#subsidy' },
    ],
  },
  {
    id: 'company',
    label: 'Company',
    items: COMPANY_LINKS,
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      { id: 'faq', label: 'FAQ', to: '/faq' },
      { id: 'contact', label: 'Contact', to: '/quote?tab=contact' },
    ],
  },
];

/* Plain classes rather than Tailwind's `hidden 2xl:inline-flex`, and the media
   queries live in this component's own <style> block.

   Not a style preference — `2xl:inline-flex` silently never reached the bundle.
   These strings are only ever read through a lookup, so Tailwind has to find
   them by scanning this object as text, and its extractor drops the candidate
   whose name starts with a digit. `lg:` and `xl:` from the same object compiled
   fine; `2xl:` did not, which would have left FAQ and the calculator display:
   none at every width with nothing in the build to say so. */
const RAIL_CLASS = {
  lg: 'rail-lg',
  xl: 'rail-xl',
  '2xl': 'rail-2xl',
};

/* ── Scroll-spy map ─────────────────────────────────────────────────────────
   Route → the sections on it, in document order, each naming the nav item that
   should light up while it is under the probe line. The spy relies on the
   declaration order being document order.

   #about-teaser lights the Company group, since "About Us" now lives inside it
   — the trigger stands in for its contents. #quotation and #subsidy point at
   the two action buttons, which is what makes those read as part of the same
   rail rather than decoration bolted onto it.

   `companyId` is the second thing an entry can say: not just "light the
   Company trigger" but "and this is the child you are standing in". Two
   different consumers read it at two different resolutions — the trigger label
   (About Us or nothing, see COMPANY_TRIGGER_LABELS) and the dropdown's own
   row highlight (all four children). Keeping one source for both is what stops
   them drifting apart.

   The teaser entry is why the trigger reads "About Us ▾" as the reader passes
   it: the group name is only useful while they are outside the group.

   /about earns an entry of its own for the finer of the two readings. It is a
   single section rather than a full page map: above #why-gurukrupa the spy
   finds nothing and the route fallback supplies 'about', and once the section
   crosses the probe this upgrades it to 'why-gurukrupa' so the dropdown marks
   that row. The trigger does not move — both ids are About Us to it, because
   #why-gurukrupa is a section of the About Us page. /why-solar and /blog need
   no map: one destination each, handled by the route fallback.

   Phase 2 — #how-we-work joined this list when the process timeline moved from
   /quote onto the homepage, and #brochure left it when the brochure block was
   removed. A missing id is skipped rather than breaking the walk, but a stale
   entry is still worth deleting: it is the only record of what the bar expects
   the page to contain. */
const SPY_ROUTES = {
  '/': [
    { section: 'home', navId: 'home' },
    { section: 'about-teaser', navId: 'company', companyId: 'about' },
    { section: 'how-we-work', navId: 'how-we-work' },
    { section: 'products', navId: 'products' },
    { section: 'quotation', navId: 'quote' },
    { section: 'emi-calculator', navId: 'calculator' },
    { section: 'subsidy', navId: 'subsidy' },
    { section: 'faq', navId: 'faq' },
    { section: 'projects', navId: 'projects' },
    { section: 'contact', navId: 'contact' },
  ],
  '/about': [
    { section: 'why-gurukrupa', navId: 'company', companyId: 'why-gurukrupa' },
  ],
};

/* The probe line, in viewport pixels from the top. The bar is h-24 (96px) at
   `zoom: 0.93`, so it occupies ~89 real pixels; 116 puts the line a comfortable
   margin below its bottom edge. A section counts as "current" once its top
   crosses this line, which matches what a reader perceives as having arrived. */
const SPY_PROBE_PX = 116;

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  /* The whole matched spy entry, not just its navId — the Company trigger needs
     the entry's `companyId` too, and holding one object keeps the two in sync
     by construction. Entries are module constants, so re-matching the same
     section sets an identical reference and React bails out of the render. */
  const [activeSpy, setActiveSpy] = useState(null);
  const companyRef = useRef(null);
  const location = useLocation();

  /* A plain lookup, not a memo: SPY_ROUTES is a module constant, so this is
     already reference-stable per route and safe as an effect dependency. */
  const spySections = SPY_ROUTES[location.pathname] || null;

  /* One theme everywhere: solid white. Earlier passes tried a navy glass bar and
     before that a transparent one; both made the links and the wordmark fight
     whatever the hero slide happened to be showing underneath. An opaque white
     plate is decided rather than reactive — the bar reads the same on every
     route and over every slide, and the navy wordmark sits on its native
     background with no plate behind it.

     The only state left is elevation: flat while the page is at the top, and a
     soft cast shadow once content starts sliding under it. */
  const isHome = location.pathname === '/';

  /* Elevation and the scroll-spy share one scroll listener and one rAF. They
     are both "where is the page right now" questions, and two passive listeners
     each scheduling their own frame is twice the work for the same answer. */
  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      setIsScrolled(window.scrollY > 20);

      if (!spySections) {
        setActiveSpy(null);
        return;
      }

      /* Walk the sections in document order and keep the last one whose top has
         already crossed the probe. Tracking the last match rather than looking
         for a rect that straddles the line is what keeps the highlight pinned
         to the final section when the probe has run past everything and is
         sitting in the footer. */
      let current = null;
      for (const entry of spySections) {
        const el = document.getElementById(entry.section);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= SPY_PROBE_PX) current = entry;
        else break;
      }
      setActiveSpy(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    /* Measure once on mount and after each route change: a spied route's
       sections do not exist until its page component has rendered, and arriving
       at one from another route fires no scroll event. */
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [spySections, location.pathname]);

  // Trap focus & lock scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => {
        if (e.key === 'Escape') setMenuOpen(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [menuOpen]);

  /* Dropdown dismissal. Pointer-outside and Escape are both required: the panel
     opens on hover but can also be opened from the keyboard, and a hover-only
     close leaves it stranded open for anyone who tabbed into it. */
  useEffect(() => {
    if (!companyOpen) return;
    const onPointerDown = (e) => {
      if (companyRef.current && !companyRef.current.contains(e.target)) setCompanyOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setCompanyOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [companyOpen]);

  // Any navigation closes both surfaces.
  useEffect(() => {
    setCompanyOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.search, location.hash]);

  /* Where the spy has nothing to say — an unmapped route, or a mapped one whose
     first section is still below the probe — the active item is derived from
     the route instead. The bar is never left with no highlight at all.

     /blog resolves to 'company' now that Blog lives inside that dropdown: the
     trigger is the only thing on the bar standing for it. */
  const routeActiveId = useMemo(() => {
    const p = location.pathname;
    if (p === '/') return null;
    if (p.startsWith('/about') || p.startsWith('/why-solar') || p.startsWith('/blog')) return 'company';
    if (p.startsWith('/projects')) return 'projects';
    if (p.startsWith('/roi-calculator')) return 'calculator';
    if (p.startsWith('/faq')) return 'faq';
    if (p.startsWith('/quote')) {
      return location.search.includes('tab=contact') ? 'contact' : 'quote';
    }
    return null;
  }, [location.pathname, location.search]);

  /* Which child of the Company group the route alone implies — the coarse
     answer, refined by the spy where a route has one. /about answers 'about'
     regardless of the hash: the hash is a one-time scroll instruction that
     lingers in the URL long after the reader has scrolled back up, so letting
     it pick the child would leave the dropdown marking "Why Gurukrupa" at the
     top of the page. The /about spy entry supplies that answer instead, and
     retracts it when the reader leaves the section. */
  const routeCompanyId = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/why-solar')) return 'why-solar';
    if (p.startsWith('/blog')) return 'blog';
    if (p.startsWith('/about')) return 'about';
    return null;
  }, [location.pathname]);

  const activeId = activeSpy ? activeSpy.navId : routeActiveId;
  const activeCompanyId = (activeSpy && activeSpy.companyId) || routeCompanyId;

  /* Only ever a label swap. `activeId === 'company'` still drives the
     highlight, the panel still opens on hover and click, and the dropdown still
     lists all four children — including About Us itself, so the row is reachable
     even while its name is the one printed on the trigger. */
  const companyLabel = activeId === 'company' && ABOUT_COMPANY_IDS.includes(activeCompanyId)
    ? COMPANY_LABEL_ABOUT
    : COMPANY_LABEL_GROUP;

  /* <Link> to a hash on the route you are already on changes the location but
     ScrollToTop's effect is keyed on that location — clicking "Our Product
     Range" a second time from #products is a no-op because the hash never
     changed. Handling the same-page case here makes every anchor behave the
     same way on every click. */
  const handleHashNav = useCallback(
    (to) => (e) => {
      const hashIndex = to.indexOf('#');
      if (hashIndex === -1) return;
      const targetPath = to.slice(0, hashIndex) || '/';
      if (location.pathname !== targetPath) return; // let the router navigate
      const el = document.getElementById(to.slice(hashIndex + 1));
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth' });
    },
    [location.pathname],
  );

  return (
    <>
      <style>{`
        /* Deliberately NOT called .nav-glass: three page components
           (PrivacyPolicy, TermsAndConditions, RemainingPages) define their own
           light .nav-glass for their sub-navs, and because those <style> blocks
           mount after this one they win the cascade at equal specificity. The
           site bar owns a namespace nothing else touches. */
        /* Opaque white. No backdrop-filter and no gradient: there is nothing to
           interpolate on scroll, which also means no compositor pass per frame
           and none of the Safari tearing the old translucent bar needed a
           will-change hack to hide. The faint 163deg wash is the same top-lit
           surface treatment the cards use — it keeps the bar from reading as a
           flat cut-out against the page below it. */
        .site-nav {
          background: linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 62%, #FDFDFF 100%);
          border-bottom: 1px solid rgba(10,37,64,0.08);
          box-shadow: none;
          transition: box-shadow .45s ease, border-color .45s ease;
        }
        /* Once the page scrolls, content is passing underneath the bar and it
           needs to read as the top layer. Elevation is the only thing that
           changes — the white is constant. */
        .site-nav--scrolled {
          border-bottom-color: rgba(10,37,64,0.10);
          box-shadow:
            0 1px 2px rgba(10,37,64,0.04),
            0 10px 30px -12px rgba(10,37,64,0.16);
        }
        /* Hairline of brand gold along the bottom edge — the one warm note on an
           otherwise white bar, and what stops it reading as a browser chrome
           strip. Carried at a higher alpha than the navy version needed: gold
           against white has far less to push against. */
        .site-nav::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: -1px;
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(245,166,35,0.00) 8%,
            rgba(245,166,35,0.70) 50%,
            rgba(245,166,35,0.00) 92%,
            transparent 100%);
          pointer-events: none;
        }

        /* Progressive disclosure of the rail. The bar now carries two action
           buttons alongside the links, so the tail of the list appears as the
           viewport earns the width for it rather than overflowing at 1024px.
           Breakpoints mirror Tailwind's lg / xl / 2xl so the bar steps in time
           with the rest of the page. */
        .rail-lg, .rail-xl, .rail-2xl { display: none; }
        @media (min-width: 1024px) { .rail-lg  { display: inline-flex; } }
        @media (min-width: 1280px) { .rail-xl  { display: inline-flex; } }
        @media (min-width: 1536px) { .rail-2xl { display: inline-flex; } }

        /* Navy on white. 0.80 alpha rather than the flat token so the hovered
           link has somewhere to go; at 20px on white that still measures well
           past AA. The text-shadow the navy bar needed is gone — there is no
           photograph behind the type any more. */
        .site-nav .nav-link {
          position: relative;
          color: rgba(10,37,64,0.80);
          white-space: nowrap;
          transition: color .25s ease;
        }
        .site-nav .nav-link:hover { color: var(--color-secondary, #0A2540); }

        /* ── Scroll-spy active state ────────────────────────────────────────
           Two signals, because one is not enough on a bar this wide: full navy
           (the hover destination, so the active item reads as permanently
           hovered) plus the gold rule underneath at full width. Weight is left
           alone on purpose — swapping 500 for 600 as the reader scrolls makes
           the whole bar reflow item by item, which is far more distracting than
           the highlight is informative. */
        .site-nav .nav-link.is-active { color: var(--color-secondary, #0A2540); }

        .site-nav .nav-underline {
          position: absolute;
          left: 0; bottom: -2px;
          width: 0; height: 2px;
          border-radius: 9999px;
          background: var(--color-primary, #F5A623);
          transition: width .3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow .3s ease;
          pointer-events: none;
        }
        .site-nav .nav-link:hover .nav-underline,
        .site-nav .nav-link:focus-visible .nav-underline { width: 100%; }
        .site-nav .nav-link.is-active .nav-underline {
          width: 100%;
          box-shadow: 0 0 10px rgba(245,166,35,0.55);
        }
        @media (prefers-reduced-motion: reduce) {
          .site-nav .nav-underline { transition: none; }
        }

        /* ── Company dropdown ───────────────────────────────────────────────
           Opens on hover and on click. The ::before strip is the bridge across
           the 8px gap between trigger and panel — without it the pointer leaves
           the trigger, the panel closes, and the menu is unreachable by mouse. */
        .nav-dropdown {
          position: absolute;
          top: 100%; left: 50%;
          transform: translateX(-50%);
          margin-top: 0.5rem;
          min-width: 16rem;
          padding: 0.5rem;
          background: #FFFFFF;
          border: 1px solid rgba(10,37,64,0.10);
          border-radius: 0.9rem;
          box-shadow:
            0 2px 4px rgba(10,37,64,0.06),
            0 12px 26px -8px rgba(10,37,64,0.14),
            0 32px 64px -18px rgba(10,37,64,0.20);
          z-index: 60;
          animation: nav-dropdown-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .nav-dropdown::before {
          content: '';
          position: absolute;
          left: 0; right: 0; top: -0.65rem;
          height: 0.65rem;
        }
        @keyframes nav-dropdown-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .nav-dropdown { animation: none; }
        }
        .nav-dropdown-item {
          display: block;
          padding: 0.6rem 0.75rem;
          border-radius: 0.6rem;
          color: var(--color-secondary, #0A2540);
          transition: background .2s ease, transform .2s ease;
        }
        .nav-dropdown-item:hover { background: rgba(245,166,35,0.10); transform: translateX(2px); }
        .nav-dropdown-item.is-active { background: rgba(245,166,35,0.14); }

        /* ── Self-renaming Company trigger ──────────────────────────────────
           The label swaps as the reader scrolls, and a label that changes width
           drags every item to its right along with it — the same trade the
           active state makes two rules up, where font-weight is deliberately
           left alone: on a bar this wide, an item that moves while you read it
           costs more than the information the movement carries.

           So the width is reserved. It is reserved by *stacking every possible
           label in one grid cell* rather than by a hand-tuned min-width. A grid
           track sizes to its widest item, so the trigger measures itself: it is
           exactly as wide as its longest label and not one pixel wider, in
           whatever font the browser actually resolved.

           The min-width this replaces was 6.5rem, cut to fit "Why Gurukrupa"
           back when the trigger could display any of four children. Narrowing
           it to Company/About Us left ~40px of dead air inside the item — the
           bar's widest padding sat around its shortest word, which is precisely
           why Company looked oversized next to its neighbours. A hardcoded
           reservation cannot notice that its reason has gone away; this one
           cannot fail to. */
        .site-nav .nav-company-label {
          display: inline-grid;
          justify-items: start;
        }
        .site-nav .nav-company-label > * { grid-area: 1 / 1; }
        /* Present for measurement only. visibility:hidden keeps the box in
           layout (which is the entire point) while taking it out of both the
           paint and the accessibility tree, so the button's accessible name
           stays the single visible label. (No backticks in here — this whole
           block is a template literal and one would close it.) */
        .site-nav .nav-company-sizer {
          visibility: hidden;
          pointer-events: none;
        }
        /* Keyed on the label text in JSX, so React remounts the span and the
           animation actually replays on each swap rather than running once. */
        @keyframes nav-label-swap {
          from { opacity: 0; transform: translateY(-3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .site-nav .nav-company-text { animation: nav-label-swap 220ms ease both; }
        @media (prefers-reduced-motion: reduce) {
          .site-nav .nav-company-text { animation: none; }
        }

        /* ── Action buttons ─────────────────────────────────────────────────
           Subsidy is the quieter of the pair: it points at a section further
           down the same page, not at a conversion. Get Quotation carries the
           gold fill so there is exactly one primary action in the bar. */
        .nav-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          white-space: nowrap;
          border-radius: 0.65rem;
          font-weight: 600;
          transition: background .25s ease, border-color .25s ease,
                      box-shadow .25s ease, transform .25s ease, color .25s ease;
        }
        .nav-btn-ghost {
          background: rgba(10,37,64,0.04);
          border: 1px solid rgba(10,37,64,0.14);
          color: var(--color-secondary, #0A2540);
        }
        .nav-btn-ghost:hover {
          background: rgba(245,166,35,0.14);
          border-color: rgba(245,166,35,0.60);
          transform: translateY(-1px);
        }
        .nav-btn-ghost.is-active {
          background: rgba(245,166,35,0.18);
          border-color: var(--color-primary, #F5A623);
          box-shadow: 0 0 0 3px rgba(245,166,35,0.14);
        }
        .nav-btn-solid {
          background: var(--color-primary, #F5A623);
          border: 1px solid var(--color-primary, #F5A623);
          color: var(--color-secondary, #0A2540);
          box-shadow: 0 4px 14px rgba(245,166,35,0.30);
        }
        .nav-btn-solid:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(245,166,35,0.42);
        }
        /* ── Active Get Quotation ───────────────────────────────────────────
           The old active state was a gold ring at 0.28 alpha around a gold
           button. Gold on gold has almost no contrast to spend, so scrolling
           into #quotation produced a highlight that was, in practice, invisible
           — the one button on the bar that most needs to answer "you are here"
           was the only one that could not.

           The fix is to stop signalling in the same hue as the fill. Three
           things change at once, none of them gold-on-gold:
             · the flat fill becomes a lit gradient with a real top bevel and a
               dark bottom edge, so the button gains a light source
             · a NAVY ring, held off the button by a white gap, draws the outline
               in the one colour that has contrast against both the gold fill
               and the white bar
             · the cast shadow warms and deepens, so it lifts off the bar

           The white gap ring is invisible against the white bar by design: its
           whole job is to detach the navy ring from the button so the outline
           reads as deliberate rather than as a thick border. */
        .nav-btn-solid.is-active {
          background: linear-gradient(180deg, #FFC85A 0%, #F5A623 52%, #E2900E 100%);
          border-color: #D9880A;
          transform: translateY(-1px);
          box-shadow:
            0 0 0 3px #FFFFFF,
            0 0 0 4.5px rgba(10,37,64,0.88),
            0 10px 26px -6px rgba(245,166,35,0.68),
            inset 0 1px 0 rgba(255,255,255,0.62),
            inset 0 -1px 0 rgba(150,86,0,0.28);
        }
        /* One slow halo breathing outside the navy ring. Deliberately low
           amplitude and long period: this state can persist for as long as the
           reader stays in the quotation band, and anything faster would turn a
           wayfinding cue into something that has to be looked away from. */
        .nav-btn-solid.is-active::after {
          content: '';
          position: absolute;
          inset: -7px;
          border-radius: 0.95rem;
          border: 1.5px solid rgba(245,166,35,0.75);
          animation: navBtnHalo 2600ms cubic-bezier(0.32, 0, 0.24, 1) infinite;
          pointer-events: none;
        }
        @keyframes navBtnHalo {
          0%   { transform: scale(0.94); opacity: 0; }
          22%  { opacity: 0.75; }
          78%  { transform: scale(1.16); opacity: 0; }
          100% { transform: scale(1.16); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nav-btn-solid.is-active::after { animation: none; opacity: 0.55; transform: none; }
        }
        .nav-btn:active { transform: scale(0.97); }

        .side-panel-glass {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
        }
        /* The panel used to borrow Homepage's .slide-in-right, a scroll-reveal
           class that sits at opacity:0 until an IntersectionObserver tags it —
           an observer that only ever scans elements present at mount, so the
           panel never became visible on the homepage. It owns its entrance now. */
        @keyframes side-panel-enter {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .side-panel-enter {
          animation: side-panel-enter 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .side-panel-enter { animation: none; opacity: 1; transform: none; }
        }
        /* Menu trigger, restyled for the white bar: a tinted navy chip. The glass
           version it replaces relied on a dark plate behind it and went
           invisible the moment the bar turned white. Gold on hover, matching the
           bottom hairline. */
        .menu-trigger {
          background: rgba(10, 37, 64, 0.05);
          color: var(--color-secondary, #0A2540);
          border: 1px solid rgba(10, 37, 64, 0.14);
          box-shadow: 0 1px 2px rgba(10, 37, 64, 0.05);
          transition: background .25s ease, color .25s ease, border-color .25s ease,
                      box-shadow .25s ease, transform .25s ease;
        }
        .menu-trigger:hover {
          background: var(--color-primary, #F5A623);
          color: var(--color-secondary, #0A2540);
          border-color: var(--color-primary, #F5A623);
          box-shadow: 0 6px 22px rgba(245, 166, 35, 0.32);
          transform: translateY(-1px);
        }
        .menu-trigger:active { transform: scale(0.96); }

        /* ── Side-panel rows ────────────────────────────────────────────────
           Every row is a 48px touch target with its label optically centred —
           py-2.5 on a text-lg row measured 44px, which is the WCAG floor rather
           than a comfortable size, and the panel is the one surface on the site
           that is used almost exclusively by thumb. */
        .side-nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 48px;
          padding: 0.5rem 0;
          color: var(--color-secondary, #0A2540);
          border-radius: 0.6rem;
          transition: background .2s ease, padding-left .2s ease, color .2s ease;
        }
        .side-nav-link:hover { background: rgba(245,166,35,0.09); padding-left: 0.5rem; }
        .side-nav-link:active { background: rgba(245,166,35,0.16); }

        /* Active marker. The panel is a list, not a rail, so the active row gets
           a gold left edge rather than an underline. */
        .side-nav-link.is-active {
          color: var(--color-secondary, #0A2540);
          box-shadow: inset 3px 0 0 var(--color-primary, #F5A623);
          padding-left: 0.75rem;
        }

        /* The chevron used to be a hover-only reveal. On the surface that is
           overwhelmingly touch-operated, "hover" resolves to "never" — the
           affordance was invisible to precisely the audience it was drawn for.
           It is always present now and merely strengthens on hover. */
        .side-nav-link .side-nav-chevron {
          flex-shrink: 0;
          color: var(--color-primary, #F5A623);
          opacity: 0.45;
          transition: opacity .2s ease, transform .2s ease;
        }
        .side-nav-link:hover .side-nav-chevron,
        .side-nav-link.is-active .side-nav-chevron {
          opacity: 1;
          transform: translateX(2px);
        }
        @media (prefers-reduced-motion: reduce) {
          .side-nav-link, .side-nav-link .side-nav-chevron { transition: none; }
        }

        /* Group heading. Small, quiet and sticky: the panel scrolls, and a
           heading that scrolls away takes the reader's place in the list with
           it. The background is opaque enough to hide rows passing underneath
           without breaking the panel's own translucency at rest. */
        .side-nav-heading {
          position: sticky;
          top: -1px;
          z-index: 1;
          background: rgba(255,255,255,0.94);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 0.5rem 0 0.35rem;
          margin-bottom: 0.1rem;
        }
      `}</style>

      {/* Fixed, not sticky. A sticky bar still occupies a row in normal flow,
          which is what put an opaque strip above the hero photo instead of over
          it. Taking it out of flow is what actually lets the hero run to the top
          of the viewport. */}
      <header
        className={`site-nav page-scale fixed top-0 left-0 right-0 z-50 ${
          isScrolled ? 'site-nav--scrolled' : ''
        }`}
      >
        <div className="container-site h-24 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center focus-ring rounded-xl flex-shrink-0">
            {/* No `onDark` plate. The wordmark is deep navy artwork on a
                transparent field and the bar is now white on every route, so it
                sits straight on the surface — the light plate it used to need
                against the navy bar would read as a sticker here. */}
            <Logo className="h-14 md:h-16" />
          </Link>

          <nav className="hidden lg:flex items-center gap-5 xl:gap-6" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const isActive = activeId === item.id;

              if (item.children) {
                return (
                  <div
                    key={item.id}
                    ref={companyRef}
                    className={`relative ${RAIL_CLASS[item.rail]} items-center`}
                    onMouseEnter={() => setCompanyOpen(true)}
                    onMouseLeave={() => setCompanyOpen(false)}
                  >
                    <button
                      type="button"
                      className={`nav-link text-sm font-medium focus-ring rounded-md px-1 py-1 inline-flex items-center gap-1 ${
                        isActive ? 'is-active' : ''
                      }`}
                      aria-expanded={companyOpen}
                      aria-haspopup="true"
                      onClick={() => setCompanyOpen((v) => !v)}
                    >
                      {/* Accessible name follows the visible text rather than
                          being pinned to "Company" by an aria-label: a screen
                          reader announcing a name the sighted user cannot see
                          on the control is the failure mode that rule exists to
                          prevent. The menu's contents identify the group.

                          The sizers are the width reservation — hidden copies
                          of every label the trigger can show, stacked in the
                          same grid cell as the real one. Keys are prefixed so
                          they cannot collide with the visible span's key, which
                          is the label text itself. */}
                      <span className="nav-company-label">
                        {COMPANY_TRIGGER_LABELS.map((text) => (
                          <span key={`sizer-${text}`} className="nav-company-sizer" aria-hidden="true">
                            {text}
                          </span>
                        ))}
                        <span key={companyLabel} className="nav-company-text">
                          {companyLabel}
                        </span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          companyOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                      <span className="nav-underline" />
                    </button>

                    {companyOpen && (
                      <div className="nav-dropdown">
                        {/* Marked from the same id the trigger's label is
                            derived from, rather than by string-matching the
                            URL. The old compare could never light a row while
                            the reader was on the homepage's about teaser, and
                            went stale the moment a lingering hash made
                            pathname+hash stop equalling the declared `to`. */}
                        {item.children.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            onClick={() => setCompanyOpen(false)}
                            className={`nav-dropdown-item focus-ring ${
                              child.id === activeCompanyId ? 'is-active' : ''
                            }`}
                          >
                            <span className="block text-sm font-semibold">{child.label}</span>
                            <span className="block text-xs text-muted-token mt-0.5">
                              {child.blurb}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.to}
                  onClick={handleHashNav(item.to)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`nav-link ${RAIL_CLASS[item.rail]} items-center text-sm font-medium focus-ring rounded-md px-1 py-1 ${
                    isActive ? 'is-active' : ''
                  }`}
                >
                  {item.label}
                  <span className="nav-underline" />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Subsidy — an anchor to the homepage's #subsidy band, not a page.
                Hidden below md: at phone widths the side panel carries it and
                the bar keeps room for the one primary action. */}
            <Link
              to="/#subsidy"
              onClick={handleHashNav('/#subsidy')}
              className={`nav-btn nav-btn-ghost focus-ring hidden md:inline-flex text-sm px-3.5 py-2 ${
                activeId === 'subsidy' ? 'is-active' : ''
              }`}
            >
              <BadgePercent className="w-4 h-4" aria-hidden="true" />
              Subsidy
            </Link>

            <Link
              to="/quote"
              className={`nav-btn nav-btn-solid focus-ring hidden sm:inline-flex text-sm px-4 py-2 ${
                activeId === 'quote' ? 'is-active' : ''
              }`}
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              Get Quotation
            </Link>

            {/* Side-menu trigger — always visible, top-right, on every breakpoint */}
            <button
              className="menu-trigger focus-ring rounded-xl p-2.5 flex-shrink-0"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="side-menu-panel"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Flow spacer standing in for the now-fixed bar. The homepage skips it on
          purpose — that is the whole point of the floating header there.
          It carries `page-scale` for the same reason the bar does: both are h-24,
          and if only one of them is scaled to 93% the spacer stops matching the
          bar it exists to reserve room for. */}
      {!isHome && <div className="page-scale h-24 flex-shrink-0" aria-hidden="true" />}

      {/* Slide-in Side Panel */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            id="side-menu-panel"
            className="side-panel-glass side-panel-enter w-full max-w-sm h-full shadow-2xl relative flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            {/* `border-token`, not `border-token/50`. The token is a hand-written
                CSS class (index.css), not a Tailwind palette entry, so the
                opacity modifier produced a class name that matches no rule at
                all and these three rules quietly fell back to Tailwind's default
                border grey. It went unnoticed because #e5e7eb and the token's
                #e2e5ea are a hair apart — but the fallback is not the token, and
                a theme change would have moved two of the panel's borders and
                left these behind. */}
            <div className="flex items-center justify-between p-6 border-b border-token">
              <Logo className="h-14" />
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 text-secondary-token hover:bg-token/10 rounded-full focus-ring"
                aria-label="Close menu"
                autoFocus
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation first, prose after. The 28-years blurb used to open
                the panel and cost roughly a fifth of a phone's viewport before
                the first link — brand copy charging rent on the one screen the
                reader opened specifically to leave. It still says the same
                thing, one scroll further down, where it reads as a sign-off
                rather than an obstacle. */}
            <div className="px-6 pt-3 pb-6 flex-1 overflow-y-auto">
              <nav aria-label="All pages">
                {PANEL_GROUPS.map((group) => (
                  <div key={group.id} className="mb-5 last:mb-0">
                    <p className="side-nav-heading text-xs font-semibold uppercase tracking-wider text-eyebrow-token">
                      {group.label}
                    </p>
                    <div className="flex flex-col">
                      {group.items.map((item) => (
                        <Link
                          key={item.id}
                          to={item.to}
                          onClick={(e) => {
                            handleHashNav(item.to)(e);
                            setMenuOpen(false);
                          }}
                          aria-current={
                            item.id === activeId || item.id === activeCompanyId ? 'true' : undefined
                          }
                          className={`side-nav-link text-base font-semibold focus-ring ${
                            item.id === activeId || item.id === activeCompanyId ? 'is-active' : ''
                          }`}
                        >
                          {item.label}
                          <ChevronRight className="side-nav-chevron w-5 h-5" aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              <p className="mt-8 pt-6 border-t border-token text-sm text-muted-token leading-relaxed">
                <span className="font-semibold text-secondary-token">28 years</span> of engineering
                legacy, 5 years of solar excellence — powering Gujarat with premium commercial and
                residential solar.
              </p>

              <div className="mt-6 space-y-4 text-sm text-secondary-token">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-token flex-shrink-0" />
                  <span>
                    {ADDRESS_LINES.map((line) => (
                      <span key={line} className="block">{line}</span>
                    ))}
                  </span>
                </div>
                {/* Address, email and hours are reference detail. The number is
                    not — it is a live action, so it is a tel: link here and the
                    left half of the pinned bar below. */}
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary-token flex-shrink-0" />
                  <a href={`mailto:${EMAIL}`} className="break-all focus-ring rounded-sm hover:text-primary-token transition-colors">
                    {EMAIL}
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary-token flex-shrink-0" />
                  <span>{WORKING_HOURS_SHORT}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary-token flex-shrink-0" />
                  <a href={PHONE_HREF} className="focus-ring rounded-sm hover:text-primary-token transition-colors">
                    {PHONE_DISPLAY}
                  </a>
                </div>
              </div>
            </div>

            {/* Pinned action bar. Two conversions, not one: a quotation is the
                considered path and a call is the impatient one, and on a phone
                the impatient path is the majority. Burying the number sixty rows
                down in a contact block asked the reader most ready to buy to do
                the most work. Split 2:3 so the primary still dominates, both
                rows 52px in the thumb arc at the foot of the panel. */}
            <div className="p-4 border-t border-token grid grid-cols-5 gap-3">
              <a
                href={PHONE_HREF}
                className="col-span-2 nav-btn nav-btn-ghost focus-ring justify-center px-3 py-3.5 text-sm"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                Call
              </a>
              <Link
                to="/quote"
                onClick={() => setMenuOpen(false)}
                className="col-span-3 nav-btn nav-btn-solid focus-ring justify-center px-4 py-3.5 text-sm"
              >
                <FileText className="w-4 h-4" aria-hidden="true" />
                Get Quotation
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
