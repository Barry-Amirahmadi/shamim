# MASTER HANDOFF — PERSIAN PREMIUM COSMETICS WEBSITE ("PARNIAN")

You are now taking ownership of the continued development of this website project.

This document is the complete project handoff. Treat it as the source of truth for the project's current state, design direction, architecture, constraints, and remaining roadmap.

Do NOT restart the project from scratch.
Do NOT redesign Phase 01 unless a real implementation problem requires it.
The current Phase 01 implementation is approved as the visual foundation. Continue from the existing codebase.

Sections 01–39 are the original creative/technical brief. Sections 40–48 are an architecture review addendum written after Phase 01 shipped, which resolves scope ambiguities the original brief left open and verifies specific claims against the real repository. **Where the two disagree, the addendum (40–48) wins** — see §46 for exactly which sections it supersedes.

---

## 01 — PROJECT CONTEXT

This is a premium Persian cosmetics / beauty website being developed as part of a high-end website design portfolio.

The website must feel:

* Premium
* Editorial
* Fashion-oriented
* Modern
* Sophisticated
* Product-focused
* Visually memorable
* Minimal but expressive
* Commercially credible

The website is NOT intended to look like:

* A generic cosmetics template
* A typical pink beauty website
* A Shopify-style product grid
* A generic corporate website
* A medical / pharmaceutical website
* A cheap e-commerce landing page
* A template copied from an existing website

The visual language should combine:
Luxury Beauty × Editorial Design × Product Photography × Modern Digital Experience

The website is Persian-first and RTL-first.

## 02 — CURRENT PROJECT STATUS

Phase 01 has already been implemented.

The current project uses:

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS v4
* next/font
* CSS custom properties / design tokens
* CSS transitions
* IntersectionObserver-based reveal animation

The implementation currently contains approximately:

* 39 source files
* 3 runtime dependencies:
   * next
   * react
   * react-dom

Production build currently passes.
TypeScript currently passes with `tsc --noEmit`.
The development server was verified at `http://localhost:3210`.

Continue using the existing architecture. Do not replace the stack without a strong technical reason.

## 03 — IMPORTANT: PHASE 01 IS APPROVED

The current Phase 01 design is approved by the project owner.

Do not perform a visual reset.
Do not replace the creative direction.
Do not introduce a completely different aesthetic.
Do not unnecessarily refactor working components.

Preserve the successful design language and improve it only when required by the next phases.

## 04 — CURRENT HOMEPAGE STRUCTURE

The current homepage follows this sequence:

1. Header
2. Hero
3. Statement
4. Product Showcase
5. Brand / Values
6. Gallery
7. CTA
8. Footer

The Hero is an actual part of the current implementation. The visual storytelling should remain editorial rather than behaving like a traditional commercial banner.

## 05 — CURRENT VISUAL CONCEPT

The primary creative concept is: **AMBIENT SHADE WASH**

Each product has a `tone` value. As the product enters the viewport, its tone influences the surrounding page atmosphere. The implementation uses CSS custom properties to drive soft ambient gradients.

This creates the relationship: Product Shade → Ambient Color → Scroll Storytelling

This is a signature interaction of the website. Preserve this concept. Do not replace it with heavy JavaScript scroll effects. Do not introduce per-frame scroll listeners unless absolutely necessary. The current implementation intentionally keeps the effect lightweight.

## 06 — CURRENT COLOR SYSTEM

The approved palette includes:

* Bone / Porcelain: `#EAE9E3`
* Sormeh / Kohl Indigo: `#141A2B`
* Muted Turquoise / Firouzeh: `#5F8A85`

Additional neutral colors are already defined through the project's token system.

Do NOT automatically introduce: Pink, Rose gold, Metallic gradients, Generic beige beauty palettes, Excessive gold.

The color system should remain restrained and sophisticated.

## 07 — TYPOGRAPHY

Display: Markazi Text
Body / UI: Vazirmatn

Both are self-hosted through `next/font`. Do not introduce runtime Google Font requests.

Persian typography rules:

* Persian is the primary language.
* RTL is native.
* Do not use letter-spacing on Persian text.
* Maintain generous Persian line-height.
* Avoid excessive font weights.
* Preserve correct Persian wrapping.
* Keep typography editorial and premium.

Latin labels may use controlled tracking where appropriate.

## 08 — RTL REQUIREMENT

This project is RTL-FIRST. This is NOT an LTR website with `direction: rtl` added afterward.

RTL must be native throughout: Layout, Grid, Navigation, Typography, Spacing, Alignment, Icon positioning, Animation direction, Mobile composition, Image placement, Component logic, Responsive behavior.

Use `lang="fa"` and `dir="rtl"` where appropriate. Persian is the primary content language. English support may be introduced later, but it is not the current priority (see §44.3 for the scaffolding decision this implies).

## 09 — CURRENT GRID SYSTEM

The design uses a fluid editorial grid. The current system supports 12-column, 8-column, and 4-column layouts depending on viewport and section. The RTL grid is native — column 1 represents the right edge of the composition. Do not convert the system into an LTR mental model. Maintain the editorial asymmetry.

## 10 — CURRENT PRODUCT PRESENTATION

