/**
 * Post-build fix for dynamic-route RSC payload paths in a static export.
 *
 * Next 16 writes the prefetch payload for a dynamic route into a nested
 * directory:
 *
 *   out/products/shab/__next.products/$d$slug/__PAGE__.txt
 *
 * but the client asks for the same payload as a flat, dot-separated filename:
 *
 *   out/products/shab/__next.products.$d$slug.__PAGE__.txt
 *
 * A Node server resolves that through the router. A static host cannot, so
 * every product page load and every link prefetch 404s. Static routes are not
 * affected — they already get the flat name the client expects.
 *
 * This copies each nested payload to the flat name alongside it. The nested
 * originals are left in place, so nothing that already worked can break.
 *
 * Failure mode if a future Next release changes the convention: this finds
 * nothing, writes nothing, and the behaviour reverts to the 404 it fixes
 * today. It cannot make the output worse.
 *
 * Runs automatically as `postbuild`.
 */
import { readdir, copyFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "out");
const PAYLOAD_DIR = /^__next\./;

/** Every file beneath `dir`, as paths relative to it. */
async function filesUnder(dir, prefix = []) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const next = [...prefix, entry.name];
    if (entry.isDirectory()) {
      found.push(...(await filesUnder(join(dir, entry.name), next)));
    } else {
      found.push(next);
    }
  }
  return found;
}

async function walk(dir) {
  let copied = 0;

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);

    if (PAYLOAD_DIR.test(entry.name)) {
      for (const parts of await filesUnder(full)) {
        // "__next.products" + "." + "$d$slug.__PAGE__.txt"
        const flat = `${entry.name}.${parts.join(".")}`;
        await copyFile(join(full, ...parts), join(dir, flat));
        copied += 1;
      }
    }

    copied += await walk(full);
  }

  return copied;
}

const copied = await walk(out).catch((error) => {
  console.error(`flatten-rsc-payloads: ${error.message}`);
  process.exit(1);
});

console.log(
  copied > 0
    ? `flatten-rsc-payloads: wrote ${copied} flat payload${copied === 1 ? "" : "s"}`
    : "flatten-rsc-payloads: nothing to flatten (no nested __next.* payloads found)",
);
