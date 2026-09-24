import Image from "next/image";
import type { Atmosphere as AtmosphereImage } from "@/types/content";
import { withBasePath } from "@/lib/basePath";
import { cn } from "@/lib/cn";

/**
 * A photograph used as air: faded at its edges, low in opacity, and hidden from
 * assistive technology because every word it could stand for is already on the
 * page. Never a full-bleed surface with text over it — that move belongs to
 * SHABANEH, and it is the one thing this page may not borrow.
 *
 * `withBasePath` because next/image does not prefix `src` when images are
 * unoptimised, and on a GitHub Pages project site that 404s every image.
 */
export function Atmosphere({
  image,
  className,
  eager = false,
}: {
  image: AtmosphereImage;
  className: string;
  eager?: boolean;
}) {
  return (
    <div className={cn("air", className)} aria-hidden="true">
      <Image
        src={withBasePath(image.src)}
        width={image.width}
        height={image.height}
        alt=""
        loading={eager ? "eager" : "lazy"}
      />
    </div>
  );
}
