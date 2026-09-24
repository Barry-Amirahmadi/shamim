# شمیم / SHAMIM

A single-page scroll launch for one fragrance, Persian and RTL-first,
statically exported for GitHub Pages. One page, one product, one scroll: the
reader descends through the three tiers of a fragrance pyramid, and the ground,
the type weight and the light change on the way down — cold and bright at the
top, deep and warm at the bottom.

It is a format as much as a page: the same structure sells any single-product
or single-event launch. No prices, no cart, no form — it ends on a phone link
and a WhatsApp link. Contact details are deliberate placeholders.

**Live:** https://barry-amirahmadi.github.io/shamim/

```bash
npm ci
npm run build:pages   # static export under /shamim, exactly as deployed
npm run verify        # the one verification pass — prints a table
npm run test:smoke
npm run preview:pages # http://localhost:4321/shamim/
```

## Where things are

| Path | What it holds |
|---|---|
| `src/content/page.ts` | The whole copy deck — about 150 words, three act records |
| `src/types/content.ts` | The content contract every component reads |
| `src/app/tokens.css` | Every colour, size and duration, with measured contrast |
| `src/app/globals.css` | Layers 1 and 2: the grounds, the layout, `position: sticky` |
| `src/app/motion.css` | Layer 3: scroll-driven motion, and nothing the page needs |
| `src/components/Bottle.tsx` | The bottle — inline SVG, no image file |
| `scripts/verify.mjs` | Contrast, native scroll, JS-off, reduced motion, glyphs |
| `scripts/generate-media.mjs` | Five placeholder JPEGs at the real paths and ratios |

## Rules that hold everywhere

Three runtime dependencies (`next`, `react`, `react-dom`) — no animation or
scroll library. Scroll is never intercepted. No `letter-spacing` on Persian
text. `svh`, never `vh`. Nothing is hidden until a script reveals it.
