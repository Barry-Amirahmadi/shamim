/**
 * Builds the static export exactly as GitHub Pages will serve it.
 *
 * Exists because setting an env var inline is not portable: cmd.exe has no
 * `VAR=x cmd` form, and Git Bash rewrites a leading-slash value into a Windows
 * path ("/shamim" -> "C:/Program Files/Git/shamim"), which the build then
 * rejects. Setting it here sidesteps both.
 *
 *   node scripts/build-pages.mjs            # defaults to the deployed base path
 *   node scripts/build-pages.mjs /other     # override
 */
import { spawnSync } from "node:child_process";

/** Matches the repository name — GitHub Pages serves a project site at /<repo>. */
const DEFAULT_BASE_PATH = "/shamim";

const basePath = process.argv[2] ?? DEFAULT_BASE_PATH;

console.log(`building static export with basePath "${basePath}"`);

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://barry-amirahmadi.github.io",
  },
});

process.exit(result.status ?? 1);
