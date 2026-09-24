/**
 * Content model.
 *
 * These types are the contract between the page and whatever supplies its
 * words. Today that is `src/content`; the components read only these shapes,
 * so the supplier can change without a component changing.
 *
 * SHAMIM is one page and one product, so this model is small on purpose. There
 * is no `Product`, no list type and no price field anywhere: a launch page has
 * nothing to list, and a field that exists invites someone to fill it.
 */

/**
 * The three tiers of a fragrance pyramid. They are also the page's three
 * grounds, which is why the tier is the key the stylesheet switches on.
 */
export type Tier = "open" | "heart" | "base";

/**
 * A decorative photograph. There is no `alt` field, deliberately: every image on
 * this page is atmosphere behind text that already says everything, so each one
 * renders with an empty alt and is hidden from assistive technology. A field
 * that asked for alt text would get alt text, and it would be noise.
 */
export interface Atmosphere {
  /** Root-relative path under `public/`. Placeholder and real file share it. */
  src: string;
  width: number;
  height: number;
}

export interface OpeningContent {
  /** One line under the wordmark. Nine words at most. */
  line: string;
  image: Atmosphere;
}

/**
 * One act of the descent. The page renders three of these through one
 * component; nothing about an act is special-cased in code.
 */
export interface ActContent {
  tier: Tier;
  /** Position in the descent, 1-based. Rendered in Persian digits. */
  order: number;
  /** The fixed act name: نت آغازین · نت میانی · نت پایه. */
  name: string;
  /** Exactly three note names, one to three words each. */
  notes: readonly [string, string, string];
  /** One sentence, 22 words at most. A sensation and a material. */
  sentence: string;
  image: Atmosphere;
}

export interface ObjectContent {
  /** The perfume's name. The house and the perfume share it. */
  name: string;
  /** Latin transliteration, set as a micro-label. */
  latin: string;
  /** Two lines, 24 words at most across both. */
  coda: readonly [string, string];
  image: Atmosphere;
}

export interface CodaContent {
  /** One sentence. Not second person, not an instruction. */
  sentence: string;
  /** The single call to action, used as the block's heading. */
  heading: string;
  phoneLabel: string;
  whatsappLabel: string;
  /** Prefilled into the WhatsApp chat — the visitor's words, not the brand's. */
  whatsappMessage: string;
}

export interface NotFoundContent {
  heading: string;
  lead: string;
  action: { label: string; href: string };
}

export interface SiteContent {
  brand: {
    name: string;
    latin: string;
  };
  seo: {
    title: string;
    /** `%s` is the route's own title. */
    titleTemplate: string;
    description: string;
    /** Root-relative; the absolute URL is composed at build time. */
    ogImage: { src: string; alt: string; width: number; height: number };
  };
  /**
   * Placeholders on the family's unassigned-number convention. None of these
   * reaches a real person.
   */
  contact: {
    city: string;
    /** Display string, Persian digits. */
    phone: string;
    /** Dial string, Latin digits — Persian digits are not matched by `\d`. */
    phoneHref: string;
    /** wa.me number: Latin digits, no punctuation. */
    whatsapp: string;
  };
  /** The copyright year as a number; the footer renders it in Persian digits. */
  copyrightYear: number;
}

/**
 * Words the interface says on its own behalf. Most are heard, not seen; they
 * live in content anyway, because a hardcoded string is one no editor can reach.
 */
export interface UiStrings {
  /** First focusable element on every page. */
  skipToContent: string;
  /** Follows the brand name in the header wordmark's accessible name. */
  home: string;
  /** The header's one link, to the call to action. */
  launchLink: string;
  /** Appended for screen readers to a link that opens a new window. */
  newWindow: string;
}
