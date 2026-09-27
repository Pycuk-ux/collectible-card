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
  bg: { src: asset("card/moving-inside-elements.png"), w: 1102, h: 1429, depth: 26, zoom: 1.05 },
  photo: { src: asset("card/my-photo.png"), w: 1102, h: 1421, depth: 12, zoom: 1.03 },
  /** Blended hard-light @ 30%, as in Figma. */
  scan: { src: asset("card/scan-effect.png"), w: 1102, h: 1416, depth: 4, zoom: 1.02 },
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
  { name: "name", src: asset("card/name.png"), x: 96, y: 53, w: 948, h: 71, lift: 6 },
  { name: "star", src: asset("card/star.png"), x: wx + 959, y: wy + 88, w: 64, h: 72, lift: 8 },
  { name: "upwork", src: asset("card/upwork.png"), x: wx + 855, y: wy + 90, w: 72, h: 72, lift: 8 },
  { name: "cod", src: asset("card/cod.png"), x: wx + 851, y: wy + 1028, w: 176, h: 64, lift: 5 },
  { name: "signature", src: asset("card/signature.png"), x: wx + 59, y: wy + 995, w: 384, h: 130, lift: 8 },
  { name: "uix-ui", src: asset("card/uix-ui.png"), x: wx + 60, y: wy + 1194, w: 393, h: 159, lift: 7 },
  // 7-yoe has a 4px outside stroke, so the PNG is 8px larger than the vector node.
  { name: "7-yoe", src: asset("card/7-yoe.png"), x: 895, y: 1357, w: 141, h: 153, lift: 7 },
];

export const CARD_BASE = asset("card/bg-image-green.webp");
export const HOLO = asset("card/holographic-layer.png");
export const PAGE_BG = asset("website-bg.png");

/**
 * The page is laid out like the Figma mockup: website-bg.png (1565 × 2866) is
 * the stage, at the same scale as the card, with the card centre 93px above
 * the stage centre.
 */
export const STAGE = { w: 1565, h: 2866, cardOffsetY: 93 };

export interface Extra {
  name: string;
  src: string;
  /** Where it appears in the mockup: centre relative to the card centre (px, y up) and plane width. */
  x: number;
  y: number;
  width: number;
  /** Depth toward the viewer (negative = behind the card). Position and size are compensated so it still lands on x/y/width. */
  z: number;
  /** In-plane rotation, radians (counter-clockwise). */
  rotation: number;
  /** Sideways drift with tilt/cursor, px. Larger for things closer to the viewer. */
  drift: number;
  /** Depth-of-field blur (texture mip bias). 0 = sharp. */
  blur: number;
}

export const EXTRAS: Extra[] = [
  { name: "bitcoin", src: asset("extras/bitcoin.png"), x: -546, y: 834, width: 310, z: -80, rotation: 0, drift: -30, blur: 0 },
  { name: "chinese-coin", src: asset("extras/chinese-coin.png"), x: 566, y: -902, width: 362, z: 140, rotation: 0, drift: 45, blur: 0 },
  { name: "unicorn", src: asset("extras/unicorn.webp"), x: -346, y: -1291, width: 740, z: 320, rotation: 0.32, drift: 80, blur: 1.6 },
];

/** Card-px (top-left origin, y down) → local world coords (card centre origin, y up). */
export function toLocal(x: number, y: number, w: number, h: number) {
  return { cx: x + w / 2 - CARD.width / 2, cy: CARD.height / 2 - (y + h / 2) };
}
