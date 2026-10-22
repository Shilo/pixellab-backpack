import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card, FamilyId, Item } from '../../src/lib/types';

// Fake device storage that outlives a "tab" (vi.resetModules). structuredClone throws on a Svelte proxy, just like IndexedDB.
const h = vi.hoisted(() => ({ db: new Map<string, unknown>(), writes: 0 }));
vi.mock('idb-keyval', () => ({
  createStore: () => 'fake-store',
  get: async (k: string) => structuredClone(h.db.get(k)),
  set: async (k: string, v: unknown) => void h.db.set(k, structuredClone(v)),
  clear: async () => h.db.clear(),
  update: async (k: string, fn: (old: unknown) => unknown) => {
    h.writes++;
    h.db.set(k, structuredClone(fn(structuredClone(h.db.get(k)))));
  },
}));

/** A fresh tab: the module is loaded again; device storage stays. */
async function tab() {
  vi.resetModules();
  return import('../../src/lib/data/org.svelte');
}

const [K1, K2, K3, K4, K5] = ['a1', 'a2', 'a3', 'a4', 'a5'].map((k) => k.padEnd(12, '0'));
const [F1, F2, F3, F4] = ['f1', 'f2', 'f3', 'f4'].map((k) => k.padEnd(12, '0'));
const card = (key: string, meta: Record<string, unknown> = {}): Card => ({ key, id: 'id-' + key, name: 'n', done: true, thumb: null, fp: 'f', meta });
const item = (key: string, familyId: FamilyId = 'characters', meta: Record<string, unknown> = {}): Item => ({ card: card(key, meta), familyId });
const snap = (key: string, familyId: FamilyId = 'characters') => ({ familyId, card: card(key) });
const stored = () => h.db.get('org') as { favorites: string[]; folders: { name: string }[]; cards: Record<string, unknown> };
const EMPTY = { v: 1, favorites: [], folders: [], cards: {} };

beforeEach(() => {
  h.db.clear();
  h.writes = 0;
});

describe('check', () => {
  const rec = {
    v: 1,
    favorites: [K1, K2],
    folders: [
      { id: F1, name: 'Alpha', at: 1, items: [K2] },
      { id: F2, name: 'Beta', at: 2, items: [K3] },
    ],
    cards: { [K1]: snap(K1), [K2]: snap(K2, 'ui'), [K3]: snap(K3, 'tiles-pro') },
  };

  it('a valid record round-trips', async () => {
    const { check } = await tab();
    expect(check(structuredClone(rec))).toEqual(rec);
  });

  it('drops each bad entry on its own and keeps the rest', async () => {
    const { check } = await tab();
    const bad = structuredClone(rec) as Record<string, any>;
    bad.favorites.push('NOT-A-KEY', K4); // a bad key; K4's snapshot has no meta
    bad.cards['NOT-A-KEY'] = { familyId: 'ui', card: card('NOT-A-KEY') };
    bad.cards[K4] = { familyId: 'ui', card: { ...card(K4), meta: undefined } };
    bad.cards[K5] = { familyId: 'images', card: card(K5) }; // unknown family
    bad.folders[1].items.push(K5);
    bad.folders.push({ id: F3, name: 'x'.repeat(61), at: 3, items: [K1] }); // 61 characters
    bad.folders.push({ id: F4, name: ' alpha ', at: 4, items: [K1] }); // a duplicate name: the first is kept
    expect(check(bad)).toEqual(rec);
  });

  it('a record that is not v: 1, or garbage, reads as empty', async () => {
    const { check } = await tab();
    for (const b of [{ ...rec, v: 2 }, 'junk', null, undefined, [], { v: 1 }]) expect(check(b)).toEqual(EMPTY);
  });
});

describe('favorites', () => {
  it('add puts the key first once with a snapshot; remove drops it and its snapshot', async () => {
    const m = await tab();
    await m.load();
    expect(m.org.ready).toBe(true);
    await m.setFavorite(item(K1), [K1], true);
    expect(m.org.said).toBe('Added to Favorites.');
    await m.setFavorite(item(K2, 'ui'), [K2], true);
    await m.setFavorite(item(K1), [K1], true);
    expect(m.org.favorites).toEqual([K1, K2]);
    expect(m.org.cards).toEqual({ [K1]: snap(K1), [K2]: snap(K2, 'ui') });
    expect(stored().favorites).toEqual([K1, K2]);
    await m.setFavorite(item(K1), [K1], false);
    expect(m.org.said).toBe('Removed from Favorites.');
    expect(m.org.favorites).toEqual([K2]);
    expect(Object.keys(stored().cards)).toEqual([K2]);
  });

  it('the same message twice still changes said, so the live region reads it again (R10)', async () => {
    const m = await tab();
    await m.load();
    await m.setFavorite(item(K1), [K1], true);
    const first = m.org.said;
    await m.setFavorite(item(K2), [K2], true);
    expect(m.org.said).not.toBe(first);
    expect(m.org.said.trim()).toBe('Added to Favorites.');
    await m.setFavorite(item(K3), [K3], true);
    expect(m.org.said).toBe(first); // alternates
  });

  it('a character group: any state counts, removing all group keys clears it and drops the unused snapshot', async () => {
    const m = await tab();
    await m.load();
    const g = { group_id: 'g' };
    await m.setFavorite(item(K1, 'characters', g), [K1, K2], true);
    expect(m.isIn(m.org.favorites, [K2, K1])).toBe(true);
    expect(m.isIn(m.org.favorites, [K2])).toBe(false);
    await m.setFavorite(item(K2, 'characters', g), [K2, K1], false);
    expect(m.org.favorites).toEqual([]);
    expect(m.org.cards).toEqual({});
  });
});

