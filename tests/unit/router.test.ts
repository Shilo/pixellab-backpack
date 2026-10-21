import { expect, test, vi } from 'vitest';
import { CATEGORIES } from '../../src/lib/categories';
import { parseRoute, pathOf, scopeOf, screenOf, type Route } from '../../src/lib/router.svelte';

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

test('all and home viewer routes round trip', () => {
  const key = '0123456789ab';
  expect(parseRoute('#/all')).toEqual({ name: 'all' });
  expect(parseRoute(`#/all/a/${key}`)).toEqual({ name: 'all', key });
  expect(parseRoute(`#/a/${key}`)).toEqual({ name: 'home', key });
  const cases: [Route, string][] = [
    [{ name: 'home' }, '#/'],
    [{ name: 'home', key }, `#/a/${key}`],
    [{ name: 'all' }, '#/all'],
    [{ name: 'all', key }, `#/all/a/${key}`],
    [{ name: 'category', id: 'ui' }, '#/c/ui'],
    [{ name: 'category', id: 'ui', key }, `#/c/ui/a/${key}`],
  ];
  for (const [r, path] of cases) {
    expect(pathOf(r)).toBe(path);
    expect(parseRoute(path)).toEqual(r);
  }
});

test('invalid keys give the screen without a key', () => {
  for (const k of ['toString', '0123456789a', '0123456789abc', '0123456789AB', '123e4567-e89b-12d3-a456-426614174000']) {
    expect(parseRoute(`#/c/characters/a/${k}`)).toEqual({ name: 'category', id: 'characters' });
    expect(parseRoute(`#/all/a/${k}`)).toEqual({ name: 'all' });
    expect(parseRoute(`#/a/${k}`)).toEqual({ name: 'home' });
  }
  expect(parseRoute('#/c/maps/a/0123456789ab')).toEqual({ name: 'home' });
});

test('malformed all and home forms are home', () => {
  for (const h of ['#/all/x', '#/allx', '#/a/', '#/all/a/', '#/a']) expect(parseRoute(h)).toEqual({ name: 'home' });
});

test('screenOf drops the key and scopeOf names the scope', () => {
  const key = '0123456789ab';
  expect(screenOf({ name: 'home', key })).toEqual({ name: 'home' });
  expect(screenOf({ name: 'all', key })).toEqual({ name: 'all' });
  expect(screenOf({ name: 'category', id: 'ui', key })).toEqual({ name: 'category', id: 'ui' });
  expect(scopeOf({ name: 'home' })).toBe('all');
  expect(scopeOf({ name: 'all', key })).toBe('all');
  expect(scopeOf({ name: 'category', id: 'tiles', key })).toBe('tiles');
});

// A fake address bar: history stack + location.hash, firing hashchange like a browser (only when the hash differs).
async function fakeBar(start: string) {
  const stack = [start];
  let at = 0;
  let onHash = () => {};
  const fire = (from: string) => stack[at] !== from && onHash();
  vi.stubGlobal('location', {
    get hash() {
      return stack[at];
    },
    set hash(h: string) {
      const from = stack[at];
      stack.splice(at + 1, Infinity, h);
      at++;
      fire(from);
    },
  });
  vi.stubGlobal('history', {
    state: null,
    replaceState: (_s: unknown, _t: string, url: string) => void (stack[at] = url),
    back: () => {
      const from = stack[at];
      at--;
      fire(from);
    },
  });
  vi.stubGlobal('addEventListener', (_: string, f: () => void) => void (onHash = f));
  vi.resetModules();
  const m = await import('../../src/lib/router.svelte');
  return { m, stack: () => stack.slice(0, at + 1) };
}

test('Activity over the viewer: closing Activity then the viewer lands on the grid', async () => {
  const key = '0123456789ab';
  const { m, stack } = await fakeBar('#/c/characters');
  m.go(`#/c/characters/a/${key}`);
  expect(m.router.route).toEqual({ name: 'category', id: 'characters', key });
  m.go('#activity');
  expect(m.router.activity).toBe(true);
  m.closeActivity();
  expect(m.router.activity).toBe(false);
  expect(stack()).toEqual(['#/c/characters', `#/c/characters/a/${key}`]);
  expect(m.router.route).toEqual({ name: 'category', id: 'characters', key });
  m.closeViewer();
  expect(m.router.route).toEqual({ name: 'category', id: 'characters' });
  expect(stack().at(-1)).toBe('#/c/characters');
  vi.unstubAllGlobals();
});

