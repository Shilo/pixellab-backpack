import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FamilyId } from '../../src/lib/types';
import type { Snap } from '../../src/lib/data/org.svelte';

// Fake PixelLab lists, fake network module and fake device storage that outlive a "tab" (vi.resetModules).
const h = vi.hoisted(() => {
  class HttpError extends Error {
    kind: string;
    status?: number;
    constructor(kind: string, status?: number) {
      super(kind);
      this.kind = kind;
      this.status = status;
    }
  }
  const st = {
    key: null as string | null,
    kept: false,
    statusCb: null as ((s: string) => void) | null,
    signedOutCb: null as (() => void) | null,
    fail: null as HttpError | null,
    db: new Map<string, unknown>(),
    lists: {} as Record<string, { total: number; rows: Record<string, unknown>[] }>,
  };
  // family id -> [list path, rows field, picture field]
  const SHAPE: Record<string, [string, string, string?]> = {
    characters: ['/characters', 'characters', 'preview_url'],
    objects: ['/objects', 'objects', 'preview_url'],
    ui: ['/ui-assets', 'ui_assets', 'image_url'],
    tilesets: ['/tilesets', 'tilesets'],
    'tilesets-side': ['/tilesets-sidescroller', 'tilesets'],
    isometric: ['/isometric-tiles', 'tiles'],
    'tiles-pro': ['/tiles-pro', 'tiles'],
  };
  const img = (id: string) => `https://backblaze.pixellab.ai/x/${id}.png`;
  return {
    HttpError,
    st,
    SHAPE,
    img,
    apiGet: vi.fn(async (path: string, _o?: unknown) => {
      if (st.fail) {
        if (st.fail.kind === 'key-lost') st.statusCb?.('key-lost');
        throw st.fail;
      }
      const [base, query = ''] = path.split('?');
      if (base.startsWith('/tiles-pro/')) return { storage_urls: { tile_0: img(base.slice(11)) } };
      if (/^\/(characters|objects)\//.test(base)) return { rotation_urls: { south: img('r') }, animations: [] };
      const [id, [, rows]] = Object.entries(SHAPE).find(([, s]) => s[0] === base)!;
      const q = new URLSearchParams(query);
      const off = Number(q.get('offset'));
      const list = st.lists[id];
      return { [rows]: list.rows.slice(off, off + Number(q.get('limit'))), total: list.total };
    }),
    publicGet: vi.fn(async () => new Response(new Blob(['png']), { status: 200 })),
    // Like http.ts: clearing the key ends Keep me signed in; a 401 does not.
    setKey: vi.fn((k: string | null) => void ((st.key = k || null), st.key || (st.kept = false))),
    setKeepSignedIn: vi.fn((on: boolean) => void (st.kept = on)),
    forgetKey: vi.fn(() => void Object.assign(st, { key: null, kept: false })),
    retry: vi.fn(),
    keepLoading: vi.fn(),
    wipe: vi.fn(async () => st.db.clear()),
    // structuredClone throws on a Svelte proxy, just like IndexedDB.
    saveFamily: vi.fn(async (id: string, s: unknown) => void st.db.set(id, structuredClone(s))),
  };
});

vi.mock('../../src/lib/api/http', () => ({
  HttpError: h.HttpError,
  apiGet: h.apiGet,
  publicGet: h.publicGet,
  setKey: h.setKey,
  forgetKey: h.forgetKey,
  IMAGE_HOST: 'backblaze.pixellab.ai',
  onSignedOut: (cb: () => void) => ((h.st.signedOutCb = cb), () => {}),
  getKey: () => h.st.key,
  onStatus: (cb: (s: string) => void) => ((h.st.statusCb = cb), () => {}),
  keptSignedIn: () => h.st.kept && !!h.st.key,
  keyHint: () => null,
  setKeepSignedIn: h.setKeepSignedIn,
  retry: h.retry,
  keepLoading: h.keepLoading,
}));
// The real record checks (isObj, isCard) with fake storage.
vi.mock('../../src/lib/data/store', async (actual) => ({
  ...(await actual<typeof import('../../src/lib/data/store')>()),
  loadOrg: async () => structuredClone(h.st.db.get('org')),
  updateOrg: async (fn: (old: unknown) => unknown) => void h.st.db.set('org', structuredClone(fn(structuredClone(h.st.db.get('org'))))),
  loadFamilies: async () => structuredClone(Object.fromEntries(h.st.db)),
  saveFamily: h.saveFamily,
  loadMeta: async () => undefined,
  saveMeta: async () => {},
  loadDetail: async (k: string) => structuredClone(h.st.db.get('detail:' + k)),
  saveDetail: async (k: string, v: unknown) => void h.st.db.set('detail:' + k, structuredClone(v)),
  wipe: h.wipe,
}));

const T0 = new Date('2026-10-20T12:00:00Z').getTime();
const HOUR = 3_600_000;

function fill(prefix: string, sizes: Partial<Record<FamilyId, number>> = {}) {
  for (const [id, [, , pic]] of Object.entries(h.SHAPE)) {
    const n = sizes[id as FamilyId] ?? 3;
    const rows = Array.from({ length: n }, (_, i) => {
      const rid = `${prefix}-${id}-${i}`;
      return { id: rid, name: `n${i}`, status: 'completed', ...(pic ? { [pic]: h.img(rid) } : {}) };
    });
    h.st.lists[id] = { total: n, rows };
  }
}

/** A fresh tab: the module is loaded again; device storage and the session key stay. */
async function tab() {
  vi.resetModules();
  return (await import('../../src/lib/data/library.svelte')).library;
}

/** The org store of the latest tab (call after tab()). */
const orgOf = () => import('../../src/lib/data/org.svelte');

const lists = () => h.apiGet.mock.calls.map(([p]) => p as string).filter((p) => p.includes('?'));
const later = (ms: number) => vi.setSystemTime(Date.now() + ms);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  vi.clearAllMocks();
  Object.assign(h.st, { key: null, kept: false, fail: null, statusCb: null, signedOutCb: null });
  h.st.db.clear();
  fill('a');
});

