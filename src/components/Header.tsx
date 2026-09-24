import Link from "next/link";
import { site } from "@/content/site";
import { ui } from "@/content/ui";

/**
 * The wordmark and one link. No nav, no menu: there is one page.
 *
 * Not sticky. A bar that followed the reader would have to cross the seam
 * from sand to dark, where no single ink colour is legible at every point.
 */
export function Header() {
  return (
    <header className="masthead">
      <Link href="/" className="masthead__mark" aria-label={`${site.brand.name} — ${ui.home}`}>
        {site.brand.name}
      </Link>
      <Link href="/#launch" className="masthead__link">
        {ui.launchLink}
      </Link>
    </header>
  );
}
