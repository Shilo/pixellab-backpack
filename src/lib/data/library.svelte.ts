// The library check service (docs/plan/mvp-plan.md "Recommendation: the MVP strategy"): decides when to ask
// PixelLab (first-page check on open, the 1-hour rule, paging on scroll, art once) and holds the state screens read.
import { APP_ID } from '../app';
import { CATEGORIES, familiesOf, type Scope } from '../categories';
import { createFamilies, dedupeTilesets, groupStates, type Family } from '../api/families';
import {
  apiGet,
  forgetKey,
  getKey,
  HttpError,
  IMAGE_HOST,
  keepLoading,
  keptSignedIn,
  keyHint,
  onSignedOut,
  onStatus,
  publicGet,
  retry,
  setKeepSignedIn,
  setKey,
  type Status,
} from '../api/http';
import type { Card, Detail, FamilyId, FamilyState, Item, Page } from '../types';
import { applyCheck, DEEP_TTL_MS, dropExpiredDeep, isFresh, joinNextPage } from './check';
import { clear as clearOrg, load as loadOrg, org, setThumb } from './org.svelte';
import { loadDetail, loadFamilies, saveDetail, saveFamily, wipe } from './store';

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
const pictures = new Map<string, Promise<Blob | null>>();
/** In-flight or answered details of this session, by card key. */
const details = new Map<string, { fp: string; at: number; p: Promise<Detail> }>();
/** Families whose last first-page check failed: the next open check asks again even while their saved copy is fresh (Try again, Keep loading). */
const unchecked = new Set<FamilyId>();
/** Frames and rotations come only from the image host (no API request, no key). */
function onImageHost(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === IMAGE_HOST;
  } catch {
    return false;
  }
}
const fresh = (s: { fp: string; at: number } | undefined, card: Card) => !!s && s.fp === card.fp && Date.now() - s.at < DEEP_TTL_MS;

class Library {
  families = $state({} as Record<FamilyId, FamilyState | undefined>);
  status = $state<LibraryStatus>('idle');
  loading = $state<Partial<Record<FamilyId, boolean>>>({});
  errors = $state<Partial<Record<FamilyId, string>>>({});
  /** A verified key is held: false shows the key screen (the saved list stays). */
  hasKey = $state(!!getKey());
  /** First-page requests the saved copy made unnecessary (fresh families, Refresh within a minute). Shown in Activity. */
  avoided = $state(0);
  /** The key is kept in this browser rather than this tab only. */
  keepSignedIn = $state(keptSignedIn());

  /** CATEGORIES with a count and the first 4 shown cards as the mosaic. */
  categories = $derived(
    CATEGORIES.map((c) => ({
      ...c,
      count: this.count(c.id),
      mosaic: this.items(c.id).slice(0, 4),
    })),
  );

  /** The cards screens show: done only, one card per character group, and a top-down tileset that is also in the sidescroller list is shown once (there). */
  shown = (id: FamilyId): Card[] => {
    const done = this.done(id);
    return id === 'tilesets' ? dedupeTilesets(done, this.families['tilesets-side']?.cards ?? []) : id === 'characters' ? groupStates(done) : done;
  };

  /** The flat list the grid shows, family after family. */
  items = (scope: Scope): Item[] => familiesOf(scope).flatMap((familyId) => this.shown(familyId).map((card) => ({ card, familyId })));

  /** Any done card of any family by key, grouped states included (keys are unique across families); else a snapshot that is not gone. */
  find = (key: string): Item | null => this.live.get(key) ?? this.snapped(key);

  /** A favorite or folder list (R2, R3, R7), in list order: the group's shown card when any state is live, else a snapshot whose
   * family is not fully saved, else the key is gone. One item per shown card. No request. */
  pick = (keys: string[]): { items: Item[]; gone: string[] } => {
    const items: Item[] = [];
    const gone: string[] = [];
    const seen = new Set<string>();
    for (const key of keys) {
      // A snapshot goes through its group too: a live state of the group shows instead (R7).
      const hit = this.live.get(key) ?? this.snapped(key);
      const it = hit && { card: this.states(hit.card, hit.familyId)[0], familyId: hit.familyId };
      if (!it) gone.push(key);
      else if (!seen.has(it.card.key)) {
        seen.add(it.card.key);
        items.push(it);
      }
    }
    return { items, gone };
  };

  /** Done cards of every family by key. */
  private live = $derived(new Map(familiesOf('all').flatMap((familyId) => this.done(familyId).map((card) => [card.key, { card, familyId }] as const))));

