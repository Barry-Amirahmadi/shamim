import type { MetadataRoute } from "next";
import { IS_PUBLIC_LAUNCH } from "@/lib/launch";
import { basePathForRobots } from "@/lib/seo";

/**
 * robots.txt.
 *
 * Under a GitHub Pages project path this file is served at `/<repo>/robots.txt`
 * and no crawler ever asks for it there, so it is inert on that host — the
 * robots meta tag in the root layout is what keeps the page out of search. It
 * is generated anyway because it becomes the right file, unchanged, the day
 * this is served from a custom domain.
 *
 * No sitemap is advertised: a page that asks not to be indexed has no reason to
 * hand a crawler a list of URLs.
 */
/** Required under `output: "export"`, or Next refuses to export the route. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: IS_PUBLIC_LAUNCH
      ? { userAgent: "*", allow: basePathForRobots }
      : { userAgent: "*", disallow: basePathForRobots },
  };
}
