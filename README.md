# Vantrio waitlist landing page

Static site. **No build step, no bundler, no npm install, no `node_modules`.**
Deployed as plain files (GitHub Pages target).

## Files

- `index.html` — markup.
- `styles.css` — all styling (cache-busted `?v=`).
- `app.js` — classic script (`defer`): waitlist form submit + `localStorage`
  persistence, the fallback IntersectionObserver scroll reveals, and the hero
  phone's pointer spring. Cache-busted `?v=`.
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

## Reveal & entrance motion (scroll-driven, progressively enhanced)

The below-fold section reveals and the hero entrance are **CSS scroll-driven** on
desktop-supporting browsers, with a full fallback everywhere else. The whole
scroll-driven layer lives inside one gate in `styles.css`:

```
@supports (animation-timeline: view()) {
  @media (min-width: 861px) and (prefers-reduced-motion: no-preference) { … }
}
```

(861px is one past the single 860px mobile breakpoint.)

- **Desktop, supporting browsers:** each `.reveal` section fades + rises scrubbed
  to scroll position on a `view()` timeline (`@keyframes reveal-in`,
  `animation-range: entry 5% cover 32%`); its `.cell`/`.step` children cascade in
  on their own `view()` timelines with progressively later ranges. The hero is
  above the fold, so it is scroll-*linked* not scroll-*entrance*: the timed load
  entrances are removed (nothing timer-based) and the hero gets a subtle exit
  parallax (`hero-drift` / `hero-drift-demo`, transform/opacity only) as you
  scroll past — at scroll 0 it renders fully present. `app.js` feature-detects the
  same gate and **skips the IntersectionObserver** on this branch, so only one
  reveal system runs.
- **Fallback (mobile `<=860px`, reduced motion, or no `animation-timeline`
  support):** unchanged. The timed load `rise`/`pop`/`draw` hero entrances run,
  and the `app.js` IntersectionObserver adds `.in` to reveal sections (with the
  `reveal-ready` fail-visible gate, rAF arming, and 4s failsafe intact).
- **Never scroll-driven, unchanged everywhere:** the phone ad demo (12s), the
  seller marquee (40s), the phone idle orbit (9s) + pointer spring, and all
  micro-interactions.
- **Fail-visible** holds in every branch: content is visible by default and no
  section can end up permanently hidden.

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
