import type { SiteContent } from "@/types/content";

/**
 * Site-level content.
 *
 * Contact details are placeholders on the family's unassigned-number
 * convention: they must read unmistakably as stand-ins and must never resolve
 * to a real person who would then be associated with a fictional brand.
 * `wa.me` answers an unassigned number with "this link is invalid" rather than
 * opening a chat with a stranger, which is the right behaviour for a demo.
 */
export const site: SiteContent = {
  brand: {
    name: "شمیم",
    latin: "SHAMIM",
  },

  seo: {
    title: "شمیم — عطری در سه لحظه",
    titleTemplate: "%s — شمیم",
    description:
      "شمیم عطری است در سه لحظه؛ از تلخی پوست ترنج تا گرمای صمغ و چوب. روز عرضه به‌زودی اعلام می‌شود.",
    /** A PNG: no social crawler renders an SVG share card. */
    ogImage: {
      src: "/media/og-card.png",
      alt: "بطری شمیم روی زمینه‌ای تیره و گرم",
      width: 1200,
      height: 630,
    },
  },

  contact: {
    city: "تهران",
    phone: "۰۲۱ — ۰۰۰۰ ۰۰۰۰",
    phoneHref: "+982100000000",
    whatsapp: "989000000000",
  },

  copyrightYear: 2026,
};