The product showcase intentionally avoids a generic product-card grid. Products are presented editorially. Current image composition follows an intentional rhythm: R → L → R → L → Full. Do not turn the showcase into a standard equal-card ecommerce grid unless a future business requirement explicitly demands it. The products should feel like objects in an editorial fashion campaign.

## 11 — CURRENT MOTION SYSTEM

Motion currently uses: CSS transitions, IntersectionObserver, Reveal animations, Image settling, Hover lift, Flow-aware direction using `--flow-start`.

Content can enter from the right in RTL-aware motion rather than relying on arbitrary hardcoded directions.

Motion should communicate hierarchy and atmosphere. Avoid: Excessive animations, Constant movement, Scroll-jacking, Heavy WebGL, Unnecessary GSAP usage, Gratuitous parallax, Animation everywhere.

The experience should feel: Slow / intentional / editorial / premium. Respect `prefers-reduced-motion` fully.

## 12 — CURRENT RESPONSIVE BEHAVIOR

Tested at: 1440px, 1280px, 1024px, 768px, 390px, 375px.

Mobile is treated as a recomposition, not a compressed desktop.

Current mobile Hero order: 1. Headline 2. Full-bleed image 3. Supporting copy.

Gallery becomes a single-column composition with alternating widths and alignments. Preserve this philosophy.

## 13 — CURRENT ACCESSIBILITY FOUNDATION

The project already includes: Semantic HTML, Correct heading hierarchy, One primary H1, Skip link, Native `<dialog>` lightbox, Focus handling, Focus restoration, Mobile menu focus trap, Reduced-motion support, Appropriate touch targets.

Do not regress these features. Minimum interactive target size should remain approximately 44px.

## 14 — CURRENT CMS ARCHITECTURE

The project is intentionally CMS-ready. Current content is represented through typed files such as `src/content/*.ts`. Components should consume content through the project's content types. The core content contract is represented by `src/types/content.ts`.

The eventual CMS should replace the current static content source without forcing a redesign of the component architecture. Do NOT couple components directly to a specific CMS. Use typed content interfaces.

## 15 — CURRENT PRODUCT DETAIL ROUTE

A deliberate temporary route exists: `/products/[slug]`. This route currently prevents broken links / 404 behavior from the homepage showcase. It is NOT the final product detail implementation. Replace it properly during the relevant phase.

## 16 — IMPORTANT CONTENT WARNING

*(See §44.1 — this section is rewritten for a portfolio/demo project with no real client. The underlying principle below still holds.)*

Do NOT present unverified claims as factual. Never invent: Certifications, Clinical claims, Awards, Statistics, Ingredients, Guarantees, Dermatological claims, Medical claims, Product performance claims.

## 17 — SEO REQUIREMENTS

SEO is an explicit project requirement, implemented in stages. The final project should include: Unique page titles, Meta descriptions, Canonical URLs, Open Graph metadata, Twitter/social metadata where appropriate, Semantic HTML, Correct H1/H2/H3 hierarchy, SEO-friendly URL structure, Sitemap, Robots configuration, Structured data / Schema.org where appropriate, Product structured data where applicable, Organization / brand structured data where applicable, Image alt text, Internal linking, Crawlable content, Correct language metadata, Persian localization, Fast page loading, Image optimization, Core Web Vitals awareness.

Do not keyword-stuff Persian copy. SEO must support the design, not destroy it.

## 18 — CMS REQUIREMENT

*(See §40 and §44.1 — reframed for a portfolio/demo project. Treat "the client" language below as "the project owner.")*

The final website must allow non-developers to manage appropriate content. Likely CMS-managed content includes: Products, Product names, Product descriptions, Product images, Product gallery, Categories / collections, Homepage content, Hero imagery, Gallery images, Brand/value sections, SEO title, SEO description, Open Graph image, Slugs, Contact information, Potential blog/articles if required later.

Compare practical options and choose the simplest professional architecture that satisfies: Client usability, Persian content, Image management, SEO, Maintainability, Deployment requirements, Cost, Developer experience. See §43 for the resolved CMS choice given the GitHub Pages hosting decision.

## 19 — FIVE-PHASE PROJECT ROADMAP

**PHASE 01 — Creative Direction & Core UI — STATUS: COMPLETED / APPROVED**

Established: Creative direction, Visual identity, Typography, Color system, Grid, Header, Hero, Product presentation, Gallery direction, CTA, Footer, Responsive foundation, Motion language, CMS-ready content structure. Do not restart this phase.

**PHASE 02 — Pages & Content Architecture — NEXT MAJOR PHASE**

Build the real page architecture. Potential pages:

01 — Home: the current homepage becomes the central brand experience.
02 — Products / Collection: a premium product discovery experience. Do NOT automatically use a standard ecommerce card grid — preserve the editorial visual language.
03 — Product Detail: each product needs its own immersive presentation (product hero, name, short statement, photography, description, key information, gallery, related products, CTA — only use information that actually exists).
04 — Gallery: an immersive editorial image experience.
05 — About / Contact: depending on actual brand/content requirements.

Do not force all five pages if the actual requirement only needs 2–5 pages. The final information architecture should remain commercially useful.

