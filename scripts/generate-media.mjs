/**
 * Placeholder generator — five images, not twenty-two.
 *
 * The bottle is drawn in SVG and the page is mostly air, so the whole site
 * needs five photographs: three act atmospheres at 3:2 and two squares. Each
 * placeholder here is a real JPEG at exactly the path, pixel size and ratio of
 * the photograph that replaces it, so the real set is a file swap and nothing
 * else — no `src` string changes when the photographs arrive.
 *
 * Node has no image codec and this project is not gaining a dependency for a
 * build script, so the drawing happens on a canvas in the Chromium Playwright
 * already installs for the smoke suite, and `toDataURL("image/jpeg")` encodes.
 * Nothing ships to the browser because of this file.
 *
 * The studies follow the brief the real set is shot to: one light source, a
 * defocused subject, a plain seamless ground — cold and pale for act I, warm
 * sand for act II, near-black for act III. Grain is deterministic, so a rerun
 * produces identical bytes.
 *
 *   node scripts/generate-media.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "media");
mkdirSync(outDir, { recursive: true });

const LANDSCAPE = { w: 1536, h: 1024 };
const SQUARE = { w: 1024, h: 1024 };

/**
 * `ground` is the seamless background, `mass` the defocused subject
 * ([x, y, size] in 0–1 of the frame) in two tones, `light` the one source.
 * `particles` scatters fine dust through the beam — only t-02 asks for it.
 */
const slots = [
  /* act I — citrus peel and a cut leaf, cold bright daylight */
  { name: "n-01", ...LANDSCAPE, ground: "#E6ECEA", tones: ["#D9DDB4", "#B7C6A6"], mass: [0.5, 0.56, 0.5], light: [0.74, 0.18, "rgba(255,255,255,0.7)"], seed: 7 },
  /* act II — rose and jasmine petals, warm soft diffused light */
  { name: "n-02", ...LANDSCAPE, ground: "#E6D8C8", tones: ["#E2BFB2", "#F1E6D2"], mass: [0.48, 0.54, 0.54], light: [0.66, 0.24, "rgba(255,244,228,0.6)"], seed: 13 },
  /* act III — resin and dark wood grain, low warm side light */
  { name: "n-03", ...LANDSCAPE, ground: "#110D0A", tones: ["#5C3A1E", "#2E1E12"], mass: [0.52, 0.6, 0.5], light: [0.86, 0.5, "rgba(200,140,70,0.34)"], seed: 19 },
  /* the opening — one droplet on a smooth cold surface, cool light */
  { name: "t-01", ...SQUARE, ground: "#E8EEEE", tones: ["#CFDCDD", "#F6FAFA"], mass: [0.5, 0.52, 0.26], light: [0.7, 0.24, "rgba(255,255,255,0.8)"], seed: 23 },
  /* the object — fine dust in a warm low beam, near-black */
  { name: "t-02", ...SQUARE, ground: "#0F0B09", tones: ["#6E4522", "#2A1A0E"], mass: [0.5, 0.56, 0.44], light: [0.8, 0.62, "rgba(214,160,92,0.38)"], seed: 29, particles: 420 },
];

async function draw(page, slot) {
  return page.evaluate((slot) => {
    const canvas = document.createElement("canvas");
    canvas.width = slot.w;
    canvas.height = slot.h;
    const ctx = canvas.getContext("2d");
    const short = Math.min(slot.w, slot.h);

    /* 1 — the seamless ground. */
    ctx.fillStyle = slot.ground;
    ctx.fillRect(0, 0, slot.w, slot.h);

    /* 2 — the subject, out of focus: two soft masses, the second offset. */
    const [mx, my, msize] = slot.mass;
    const blob = (x, y, r, colour, alpha) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, colour);
      g.addColorStop(0.5, colour);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, slot.w, slot.h);
      ctx.globalAlpha = 1;
    };
    blob(slot.w * mx, slot.h * my, short * msize * 0.6, slot.tones[0], 0.75);
    blob(slot.w * (mx + 0.08), slot.h * (my - 0.07), short * msize * 0.34, slot.tones[1], 0.6);

    /* 3 — the one light source, long soft falloff. */
    const [lx, ly, lc] = slot.light;
    const light = ctx.createRadialGradient(slot.w * lx, slot.h * ly, 0, slot.w * lx, slot.h * ly, short * 1.1);
    light.addColorStop(0, lc);
    light.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, slot.w, slot.h);

    /* 4 — dust in the beam, if asked for. Deterministic LCG. */
    let state = (slot.seed * 2654435761) % 4294967296;
    const rand = () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
    for (let i = 0; i < (slot.particles ?? 0); i++) {
      const x = slot.w * (lx - 0.55 + rand() * 0.7);
      const y = slot.h * (ly - 0.3 + rand() * 0.5);
      ctx.globalAlpha = 0.15 + rand() * 0.35;
      ctx.fillStyle = "#E8C38E";
      ctx.beginPath();
      ctx.arc(x, y, 0.6 + rand() * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* 5 — fine grain, faint, so the JPEG stays small. */
    const image = ctx.getImageData(0, 0, slot.w, slot.h);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (rand() - 0.5) * 7;
      data[i] = Math.max(0, Math.min(255, data[i] + n));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
    ctx.putImageData(image, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.8);
  }, slot);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("about:blank");

let total = 0;
for (const slot of slots) {
  const bytes = Buffer.from((await draw(page, slot)).split(",")[1], "base64");
  writeFileSync(join(outDir, `${slot.name}.jpg`), bytes);
  total += bytes.length;
  console.log(`  ${slot.name}.jpg  ${slot.w}x${slot.h}  ${(bytes.length / 1024).toFixed(0)} KB`);
}
await browser.close();

console.log(`generated ${slots.length} placeholders → public/media/  (${(total / 1024).toFixed(0)} KB total)`);
