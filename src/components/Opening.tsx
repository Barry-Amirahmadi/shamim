import { opening } from "@/content/page";
import { site } from "@/content/site";
import { Atmosphere } from "./Atmosphere";

/**
 * The opening: the wordmark at display scale, one line, and nothing else.
 *
 * No button, no arrow, no "scroll down" hint. The page has to earn the scroll
 * with what is visible; a hint would be an admission that it did not.
 */
export function Opening() {
  return (
    <section className="opening" data-section aria-labelledby="opening-title">
      <Atmosphere image={opening.image} className="opening__air" eager />
      <h1 id="opening-title" className="opening__mark">
        {site.brand.name}
      </h1>
      <p className="opening__line">{opening.line}</p>
    </section>
  );
}
