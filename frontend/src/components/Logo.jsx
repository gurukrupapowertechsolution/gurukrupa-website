import React from 'react';

/**
 * Brand logo.
 *
 * Source of truth is /logo-mark.png — the brand artwork with a real alpha
 * channel, pre-trimmed to its own bounds. It is generated from /logo.png
 * (a 2048² opaque RGB export sitting on a noisy off-white field) by removing
 * only the near-white region connected to the image border. The mark relies on
 * white *interior* shapes — the house body, the grid lines between solar cells,
 * the turbine hub — so a blanket "white → transparent" would have gutted it.
 *
 * Because the PNG is already trimmed, sizing is just `height` + `w-auto`:
 * no background-position crop maths, and `object-contain` guarantees the
 * wordmark can never be clipped whatever box the caller gives it. (The previous
 * implementation cropped via percentage background-size/position, which only
 * held while the box kept an exact 1578:1065 ratio and clipped the moment
 * layout stretched it.)
 *
 * `onDark`: the wordmark is deep navy, so on our dark navy surfaces (footer,
 * estimate card) it needs a light backing to stay legible. Everywhere else the
 * mark sits directly on the surface with no plate.
 */
export default function Logo({ className = 'h-16', onDark = false }) {
  const img = (
    <img
      src="/logo-mark.png"
      alt="Gurukrupa Powertech Solutions"
      className={`block w-auto max-w-full object-contain ${onDark ? 'h-full' : className}`}
    />
  );

  if (!onDark) return img;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl px-3 py-2 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(255,255,255,0.55)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.20)',
      }}
    >
      {img}
    </span>
  );
}
