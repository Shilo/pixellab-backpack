import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FamilyId } from '../../src/lib/types';

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
    statusCb: null as ((s: string) => void) | null,
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
      const [id, [, rows]] = Object.entries(SHAPE).find(([, s]) => s[0] === base)!;
      const q = new URLSearchParams(query);
      const off = Number(q.get('offset'));
      const list = st.lists[id];
      return { [rows]: list.rows.slice(off, off + Number(q.get('limit'))), total: list.total };
    }),
    publicGet: vi.fn(async () => new Response(new Blob(['png']), { status: 200 })),
    setKey: vi.fn((k: string | null) => void (st.key = k || null)),
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
  getKey: () => h.st.key,
  onStatus: (cb: (s: string) => void) => ((h.st.statusCb = cb), () => {}),
}));
vi.mock('../../src/lib/data/store', () => ({
  loadFamilies: async () => structuredClone(Object.fromEntries(h.st.db)),
  saveFamily: h.saveFamily,
  loadMeta: async () => undefined,
  saveMeta: async () => {},
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

const lists = () => h.apiGet.mock.calls.map(([p]) => p as string).filter((p) => p.includes('?'));
const later = (ms: number) => vi.setSystemTime(Date.now() + ms);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  vi.clearAllMocks();
  Object.assign(h.st, { key: null, fail: null, statusCb: null });
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
  });

  it('a lost key during a check keeps the saved list', async () => {
    await (await tab()).connect('key');
    later(HOUR + 1);
    h.st.fail = new h.HttpError('key-lost', 401);
    const lib = await tab();
    await lib.openCheck();
    expect(lib.status).toBe('key-lost');
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