describe('open check', () => {
  it('first open = exactly 7 first-page requests, labelled, all saved', async () => {
    const lib = await tab();
    expect(await lib.connect('key')).toBe('ok');
    expect(lists().sort()).toEqual(
      [
        '/characters?limit=100&offset=0',
        '/objects?limit=100&offset=0',
        '/ui-assets?limit=100&offset=0',
        '/tilesets?limit=100&offset=0',
        '/tilesets-sidescroller?limit=50&offset=0',
        '/isometric-tiles?limit=100&offset=0',
        '/tiles-pro?limit=50&offset=0',
      ].sort(),
    );
    expect(h.apiGet.mock.calls[0][1]).toMatchObject({ label: 'Characters · first page' });
    expect(h.st.db.size).toBe(7);
    expect(lib.status).toBe('ok');
    expect(lib.hasKey).toBe(true);
    const tiles = lib.categories.find((c) => c.id === 'tiles')!;
    expect(tiles.count).toBe(12);
    expect(tiles.mosaic.map((m) => m.familyId)).toEqual(['tilesets', 'tilesets', 'tilesets', 'tilesets-side']);
  });

  it('reopen within an hour = 0; a new tab pasting the key = 1; after an hour = 7', async () => {
    await (await tab()).connect('key');
    h.apiGet.mockClear();

    const reopened = await tab();
    await reopened.openCheck();
    expect(lists()).toHaveLength(0);
    expect(reopened.families.characters?.cards).toHaveLength(3);

    h.st.key = null; // "this tab only": a new tab needs the key again
    await (await tab()).connect('key');
    expect(lists()).toEqual(['/characters?limit=100&offset=0']);
    expect(h.wipe).not.toHaveBeenCalled();

    h.apiGet.mockClear();
    later(HOUR + 1);
    await (await tab()).openCheck();
    expect(lists()).toHaveLength(7);
  });

  it('Refresh twice within 60 s = 7 requests, not 14', async () => {
    const lib = await tab();
    await lib.connect('key');
    h.apiGet.mockClear();
    await lib.openCheck({ force: true });
    later(30_000);
    await lib.openCheck({ force: true });
    expect(lists()).toHaveLength(7);
    later(31_000);
    await lib.openCheck({ force: true });
    expect(lists()).toHaveLength(14);
  });

  it('a first-page check that failed is asked again by the next open check, even within the hour (Try again / Keep loading)', async () => {
    const lib = await tab();
    await lib.connect('key');
    later(61_000);
    h.st.fail = new h.HttpError('cap');
    await lib.openCheck({ force: true }); // Refresh at the daily cap: every family fails
    expect(Object.keys(lib.errors)).toHaveLength(7);
    h.st.fail = null;
    h.apiGet.mockClear();
    await lib.openCheck(); // saved copies are fresh, but their last check failed
    expect(lists()).toHaveLength(7);
    expect(lib.errors).toEqual({});
    h.apiGet.mockClear();
    await lib.openCheck(); // and only once
    expect(lists()).toHaveLength(0);
  });

  it("another account's key wipes the saved copy and checks every family", async () => {
    await (await tab()).connect('key');
    h.apiGet.mockClear();
    fill('b');
    const lib = await tab();
    expect(await lib.connect('other-key')).toBe('ok');
    expect(h.wipe).toHaveBeenCalledOnce();
    expect(lists()).toHaveLength(7);
    expect(lib.families.characters?.cards[0].id).toBe('b-characters-0');
    expect((h.st.db.get('tiles-pro') as { cards: { id: string }[] }).cards[0].id).toBe('b-tiles-pro-0');
  });

  it("a 401 during connect → 'wrong-key', one request, key cleared", async () => {
    h.st.fail = new h.HttpError('key-lost', 401);
    const lib = await tab();
    expect(await lib.connect('bad')).toBe('wrong-key');
    expect(h.apiGet).toHaveBeenCalledOnce();
    expect(h.st.key).toBeNull();
    expect(lib.hasKey).toBe(false);
  });

  it.each([
    ['blocked', 'blocked'],
    ['offline', 'offline'],
    ['cap', 'paused'],
    ['stopped', 'server'],
    ['http', 'server'],
  ])("connect: a '%s' failure → '%s', key not kept", async (kind, result) => {
    h.st.fail = new h.HttpError(kind, kind === 'http' ? 500 : undefined);
    const lib = await tab();
    expect(await lib.connect('key')).toBe(result);
    expect(h.st.key).toBeNull();
    expect(lib.hasKey).toBe(false);
  });

  it("connect: an unexpected list answer → 'server'", async () => {
    h.apiGet.mockRejectedValueOnce(new Error('Characters: unexpected list answer'));
    expect(await (await tab()).connect('key')).toBe('server');
  });

  it('a top-down tileset that is also in the sidescroller list is shown once, in the grid and the mosaic', async () => {
    h.st.lists['tilesets-side'].rows[0].id = 'a-tilesets-0';
    const lib = await tab();
    await lib.connect('key');
    expect(lib.shown('tilesets').map((c) => c.id)).toEqual(['a-tilesets-1', 'a-tilesets-2']);
    expect(lib.shown('tilesets-side').map((c) => c.id)).toEqual(['a-tilesets-0', 'a-tilesets-side-1', 'a-tilesets-side-2']);
    const mosaic = lib.categories.find((c) => c.id === 'tiles')!.mosaic;
    expect(mosaic.map((m) => m.card.id)).toEqual(['a-tilesets-1', 'a-tilesets-2', 'a-tilesets-0', 'a-tilesets-side-1']);
  });

  it('a lost key during a check keeps the saved list', async () => {
    await (await tab()).connect('key');
    later(HOUR + 1);
    h.st.fail = new h.HttpError('key-lost', 401);
    const lib = await tab();
    await lib.openCheck();
    expect(lib.status).toBe('key-lost');
    expect(lib.hasKey).toBe(false);
    expect(lib.families.characters?.cards).toHaveLength(3);
  });
});