## 20 — PHASE 02 UX PRINCIPLES

Prioritize, in order: Brand perception, Product discovery, Product understanding, Visual storytelling, Conversion, Trust.

Avoid: Excessive navigation, Too many CTAs, Overloaded pages, Generic ecommerce UX, Repetitive sections. Each section must have a reason to exist.

## 21 — PHASE 03 — CMS & CONTENT MANAGEMENT

*(See §43 for the static-host-specific version of this plan.)*

After page architecture is stable: Select CMS, Define content models, Connect CMS, Replace static content source, Preserve existing TypeScript content interfaces, Connect product data / gallery / SEO fields / images / homepage content, Test content editing workflow. CMS implementation must not unnecessarily change the visual layer.

## 22 — PHASE 04 — SEO / PERFORMANCE / TECHNICAL OPTIMIZATION

Audit: Metadata, Sitemap, Robots, Canonicals, Schema, Image SEO, Alt text, Heading structure, Internal links, URL architecture, Performance, Font loading, Image loading, Lazy loading, Cumulative Layout Shift, Largest Contentful Paint, Interaction to Next Paint, Accessibility, Mobile performance.

Avoid sacrificing the visual concept for meaningless Lighthouse optimization. Optimize intelligently — see §44.6 for concrete targets.

## 23 — PHASE 05 — FINAL QA & PRODUCTION

**Visual QA:** Desktop, Tablet, Mobile, RTL alignment, Typography, Image cropping, Spacing, Animation, Hover states, Loading states, Empty states.

**Functional QA:** Navigation, Mobile menu, Product links, Product details, Gallery, Lightbox, Forms, CMS, Search if implemented, Internal links.

**Technical QA:** TypeScript, Production build, Console errors, Broken links, 404 behavior, SEO, Accessibility, Performance.

**Final creative QA:** Does this feel like a premium beauty brand or like a website template? If it feels generic, refine it.

## 24 — DESIGN ORIGINALITY RULE

Awwwards / reference websites may be used for: Design DNA, Composition principles, Interaction inspiration, Typography ideas, Editorial rhythm, Motion language, Art direction.

But NEVER clone: Exact layouts, Exact sections, Exact visual compositions, Exact copy, Exact animations, Exact branding, Exact image treatment. The final website must have its own identity.

## 25 — IMAGE ART DIRECTION

Photography should feel: Fashion editorial, Premium beauty campaign, Cinematic, Controlled, Sculptural, High-end.

Avoid: Cheap stock photography, Generic smiling beauty models, Overused pink cosmetics imagery, Generic influencer imagery, Excessive flowers, Artificial luxury clichés.

When real product photography becomes available, prioritize it over placeholders. Do not invent product attributes through imagery. See §47 for the current placeholder approach (SVG, not AI-generated) and why it should stay the default until real photography exists.

## 26 — TECHNICAL ARCHITECTURE PRINCIPLES

Keep the architecture simple and scalable. Preferred stack remains: Next.js, React, TypeScript, Tailwind/CSS, minimal dependencies. Use additional libraries only when they provide real value. Do not introduce: Three.js, WebGL, GSAP, Heavy animation frameworks, Complex state-management libraries — unless there is a compelling project-specific reason.

## 27 — COMPONENT ARCHITECTURE

Maintain the existing conceptual organization: layout, navigation, hero, products, gallery, sections, ui, motion. Keep components: Reusable, Typed, Small enough to reason about, Content-driven, CMS-ready. Avoid creating hundreds of micro-components without purpose.

## 28 — CONTENT ARCHITECTURE RULE

Components should not contain unnecessary hardcoded business content. Prefer: Content → Types → Components → UI, rather than: Component → hardcoded content → visual output. This is important for the CMS phase.

## 29 — PERSIAN COPY RULE

All user-facing copy should be Persian unless specifically required otherwise. Do not use English lorem ipsum. Do not generate fake business claims. If content is unavailable, use clearly identified neutral placeholder content. Persian text must feel naturally written by a professional Iranian brand. Avoid robotic translations.

## 30 — NAVIGATION PHILOSOPHY

Navigation should remain minimal. Possible structure: خانه / محصولات / گالری / درباره ما / تماس — but do not assume these exact labels are final. Use the actual information architecture once the brand requirements are known. The navigation should feel like part of the visual identity, not a generic website menu.

## 31 — MOBILE DESIGN RULE

Mobile is not a smaller desktop. Recompose the experience. Prioritize: Typography, Product imagery, CTA clarity, Touch targets, Reading rhythm, Scroll storytelling.

Do not allow: Horizontal overflow, Tiny text, Tiny buttons, Broken Persian wrapping, Excessive animation, Desktop compositions squeezed into mobile.

## 32 — QUALITY BAR

Judge the final website against: Art Direction, UX, UI, Motion, Typography, RTL, Performance, SEO, CMS, Originality — each as a direct question (does it have a clear visual identity, can a user understand the brand quickly, does the interface feel premium, does motion enhance storytelling, does Persian typography look genuinely designed rather than translated, does the interface feel natively RTL, is the experience fast despite its visual richness, is the site technically discoverable, can the client realistically manage the content, does it look like its own brand).

