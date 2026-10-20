import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = new Map<string, unknown>();
vi.mock('idb-keyval', () => ({
  createStore: vi.fn(() => 'fake-store'),
  get: async (k: string) => db.get(k),
  set: async (k: string, v: unknown) => void db.set(k, v),
  entries: async () => [...db.entries()],
  clear: async () => db.clear(),
}));

import { createStore } from 'idb-keyval';
import { loadFamilies, loadMeta, saveFamily, saveMeta, wipe } from '../../src/lib/data/store';
import type { FamilyState } from '../../src/lib/types';

const fam: FamilyState = { total: 1, cards: [{ key: 'k', id: 'i', name: 'n', done: true, thumb: null, fp: 'f' }], checkedAt: 5, deepLoadedAt: null };

describe('store', () => {
  beforeEach(() => db.clear());

  it('round-trips families and meta, and wipe clears both', async () => {
    await saveFamily('characters', fam);
    await saveFamily('ui', { ...fam, total: 2 });
    await saveMeta('lastCheck', 123);
    expect(await loadFamilies()).toEqual({ characters: fam, ui: { ...fam, total: 2 } });
    expect(await loadMeta<number>('lastCheck')).toBe(123);
    expect(await loadMeta('missing')).toBeUndefined();
    await wipe();
    expect(await loadFamilies()).toEqual({});
    expect(await loadMeta('lastCheck')).toBeUndefined();
  });

  it('meta never shows up as a family', async () => {
    await saveMeta('x', 1);
    expect(await loadFamilies()).toEqual({});
  });

  it('uses a database named from APP_ID', () => {
    expect(createStore).toHaveBeenCalledWith('pixellab-backpack', 'kv');
  });
});
