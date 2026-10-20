import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { CATEGORIES, createFamilies, dedupeTilesets, type Transport } from '../../src/lib/api/families';
import type { Card, FamilyId } from '../../src/lib/types';

const fixture = (name: string) => JSON.parse(readFileSync(`tests/fixtures/rest/${name}.json`, 'utf8'));

// family id -> [fixture file, list path, rows, total, done flags]
const CASES: Record<FamilyId, [string, string, number, boolean[]]> = {
  characters: ['characters', '/characters', 100, [true, true, false]],
  objects: ['objects', '/objects', 100, [true, true, false]],
  ui: ['ui', '/ui-assets', 100, [true, false]],
  tilesets: ['tilesets', '/tilesets', 100, [true, true, false, false]],
  'tilesets-side': ['tilesets-side', '/tilesets-sidescroller', 50, [true, false]],
  isometric: ['isometric', '/isometric-tiles', 100, [true, false, true]],
  'tiles-pro': ['tiles-pro', '/tiles-pro', 50, [true, false, false]],
};

/** Fake transport: counts API-counted calls (apiGet, or publicGet with api:true) and image-host calls. */
function fake(lists: Record<string, unknown> = {}) {
  const log = { api: [] as string[], image: [] as string[], labels: [] as (string | undefined)[] };
  const t: Transport = {
    async apiGet<T>(path: string, o?: { label?: string }) {
      log.api.push(path);
      log.labels.push(o?.label);
      const base = path.split('?')[0];
      if (base.startsWith('/tiles-pro/')) return fixture('tiles-pro-detail') as T;
      const hit = Object.entries(CASES).find(([, c]) => c[1] === base);
      return (lists[hit![0]] ?? fixture(hit![1][0])) as T;
    },
    async publicGet(url: string, o?: { api?: boolean; label?: string }) {
      (o?.api ? log.api : log.image).push(url);
      log.labels.push(o?.label);
      const res = new Response(new Blob(['png']), { status: 200 });
      // fetch sets res.url to the final (post-redirect) link; a constructed Response has none.
      Object.defineProperty(res, 'url', { value: o?.api ? 'https://backblaze.pixellab.ai/final/sheet.png?t=1' : url });
      return res;
    },
  };
  return { t, log };
}

const family = (id: FamilyId, lists?: Record<string, unknown>) => {
  const f = fake(lists);
  return { ...f, fam: createFamilies(f.t).find((x) => x.id === id)! };
};

describe.each(Object.keys(CASES) as FamilyId[])('%s', (id) => {
  const [, path, pageSize, dones] = CASES[id];

  test('maps a page to cards; unfinished are not done; malformed rows dropped', async () => {
    const { fam, log } = family(id);
    const page = await fam.list(0);
    expect(fam.pageSize).toBe(pageSize);
    expect(page.cards).toHaveLength(dones.length);
    expect(page.cards.map((c) => c.done)).toEqual(dones);
    expect(page.total).toBe(fixture(CASES[id][0]).total);
    expect(log.api).toEqual([`${path}?limit=${pageSize}&offset=0`]);
    expect(new Set(page.cards.map((c) => c.key)).size).toBe(dones.length);
    for (const c of page.cards) expect(c.key).toMatch(/^[0-9a-f]{12}$/);
  });

  test('keys are stable and fp changes with name, status or picture link', async () => {
    const a = (await family(id).fam.list(0)).cards;
    const b = (await family(id).fam.list(0)).cards;
    expect(b.map((c) => c.key)).toEqual(a.map((c) => c.key));
    expect(b.map((c) => c.fp)).toEqual(a.map((c) => c.fp));

    const edited = fixture(CASES[id][0]);
    const rows: Record<string, unknown>[] = Object.values(edited).find(Array.isArray) as never;
    const base = rows[0];
    const fpOf = async (patch: Record<string, unknown>) => {
      const e = structuredClone(edited);
      const r: Record<string, unknown>[] = Object.values(e).find(Array.isArray) as never;
      Object.assign(r[0], patch);
      return (await family(id, { [id]: e }).fam.list(0)).cards[0];
    };
    const renamed = await fpOf({ name: 'Renamed' });
    const restatus = await fpOf({ status: 'failed' });
    expect(renamed.key).toBe(a[0].key);
    expect(renamed.fp).not.toBe(a[0].fp);
    expect(restatus.fp).not.toBe(a[0].fp);
    const thumbField = ['preview_url', 'image_url'].find((k) => k in base);
    if (thumbField) expect((await fpOf({ [thumbField]: 'https://backblaze.pixellab.ai/new.png' })).fp).not.toBe(a[0].fp);
  });

  test('art is refused for a card that is not done, with no request', async () => {
    const { fam, log } = family(id);
    const cards = (await fam.list(0)).cards;
    log.api.length = 0;
    const bad = cards.find((c) => !c.done)!;
    await expect(fam.art(bad)).rejects.toThrow();
    expect(log.api).toHaveLength(0);
    expect(log.image).toHaveLength(0);
  });
});