  /** The key's snapshot while its family is not fully saved (R3: in a fully saved family a missing card is gone). */
  private snapped = (key: string): Item | null => {
    const snap = org.cards[key];
    const s = snap && this.families[snap.familyId];
    return snap && !(s && s.cards.length >= s.total) ? { card: snap.card, familyId: snap.familyId } : null;
  };

  /** PixelLab's totals summed over the scope (the home tiles' numbers). */
  count = (scope: Scope): number => familiesOf(scope).reduce((n, id) => n + (this.families[id]?.total ?? 0), 0);

  /** full: every family fully saved; partial: every family has a saved first page; missing: otherwise. */
  coverage = (scope: Scope): 'full' | 'partial' | 'missing' => {
    const saved = familiesOf(scope).map((id) => this.families[id]);
    if (!saved.every((s) => s)) return 'missing';
    return saved.every((s) => s!.cards.length >= s!.total) ? 'full' : 'partial';
  };

  /** Done cards by group_id per family, so states() does not filter every card on each call. */
  private groups = $derived(
    Object.fromEntries(
      Object.keys(byId).map((id) => {
        const m = new Map<string, Card[]>();
        for (const c of this.done(id as FamilyId)) {
          const g = c.meta.group_id;
          if (typeof g === 'string' && g.trim()) (m.get(g) ?? m.set(g, []).get(g)!).push(c);
        }
        return [id, m];
      }),
    ) as Record<FamilyId, Map<string, Card[]>>,
  );

  /** Done cards sharing card's group_id, in list order; [card] when ungrouped. */
  states = (card: Card, familyId: FamilyId): Card[] => {
    const g = card.meta.group_id;
    return (typeof g === 'string' && this.groups[familyId].get(g)) || [card];
  };

