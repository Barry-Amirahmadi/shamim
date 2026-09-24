import { acts } from "@/content/page";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import { Opening } from "@/components/Opening";
import { Act } from "@/components/Act";
import { Bottle } from "@/components/Bottle";
import { ObjectBlock } from "@/components/ObjectBlock";
import { Coda } from "@/components/Coda";
import { RevealObserver } from "@/components/RevealObserver";

/**
 * The whole site: one page, one product, one scroll.
 *
 *   Opening    open ground    the wordmark, one line
 *   Act I      open ground    نت آغازین
 *   Act II     → heart        نت میانی  — one step heavier, one step larger
 *   Act III    → base (dark)  نت پایه   — heaviest, largest, ink inverts
 *   Object     base           the bottle comes to rest
 *   Coda       base           اطلاع از عرضه
 *   Footer     base           (in the layout)
 *
 * The bottle is the one thing that persists: it rides a rail spanning the acts
 * and the object, held by `position: sticky`, while everything else moves past.
 */
export const metadata = pageMetadata({
  description: site.seo.description,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <Opening />
      <div className="descent" data-descent data-note="open">
        <div className="descent__rail" aria-hidden="true">
          <Bottle />
        </div>
        {acts.map((act) => (
          <Act key={act.tier} act={act} />
        ))}
        <ObjectBlock />
      </div>
      <Coda />
      <RevealObserver />
    </>
  );
}
