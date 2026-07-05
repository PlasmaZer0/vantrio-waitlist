# Vantrio waitlist landing page

Static site. **No build step, no bundler, no npm install, no `node_modules`.**
Deployed as plain files (GitHub Pages target).

## Files

- `index.html` — markup.
- `styles.css` — all styling (cache-busted `?v=`).
- `app.js` — classic script (`defer`): waitlist form submit + `localStorage`
  persistence, scroll reveals, and the hero phone's pointer spring.
  Cache-busted `?v=`.
- `favicon.svg` — lime "V" mark.
- `assets/` — self-hosted Bricolage Grotesque woff2 (`assets/fonts/`),
  `candle.jpg`, `florist.jpg`, `og.jpg`.

## Dependencies

**None.** No external runtime dependency, no CDN, no framework. Everything is
hand-written vanilla HTML/CSS/JS; fonts and images are self-hosted, so the page
renders fully offline once the files are served.

## The hero phone (`.phone`)

A real 3D object built in pure CSS — no canvas, no WebGL, no library. Six stacked
faces (`.phone-face`: a front `.phone-front` holding the screen, a `.phone-back`,
and four `.phone-edge-*` strips) are given real depth with `transform-style:
preserve-3d` and `translateZ` (half-thickness `--phone-depth`), so the case reads
as a solid object with visible edges as it turns. `.phone` shares `.hero-demo`'s
`perspective` camera with the "photos in" shots fan (each print offset on its own
`translateZ`), so both float at real depth.

**Motion** (all gated under `prefers-reduced-motion: no-preference`):

- *Idle orbit* — a slow 9s `phone-orbit` keyframe (`--ease-in-out`) drifting the
  phone around its resting tilt.
- *Pointer spring* — fine pointers only (`hover: hover and pointer: fine`). Rather
  than mapping the pointer straight to rotation, `app.js` runs a hand-rolled
  critically-damped spring (`springStep`) that eases toward a pointer-derived
  target, staying interruptible. While the pointer is active the CSS orbit is
  paused in place and resumes from its offset once the spring settles (no jump).

**Reduced motion:** under `prefers-reduced-motion: reduce` the orbit and the JS
spring loop are both off; the phone sits at one fixed 3D tilt.

The sample ad on the phone screen is a 12s CSS scene timeline inside
`.phone-screen` (two candle scenes + a lime "Alba Candles" end card), driving the
story-progress bars and a Ken Burns push on transform/opacity only.

## Local preview

```
python3 -m http.server 4173 --directory vantrio/waitlist
```

Then open http://localhost:4173. (Configured in `.claude/launch.json` as
`vantrio-waitlist`.)

## Forms

Both waitlist forms (hero + lime closer) POST to FormSubmit's AJAX endpoint (see
`app.js`); the visitor never leaves the page and sees an inline success state. A
honeypot field guards against bots. On success a `localStorage` flag is set, so
returning visitors see the "You're on the list." state instead of the form.
