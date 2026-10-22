// The library check service (docs/plan/mvp-plan.md "Recommendation: the MVP strategy"): decides when to ask
// PixelLab (first-page check on open, the 1-hour rule, paging on scroll, art once) and holds the state screens read.
import { APP_ID } from '../app';
import { CATEGORIES, familiesOf, type Scope } from '../categories';
import { createFamilies, dedupeTilesets, groupOf, groupStates, type Family } from '../api/families';
import {
  apiGet,
  forgetKey,
  getKey,
  HttpError,
  isImageUrl,
  keepLoading,
  keptSignedIn,
  keyHint,
  onSignedOut,
  onStatus,
  publicGet,
  recordCached,
  retry,
  setKeepSignedIn,
  setKey,
  whenVisible,
  type Status,
} from '../api/http';
import type { Card, Detail, FamilyId, FamilyState, Item, Page } from '../types';
import { applyCheck, DEEP_TTL_MS, dropExpiredDeep, isFresh, joinNextPage } from './check';
import { clear as clearOrg, load as loadOrg, org, setThumb } from './org.svelte';
import { loadDetail, loadFamilies, loadKeyFingerprint, saveDetail, saveFamily, saveKeyFingerprint, wipe } from './store';

export type LibraryStatus = 'idle' | 'checking' | Status;

export const REFRESH_GAP = 60_000;
/** Costly art waits this long on screen before it is asked for (artWait); the viewer's detail waits the same (R7). */
export const COSTLY_WAIT_MS = 300;

const adapters = createFamilies({ apiGet, publicGet });
const byId = Object.fromEntries(adapters.map((f) => [f.id, f])) as Record<FamilyId, Family>;

let net: Status = 'ok';
let ran = false;
let checking = false;
let running: Promise<void> | null = null;
let lastForce = -Infinity;
// ponytail: session caches never evict (a few KB per picture); add an LRU if memory shows up in long sessions.
const blobs = new Map<string, Promise<Blob | null>>();
const pictures = new Map<string, Promise<Blob | null>>();
/** In-flight or answered details of this session, by card key. */
const details = new Map<string, { fp: string; at: number; p: Promise<Detail> }>();
/** Families whose last first-page check failed: the next open check asks again even while their saved copy is fresh (Try again, Keep loading). */
const unchecked = new Set<FamilyId>();
const fresh = (s: { fp: string; at: number } | undefined, card: Card) => !!s && s.fp === card.fp && Date.now() - s.at < DEEP_TTL_MS;

class Library {
  families = $state({} as Record<FamilyId, FamilyState | undefined>);
  status = $state<LibraryStatus>('idle');
  loading = $state<Partial<Record<FamilyId, boolean>>>({});
  errors = $state<Partial<Record<FamilyId, string>>>({});
  /** A verified key is held: false shows the key screen (the saved list stays). */
  hasKey = $state(!!getKey());
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
  /** The sprite empty states show (Favorites, a folder, no search results): the first shown card. */
  idle = $derived(this.categories.find((c) => c.mosaic.length)?.mosaic[0] ?? null);

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

