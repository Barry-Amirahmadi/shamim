import { site } from "@/content/site";
import { faNumber } from "@/lib/digits";

/**
 * The last block, so it carries `data-no-exit`: the page cannot scroll far
 * enough to finish an exit animation on it, and it would sit dimmed forever.
 * (There are no exit animations today; the attribute keeps it that way if one
 * is ever added.)
 */
export function Footer() {
  return (
    <footer className="footer on-dark" data-section data-no-exit>
      <p className="footer__mark">{site.brand.name}</p>
      <p>
        {site.contact.city} · <span dir="ltr">{site.contact.phone}</span>
      </p>
      <p>
        © {faNumber(site.copyrightYear)} {site.brand.name}
      </p>
    </footer>
  );
}
