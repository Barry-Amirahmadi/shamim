import type { NextConfig } from "next";

/**
 * Base path.
 *
 * GitHub Pages serves a *project* site from a subpath
 * (`username.github.io/repo-name`) and a *user/org* site or a custom domain
 * from the root. Which one applies is not knowable from this repository — it
 * depends on where it is published — so it is never hardcoded here.
 *
 * In CI, `actions/configure-pages` detects it and the deploy workflow passes it
 * in. Locally it defaults to the root, and can be overridden to reproduce the
 * deployed layout exactly:
 *
 *   NEXT_PUBLIC_BASE_PATH=/shamim npm run build
 *
 * The value is normalised because `configure-pages` reports the root as "/",
 * which Next rejects as a basePath.
 */
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const basePath = rawBasePath === "/" ? "" : rawBasePath.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  /**
   * GitHub Pages has no Node runtime, so the site is a static export.
   * Consequence, and it is permanent for this project: no API routes, no
   * Server Actions, no Middleware, no ISR. See docs/MASTER-HANDOFF.md §41.
   */
  output: "export",

  ...(basePath ? { basePath } : {}),

  /**
   * Directory-index URLs (`/products/shab/index.html`) rather than flat files
   * (`/products/shab.html`). Static hosts resolve the former unambiguously
   * whether or not the request carries a trailing slash.
   */
  trailingSlash: true,

  reactStrictMode: true,

  // Next writes its own AGENTS.md/CLAUDE.md here by default. This project sits
  // inside an Obsidian vault whose root CLAUDE.md is hand-maintained; a second
  // generated one is confusing, so it stays off.
  agentRules: false,

  images: {
    /**
     * There is no image optimisation server on a static host.
     *
     * Every image today is a hand-authored SVG, which the optimizer passes
     * through untouched — so a build-time raster pipeline would currently
     * optimise nothing while adding a dependency the project deliberately does
     * not have. Revisit when the first real photograph lands, not before:
     * that is the point where a pipeline starts earning its cost.
     */
    unoptimized: true,
  },
};

export default nextConfig;