  private done = (id: FamilyId): Card[] => (this.families[id]?.cards ?? []).filter((c) => c.done);

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
      this.keepSignedIn = keptSignedIn();
      const kind = e instanceof HttpError ? e.kind : null;
      return kind === 'key-lost' ? 'wrong-key' : kind === 'offline' || kind === 'blocked' ? kind : kind === 'cap' ? 'paused' : 'server';
    }
    const saved = this.families.characters;
    // ponytail: an account with 0 saved Characters cannot be told apart, so it keeps the copy (fresh families up to 1 h)
    const keys = new Set(saved?.cards.map((c) => c.key));
    if (keys.size && !page.cards.some((c) => keys.has(c.key))) {
      // Another account's saved copy: wipe it with its favorites and folders (R4), then the check below runs for every family.
      clearOrg();
      await wipe().catch(() => {});
      this.families = {} as Record<FamilyId, FamilyState | undefined>;
      this.errors = {};
    }
    delete this.errors.characters;
    this.hasKey = true;
    this.keepSignedIn = keptSignedIn();
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
      await loadOrg(); // after connect's possible wipe
      ran = true;
      // One check across tabs: a tab that waited for the lock re-reads what the other tab saved.
      await locked(async () => {
        if (!getKey()) return; // forgotten while waiting for the lock: never bring the library back into memory
        await adopt();
        const ids = adapters.map((f) => f.id).filter((id) => opts.force || unchecked.has(id) || !isFresh(this.families[id], Date.now()));
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
        for (const id of ids) this.errors[id] ? unchecked.add(id) : unchecked.delete(id);
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

  /** Characters and objects: the saved detail while its fingerprint matches and it is under 7 days old, else ONE request (saved).
   * One request per key at a time; a failure is not kept, so the next call asks again. Other families: null, no request. */
  detail = (card: Card, familyId: FamilyId, signal?: AbortSignal): Promise<Detail | null> => {
    const f = byId[familyId];
    if (!f.detail) return Promise.resolve(null);
    let m = details.get(card.key);
    if (!fresh(m, card)) {
      const entry = (m = { fp: card.fp, at: Date.now(), p: null as unknown as Promise<Detail> });
      entry.p = (async () => {
        const saved = await loadDetail(card.key).catch(() => undefined);
        if (saved && fresh(saved, card)) {
          entry.at = saved.at;
          return saved.detail;
        }
        // ponytail: one shared request; if the first caller's signal aborts, every waiting caller gets the cancel and asks again.
        const detail = await f.detail!(card, signal);
        if (getKey()) await saveDetail(card.key, { fp: card.fp, at: entry.at, detail }).catch(() => {}); // not after Forget
        return detail;
      })();
      entry.p.catch(() => details.get(card.key) === entry && details.delete(card.key));
      details.set(card.key, entry);
    }
    return m!.p;
  };

  /** One image-host frame or rotation, cached by link for the session. Image-host links only (no API request). */
  picture = (url: string, familyId: FamilyId, signal?: AbortSignal): Promise<Blob | null> => {
    if (!onImageHost(url)) return Promise.resolve(null);
    let p = pictures.get(url);
    if (!p) {
      p = publicGet(url, { signal, label: `${byId[familyId].label} · frame` })
        .then((res) => (res.ok ? res.blob() : null))
        .catch((e) => {
          // Transient (cancelled, offline, timed out ...): a later call tries again. A real answer (HttpError 'http') stays null.
          if (signal?.aborted || !(e instanceof HttpError && e.kind === 'http')) pictures.delete(url);
          return null;
        });
      pictures.set(url, p);
    }
    return p;
  };

  setKeepSignedIn = (on: boolean): void => {
    setKeepSignedIn(on);
    this.keepSignedIn = keptSignedIn();
  };
  keyHint = (): string | null => keyHint();

  /** "Keep loading" after the daily pause: the network module's own switch. */
  keepLoading = (): void => keepLoading();
  /** Every screen's Try again, before it asks again: lifts a stop or the daily pause. Any other status is left alone,
   * so PixelLab's 429 pause and its "second 429 stops" rule hold. */
  recover = (): void => {
    if (this.status === 'stopped' || this.status === 'blocked') retry();
    else if (this.status === 'paused') keepLoading();
  };

  /** Forget key: the key in every tab of this browser, the saved copy and every memory copy go. Sends no request. */
  forget = async (): Promise<void> => {
    forgetKey();
    signedOut();
    await wipe(); // a failure rejects so Settings can say so; the key is already gone
  };
}

export const library = new Library();

/** The key is gone from this tab (Forget here or in another tab): drop every memory copy; the plain key screen shows. */
function signedOut(): void {
  library.hasKey = false;
  library.keepSignedIn = keptSignedIn();
  library.families = {} as Record<FamilyId, FamilyState | undefined>;
  library.errors = {};
  library.loading = {};
  library.avoided = 0;
  blobs.clear();
  pictures.clear();
  details.clear();
  unchecked.clear();
  clearOrg();
  ran = false;
  sync();
}
onSignedOut(signedOut);

function sync(): void {
  library.status = net !== 'ok' ? net : checking ? 'checking' : ran ? 'ok' : 'idle';
}
onStatus((s) => {
  net = s;
  if (s === 'key-lost') {
    library.hasKey = false;
    library.keepSignedIn = keptSignedIn(); // a 401 keeps the key mode: a reconnect saves the new key where the old one was
  }
  sync();
});

const locked = (fn: () => Promise<void>): Promise<void> =>
  globalThis.navigator?.locks ? globalThis.navigator.locks.request(`${APP_ID}:check`, fn) : fn();

/** Take every saved family that is newer than what this tab holds (all of them on first load).
 * ponytail: with two tabs open, a picture link saved by one tab can be overwritten by the other's next save; it is resolved again later. */
async function adopt(): Promise<void> {
  const disk = await loadFamilies(adapters.map((f) => f.id)).catch(() => ({}) as Awaited<ReturnType<typeof loadFamilies>>);
  for (const f of adapters) {
    const d = disk[f.id];
    const m = library.families[f.id];
    if (d && (!m || d.checkedAt > m.checkedAt)) library.families[f.id] = dropExpiredDeep(d, Date.now(), f.pageSize);
  }
}

/** Set a family and save a plain copy. ponytail: the saved copy is best effort; a failed save only costs a later request. */
function put(id: FamilyId, state: FamilyState): Promise<void> {
  if (!getKey()) return Promise.resolve(); // an answer that lands after Forget or sign-out is dropped, not saved back
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
    if (f.artCostsApi && thumb) setThumb(card.key, thumb); // a favorite or folder snapshot keeps it too (R2)
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
    // Transient (cancelled, offline, timed out, paused, stopped, key lost): a later call tries again.
    // A real answer (HttpError 'http': 404, 423, no picture link ...) stays null, so a costly picture is asked once.
    if (signal?.aborted || !(e instanceof HttpError && e.kind === 'http')) blobs.delete(card.key);
    return null;
  }
}
