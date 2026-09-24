/**
 * SHAMIM — the one verification pass.
 *
 * Serves the real static export under the deployed base path, drives Chromium,
 * and prints numbers. It never saves or shows an image: where a pixel is needed
 * (contrast against the *composited* background) the viewport is captured into
 * memory, decoded into a canvas inside the page, sampled, and discarded.
 *
 *   npm run build:pages && npm run verify
 *
 * What it measures, keyed to §13 of the build prompt:
 *   1  HTTP status and console errors for / and /404
 *   2  scrollWidth vs clientWidth at 390 and 1440
 *   3  contrast of every visible text node, worst pixel under it, at 0/25/50/75/100%
 *   4  native scroll intact: overflow, preventDefault, passive listeners, scrollTo
 *   5  JavaScript off: every sentence in the served HTML, visible-text parity
 *   6  reduced-motion parity
 *   7  letter-spacing normal on every Persian text node
 *   8  no will-change on anything taller than the viewport
 *   9  the bottle is sticky, in its band, aria-hidden, holds nothing focusable
 *   10 focus order, focus visibility, focus-ring contrast
 *   11 display: contents never measured (text is measured by Range, not by box)
 *   12 the copyright year is ۲۰۲۶
 *   13 the optional clip, if it shipped
 *   14 weights, from the Performance API
 *   +  glyph coverage from the served font files, and the fonts that actually rendered
 *   +  token contrast re-read from the shipped stylesheet
 *   +  leftover template names in the build, and the dependency count
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { createServer } from "node:net";
import { chromium } from "@playwright/test";
import { glyphChecker } from "./lib/font-cmap.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");
// A free port from the OS: sibling builds keep their own servers running.
const PORT = await new Promise((resolve) => {
  const probe = createServer().listen(0, () => {
    const { port } = probe.address();
    probe.close(() => resolve(port));
  });
});
const BASE = "/shamim";
const ORIGIN = `http://localhost:${PORT}`;
const HOME = `${ORIGIN}${BASE}/`;
const WIDTHS = [
  { name: "390", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: "1440", viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
];
const POSITIONS = [0, 0.25, 0.5, 0.75, 1];

if (!existsSync(join(OUT, "index.html"))) {
  console.error("No export in out/. Run `npm run build:pages` first.");
  process.exit(1);
}

const failures = [];
const fail = (msg) => failures.push(msg);
const line = (label, value) => console.log(`  ${label.padEnd(46)} ${value}`);
const head = (title) => console.log(`\n${title}\n${"─".repeat(78)}`);

/* -------------------------------------------------------------------------- */
/*  Colour maths — WCAG 2.x relative luminance                                */
/* -------------------------------------------------------------------------- */

const lin = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hexRgb = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length <= 4 ? [...h].map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

/* -------------------------------------------------------------------------- */
/*  Content — the sentences that must be in the served HTML                   */
/* -------------------------------------------------------------------------- */

const content = await import(pathToFileURL(join(ROOT, "src/content/page.ts")).href);
const siteModule = await import(pathToFileURL(join(ROOT, "src/content/site.ts")).href);
const sentences = [
  siteModule.site.brand.name,
  content.opening.line,
  ...content.acts.flatMap((a) => [a.name, ...a.notes, a.sentence]),
  content.object.name,
  ...content.object.coda,
  content.coda.heading,
  content.coda.sentence,
  content.coda.phoneLabel,
  content.coda.whatsappLabel,
];

/* -------------------------------------------------------------------------- */
/*  Server                                                                    */
/* -------------------------------------------------------------------------- */

const server = spawn(process.execPath, [join(ROOT, "scripts/serve-static.mjs"), "--port", String(PORT), "--base", "shamim"], {
  stdio: ["ignore", "pipe", "inherit"],
});
await new Promise((resolve, reject) => {
  server.stdout.on("data", (d) => String(d).includes("serving") && resolve());
  server.on("exit", (code) => reject(new Error(`server exited ${code}`)));
});

const browser = await chromium.launch();

/* -------------------------------------------------------------------------- */
/*  In-page probes. Serialised into the page, so they reference nothing       */
/*  outside themselves.                                                       */
/* -------------------------------------------------------------------------- */

/** Records every listener registration before any page script runs. */
const INSTRUMENT = () => {
  const original = EventTarget.prototype.addEventListener;
  window.__listeners = [];
  EventTarget.prototype.addEventListener = function (type, fn, options) {
    const passive = typeof options === "object" && options !== null ? options.passive : undefined;
    const target = this === window ? "window" : this === document ? "document" : this.nodeName || "other";
    window.__listeners.push({ type, passive, target });
    return original.call(this, type, fn, options);
  };
};

/** Every visible text node, grouped by its element, with its on-screen rects.
 *  Measured with Range.getClientRects on the text itself — never with an
 *  element's box, so a `display: contents` wrapper can never be measured. */
function probeTexts() {
  const PERSIAN = /[؀-ۿ]/;
  const byEl = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.data.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest("script, style, noscript, .sr-only")) continue;
    const skip = el.closest(".skip-link");
    if (skip && document.activeElement !== skip) continue;
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const rects = [];
    for (const r of range.getClientRects()) {
      const x0 = Math.max(0, Math.floor(r.left));
      const y0 = Math.max(0, Math.floor(r.top));
      const x1 = Math.min(innerWidth, Math.ceil(r.right));
      const y1 = Math.min(innerHeight, Math.ceil(r.bottom));
      if (x1 - x0 >= 2 && y1 - y0 >= 2) rects.push([x0, y0, x1, y1]);
    }
    if (!rects.length) continue;
    let entry = byEl.get(el);
    if (!entry) {
      const cs = getComputedStyle(el);
      let alpha = 1;
      for (let a = el; a; a = a.parentElement) alpha *= parseFloat(getComputedStyle(a).opacity);
      const cls = el.classList.length ? `.${[...el.classList].join(".")}` : "";
      entry = { sel: `${el.tagName.toLowerCase()}${cls}`, text: "", color: cs.color, size: parseFloat(cs.fontSize), alpha, bg: cs.backgroundColor, rects: [], persian: false };
      byEl.set(el, entry);
    }
    entry.text += `${n.data.trim()} `;
    entry.rects.push(...rects);
    if (PERSIAN.test(n.data)) entry.persian = true;
  }
  return [...byEl.values()];
}

