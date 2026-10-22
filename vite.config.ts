import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { localSameOrigin } from './agent-key.ts';

// The `/*` block of public/_headers, so `vite preview` (and e2e) run under the production CSP.
const headers = Object.fromEntries(
  readFileSync('public/_headers', 'utf8')
    .split(/\r?\n(?=\S)/)[0] // first block is `/*`
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim().split(/:\s+(.*)/s).slice(0, 2)),
);

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

// GitHub Pages ignores public/_headers, so the built index.html carries the same CSP (and Referrer-Policy) as <meta> tags.
// A meta CSP can't carry frame-ancestors, report-uri or sandbox, so they are dropped there; the other headers have no <meta>
// form. Build only: the dev server sends no CSP.
function headersMeta(): Plugin {
  const csp = headers['Content-Security-Policy']
    .split(/;\s*/)
    .filter((d: string) => !/^(frame-ancestors|report-uri|sandbox)\b/.test(d))
    .join('; ');
  return {
    name: 'backpack-headers-meta',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' },
      { tag: 'meta', attrs: { name: 'referrer', content: headers['Referrer-Policy'] }, injectTo: 'head-prepend' },
    ],
  };
}

// AI-agent testing only (AGENTS.md "Agent testing"): serves PIXELLAB_TOKEN_AGENT_DEV from the repo-root .env at
// /__dev/pixellab-key. Registered only for `npm run dev:agent`; read server-side per request, never through Vite's env.
function agentKey(): Plugin {
  return {
    name: 'backpack-agent-key',
    configureServer(server) {
      server.middlewares.use('/__dev/pixellab-key', (req, res) => {
        res.setHeader('cache-control', 'no-store');
        if (!localSameOrigin(req)) {
          res.statusCode = 403;
          return res.end();
        }
        let key = '';
        try {
          key = readFileSync(join(server.config.root, '.env'), 'utf8').match(/^PIXELLAB_TOKEN_AGENT_DEV=(.*)$/m)?.[1]?.trim() ?? '';
        } catch {
          /* no .env: 404 */
        }
        res.statusCode = key ? 200 : 404;
        res.end(key);
      });
    },
  };
}

export default defineConfig(({ command, mode }) => {
  if (command === 'build' && mode === 'agent') throw new Error('mode "agent" is dev-server only; never build with it');
  return {
    base: './', // hash routes: the build works under any sub-path, such as GitHub Pages' /<repo>/
    envDir: false, // never load .env files: nothing reaches import.meta.env, in any mode
    plugins: [svelte(), headersMeta(), command === 'serve' && mode === 'agent' && agentKey()],
    define: { __APP_VERSION__: JSON.stringify(version) },
    // ponytail: no CSS minify — Vite 8's Lightning CSS minifier merges GlassKit's `backdrop-filter` into its `-webkit-` twin, which
    // Chromium ignores (no glass blur). ~69 KB more raw CSS; re-enable when the minifier keeps both.
    build: { assetsInlineLimit: 0, cssMinify: false, modulePreload: { polyfill: false } }, // no polyfill: the support floor has modulepreload (05 §10.2)
    preview: { headers },
    test: { include: ['tests/unit/**/*.test.ts'] },
  };
});
