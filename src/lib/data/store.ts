// The only module that touches device storage (IndexedDB). Never stores the API key.
import { clear, createStore, get, getMany, set } from 'idb-keyval';
import { APP_ID } from '../app';
import type { FamilyId, FamilyState, SavedDetail } from '../types';

/** Saved-copy shape version (R10). A device holding another version is wiped once. */
export const SCHEMA = 2;

let db: ReturnType<typeof createStore> | undefined;
const store = () => (db ??= createStore(APP_ID, 'kv')); // lazy: no IndexedDB access at import time

/** Reads only `family:<id>` keys (never saved details). Wipes first if the saved copy is another schema version. */
export async function loadFamilies(ids: FamilyId[]): Promise<Partial<Record<FamilyId, FamilyState>>> {
  const [schema, ...states] = await getMany(['meta:schema', ...ids.map((id) => 'family:' + id)], store());
  if (schema !== SCHEMA) {
    await wipe();
    return {};
  }
  return Object.fromEntries(ids.flatMap((id, i) => (states[i] ? [[id, states[i]]] : [])));
}

export const saveFamily = (id: FamilyId, state: FamilyState) => set('family:' + id, state, store());
export const loadDetail = (key: string) => get<SavedDetail>('detail:' + key, store());
export const saveDetail = (key: string, v: SavedDetail) => set('detail:' + key, v, store());
export const loadMeta = <T>(k: string) => get<T>('meta:' + k, store());
export const saveMeta = (k: string, v: unknown) => set('meta:' + k, v, store());
/** Clears everything, then stamps the schema so the next load does not wipe again. */
export const wipe = async () => {
  await clear(store());
  await set('meta:schema', SCHEMA, store());
};