/** Decodes a viewport capture in a canvas and finds, for each text item, the
 *  pixel under it against which its colour has the lowest contrast. */
async function probeWorst({ b64, items, extra }) {
  const img = new Image();
  img.src = `data:image/png;base64,${b64}`;
  await img.decode();
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const { data, width } = ctx.getImageData(0, 0, img.width, img.height);
  const LIN = new Float64Array(256);
  for (let c = 0; c < 256; c++) {
    const s = c / 255;
    LIN[c] = s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }
  const lumOf = (r, g, b) => 0.2126 * LIN[Math.round(r)] + 0.7152 * LIN[Math.round(g)] + 0.0722 * LIN[Math.round(b)];
  const parse = (css) => {
    const m = css.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p[3] ?? 1];
  };
  const measure = (colour, alpha, rects) => {
    const c = parse(colour);
    if (!c) return { worst: null, px: null };
    const a = c[3] * alpha;
    let worst = Infinity;
    let px = null;
    for (const [x0, y0, x1, y1] of rects) {
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          const br = data[i];
          const bg = data[i + 1];
          const bb = data[i + 2];
          const lb = lumOf(br, bg, bb);
          const lf = lumOf(c[0] * a + br * (1 - a), c[1] * a + bg * (1 - a), c[2] * a + bb * (1 - a));
          const cr = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
          if (cr < worst) {
            worst = cr;
            px = [br, bg, bb];
          }
        }
      }
    }
    return { worst, px };
  };
  return {
    items: items.map((it) => measure(it.color, it.alpha, it.rects)),
    extra: extra ? measure(extra.color, 1, extra.rects) : null,
  };
}

const HIDE_TEXT = `*, *::before, *::after {
  color: transparent !important; -webkit-text-fill-color: transparent !important;
  text-decoration-color: transparent !important; text-shadow: none !important;
  caret-color: transparent !important; outline-color: transparent !important; }`;

async function settle(page) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(120);
}

async function capture(page) {
  const buf = await page.screenshot({ type: "png", caret: "hide", scale: "css", animations: "allow" });
  return buf.toString("base64");
}

async function walkPage(page) {
  await page.evaluate(async () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    for (let y = 0; y <= max + 400; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : i.decode().catch(() => null)))));
}

/** Token → threshold. The thresholds are §7's; iris-bright is display-only. */
function thresholdFor(item, tokens) {
  const m = item.color.match(/rgba?\(([^)]+)\)/);
  const key = m ? m[1].split(/[\s,/]+/).slice(0, 3).map(Number).join(",") : item.color;
  const token = tokens[key] ?? "unmapped";
  if (token === "ink" || token === "ink-inv") return { token, min: 12 };
  if (token === "muted" || token === "muted-inv") return { token, min: 6.5 };
  if (token === "iris" || token === "iris-soft") return { token, min: 5.5 };
  if (token === "iris-bright") return { token, min: 4.5, displayOnly: true };
  return { token, min: 4.5 };
}

/* -------------------------------------------------------------------------- */
/*  Run                                                                       */
/* -------------------------------------------------------------------------- */

const results = {};

