import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke pass — deliberately small, rewritten for a single route.
 *
 * Every assertion corresponds to a defect that actually shipped somewhere in
 * this family, which is the only reason each one is worth keeping. The
 * catalogue, gallery and menu tests were not dropped to make this green: the
 * routes and controls they exercised no longer exist. Their assertions that
 * still mean something — base path, metadata, inquiry links, structured data,
 * no dead form — are kept below against the new selectors.
 *
 * The deep checks (contrast at five scroll positions, native scroll, JS-off and
 * reduced-motion parity, glyph coverage) live in scripts/verify.mjs.
 */

const rawBase = process.env.SMOKE_BASE_PATH ?? "/shamim";
const BASE = rawBase === "/" ? "" : rawBase.replace(/\/+$/, "");

/**
 * Every control must have a non-empty accessible name. Interface strings live
 * in `src/content/ui.ts`; a mistyped path there renders a control that looks
 * fine and announces "undefined", which nothing else in this file would catch.
 */
async function namelessControls(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll("button, a[href]")]
      .filter((el) => (el as HTMLElement).checkVisibility({ visibilityProperty: true }))
      .filter((el) => el.closest('[aria-hidden="true"]') === null)
      .filter((el) => {
        const label = el.getAttribute("aria-label");
        const name = label === null ? (el.textContent ?? "") : label;
        return name.trim() === "" || name.includes("undefined");
      })
      .map((el) => `${el.tagName.toLowerCase()}.${el.className || "(no class)"}`),
  );
}

function watch(page: Page) {
  const consoleErrors: string[] = [];
  const failed: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  return { consoleErrors, failed };
}

test("the page renders, is RTL, and loads every asset", async ({ page }) => {
  const { consoleErrors, failed } = watch(page);

  await page.goto(`${BASE}/`);

  await expect(page.locator("h1")).toHaveText("شمیم");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  expect(await page.evaluate(() => getComputedStyle(document.body).direction)).toBe("rtl");

  // The three acts are one component fed three records.
  await expect(page.locator("section.act")).toHaveCount(3);
  await expect(page.locator("section.act h2")).toHaveText(["نت آغازین", "نت میانی", "نت پایه"]);

  // Walk the page so every lazy image is requested.
  await page.evaluate(async () => {
    const height = document.body.scrollHeight;
    for (let y = 0; y < height; y += 400) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 50));
    }
  });
  await page.waitForLoadState("networkidle");

  // Regression: next/image does not apply basePath when unoptimised, which
  // once broke every image on a project site.
  const broken = await page.evaluate(
    () => [...document.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth === 0).length,
  );
  expect(broken, "images failing to load").toBe(0);

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows, "horizontal overflow").toBe(false);

  expect(await namelessControls(page), "controls with no accessible name").toEqual([]);
  expect(failed, "failed requests").toEqual([]);
  expect(consoleErrors, "console errors").toEqual([]);
});

test("the header is the wordmark and one link, nothing more", async ({ page }) => {
  await page.goto(`${BASE}/`);

  const links = page.locator("header a");
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute("href", `${BASE}/`);
  await expect(links.nth(1)).toHaveAttribute("href", `${BASE}/#launch`);
  await expect(page.locator("#launch")).toHaveCount(1);
  await expect(page.locator("nav")).toHaveCount(0);
});

test("the call to action is two links, not a form", async ({ page }) => {
  await page.goto(`${BASE}/`);

  const tel = page.locator('#launch a[href^="tel:"]');
  await expect(tel).toHaveCount(1);
  expect(await tel.getAttribute("href"), "Latin digits only in tel:").toMatch(/^tel:\+?\d+$/);

  const chat = page.locator('#launch a[href^="https://wa.me/"]');
  await expect(chat).toHaveCount(1);
  const href = (await chat.getAttribute("href"))!;
  expect(href, "digits only in the wa.me path").toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
  expect(decodeURIComponent(href), "the brand is named in the prefilled message").toContain("شمیم");
  await expect(chat).toHaveAttribute("rel", /noopener/);

  const deadLinks = await page.locator('a[href="#"]').count();
  expect(deadLinks, "links pointing at #").toBe(0);
});

test("metadata is absolute, carries the base path, and keeps the page out of search", async ({
  page,
}) => {
  await page.goto(`${BASE}/`);

  const meta = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute("content"),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content"),
    ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute("content"),
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content"),
    robots: document.querySelector('meta[name="robots"]')?.getAttribute("content"),
  }));

  expect(meta.title).toBeTruthy();
  expect(meta.description).toBeTruthy();
  expect(meta.ogTitle, "og:title matches the page title").toBe(meta.title);

  // configure-pages reports origin and base path separately; a canonical built
  // from the origin alone points at somebody else's site.
  for (const [name, value] of [
    ["canonical", meta.canonical],
    ["og:url", meta.ogUrl],
    ["og:image", meta.ogImage],
  ] as const) {
    expect(value, `${name} is absolute`).toMatch(/^https?:\/\//);
    if (BASE) expect(value, `${name} carries the base path`).toContain(`${BASE}/`);
  }
  expect(new URL(meta.canonical!).pathname, "canonical points at itself").toBe(`${BASE}/`);

  // On a project path robots.txt is never read, so the meta tag does the work.
  expect(meta.robots, "robots meta").toMatch(/noindex/);
  expect(meta.robots, "robots meta").toMatch(/nofollow/);
});

test("robots.txt is exported, disallows the site, and advertises no sitemap", async ({ page }) => {
  const robots = await page.request.get(`${BASE}/robots.txt`);
  expect(robots.status()).toBe(200);
  const text = await robots.text();
  expect(text).toContain(`Disallow: ${BASE}/`);
  expect(text.toLowerCase()).not.toContain("sitemap");
});

test("structured data parses and claims nothing invented", async ({ page }) => {
  await page.goto(`${BASE}/`);

  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((el) => el.textContent ?? ""));
  expect(blocks.length, "Organization only").toBe(1);

  const organization = JSON.parse(blocks[0]) as Record<string, unknown>;
  expect(organization["@type"]).toBe("Organization");
  expect(String(organization.url)).toContain(`${BASE}/`);

  // No commerce, no reviews, no accounts: nothing here may claim otherwise.
  for (const field of ["offers", "aggregateRating", "review", "sameAs", "logo"]) {
    expect(organization[field], `must not assert ${field}`).toBeUndefined();
  }
});

test("an unknown path serves the styled 404", async ({ page }) => {
  const response = await page.goto(`${BASE}/definitely-not-a-page/`);

  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("این نشانی وجود ندارد");
  await expect(page.locator("main a")).toHaveAttribute("href", `${BASE}/`);
});

/**
 * A form with nowhere to post is worse than no form: on a static host the
 * browser falls back to a GET at the current URL, and whatever was typed — an
 * email address, in the parent template — lands in the URL and history.
 */
test("no route carries a form that submits nowhere", async ({ page }) => {
  for (const route of ["/", "/definitely-not-a-page/"]) {
    await page.goto(`${BASE}${route}`);

    const dead = await page.evaluate(() =>
      [...document.querySelectorAll("form")]
        .filter((f) => {
          const action = f.getAttribute("action");
          return action === null || action === "" || action === "#";
        })
        .map((f) => f.className || "(no class)"),
    );

    expect(dead, `${route} has a form posting nowhere`).toEqual([]);
  }
});
