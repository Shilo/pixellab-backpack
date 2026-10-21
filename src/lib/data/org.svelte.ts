// Favorites and folders, kept on this device only (Phase 4 R1, R2). One record, `org`, read and written only through store.ts:
// { v: 1, favorites: key[], folders: Folder[], cards: Record<key, Snap> }. Lists hold opaque card keys, newest added first.
// Every listed key has a snapshot: the card as the screen held it when it was added (R6 §4.3), so Favorites and a folder draw
// with 0 requests even after the deep pages expired or before their family is scrolled. A snapshot no list uses is dropped.
// Writes run only while enabled (a key is held, R4). A future saved-copy SCHEMA bump must keep the `org` key.
import { familiesOf } from '../categories';
import type { Card, FamilyId, Item } from '../types';
import { isCard, isObj, loadOrg, updateOrg } from './store';

export interface Snap {
  familyId: FamilyId;
  card: Card;
}
export interface Folder {
  id: string;
  name: string;
  at: number;
  /** Card keys, newest added first. */
  items: string[];
}
type Rec = { v: 1; favorites: string[]; folders: Folder[]; cards: Record<string, Snap> };

export const NAME_MAX = 60;
const KEY = /^[0-9a-f]{12}$/;
const FAMILIES = new Set<unknown>(familiesOf('all'));

/** What screens read. Folders A–Z; `said` is the one live region's text (R10). */
export const org = $state({ favorites: [] as string[], folders: [] as Folder[], cards: {} as Record<string, Snap>, ready: false, said: '' });

let enabled = false;

const empty = (): Rec => ({ v: 1, favorites: [], folders: [], cards: {} });
const fits = (trimmed: string) => trimmed.length > 0 && [...trimmed].length <= NAME_MAX; // code points (R8)
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const folder = (r: Rec, id: string) => r.folders.find((f) => f.id === id);
const clash = (folders: Folder[], name: string, exceptId?: string) => folders.some((f) => f.id !== exceptId && same(f.name, name));

/** Drops snapshots no list uses and sorts folders A–Z. */
function tidy(r: Rec): Rec {
  const used = new Set([...r.favorites, ...r.folders.flatMap((f) => f.items)]);
  r.cards = Object.fromEntries(Object.entries(r.cards).filter(([k]) => used.has(k)));
  r.folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
  return r;
}

/** The saved record checked entry by entry (as Phase 2 C3): a bad key, folder or snapshot is dropped and the rest kept;
 * a record that is not `v: 1` reads as empty. */
export function check(o: unknown): Rec {
  const r = empty();
  if (!isObj(o) || o.v !== 1) return r;
  for (const [k, s] of Object.entries(isObj(o.cards) ? o.cards : {}))
    if (KEY.test(k) && isObj(s) && FAMILIES.has(s.familyId) && isCard(s.card) && s.card.key === k)
      r.cards[k] = { familyId: s.familyId as FamilyId, card: s.card };
  // Keys without a snapshot are dropped, so every listed key also passed the key check.
  const keys = (l: unknown) => (Array.isArray(l) ? [...new Set(l)].filter((k): k is string => typeof k === 'string' && Object.hasOwn(r.cards, k)) : []);
  r.favorites = keys(o.favorites);
  for (const f of Array.isArray(o.folders) ? o.folders : []) {
    if (!isObj(f) || typeof f.id !== 'string' || !KEY.test(f.id) || typeof f.name !== 'string' || typeof f.at !== 'number' || !Array.isArray(f.items)) continue;
    const name = f.name.trim();
    if (fits(name) && !r.folders.some((g) => g.id === f.id || same(g.name, name))) r.folders.push({ id: f.id, name, at: f.at, items: keys(f.items) });
  }
  return tidy(r);
}

function show(r: Rec): void {
  org.favorites = r.favorites;
  org.folders = r.folders;
  org.cards = r.cards;
}

/** One write in one transaction, applied to the SAVED record (not this tab's memory), so another tab's change survives.
 * `apply` changes the record and returns the live-region text, or nothing to leave `said` alone. */
async function change(apply: (r: Rec) => string | void): Promise<void> {
  if (!enabled) return;
  let next = empty();
  let said = undefined as string | void;
  await updateOrg((o) => {
    next = check(o);
    said = apply(next);
    return tidy(next);
  });
  if (!enabled) return; // cleared while writing
  show(next);
  if (said) org.said = said;
}

