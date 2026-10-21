import { readFileSync } from 'node:fs';
import { loadEnv } from 'vite';
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

export default defineConfig(({ command, mode }) => ({
  plugins: [svelte()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    // TEMPORARY debug (remove after Phase 3 testing): the dev server only; `vite build` always gets ''.
    __DEV_API_KEY__: JSON.stringify(command === 'serve' ? (loadEnv(mode, process.cwd(), '').API_KEY_OVERRIDE ?? '') : ''),
  },
  build: { assetsInlineLimit: 0 },
  preview: { headers },
  test: { include: ['tests/unit/**/*.test.ts'] },
}));
