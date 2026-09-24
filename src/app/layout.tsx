import type { Metadata, Viewport } from "next";
import { Alexandria, Aref_Ruqaa } from "next/font/google";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import { organizationSchema } from "@/content/schema";
import { IS_PUBLIC_LAUNCH } from "@/lib/launch";
import { siteRoot } from "@/lib/seo";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import "./globals.css";

/**
 * Two faces, fetched at build time and served from this origin — no request to
 * Google from an Iranian connection, where it may be slow or blocked.
 *
 * Aref Ruqaa — calligraphic ruqaa, display only. Its Persian coverage was not
 *              guaranteed, so it was checked glyph by glyph against its own
 *              cmap: پ چ ژ گ ک ی ه and ۰–۹ are all present.
 * Alexandria — body and note lists. **A substitution.** The brief specified
 *              Readex Pro, whose cmap has no پ چ ژ گ ک ی and none of the ten
 *              Persian digits: every Persian sentence would have fallen back,
 *              letter by letter, to a system font. Alexandria has all of them.
 *
 * Both keep the `latin` subset: the space character and general punctuation
 * live there, not in `arabic`, so every Persian line needs it anyway.
 */
const display = Aref_Ruqaa({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-aref",
  display: "swap",
});

const body = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(`${siteRoot}/`),
  title: {
    default: site.seo.title,
    template: site.seo.titleTemplate,
  },
  description: site.seo.description,
  /* The meta tag does the real work: on a GitHub Pages project path, robots.txt
     sits where no crawler looks. See src/lib/launch.ts. */
  robots: IS_PUBLIC_LAUNCH ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f2f5f4",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${body.variable} ${display.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          {ui.skipToContent}
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <JsonLd data={organizationSchema()} />
      </body>
    </html>
  );
}
