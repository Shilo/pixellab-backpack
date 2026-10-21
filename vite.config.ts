import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The `/*` block of public/_headers, so `vite preview` (and e2e) run under the production CSP.
const headers = Object.fromEntries(
  readFileSync('public/_headers', 'utf8')
    .split(/\r?\n(?=\S)/)[0] // first block is `/*`
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim().split(/:\s+(.*)/s).slice(0, 2)),
);

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

export default defineConfig({
  plugins: [svelte()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  // ponytail: no CSS minify — Vite 8's Lightning CSS minifier merges GlassKit's `backdrop-filter` into its `-webkit-` twin, which
  // Chromium ignores (no glass blur). ~69 KB more raw CSS; re-enable when the minifier keeps both.
  build: { assetsInlineLimit: 0, cssMinify: false, modulePreload: { polyfill: false } }, // no polyfill: the support floor has modulepreload (05 §10.2)
  preview: { headers },
  test: { include: ['tests/unit/**/*.test.ts'] },
});