describe('loadMore', () => {
  it('starts one row back, one at a time, and reloads from page 0 on a shift', async () => {
    fill('a', { characters: 250 });
    const lib = await tab();
    await lib.connect('key');
    h.apiGet.mockClear();

    await Promise.all([lib.loadMore('characters'), lib.loadMore('characters')]);
    expect(lists()).toEqual(['/characters?limit=100&offset=99']);
    expect(lib.families.characters?.cards).toHaveLength(199);
    expect(lib.families.characters?.deepLoadedAt).toBe(T0);

    h.st.lists.characters.rows.splice(0, 1); // deleted on the website: rows shift up
    h.st.lists.characters.total = 249;
    h.apiGet.mockClear();
    await lib.loadMore('characters');
    expect(lists()).toEqual(['/characters?limit=100&offset=198', '/characters?limit=100&offset=0']);
    expect(lib.families.characters?.cards).toHaveLength(100);
    expect(lib.families.characters?.cards[0].id).toBe('a-characters-1');
    expect(lib.families.characters?.deepLoadedAt).toBeNull();

    h.apiGet.mockClear();
    await lib.loadMore('ui'); // 3 of 3 loaded
    expect(lists()).toHaveLength(0);
  });

  it('a reload keeps resolved pictures and does not reload again on the next scroll', async () => {
    fill('a', { 'tiles-pro': 120 });
    const lib = await tab();
    await lib.connect('key');
    await lib.art(lib.families['tiles-pro']!.cards[0], 'tiles-pro');
    await lib.loadMore('tiles-pro');
    expect(lib.families['tiles-pro']?.cards).toHaveLength(99);

    h.st.lists['tiles-pro'].rows.splice(60, 1); // a deep deletion: page 0 unchanged, deep rows shift
    h.st.lists['tiles-pro'].total = 119;
    h.apiGet.mockClear();
    await lib.loadMore('tiles-pro');
    expect(lists()).toEqual(['/tiles-pro?limit=50&offset=98', '/tiles-pro?limit=50&offset=0']);
    expect(lib.families['tiles-pro']?.cards).toHaveLength(50);
    expect(lib.families['tiles-pro']?.cards[0].thumb).toBe(h.img('a-tiles-pro-0'));

    h.apiGet.mockClear();
    await lib.loadMore('tiles-pro');
    expect(lists()).toEqual(['/tiles-pro?limit=50&offset=49']);
    expect(lib.families['tiles-pro']?.cards).toHaveLength(99);
  });
});

