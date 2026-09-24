import type { Metadata } from "next";
import { site } from "@/content/site";
import { basePath } from "./basePath";

/**
 * Absolute URLs for the canonical, Open Graph and structured data.
 *
 * All three need a *full* URL, and this is the only place the two halves of the
 * deployed address are put back together. They arrive separately and that is
 * the trap: `actions/configure-pages` reports `origin` and `base_path` as two
 * outputs. On a GitHub Pages project site the origin is `https://user.github.io`
 * while the page lives at `https://user.github.io/repo`, so a URL built from the
 * origin alone resolves to somebody else's page.
 */
const rawOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shamim.example";

export const origin = rawOrigin.replace(/\/+$/, "");

/** Where the site really starts: origin plus base path, no trailing slash. */
export const siteRoot = `${origin}${basePath}`;

export function absoluteUrl(path = "/"): string {
  return `${siteRoot}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The site root as a path, which is what robots.txt takes. */
export const basePathForRobots = basePath ? `${basePath}/` : "/";

const ogImage = {
  url: absoluteUrl(site.seo.ogImage.src),
  width: site.seo.ogImage.width,
  height: site.seo.ogImage.height,
  alt: site.seo.ogImage.alt,
};

interface PageMeta {
  /** The route's own title. Omit on the page that *is* the site. */
  title?: string;
  description: string;
  /** Route path, with the leading and trailing slash. */
  path: string;
}

/**
 * Title, description, canonical and social cards for one route.
 *
 * The title is set as `absolute` and the same composed string feeds `og:title`,
 * so the two cannot drift apart. `openGraph` is merged shallowly by Next, so the
 * card is repeated here rather than inherited from the layout.
 */
export function pageMetadata({ title, description, path }: PageMeta): Metadata {
  const composed = title ? site.seo.titleTemplate.replace("%s", title) : site.seo.title;
  const url = absoluteUrl(path);

  return {
    title: { absolute: composed },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: site.brand.name,
      url,
      title: composed,
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: composed,
      description,
      images: [ogImage],
    },
  };
}