test('viewer over home: Back when pushed from #/, else the address is replaced; prev/next replace in place', async () => {
  const [k1, k2] = ['0123456789ab', 'ba9876543210'];
  const pushed = await fakeBar('#/');
  pushed.m.go(`#/a/${k1}`);
  pushed.m.replaceViewer(k2);
  expect(pushed.m.router.route).toEqual({ name: 'home', key: k2 });
  expect(pushed.stack()).toEqual(['#/', `#/a/${k2}`]);
  pushed.m.closeViewer();
  expect(pushed.m.router.route).toEqual({ name: 'home' });
  expect(pushed.stack()).toEqual(['#/']);

  const direct = await fakeBar(`#/all/a/${k1}`);
  expect(direct.m.router.route).toEqual({ name: 'all', key: k1 });
  direct.m.closeViewer();
  expect(direct.m.router.route).toEqual({ name: 'all' });
  expect(direct.stack()).toEqual(['#/all']);
  vi.unstubAllGlobals();
});

test('viewer over All assets: pushed from #/all steps back to it', async () => {
  const key = '0123456789ab';
  const { m, stack } = await fakeBar('#/all');
  m.go(`#/all/a/${key}`);
  m.closeViewer();
  expect(m.router.route).toEqual({ name: 'all' });
  expect(stack()).toEqual(['#/all']);
  vi.unstubAllGlobals();
});

const FID = 'abcdef012345';
const KEY = '0123456789ab';

test('favorites and folder routes round trip', () => {
  const cases: [Route, string][] = [
    [{ name: 'fav' }, '#/fav'],
    [{ name: 'fav', key: KEY }, `#/fav/a/${KEY}`],
    [{ name: 'folder', id: FID }, `#/f/${FID}`],
    [{ name: 'folder', id: FID, key: KEY }, `#/f/${FID}/a/${KEY}`],
  ];
  for (const [r, path] of cases) {
    expect(pathOf(r)).toBe(path);
    expect(parseRoute(path)).toEqual(r);
    expect(parseRoute(`${path}/`)).toEqual(r);
    expect(scopeOf(r)).toBe('all');
  }
  expect(screenOf({ name: 'fav', key: KEY })).toEqual({ name: 'fav' });
  expect(screenOf({ name: 'folder', id: FID, key: KEY })).toEqual({ name: 'folder', id: FID });
});

test('bad folder ids and malformed fav and folder forms', () => {
  for (const id of ['toString', FID.slice(1), `${FID}0`, FID.toUpperCase(), '123e4567-e89b-12d3-a456-426614174000'])
    expect(parseRoute(`#/f/${id}`)).toEqual({ name: 'home' });
  for (const h of ['#/favx', '#/f/', '#/f', '#/fav/x', '#/fav/a/', `#/f/${FID}/x`]) expect(parseRoute(h)).toEqual({ name: 'home' });
  expect(parseRoute('#/fav/a/toString')).toEqual({ name: 'fav' });
  expect(parseRoute(`#/f/${FID}/a/0123456789A`)).toEqual({ name: 'folder', id: FID });
});

test('closeFolder: Back when this tab went from home to the folder, else the address is replaced', async () => {
  const pushed = await fakeBar('#/');
  pushed.m.go(`#/f/${FID}`);
  expect(pushed.m.router.route).toEqual({ name: 'folder', id: FID });
  pushed.m.closeFolder();
  expect(pushed.m.router.route).toEqual({ name: 'home' });
  expect(pushed.stack()).toEqual(['#/']);

  const direct = await fakeBar(`#/f/${FID}`);
  direct.m.closeFolder();
  expect(direct.m.router.route).toEqual({ name: 'home' });
  expect(direct.stack()).toEqual(['#/']);
  vi.unstubAllGlobals();
});

test('closeFolder still uses Back after a viewer was opened and closed in the folder', async () => {
  const { m, stack } = await fakeBar('#/');
  m.go(`#/f/${FID}`);
  m.go(`#/f/${FID}/a/${KEY}`);
  history.back();
  expect(m.router.route).toEqual({ name: 'folder', id: FID });
  m.closeFolder();
  expect(m.router.route).toEqual({ name: 'home' });
  expect(stack()).toEqual(['#/']);
  vi.unstubAllGlobals();
});

test('closeViewer on a folder viewer pushed from the folder steps back to it', async () => {
  const { m, stack } = await fakeBar('#/');
  m.go(`#/f/${FID}`);
  m.go(`#/f/${FID}/a/${KEY}`);
  m.closeViewer();
  expect(m.router.route).toEqual({ name: 'folder', id: FID });
  expect(stack()).toEqual(['#/', `#/f/${FID}`]);
  vi.unstubAllGlobals();
});