/** Puts the card's key first (once) and keeps its snapshot (R2). */
function put(list: string[], it: Item, r: Rec): string[] {
  r.cards[it.card.key] ??= { familyId: it.familyId, card: $state.snapshot(it.card) };
  return [it.card.key, ...list.filter((k) => k !== it.card.key)];
}
const drop = (list: string[], keys: string[]) => list.filter((k) => !keys.includes(k));

/** Reads and checks the saved record, then enables writes (call while a key is held). */
export async function load(): Promise<void> {
  enabled = true;
  let r: Rec | undefined;
  try {
    r = check(await loadOrg());
  } catch {
    /* unreadable: keep what memory holds */
  }
  if (!enabled) return; // cleared while reading
  if (r) show(r);
  org.ready = true;
}

/** Memory only (wipe() clears the device). Nothing is written until the next load(). */
export function clear(): void {
  enabled = false;
  show(empty());
  org.ready = false;
  org.said = '';
}

// ponytail: another tab's change shows here only once this tab is visible again; post on a BroadcastChannel if that is too late.
if (typeof document !== 'undefined')
  document.addEventListener('visibilitychange', () => {
    if (enabled && document.visibilityState === 'visible') void load();
  });

/** True when any of a group's keys is in the list (R7). */
export const isIn = (list: string[], keys: string[]): boolean => keys.some((k) => list.includes(k));

/** On: the acted-on card's key. Off: every key of its group (R7). */
export const setFavorite = (it: Item, keys: string[], on: boolean): Promise<void> =>
  change((r) => {
    r.favorites = on ? put(r.favorites, it, r) : drop(r.favorites, keys);
    return on ? 'Added to Favorites.' : 'Removed from Favorites.';
  });

export const setInFolder = (id: string, it: Item, keys: string[], on: boolean): Promise<void> =>
  change((r) => {
    const f = folder(r, id);
    if (!f) return;
    f.items = on ? put(f.items, it, r) : drop(f.items, keys);
    return `${on ? 'Added to' : 'Removed from'} ${f.name}.`;
  });

/** The new folder's id, or '' when refused (bad or taken name, or not enabled). */
export async function createFolder(name: string, add?: { it: Item; keys: string[] }): Promise<string> {
  if (!enabled || nameError(name)) return '';
  const id = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join(''); // 48 bits, no clash retry (R5)
  const f: Folder = { id, name: name.trim(), at: Date.now(), items: [] };
  let made = false;
  // Checked again against the saved record: another tab may have made this name since (load would drop the second folder).
  await change((r) => {
    if (clash(r.folders, f.name)) return;
    if (add) f.items = put([], add.it, r);
    r.folders.push(f);
    made = true;
    return add && `Added to ${f.name}.`;
  });
  return made ? id : '';
}

export async function renameFolder(id: string, name: string): Promise<void> {
  if (nameError(name, id)) return;
  await change((r) => {
    const f = folder(r, id);
    if (f && !clash(r.folders, name.trim(), id)) f.name = name.trim(); // checked again against the saved record
  });
}

export const deleteFolder = (id: string): Promise<void> =>
  change((r) => {
    const f = folder(r, id);
    if (!f) return;
    r.folders = r.folders.filter((g) => g !== f);
    return `Deleted "${f.name}".`;
  });

/** "Remove them" (R3). */
export const removeKeys = (id: string, keys: string[]): Promise<void> =>
  change((r) => {
    const f = folder(r, id);
    if (!f) return;
    f.items = drop(f.items, keys);
    return `Removed from ${f.name}.`;
  });

/** A resolved costly picture link, saved to the key's snapshot so it is asked once per device (R2). Best effort. */
export function setThumb(key: string, thumb: string): void {
  if (!org.cards[key] || org.cards[key].card.thumb === thumb) return;
  change((r) => {
    if (r.cards[key]) r.cards[key].card.thumb = thumb;
  }).catch(() => {});
}

/** R8 copy for a duplicate; any other message only disables Create. null when valid. */
export function nameError(name: string, exceptId?: string): string | null {
  const n = name.trim();
  if (!fits(n)) return `Use 1 to ${NAME_MAX} characters.`;
  return clash(org.folders, n, exceptId) ? 'You already have a folder with that name.' : null;
}
