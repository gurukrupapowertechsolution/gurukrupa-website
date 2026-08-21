import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator } from 'lucide-react';

/**
 * The secondary tab strip: Get Quotation · Brochure · EMI/ROI Calculator.
 *
 * This used to be markup inside GurukrupaPages, which meant it existed only on
 * /quote. The calculator is the third entry in that strip and a full page of
 * the same journey, so a visitor who followed the strip to it arrived somewhere
 * the strip had vanished — the one navigation that had just been used stopped
 * being available at the destination. It lives here now and both routes render
 * the same component, so there is no second copy to drift.
 *
 * ── Two modes, one appearance ──────────────────────────────────────────────
 * On /quote the quotation tabs are panels of a page that is already mounted, so
 * they are buttons that flip local state without touching the URL. On
 * /roi-calculator there is no such panel to flip — the same tabs have to be
 * real navigations, so they render as links to /quote?tab=<id>. The class
 * strings are shared between both branches rather than written twice, because
 * "the exact same header on every view" is the requirement and two copies of a
 * class list is how that stops being true.
 *
 * Every token class used here (`border-token`, `bg-secondary-token`,
 * `text-muted-token`, `focus-ring`, `container-site`) is declared globally in
 * index.css, not in either host page's own <style> block — so the strip renders
 * identically on a route that defines its own tokens and one that does not.
 *
 * @param {string}   activeId     Tab currently shown. Pass CALCULATOR_TAB_ID on
 *                                /roi-calculator.
 * @param {function} [onSelectTab] Provided by /quote only. Its presence is what
 *                                selects button mode over link mode.
 */

/**
 * Every tab `?tab=` may address. Kept complete so existing deep links keep
 * working — /quote?tab=contact is linked from the header, the footer, the
 * homepage contact section, the FAQ and every blog article.
 */
export const QUOTE_TABS = [
  { id: 'quotation', label: 'Get Quotation' },
  { id: 'projects', label: 'Projects' },
  { id: 'brochure', label: 'Brochure' },
  { id: 'contact', label: 'Contact' },
];

/**
 * Only these appear in the strip. Projects and Contact were cluttering it and
 * are already reachable from the main header and footer; the space goes to the
 * calculator. A tab outside this list still shows when it is the active one, so
 * deep links are not silently dead ends.
 */
export const VISIBLE_TAB_IDS = ['quotation', 'brochure'];

/** `activeId` for the standalone calculator route. Not a `?tab=` value — the
 *  calculator is its own route, not a panel of /quote. */
export const CALCULATOR_TAB_ID = 'calculator';

const TAB_BASE =
  'focus-ring whitespace-nowrap text-sm font-medium rounded-md px-4 py-2 transition-all';
const TAB_ACTIVE = 'bg-secondary-token text-white shadow-sm';
const TAB_IDLE =
  'text-muted-token hover:text-secondary-token hover:bg-secondary-token/5';

export default function FlowTabs({ activeId, onSelectTab }) {
  const shown = QUOTE_TABS.filter(
    (tab) => VISIBLE_TAB_IDS.includes(tab.id) || tab.id === activeId
  );
  const onCalculator = activeId === CALCULATOR_TAB_ID;

  return (
    /* top-24 clears the fixed h-24 site header — at top-0 this strip would
       scroll underneath it. */
    <div className="bg-white/80 backdrop-blur-md border-b border-token sticky top-24 z-40">
      <div className="container-site py-3 flex items-center">
        <nav
          className="flex items-center gap-2 overflow-x-auto w-full"
          style={{ scrollbarWidth: 'none' }}
        >
          {shown.map((tab) => {
            const isActive = tab.id === activeId;
            const className = `${TAB_BASE} ${isActive ? TAB_ACTIVE : TAB_IDLE}`;

            return onSelectTab ? (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={className}
              >
                {tab.label}
              </button>
            ) : (
              <Link
                key={tab.id}
                to={`/quote?tab=${tab.id}`}
                aria-current={isActive ? 'page' : undefined}
                className={className}
              >
                {tab.label}
              </Link>
            );
          })}

          {/* The calculator entry. A <span> rather than a link when it is the
              current page: a link to the page you are already on is a no-op the
              visitor cannot tell apart from a broken one. */}
          {onCalculator ? (
            <span
              aria-current="page"
              className={`${TAB_BASE} ${TAB_ACTIVE} inline-flex items-center gap-1.5`}
            >
              <Calculator className="w-4 h-4" /> EMI/ROI Calculator
            </span>
          ) : (
            <Link
              to="/roi-calculator"
              className={`${TAB_BASE} ${TAB_IDLE} inline-flex items-center gap-1.5`}
            >
              <Calculator className="w-4 h-4" /> EMI/ROI Calculator
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