describe('art cost', () => {
  const costly: FamilyId[] = ['tilesets', 'tilesets-side', 'isometric', 'tiles-pro'];
  test('artCostsApi is true only for the four costly families', () => {
    const f = createFamilies(fake().t);
    expect(f.filter((x) => x.artCostsApi).map((x) => x.id)).toEqual(costly);
    expect(f).toHaveLength(7);
  });

  test.each(['characters', 'objects', 'ui'] as FamilyId[])('%s: cheap art asks only the image host', async (id) => {
    const { fam, log } = family(id);
    const card = (await fam.list(0)).cards[0];
    log.api.length = 0;
    const art = await fam.art(card);
    expect(log.api).toHaveLength(0);
    expect(log.image).toEqual([card.thumb]);
    expect(art.blob.size).toBe(3);
    expect(art.thumb).toBeUndefined();
  });

  test.each([
    ['tilesets', '/mcp/tilesets/'],
    ['tilesets-side', '/mcp/sidescroller-tilesets/'],
    ['isometric', '/mcp/isometric-tile/'],
  ] as [FamilyId, string][])('%s: one API-counted helper request, resolved link returned', async (id, prefix) => {
    const { fam, log } = family(id);
    const card = (await fam.list(0)).cards[0];
    log.api.length = 0;
    const art = await fam.art(card);
    expect(log.api).toHaveLength(1);
    expect(log.api[0]).toBe(`https://api.pixellab.ai${prefix}${card.id}/${id === 'isometric' ? 'download' : 'image'}`);
    expect(log.image).toHaveLength(0);
    expect(art.thumb).toBe('https://backblaze.pixellab.ai/final/sheet.png?t=1');
    expect(art.blob.size).toBe(3);
  });

  test('tiles-pro: one detail GET, then the picture from the image host', async () => {
    const { fam, log } = family('tiles-pro');
    const card = (await fam.list(0)).cards[0];
    log.api.length = 0;
    const art = await fam.art(card);
    expect(log.api).toEqual([`/tiles-pro/${card.id}`]);
    expect(art.thumb).toBe(fixture('tiles-pro-detail').storage_urls.tile_0);
    expect(log.image).toEqual([art.thumb]);
  });

  test('a failed picture request throws (no retry here)', async () => {
    const f = fake();
    f.t.publicGet = async () => new Response('', { status: 423 });
    const fam = createFamilies(f.t).find((x) => x.id === 'tilesets')!;
    const card = (await fam.list(0)).cards[0];
    await expect(fam.art(card)).rejects.toThrow(/423/);
  });
});

describe('list details', () => {
  test('offset and Activity labels', async () => {
    const { fam, log } = family('characters');
    await fam.list(0);
    await fam.list(99);
    await fam.list(100);
    expect(log.api).toEqual(['/characters?limit=100&offset=0', '/characters?limit=100&offset=99', '/characters?limit=100&offset=100']);
    expect(log.labels).toEqual(['Characters · page 1', 'Characters · page 2', 'Characters · page 2']);
    const card = (await fam.list(0)).cards[0];
    await fam.art(card);
    expect(log.labels.at(-1)).toBe('Characters · picture');
  });

  test('an answer without a row list or total throws', async () => {
    await expect(family('ui', { ui: { total: 1 } }).fam.list(0)).rejects.toThrow();
    await expect(family('ui', { ui: { ui_assets: [] } }).fam.list(0)).rejects.toThrow();
  });

  test('keys differ across families for the same id', async () => {
    const row = { id: 'same-id', name: 'x', status: 'completed' };
    const a = await family('tilesets', { tilesets: { tilesets: [row], total: 1 } }).fam.list(0);
    const b = await family('tilesets-side', { 'tilesets-side': { tilesets: [row], total: 1 } }).fam.list(0);
    expect(a.cards[0].key).not.toBe(b.cards[0].key);
  });
});

test('categories', () => {
  expect(CATEGORIES.map((c) => [c.id, c.families])).toEqual([
    ['characters', ['characters']],
    ['objects', ['objects']],
    ['tiles', ['tilesets', 'tilesets-side', 'isometric', 'tiles-pro']],
    ['ui', ['ui']],
  ]);
});

test('dedupeTilesets drops top-down cards whose id is also in the sidescroller list', () => {
  const c = (id: string) => ({ id }) as Card;
  expect(dedupeTilesets([c('a'), c('b'), c('c')], [c('b'), c('z')]).map((x) => x.id)).toEqual(['a', 'c']);
  expect(dedupeTilesets([c('a')], [])).toHaveLength(1);
});
