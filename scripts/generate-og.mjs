/**
 * Open Graph card generator.
 *
 * No social crawler renders an SVG `og:image`, so the share card is the one
 * raster the page itself draws. It is written with Node's own `zlib` rather
 * than an image library: the project has exactly three runtime dependencies,
 * and `sharp` to draw one 1200×630 card is a bad trade.
 *
 * The card is the object block: the bottle on the deep warm ground, its liquid
 * at the base note's amber, a low warm light behind it. It carries no type —
 * rendering Persian into a generated raster needs a shaping pipeline this
 * project does not have, and a Latin-only card for a Persian brand reads worse
 * than the bottle alone.
 *
 *   node scripts/generate-og.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "media");
mkdirSync(outDir, { recursive: true });

const W = 1200;
const H = 630;

/** Kept in sync with src/app/tokens.css. */
const GROUND = [0x1c, 0x17, 0x14];
const IRIS_SOFT = [0xb3, 0xa5, 0xdb];
const INK_INV = [0xf0, 0xe9, 0xe2];
const LIQUID_HEART = [0xe6, 0xc8, 0x92];
const LIQUID_BASE = [0x8a, 0x5a, 0x2b];

/* -------------------------------------------------------------------------- */
/*  PNG encoding                                                              */
/* -------------------------------------------------------------------------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** Truecolour 8-bit PNG, filter type 1 (Sub) on every row: smooth gradients
 *  become runs of near-zeroes, which deflate compresses very well. */
function encodePng(width, height, rgb) {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const src = y * stride;
    const dst = y * (stride + 1);
    raw[dst] = 1;
    for (let x = 0; x < stride; x++) {
      const left = x >= 3 ? rgb[src + x - 3] : 0;
      raw[dst + 1 + x] = (rgb[src + x] - left) & 0xff;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------------------- */
/*  The card                                                                  */
/* -------------------------------------------------------------------------- */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => a + (b - a) * t;

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function over(dst, colour, alpha) {
  if (alpha <= 0) return;
  for (let i = 0; i < 3; i++) dst[i] = mix(dst[i], colour[i], alpha);
}

/** Gaussian falloff — never reaches zero, so no contour ring at 8 bits. */
function glow(x, y, cx, cy, sigma) {
  return Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * sigma * sigma));
}

/** Signed distance to a rounded box. Negative inside. */
function box(x, y, cx, cy, hw, hh, r) {
  const qx = Math.abs(x - cx) - hw + r;
  const qy = Math.abs(y - cy) - hh + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

/** 4×4 Bayer dither: breaks 8-bit banding for a fraction of random grain's size. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/* The bottle, in card pixels: stopper, collar, neck, body. */
const CX = 600;
const shape = (x, y) =>
  Math.min(
    box(x, y, CX, 386, 96, 150, 34), // body 236–536
    box(x, y, CX, 214, 17, 26, 2), // neck
    box(x, y, CX, 184, 26, 10, 2), // collar
  );
const stopper = (x, y) => box(x, y, CX, 136, 32, 36, 6);
const bodyOnly = (x, y) => box(x, y, CX, 386, 96, 150, 34);
const SURFACE = 318;

const rgb = Buffer.alloc(W * H * 3);
const px = [0, 0, 0];

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    px[0] = GROUND[0];
    px[1] = GROUND[1];
    px[2] = GROUND[2];

    // Low warm light behind the bottle, a cooler trace high on the right.
    over(px, LIQUID_BASE, glow(x, y, CX, 430, 260) * 0.42);
    over(px, IRIS_SOFT, glow(x, y, 1040, 40, 300) * 0.08);

    const d = shape(x, y);

    // Glass: the faintest fill, so the silhouette reads as a volume.
    over(px, INK_INV, (1 - smoothstep(-0.75, 0.75, d)) * 0.06);

    // Liquid: inside the body, below a shallow meniscus, amber deepening down.
    const meniscus = SURFACE - 8 * (1 - ((x - CX) / 96) ** 2);
    if (bodyOnly(x, y) < 0.75 && y > meniscus - 1) {
      const inside = (1 - smoothstep(-0.75, 0.75, bodyOnly(x, y))) * smoothstep(meniscus - 1, meniscus + 1, y);
      const depth = clamp01((y - SURFACE) / 210);
      over(px, [mix(LIQUID_HEART[0], LIQUID_BASE[0], depth), mix(LIQUID_HEART[1], LIQUID_BASE[1], depth), mix(LIQUID_HEART[2], LIQUID_BASE[2], depth)], inside * 0.92);
    }

    // Outline, then the solid stopper.
    over(px, IRIS_SOFT, 1 - smoothstep(0.6, 1.9, Math.abs(d)));
    over(px, IRIS_SOFT, 1 - smoothstep(-0.75, 0.75, stopper(x, y)));

    // A glint down the body's left side.
    if (y > 270 && y < 500) over(px, [255, 255, 255], (1 - smoothstep(0.4, 1.6, Math.abs(x - 530))) * 0.35);

    // Vignette.
    const t = Math.hypot(x / W - 0.5, y / H - 0.55) / 0.75;
    over(px, [0, 0, 0], 0.35 * smoothstep(0.35, 1.1, t));

    const dither = (BAYER[y & 3][x & 3] / 16 - 0.5) * 1.6;
    const o = (y * W + x) * 3;
    rgb[o] = clamp01((px[0] + dither) / 255) * 255;
    rgb[o + 1] = clamp01((px[1] + dither) / 255) * 255;
    rgb[o + 2] = clamp01((px[2] + dither) / 255) * 255;
  }
}

const png = encodePng(W, H, rgb);
writeFileSync(join(outDir, "og-card.png"), png);
console.log(`generated og-card.png  ${W}×${H}  ${(png.length / 1024).toFixed(0)} KB → public/media/`);