describe('art', () => {
  it('sends nothing for unfinished or failed rows', async () => {
    h.st.lists.tilesets.rows[0].status = 'processing';
    const lib = await tab();
    await lib.connect('key');
    vi.clearAllMocks();
    const card = lib.families.tilesets!.cards[0];
    expect(card.done).toBe(false);
    expect(await lib.art(card, 'tilesets')).toBeNull();
    expect(h.apiGet).not.toHaveBeenCalled();
    expect(h.publicGet).not.toHaveBeenCalled();
  });

  it('a picture that timed out (not an HttpError) is asked again by the next call; a 404 answer is not', async () => {
    const lib = await tab();
    await lib.connect('key');
    vi.clearAllMocks();
    const card = lib.families.characters!.cards[0];
    h.publicGet.mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'));
    expect(await lib.art(card, 'characters')).toBeNull();
    expect(await lib.art(card, 'characters')).toBeInstanceOf(Blob);
    expect(h.publicGet).toHaveBeenCalledTimes(2);

    h.publicGet.mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'));
    expect(await lib.picture(h.img('f'), 'characters')).toBeNull();
    expect(await lib.picture(h.img('f'), 'characters')).toBeInstanceOf(Blob);
    h.publicGet.mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect(await lib.picture(h.img('g'), 'characters')).toBeNull();
    expect(await lib.picture(h.img('g'), 'characters')).toBeNull();
    expect(h.publicGet).toHaveBeenCalledTimes(5); // 2 for f, 1 for g (a real answer stays)
  });

  it('a costly picture that answers 404, or a Tiles Pro row with no picture link, is asked once per session', async () => {
    const lib = await tab();
    await lib.connect('key');
    vi.clearAllMocks();
    const tileset = lib.families.tilesets!.cards[0];
    h.publicGet.mockResolvedValueOnce(new Response(null, { status: 404 })); // the helper's answer
    expect(await lib.art(tileset, 'tilesets')).toBeNull();
    expect(await lib.art(tileset, 'tilesets')).toBeNull();
    expect(h.publicGet).toHaveBeenCalledOnce();

    h.apiGet.mockResolvedValueOnce({ storage_urls: {} } as never);
    const pro = lib.families['tiles-pro']!.cards[0];
    expect(await lib.art(pro, 'tiles-pro')).toBeNull();
    expect(await lib.art(pro, 'tiles-pro')).toBeNull();
    expect(h.apiGet).toHaveBeenCalledOnce();
  });

  it('resolves costly art once, saves the link, then reuses it on later visits', async () => {
    const lib = await tab();
    await lib.connect('key');
    vi.clearAllMocks();
    const card = lib.families['tiles-pro']!.cards[0];
    const fp = card.fp;

    expect(await lib.art(card, 'tiles-pro')).toBeInstanceOf(Blob);
    expect(h.apiGet.mock.calls.map(([p]) => p)).toEqual(['/tiles-pro/a-tiles-pro-0']);
    expect(h.publicGet).toHaveBeenCalledOnce();
    const saved = (h.st.db.get('tiles-pro') as { cards: { thumb: string; fp: string }[] }).cards[0];
    expect(saved).toMatchObject({ thumb: h.img('a-tiles-pro-0'), fp });

    await lib.art(card, 'tiles-pro'); // same session: memory
    expect(h.apiGet).toHaveBeenCalledOnce();
    expect(h.publicGet).toHaveBeenCalledOnce();

    later(HOUR + 1); // a later check with the same rows keeps the saved link
    vi.clearAllMocks();
    const next = await tab();
    await next.openCheck();
    h.apiGet.mockClear();
    expect(await next.art(next.families['tiles-pro']!.cards[0], 'tiles-pro')).toBeInstanceOf(Blob);
    expect(h.apiGet).not.toHaveBeenCalled();
    expect(h.publicGet).toHaveBeenCalledWith(h.img('a-tiles-pro-0'), expect.anything());
  });
});