for (const width of WIDTHS) {
  const r = (results[width.name] = {});
  const context = await browser.newContext({ ...width, deviceScaleFactor: 1 });
  await context.addInitScript(INSTRUMENT);
  const page = await context.newPage();
  const consoleErrors = [];
  const failed = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(e.message));
  page.on("response", (res) => res.status() >= 400 && failed.push(`${res.status()} ${res.url()}`));

  /* 1 — status */
  const response = await page.goto(HOME, { waitUntil: "networkidle" });
  r.status = response.status();

  /* 14 — first-load transfer, before anything scrolls */
  r.firstLoad = await page.evaluate(() => {
    const entries = performance.getEntriesByType("resource");
    const nav = performance.getEntriesByType("navigation")[0];
    const sum = (list) => list.reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0);
    return {
      total: sum(entries) + (nav?.transferSize ?? 0),
      images: sum(entries.filter((e) => e.initiatorType === "img")),
      imageCount: entries.filter((e) => e.initiatorType === "img").length,
      video: sum(entries.filter((e) => e.initiatorType === "video" || /\.mp4/.test(e.name))),
    };
  });

  /* tokens, as the browser resolved them */
  const tokens = await page.evaluate(() => {
    const names = ["ink", "ink-inv", "muted", "muted-inv", "iris", "iris-soft", "iris-bright", "ground-open", "ground-heart", "ground-base", "liquid-open", "liquid-heart", "liquid-base"];
    const probe = document.createElement("span");
    document.body.append(probe);
    const map = {};
    for (const name of names) {
      probe.style.color = `var(--${name})`;
      const m = getComputedStyle(probe).color.match(/rgba?\(([^)]+)\)/);
      if (m) map[m[1].split(/[\s,/]+/).slice(0, 3).map(Number).join(",")] = name;
    }
    probe.remove();
    return map;
  });

  await walkPage(page);

  /* 2 — horizontal overflow */
  r.overflow = await page.evaluate(() => ({
    bodyScroll: document.body.scrollWidth,
    bodyClient: document.body.clientWidth,
    docScroll: document.documentElement.scrollWidth,
    docClient: document.documentElement.clientWidth,
  }));

  /* 4 — native scroll */
  r.native = await page.evaluate(async () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const exact = [];
    for (const n of [1, 777, 2345, max - 3]) {
      window.scrollTo(0, n);
      exact.push({ n, got: window.scrollY });
    }
    window.scrollTo(0, 0);
    const listeners = window.__listeners.filter((l) => ["scroll", "wheel", "touchstart", "touchmove", "keydown"].includes(l.type));
    return {
      htmlOverflow: getComputedStyle(document.documentElement).overflow,
      bodyOverflow: getComputedStyle(document.body).overflow,
      exact,
      listeners,
    };
  });

  /* Real input, with a last-in-line window listener reading defaultPrevented. */
  await page.evaluate(() => {
    window.__prevented = [];
    for (const type of ["wheel", "keydown", "touchstart", "touchmove"]) {
      window.addEventListener(type, (e) => window.__prevented.push({ type, prevented: e.defaultPrevented }), { passive: true });
    }
    document.activeElement?.blur();
  });
  const scrollY = () => page.evaluate(() => window.scrollY);
  const input = [];
  await page.mouse.move(width.viewport.width / 2, width.viewport.height / 2);
  let before = await scrollY();
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(400);
  input.push({ how: "wheel 400", moved: (await scrollY()) - before });
  for (const key of ["PageDown", "ArrowDown", "Space"]) {
    before = await scrollY();
    await page.keyboard.press(key);
    await page.waitForTimeout(500);
    input.push({ how: key, moved: (await scrollY()) - before });
  }
  if (width.hasTouch) {
    const cdp = await context.newCDPSession(page);
    before = await scrollY();
    const x = 200;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: 650 }] });
    for (let y = 630; y >= 250; y -= 20) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(600);
    input.push({ how: "touch drag 400", moved: (await scrollY()) - before });
  }
  r.input = input;
  r.prevented = await page.evaluate(() => window.__prevented.filter((p) => p.prevented).length);
  r.inputEvents = await page.evaluate(() => window.__prevented.length);

  /* 3 + 9 — contrast, sticky, liquid at five positions */
  r.positions = [];
  for (const p of POSITIONS) {
    const y = await page.evaluate((p) => {
      const max = document.body.scrollHeight - innerHeight;
      const y = Math.round(p * max);
      window.scrollTo(0, y);
      return y;
    }, p);
    await settle(page);
    const state = await page.evaluate(() => {
      const bottle = document.querySelector("[data-bottle]");
      const b = bottle.getBoundingClientRect();
      const liquid = getComputedStyle(document.querySelector(".bottle__liquid")).fill;
      const numerals = [...document.querySelectorAll(".act__numeral")].map((n) => {
        const r = n.getBoundingClientRect();
        return { top: r.top, visible: r.bottom > 0 && r.top < innerHeight, position: getComputedStyle(n).position, size: parseFloat(getComputedStyle(n).fontSize) };
      });
      return {
        bottle: { top: b.top, bottom: b.bottom, left: b.left, right: b.right, height: b.height, position: getComputedStyle(bottle).position },
        expectedTop: innerHeight / 2 - b.height / 2,
        liquid,
        numerals,
      };
    });
    const items = await page.evaluate(probeTexts);
    const style = await page.addStyleTag({ content: HIDE_TEXT });
    await settle(page);
    const b64 = await capture(page);
    await style.evaluate((el) => el.remove());
    const measured = await page.evaluate(probeWorst, { b64, items });
    const b = state.bottle;
    const overBottle = items.filter((it) => it.rects.some(([x0, y0, x1, y1]) => x0 < b.right && x1 > b.left && y0 < b.bottom && y1 > b.top));
    const rows = items.map((it, i) => ({ ...it, ...measured.items[i], ...thresholdFor(it, tokens) }));
    r.positions.push({ p, y, state, rows, overBottle: overBottle.map((o) => o.sel) });
  }

  /* 6 — how many reveals reached rest over the normal descent */
  r.revealTotal = await page.evaluate(() => document.querySelectorAll("[data-reveal]").length);
  // Each reveal at its own reading position — centred, or as near as the page
  // allows. A finished translateY→none interpolation computes to the identity
  // matrix and blur(0px), so those count as rest; opacity is never touched.
  r.revealSettledAtEnd = await page.evaluate(async () => {
    const REST_T = new Set(["none", "matrix(1, 0, 0, 1, 0, 0)"]);
    const REST_F = new Set(["none", "blur(0px)"]);
    const unsettled = [];
    for (const el of document.querySelectorAll("[data-reveal]")) {
      el.scrollIntoView({ block: "center", behavior: "instant" });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const cs = getComputedStyle(el);
      if (!(REST_T.has(cs.transform) && REST_F.has(cs.filter) && cs.opacity === "1")) {
        unsettled.push(`${el.tagName.toLowerCase()}.${el.className} ${cs.transform} ${cs.filter}`);
      }
    }
    window.scrollTo(0, 0);
    return { count: document.querySelectorAll("[data-reveal]").length - unsettled.length, unsettled };
  });
  r.innerText = await page.evaluate(() => document.body.innerText.length);

  /* 7, 8, 9, 11, 12 — static structure */
  r.structure = await page.evaluate(() => {
    const PERSIAN = /[؀-ۿ]/;
    const spacing = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let persianNodes = 0;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!PERSIAN.test(n.data)) continue;
      persianNodes++;
      const el = n.parentElement;
      const ls = getComputedStyle(el).letterSpacing;
      if (ls !== "normal") spacing.push(`${el.tagName.toLowerCase()}.${[...el.classList].join(".")} = ${ls}`);
    }
    const all = [...document.querySelectorAll("*")];
    const willChange = all
      .filter((el) => getComputedStyle(el).willChange !== "auto")
      .map((el) => ({ sel: `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`, h: el.getBoundingClientRect().height, value: getComputedStyle(el).willChange }));
    const svg = document.querySelector("[data-bottle] svg");
    const footer = document.querySelector("footer").innerText;
    return {
      persianNodes,
      spacing,
      willChange,
      tallWillChange: willChange.filter((w) => w.h > innerHeight),
      svgHidden: !!svg.closest('[aria-hidden="true"]'),
      svgFocusable: document.querySelectorAll("svg a, svg button, svg [tabindex]").length,
      displayContents: all.filter((el) => getComputedStyle(el).display === "contents").length,
      year: footer.includes("۲۰۲۶") && !footer.includes("۲٬۰۲۶"),
      footer: footer.replace(/\s+/g, " ").trim(),
      liquidAsTextBg: all.filter((el) => {
        if (![...el.childNodes].some((c) => c.nodeType === 3 && c.data.trim())) return false;
        const bg = getComputedStyle(el).backgroundColor;
        return ["rgb(215, 228, 222)", "rgb(230, 200, 146)", "rgb(138, 90, 43)"].includes(bg);
      }).length,
      video: document.querySelectorAll("video").length,
    };
  });

  /* 14 — image weight after the full descent */
  r.weights = await page.evaluate(() => {
    const imgs = performance.getEntriesByType("resource").filter((e) => e.initiatorType === "img");
    return { count: imgs.length, bytes: imgs.reduce((s, e) => s + (e.encodedBodySize || 0), 0), list: imgs.map((e) => `${e.name.split("/").pop()} ${(e.encodedBodySize / 1024).toFixed(0)}KB`) };
  });

  /* 10 — focus */
  await page.goto(HOME, { waitUntil: "networkidle" });
  await walkPage(page);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.activeElement?.blur();
  });
  const focus = [];
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press("Tab");
    await settle(page);
    const f = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const ground = el.closest(".on-dark") ? "base" : el.closest(".act[data-tier='heart']") ? "heart" : "open";
      return {
        sel: `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`,
        text: el.textContent.trim().slice(0, 24),
        w: r.width,
        h: r.height,
        inView: r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth,
        outline: cs.outlineColor,
        outlineWidth: parseFloat(cs.outlineWidth),
        offset: parseFloat(cs.outlineOffset),
        style: cs.outlineStyle,
        ground,
        rect: [r.left, r.top, r.right, r.bottom],
      };
    });
    if (!f || (focus.length && f.sel === focus[0].sel && f.text === focus[0].text)) break;
    // The ring's backdrop: capture with the ring hidden, sample the band it paints in.
    const style = await page.addStyleTag({ content: HIDE_TEXT });
    const b64 = await capture(page);
    await style.evaluate((el) => el.remove());
    const [l, t, rr, bb] = f.rect;
    const o = f.offset;
    const wdt = f.outlineWidth;
    const band = [
      [l - o - wdt, t - o - wdt, rr + o + wdt, t - o],
      [l - o - wdt, bb + o, rr + o + wdt, bb + o + wdt],
      [l - o - wdt, t - o, l - o, bb + o],
      [rr + o, t - o, rr + o + wdt, bb + o],
    ].map(([x0, y0, x1, y1]) => [Math.max(0, Math.floor(x0)), Math.max(0, Math.floor(y0)), Math.min(width.viewport.width, Math.ceil(x1)), Math.min(width.viewport.height, Math.ceil(y1))]).filter(([x0, y0, x1, y1]) => x1 > x0 && y1 > y0);
    const ring = await page.evaluate(probeWorst, { b64, items: [], extra: { color: f.outline, rects: band } });
    focus.push({ ...f, ringWorst: ring.extra.worst });
  }
  r.focus = focus;

  r.consoleErrors = [...consoleErrors];
  r.failed = [...failed];

  /* 1 — /404. Its own document 404 is the point; anything else is a defect. */
  consoleErrors.length = 0;
  failed.length = 0;
  const miss = await page.goto(`${HOME}no-such-page/`, { waitUntil: "networkidle" });
  r.notFoundStatus = miss.status();
  const own = (s) => s.includes("/no-such-page/") || /status of 404/.test(s);
  r.notFoundErrors = [...consoleErrors, ...failed].filter((s) => !own(s));
  r.notFoundH1 = await page.locator("h1").textContent();
  const direct = await page.request.get(`${HOME}404.html`);
  r.notFoundDirect = direct.status();
  await context.close();

  /* 5 — JavaScript disabled */
  const noJs = await browser.newContext({ ...width, deviceScaleFactor: 1, javaScriptEnabled: false });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(HOME, { waitUntil: "load" });
  r.noJsText = await noJsPage.evaluate(() => document.body.innerText.length);
  r.noJsHidden = await noJsPage.evaluate(() => [...document.querySelectorAll("[data-reveal]")].filter((el) => !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })).length);
  await noJs.close();

  /* 6 — reduced motion */
  const reduced = await browser.newContext({ ...width, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const rmPage = await reduced.newPage();
  await rmPage.goto(HOME, { waitUntil: "networkidle" });
  await walkPage(rmPage);
  const rmLiquid = [];
  for (const p of POSITIONS) {
    await rmPage.evaluate((p) => window.scrollTo(0, Math.round(p * (document.body.scrollHeight - innerHeight))), p);
    await settle(rmPage);
    rmLiquid.push(await rmPage.evaluate(() => getComputedStyle(document.querySelector(".bottle__liquid")).fill));
  }
  r.reduced = await rmPage.evaluate(() => {
    const reveals = [...document.querySelectorAll("[data-reveal]")];
    const at = (el) => getComputedStyle(el);
    return {
      total: reveals.length,
      atRest: reveals.filter((el) => at(el).opacity === "1" && at(el).transform === "none" && at(el).filter === "none").length,
      animations: document.getAnimations().length,
      innerText: document.body.innerText.length,
      bottlePosition: getComputedStyle(document.querySelector("[data-bottle]")).position,
    };
  });
  r.reduced.liquid = [...new Set(rmLiquid)];
  await reduced.close();
}

/* -------------------------------------------------------------------------- */
/*  Fonts: the faces that resolve at runtime, checked against their own files */
/* -------------------------------------------------------------------------- */

const cssFiles = [];
const walkDir = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkDir(full);
    else cssFiles.push(full);
  }
};
walkDir(OUT);
const cssSheets = cssFiles.filter((f) => f.endsWith(".css")).map((f) => ({ file: f, text: readFileSync(f, "utf8") }));
const builtCss = cssSheets.map((c) => c.text).join("\n");