## 33 — HOW YOU SHOULD WORK FROM NOW ON

For each phase: Inspect the existing codebase. Understand what already exists. Do not rebuild working parts unnecessarily. Identify dependencies and architectural implications. Implement incrementally. Run the project. Check the browser visually. Test responsive behavior. Test RTL. Run TypeScript. Run production build. Check console errors. Check accessibility. Check performance. Fix real defects. Only then report completion.

Do not merely write code and assume it works. Verify it. (§47 adds one concrete requirement: verify against the actual static-export output, not just `next dev`.)

## 34 — SELF-REVIEW PROTOCOL

After each major implementation stage, ask: Does this still match the approved Phase 01 art direction? Does this make the user's journey clearer? Does this feel natively Persian/RTL? Does it work at 375–390px as well as desktop? Is the motion purposeful? Did this introduce unnecessary JavaScript or dependencies? Can this eventually be driven by CMS content? Is the content semantically meaningful? Did this accidentally become a generic template?

If the answer to any of these is no, fix it before continuing.

## 35 — CRITICAL RULE: DO NOT OVER-ENGINEER

This is a design-led project. The goal is not to demonstrate how many technologies can be used. The goal is: a beautiful, premium, commercially useful, technically solid Persian beauty website. Prefer: Simple + elegant + fast, over: Complex + impressive technically + unnecessary.

## 36 — CURRENT KNOWN DEFECTS THAT HAVE ALREADY BEEN FIXED

Do not reintroduce these issues:

1. Component CSS overriding Tailwind responsive utilities.
2. Hero overflow caused by aspect-ratio / max-height behavior.
3. Insufficient text contrast.
4. Small navigation/footer hit targets.
5. Persian phone number handling causing empty `tel:` links.
6. Persian placeholder text forcing incorrect LTR behavior.
7. Sticky header covering anchor targets.
8. Incorrect product image-side alternation.
9. Excessive dead space in section headings.
10. CTA backdrop image lacking sufficient visual readability.

## 37 — CURRENT PHASE 01 DEFINITION OF DONE

Phase 01 was considered complete because: Production build passed. TypeScript passed. Responsive behavior was checked. No horizontal overflow. Contrast issues were resolved. Interactive target sizes were corrected. RTL behavior was considered. Reduced motion was implemented. CMS-ready content structure exists. Core visual direction was established. Ambient Shade Wash interaction works. Homepage storytelling is coherent.

Treat this as the stable foundation.

## 38 — IMMEDIATE NEXT ACTION

Before making major architectural decisions for Phase 02: Inspect the current repository. Run the application. Review the current homepage visually. Understand all existing components and content types. Identify the current routes. Identify what is already reusable. Then design and implement Phase 02.

Do NOT immediately replace the current homepage. Do NOT immediately install a CMS. Do NOT immediately refactor the entire codebase. First understand what exists.

## 39 — FINAL PRINCIPLE

The project should evolve like a real premium digital product: Concept → Design → UX → Content → Architecture → CMS → SEO → QA → Production. Not: Template → Code → Plugins → Fixes.

Every technical decision must support the creative direction. Every design decision must support the user journey. Every content decision must support the brand. Every animation must have a purpose. Every dependency must justify its existence. Every page must feel like it belongs to the same brand world.

**YOUR ROLE:** act as Senior Web Architect, Senior UX/UI Designer, Art Director, Interaction Designer, Motion Designer, Creative Technologist, Frontend Architect, SEO Technical Lead, CMS Architect, and QA Engineer. You are the implementation owner. Continue from the current Phase 01 codebase. Do not restart. Do not dilute the visual identity. Build the remaining phases to production quality.

---

# ADDENDUM — ARCHITECTURE REVIEW (written after Phase 01 shipped)

## 40 — RESOLVED PROJECT SCOPE (owner review, do not re-litigate)

This addendum was produced by an architecture/prompt review of the original 39-section handoff. The owner answered four scope questions that the original document left ambiguous or contradictory. Treat these as settled:

* **Project type: portfolio / demo, not a paying client.** Section 01 said "portfolio" while section 18 said "the client explicitly requested a CMS" — these contradicted each other. There is no real client. Sections 16 and 18 are reinterpreted below (§44.1, §44.9) in light of this.
* **No commerce.** This is a catalog/lead-generation site, not a transactional store. There is no cart, no checkout, no payment gateway. Every place the original document implies "conversion" or "CTA," read that as *contact/inquiry intent*, not *purchase*. See §42.
* **Hosting target: GitHub Pages**, matching the owner's existing sites. This has real architectural consequences the original document does not mention anywhere — see §41, which is the most important section of this addendum.
* **Catalog size: architect for a real premium-brand taxonomy (multi-category — e.g. face / eyes / lips / skincare, best-sellers, gifts), but seed it with a small curated SKU set for the demo.** The actual seed catalog today is 5 products (see §47) — keep the taxonomy able to grow, but do not force the current 5 into a large multi-category structure prematurely.

## 41 — CRITICAL: GITHUB PAGES = STATIC EXPORT ONLY (this changes real decisions)