describe('folders', () => {
  it('create, rename, add, remove and delete, with the R10 text after each', async () => {
    const m = await tab();
    await m.load();
    const zeta = await m.createFolder('  Zeta ');
    expect(zeta).toMatch(/^[0-9a-f]{12}$/);
    const alpha = await m.createFolder('alpha');
    const beta = await m.createFolder('Beta', item(K1));
    expect(m.org.said).toBe('Added to Beta.');
    expect(m.org.folders.map((f) => f.name)).toEqual(['alpha', 'Beta', 'Zeta']); // A–Z, ignoring case
    expect(m.org.folders.find((f) => f.id === beta)!.items).toEqual([K1]);
    expect(stored().folders.map((f) => f.name)).toEqual(['alpha', 'Beta', 'Zeta']);

    expect(m.nameError('zeta')).toBe('You already have a folder with that name.');
    expect(await m.createFolder('ZETA')).toBe('');
    expect(m.nameError('')).toBeTruthy();
    expect(m.nameError('   ')).toBeTruthy();
    expect(m.nameError('x'.repeat(61))).toBeTruthy();
    expect(m.nameError('😀'.repeat(60))).toBeNull(); // 60 code points, 120 UTF-16 units

    await m.renameFolder(zeta, 'BETA'); // refused: duplicate ignoring case
    expect(m.org.folders.map((f) => f.name)).toEqual(['alpha', 'Beta', 'Zeta']);
    expect(m.nameError('zeta', zeta)).toBeNull();
    await m.renameFolder(zeta, ' ZETA ');
    expect(m.org.folders.map((f) => f.name)).toEqual(['alpha', 'Beta', 'ZETA']);

    await m.setInFolder(alpha, item(K2), [K2], true);
    expect(m.org.said).toBe('Added to alpha.');
    await m.setInFolder(alpha, item(K3), [K3], true);
    expect(m.org.folders[0].items).toEqual([K3, K2]); // newest added first
    await m.setInFolder(alpha, item(K3), [K3], false);
    expect(m.org.said).toBe('Removed from alpha.');
    await m.setInFolder(alpha, item(K3), [K3], true);
    await m.removeKeys(alpha, [K2, K3]); // Remove them
    expect(m.org.said).toBe('Removed from alpha.');
    expect(m.org.folders[0].items).toEqual([]);
    expect(Object.keys(m.org.cards)).toEqual([K1]);

    await m.setFavorite(item(K1), [K1], true);
    await m.deleteFolder(beta);
    expect(m.org.said).toBe('Deleted "Beta".');
    expect(m.org.folders.map((f) => f.name)).toEqual(['alpha', 'ZETA']);
    expect(m.org.cards).toEqual({ [K1]: snap(K1) }); // still a favorite
  });
});

