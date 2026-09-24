/**
 * Persian digits.
 *
 * `useGrouping: false` is the point of this file. A bare
 * `toLocaleString("fa-IR")` inserts a thousands separator, so the copyright
 * year 2026 renders as ۲٬۰۲۶ — a year with a comma in it.
 */
const fa = new Intl.NumberFormat("fa-IR", { useGrouping: false });

export function faNumber(value: number): string {
  return fa.format(value);
}
