/**
 * Base path helper.
 *
 * Next prefixes `basePath` onto anything it routes itself — `<Link>`, the
 * router, `_next/*` assets, the favicon. It does **not** prefix the `src` of a
 * `next/image` when `images.unoptimized` is set, because that bypasses the
 * loader that would otherwise do it.
 *
 * On a GitHub Pages *project* site that silently breaks every image: the markup
 * asks for `/media/hero.svg` while the file is actually served at
 * `/repo-name/media/hero.svg`. It looks perfect in `next dev` and in any build
 * without a base path, which is why it has to be handled explicitly.
 *
 * Any code that hands a root-relative asset path to the DOM goes through here.
 */
const raw = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Normalised the same way as next.config.ts: "/" means root, no trailing slash. */
export const basePath = raw === "/" ? "" : raw.replace(/\/+$/, "");

export function withBasePath(src: string): string {
  if (!basePath) return src;
  // Absolute URLs, data: URIs and relative paths are already correct — only a
  // root-relative path is ambiguous about where the site starts.
  if (!src.startsWith("/")) return src;
  if (src === basePath || src.startsWith(`${basePath}/`)) return src;
  return `${basePath}${src}`;
}
