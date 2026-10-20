// The only module that touches device storage (IndexedDB). Never stores the API key.
import { clear, createStore, entries, get, set } from 'idb-keyval';
import { APP_ID } from '../app';
import type { FamilyId, FamilyState } from '../types';

let db: ReturnType<typeof createStore> | undefined;
const store = () => (db ??= createStore(APP_ID, 'kv')); // lazy: no IndexedDB access at import time

export async function loadFamilies(): Promise<Partial<Record<FamilyId, FamilyState>>> {
  const out: Partial<Record<FamilyId, FamilyState>> = {};
  for (const [k, v] of await entries(store())) if (String(k).startsWith('family:')) out[String(k).slice(7) as FamilyId] = v;
  return out;
}

export const saveFamily = (id: FamilyId, state: FamilyState) => set('family:' + id, state, store());
export const loadMeta = <T>(k: string) => get<T>('meta:' + k, store());
export const saveMeta = (k: string, v: unknown) => set('meta:' + k, v, store());
export const wipe = () => clear(store());
