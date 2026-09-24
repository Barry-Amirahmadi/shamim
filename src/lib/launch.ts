/**
 * Whether this deployment is meant to be found by search engines.
 *
 * `false` for a demo: the page carries placeholder contact details, and an
 * indexed copy of a placeholder stays in a search cache long after it is fixed.
 * It drives both the robots meta tag and `/robots.txt`.
 *
 * On a GitHub Pages project site only the meta tag does any work — crawlers
 * read `robots.txt` from the origin root, never from `/<repo>/robots.txt`. Both
 * are set; the meta is the one relied on.
 */
export const IS_PUBLIC_LAUNCH = false;
