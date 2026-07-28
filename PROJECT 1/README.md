# Sitefolio — Field Notes for Site Walks

A mobile-first, responsive front-end for logging site-inspection notes — snags, measurements, and general observations — as they're found, not reconstructed afterward from memory.

Built as **Project 1 (Responsive Frontend Interface)** for the DecodeLabs Full Stack Development internship track.

## Overview

Sitefolio is a single-page interface for a site inspector's walk-through. It's built around a real habit: log the thing where you're standing, tag it by type, and let the timestamp do the rest. The visual language borrows from architectural drawings — a title block, dimension-line rules, and a floor-plan illustration — since that's the world the tool lives in.

## Features

- **Mobile-first responsive layout** — single column on phones, two-column log grid at tablet width, three-column at desktop, built entirely with CSS Grid and Flexbox (no framework).
- **Semantic HTML5** — proper `header`, `nav`, `main`, `section`, `aside`, and `footer` landmarks throughout.
- **Live data** — a "time on site" clock and the current date (in the title block) update in real time via vanilla JavaScript.
- **Filterable field log** — tap a tag (Snags / Measurements / General notes) to narrow the list; state is handled with plain JS, no dependencies.
- **Working entry form** — adding a note appends a real card to the log immediately, with its own timestamp and icon.
- **Print stylesheet** — hides navigation and the entry form, and reflows the log into a clean, printable report.
- **Original SVG artwork** — a floor-plan walk-through illustration, per-entry icon tiles, and a logo mark, all hand-built in the page rather than pulled from a stock library, so the file has no image assets or licensing to track.
- **Accessibility basics** — visible keyboard focus states, `aria-pressed` / `aria-expanded` on interactive controls, `prefers-reduced-motion` respected.

## Tech stack

- HTML5, CSS3 (Grid, Flexbox, `clamp()`, custom properties)
- Vanilla JavaScript — no build step, no dependencies
- Fonts (Google Fonts, loaded via `<link>`): Barlow Condensed (display), IBM Plex Sans (body), IBM Plex Mono (data/labels)

No frameworks by design — the brief calls for mastering the fundamentals before introducing tooling.

## File structure

```
sitefolio/
├── index.html    — markup, styles, and script (single file)
└── README.md     — this file
```

## Running it

No build step required.

1. Open `index.html` directly in any modern browser, **or**
2. Serve the folder locally:
   ```
   npx serve .
   ```
   or
   ```
   python3 -m http.server 8000
   ```

## Responsive breakpoints

| Width | Layout |
|---|---|
| < 768px | Single column, collapsible nav menu |
| ≥ 768px | Two-column log grid, side-by-side hero |
| ≥ 1024px | Three-column log grid, full nav bar |

## Browser support

Verified against current Chrome, Firefox, Safari, and Edge. Uses only well-supported modern CSS and JavaScript — no transpilation or polyfills needed.

## Next steps

This interface is the first milestone in the track; later projects connect it to a backend and a database.

---

**Contact:** decodelabs.tech@gmail.com · www.decodelabs.tech · Greater Lucknow, India
