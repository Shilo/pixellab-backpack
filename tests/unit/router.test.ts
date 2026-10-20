import { expect, test } from 'vitest';
import { CATEGORIES } from '../../src/lib/categories';
import { parseRoute } from '../../src/lib/router.svelte';

test('home and the four categories parse', () => {
  expect(parseRoute('#/')).toEqual({ name: 'home' });
  for (const { id } of CATEGORIES) expect(parseRoute(`#/c/${id}`)).toEqual({ name: 'category', id });
  expect(parseRoute('#/c/ui/')).toEqual({ name: 'category', id: 'ui' });
});

test('unknown routes fall back to home', () => {
  for (const h of ['', '#', '#/c/', '#/c/maps', '#/c/objects/x', '#/c/toString', '#/nope', '#activity', 'garbage'])
    expect(parseRoute(h)).toEqual({ name: 'home' });
});