  /** The key's snapshot while its family is not fully saved (R3: in a fully saved family a missing card is gone).
   * ponytail: a deleted asset shows until its family is scrolled to the end, and gone favorites keep a few bytes each; a full
   * Sync's orphan check would catch them sooner. */
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
          const g = groupOf(c);
          if (g) (m.get(g) ?? m.set(g, []).get(g)!).push(c);
        }
        return [id, m];
      }),
    ) as Record<FamilyId, Map<string, Card[]>>,
  );

  /** Done cards sharing card's group_id, in list order; [card] when ungrouped. */
  states = (card: Card, familyId: FamilyId): Card[] => {
    const g = groupOf(card);
    return (g && this.groups[familyId].get(g)) || [card];
  };

  /** Every key of a card's group on this device (R7): its live states, plus snapshots of the same character group (a favorited
   * deep state may be snapshot-only after its rows expired), unless gone (R3: lists leave those out, so the heart must too).
   * The ♡ and the heart test these; removing drops them all. No request. */
  groupKeys = (card: Card, familyId: FamilyId): string[] => {
    const keys = this.states(card, familyId).map((c) => c.key);
    const g = groupOf(card);
    if (familyId !== 'characters' || !g) return keys;
    for (const [k, s] of Object.entries(org.cards))
      if (s.familyId === familyId && groupOf(s.card) === g && !keys.includes(k) && this.snapped(k)) keys.push(k);
    return keys;
  };

  private done = (id: FamilyId): Card[] => (this.families[id]?.cards ?? []).filter((c) => c.done);

  family = (id: FamilyId): Family => byId[id];

  restoring = $state(false);
  restoreError = $state('');

  /** A shared key may have changed in another app while this app was closed. An unchanged verified key keeps the warm cache. */
  start = async (): Promise<void> => {
    if (this.restoring) return;
    this.restoring = true;
    this.restoreError = '';
    try {
      const key = getKey();
      if (!key) return await this.openCheck();
      this.hasKey = false; // visibility events must wait for the account decision
      const fingerprint = await keyFingerprint(key);
      const saved = await loadKeyFingerprint().catch(() => undefined);
      if (getKey() !== key) return;
      if (saved !== fingerprint) {
        const result = await this.connect(key, { restoring: true });
        if (getKey() === key && result !== 'ok' && result !== 'wrong-key') this.restoreError = result;
      } else {
        this.hasKey = true;
        await this.openCheck();
      }
    } catch {
      this.hasKey = false;
      if (getKey()) this.restoreError = 'server';
    } finally {
      this.restoring = false;
    }
  };

  /** The key test IS the Characters first-page request, plus the account check when it misses. 'server': PixelLab answered
   * badly or the safety net stopped; 'paused': daily cap. `memoryOnly`: the agent token, never stored (I1). */
  connect = async (key: string, o: { memoryOnly?: boolean; restoring?: boolean } = {}): Promise<'ok' | 'wrong-key' | 'offline' | 'blocked' | 'server' | 'paused'> => {
    this.restoreError = '';
    if (!o.restoring) setKey(key, { memoryOnly: !!o.memoryOnly });
    await adopt();
    let check: Awaited<ReturnType<typeof accountCheck>>;
    try {
      check = await accountCheck(await byId.characters.list(0), this.families);
    } catch (e) {
      if (getKey() !== key) return 'server'; // a late failure from an older login must not clear the new one
      // A newly pasted, unverified key is discarded. A saved key survives temporary verification failures;
      // neither path exposes the old account's favorites or folders before verification finishes.
      const kind = e instanceof HttpError ? e.kind : null;
      // A saved key is already opted in. A transient startup failure must not erase it for every sharing app.
      if (!o.restoring || kind === 'key-lost') setKey(null);
      this.hasKey = false;
      this.keepSignedIn = keptSignedIn();
      return kind === 'key-lost' ? 'wrong-key' : kind === 'offline' || kind === 'blocked' ? kind : kind === 'cap' ? 'paused' : 'server';
    }
    if (getKey() !== key) return 'server'; // signed out (another tab's Forget) or replaced while the check ran: that wins (M-2)
    if (check.other) {
      // Another account's saved copy: wipe it with its favorites and folders (R4), then the check below runs for every family.
      clearOrg();
      try { await wipe(); } catch {
        this.hasKey = false;
        return 'server'; // never certify old-account records as owned by the new key
      }
      this.families = {} as Record<FamilyId, FamilyState | undefined>;
      this.errors = {};
    }
    const fingerprint = await keyFingerprint(key);
    if (getKey() !== key) return 'server';
    await saveKeyFingerprint(fingerprint).catch(() => {});
    if (getKey() !== key) return 'server';
    this.hasKey = true;
    this.keepSignedIn = keptSignedIn();
    // The pages the account check read are this key's first pages: the open check below skips them as fresh.
    for (const [id, page] of check.pages) {
      delete this.errors[id];
      unchecked.delete(id);
      await put(id, applyCheck(this.families[id], page, Date.now()), key);
    }
    // A check that started before this key (or before the wipe) loaded org too early, and may have been cut short by a sign-out:
    // wait it out, then run this key's own check, which loads org after everything above (Phase 4 deferred N6).
    while (running) await running;
    await this.openCheck();
    return 'ok';
  };

  /** Saved copy first; then one first-page request per family not checked within the hour (all of them on force). */
  openCheck = (opts: { force?: boolean } = {}): Promise<void> => {
    if (running) return running;
    if (opts.force) {
      if (Date.now() - lastForce < REFRESH_GAP) {
        for (const f of adapters) recordCached(`${f.label} · first page`);
        return Promise.resolve();
      }
      lastForce = Date.now();
    }
    running = (async () => {
      const key = getKey();
      await adopt(); // show the saved copy at once
      if (!key || getKey() !== key) return;
      await loadOrg(); // after connect's possible wipe
      ran = true;
      // A hidden tab never takes the lock: its requests wait until it is shown (K1), and the lock would stall every other tab (I-1).
      // ponytail: a tab hidden DURING its ~1 s check still holds the lock until shown; add a lock timeout if that shows up.
      await whenVisible();
      if (getKey() !== key) return;
      // One check across tabs: a tab that waited for the lock re-reads what the other tab saved.
      await locked(async () => {
        // Forgotten while waiting for the lock: never bring the library back into memory. Another key: its connect runs its own check.
        if (getKey() !== key) return;
        await adopt();
        const ids = adapters.map((f) => f.id).filter((id) => opts.force || unchecked.has(id) || !isFresh(this.families[id], Date.now()));
        for (const f of adapters) if (!ids.includes(f.id)) recordCached(`${f.label} · first page`);
        if (!ids.length) return;
        checking = true;
        sync();
        const check = (id: FamilyId) =>
          guarded(id, async (f) => {
            const page = await f.list(0);
            const saved = this.families[id];
            await put(id, applyCheck(saved, page, Date.now()), key);
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

  /** Try again: first pages through the open check (failed ones are not fresh), then the next pages that failed, once. Never a
   * next page behind a first page that failed, before or in this check (K4). */
  recheck = async (): Promise<void> => {
    const next = (Object.keys(this.errors) as FamilyId[]).filter((id) => !unchecked.has(id));
    await this.openCheck();
    await Promise.all(next.filter((id) => !unchecked.has(id)).map(this.loadMore));
  };

  /** Next page, starting one row back; a shifted list reloads the family from page 0. */
  loadMore = async (id: FamilyId): Promise<void> => {
    while (running) await running; // build on the checked page 0 (K6); no caller runs inside the open check
    const key = getKey();
    const s = this.families[id];
    if (!s?.cards.length || s.cards.length >= s.total) return;
    await guarded(id, async (f) => {
      const n = s.cards.length;
      const page = await f.list(n - 1); // page[0] must be the last row we hold
      const cur = this.families[id];
      const next = cur ? joinNextPage(cur, n, page.cards, Date.now()) : 'reload';
      // Reload: page 0 against the saved page 0 only, so unchanged pictures stay and the shifted deep rows go.
      const top = cur && { ...cur, cards: cur.cards.slice(0, f.pageSize), deepLoadedAt: null };
      await put(id, next === 'reload' ? applyCheck(top, await f.list(0), Date.now()) : next, key);
    });
  };

  /** How long a cell or the viewer waits on screen before asking for art (K9): only a costly family's link not resolved yet waits;
   * a saved link costs no API request, and a session miss is cached by art(). */
  artWait = (card: Card, familyId: FamilyId): number => (byId[familyId].artCostsApi && !card.thumb ? COSTLY_WAIT_MS : 0);

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
          recordCached(`${f.label} · details`);
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
    if (!isImageUrl(url)) return Promise.resolve(null);
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

const keyFingerprint = async (key: string): Promise<string> =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))), (b) => b.toString(16).padStart(2, '0')).join('');

export const library = new Library();

/** The key is gone from this tab (Forget here or in another tab): drop every memory copy; the plain key screen shows. */
function signedOut(): void {
  library.hasKey = false;
  library.restoreError = '';
  library.keepSignedIn = keptSignedIn();
  library.families = {} as Record<FamilyId, FamilyState | undefined>;
  library.errors = {};
  library.loading = {};
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
    // An equal checkedAt with more rows: another tab scrolled further from the same page 0 (K7).
    if (d && (!m || d.checkedAt > m.checkedAt || (d.checkedAt === m.checkedAt && d.cards.length > m.cards.length)))
      library.families[f.id] = dropExpiredDeep(d, Date.now(), f.pageSize);
  }
}

/** Set a family and save a plain copy. ponytail: the saved copy is best effort; a failed save only costs a later request.
 * `key` is the key the answer was asked with: one that lands after Forget, sign-out or another key is dropped, not saved. */
function put(id: FamilyId, state: FamilyState, key: string | null): Promise<void> {
  if (!key || getKey() !== key) return Promise.resolve();
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

const overlaps = (saved: FamilyState | undefined, page: Page) => {
  const keys = new Set(saved?.cards.map((c) => c.key));
  return page.cards.some((c) => keys.has(c.key));
};

/** P2a: is the new key the account of the saved copy? Same when a saved card's key is on a fresh page (keys come from
 * PixelLab ids, so another account never matches): Characters page 0; on a miss after growth, the one row where the saved
 * newest character should now sit; else the other saved families' first pages, one at a time, stopping at the first match.
 * Every page read is returned and saved, so another account costs 0 extra (all reused after the wipe) and the same account
 * at most 1 extra within the hour (0 after: the open check would ask it). Throws when nothing matched and a page failed. */
async function accountCheck(page: Page, families: Library['families']): Promise<{ other: boolean; pages: [FamilyId, Page][] }> {
  const pages: [FamilyId, Page][] = [['characters', page]];
  const saved = families.characters;
  const same = { other: false, pages };
  if (overlaps(saved, page)) return same;
  const ids = adapters.map((f) => f.id).filter((id) => id !== 'characters' && families[id]?.cards.length);
  // ponytail: no saved card in any family: nothing to compare, so the copy is kept (fresh families up to 1 h)
  if (!saved?.cards.length && !ids.length) return same;
  let failed: unknown = null;
  if (saved?.cards.length && saved.total < page.total) {
    try {
      const row = await byId.characters.list(page.total - saved.total, undefined, 1);
      if (row.cards[0]?.key === saved.cards[0].key) return same;
    } catch (e) {
      failed = e;
    }
  }
  for (const id of ids) {
    try {
      const p = await byId[id].list(0);
      pages.push([id, p]);
      if (overlaps(families[id], p)) return same;
    } catch (e) {
      failed ??= e;
    }
  }
  if (failed) throw failed;
  return { other: true, pages };
}

async function loadArt(card: Card, familyId: FamilyId, signal?: AbortSignal): Promise<Blob | null> {
  const f = byId[familyId];
  const key = getKey();
  try {
    if (f.artCostsApi && card.thumb) {
      const res = await publicGet(card.thumb, { signal, label: `${f.label} · picture` });
      if (res.ok) {
        recordCached(`${f.label} · picture`); // the API request that resolves the link was skipped
        return await res.blob();
      } // otherwise the saved link went stale: resolve it again below
    }
    const { blob, thumb } = await f.art(card, signal);
    if (f.artCostsApi && thumb) setThumb(card.key, thumb); // a favorite or folder snapshot keeps it too (R2)
    if (f.artCostsApi && thumb && thumb !== card.thumb) {
      // Save the link on the card WITHOUT touching fp, so applyCheck keeps it across checks.
      const saved = library.families[familyId]?.cards.find((c) => c.key === card.key && c.fp === card.fp);
      if (saved) {
        saved.thumb = thumb;
        await put(familyId, library.families[familyId]!, key);
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
