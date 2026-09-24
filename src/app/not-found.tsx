import Link from "next/link";
import { notFound } from "@/content/page";

/** Exported as `404.html`, which GitHub Pages serves for any unmatched path. */
export default function NotFound() {
  return (
    <section className="lost" aria-labelledby="lost-title">
      <h1 id="lost-title" className="lost__title">
        {notFound.heading}
      </h1>
      <p className="lost__lead">{notFound.lead}</p>
      <Link className="lost__link" href={notFound.action.href}>
        {notFound.action.label}
      </Link>
    </section>
  );
}
