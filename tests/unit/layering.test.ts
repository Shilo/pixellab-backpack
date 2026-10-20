import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from 'vitest';

const files = readdirSync('src', { recursive: true, encoding: 'utf8' })
  .map((f) => f.replaceAll('\\', '/'))
  .filter((f) => /\.(ts|svelte)$/.test(f))
  .map((f) => ({ path: `src/${f}`, text: readFileSync(join('src', f), 'utf8') }));

const offenders = (pattern: RegExp, allowed: string[]) =>
  files.filter((f) => pattern.test(f.text) && !allowed.includes(f.path)).map((f) => relative('.', f.path));

test('only http.ts calls fetch', () => {
  expect(offenders(/\bfetch\s*\(/, ['src/lib/api/http.ts'])).toEqual([]);
});

test('only http.ts and store.ts touch device storage', () => {
  expect(
    offenders(/localStorage|sessionStorage|indexedDB|idb-keyval/, ['src/lib/api/http.ts', 'src/lib/data/store.ts']),
  ).toEqual([]);
});

test('the image host is named only in http.ts (one host rule)', () => {
  expect(offenders(/backblaze\.pixellab\.ai/, ['src/lib/api/http.ts'])).toEqual([]);
});
