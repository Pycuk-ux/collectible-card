// Every position below is in Figma pixels of the "card" frame (1140 × 1600,
// origin top-left), copied from Pycuk_DS › card (node 504:1066). The scene
// uses 1 world unit = 1 Figma px, so these numbers can be edited 1:1.

const BASE = import.meta.env.BASE_URL;
export const asset = (p: string) => BASE + p;

export const CARD = {
  width: 1140,
  height: 1600,
  radius: 48,
  /** Card-stock thickness (extrusion), in px. */
  thickness: 4,
  edgeColor: "#F3EEE3",
};

/** `main-bg` frame: the dark window holding the photo. */
export const WINDOW = { x: 27, y: 160, w: 1086, h: 1413 };

export interface WindowLayer {
  src: string;
  /** Exported PNG size (Figma adds a few px of bleed for the torn edge). */
  w: number;
  h: number;
  /** How far the layer drifts inside the window, px at full tilt. Bigger = deeper. */
  depth: number;
  /** Over-scale so drifting never reveals an edge. */
  zoom: number;
}

export const WINDOW_LAYERS = {
  /** Dark shape + curve lines. Its alpha is also the window mask. */
  bg: { src: asset("card/moving-inside-elements.png"), w: 1102, h: 1429, depth: 16, zoom: 1.05 },
  photo: { src: asset("card/my-photo.png"), w: 1102, h: 1421, depth: 12, zoom: 1.03 },
  /** Blended hard-light @ 30%, as in Figma. */
  scan: { src: asset("card/scan-effect.png"), w: 1102, h: 1416, depth: 8, zoom: 1.02 },
} satisfies Record<string, WindowLayer>;

export interface Decal {
  name: string;
  src: string;
  /** Top-left + size in card px. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Height above the card face, px. Drives how strongly it separates when tilted. */
  lift: number;
}

// Elements inside main-bg are offset by the window origin (27, 160).
const wx = WINDOW.x;
const wy = WINDOW.y;

export const DECALS: Decal[] = [
  { name: "name", src: asset("card/name.png"), x: 96, y: 53, w: 948, h: 71, lift: 4 },
  { name: "star", src: asset("card/star.png"), x: wx + 959, y: wy + 88, w: 64, h: 72, lift: 4 },
  { name: "upwork", src: asset("card/upwork.png"), x: wx + 855, y: wy + 90, w: 72, h: 72, lift: 4 },
  { name: "cod", src: asset("card/cod.png"), x: wx + 851, y: wy + 1028, w: 176, h: 64, lift: 4 },
  { name: "signature", src: asset("card/signature.png"), x: wx + 59, y: wy + 995, w: 384, h: 130, lift: 4 },
  { name: "uix-ui", src: asset("card/uix-ui.png"), x: wx + 60, y: wy + 1194, w: 393, h: 159, lift: 4 },
  // 7-yoe has a 4px outside stroke, so the PNG is 8px larger than the vector node.
  { name: "7-yoe", src: asset("card/7-yoe.png"), x: 895, y: 1357, w: 141, h: 153, lift: 4 },
];

export const CARD_BASE = asset("card/bg-image-green.webp");
/** Back side artwork (Figma node 521:2370, 1140 × 1600). */
export const CARD_BACK = asset("card/back.webp");
/**
 * Holographic laminate patterns. Only HOLO is shown; the others are kept for
 * later — point HOLO at one of them to switch.
 */
export const HOLO_PATTERNS = {
  /** Original: CRYPTO / DESIGN / FINTECH text pattern. Hidden for now. */
  text: asset("card/holographic-layer.png"),
  /** Current: atom / orbit symbols. */
  atoms: asset("card/holographic-layer-2.png"),
};
export const HOLO = HOLO_PATTERNS.atoms;
/** Laminate strength: 1 = full effect as first built, 0 = off. */
export const HOLO_STRENGTH = 0.2;
export const PAGE_BG = asset("website-bg.png");

/**
 * Tappable buttons on the back artwork (card px, top-left origin). Measured
 * from the yellow stickers in the export; they open in a new tab.
 */
export const BACK_LINKS = [
  { name: "Telegram", url: "https://t.me/r_youlife", x: 464, y: 1212, w: 468, h: 110 },
  { name: "LinkedIn", url: "https://www.linkedin.com/in/ruslan-iulaev/", x: 225, y: 1369, w: 441, h: 107 },
];

/**
 * The page is laid out like the Figma mockup: website-bg.png (1565 × 2866) is
 * the stage, at the same scale as the card, with the card centre 93px above
 * the stage centre.
 */
export const STAGE = { w: 1565, h: 2866, cardOffsetY: 93 };

/**
 * How far the card turns, and how much input it takes.
 * The card tilts toward the cursor / follows the phone, up to these angles.
 */
export const MOTION = {
  /** Max left/right turn, degrees (was 24, then 12). */
  maxYawDeg: 16,
  /**
   * Phone tilt left/right → card turn, as [phone degrees, card degrees] points.
   * Values in between are interpolated; past the last point the card stays at
   * its max. The cursor on desktop still maps linearly up to maxYawDeg.
   */
  yawCurve: [
    [0, 0],
    [5, 4],
    [10, 8],
    [15, 10],
    [20, 12],
    [25, 14],
    [30, 16],
  ] as [number, number][],
  /** Max up/down turn, degrees (was 18, then 9). */
  maxPitchDeg: 12,
  /** Phone tilt up/down (degrees) that produces the max up/down turn (linear). */
  gyroRangeDeg: 30,
  /** How quickly the card catches up with input. Higher = snappier. */
  smoothing: 6,
  /**
   * How much the coins and unicorn turn with the card (1 = fully, as one
   * scene; 0.5 = half, so they move half as far). Was 1.
   */
  extrasFollow: 0.5,
  /** Swipe distance, as a fraction of screen width, for a half turn (front → back). One swipe turns at most 180°. */
  swipeHalfTurn: 0.55,
};

export interface Extra {
  name: string;
  src: string;
  /** Where it appears in the mockup: centre relative to the card centre (px, y up) and plane width. */
  x: number;
  y: number;
  width: number;
  /**
   * Depth toward the viewer (negative = behind the card). Position and size are
   * compensated so it still lands on x/y/width. They turn with the card as
   * one scene, so their movement comes only from this real depth: bigger |z|
   * = more parallax. Draw order is fixed (behind stays behind, in front stays
   * in front), so the card can never visibly cross them, even mid-spin.
   */
  z: number;
  /** In-plane rotation, radians (counter-clockwise). */
  rotation: number;
  /** Depth-of-field blur (texture mip bias). 0 = sharp. */
  blur: number;
}

export const EXTRAS: Extra[] = [
  { name: "bitcoin", src: asset("extras/bitcoin.png"), x: -546, y: 834, width: 310, z: -300, rotation: 0, blur: 0 },
  { name: "chinese-coin", src: asset("extras/chinese-coin.png"), x: 566, y: -902, width: 362, z: 300, rotation: 0, blur: 0 },
  { name: "unicorn", src: asset("extras/unicorn.webp"), x: -346, y: -1291, width: 740, z: 500, rotation: 0.32, blur: 1.6 },
];

/** Card-px (top-left origin, y down) → local world coords (card centre origin, y up). */
export function toLocal(x: number, y: number, w: number, h: number) {
  return { cx: x + w / 2 - CARD.width / 2, cy: CARD.height / 2 - (y + h / 2) };
}
