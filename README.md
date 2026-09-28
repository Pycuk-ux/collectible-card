# Collectible Card

An interactive 3D holographic trading card built with Three.js, from the Figma
frame *Pycuk_DS › card* (node `504:1066`).

**Live:** https://pycuk-ux.github.io/collectible-card/

```bash
npm install
npm run dev
```

## How it works

- **Layers**: every Figma layer is a separate image in `public/card/`. Their
  positions (Figma px, 1 world unit = 1 px) live in `src/layout.ts`.
- **Card stock**: 4 px extruded rounded rectangle with a small bevel on the edge (`CARD.thickness`).
- **Window parallax**: `moving-inside-elements`, `my-photo` and `scan-effect`
  (hard-light 30 %) drift at different depths inside the torn-edge mask (`WINDOW_LAYERS[].depth`).
- **Raised elements**: name, signature, UX/UI, icons, barcode and 7 YOE sit a
  few px above the card surface (`DECALS[].lift`), so they separate slightly on tilt.
- **Holographic laminate**: `HOLO` in `src/layout.ts` picks the pattern (atoms now;
  the original text pattern is kept in `HOLO_PATTERNS`). The pattern drives an additive rainbow
  foil, a gloss band and a glare that react to tilt (`src/shaders.ts`, strength `HOLO_STRENGTH`).
- **Stage**: the page follows the phone mockup and the background never moves. `website-bg.png` (1565 × 2866) is
  the stage at card scale; the Bitcoin (behind the card), Chinese coin and
  blurred unicorn (in front) are placed by their mockup positions in `EXTRAS`
  and tilt together with the card as one scene (movement comes only from real depth)
  (`public/extras/`).
- **Input**: cursor on desktop, gyroscope on phones (iOS asks via an
  "Enable motion" button). With no input the card holds still. Swipe (or drag)
  left/right to spin it. All motion limits live in `MOTION` in `src/layout.ts`.

## Hosting

`.github/workflows/pages.yml` deploys to GitHub Pages on every push to `main`
(Settings → Pages → Source: **GitHub Actions**). Phone tilt needs the page
opened directly over https, not inside another site's iframe.
