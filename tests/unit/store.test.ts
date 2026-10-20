import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = new Map<string, unknown>();
vi.mock('idb-keyval', () => ({
  createStore: vi.fn(() => 'fake-store'),
  get: async (k: string) => db.get(k),
  getMany: async (ks: string[]) => ks.map((k) => db.get(k)),
  set: async (k: string, v: unknown) => void db.set(k, v),
  clear: async () => db.clear(),
}));

import { createStore } from 'idb-keyval';
import { loadDetail, loadFamilies, loadMeta, SCHEMA, saveDetail, saveFamily, saveMeta, wipe } from '../../src/lib/data/store';
import type { FamilyState, SavedDetail } from '../../src/lib/types';

const fam: FamilyState = { total: 1, cards: [{ key: 'k', id: 'i', name: 'n', done: true, thumb: null, fp: 'f', meta: {} }], checkedAt: 5, deepLoadedAt: null };
const detail: SavedDetail = { fp: 'f', at: 1, detail: { rotations: {}, animations: [], extra: {} } };

describe('store', () => {
  beforeEach(() => {
    db.clear();
    db.set('meta:schema', SCHEMA);
  });

  it('round-trips families, details and meta, and wipe clears them all', async () => {
    await saveFamily('characters', fam);
    await saveFamily('ui', { ...fam, total: 2 });
    await saveDetail('k', detail);
    await saveMeta('lastCheck', 123);
    expect(await loadFamilies(['characters', 'objects', 'ui'])).toEqual({ characters: fam, ui: { ...fam, total: 2 } });
    expect(await loadDetail('k')).toEqual(detail);
    expect(await loadMeta<number>('lastCheck')).toBe(123);
    expect(await loadMeta('missing')).toBeUndefined();
    await wipe();
    expect(await loadFamilies(['characters', 'ui'])).toEqual({});
    expect(await loadDetail('k')).toBeUndefined();
    expect(await loadMeta('lastCheck')).toBeUndefined();
  });

  it('loadFamilies reads only the asked family keys, never meta or saved details', async () => {
    await saveMeta('x', 1);
    await saveDetail('characters', detail); // a detail key that looks like a family id
    expect(await loadFamilies(['characters'])).toEqual({});
    expect([...db.keys()].sort()).toEqual(['detail:characters', 'meta:schema', 'meta:x']);
  });

  it('a saved copy from another schema version is wiped once', async () => {
    for (const old of [undefined, 1]) {
      db.clear();
      if (old) db.set('meta:schema', old);
      await saveFamily('characters', fam);
      await saveDetail('k', detail);
      expect(await loadFamilies(['characters'])).toEqual({});
      expect([...db.entries()]).toEqual([['meta:schema', SCHEMA]]);
      await saveFamily('characters', fam);
      expect(await loadFamilies(['characters'])).toEqual({ characters: fam }); // not wiped again
    }
  });

  it('a wipe leaves the schema stamped, so families saved after it survive the next load', async () => {
    await wipe();
    await saveFamily('ui', fam);
    expect(await loadFamilies(['ui'])).toEqual({ ui: fam });
  });

  it('a family with one bad card or a bad shape loads as missing (checked again); the others still load', async () => {
    const card = fam.cards[0];
    const bad: unknown[] = [
      { ...fam, cards: [card, { ...card, meta: undefined }] }, // an older tab's card without meta
      { ...fam, cards: [{ ...card, key: 1 }] },
      { ...fam, cards: [{ ...card, fp: null }] },
      { ...fam, cards: [{ ...card, done: 'yes' }] },
      { ...fam, cards: [null] },
      { ...fam, cards: {} },
      { ...fam, total: '1' },
      { ...fam, checkedAt: undefined },
      'junk',
    ];
    for (const b of bad) {
      db.set('family:characters', b);
      await saveFamily('ui', fam);
      expect(await loadFamilies(['characters', 'ui'])).toEqual({ ui: fam });
    }
  });

  it('a saved detail without a string fp or an animations list loads as missing', async () => {
    for (const b of [{ ...detail, fp: 1 }, { ...detail, detail: { ...detail.detail, animations: null } }, { fp: 'f', at: 1 }, 'junk']) {
      db.set('detail:k', b);
      expect(await loadDetail('k')).toBeUndefined();
    }
    await saveDetail('k', detail);
    expect(await loadDetail('k')).toEqual(detail);
  });

  it('uses a database named from APP_ID', async () => {
    await loadMeta('any'); // the store is created lazily on first use, so this test does not depend on order
    expect(createStore).toHaveBeenCalledWith('pixellab-backpack', 'kv');
  });
});
