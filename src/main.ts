import * as THREE from "three";
import "./card.css";
import { TiltInput } from "./input";
import {
  CARD,
  CARD_BASE,
  CARD_BACK,
  DECALS,
  EXTRAS,
  HOLO,
  HOLO_STRENGTH,
  MOTION,
  PAGE_BG,
  STAGE,
  WINDOW,
  WINDOW_LAYERS,
  toLocal,
} from "./layout";
import { extraShader, holoShader, windowShader } from "./shaders";

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const loaderEl = document.querySelector<HTMLElement>("#loader")!;
const motionBtn = document.querySelector<HTMLButtonElement>("#motion")!;

// ─── Renderer / camera ──────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x050603);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(26, 1, 10, 20000);
const maxAniso = renderer.capabilities.getMaxAnisotropy();

// ─── Assets ─────────────────────────────────────────────────────────────────

const manager = new THREE.LoadingManager();
manager.onProgress = (_url, loaded, total) => {
  loaderEl.style.setProperty("--p", String(loaded / total));
};
const loader = new THREE.TextureLoader(manager);

function load(url: string) {
  return loader.loadAsync(url).then((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  });
}

const [pageBgTex, baseTex, backTex, holoTex, bgTex, photoTex, scanTex, decalTexes, extraTexes] = await Promise.all([
  load(PAGE_BG),
  load(CARD_BASE),
  load(CARD_BACK),
  load(HOLO),
  load(WINDOW_LAYERS.bg.src),
  load(WINDOW_LAYERS.photo.src),
  load(WINDOW_LAYERS.scan.src),
  Promise.all(DECALS.map((d) => load(d.src))),
  Promise.all(EXTRAS.map((e) => load(e.src))),
]);

// ─── Card ───────────────────────────────────────────────────────────────────

const W = CARD.width;
const H = CARD.height;
const T = CARD.thickness;
const FRONT = T / 2;

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Flat rounded face whose UVs span the full card (ShapeGeometry uses raw xy). */
function faceGeometry() {
  const g = new THREE.ShapeGeometry(roundedRect(W, H, CARD.radius), 16);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / W + 0.5, pos.getY(i) / H + 0.5);
  return g;
}

// Draw order. Card layers skip the depth test and are stacked by renderOrder
// instead, so a thin 4px card never z-fights at steep angles; the face turned
// away from the camera is hidden each frame.
const ORDER = { pageBg: -10, behind: -1, body: 0, base: 1, window: 10, holo: 20, decals: 30, front: 100 };

const cardRoot = new THREE.Group(); // tilt
const card = new THREE.Group(); // flip
const frontFace = new THREE.Group();
const backFace = new THREE.Group();
card.add(frontFace, backFace);
cardRoot.add(card);
scene.add(cardRoot);

// Card stock: a 4px extrusion with a tiny bevel so the edge catches light.
{
  const bevel = 0.8;
  const geo = new THREE.ExtrudeGeometry(roundedRect(W - bevel * 2, H - bevel * 2, CARD.radius - bevel), {
    depth: T - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 16,
  });
  geo.translate(0, 0, -(T - bevel * 2) / 2);
  // Transparent pass (still fully opaque) so it draws after the coins behind it.
  const edge = new THREE.MeshStandardMaterial({ color: CARD.edgeColor, roughness: 0.35, metalness: 0.15, transparent: true });
  const body = new THREE.Mesh(geo, edge);
  body.renderOrder = ORDER.body;
  card.add(body);
}

const face = faceGeometry();
const layer = { depthTest: false, depthWrite: false } as const;

// Front print: the green glitch art (bg-image-green).
{
  const front = new THREE.Mesh(face, new THREE.MeshBasicMaterial({ map: baseTex, transparent: true, ...layer }));
  front.position.z = FRONT + 0.1;
  front.renderOrder = ORDER.base;
  frontFace.add(front);
}

// Window: moving-inside-elements + photo + scan, each drifting at its own depth.
const windowUniforms = {
  tBg: { value: bgTex },
  tPhoto: { value: photoTex },
  tScan: { value: scanTex },
  uPlane: { value: new THREE.Vector2(WINDOW_LAYERS.bg.w, WINDOW_LAYERS.bg.h) },
  uBgSize: { value: new THREE.Vector2(WINDOW_LAYERS.bg.w, WINDOW_LAYERS.bg.h) },
  uPhotoSize: { value: new THREE.Vector2(WINDOW_LAYERS.photo.w, WINDOW_LAYERS.photo.h) },
  uScanSize: { value: new THREE.Vector2(WINDOW_LAYERS.scan.w, WINDOW_LAYERS.scan.h) },
  uDepth: { value: new THREE.Vector3(WINDOW_LAYERS.bg.depth, WINDOW_LAYERS.photo.depth, WINDOW_LAYERS.scan.depth) },
  uZoom: { value: new THREE.Vector3(WINDOW_LAYERS.bg.zoom, WINDOW_LAYERS.photo.zoom, WINDOW_LAYERS.scan.zoom) },
  uTilt: { value: new THREE.Vector2() },
  uFill: { value: new THREE.Color("#000431") },
};
{
  const { cx, cy } = toLocal(WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h);
  const mat = new THREE.ShaderMaterial({ ...windowShader, uniforms: windowUniforms, transparent: true, ...layer });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(WINDOW_LAYERS.bg.w, WINDOW_LAYERS.bg.h), mat);
  mesh.position.set(cx, cy, FRONT + 0.2);
  mesh.renderOrder = ORDER.window;
  frontFace.add(mesh);
}