describe('device', () => {
  it('two tabs over one store: both writes survive', async () => {
    const a = await tab();
    const b = await tab();
    await a.load();
    await b.load();
    await a.setFavorite(item(K1), [K1], true);
    await b.setFavorite(item(K2), [K2], true); // b's memory never saw K1
    expect(b.org.favorites).toEqual([K2, K1]);
    expect(stored().favorites).toEqual([K2, K1]);
  });

  it('two tabs make the same name in another case: one folder, the second call is refused, nothing lost', async () => {
    const a = await tab();
    const b = await tab();
    await a.load();
    await b.load();
    const work = await a.createFolder('Work', item(K1));
    expect(await b.createFolder('work', item(K2))).toBe(''); // b's memory never saw "Work"
    const other = await b.createFolder('Other');
    await a.renameFolder(work, 'OTHER'); // a's memory never saw "Other"
    expect(stored().folders).toEqual([
      { id: other, name: 'Other', at: expect.any(Number), items: [] },
      { id: work, name: 'Work', at: expect.any(Number), items: [K1] },
    ]);
    expect(Object.keys(stored().cards)).toEqual([K1]);
    expect(b.org.folders.map((f) => f.name)).toEqual(['Other', 'Work']);
  });

  it('a tab re-reads the saved record when it becomes visible again, never after clear', async () => {
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    vi.stubGlobal('document', doc);
    try {
      const a = await tab();
      const b = await tab();
      await a.load();
      await b.load();
      await a.setFavorite(item(K1), [K1], true);
      expect(b.org.favorites).toEqual([]);
      doc.dispatchEvent(new Event('visibilitychange'));
      await vi.waitFor(() => expect(b.org.favorites).toEqual([K1]));
      b.clear();
      doc.dispatchEvent(new Event('visibilitychange'));
      await new Promise((r) => setTimeout(r));
      expect(b.org).toMatchObject({ favorites: [], ready: false });
      const n = h.writes;
      await b.setFavorite(item(K2), [K2], true); // still disabled
      expect(h.writes).toBe(n);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('nothing is stored before load or after clear', async () => {
    const m = await tab();
    await m.setFavorite(item(K1), [K1], true);
    expect(h.db.has('org')).toBe(false);
    await m.load();
    await m.setFavorite(item(K1), [K1], true);
    m.clear();
    expect(m.org).toMatchObject({ favorites: [], folders: [], cards: {}, ready: false });
    h.db.clear(); // Forget's wipe
    await m.setFavorite(item(K2), [K2], true);
    expect(await m.createFolder('A', item(K2))).toBe('');
    expect(h.db.has('org')).toBe(false);
  });

  it('setThumb writes only to an existing snapshot whose thumb differs', async () => {
    const m = await tab();
    await m.load();
    await m.setFavorite(item(K1, 'tiles-pro'), [K1], true);
    const n = h.writes;
    m.setThumb(K2, 'https://x/2.png'); // no snapshot
    m.setThumb(K1, 'https://x/1.png');
    await vi.waitFor(() => expect(m.org.cards[K1].card.thumb).toBe('https://x/1.png'));
    m.setThumb(K1, 'https://x/1.png'); // same: nothing
    await new Promise((r) => setTimeout(r));
    expect(h.writes).toBe(n + 1);
    expect(m.org.said).toBe('Added to Favorites.'); // not an announcement
    expect((stored().cards[K1] as { card: Card }).card.thumb).toBe('https://x/1.png');
  });
});

describe('challenge fixes', () => {
  it('P2b: asks the browser to keep the data once, when the first favorite or folder is created; works without the API', async () => {
    const persist = vi.fn(async () => true);
    vi.stubGlobal('navigator', { storage: { persist } });
    try {
      const o = await tab();
      await o.load();
      await o.setFavorite(item(K1), [K1], true);
      expect(persist).toHaveBeenCalledOnce();
      await o.setFavorite(item(K2), [K2], true);
      await o.createFolder('Alpha');
      expect(persist).toHaveBeenCalledOnce();
      h.db.clear();
      await o.load();
      await o.createFolder('Beta'); // the first folder of an empty record
      expect(persist).toHaveBeenCalledTimes(2);
      vi.stubGlobal('navigator', {}); // no StorageManager: the write still works
      h.db.clear();
      await o.load();
      await o.setFavorite(item(K3), [K3], true);
      expect(stored().favorites).toEqual([K3]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('C1: a saved record of another version is never rewritten by a write', async () => {
    const future = { v: 2, everything: ['kept'] };
    h.db.set('org', future);
    const m = await tab();
    await m.load();
    await m.setFavorite(item(K1), [K1], true);
    expect(await m.createFolder('A')).toBe('');
    expect(h.db.get('org')).toEqual(future);
  });

  it('C6: a folder without its unused `at` is kept (at 0), not dropped', () => {
    return tab().then((m) => {
      const r = m.check({ v: 1, favorites: [], folders: [{ id: F1, name: 'Alpha', items: [K1] }], cards: { [K1]: snap(K1) } });
      expect(r.folders).toEqual([{ id: F1, name: 'Alpha', at: 0, items: [K1] }]);
    });
  });

  it('a rename announces "Renamed to {name}." (repeat-safe), and nothing when refused', async () => {
    const m = await tab();
    await m.load();
    const a = await m.createFolder('Alpha');
    await m.createFolder('Beta');
    await m.renameFolder(a, ' Gamma ');
    expect(m.org.said).toBe('Renamed to Gamma.');
    await m.renameFolder(a, 'Delta');
    await m.renameFolder(a, 'Gamma');
    expect(m.org.said).toBe('Renamed to Gamma.');
    await m.renameFolder(a, 'beta'); // refused: taken
    expect(m.org.said).toBe('Renamed to Gamma.');
  });

  it('C3: say() repeats are read again (alternating no-break space)', async () => {
    const m = await tab();
    m.say("Couldn't save. Try again.");
    m.say("Couldn't save. Try again.");
    expect(m.org.said).toBe("Couldn't save. Try again. ");
    m.say("Couldn't save. Try again.");
    expect(m.org.said).toBe("Couldn't save. Try again.");
  });
});
