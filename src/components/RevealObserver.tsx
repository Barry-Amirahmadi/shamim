"use client";

import { useEffect } from "react";

/**
 * The fallback half of layer 3, for browsers without scroll timelines.
 *
 * One IntersectionObserver for the whole page. It walks `[data-reveal]` and
 * adds `.in-view`, and it watches the three acts to set `data-note` on the
 * descent, which picks the bottle's liquid colour. CSS transitions do all the
 * moving. There is no `scroll` listener, and nothing here can prevent,
 * delay or redirect a scroll.
 *
 * Only elements still below the fold are armed. Text already on screen is
 * never held back, and a page whose script fails to load has nothing armed at
 * all — every word stays where the served HTML put it.
 */
export function RevealObserver() {
  useEffect(() => {
    const timelines = CSS.supports("animation-timeline: view()");
    const scoped = timelines && CSS.supports("timeline-scope: none");
    if (timelines && scoped) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    const descent = document.querySelector<HTMLElement>("[data-descent]");
    const acts = scoped ? [] : [...document.querySelectorAll<HTMLElement>("[data-note]")];
    const armed = timelines
      ? []
      : [...document.querySelectorAll<HTMLElement>("[data-reveal]")].filter(
          (el) => el.getBoundingClientRect().top > window.innerHeight,
        );

    const pickNote = () => {
      if (!descent || acts.length === 0) return;
      const middle = window.innerHeight / 2;
      let note = acts[0].dataset.note;
      for (const act of acts) {
        if (act.getBoundingClientRect().top < middle) note = act.dataset.note;
      }
      if (note) descent.dataset.note = note;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting && el.hasAttribute("data-reveal")) {
            el.classList.add("in-view");
            observer.unobserve(el);
          }
        }
        pickNote();
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const el of armed) {
      el.classList.add("is-armed");
      observer.observe(el);
    }
    for (const act of acts) observer.observe(act);
    pickNote();

    return () => observer.disconnect();
  }, []);

  return null;
}
