// The library check service (docs/plan/mvp-plan.md "Recommendation: the MVP strategy"): decides when to ask
// PixelLab (first-page check on open, the 1-hour rule, paging on scroll, art once) and holds the state screens read.
import { APP_ID } from '../app';
import { CATEGORIES } from '../categories';
import { createFamilies, type Family } from '../api/families';
import { apiGet, getKey, HttpError, onStatus, publicGet, setKey, type Status } from '../api/http';
import type { Card, FamilyId, FamilyState, Page } from '../types';
import { applyCheck, dropExpiredDeep, isFresh, joinNextPage } from './check';
import { loadFamilies, saveFamily, wipe } from './store';

export type LibraryStatus = 'idle' | 'checking' | Status;
type Opts = { user?: boolean; signal?: AbortSignal; label?: string };

const REFRESH_GAP = 60_000;

// ponytail: families.ts labels offset 0 "page 1"; the plan's Activity label is "<Family> · first page".
const firstPage = (o?: Opts) => o && { ...o, label: o.label?.replace(/ · page 1$/, ' · first page') };
const adapters = createFamilies({ apiGet: <T>(p: string, o?: Opts) => apiGet<T>(p, firstPage(o)), publicGet });
const byId = Object.fromEntries(adapters.map((f) => [f.id, f])) as Record<FamilyId, Family>;

class Library {
  families = $state({} as Record<FamilyId, FamilyState | undefined>);
  status = $state<LibraryStatus>('idle');
  loading = $state<Partial<Record<FamilyId, boolean>>>({});
  errors = $state<Partial<Record<FamilyId, string>>>({});

  /** CATEGORIES with a count and up to 4 mosaic cards (page 0, done cards only). */
  categories = $derived(
    CATEGORIES.map((c) => ({
      ...c,
      count: c.families.reduce((n, id) => n + (this.families[id]?.total ?? 0), 0),
      mosaic: c.families
        .flatMap((familyId) =>
          (this.families[familyId]?.cards.slice(0, byId[familyId].pageSize) ?? []).filter((card) => card.done).map((card) => ({ card, familyId })),
        )
        .slice(0, 4),
    })),
  );

  family = (id: FamilyId): Family => byId[id];

  /** The key test IS the Characters first-page request. */
  connect = async (key: string): Promise<'ok' | 'wrong-key' | 'offline' | 'blocked'> => {
    setKey(key);
    await adopt();
    let page: Page;
    try {
      page = await byId.characters.list(0);
    } catch (e) {
      setKey(null); // ponytail: an unverified key is never kept; the key screen keeps the typed text
      if (e instanceof HttpError && e.kind === 'key-lost') return 'wrong-key';
      return e instanceof HttpError && e.kind === 'offline' ? 'offline' : 'blocked';
    }
    const saved = this.families.characters;
    const keys = new Set(saved?.cards.map((c) => c.key));
    if (keys.size && !page.cards.some((c) => keys.has(c.key))) {
      // Another account's saved copy: wipe it, then the check below runs for every family.
      await wipe().catch(() => {});
      this.families = {} as Record<FamilyId, FamilyState | undefined>;
      this.errors = {};
    }
    delete this.errors.characters;
    await put('characters', applyCheck(this.families.characters, page, Date.now()));
    await this.openCheck();
    return 'ok';
  };

  /** Saved copy first; then one first-page request per family not checked within the hour (all of them on force). */
  openCheck = (opts: { force?: boolean } = {}): Promise<void> => {
    if (running) return running;
    if (opts.force) {
      if (Date.now() - lastForce < REFRESH_GAP) return Promise.resolve();
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
        if (!ids.length) return;
        checking = true;
        sync();
        const check = (id: FamilyId) =>
          guarded(id, async (f) => {
            const page = await f.list(0);
            const saved = this.families[id];
            await put(id, keep(saved, applyCheck(saved, page, Date.now())));
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
      await put(id, next === 'reload' ? keep(cur, applyCheck(undefined, await f.list(0), Date.now())) : next);
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

  /** Clears the key only; the saved list stays. */
  signOut = (): void => {
    setKey(null);
    ran = false;
    sync();
  };
}

export const library = new Library();

let net: Status = 'ok';
let ran = false;
let checking = false;
let running: Promise<void> | null = null;
let lastForce = -Infinity;
const blobs = new Map<string, Promise<Blob | null>>();

function sync(): void {
  library.status = net !== 'ok' ? net : checking ? 'checking' : ran ? 'ok' : 'idle';
}
onStatus((s) => {
  net = s;
  sync();
});

const locked = (fn: () => Promise<void>): Promise<void> =>
  globalThis.navigator?.locks ? globalThis.navigator.locks.request(`${APP_ID}:check`, fn) : fn();

/** Take every saved family that is newer than what this tab holds (all of them on first load). */
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

/** Unchanged cards (same key and fp) keep their saved object, so a resolved picture link survives a check or reload.
 * ponytail: applyCheck already does this except when page 0 holds the whole list; this covers that case too. */
function keep(saved: FamilyState | undefined, state: FamilyState): FamilyState {
  const old = new Map(saved?.cards.map((c) => [c.key, c]));
  return { ...state, cards: state.cards.map((c) => (old.get(c.key)?.fp === c.fp ? old.get(c.key)! : c)) };
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