// next/font also emits metric-matched "… Fallback" faces with src: local(); those have no file to check.
const faces = cssSheets
  .flatMap((sheet) => [...sheet.text.matchAll(/@font-face\s*{([^}]+)}/g)].map((m) => ({ sheet: sheet.file, body: m[1] })))
  .filter((f) => /url\(/.test(f.body))
  .map(({ sheet, body }) => {
  const ranges = (body.match(/unicode-range:\s*([^;]+)/)?.[1] ?? "U+0-10FFFF").split(",").map((s) => {
    const t = s.trim().replace(/^U\+/i, "");
    if (t.includes("?")) return [parseInt(t.replace(/\?/g, "0"), 16), parseInt(t.replace(/\?/g, "F"), 16)];
    const [a, b] = t.split("-");
    return [parseInt(a, 16), parseInt(b ?? a, 16)];
  });
  return {
    family: body.match(/font-family:\s*([^;]+)/)[1].replace(/["']/g, "").trim(),
    weight: body.match(/font-weight:\s*([^;]+)/)?.[1].trim() ?? "400",
    // Relative to the stylesheet that declares it, as the browser resolves it.
    file: join(dirname(sheet), body.match(/url\(([^)]+)\)/)[1].replace(/["']/g, "")),
    ranges,
  };
});

const fontContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const fontPage = await fontContext.newPage();
await fontPage.goto(HOME, { waitUntil: "networkidle" });
await walkPage(fontPage);
const resolved = await fontPage.evaluate(async () => {
  await document.fonts.ready;
  const first = (sel) => getComputedStyle(document.querySelector(sel)).fontFamily.split(",")[0].replace(/["']/g, "").trim();
  const display = first(".opening__mark");
  const body = first(".act__sentence");
  const faces = [...document.fonts].map((f) => ({ family: f.family.replace(/["']/g, ""), status: f.status, weight: f.weight, range: f.unicodeRange }));
  const zwnj = (family) => {
    const a = document.createElement("span");
    const b = document.createElement("span");
    for (const s of [a, b]) {
      s.style.cssText = `font-family:"${family}";font-size:80px;position:absolute;white-space:pre`;
      document.body.append(s);
    }
    a.textContent = "ه";
    b.textContent = "ه‌";
    const diff = b.getBoundingClientRect().width - a.getBoundingClientRect().width;
    a.remove();
    b.remove();
    return diff;
  };
  return { display, body, faces, zwnjDisplay: zwnj(display), zwnjBody: zwnj(body) };
});

/* Which fonts actually painted each text node — Chromium's own answer. */
const cdp = await fontContext.newCDPSession(fontPage);
await cdp.send("DOM.enable");
await cdp.send("CSS.enable");
const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
const rendered = {};
for (const selector of [".opening__mark", ".opening__line", ".act__numeral", ".act__name", ".act__notes li", ".act__sentence", ".object__name", ".object__coda span", ".coda__heading", ".coda__sentence", ".coda__link", ".footer p", ".masthead__mark", ".masthead__link"]) {
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector });
  for (const nodeId of nodeIds) {
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    for (const f of fonts) {
      const key = `${selector} → ${f.familyName}${f.isCustomFont ? "" : " (SYSTEM)"}`;
      rendered[key] = (rendered[key] ?? 0) + f.glyphCount;
    }
  }
}
await fontContext.close();

const GLYPHS = [..."پچژگکیه", "‌", ..."۰۱۲۳۴۵۶۷۸۹"];
const glyphReport = {};
const checkers = new Map();
for (const family of [resolved.display, resolved.body]) {
  const missing = [];
  for (const ch of GLYPHS) {
    const cp = ch.codePointAt(0);
    const covering = faces.filter((f) => f.family === family && f.ranges.some(([a, b]) => cp >= a && cp <= b));
    let found = false;
    for (const face of covering) {
      const file = face.file;
      if (!checkers.has(file)) checkers.set(file, glyphChecker(readFileSync(file)));
      if (checkers.get(file)(cp)) found = true;
    }
    if (!found) missing.push(cp === 0x200c ? "ZWNJ" : ch);
  }
  glyphReport[family] = { faces: faces.filter((f) => f.family === family).length, missing };
}

/* -------------------------------------------------------------------------- */
/*  Static checks on the build                                                */
/* -------------------------------------------------------------------------- */

const tokenValues = Object.fromEntries([...builtCss.matchAll(/--(ground-open|ground-heart|ground-base|ink|ink-inv|muted|muted-inv|iris|iris-soft|iris-bright):\s*(#[0-9a-fA-F]{3,8})\b/g)].map((m) => [m[1], m[2]]));
const PAIRS = [
  ["ink", "ground-open", 12], ["ink", "ground-heart", 12], ["ink-inv", "ground-base", 12],
  ["muted", "ground-open", 6.5], ["muted", "ground-heart", 6.5], ["muted-inv", "ground-base", 6.5],
  ["iris", "ground-open", 5.5], ["iris", "ground-heart", 5.5], ["iris-soft", "ground-base", 5.5],
  ["iris-bright", "ground-open", 4.5], ["iris-bright", "ground-heart", 4.5],
];

const jsFiles = cssFiles.filter((f) => f.endsWith(".js"));
let preventHits = 0;
const preventContext = [];
for (const file of jsFiles) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/preventDefault/g)) {
    const window = src.slice(Math.max(0, m.index - 300), m.index + 40);
    if (/addEventListener\(\s*["'`](wheel|touchmove|touchstart|keydown)["'`]|on(Wheel|TouchMove|TouchStart|KeyDown)\b/.test(window)) {
      preventHits++;
      preventContext.push(`${file.split(/[\\/]/).pop()}: …${window.slice(-120).replace(/\s+/g, " ")}`);
    }
  }
}
const currentTimeWrites = jsFiles.reduce((s, f) => s + (readFileSync(f, "utf8").match(/\.currentTime\s*=[^=]/g)?.length ?? 0), 0);
const srcFiles = [];
const walkSrc = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkSrc(full);
    else srcFiles.push(full);
  }
};
walkSrc(join(ROOT, "src"));
const srcHandlers = srcFiles.reduce((s, f) => s + (readFileSync(f, "utf8").match(/addEventListener\(\s*["'](wheel|touchmove|touchstart|keydown|scroll)["']|on(Wheel|TouchMove|TouchStart|KeyDown|Scroll)=/g)?.length ?? 0), 0);

const textExt = new Set([".html", ".js", ".css", ".txt", ".json", ".xml", ".svg", ".map"]);
const leftovers = [];
for (const file of cssFiles) {
  if (!textExt.has(extname(file))) continue;
  const src = readFileSync(file, "utf8");
  const m = src.match(/parnian|cosmetics|پرنیان/i);
  if (m) leftovers.push(`${file.replace(OUT, "out")}: ${m[0]}`);
}

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const html = readFileSync(join(OUT, "index.html"), "utf8");
const served = await (await fetch(HOME)).text();
const missingSentences = sentences.filter((s) => !served.includes(s));

await browser.close();
server.kill();

/* -------------------------------------------------------------------------- */
/*  Report                                                                    */
/* -------------------------------------------------------------------------- */

console.log("\nSHAMIM verify — static export under /shamim, Chromium, no image viewed");

head("TOKENS  re-measured from the shipped stylesheet");
for (const [fg, bg, min] of PAIRS) {
  if (!tokenValues[fg] || !tokenValues[bg]) {
    fail(`token ${fg} or ${bg} not found in built CSS`);
    line(`--${fg} on --${bg}`, "NOT FOUND");
    continue;
  }
  const v = ratio(hexRgb(tokenValues[fg]), hexRgb(tokenValues[bg]));
  const note = fg === "iris-bright" && bg === "ground-heart" ? "  (display-only token; not used as text on heart)" : "";
  line(`--${fg} on --${bg}`, `${v.toFixed(2)}  ≥ ${min}  ${v >= min ? "ok" : "BELOW"}${note}`);
  if (v < min && !note) fail(`--${fg} on --${bg} = ${v.toFixed(2)}`);
}
const ring = [["open", "iris"], ["heart", "iris"], ["base", "iris-soft"]].map(([g, t]) => [g, t, ratio(hexRgb(tokenValues[t]), hexRgb(tokenValues[`ground-${g}`]))]);
for (const [g, t, v] of ring) {
  line(`focus ring on ${g}: --${t}`, `${v.toFixed(2)}  ≥ 3  ${v >= 3 ? "ok" : "BELOW"}`);
  if (v < 3) fail(`focus ring on ${g} = ${v.toFixed(2)}`);
}

for (const width of WIDTHS) {
  const r = results[width.name];
  head(`WIDTH ${width.name}px`);

  line("1  / status", r.status);
  line("1  /no-such-page/ status · h1", `${r.notFoundStatus} · ${r.notFoundH1}`);
  line("1  /404.html status", r.notFoundDirect);
  line("1  console errors · failed requests on /", `${r.consoleErrors.length} · ${r.failed.length}`);
  line("1  other errors on the 404 route", r.notFoundErrors.length);
  if (r.status !== 200 || r.notFoundStatus !== 404 || r.notFoundDirect !== 200) fail(`${width.name}: status`);
  if (r.notFoundErrors.length) fail(`${width.name} 404 route: ${r.notFoundErrors.join(" | ")}`);
  if (r.consoleErrors.length || r.failed.length) fail(`${width.name}: ${[...r.consoleErrors, ...r.failed].join(" | ")}`);

  const o = r.overflow;
  line("2  body scrollWidth / clientWidth", `${o.bodyScroll} / ${o.bodyClient}`);
  line("2  html scrollWidth / clientWidth", `${o.docScroll} / ${o.docClient}`);
  if (o.bodyScroll > o.bodyClient || o.docScroll > o.docClient) fail(`${width.name}: horizontal overflow`);

  console.log("  3  contrast — worst pixel under each visible text node");
  let worstRow = null;
  for (const pos of r.positions) {
    const rows = pos.rows.filter((row) => row.worst !== null);
    const lowest = rows.reduce((a, b) => (a && a.worst / a.min <= b.worst / b.min ? a : b), null);
    const below = rows.filter((row) => row.worst < row.min);
    const smallBright = rows.filter((row) => row.displayOnly && row.size <= 32);
    const unmapped = rows.filter((row) => row.token === "unmapped");
    console.log(
      `     ${String(Math.round(pos.p * 100)).padStart(3)}%  y=${String(pos.y).padStart(5)}  ${String(rows.length).padStart(2)} nodes  ` +
        `lowest margin: ${lowest ? `${lowest.worst.toFixed(2)} vs ≥${lowest.min} (${lowest.token}) ${lowest.sel} «${lowest.text.trim().slice(0, 18)}»` : "—"}` +
        `${below.length ? `  BELOW: ${below.length}` : ""}${smallBright.length ? `  iris-bright<32px: ${smallBright.length}` : ""}${unmapped.length ? `  unmapped: ${unmapped.map((u) => `${u.sel}=${u.color}`).join(",")}` : ""}`,
    );
    for (const b of below) fail(`${width.name} @${pos.p * 100}%: ${b.sel} «${b.text.trim().slice(0, 20)}» ${b.worst.toFixed(2)} < ${b.min} on rgb(${b.px})`);
    for (const s of smallBright) fail(`${width.name}: iris-bright on ${s.size}px text ${s.sel}`);
    for (const row of rows) if (!worstRow || row.worst < worstRow.worst) worstRow = { ...row, p: pos.p };
    if (pos.overBottle.length) fail(`${width.name} @${pos.p * 100}%: text over the bottle: ${pos.overBottle.join(", ")}`);
  }
  if (worstRow) line("3  lowest absolute ratio found", `${worstRow.worst.toFixed(2)} (${worstRow.token}, ≥${worstRow.min}) ${worstRow.sel} at ${worstRow.p * 100}%, over rgb(${worstRow.px})`);
  line("3  text rects over the bottle, all positions", r.positions.reduce((s, p) => s + p.overBottle.length, 0));
  line("3  liquid colours as a text background", r.structure.liquidAsTextBg);

  const n = r.native;
  line("4  overflow html · body", `${n.htmlOverflow} · ${n.bodyOverflow}`);
  if (/hidden/.test(n.htmlOverflow + n.bodyOverflow)) fail(`${width.name}: overflow hidden on document`);
  line("4  scrollTo(0,N) → scrollY", n.exact.map((e) => `${e.n}→${e.got}`).join("  "));
  if (n.exact.some((e) => e.n !== e.got)) fail(`${width.name}: scrollTo not exact`);
  const passiveFalse = n.listeners.filter((l) => l.type === "scroll" && l.passive === false).length;
  const byType = {};
  for (const l of n.listeners) byType[l.type] = (byType[l.type] ?? 0) + 1;
  line("4  listeners registered (scroll/wheel/touch/key)", Object.entries(byType).map(([k, v]) => `${k}×${v}`).join(" ") || "none");
  line("4  scroll listeners with passive:false", passiveFalse);
  if (passiveFalse) fail(`${width.name}: passive:false scroll listener`);
  line("4  real input → px scrolled", r.input.map((i) => `${i.how}:${i.moved}`).join("  "));
  line("4  input events seen · defaultPrevented", `${r.inputEvents} · ${r.prevented}`);
  if (r.prevented) fail(`${width.name}: an input event was defaultPrevented`);
  if (r.input.some((i) => i.moved <= 0)) fail(`${width.name}: an input did not scroll: ${JSON.stringify(r.input)}`);

  line("5  visible text length JS on / JS off", `${r.innerText} / ${r.noJsText}  (${(((r.noJsText - r.innerText) / r.innerText) * 100).toFixed(2)}%)`);
  line("5  [data-reveal] hidden with JS off", r.noJsHidden);
  if (Math.abs(r.noJsText - r.innerText) / r.innerText > 0.02 || r.noJsHidden) fail(`${width.name}: JS-off parity`);

  const rm = r.reduced;
  line("6  [data-reveal] normal · at rest at reading position", `${r.revealTotal} · ${r.revealSettledAtEnd.count}`);
  line("6  [data-reveal] reduced · at rest (op 1, no tf/filter)", `${rm.total} · ${rm.atRest}`);
  line("6  running animations under reduce", rm.animations);
  line("6  visible text normal / reduced", `${r.innerText} / ${rm.innerText}`);
  line("6  liquid under reduce, all positions", rm.liquid.join(" | "));
  line("6  bottle position under reduce", rm.bottlePosition);
  if (rm.total !== r.revealTotal || rm.atRest !== rm.total || rm.innerText !== r.innerText || rm.animations || rm.liquid.length !== 1 || rm.bottlePosition !== "sticky") fail(`${width.name}: reduced-motion parity`);
  for (const u of r.revealSettledAtEnd.unsettled) fail(`${width.name}: reveal not at rest when centred: ${u}`);

  const s = r.structure;
  line("7  Persian text nodes · non-normal letter-spacing", `${s.persianNodes} · ${s.spacing.length}`);
  for (const sp of s.spacing) fail(`${width.name}: letter-spacing ${sp}`);
  line("8  will-change elements · taller than viewport", `${s.willChange.length} · ${s.tallWillChange.length}`);
  if (s.tallWillChange.length) fail(`${width.name}: will-change on ${s.tallWillChange.map((w) => w.sel).join(",")}`);

  const band = r.positions.filter((pos) => [0.25, 0.5, 0.75].includes(pos.p));
  line("9  bottle position", r.positions[0].state.bottle.position);
  line("9  bottle top vs band @25/50/75%", band.map((pos) => `${pos.state.bottle.top.toFixed(1)}/${pos.state.expectedTop.toFixed(1)}`).join("  "));
  for (const pos of band) if (Math.abs(pos.state.bottle.top - pos.state.expectedTop) > 1.5) fail(`${width.name}: bottle off its band at ${pos.p * 100}%`);
  line("9  svg aria-hidden · focusables in svg", `${s.svgHidden} · ${s.svgFocusable}`);
  if (!s.svgHidden || s.svgFocusable) fail(`${width.name}: bottle svg a11y`);
  line("9  liquid @0/25/50/75/100%", r.positions.map((pos) => pos.state.liquid.replace(/\s/g, "")).join(" "));
  const numerals = r.positions.flatMap((pos) => pos.state.numerals.filter((nm) => nm.visible && nm.position === "sticky").map((nm) => `${Math.round(pos.p * 100)}%:${nm.top.toFixed(0)}`));
  line("9  sticky numerals on screen (pos:top)", numerals.join("  ") || `none sticky at this width (${r.positions[0].state.numerals[0].position})`);

  line("10 focus order", r.focus.map((f) => `${f.sel.split(".")[1] ?? f.sel}`).join(" → "));
  if (r.focus[0]?.sel.includes("skip-link") !== true) fail(`${width.name}: first focusable is not the skip link`);
  for (const f of r.focus) {
    const ok = f.w > 0 && f.h > 0 && f.inView && f.style !== "none" && f.ringWorst >= 3;
    line(`10   ${f.sel.split(".")[1] ?? f.sel} «${f.text}»`, `${f.w.toFixed(0)}×${f.h.toFixed(0)} inView:${f.inView} ring ${f.ringWorst?.toFixed(2)} on ${f.ground}${ok ? "" : "  FAIL"}`);
    if (!ok) fail(`${width.name}: focus ${f.sel} «${f.text}»`);
  }
  line("11 display:contents elements (never measured)", s.displayContents);
  line("12 footer · year ok", `${s.footer} · ${s.year}`);
  if (!s.year) fail(`${width.name}: copyright year`);
  line("13 <video> elements", s.video ? s.video : "0 — optional clip not shipped");
  line("14 first load: transfer · images · video", `${(r.firstLoad.total / 1024).toFixed(0)} KB · ${r.firstLoad.imageCount} img ${(r.firstLoad.images / 1024).toFixed(0)} KB · ${r.firstLoad.video} B`);
  line("14 images after full descent", `${r.weights.count} files, ${(r.weights.bytes / 1024).toFixed(0)} KB — ${r.weights.list.join(", ")}`);
}

head("FONTS");
line("display face resolved at runtime", resolved.display);
line("body face resolved at runtime", resolved.body);
for (const [family, g] of Object.entries(glyphReport)) {
  const real = g.missing.filter((m) => m !== "ZWNJ");
  line(`${family}: @font-face rules · missing of پچژگکیه ۰–۹`, `${g.faces} · ${real.length ? real.join(" ") : "none"}${g.missing.includes("ZWNJ") ? "  (ZWNJ not in cmap)" : ""}`);
  if (real.length) fail(`${family} is missing ${real.join(" ")}`);
}
line("ZWNJ adds width after ه: display · body", `${resolved.zwnjDisplay.toFixed(2)}px · ${resolved.zwnjBody.toFixed(2)}px`);
if (Math.abs(resolved.zwnjDisplay) > 0.5 || Math.abs(resolved.zwnjBody) > 0.5) fail("ZWNJ renders with width");
console.log("  fonts that actually painted each role (CDP, glyph counts):");
for (const [k, v] of Object.entries(rendered)) console.log(`     ${k}  ${v}`);
const systemPainted = Object.keys(rendered).filter((k) => k.includes("(SYSTEM)"));
if (systemPainted.length) fail(`system fallback painted: ${systemPainted.join(" | ")}`);

head("BUILD");
line("served HTML contains every sentence of §10", missingSentences.length ? `MISSING ${missingSentences.length}` : `all ${sentences.length}`);
for (const m of missingSentences) fail(`not in served HTML: ${m}`);
line("index.html raw · gzip", `${(Buffer.byteLength(html) / 1024).toFixed(1)} KB · ${(gzipSync(html).length / 1024).toFixed(1)} KB`);
line("preventDefault near wheel/touch/keydown handlers", preventHits);
for (const c of preventContext) console.log(`     ${c}`);
if (preventHits) fail("preventDefault in an input handler");
line("wheel/touch/key/scroll handlers in src/", srcHandlers);
if (srcHandlers) fail("input handler in src");
line("writes to currentTime in built JS", currentTimeWrites);
if (currentTimeWrites) fail("currentTime written");
line("parnian / cosmetics / پرنیان in out/", leftovers.length ? leftovers.join(" | ") : "0");
if (leftovers.length) fail("template names left in build");
const deps = Object.keys(pkg.dependencies ?? {});
line("runtime dependencies", `${deps.length}: ${deps.join(", ")}`);
if (deps.length !== 3) fail("dependency count");

head(failures.length ? `FAILURES (${failures.length})` : "ALL CHECKS PASSED");
for (const f of failures) console.log(`  ✗ ${f}`);
process.exit(failures.length ? 1 : 0);
