/**
 * The bottle — drawn, not photographed.
 *
 * Inline SVG rather than an image file: no image weight, it takes the palette
 * from the stylesheet, it is crisp at any density, and it sits over three
 * changing grounds without the transparent-background problem a photographed
 * bottle would have. It cannot contain a typo either, because it contains no
 * text.
 *
 * Three shapes: the stopper, the collar and neck, the body. A confident outline
 * reads better at half a screen tall than a bad render does.
 *
 * Its liquid is a function of scroll — see `.bottle__liquid` and motion.css.
 * The whole thing is `aria-hidden` and holds nothing focusable: the act text
 * already says everything a screen reader needs.
 */

const BODY =
  "M106 122 C106 146 20 142 20 184 V476 Q20 510 54 510 H186 Q220 510 220 476 V184 C220 142 134 146 134 122 Z";
const NECK = "M98 72 H142 V92 H134 V122 H106 V92 H98 Z";
const STOPPER = "M90 6 Q90 0 96 0 H144 Q150 0 150 6 L156 64 Q157 72 149 72 H91 Q83 72 84 64 Z";
/* The liquid's surface is a shallow curve, not a ruled line. */
const LIQUID = "M0 262 Q120 248 240 262 V520 H0 Z";

export function Bottle() {
  return (
    <div className="bottle" data-bottle>
      <svg viewBox="0 0 240 520" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="shamim-bottle-body">
            <path d={BODY} />
          </clipPath>
        </defs>
        <path className="bottle__glass" d={BODY} />
        <path className="bottle__liquid" d={LIQUID} clipPath="url(#shamim-bottle-body)" />
        <path className="bottle__outline" d={BODY} />
        <path className="bottle__outline" d={NECK} />
        <path className="bottle__stopper" d={STOPPER} />
        <path className="bottle__glint" d="M44 206 V448" />
      </svg>
    </div>
  );
}