GitHub Pages serves static files only — there is no Node runtime, no server, no edge functions. Next.js on GitHub Pages must run in `output: 'export'` mode. This is not a deployment detail to handle "later" — it constrains architecture decisions Phase 02 and Phase 03 are about to make. Verify and lock this down **before building further** (see §47 — this is currently NOT configured):

* **Set `output: 'export'` in `next.config.ts`**, and confirm the build actually produces a static-export-compatible output, not just a passing `next build` in server mode.
* **No API routes, no Server Actions, no Middleware.** Any Phase 02/03 feature that assumes a server (form handling, on-demand data, auth, redirects via `next.config`) will silently not work on GitHub Pages. Route Handlers are only usable if fully static (`export const dynamic = 'force-static'`, no request-time data).
* **No ISR / on-demand revalidation.** `revalidate` has no effect without a Node server. This directly changes the Phase 03 CMS plan — see §43.
* **`next/image` optimization server does not exist on GitHub Pages.** Use `images: { unoptimized: true }` or a build-time image pipeline. Decide which now, since it affects the image-loading code written in Phase 02.
* **Dynamic routes need `generateStaticParams` covering every path at build time.** `/products/[slug]` already does this correctly (§47).
* **Base path / asset prefix.** GitHub Pages project sites are typically served from a subpath (`username.github.io/repo-name`) unless a custom domain or user/org root repo is used. `basePath` and `assetPrefix` must be configured correctly, and every internal link/image path must respect it. This exact class of bug is what forced an earlier project in this workspace off `pages.dev` — do not repeat it here.
* **Custom 404 handling** — static export needs an actual `404.html` at the output root; Next's `not-found.tsx` behavior differs from server mode. Verify it resolves correctly once deployed, not just in `next dev`.
* **`next dev` will hide all of the above.** Everything in this section can look correct in local development and fail silently only in the exported static build. Verification (§33) must include an actual static-export build pass and a check of the generated output, not just `npm run dev`.

## 42 — CONTACT / INQUIRY ARCHITECTURE (replaces the missing commerce spec)

Since there is no cart or payment (§40), every product-level and homepage CTA needs a concrete non-transactional target:

* **Primary path: WhatsApp click-to-chat** (`https://wa.me/<number>?text=<url-encoded prefilled message>`), pre-filled with the product name so the inquiry has context. Static link — works fine on GitHub Pages.
* **Secondary path: Instagram profile link**, for brand-discovery-stage visitors rather than product-specific ones.
* **A contact form is optional, not required.** If one is built, it must post to a third-party static-compatible form backend (e.g. Formspree, Web3Forms) — do not build a custom API route for this, it will not run on GitHub Pages (§41).
* Design the inquiry moment editorially, matching the rest of the site's restraint — a short modal or drawer that echoes the Ambient Shade Wash tone of the product being inquired about is a natural fit and costs little given the interaction system already exists.

## 43 — CMS-ON-STATIC-HOST STRATEGY (adjusts Phase 03)

A static host cannot do on-demand revalidation (§41) — a content change must trigger a full rebuild + redeploy, not a live update.

* **Prefer a headless CMS with webhook support** (Sanity is the strongest fit — hosted, generous free tier, ships a webhook on publish). Point that webhook at a GitHub Actions workflow that runs `next build` and pushes the output to the deploy branch.
* **WordPress is a weak fit precisely because of the hosting choice.** Full WordPress needs its own PHP server, contradicting "hosted on GitHub Pages." Headless WordPress + statically-exported frontend is possible but adds real operational complexity a Sanity/Strapi-style headless CMS avoids. Do not default to WordPress as the "safe familiar choice" — for this hosting target it is the more complex option.
* Rebuild latency (minutes, not instant) is an acceptable tradeoff for a portfolio/demo project with no real editorial urgency — state this explicitly so it isn't later reported as a bug.

## 44 — OTHER GAPS FOUND IN REVIEW