describe('detail', () => {
  const details = () => h.apiGet.mock.calls.map(([p]) => p as string).filter((p) => !p.includes('?'));
  const char = (lib: Awaited<ReturnType<typeof tab>>) => lib.families.characters!.cards[0];

  it('asks once, saves, then 0 in this tab and a new tab; a changed fp or an age over 7 days re-asks once', async () => {
    const lib = await tab();
    await lib.connect('key');
    h.apiGet.mockClear();
    const card = char(lib);
    const [a, b] = await Promise.all([lib.detail(card, 'characters'), lib.detail(card, 'characters')]);
    expect(a).toEqual(b);
    expect(a?.rotations.south).toBe(h.img('r'));
    expect(details()).toEqual(['/characters/a-characters-0']);
    expect(h.apiGet.mock.calls[0][1]).toMatchObject({ label: 'Characters · details' });
    expect(h.st.db.get('detail:' + card.key)).toMatchObject({ fp: card.fp, at: T0 });

    await lib.detail(card, 'characters');
    const next = await tab();
    await next.openCheck();
    await next.detail(char(next), 'characters');
    expect(details()).toHaveLength(1);

    await next.detail({ ...char(next), fp: 'changed' }, 'characters');
    expect(details()).toHaveLength(2);
    await next.detail({ ...char(next), fp: 'changed' }, 'characters');
    expect(details()).toHaveLength(2);

    later(7 * 24 * HOUR + 1);
    const third = await tab();
    await third.openCheck();
    const changed = { ...char(third), fp: 'changed' }; // the saved fp: only the age makes it re-ask
    await third.detail(changed, 'characters');
    await third.detail(changed, 'characters');
    expect(details()).toHaveLength(3);
  });

  it('a failed detail is not kept: the next call asks again', async () => {
    const lib = await tab();
    await lib.connect('key');
    h.apiGet.mockClear();
    h.st.fail = new h.HttpError('http', 500);
    await expect(lib.detail(char(lib), 'characters')).rejects.toMatchObject({ kind: 'http' });
    h.st.fail = null;
    expect(await lib.detail(char(lib), 'characters')).not.toBeNull();
    expect(details()).toHaveLength(2);
  });

  it('a tileset has no detail: null, no request', async () => {
    const lib = await tab();
    await lib.connect('key');
    h.apiGet.mockClear();
    expect(await lib.detail(lib.families.tilesets!.cards[0], 'tilesets')).toBeNull();
    expect(h.apiGet).not.toHaveBeenCalled();
  });
});

describe('states, items, find, count, coverage', () => {
  it('a grouped character shows once; states() returns both; find() reaches the hidden state', async () => {
    h.st.lists.characters.rows[0].group_id = 'g';
    h.st.lists.characters.rows[2].group_id = 'g';
    const lib = await tab();
    await lib.connect('key');
    const items = lib.items('characters');
    expect(items.map((i) => i.card.id)).toEqual(['a-characters-0', 'a-characters-1']);
    expect(lib.states(items[0].card, 'characters').map((c) => c.id)).toEqual(['a-characters-0', 'a-characters-2']);
    expect(lib.states(items[1].card, 'characters')).toEqual([items[1].card]);
    const hidden = lib.families.characters!.cards[2];
    expect(lib.find(hidden.key)?.card.id).toBe('a-characters-2');
    expect(lib.find('nope')).toBeNull();
    expect(lib.items('tiles').map((i) => i.familyId)).toEqual([
      ...Array(3).fill('tilesets'),
      ...Array(3).fill('tilesets-side'),
      ...Array(3).fill('isometric'),
      ...Array(3).fill('tiles-pro'),
    ]);
  });

  it('items(all) joins the four categories in home order; count(all) is their sum', async () => {
    const lib = await tab();
    await lib.connect('key');
    const ids = ['characters', 'objects', 'tiles', 'ui'] as const;
    expect(lib.items('all')).toEqual(ids.flatMap((id) => lib.items(id)));
    expect(lib.items('all')).toHaveLength(21);
    expect(lib.count('all')).toBe(ids.reduce((n, id) => n + lib.count(id), 0));
    expect(lib.count('all')).toBe(21);
    expect(lib.count('tiles')).toBe(12);
  });

  it('find() reaches any family by key', async () => {
    const lib = await tab();
    await lib.connect('key');
    const card = lib.families['tiles-pro']!.cards[1];
    expect(lib.find(card.key)).toMatchObject({ familyId: 'tiles-pro', card: { id: 'a-tiles-pro-1' } });
  });

  it('coverage tells a missing, a short and a full family apart', async () => {
    h.st.lists.objects = { total: 150, rows: h.st.lists.objects.rows };
    const lib = await tab();
    expect(lib.coverage('all')).toBe('missing');
    await lib.connect('key');
    expect(lib.coverage('characters')).toBe('full');
    expect(lib.coverage('objects')).toBe('partial');
    expect(lib.coverage('all')).toBe('partial');
    delete lib.families.ui;
    expect(lib.coverage('ui')).toBe('missing');
    expect(lib.coverage('all')).toBe('missing');
  });

  it('count, coverage, items, find and states send no request', async () => {
    h.st.lists.characters.rows[0].group_id = 'g';
    const lib = await tab();
    await lib.connect('key');
    h.apiGet.mockClear();
    h.publicGet.mockClear();
    const card = lib.items('all')[0].card;
    lib.count('all');
    lib.coverage('all');
    lib.find(card.key);
    lib.states(card, 'characters');
    expect(h.apiGet).not.toHaveBeenCalled();
    expect(h.publicGet).not.toHaveBeenCalled();
  });
});

