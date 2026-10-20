// The library check service (docs/plan/mvp-plan.md "Recommendation: the MVP strategy"): decides when to ask
// PixelLab (first-page check on open, the 1-hour rule, paging on scroll, art once) and holds the state screens read.
import { APP_ID } from '../app';
import { CATEGORIES } from '../categories';
import { createFamilies, dedupeTilesets, type Family } from '../api/families';
import { apiGet, getKey, HttpError, keepLoading, onStatus, publicGet, retry, setKey, type Status } from '../api/http';
import type { Card, FamilyId, FamilyState, Page } from '../types';
import { applyCheck, dropExpiredDeep, isFresh, joinNextPage } from './check';
import { loadFamilies, saveFamily, wipe } from './store';

export type LibraryStatus = 'idle' | 'checking' | Status;

const REFRESH_GAP = 60_000;

const adapters = createFamilies({ apiGet, publicGet });
const byId = Object.fromEntries(adapters.map((f) => [f.id, f])) as Record<FamilyId, Family>;

let net: Status = 'ok';
let ran = false;
let checking = false;
let running: Promise<void> | null = null;
let lastForce = -Infinity;
const blobs = new Map<string, Promise<Blob | null>>();

class Library {
  families = $state({} as Record<FamilyId, FamilyState | undefined>);
  status = $state<LibraryStatus>('idle');
  loading = $state<Partial<Record<FamilyId, boolean>>>({});
  errors = $state<Partial<Record<FamilyId, string>>>({});
  /** A verified key is held: false shows the key screen (the saved list stays). */
  hasKey = $state(!!getKey());
  /** First-page requests the saved copy made unnecessary (fresh families, Refresh within a minute). Shown in Activity. */
  avoided = $state(0);

  /** CATEGORIES with a count and the first 4 shown cards as the mosaic. */
  categories = $derived(
    CATEGORIES.map((c) => ({
      ...c,
      count: c.families.reduce((n, id) => n + (this.families[id]?.total ?? 0), 0),
      mosaic: c.families.flatMap((familyId) => this.shown(familyId).map((card) => ({ card, familyId }))).slice(0, 4),
    })),
  );

  /** The cards screens show: done only, and a top-down tileset that is also in the sidescroller list is shown once (there). */
  shown = (id: FamilyId): Card[] => {
    const done = (this.families[id]?.cards ?? []).filter((c) => c.done);
    return id === 'tilesets' ? dedupeTilesets(done, this.families['tilesets-side']?.cards ?? []) : done;
  };

  family = (id: FamilyId): Family => byId[id];

  /** The key test IS the Characters first-page request. 'server': PixelLab answered badly or the safety net stopped; 'paused': daily cap. */
  connect = async (key: string): Promise<'ok' | 'wrong-key' | 'offline' | 'blocked' | 'server' | 'paused'> => {
    setKey(key);
    await adopt();
    let page: Page;
    try {
      page = await byId.characters.list(0);
    } catch (e) {
      setKey(null); // ponytail: an unverified key is never kept; the key screen keeps the typed text
      this.hasKey = false;
      const kind = e instanceof HttpError ? e.kind : null;
      return kind === 'key-lost' ? 'wrong-key' : kind === 'offline' || kind === 'blocked' ? kind : kind === 'cap' ? 'paused' : 'server';
    }
    const saved = this.families.characters;
    // ponytail: an account with 0 saved Characters cannot be told apart, so it keeps the copy (fresh families up to 1 h)
    const keys = new Set(saved?.cards.map((c) => c.key));
    if (keys.size && !page.cards.some((c) => keys.has(c.key))) {
      // Another account's saved copy: wipe it, then the check below runs for every family.
      await wipe().catch(() => {});
      this.families = {} as Record<FamilyId, FamilyState | undefined>;
      this.errors = {};
    }
    delete this.errors.characters;
    this.hasKey = true;
    await put('characters', applyCheck(this.families.characters, page, Date.now()));
    await this.openCheck();
    return 'ok';
  };

  /** Saved copy first; then one first-page request per family not checked within the hour (all of them on force). */
  openCheck = (opts: { force?: boolean } = {}): Promise<void> => {
    if (running) return running;
    if (opts.force) {
      if (Date.now() - lastForce < REFRESH_GAP) {
        this.avoided += adapters.length;
        return Promise.resolve();
      }
      lastForce = Date.now();
    }
    running = (async () => {
      await adopt(); // show the saved copy at once
      if (!getKey()) return;
      ran = true;
      // One check across tabs: a tab that waited for the lock re-reads what the other tab saved.
      await locked(async () => {
        await adopt();
        const ids = adapters.map((f) => f.id).filter((id) => opts.force || !isFresh(this.families[id], Date.now()));
        this.avoided += adapters.length - ids.length;
        if (!ids.length) return;
        checking = true;
        sync();
        const check = (id: FamilyId) =>
          guarded(id, async (f) => {
            const page = await f.list(0);
            const saved = this.families[id];
            await put(id, applyCheck(saved, page, Date.now()));
          });
        await Promise.all(ids.map(check));
      });
    })().finally(() => {
      running = null;
      checking = false;
      sync();
    });
    return running;
  };

