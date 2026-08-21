import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  activateSession,
  clearJourney,
  enterJourneyStep,
  flowStepFor,
  parkSession,
} from '../lib/quoteSession';

/**
 * Watches every route change and decides whether the quotation session is still
 * being worked on.
 *
 * Inside the flow (/quote, /roi-calculator) it records the step — which is what
 * the breadcrumbs on both pages are rendered from — and marks the session
 * active. Outside it — About Us, the blog, the homepage — it parks the session,
 * so the next return to a flow page asks before restoring anything instead of
 * silently repopulating a form the visitor has stopped thinking about.
 *
 * Both writes live here, and that is the point: this is the only thing in the
 * app that sees a route change as a route change. A page component sees its own
 * mount, which is a different event — it happens on tab switches that never
 * left the route, and fails to happen on views of the route that do not include
 * that page.
 *
 * This lives at the app shell rather than inside the two pages because the
 * event it cares about happens where neither of them is mounted: a visitor is
 * only "away" once they are on some third page. Nothing here renders.
 *
 * Parking never deletes. See the note in lib/quoteSession.js — the whole point
 * of the distinction is that the data survives the detour and only the silent
 * restore is withdrawn.
 *
 * The trail IS dropped on the way out, and that is not an exception to the
 * above. A draft is the visitor's work and outlives the detour; the trail is a
 * claim about their route, and the detour is precisely what makes that claim
 * false. Leaving it in place is what let the calculator go on describing itself
 * as a step out of the quotation page for someone who had since gone home and
 * come back through the nav — which the breadcrumb printed and, from this phase
 * on, the closing CTA would have echoed.
 */
export default function QuoteFlowSentinel() {
  const { pathname } = useLocation();

  useEffect(() => {
    const step = flowStepFor(pathname);
    if (step) {
      /* `enterJourneyStep`, not `pushJourneyStep`: a previous step whose form
         the visitor never filled in does not become a crumb. See the input-guard
         note in lib/quoteSession.js — recording every arrival is what made the
         quotation page claim "EMI & ROI Calculator › Get Quotation" for someone
         who had walked past an empty calculator. */
      enterJourneyStep(step);
      /* Both flow routes activate, whichever view of them is showing. This is
         the half that used to be missing: activation lived in /quote's
         QuotationPage panel, so arriving on ?tab=brochure or ?tab=contact left
         the session looking parked, and the next step of the flow greeted the
         visitor with a "welcome back" they had not earned by going anywhere.
         The route knows; the panel does not.

         Deliberately does NOT clear a pending recovery prompt — see the note in
         lib/quoteSession.js. Being back in the flow is not an answer to the
         question, and the page that can actually offer the draft back may be a
         tab switch away. */
      activateSession();
      return;
    }
    parkSession();
    clearJourney();
  }, [pathname]);

  return null;
}
