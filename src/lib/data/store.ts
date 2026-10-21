// The only module that touches device storage (IndexedDB). Never stores the API key.
import { clear, createStore, get, getMany, set, update } from 'idb-keyval';
import { APP_ID } from '../app';
import type { Card, FamilyId, FamilyState, SavedDetail } from '../types';

/** Saved-copy shape version (R10). A device holding another version is wiped once. */
export const SCHEMA = 2;

let db: ReturnType<typeof createStore> | undefined;
const store = () => (db ??= createStore(APP_ID, 'kv')); // lazy: no IndexedDB access at import time

// Saved records are checked on load: an older tab or a foreign record must never reach the screens. A bad one reads as missing.
export const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
export const isCard = (c: unknown): c is Card => isObj(c) && typeof c.key === 'string' && typeof c.fp === 'string' && typeof c.done === 'boolean' && isObj(c.meta);
const isFamily = (s: unknown): s is FamilyState =>
  isObj(s) && Array.isArray(s.cards) && typeof s.total === 'number' && typeof s.checkedAt === 'number' && s.cards.every(isCard);

/** Reads only `family:<id>` keys (never saved details). Wipes first if the saved copy is another schema version.
 * A family with one bad card is left out, so it is checked again. */
export async function loadFamilies(ids: FamilyId[]): Promise<Partial<Record<FamilyId, FamilyState>>> {
  const [schema, ...states] = await getMany(['meta:schema', ...ids.map((id) => 'family:' + id)], store());
  if (schema !== SCHEMA) {
    await wipe();
    return {};
  }
  return Object.fromEntries(ids.flatMap((id, i) => (isFamily(states[i]) ? [[id, states[i]]] : [])));
}

export const saveFamily = (id: FamilyId, state: FamilyState) => set('family:' + id, state, store());
/** A saved detail, or undefined when missing or not the expected shape (it is asked again). */
export async function loadDetail(key: string): Promise<SavedDetail | undefined> {
  const v = await get('detail:' + key, store());
  return isObj(v) && typeof v.fp === 'string' && isObj(v.detail) && Array.isArray(v.detail.animations) ? (v as unknown as SavedDetail) : undefined;
}
export const saveDetail = (key: string, v: SavedDetail) => set('detail:' + key, v, store());
export const loadMeta = <T>(k: string) => get<T>('meta:' + k, store());
export const saveMeta = (k: string, v: unknown) => set('meta:' + k, v, store());
/** Favorites and folders (org.svelte.ts checks the shape). */
export const loadOrg = () => get<unknown>('org', store());
/** One read-modify-write in one transaction, so two tabs never overwrite each other. */
export const updateOrg = (fn: (old: unknown) => unknown) => update<unknown>('org', fn, store());
/** Clears everything, then stamps the schema so the next load does not wipe again. */
export const wipe = async () => {
  await clear(store());
  await set('meta:schema', SCHEMA, store());
};