  /** Next page, starting one row back; a shifted list reloads the family from page 0. */
  loadMore = async (id: FamilyId): Promise<void> => {
    const s = this.families[id];
    if (!s?.cards.length || s.cards.length >= s.total) return;
    await guarded(id, async (f) => {
      const n = s.cards.length;
      const page = await f.list(n - 1); // page[0] must be the last row we hold
      const cur = this.families[id];
      const next = cur ? joinNextPage(cur, n, page.cards, Date.now()) : 'reload';
      // Reload: page 0 against the saved page 0 only, so unchanged pictures stay and the shifted deep rows go.
      const top = cur && { ...cur, cards: cur.cards.slice(0, f.pageSize), deepLoadedAt: null };
      await put(id, next === 'reload' ? applyCheck(top, await f.list(0), Date.now()) : next);
    });
  };

  /** One picture, cached for the session; a costly family's resolved link is saved so it is asked once per device. */
  art = (card: Card, familyId: FamilyId, signal?: AbortSignal): Promise<Blob | null> => {
    if (!card.done) return Promise.resolve(null);
    // ponytail: keyed by card.key (per brief); a picture changed mid-session shows on the next session.
    let p = blobs.get(card.key);
    if (!p) blobs.set(card.key, (p = loadArt(card, familyId, signal)));
    return p;
  };

  /** "Keep loading" after the daily pause, and "Try again" after a stop: the network module's own switches. */
  keepLoading = (): void => keepLoading();
  retry = (): void => retry();

  /** Clears the key only; the saved list stays. */
  signOut = (): void => {
    setKey(null);
    this.hasKey = false;
    ran = false;
    sync();
  };
}

export const library = new Library();

function sync(): void {
  library.status = net !== 'ok' ? net : checking ? 'checking' : ran ? 'ok' : 'idle';
}
onStatus((s) => {
  net = s;
  if (s === 'key-lost') library.hasKey = false;
  sync();
});

const locked = (fn: () => Promise<void>): Promise<void> =>
  globalThis.navigator?.locks ? globalThis.navigator.locks.request(`${APP_ID}:check`, fn) : fn();

/** Take every saved family that is newer than what this tab holds (all of them on first load).
 * ponytail: with two tabs open, a picture link saved by one tab can be overwritten by the other's next save; it is resolved again later. */
async function adopt(): Promise<void> {
  const disk = await loadFamilies().catch(() => ({}) as Awaited<ReturnType<typeof loadFamilies>>);
  for (const f of adapters) {
    const d = disk[f.id];
    const m = library.families[f.id];
    if (d && (!m || d.checkedAt > m.checkedAt)) library.families[f.id] = dropExpiredDeep(d, Date.now(), f.pageSize);
  }
}

/** Set a family and save a plain copy. ponytail: the saved copy is best effort; a failed save only costs a later request. */
function put(id: FamilyId, state: FamilyState): Promise<void> {
  library.families[id] = state;
  return saveFamily(id, $state.snapshot(library.families[id]) as FamilyState).catch(() => {});
}

/** One request at a time per family (check or next page); the error is kept for the screen. */
async function guarded(id: FamilyId, fn: (f: Family) => Promise<void>): Promise<void> {
  if (library.loading[id]) return;
  library.loading[id] = true;
  delete library.errors[id];
  try {
    await fn(byId[id]);
  } catch (e) {
    library.errors[id] = e instanceof Error ? e.message : String(e);
  } finally {
    library.loading[id] = false;
  }
}

async function loadArt(card: Card, familyId: FamilyId, signal?: AbortSignal): Promise<Blob | null> {
  const f = byId[familyId];
  try {
    if (f.artCostsApi && card.thumb) {
      const res = await publicGet(card.thumb, { signal, label: `${f.label} · picture` });
      if (res.ok) return await res.blob(); // otherwise the saved link went stale: resolve it again below
    }
    const { blob, thumb } = await f.art(card, signal);
    if (f.artCostsApi && thumb && thumb !== card.thumb) {
      // Save the link on the card WITHOUT touching fp, so applyCheck keeps it across checks.
      const saved = library.families[familyId]?.cards.find((c) => c.key === card.key && c.fp === card.fp);
      if (saved) {
        saved.thumb = thumb;
        await put(familyId, library.families[familyId]!);
      }
    }
    return blob;
  } catch (e) {
    // Cancelled, offline, paused, stopped or key lost: let a later call try again. A real answer (404, 423 ...) stays null.
    if (signal?.aborted || (e instanceof HttpError && e.kind !== 'http')) blobs.delete(card.key);
    return null;
  }
}
