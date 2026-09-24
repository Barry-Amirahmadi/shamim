import { site } from "@/content/site";
import { absoluteUrl } from "@/lib/seo";

/**
 * Schema.org, mapped only from data that exists.
 *
 * Structured data is the easiest place on a site to assert something false,
 * because no reader ever sees it. So: no `Product` with `offers` — there is no
 * price, no availability and no seller; no rating or review — there are none;
 * no `sameAs` — the contact details are placeholders and the brand owns no
 * accounts; no `logo` — no logo file exists.
 */
export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.brand.name,
    alternateName: site.brand.latin,
    url: absoluteUrl("/"),
    description: site.seo.description,
    image: absoluteUrl(site.seo.ogImage.src),
    address: {
      "@type": "PostalAddress",
      addressLocality: site.contact.city,
      addressCountry: "IR",
    },
  };
}
