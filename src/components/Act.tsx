import type { ActContent } from "@/types/content";
import { faNumber } from "@/lib/digits";
import { Atmosphere } from "./Atmosphere";

/**
 * One act of the descent. The page renders three of these from three records;
 * everything that differs between them — ground, ink, weight, size — is keyed
 * off `data-tier` in the stylesheet, not branched on here.
 *
 * The threshold at the top is text-free on purpose. It is where the ground
 * changes colour and where the act's photograph hangs, so no line of text ever
 * sits on a colour between two tokens, or on a photograph.
 *
 * `data-note` is read by RevealObserver in browsers without scroll timelines,
 * to set the bottle's liquid for the act in view.
 */
export function Act({ act }: { act: ActContent }) {
  const headingId = `act-${act.tier}`;

  return (
    <section
      className={act.tier === "base" ? "act on-dark" : "act"}
      data-tier={act.tier}
      data-note={act.tier}
      data-section
      aria-labelledby={headingId}
    >
      <div className="act__threshold">
        <Atmosphere image={act.image} className="act__air" />
      </div>

      <div className="act__stage" data-section-inner>
        {/* The order is already carried by the heading; this is its shape. */}
        <p className="act__numeral" aria-hidden="true">
          {faNumber(act.order)}
        </p>

        <div className="act__text">
          <h2 id={headingId} className="act__name" data-reveal>
            {act.name}
          </h2>
          <ul className="act__notes">
            {act.notes.map((note) => (
              <li key={note} data-reveal>
                {note}
              </li>
            ))}
          </ul>
          <p className="act__sentence" data-reveal>
            {act.sentence}
          </p>
        </div>
      </div>
    </section>
  );
}
