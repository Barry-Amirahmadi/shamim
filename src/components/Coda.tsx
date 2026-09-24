import { coda } from "@/content/page";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * The coda and the page's single call to action.
 *
 * Two links, not a form. A form on a static host with nowhere to post falls
 * back to a GET at the current URL and writes whatever was typed into the
 * address bar and history — the parent template shipped exactly that, and a test now
 * forbids it. A `tel:` and a `wa.me` link need nothing behind them.
 */
export function Coda() {
  return (
    <section id="launch" className="coda on-dark" data-section aria-labelledby="launch-title">
      <div className="coda__inner">
        <h2 id="launch-title" className="coda__heading">
          {coda.heading}
        </h2>
        <p className="coda__sentence" data-reveal>
          {coda.sentence}
        </p>
        <div className="coda__links">
          <a className="coda__link" href={`tel:${site.contact.phoneHref}`}>
            {coda.phoneLabel}
          </a>
          <a
            className="coda__link"
            href={whatsappLink(site.contact.whatsapp, coda.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {coda.whatsappLabel}
            <span className="sr-only"> — {ui.newWindow}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
