import next from "eslint-config-next";
import nextTypescript from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

/**
 * Minimal and standard, per the Task 3 ruling — not a bespoke ruleset.
 *
 * TypeScript strict already catches type errors. What it does not catch is the
 * class of defect this project has actually shipped: accessibility regressions
 * (§36 defects 3, 4, 6, and the 20px breadcrumb found in Task 3) and dead code
 * paths (the `next lint` script that had never run). `jsx-a11y` is here for the
 * first of those specifically, and it is worth more on this project than any
 * stylistic rule would be.
 *
 * Note this is the only linter config: `next lint` was removed in Next 16, so
 * ESLint is invoked directly.
 */
const config = [
  { ignores: [".next/**", "out/**", "node_modules/**", "playwright-report/**", "test-results/**"] },

  ...next,
  ...nextTypescript,

  {
    // `eslint-config-next` already registers the jsx-a11y plugin with a partial
    // rule set, and a flat config may not register the same plugin twice. So the
    // recommended rules are spread in rather than the whole config object.
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // The codebase is deliberately comment-heavy and uses void elements and
      // logical properties rather than utility soup; nothing stylistic is
      // configured here on purpose. Only real-defect rules are tightened.
      "jsx-a11y/no-autofocus": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  {
    // Build and verification scripts are Node programs, not app code: they are
    // supposed to print to stdout, and they never render anything.
    files: ["scripts/**/*.mjs"],
    rules: { "no-console": "off" },
  },
];

export default config;
