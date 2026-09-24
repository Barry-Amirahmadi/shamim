import { object } from "@/content/page";
import { Atmosphere } from "./Atmosphere";

/**
 * The object: where the bottle stops moving.
 *
 * The bottle itself is not in this block — it is the sticky element on the
 * rail above, and the rail is cut so that its last stuck position is this
 * block's centre. On wide screens `.object__gap` is the empty row it lands in,
 * with the name above and the coda below.
 */
export function ObjectBlock() {
  return (
    <section className="object on-dark" data-section aria-labelledby="object-name">
      <Atmosphere image={object.image} className="object__air" />
      <div className="object__stage" data-section-inner>
        <div className="object__head">
          <p className="object__latin" lang="en" dir="ltr">
            {object.latin}
          </p>
          <h2 id="object-name" className="object__name" data-reveal>
            {object.name}
          </h2>
        </div>
        <div className="object__gap" aria-hidden="true" />
        <p className="object__coda" data-reveal>
          <span>{object.coda[0]}</span>
          <span>{object.coda[1]}</span>
        </p>
      </div>
    </section>
  );
}
