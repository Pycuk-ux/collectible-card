# Next: prize reveal (trading-card pack)

Status: planning. Nothing built yet. The live card at
https://pycuk-ux.github.io/collectible-card/ stays as it is until this is ready.

## Idea

A QR code on the back of the printed card opens the site. The visitor sees a
sealed foil card pack, tears it open, and light bursts out to reveal their
prize card. Motion reference: a gift-box opening video (idle → tap → shake → light
burst + flash → prize swings in → idle shine, about 17 s in total).

## Chosen direction: open a foil card pack

Visual reference: a glossy foil trading-card pack (crimped top and bottom
seals, soft specular highlights), like a "Trading Card Pack" mockup. The pack
reads instantly as "something to open", which keeps the UX simple: one clear
action instead of a choice first.

The back of the printed card says "Claim your prize" with the QR code; that QR
opens this page.

### Flow

1. **Sealed pack:** the pack floats in the centre and tilts with the phone;
   foil highlights slide across it. Button / hint: "Tear to open".
2. **Tear:** the user swipes across the top seal (or taps the button). The top
   strip tears off along the crimp and flies away.
3. **Light:** light pours out of the opening, then a white flash.
4. **Reveal:** the prize card slides up out of the pack and settles in the
   centre; the empty pack drops away.
5. **Settle:** the prize card becomes interactive like the current card, with
   prize text and a button.

The first tap/swipe is the moment to ask for iPhone motion permission and to
unlock sound.

### Still to decide

- Does the pack hold **one** prize card, or **3–5** that fan out so the user
  picks one (the earlier "pick a card" idea, now after the pack opens)?
- The pack artwork must be your own design. The reference is a stock mockup
  (Yellow Images), so its watermark text and styling can't be used as-is.

### Pack build notes

- The foil look comes from the same approach as the card: artwork PNG + a
  shader for moving specular highlights, plus a soft normal/bump map for the
  crinkles so light slides over them.
- Split into two meshes along the tear line (top strip + body) so the strip
  can fly off; a jagged edge texture on both sides of the cut.

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

- Pack front artwork (and back, if it can be turned), same proportions as
  the pack shape, with the crimped seals.
- Pack top strip and pack body as separate layers, split along the tear line.
- Optional: a grey "crinkle" map (light = raised) for the foil highlights.
- Prize card front(s): layered like the current card for parallax, or one
  flat PNG each for simplicity.
- Light rays (radial burst), soft glow blob, 2–3 sparkle/dust shapes.
- Text + button for the choose and reveal screens.
- Optional sounds: whoosh, flip, shine sting.

## Motion spec (starting point, to be confirmed)

| Step | Duration | Notes |
|---|---|---|
| Pack idle | loop | gentle float, foil highlights follow tilt |
| Anticipation shake | 0.4 s | 3 quick wiggles, ±4° |
| Tear strip off | 0.4 s | follows the swipe, then flies up and away |
| Light burst | ~0.6 s peak | rays scale 0.3 → 1.5, slow rotation, glow |
| White flash | 0.15 s in, 0.5 s out | covers the flip |
| Card slides out of the pack | 0.8 s | slight overshoot, ends centred; pack drops away |

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
2. One prize card in the pack, or 3–5 to pick from, and what the prizes are.
3. Pack artwork (front, top strip, body) + prize card fronts (Figma link or PNGs).
4. Motion timings, or "use your judgement" (based on the reference video).
5. The QR domain.