// Holographic laminate (front + back share uniforms).
const holoUniforms = {
  tPattern: { value: holoTex },
  uTilt: { value: new THREE.Vector2() },
  uSize: { value: new THREE.Vector2(W, H) },
  uRadius: { value: CARD.radius },
  uStrength: { value: HOLO_STRENGTH },
};
const holoMat = new THREE.ShaderMaterial({
  ...holoShader,
  uniforms: holoUniforms,
  transparent: true,
  blending: THREE.AdditiveBlending,
  ...layer,
});
{
  const holo = new THREE.Mesh(new THREE.PlaneGeometry(W, H), holoMat);
  holo.position.z = FRONT + 0.3;
  holo.renderOrder = ORDER.holo;
  frontFace.add(holo);
}

// Raised elements: a few px above the face, so they separate slightly on tilt.
DECALS.forEach((d, i) => {
  const { cx, cy } = toLocal(d.x, d.y, d.w, d.h);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(d.w, d.h),
    new THREE.MeshBasicMaterial({ map: decalTexes[i], transparent: true, ...layer }),
  );
  mesh.position.set(cx, cy, FRONT + d.lift);
  mesh.renderOrder = ORDER.decals + i;
  frontFace.add(mesh);
});

// Back of the card: the back artwork under the same holographic laminate as
// the front (shared material, so pattern, strength and tilt response match).
{
  const back = new THREE.Mesh(face, new THREE.MeshBasicMaterial({ map: backTex, transparent: true, ...layer }));
  back.rotation.y = Math.PI;
  back.position.z = -FRONT - 0.1;
  back.renderOrder = ORDER.base;
  const backHolo = new THREE.Mesh(new THREE.PlaneGeometry(W, H), holoMat);
  backHolo.rotation.y = Math.PI;
  backHolo.position.z = -FRONT - 0.3;
  backHolo.renderOrder = ORDER.holo;
  backFace.add(back, backHolo);
}

// ─── Page background ────────────────────────────────────────────────────────

const BG_Z = -1600;
const pageBg = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ map: pageBgTex, depthTest: false, depthWrite: false }),
);
pageBg.renderOrder = ORDER.pageBg;
scene.add(pageBg);

// ─── Coins and unicorn ──────────────────────────────────────────────────────

const extrasRoot = new THREE.Group();
scene.add(extrasRoot);
const extras = EXTRAS.map((e, i) => {
  const tex = extraTexes[i];
  const img = tex.image as { width: number; height: number };
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, img.height / img.width),
    new THREE.ShaderMaterial({
      ...extraShader,
      uniforms: { map: { value: tex }, uBlur: { value: e.blur } },
      transparent: true,
      depthWrite: false,
      // Fixed layering instead of depth testing: behind the card is always
      // covered by it, in front is always on top.
      depthTest: false,
    }),
  );
  mesh.rotation.z = e.rotation;
  mesh.renderOrder = e.z < 0 ? ORDER.behind : ORDER.front + i;
  // Tilts with the card (not the spin) by MOTION.extrasFollow, so card and
  // coins move as one physical arrangement with true perspective between them.
  extrasRoot.add(mesh);
  return { mesh, cfg: e };
});

// ─── Lights (only the extruded edge is lit) ─────────────────────────────────

