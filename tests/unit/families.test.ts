import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { createFamilies, dedupeTilesets, groupStates, type Transport } from '../../src/lib/api/families';
import { CATEGORIES } from '../../src/lib/categories';
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
  const log = { api: [] as string[], image: [] as string[], labels: [] as (string | undefined)[], users: [] as (boolean | undefined)[] };
  const t: Transport = {
    async apiGet<T>(path: string, o?: { label?: string; user?: boolean }) {
      log.api.push(path);
      log.labels.push(o?.label);
      log.users.push(o?.user);
      const base = path.split('?')[0];
      if (base.startsWith('/tiles-pro/')) return fixture('tiles-pro-detail') as T;
      if (base.startsWith('/characters/')) return fixture('character-detail') as T;
      if (base.startsWith('/objects/')) return fixture('object-detail') as T;
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

  test('maps a page to cards; unfinished are not done; malformed rows dropped; the top-level usage key is ignored', async () => {
    const { fam, log } = family(id);
    expect(fixture(CASES[id][0])).toHaveProperty('usage'); // real list answers carry it
    const page = await fam.list(0);
    expect(Object.keys(page).sort()).toEqual(['cards', 'total']);
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

  test('a failed picture request throws a real-answer HttpError (no retry here; callers keep it as a miss)', async () => {
    const f = fake();
    f.t.publicGet = async () => new Response('', { status: 423 });
    const fam = createFamilies(f.t).find((x) => x.id === 'tilesets')!;
    const card = (await fam.list(0)).cards[0];
    await expect(fam.art(card)).rejects.toMatchObject({ name: 'HttpError', kind: 'http', status: 423 });
  });
});

describe('list details', () => {
  test('offset and Activity labels', async () => {
    const { fam, log } = family('characters');
    await fam.list(0);
    await fam.list(99);
    await fam.list(100);
    expect(log.api).toEqual(['/characters?limit=100&offset=0', '/characters?limit=100&offset=99', '/characters?limit=100&offset=100']);
    expect(log.labels).toEqual(['Characters · first page', 'Characters · page 2', 'Characters · page 2']);
    const card = (await fam.list(0)).cards[0];
    await fam.art(card);
    expect(log.labels.at(-1)).toBe('Characters · picture');
  });

  // R14: next pages go ahead of pictures; first-page checks, Tiles Pro pictures and details keep their place.
  test('request priority: next pages and details are user requests; first page and Tiles Pro picture are not', async () => {
    const { fam, log } = family('characters');
    await fam.list(0);
    await fam.list(99);
    expect(log.users.map(Boolean)).toEqual([false, true]);
    const card = (await fam.list(0)).cards[0];
    log.users.length = 0;
    await fam.detail!(card);
    expect(log.users).toEqual([true]);

    const tp = family('tiles-pro');
    const tile = (await tp.fam.list(0)).cards[0];
    tp.log.users.length = 0;
    await tp.fam.art(tile);
    expect(tp.log.users.map(Boolean)).toEqual([false]);
  });

  test('an answer without a row list or total throws', async () => {
    await expect(family('ui', { ui: { total: 1 } }).fam.list(0)).rejects.toThrow();
    await expect(family('ui', { ui: { ui_assets: [] } }).fam.list(0)).rejects.toThrow();
  });

  test('helper URLs encode the id', async () => {
    const row = { id: 'a/b?c#d', name: 'x', status: 'completed' };
    for (const id of ['tilesets', 'tilesets-side', 'isometric'] as FamilyId[]) {
      const { fam, log } = family(id, { [id]: { [id === 'isometric' ? 'tiles' : 'tilesets']: [row], total: 1 } });
      await fam.art((await fam.list(0)).cards[0]);
      expect(log.api.at(-1)).toContain('/a%2Fb%3Fc%23d/');
    }
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

// family -> whitelisted meta fields (list rows may carry more; id and picture links never pass)
const META: Record<FamilyId, string[]> = {
  characters: 'name state_name prompt size directions view template_id tags created_at updated_at animation_count group_id status'.split(' '),
  objects: 'name state_name prompt size directions view tags created_at status'.split(' '),
  ui: 'name prompt size created_at'.split(' '),
  tilesets: 'name lower_description upper_description tile_size view created_at'.split(' '),
  'tilesets-side': 'name lower_description transition_description tile_size created_at'.split(' '),
  isometric: 'name description size tile_shape created_at'.split(' '),
  'tiles-pro': 'name description tile_type tile_size n_tiles tile_view created_at'.split(' '),
};
const ROWS: Record<FamilyId, string> = { characters: 'characters', objects: 'objects', ui: 'ui_assets', tilesets: 'tilesets', 'tilesets-side': 'tilesets', isometric: 'tiles', 'tiles-pro': 'tiles' };

describe('card meta', () => {
  test.each(Object.keys(META) as FamilyId[])('%s: whitelisted fields only, as sent, absent ones skipped', async (id) => {
    const extra = { id: 'm1', status: 'completed', preview_url: 'https://backblaze.pixellab.ai/x.png', image_url: 'https://backblaze.pixellab.ai/y.png', secret: 1 };
    const full: Record<string, unknown> = { ...extra, ...Object.fromEntries(META[id].map((k) => [k, k === 'status' ? 'completed' : `v-${k}`])) };
    const [a, b] = (await family(id, { [id]: { [ROWS[id]]: [full, { ...extra, name: 'only name' }], total: 2 } }).fam.list(0)).cards;
    expect(Object.keys(a.meta).sort()).toEqual([...META[id]].sort());
    for (const k of META[id]) expect(a.meta[k]).toBe(full[k]);
    expect(b.meta).toEqual(META[id].includes('status') ? { name: 'only name', status: 'completed' } : { name: 'only name' });
  });

  test('null fields are kept as sent', async () => {
    const card = (await family('characters').fam.list(0)).cards[0];
    expect(card.meta).toMatchObject({ state_name: null, group_id: null, updated_at: null, animation_count: 2, size: { width: 48, height: 48 } });
  });

  test('character fp changes with animation_count and updated_at; other families ignore them', async () => {
    const fpOf = async (id: FamilyId, patch: Record<string, unknown>) => {
      const e = fixture(CASES[id][0]);
      Object.assign((Object.values(e).find(Array.isArray) as Record<string, unknown>[])[0], patch);
      return (await family(id, { [id]: e }).fam.list(0)).cards[0].fp;
    };
    const base = await fpOf('characters', {});
    expect(await fpOf('characters', { animation_count: 3 })).not.toBe(base);
    expect(await fpOf('characters', { updated_at: '2026-02-01T00:00:00Z' })).not.toBe(base);
    expect(await fpOf('characters', { tags: ['x'] })).toBe(base);
    expect(await fpOf('objects', { animation_count: 3 })).toBe(await fpOf('objects', {}));
  });

  test('name is cut to 60 code points, never inside a surrogate pair', async () => {
    const face = String.fromCodePoint(0x1f600);
    const row = { id: 'u', name: face.repeat(61), status: 'completed', image_url: 'https://backblaze.pixellab.ai/u.png' };
    const card = (await family('ui', { ui: { ui_assets: [row], total: 1 } }).fam.list(0)).cards[0];
    expect(card.name).toBe(face.repeat(60));
  });
});

describe('detail', () => {
  test('only characters and objects have one', () => {
    expect(createFamilies(fake().t).filter((f) => f.detail).map((f) => f.id)).toEqual(['characters', 'objects']);
  });

  test('character: one labelled request, normalized (8 directions, sentence-cased name, string links only)', async () => {
    const { fam, log } = family('characters');
    const card = (await fam.list(0)).cards[0];
    log.api.length = 0;
    log.labels.length = 0;
    const d = await fam.detail!(card);
    expect(log.api).toEqual([`/characters/${card.id}`]);
    expect(log.labels).toEqual(['Characters · details']);
    expect(log.image).toHaveLength(0);
    const raw = fixture('character-detail');
    expect(d.rotations).toEqual(raw.rotation_urls);
    expect(Object.keys(d.rotations)).toHaveLength(8);
    expect(d.animations.map((a) => [a.name, a.type, a.description])).toEqual([
      ['Breathing idle', 'breathing-idle', null],
      ['Big Swing', 'cross-punch', null],
    ]);
    expect(Object.keys(d.animations[0].frames)).toHaveLength(8);
    expect(d.animations[0].frames.south).toEqual(raw.animations[0].directions[0].frames);
    expect(d.animations[1].frames).toEqual({ south: raw.animations[1].directions[0].frames.slice(0, 2) }); // null frame and empty direction dropped
    expect(d.extra).toEqual({ style_settings: raw.style_settings, guidance: 7.5, skeleton: true }); // ai_freedom null dropped
  });

  test('object: 1-direction rotation from storage_urls.unknown, frames from storage_urls.frames, description as name', async () => {
    const { fam, log } = family('objects');
    const card = (await fam.list(0)).cards[0];
    log.labels.length = 0;
    const d = await fam.detail!(card);
    expect(log.api.at(-1)).toBe(`/objects/${card.id}`);
    expect(log.labels).toEqual(['Objects · details']);
    const raw = fixture('object-detail');
    expect(d).toEqual({
      rotations: { unknown: raw.storage_urls.unknown },
      animations: [{ name: 'barrel rolling', type: null, description: 'barrel rolling', frames: { unknown: raw.animations[0].directions[0].storage_urls.frames } }],
      extra: {},
    });
  });

  test('object: no storage_urls.unknown falls back to the card picture; display_name wins', async () => {
    const f = fake();
    const raw = fixture('object-detail');
    delete raw.storage_urls.unknown;
    raw.animations[0].display_name = 'Roll';
    f.t.apiGet = async <T,>(path: string) => (path.startsWith('/objects/') ? raw : fixture('objects')) as T;
    const fam = createFamilies(f.t).find((x) => x.id === 'objects')!;
    const card = (await fam.list(0)).cards[0];
    const d = await fam.detail!(card);
    expect(d.rotations).toEqual({ unknown: card.thumb });
    expect(d.animations[0].name).toBe('Roll');
  });

  test('ids are encoded', async () => {
    const { fam, log } = family('characters');
    await fam.detail!({ id: 'a/b?c', done: true } as Card);
    expect(log.api.at(-1)).toBe('/characters/a%2Fb%3Fc');
  });

  test.each(['characters', 'objects'] as FamilyId[])('%s: refused for a card that is not done, with no request', async (id) => {
    const { fam, log } = family(id);
    const bad = (await fam.list(0)).cards.find((c) => !c.done)!;
    log.api.length = 0;
    await expect(fam.detail!(bad)).rejects.toThrow();
    expect(log.api).toHaveLength(0);
  });

  test('a malformed answer throws', async () => {
    const f = fake();
    f.t.apiGet = async <T,>() => null as T;
    await expect(createFamilies(f.t)[0].detail!({ id: 'x', done: true } as Card)).rejects.toThrow();
  });
});

test('groupStates keeps the first card per group_id; ungrouped pass through; order kept', () => {
  const c = (id: string, group_id?: string | null) => ({ id, meta: group_id === undefined ? {} : { group_id } }) as Card;
  const out = groupStates([c('a', null), c('b', 'g1'), c('c'), c('d', 'g1'), c('e', 'g2'), c('f', 'g2')]);
  expect(out.map((x) => x.id)).toEqual(['a', 'b', 'c', 'e']);
});
