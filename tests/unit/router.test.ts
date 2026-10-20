import { expect, test } from 'vitest';
import { CATEGORIES } from '../../src/lib/categories';
import { parseRoute, pathOf } from '../../src/lib/router.svelte';

test('home and the four categories parse', () => {
  expect(parseRoute('#/')).toEqual({ name: 'home' });
  for (const { id } of CATEGORIES) expect(parseRoute(`#/c/${id}`)).toEqual({ name: 'category', id });
  expect(parseRoute('#/c/ui/')).toEqual({ name: 'category', id: 'ui' });
});

test('unknown routes fall back to home', () => {
  for (const h of ['', '#', '#/c/', '#/c/maps', '#/c/objects/x', '#/c/toString', '#/nope', '#activity', 'garbage'])
    expect(parseRoute(h)).toEqual({ name: 'home' });
});

test('viewer route round trips', () => {
  const key = '0123456789ab';
  expect(parseRoute(`#/c/characters/a/${key}`)).toEqual({ name: 'category', id: 'characters', key });
  expect(parseRoute(`#/c/ui/a/${key}/`)).toEqual({ name: 'category', id: 'ui', key });
  for (const r of [{ name: 'home' }, { name: 'category', id: 'objects' }, { name: 'category', id: 'characters', key }] as const)
    expect(parseRoute(pathOf(r))).toEqual(r);
  expect(pathOf({ name: 'home' })).toBe('#/');
  expect(pathOf({ name: 'category', id: 'objects' })).toBe('#/c/objects');
  expect(pathOf({ name: 'category', id: 'characters', key })).toBe(`#/c/characters/a/${key}`);
});

test('invalid keys give the category without a key', () => {
  for (const k of ['toString', '0123456789a', '0123456789abc', '0123456789AB', '123e4567-e89b-12d3-a456-426614174000'])
    expect(parseRoute(`#/c/characters/a/${k}`)).toEqual({ name: 'category', id: 'characters' });
  expect(parseRoute('#/c/maps/a/0123456789ab')).toEqual({ name: 'home' });
});