describe('forget and keep signed in', () => {
  it('forget empties the saved copy and memory, drops the key, sends nothing', async () => {
    const lib = await tab();
    await lib.connect('key');
    await lib.detail(lib.families.characters!.cards[0], 'characters');
    await lib.picture(h.img('f'), 'characters');
    vi.clearAllMocks();
    await lib.forget();
    expect(h.apiGet).not.toHaveBeenCalled();
    expect(h.publicGet).not.toHaveBeenCalled();
    expect(h.st.db.size).toBe(0);
    expect(h.forgetKey).toHaveBeenCalledOnce(); // signs out the other tabs too
    expect(h.st.key).toBeNull();
    expect(lib.hasKey).toBe(false);
    expect(lib.families).toEqual({});
    expect(lib.categories.every((c) => c.count === 0)).toBe(true);
    await lib.picture(h.img('f'), 'characters'); // the memory copy went too
    expect(h.publicGet).toHaveBeenCalledOnce();
  });

  it("another tab's Forget clears this tab's memory, not the disk; a late answer is not saved back", async () => {
    const lib = await tab();
    await lib.connect('key');
    vi.clearAllMocks();
    let answer!: (v: unknown) => void;
    h.apiGet.mockImplementationOnce(() => new Promise((ok) => (answer = ok as (v: unknown) => void)));
    const late = lib.detail(lib.families.characters!.cards[0], 'characters');
    await vi.waitFor(() => expect(answer).toBeDefined());
    h.st.key = null; // http.ts dropped the key, then tells the library
    h.st.signedOutCb!();
    expect([lib.hasKey, lib.keepSignedIn, lib.families, lib.errors, lib.avoided]).toEqual([false, false, {}, {}, 0]);
    expect(h.wipe).not.toHaveBeenCalled(); // the forgetting tab wipes
    h.st.db.clear(); // ...as it did
    answer({ rotation_urls: {}, animations: [] });
    await late;
    await lib.openCheck();
    expect(h.apiGet).toHaveBeenCalledOnce(); // only the late detail
    expect(h.st.db.size).toBe(0);
  });

  it('a check waiting on the cross-tab lock when the key is forgotten does not bring the library back', async () => {
    const lib = await tab();
    await lib.connect('key');
    later(HOUR + 1);
    let open!: () => void;
    let waiting = false;
    const gate = new Promise<void>((ok) => (open = ok));
    const request = (_n: string, fn: () => Promise<void>) => ((waiting = true), gate.then(fn));
    vi.stubGlobal('navigator', { locks: { request } });
    try {
      const check = lib.openCheck();
      await vi.waitFor(() => expect(waiting).toBe(true)); // past the first saved-copy read, queued for the lock
      h.st.key = null; // another tab forgot: its wipe has not finished yet, so the disk still holds the library
      h.st.signedOutCb!();
      vi.clearAllMocks();
      open();
      await check;
      expect(lib.families).toEqual({});
      expect(h.apiGet).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('Try again lifts only a stop or the daily pause; a 429 pause and every other status are left alone', async () => {
    const lib = await tab();
    for (const s of ['slowed', 'ok', 'offline', 'key-lost', 'stopped', 'blocked', 'paused']) {
      h.st.statusCb!(s);
      lib.recover();
    }
    expect(h.retry).toHaveBeenCalledTimes(2); // stopped, blocked
    expect(h.keepLoading).toHaveBeenCalledOnce(); // paused
  });

  it('setKeepSignedIn forwards to the network module', async () => {
    const lib = await tab();
    lib.setKeepSignedIn(true);
    expect(h.setKeepSignedIn).toHaveBeenCalledWith(true);
  });

  it('a 401 keeps the real key mode, so a reconnect shows where the new key is saved', async () => {
    await (await tab()).connect('key');
    h.st.kept = true;
    later(HOUR + 1);
    const lib = await tab();
    expect(lib.keepSignedIn).toBe(true);
    h.st.fail = new h.HttpError('key-lost', 401);
    await lib.openCheck();
    expect(lib.hasKey).toBe(false);
    expect(lib.keepSignedIn).toBe(true); // http.ts still keeps the key in localStorage
    h.st.fail = null;
    expect(await lib.connect('new-key')).toBe('ok');
    expect(lib.keepSignedIn).toBe(true);
    await lib.forget();
    expect(lib.keepSignedIn).toBe(false);
  });

  it('a failed wipe rejects forget(), with the key already gone', async () => {
    const lib = await tab();
    await lib.connect('key');
    h.wipe.mockRejectedValueOnce(new Error('disk'));
    await expect(lib.forget()).rejects.toThrow('disk');
    expect(h.st.key).toBeNull();
    expect(lib.hasKey).toBe(false);
  });
});

describe('picture', () => {
  it('fetches a frame once per session from the image host, labelled', async () => {
    const lib = await tab();
    await Promise.all([lib.picture(h.img('f'), 'objects'), lib.picture(h.img('f'), 'objects')]);
    expect(h.publicGet).toHaveBeenCalledOnce();
    expect(h.publicGet).toHaveBeenCalledWith(h.img('f'), expect.objectContaining({ label: 'Objects · frame' }));
    expect(h.apiGet).not.toHaveBeenCalled();
  });

  it('refuses links that are not on the image host: null, no request', async () => {
    const lib = await tab();
    for (const url of ['https://api.pixellab.ai/v2/characters', 'http://backblaze.pixellab.ai/x.png', 'https://evil.example/x.png', 'not a url'])
      expect(await lib.picture(url, 'characters')).toBeNull();
    expect(h.publicGet).not.toHaveBeenCalled();
  });
});

describe('favorites and folders', () => {
  const SNAP = 'b00000000001'; // an objects card past the saved first page
  const GONE = 'b00000000002'; // a ui card PixelLab no longer lists
  const snap = (key: string, familyId: FamilyId) => ({ familyId, card: { key, id: 'x-' + key, name: 's', done: true, thumb: null, fp: 'f', meta: {} } });
  const seed = (favorites: string[]) =>
    h.st.db.set('org', { v: 1, favorites, folders: [], cards: Object.fromEntries(favorites.map((k) => [k, snap(k, k === SNAP ? 'objects' : 'ui')])) });

  async function setup() {
    h.st.lists.characters.rows[0].group_id = 'g';
    h.st.lists.characters.rows[2].group_id = 'g';
    h.st.lists.objects.total = 150; // only the first page is saved
    seed([SNAP, GONE]);
    const lib = await tab();
    await lib.connect('key');
    const { org } = await orgOf();
    expect(org.ready).toBe(true); // the open check loaded it
    h.apiGet.mockClear();
    h.publicGet.mockClear();
    return { lib, org, chars: lib.families.characters!.cards, ui: lib.families.ui!.cards };
  }

  it('pick: live cards, one cell per group, snapshots of unsaved rows, gone keys; in list order, 0 requests', async () => {
    const { lib, chars, ui } = await setup();
    const { items, gone } = lib.pick([ui[1].key, chars[2].key, GONE, SNAP, chars[0].key]);
    expect(items.map((i) => [i.familyId, i.card.id])).toEqual([
      ['ui', 'a-ui-1'],
      ['characters', 'a-characters-0'], // another state's key gives the group's shown card, once
      ['objects', 'x-' + SNAP],
    ]);
    expect(gone).toEqual([GONE]);
    expect(h.apiGet).not.toHaveBeenCalled();
    expect(h.publicGet).not.toHaveBeenCalled();
  });

  it("pick: a state's snapshot shows its live group, two states give one item, a live card wins over its own snapshot", async () => {
    h.st.lists.characters.total = 150; // a state on an expired deep page is not gone
    const { lib, org, chars, ui } = await setup();
    const { setFavorite } = await orgOf();
    const OLD = 'b00000000003';
    const old = { key: OLD, id: 'x-old', name: 'old', done: true, thumb: null, fp: 'f', meta: { group_id: 'g' } };
    await setFavorite({ card: old, familyId: 'characters' }, [OLD], true);
    await setFavorite({ card: { ...ui[1], name: 'old' }, familyId: 'ui' }, [ui[1].key], true);
    expect(org.cards[OLD]).toBeDefined();
    const ids = (keys: string[]) => lib.pick(keys).items.map((i) => i.card.id);
    expect(ids([OLD])).toEqual(['a-characters-0']); // the live sibling, not the snapshot
    expect(ids([chars[2].key, OLD])).toEqual(['a-characters-0']);
    expect(lib.pick([ui[1].key]).items[0].card.name).toBe('n1');
    expect(lib.find(ui[1].key)?.card.name).toBe('n1');
    expect(h.apiGet).not.toHaveBeenCalled();
    expect(h.publicGet).not.toHaveBeenCalled();
  });

  it('groupKeys: live states plus snapshot-only states of the same character group, 0 requests', async () => {
    h.st.lists.characters.total = 150; // the favorited state sits on an expired deep page
    const { lib, chars, ui } = await setup();
    const { setFavorite } = await orgOf();
    const OLD = 'b00000000003';
    const old = { key: OLD, id: 'x-old', name: 'old', done: true, thumb: null, fp: 'f', meta: { group_id: 'g' } };
    await setFavorite({ card: old, familyId: 'characters' }, [OLD], true);
    expect(lib.groupKeys(chars[0], 'characters').sort()).toEqual([chars[0].key, chars[2].key, OLD].sort());
    expect(lib.groupKeys(chars[1], 'characters')).toEqual([chars[1].key]); // ungrouped
    expect(lib.groupKeys(ui[0], 'ui')).toEqual([ui[0].key]);
    expect(h.apiGet).not.toHaveBeenCalled();
    expect(h.publicGet).not.toHaveBeenCalled();
  });

  it('find: a snapshot for an unsaved deep card, null for a gone one, 0 requests', async () => {
    const { lib, chars } = await setup();
    expect(lib.find(SNAP)).toMatchObject({ familyId: 'objects', card: { id: 'x-' + SNAP } });
    expect(lib.find(GONE)).toBeNull();
    expect(lib.find(chars[2].key)?.card.id).toBe('a-characters-2');
    expect(h.apiGet).not.toHaveBeenCalled();
    expect(h.publicGet).not.toHaveBeenCalled();
  });

  it('forget() and a signed-out message clear org memory, sending nothing', async () => {
    let { lib, org } = await setup();
    await lib.forget();
    expect([org.favorites, org.ready]).toEqual([[], false]);
    expect(h.st.db.has('org')).toBe(false);

    seed([SNAP]);
    ({ lib, org } = await setup());
    expect(org.favorites).toEqual([SNAP, GONE]);
    h.st.key = null; // another tab forgot
    h.st.signedOutCb!();
    expect([org.favorites, org.cards, org.ready]).toEqual([[], {}, false]);
    expect(h.apiGet).not.toHaveBeenCalled();
    expect(h.publicGet).not.toHaveBeenCalled();
  });

  it('an account switch clears org memory before the wipe, then loads the empty record', async () => {
    const { lib, org } = await setup();
    let held = -1;
    h.wipe.mockImplementationOnce(async () => void ((held = org.favorites.length), h.st.db.clear()));
    fill('b');
    expect(await lib.connect('other-key')).toBe('ok');
    expect(held).toBe(0);
    expect([org.favorites, org.ready]).toEqual([[], true]);
  });

  it("a resolved costly link is written to the key's snapshot", async () => {
    const { lib } = await setup();
    const { setFavorite } = await orgOf();
    const pro = lib.families['tiles-pro']!.cards[0];
    await setFavorite({ card: pro, familyId: 'tiles-pro' }, [pro.key], true);
    expect(await lib.art(pro, 'tiles-pro')).toBeInstanceOf(Blob);
    await vi.waitFor(() => expect((h.st.db.get('org') as { cards: Record<string, Snap> }).cards[pro.key].card.thumb).toBe(h.img('a-tiles-pro-0')));
  });
});
