// GLSL for the card. All fragment shaders end with <colorspace_fragment> so
// they match MeshBasicMaterial output (sRGB textures are decoded on sample).

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * The dark "main-bg" window. Three layers are composited here so each one
 * can drift independently inside the torn-edge mask:
 *   moving-inside-elements (deepest) → my-photo → scan-effect (hard-light 30%)
 * The mask is the bg layer's alpha at rest, so drifting never leaks outside.
 */
export const windowShader = {
  vertexShader: VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D tBg;
    uniform sampler2D tPhoto;
    uniform sampler2D tScan;
    uniform vec2 uPlane;      // plane size, px (= bg PNG size)
    uniform vec2 uBgSize;
    uniform vec2 uPhotoSize;
    uniform vec2 uScanSize;
    uniform vec3 uDepth;      // drift px at full tilt: bg, photo, scan
    uniform vec3 uZoom;
    uniform vec2 uTilt;       // -1..1
    uniform vec3 uFill;
    varying vec2 vUv;

    // Position in px from plane centre (y up) → uv of a centred layer.
    vec2 layerUv(vec2 p, vec2 size, float zoom, float depth) {
      vec2 q = (p + uTilt * depth) / (size * zoom);
      return q + 0.5;
    }

    vec3 hardLight(vec3 b, vec3 s) {
      return mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, s));
    }

    void main() {
      vec2 p = (vUv - 0.5) * uPlane;

      float mask = texture2D(tBg, vUv).a;
      if (mask < 0.003) discard;

      vec4 bg = texture2D(tBg, layerUv(p, uBgSize, uZoom.x, uDepth.x));
      vec3 col = mix(uFill, bg.rgb, bg.a);

      vec4 ph = texture2D(tPhoto, layerUv(p, uPhotoSize, uZoom.y, uDepth.y));
      col = mix(col, ph.rgb, ph.a);

      vec4 sc = texture2D(tScan, layerUv(p, uScanSize, uZoom.z, uDepth.z));
      col = mix(col, hardLight(col, sc.rgb), sc.a * 0.3);

      gl_FragColor = vec4(col, mask);
      #include <colorspace_fragment>
    }
  `,
};

/**
 * Holographic laminate. Additive: a rainbow foil that slides with the tilt,
 * strongest on the printed pattern (holographic-layer.png alpha), plus a
 * diagonal gloss band and a soft glare that follows the light.
 */
export const holoShader = {
  vertexShader: VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D tPattern;
    uniform vec2 uTilt;
    uniform vec2 uSize;
    uniform float uRadius;
    uniform float uStrength;
    varying vec2 vUv;

    vec3 spectrum(float t) {
      return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
    }

    float roundedBox(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    }

    void main() {
      vec2 p = (vUv - 0.5) * uSize;
      if (roundedBox(p, uSize * 0.5, uRadius) > 0.0) discard;

      float pattern = texture2D(tPattern, vUv).a;
      vec2 t = uTilt;

      // Foil hue shifts along a diagonal and with the viewing angle.
      float phase = dot(vUv, vec2(0.9, 1.35)) * 1.6 + t.x * 0.9 - t.y * 0.7;
      vec3 foil = spectrum(phase);

      // Diagonal gloss band sweeping across as the card turns.
      float d = (vUv.x + vUv.y * 0.7) - (0.85 + t.x * 0.75 - t.y * 0.55);
      float band = exp(-d * d * 26.0);

      // Glare hotspot opposite to the tilt (where the light would bounce).
      vec2 g = vec2(0.5 - t.x * 0.55, 0.5 - t.y * 0.55);
      float glare = exp(-dot(vUv - g, (vUv - g) * vec2(1.0, 0.55)) * 16.0);

      float amount = length(t);
      // The printed pattern stays faint and flashes where the gloss band passes.
      float foilMask = pattern * (0.06 + 0.8 * band) + 0.05 * band;
      vec3 col = foil * foilMask * (0.3 + amount * 0.7);
      col += vec3(1.0, 0.98, 0.94) * glare * (0.02 + amount * 0.08);
      col *= uStrength;

      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }
  `,
};

/** Floating extras (coins, unicorn) with optional depth-of-field blur. */
export const extraShader = {
  vertexShader: VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D map;
    uniform float uBlur;
    varying vec2 vUv;
    void main() {
      vec4 c;
      if (uBlur <= 0.0) {
        c = texture2D(map, vUv);
      } else {
        // 3×3 taps of a blurred mip level read as a soft out-of-focus edge.
        c = vec4(0.0);
        vec2 px = vec2(0.004 * uBlur);
        for (int i = -1; i <= 1; i++)
          for (int j = -1; j <= 1; j++)
            c += texture2D(map, vUv + vec2(float(i), float(j)) * px, uBlur);
        c /= 9.0;
      }
      if (c.a < 0.002) discard;
      gl_FragColor = c;
      #include <colorspace_fragment>
    }
  `,
};