scene.add(new THREE.AmbientLight(0xffffff, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
scene.add(key);

// ─── Layout ─────────────────────────────────────────────────────────────────

// The camera looks at the stage centre, which sits below the card centre.
const EYE_Y = -STAGE.cardOffsetY;

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;

  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  // Phones show the full stage width like the mockup; wide screens frame the
  // card with its coins and let the unicorn run off the bottom edge.
  const fitW = STAGE.w;
  const fitH = 2200;
  const dist = Math.max(fitH / 2 / tanHalf, fitW / 2 / tanHalf / camera.aspect);
  camera.position.set(0, EYE_Y, dist);
  camera.near = Math.max(10, dist * 0.3);
  camera.far = dist - BG_Z + 1000;
  camera.updateProjectionMatrix();

  // Anything at depth z is scaled by (dist - z) / dist so it lands on its
  // mockup position and size as seen from the camera.
  const k = (z: number) => (dist - z) / dist;

  // Background: the mockup stage, grown further if needed to cover the screen.
  const kb = k(BG_Z);
  const viewH = 2 * (dist - BG_Z) * tanHalf;
  const viewW = viewH * camera.aspect;
  const cover = Math.max(viewW / (STAGE.w * kb), viewH / (STAGE.h * kb), 1);
  pageBg.scale.set(STAGE.w * kb * cover, STAGE.h * kb * cover, 1);
  pageBg.position.set(0, EYE_Y, BG_Z);

  for (const ex of extras) {
    const ke = k(ex.cfg.z);
    ex.mesh.position.set(ex.cfg.x * ke, EYE_Y + (ex.cfg.y - EYE_Y) * ke, ex.cfg.z);
    ex.mesh.scale.setScalar(ex.cfg.width * ke);
  }
}
window.addEventListener("resize", resize);
resize();

// ─── Interaction ────────────────────────────────────────────────────────────

const input = new TiltInput(document.body, MOTION.gyroRangeDeg, MOTION.smoothing);

if (input.needsMotionPermission) {
  motionBtn.hidden = false;
  motionBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (await input.enableMotion()) motionBtn.hidden = true;
  });
} else if (matchMedia("(pointer: coarse)").matches) {
  void input.enableMotion();
}

// Swipe left or right to spin the card, like flicking a real one. It follows
// the finger while held, keeps the release speed, then settles on a face.
let flip = 0;
let flipTarget = 0;
let flipVel = 0;
let drag: { x: number; flip: number; lastX: number; lastT: number; vel: number } | null = null;
const radPerPx = () => Math.PI / (window.innerWidth * MOTION.swipeHalfTurn);

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, flip, lastX: e.clientX, lastT: performance.now(), vel: 0 };
  input.paused = true;
});
canvas.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const now = performance.now();
  const dtMs = Math.max(1, now - drag.lastT);
  const v = ((e.clientX - drag.lastX) * radPerPx() * 1000) / dtMs;
  drag.vel = drag.vel * 0.6 + v * 0.4;
  drag.lastX = e.clientX;
  drag.lastT = now;
  flip = drag.flip + (e.clientX - drag.x) * radPerPx();
});
function release() {
  if (!drag) return;
  const vel = performance.now() - drag.lastT > 80 ? 0 : drag.vel;
  // Where the spin would coast to, snapped to the nearest face (max one extra turn).
  const coast = flip + THREE.MathUtils.clamp(vel * 0.18, -Math.PI * 1.5, Math.PI * 1.5);
  flipTarget = Math.round(coast / Math.PI) * Math.PI;
  flipVel = vel;
  drag = null;
  input.paused = false;
}
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", release);

// ─── Loop ───────────────────────────────────────────────────────────────────

const MAX_YAW = THREE.MathUtils.degToRad(MOTION.maxYawDeg);
const MAX_PITCH = THREE.MathUtils.degToRad(MOTION.maxPitchDeg);
const timer = new THREE.Timer();
const normal = new THREE.Vector3();
const quat = new THREE.Quaternion();

renderer.setAnimationLoop((now) => {
  timer.update(now);
  const dt = Math.min(timer.getDelta(), 0.05);
  input.update(dt);
  const tilt = input.value;

  // Settle onto a face after a swipe.
  if (!drag) {
    flipVel += ((flipTarget - flip) * 60 - flipVel * 11) * dt;
    flip += flipVel * dt;
  }

  cardRoot.rotation.set(-tilt.y * MAX_PITCH, tilt.x * MAX_YAW, 0);
  extrasRoot.rotation.set(-tilt.y * MAX_PITCH * MOTION.extrasFollow, tilt.x * MAX_YAW * MOTION.extrasFollow, 0);
  card.rotation.y = flip;

  // Show only the face that points at the camera.
  normal.set(0, 0, 1).applyQuaternion(card.getWorldQuaternion(quat));
  const facingCamera = normal.dot(camera.position) > 0;
  frontFace.visible = facingCamera;
  backFace.visible = !facingCamera;

  windowUniforms.uTilt.value.set(tilt.x, tilt.y);
  // Viewed from the back the tilt reads mirrored.
  holoUniforms.uTilt.value.set(tilt.x * Math.cos(flip) + Math.sin(flip) * 0.8, tilt.y);


  key.position.set(tilt.x * -600 + 300, tilt.y * -600 + 500, 900);

  renderer.render(scene, camera);
});

loaderEl.classList.add("done");
