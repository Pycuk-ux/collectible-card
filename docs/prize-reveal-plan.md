# Next: "Pick a card" prize reveal

Status: planning. Nothing built yet. The live card at
https://pycuk-ux.github.io/collectible-card/ stays as it is until this is ready.

## Idea

A QR code on the back of the printed card opens the site. The visitor sees 3–5
face-down cards, picks one, and it opens with a light-burst animation to reveal
their prize. Reference: a gift-box opening video (idle → tap → shake → light
burst + flash → prize swings in → idle shine, about 17 s in total).

## Flow

1. **Choose:** 3–5 cards face-down in a fan/row, floating and tilting with the
   phone. "Pick one".
2. **Select:** the chosen card lifts and centres; the others fade and drop away.
3. **Reveal:** short shake, light bursts from the edges, the card flips to the
   prize with a flash and sparkles.
4. **Settle:** the prize card becomes interactive like the current card, with
   prize text and a button.

The tap on a card is the moment to ask for iPhone motion permission and to
unlock sound.

## Open decisions (needed before building)

1. **How the prize is chosen**
   - A: random on the phone (refresh = another try). Easy, static site.
   - B: fixed prize behind each card. Easy, static site.
   - C: one prize per person, can't be replayed. Needs a backend + database
     (and ideally a unique code per QR). Much bigger build.
   - A/B can remember the result on that phone (localStorage) so a return
     visit shows the same prize; clearing browser data bypasses it.
   - Fun prizes → A or B. Real rewards (discounts, gifts) → C.
2. **Number of cards (3–5) and what each prize is.**
3. **Domain for the QR code:** use one you control (e.g. card.yourname.com
   pointed at GitHub Pages), because a printed QR can't be changed later.

## Assets to prepare (Figma → transparent PNG)

- Card back (shared by all face-down cards).
- One front per prize. Layered like the current card for parallax, or one
  flat PNG each for simplicity.
- Light rays (radial burst), soft glow blob, 2–3 sparkle/dust shapes.
- Text + button for the choose and reveal screens.
- Optional sounds: whoosh, flip, shine sting.

## Motion spec (starting point, to be confirmed)

| Step | Duration | Notes |
|---|---|---|
| Cards deal in | 0.1 s stagger | slide into the fan on load |
| Select: chosen lifts + centres | 0.5 s | others fade 0.3 s |
| Anticipation shake | 0.4 s | 3 quick wiggles, ±4° |
| Light burst | ~0.6 s peak | rays scale 0.3 → 1.5, slow rotation, glow |
| White flash | 0.15 s in, 0.5 s out | covers the flip |
| Flip to prize | 0.8 s | slight overshoot, ends centred |

## QR printing checklist

- At least 2 × 2 cm, with a white quiet zone around it; dark on light.
- No holographic foil over the code.
- Test scans on several iPhones and Androids in real lighting before printing.
- Optionally add `?from=card` to the URL to count scans.

## Phone testing

- iPhone + Android, on slow mobile data. First screen within ~2 s.
- Respect reduced-motion (offer a skip).
- Decide what a returning visitor sees (same prize, or a replay button).

## To send when ready

1. Prize option A / B / C.
2. Number of cards and the prizes.
3. Card back + prize fronts (Figma link or PNGs).
4. Motion timings, or "use your judgement" (based on the reference video).
5. The QR domain.
