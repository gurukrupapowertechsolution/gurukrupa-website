import React, { useEffect, useRef, useState } from 'react';

/**
 * Number that counts up from zero when it scrolls into view.
 *
 * Takes the finished stat string rather than a number plus a pile of props —
 * "1.9 MW", "1230+", "28 yrs", "<48 hrs" — and animates only the numeric run
 * inside it, leaving whatever sits either side of that alone. That matters
 * here: two of the four stats on the page carry a leading symbol ("<48 hrs")
 * or a trailing one ("1230+"), and both are load-bearing — "48 hrs" and "1230"
 * are different claims from the ones actually being made. Parsing rather than
 * reformatting is what keeps the rendered text identical to the source string
 * at rest.
 *
 * Decimal places are read off the target, so 1.9 counts through 0.4 / 1.1 / 1.7
 * rather than snapping from 0 to 2. Grouping separators are stripped for the
 * arithmetic and restored on the way out, so 1230 renders as 1,230 only if the
 * source string asked for it.
 *
 * Duration is 1.6s on an ease-out cubic: fast enough that a visitor scrolling
 * at a normal pace sees the whole run, slow enough that the last few tenths of
 * "1.9" are legible rather than a blur. The tail of an ease-out is what makes a
 * counter read as settling on a figure instead of stopping at one.
 *
 * Replays on every entry. The observer is left connected rather than
 * unobserving after the first hit, so scrolling away and back re-runs the
 * count; leaving the section resets the display to zero, which is what makes
 * the replay read as a fresh count rather than as the figure twitching.
 */

const DURATION_MS = 1600;

/* Leading non-digits, the numeric run, trailing remainder. A stat with no digit
   in it at all falls through to `null` and is rendered verbatim. */
const STAT_PATTERN = /^(\D*?)([\d][\d,]*(?:\.\d+)?)(.*)$/s;

function parseStat(value) {
  const match = STAT_PATTERN.exec(String(value));
  if (!match) return null;

  const [, prefix, numeral, suffix] = match;
  const grouped = numeral.includes(',');
  const decimals = numeral.includes('.') ? numeral.split('.')[1].length : 0;
  const target = Number(numeral.replace(/,/g, ''));
  if (!Number.isFinite(target)) return null;

  return { prefix, suffix, target, decimals, grouped };
}

function formatValue(n, { decimals, grouped }) {
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  });
}

export default function CountUp({ value, className = '' }) {
  const parsed = parseStat(value);
  const nodeRef = useRef(null);
  const [display, setDisplay] = useState(() =>
    parsed ? formatValue(0, parsed) : null
  );

  /* `parsed` is derived from a prop and recreated every render, so the effect
     depends on its primitive fields rather than on the object — otherwise it
     would tear down and restart the animation on each parent re-render. */
  const { target, decimals, grouped } = parsed ?? {};

  useEffect(() => {
    if (!parsed) return undefined;

    const format = (n) => formatValue(n, { decimals, grouped });

    // Reduced motion gets the finished figure, immediately.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(format(target));
      return undefined;
    }

    const node = nodeRef.current;
    if (!node) return undefined;

    let frame = 0;
    let start = 0;

    const step = (time) => {
      if (!start) start = time;
      const t = Math.min((time - start) / DURATION_MS, 1);
      // Ease-out cubic.
      const eased = 1 - (1 - t) ** 3;
      setDisplay(format(target * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          cancelAnimationFrame(frame);
          if (entry.isIntersecting) {
            /* `start` is per-run, so it has to be cleared here — left at the
               previous run's timestamp the first step() would compute t = 1 and
               the counter would snap straight to the target. */
            start = 0;
            frame = requestAnimationFrame(step);
          } else {
            // Rewound while off-screen, ready for the next entry.
            setDisplay(format(0));
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, decimals, grouped]);

  // Not a countable stat — render exactly what was passed in.
  if (!parsed) return <span className={className}>{value}</span>;

  return (
    <span ref={nodeRef} className={`count-up ${className}`.trim()}>
      {parsed.prefix}
      {display}
      {parsed.suffix}
    </span>
  );
}
