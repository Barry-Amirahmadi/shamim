/**
 * Static preview server — stands in for GitHub Pages.
 *
 * `next dev` and `next start` both hide static-export problems: they resolve
 * routes through Next's router rather than off disk, so a missing file, a wrong
 * base path or a broken 404 all look fine locally and fail only once deployed.
 * This serves the exported `out/` directory the way a dumb static host does, so
 * the export can actually be verified.
 *
 * Deliberately zero-dependency — Node built-ins only.
 *
 *   node scripts/serve-static.mjs --port 4321 --base /shamim
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "out");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const port = Number(flag("port", "4321"));
let base = flag("base", "").replace(/\/+$/, "");

// Git Bash on Windows rewrites a leading-slash argument into a native path
// ("/shamim" -> "C:/Program Files/Git/shamim"), which
// would otherwise show up as every single route 404ing for no visible reason.
if (/^[A-Za-z]:/.test(base)) {
  console.error(
    [
      `Base path arrived mangled as "${base}".`,
      "The shell rewrote it into a Windows path. Re-run with MSYS_NO_PATHCONV=1,",
      "or pass it without a leading slash: --base shamim",
    ].join("\n"),
  );
  process.exit(1);
}
if (base && !base.startsWith("/")) base = `/${base}`;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

async function readIfFile(path) {
  try {
    const s = await stat(path);
    if (!s.isFile()) return null;
    return await readFile(path);
  } catch {
    return null;
  }
}

/** Resolution order a static host uses: exact file, then directory index. */
async function resolve(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidates = [
    join(root, clean),
    join(root, clean, "index.html"),
    join(root, `${clean.replace(/\/$/, "")}.html`),
  ];
  for (const candidate of candidates) {
    if (!candidate.startsWith(root)) continue;
    const body = await readIfFile(candidate);
    if (body) return { body, path: candidate };
  }
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  let pathname = url.pathname;

  // Everything outside the base path is off-site, exactly as on GitHub Pages.
  if (base) {
    if (pathname === base) {
      res.writeHead(301, { location: `${base}/` });
      res.end();
      return;
    }
    if (!pathname.startsWith(`${base}/`)) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end(`Not under base path ${base}`);
      return;
    }
    pathname = pathname.slice(base.length);
  }

  const hit = await resolve(pathname || "/");
  if (hit) {
    res.writeHead(200, { "content-type": TYPES[extname(hit.path)] ?? "application/octet-stream" });
    res.end(hit.body);
    return;
  }

  // GitHub Pages serves /404.html for any unmatched path.
  const notFound = await readIfFile(join(root, "404.html"));
  res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
  res.end(notFound ?? "404");
});

server.listen(port, () => {
  console.log(`serving out/ at http://localhost:${port}${base || ""}/`);
});