44.1 — **Content-honesty rule, portfolio-specific version (supersedes §16/§18's client-approval framing).** There is no client (§40). Fictional brand copy is fine and expected, but do not fabricate content that *reads as a real regulatory/clinical/statistical claim* (certifications, "dermatologically tested," awards, percentages) even for a fictional brand — a portfolio piece that casually invents fake clinical claims signals the designer doesn't understand content-honesty norms, undermining the portfolio's own credibility with the audience it's actually for.

44.2 — **Analytics is unaddressed.** Decide explicitly (likely: none, or a privacy-respecting minimal option) rather than defaulting to Google Analytics on a no-real-user demo site.

44.3 — **i18n scaffolding decision.** §08 says English "may be introduced later." Decide explicitly now whether Phase 02 should scaffold routing for a future locale (cheap now, expensive to retrofit through an already-built RTL-native grid) or commit to Persian-only permanently.

44.4 — **No automated verification beyond manual QA.** Consider a lightweight Playwright smoke pass (homepage renders, lightbox opens, RTL direction resolves) plus an automated `axe-core` accessibility pass as part of the Phase 02+ verification loop.

44.5 — **Placeholder image policy — resolved, see §47.** Keep using hand-authored SVG placeholders (already the approach) rather than AI-generated imagery, for the reasons in §47.

44.6 — **No numeric performance budget.** Suggested targets: LCP < 2.5s, CLS < 0.1, total JS < ~150KB gzipped on the homepage — adjust once real image weights are known, but have *a* number.

44.7 — **Browser/device matrix is unspecified.** One specific risk: the native `<dialog>` lightbox has historically had inconsistent behavior on older Safari/iOS, which matters for a Persian-market audience skewing toward a wide range of iOS versions. Test on at least one real or emulated iOS Safari; have a documented fallback if `<dialog>` support is inadequate.

44.8 — **RTL keyboard interaction — resolved.** Already correct: ArrowLeft advances in the lightbox (matches reading direction, per §47). No change needed; keep this precedent for any future keyboard-driven interaction.

44.9 — **Ambient Shade Wash / layout fallback.** All 5 current products have `tone` and `layout` set (§47), so this doesn't bite yet — but the moment a CMS lets someone add a product without filling every field, an undefined `tone` or `layout` will break the page's atmosphere or rhythm. Define neutral fallbacks for both now, before CMS work starts (§48.2 has the recommended `layout` fallback).

44.10 — **No explicit escalation rule.** Add one operating rule: *when a decision would change the visual identity, the taxonomy, or the interaction language in a way this document doesn't already resolve, stop and ask rather than assuming — this document is deliberately not exhaustive on every future micro-decision.*

44.11 — **Dark mode is unaddressed** — treat as explicitly out of scope for this project rather than an oversight.

44.12 — **OG/social image and favicon production pipeline is unspecified.** Assign this explicitly in Phase 04 rather than discovering it's missing at launch QA.

## 45 — CREATIVE ADDITIONS (not gaps — ways to make this a stronger portfolio piece)

* **Turn the Ambient Shade Wash system into an actual interactive feature, not just a passive scroll effect.** A short "پیدا کردن طیف رنگ" (find-your-shade) moment — a small guided flow that lets a visitor pick preferences and see the ambient tone system respond live — repurposes an interaction system that already exists into a genuine centerpiece feature, at low incremental cost since the tone-to-gradient plumbing (§05) is already built.
* **A restrained, reduced-motion-respecting brand-intro moment** on first load — a portfolio piece's first three seconds carry disproportionate weight compared to a real commercial site.
* **Consider a secondary, clearly-separated "case study" route** documenting the actual design reasoning — the RTL-native grid decision, the tone-driven ambient system, the typography pairing. This is exactly what a portfolio audience (potential clients or employers) wants to see, and doubles as ready-made resume/portfolio-narrative material.
* **Elevate the WhatsApp inquiry moment (§42) into a designed micro-interaction** rather than a bare link — since there's no real commerce, the "contact intent" moment is this site's actual conversion point and deserves the same editorial care as the product photography.

## 46 — HOW TO READ THIS DOCUMENT

Sections 01–39 are the original brief. Sections 40–48 are the addendum. Where they conflict (primarily §16 vs §44.1, and the CTA language throughout §04/§10/§19.03 vs §42), the addendum wins — it reflects the project owner's direct answers to the ambiguities the original left open. Everything else in the original 39 sections stands as written and is not superseded.

## 47 — VERIFIED AGAINST THE ACTUAL REPOSITORY (2026-09-15)

The project's own `docs/PHASE-01-REPORT.md` was cross-checked against the real code, not taken on faith. Findings:

* **§41's warning is confirmed, not hypothetical.** `next.config.ts` has no `output: 'export'`, and `package.json` ships a `start` script (`next start -p 3210`) that assumes a Node server at runtime. As committed today, this project would not run correctly on GitHub Pages. No `.github/workflows` directory exists yet — there is no deploy pipeline at all. **This is the first task of Phase 02**, ahead of any new page or CMS work.
* **The `/products/[slug]` stub is already static-export-correct.** It calls `generateStaticParams()` over `publishedProducts` and uses `notFound()` — no server assumption. No middleware and no API routes exist anywhere in the project, so beyond the `next.config`/deploy gap above, there is nothing else currently blocking static export.
* **Photography is 15 hand-authored SVG placeholders** (`/public/media/*.svg` — defocused tonal fields, not AI-generated raster images), each mapped 1:1 to a real photo slot by path and aspect ratio. Keep this as the fallback approach for any future placeholder needs: it sidesteps the image-generation quality problems this workspace already hit and dropped on an earlier project, costs near nothing in bundle weight, and carries no licensing risk.
* **Exactly 5 seed products exist today**, each with an explicit `tone` and `layout` value already set, and a `status: "published"` field with draft-filtering already wired (`publishedProducts`). The missing-field edge cases in §44.9 don't exist yet in the current 5, but will the moment a CMS lets someone add a 6th without filling every field — build the fallback now while it's cheap.

## 48 — ANSWERS TO THE PHASE 01 REPORT'S OPEN QUESTIONS (§12 of that report)

1. **Keep or remove the `/products/[slug]` stub?** Keep it. Already static-export-compatible (§47) and matches what §15 anticipated. No action needed beyond the eventual real Page 03 build.
2. **`layout` as an editor-controlled field, or derived from position?** Keep it editor-controlled — matches the project's stance against a generic equal-card grid (§10). Add one refinement before CMS work starts: a deterministic fallback (e.g. cycle `tall → wide → compact → feature` by position) for a product where an editor didn't set `layout`. **Superseded 2026-09-16 (Phase 02 Task 2):** the cycle actually shipped is `tall → wide → feature → compact`, not the order above — `wide` and `compact` are both left-side arrangements, so the original order placed them adjacently and reintroduced §36 defect #8 (incorrect image-side alternation). Verified over 11 products: zero adjacency violations with the shipped order. Treat `tall → wide → feature → compact` as canonical going forward.
3. **Phase 02 ordering?** Reordered from the report's own recommendation, given §40: this is a portfolio/demo with no real client supplying a photoshoot, and this workspace already tried and dropped AI-generated imagery once over quality. Order: **(1)** the static-export/deploy fix in §47 — cheap, blocks nothing else; **(2)** the remaining pages (Products/Collection, real Product Detail, Gallery, About/Contact per §19) using the existing SVG placeholder system; **(3)** CMS integration last, since it's the most operationally complex piece given the static-hosting constraint (§43).
4. **Target CMS?** Sanity — see §43.
5. **Consultation-led CTA, or is commerce coming?** Confirmed no commerce (§40). The stub page's existing "دریافت مشاوره" CTA is already correct.

## 49 — KNOWN TECHNICAL RISKS TO RE-CHECK ON A NEXT.JS UPGRADE

* **`scripts/flatten-rsc-payloads.mjs` (added Phase 02 Task 2).** Next 16's static export writes a dynamic route's RSC payload to a nested directory (`out/products/shab/__next.products/$d$slug/__PAGE__.txt`) while the client requests a flat, dot-separated filename (`out/products/shab/__next.products.$d$slug.__PAGE__.txt`) — static routes get the flat name directly, dynamic ones don't, and a Node server normally bridges the gap that doesn't exist on a static host. This script is a `postbuild` step that copies each nested payload to the flat name Next's own client expects. It is reverse-engineered from an undocumented internal naming convention, not a public API — **on any future Next.js upgrade, verify this is still needed and still correct** (build a product route, hard-load it directly rather than navigating to it, and confirm no 404 on the RSC payload request). If the convention has changed, the script will simply find nothing to copy and the site degrades to a single failed background request per hard load, not a visible break — so this can fail silently rather than loudly, which is exactly why it needs a deliberate check rather than waiting for a bug report.

## 50 — AMBIENT SHADE WASH: THE INPUT RULE NOW DEPENDS ON LAYOUT DENSITY (Phase 02 Task 3)

§05's original description ties the shade change to *scroll* — correct on the homepage, where one product spread occupies the viewport at a time. It breaks on any page showing multiple products at once (the collection page, and by the same logic any future "related products" block on the real Product Detail page): scroll makes them fight over the shared field and flicker.

**Resolved rule, canonical from here on:** the input is chosen once per page load, by capability, not by which page it is —

* where a real pointer exists (`(hover: hover)` true), the shade follows **hover and keyboard focus** — both, not hover alone, since keyboard-only users must get the same affordance;
* where it does not (touch, `(hover: hover)` false), the layout is single-column at that density and the original scroll rule is correct again.

Verified on all three paths (hover, keyboard focus, touch-scroll) against the actual computed `--shade` value, not assumed. Apply this same rule to any future page or section that shows more than one product at a time — do not default to scroll-driven shade just because that was the first implementation; check how many products are on screen at once first.

## 51 — SCOPE PIVOT: THIS IS A PRESENTED TEMPLATE, NOT A CMS-BACKED CLIENT SITE (2026-09-16)

**Amends §18, §21, and §43.** The project owner has clarified the actual goal: this site is a **template/demo shown as a portfolio piece**, not a specific business going into production with a real editor who needs a working CMS day to day. This sharpens §40's "portfolio/demo" framing into a concrete build decision:

* **No real CMS gets integrated.** Sanity, Strapi, WordPress — none of it. §43's plan (select a CMS, connect it, wire a rebuild webhook) does not happen. What *does* still matter, and is already true: the content layer stays typed and source-agnostic (`src/content/*.ts` behind `src/types/content.ts`), so the architecture visibly *could* take a real CMS without a rewrite — that claim is the deliverable, not an actual integration proving it.
* **Depth should be proportionate to "shown, not operated."** Every remaining page (Product Detail, Gallery, About/Contact) needs to look complete and professional — this is still a portfolio piece and has to hold up to scrutiny — but should not accumulate business-specific depth, content volume, or edge-case handling that only a real, currently-operating business would need. Match the effort to "a reviewer opens this and is convinced," not "a client's staff uses this daily."
* **Phase 04 (SEO/performance) becomes a baseline pass, not an audit.** Cover the essentials that make a template look technically credible — unique titles, meta descriptions, OG tags, sitemap, robots, basic structured data, no obvious performance red flags — without chasing exhaustive Core Web Vitals optimization or building tooling to track it over time.
* **Phase 05 (final production QA) is out of scope** unless and until this stops being "a template that gets presented" and becomes an actual launch for a real business. Do not build a production launch checklist for a site that isn't launching.

## 52 — CONTENT STRING PLACEMENT: EVERY EXPORT IS TYPED, ACCESSIBLE NAMES ARE CONTENT TOO (Phase 03)

The Phase 03 audit found the CMS-readiness claim (§43, §51) was resting on an untyped foundation: 12 of 16 exports in `src/content/sections.ts` had no declared interface, only an inferred one — which describes the literal that happens to be present, not a contract a real data source would have to satisfy. Deleting a field silently left the build green. **Canonical from here on: every export in `src/content/*.ts` is annotated against an explicit interface in `src/types/content.ts`, never left to inference.** This is what makes "a CMS could supply this" a checkable claim instead of an aspiration — verify it the same way Phase 03 did, by deleting a field from a source file and confirming `typecheck` fails.

**Where a string goes, resolved:** `src/content/sections.ts` is the brand's copy deck (headings, body text, CTAs — what an editor would change). `src/content/ui.ts` is interface strings — aria-labels, sr-only text, anything only assistive tech reads. The project had already applied this split inconsistently (`collection.indexLabel`, `productPage.breadcrumbLabel`, `inquiry.newWindow` were in the copy deck before Phase 03; eleven other accessible names were hardcoded in components). Phase 03 finished applying it: **accessible names are content, same as visible copy — §28 makes no exception for text only a screen reader hears, and a hardcoded label is one no editor or translator can reach.** Any new string, of either kind, goes in content from the start rather than being hardcoded and moved later.

**A new failure mode this creates, and how it's guarded:** an accessible name that resolves to `undefined` or `""` still renders a control that looks completely normal and simply stops announcing itself — nothing else in the suite catches that. The smoke suite now asserts no visible control (at rest, and with the lightbox open) is missing an accessible name, skipping `aria-hidden` subtrees deliberately. Extend this check rather than re-deriving it if a future task adds a new interactive control.

This does not relax anything already shipped — §13 (accessibility), §41 (static-export correctness), and the defect list in §36 stay full-strength regardless of the template framing, because those are what make the demo credible in the first place, not overhead the demo framing lets you cut.

## 53 — SITE ORIGIN VS BASE PATH: A SECOND STATIC-EXPORT TRAP, EXTENDING §41 (Phase 04)

§41 already covers `basePath`/`assetPrefix` for routing and assets. Phase 04 found the same split has a second, separate trap for anything that needs a *full URL* rather than a route: `actions/configure-pages` reports `origin` (`https://user.github.io`) and `base_path` (`/repo-name`) as two outputs, and a project site only actually lives at the two joined. Building a canonical, an `og:url`, or a sitemap entry from `origin` alone produces a URL that resolves to whatever else that GitHub account publishes — **silently correct until the first canonical is added**, then actively wrong (a canonical pointing at the wrong site outranks having none, because it tells a search engine to index that page instead of this one).

Fixed once, centrally, in `src/lib/seo.ts` (`siteRoot = origin + basePath`, everything absolute goes through `absoluteUrl()`) — read that file's header comment for the full reasoning rather than repeating it here. The rule for any future code that needs a full URL: go through `src/lib/seo.ts`, never compose one from `NEXT_PUBLIC_SITE_URL` directly.

## 54 — SHAMIM: THIS REPO KEEPS THE ENGINE AND COLLAPSES THE ROUTES TO ONE PAGE (2026-09-24)

This repository is **SHAMIM**, a single-product fragrance launch derived from the PARNIAN template. Everything above this section is PARNIAN's history and is kept because the engine it describes is still the engine here. What changed:

* **Kept:** the static export (§41), the typed content layer behind `src/types/content.ts` (§28, §52), origin + base path composition (§53), the build, smoke and deploy pipeline, and exactly three runtime dependencies.
* **Collapsed:** the route architecture. There is `/` and `/404`, nothing else — no products, gallery or about routes, no nav, no menu, no list of anything. §19's five-page roadmap does not apply. The catalogue machinery was deleted, not adapted.
* **Added:** a scroll system with **no library and no scroll hijacking**. Three layers: (1) every word is in the served HTML at full opacity; (2) `position: sticky` holds the drawn SVG bottle and, on wide screens, the act numerals; (3) CSS scroll-driven animation (`animation-timeline: view()` and named view timelines widened with `timeline-scope`) where supported, with one `IntersectionObserver` as the fallback. No `scroll` handler drives anything visual, nothing calls `preventDefault` on wheel, touch or key, and `prefers-reduced-motion: reduce` switches layer 3 off entirely. See `src/app/motion.css`.
* **The ground is three colours, not one.** Each act opens with a text-free threshold where the ground changes and the act's photograph hangs as air, so no line of text ever sits on an in-between colour or on a photograph.
* **Typeface substitution, recorded here so it cannot go unreported:** the body face was specified as Readex Pro, whose cmap has no پ چ ژ گ ک ی and none of ۰–۹. It ships as **Alexandria**. The display face, Aref Ruqaa, passed the glyph check and ships as specified.

`scripts/verify.mjs` is the single verification pass for this page — contrast measured from composited pixels at five scroll positions, native-scroll assertions, JS-off and reduced-motion parity, glyph coverage from the served font files. Run it against a `build:pages` export.
