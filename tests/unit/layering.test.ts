import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from 'vitest';

const files = readdirSync('src', { recursive: true, encoding: 'utf8' })
  .map((f) => f.replaceAll('\\', '/'))
  .filter((f) => /\.(ts|svelte)$/.test(f))
  .map((f) => ({ path: `src/${f}`, text: readFileSync(join('src', f), 'utf8') }));

const offenders = (pattern: RegExp, allowed: string[]) =>
  files.filter((f) => pattern.test(f.text) && !allowed.includes(f.path)).map((f) => relative('.', f.path));

// Comments stripped (a `//` after `:` is a link, not a comment). `x.fetch(` is another object's method; the global's own names still count.
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|(?<!:)\/\/.*/g, '');
const FETCH = /(?:^|[^.\w$]|\b(?:window|globalThis|self)\.)fetch\s*\(/m;

test('only http.ts calls fetch', () => {
  expect(files.filter((f) => FETCH.test(code(f.text)) && f.path !== 'src/lib/api/http.ts').map((f) => f.path)).toEqual([]);
  expect(['fetch(u)', 'await fetch (u)', 'window.fetch(u)', 'globalThis.fetch(u)', "'https://x'; fetch(u)"].filter((t) => !FETCH.test(code(t)))).toEqual([]);
  expect(['// fetch(u)', '/* fetch(u) */', '<!-- fetch(u) -->', 'cache.fetch(u)', 'prefetch(u)'].filter((t) => FETCH.test(code(t)))).toEqual([]);
});

test('only http.ts and store.ts touch device storage', () => {
  expect(
    offenders(/localStorage|sessionStorage|indexedDB|idb-keyval/, ['src/lib/api/http.ts', 'src/lib/data/store.ts']),
  ).toEqual([]);
});

test('the image host is named only in http.ts (one host rule)', () => {
  expect(offenders(/backblaze\.pixellab\.ai/, ['src/lib/api/http.ts'])).toEqual([]);
});
