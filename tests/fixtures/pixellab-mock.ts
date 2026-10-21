// A synthetic PixelLab for e2e tests: list routes, character/object details, picture helpers, the image host. No real key, no real data.
// Routed on the browser context, so every tab is covered and every request is logged once.
import type { BrowserContext, Page } from '@playwright/test';
import { crc32, deflateSync } from 'node:zlib';

export const GOOD_KEY = 'synthetic-test-key-account-a'; // never a real PixelLab key
export const OTHER_KEY = 'synthetic-test-key-account-b';
const ACCOUNTS: Record<string, string> = { [GOOD_KEY]: 'a', [OTHER_KEY]: 'b' };

type Fam = 'characters' | 'objects' | 'ui' | 'tilesets' | 'tilesets-side' | 'isometric' | 'tiles-pro';
// path after /v2, row array key, label, picture field (cheap families only)
const FAMS: Record<Fam, { path: string; rows: string; label: string; pic?: string }> = {
  characters: { path: '/characters', rows: 'characters', label: 'Character', pic: 'preview_url' },
  objects: { path: '/objects', rows: 'objects', label: 'Object', pic: 'preview_url' },
  ui: { path: '/ui-assets', rows: 'ui_assets', label: 'UI piece', pic: 'image_url' },
  tilesets: { path: '/tilesets', rows: 'tilesets', label: 'Tileset' },
  'tilesets-side': { path: '/tilesets-sidescroller', rows: 'tilesets', label: 'Side tileset' },
  isometric: { path: '/isometric-tiles', rows: 'tiles', label: 'Iso tile' },
  'tiles-pro': { path: '/tiles-pro', rows: 'tiles', label: 'Pro tile' },
};
export const DEFAULT_COUNTS: Record<Fam, number> = { characters: 250, objects: 12, ui: 6, tilesets: 5, 'tilesets-side': 3, isometric: 4, 'tiles-pro': 3 };

/** Every 10th row (index 3, 13, ...) is unfinished: it must stay hidden and never get a picture request. As live: most are still
 * generating, every other one failed (13, 33, ...), and object row 3 waits in review. */
const unfinished = (i: number) => i % 10 === 3;
const statusOf = (fam: Fam, i: number) => (!unfinished(i) ? 'completed' : fam === 'objects' && i === 3 ? 'review' : i % 20 === 13 ? 'failed' : 'processing');
/** Each list comes newest first, one minute apart; Objects is the newest family, so "Recently added" (all families by date) is
 * not the screen order (Characters first). */
const NEWEST: Fam[] = ['objects', 'characters', 'ui', 'tilesets', 'tilesets-side', 'isometric', 'tiles-pro'];
const createdAt = (fam: Fam, i: number) => new Date(Date.UTC(2026, 5, 1) - NEWEST.indexOf(fam) * 86_400_000 - i * 60_000).toISOString();
const id = (acct: string, fam: Fam, i: number) => `${acct}-${fam}-${i}`;
const IMG = 'https://backblaze.pixellab.ai/file';
const D8 = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
const D4 = ['south', 'east', 'north', 'west'];
/** Characters: even rows have 8 directions, odd rows 4; rows divisible by 3 have a walk and a breathing-idle animation. */
const charDirs = (i: number) => (i % 2 ? D4 : D8);
const charAnims = (i: number) => (i % 3 ? [] : ['walk', 'breathing-idle']);
/** Objects carry the state name "base" as live; row 4 ("Object 5") has "open". Neither is shown in a cell or searched (R6). */
const OPEN_OBJECT = 4;

/** A tiny RGBA PNG: a w×w (16 by default) two-colour checker with a 1px border, colours from the seed (crispness is easy to see). */
function png(seed: number, w = 16): Buffer {
  const a = [(seed * 67) % 256, (seed * 131) % 256, (seed * 29 + 90) % 256];
  const raw = Buffer.alloc((w * 4 + 1) * w);
  for (let y = 0; y < w; y++)
    for (let x = 0; x < w; x++) {
      const edge = x === 0 || y === 0 || x === w - 1 || y === w - 1;
      const c = edge ? [20, 20, 20] : (x >> 2) % 2 === (y >> 2) % 2 ? a : [255, 255, 255];
      raw.set([...c, 255], y * (w * 4 + 1) + 1 + x * 4);
    }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(w, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

export interface Hit {
  method: string;
  url: string;
  host: 'api' | 'image';
  /** An image-host request the browser made by following a helper's redirect (one app request, two hits). */
  redirected: boolean;
  /** A first-page or next-page list request. */
  list: boolean;
  /** A character or object detail request. */
  detail: boolean;
}

export interface Mock {
  hits: Hit[];
  /** ids of rows that are still generating: none may ever appear in a request. */
  unfinishedIds: string[];
  /** 'ok' | 'blocked' (connection refused, like a CORS failure) | 'down' (the API answers 503; pictures still load). */
  mode: 'ok' | 'blocked' | 'down';
  /** API requests whose path + query start with one of these answer 404 (a failure that is not retried). */
  fail: string[];
  counts: Record<string, Record<Fam, number>>;
  /** Width and height of every image-host picture, in art pixels (16 by default). */
  size: number;
  /** Character rows that are states of one character: the first is the base (no state name), the others "Armored". Rows 6 and 7
   * by default. Every other character is, as live, the lone state "Idle" of a group of its own. */
  groups: number[][];
}

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization', 'access-control-allow-methods': 'GET' };

export async function mockPixelLab(target: Page | BrowserContext, counts: Partial<Record<'a' | 'b', Partial<Record<Fam, number>>>> = {}): Promise<Mock> {
  const ctx = 'context' in target ? target.context() : target;
  const mock: Mock = {
    hits: [],
    unfinishedIds: [],
    mode: 'ok',
    fail: [],
    counts: { a: { ...DEFAULT_COUNTS, ...counts.a }, b: { ...DEFAULT_COUNTS, characters: 3, ...counts.b } },
    size: 16,
    groups: [[6, 7]],
  };
  for (const [acct, c] of Object.entries(mock.counts))
    for (const fam of Object.keys(c) as Fam[]) for (let i = 0; i < c[fam]; i++) if (unfinished(i)) mock.unfinishedIds.push(id(acct, fam, i));

  await ctx.route('https://api.pixellab.ai/**', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const listFam = (Object.keys(FAMS) as Fam[]).find((f) => u.pathname === `/v2${FAMS[f].path}`);
    const det = /^\/v2\/(characters|objects)\/([^/]+)$/.exec(u.pathname);
    mock.hits.push({ method: req.method(), url: req.url(), host: 'api', redirected: false, list: !!listFam, detail: !!det });
    if (mock.mode === 'blocked') return route.abort('connectionrefused');
    if (mock.mode === 'down') return route.fulfill({ status: 503, headers: CORS });
    if (mock.fail.some((f) => (u.pathname + u.search).startsWith(f))) return route.fulfill({ status: 404, headers: CORS });
    const json = (body: unknown, status = 200) => route.fulfill({ status, headers: CORS, contentType: 'application/json', body: JSON.stringify(body) });

    // Documented no-auth picture helpers answer with a redirect to the image host.
    const helper = /^\/mcp\/(?:tilesets|sidescroller-tilesets|isometric-tile)\/([^/]+)\/(?:image|download)$/.exec(u.pathname);
    if (helper) return route.fulfill({ status: 302, headers: { ...CORS, location: `${IMG}/helper/${helper[1]}.png` } });

    const acct = ACCOUNTS[(req.headers()['authorization'] ?? '').replace(/^Bearer /, '')];
    if (!acct) return json({ detail: 'Invalid API key' }, 401);

    const pro = /^\/v2\/tiles-pro\/([^/]+)$/.exec(u.pathname);
    if (pro) return json({ storage_urls: { tile_0: `${IMG}/pro/${pro[1]}.png` }, kind: 'tiles' });

    if (det) {
      const fam = det[1] as 'characters' | 'objects';
      const rid = decodeURIComponent(det[2]);
      const i = Array.from({ length: mock.counts[acct][fam] }, (_, n) => n).find((n) => id(acct, fam, n) === rid);
      if (i === undefined || unfinished(i)) return json({ detail: 'Not found' }, 404);
      const base = `${IMG}/${acct}/${rid}`;
      const frames = (anim: string, dir: string, n: number) => Array.from({ length: n }, (_, f) => `${base}/${anim}/${dir}/${f}.png`);
      if (fam === 'characters') {
        const dirs = charDirs(i);
        return json({
          ...row(acct, fam, i),
          rotation_urls: Object.fromEntries(D8.map((d) => [d, dirs.includes(d) ? `${base}/rotations/${d}.png` : null])),
          style_settings: { outline: 'single color black outline', shading: 'basic shading', detail: 'medium detail' },
          guidance: 7.5,
          ai_freedom: null,
          skeletons: null,
          animations: charAnims(i).map((t) => ({ animation_type: t, display_name: null, directions: dirs.map((d) => ({ direction: d, frame_count: 4, frames: frames(t, d, 4) })) })),
        });
      }
      const nulls = Object.fromEntries(D8.map((d) => [d, null]));
      if (i === 0)
        return json({
          ...row(acct, fam, i),
          rotation_urls: nulls,
          storage_urls: { unknown: `${base}/rotations/unknown.png` },
          style_settings: null,
          animations: [{ animation_group_id: 'g0', display_name: null, description: 'Gently bobbing', frame_count: 3, directions: [{ direction: 'unknown', storage_urls: { frames: frames('bob', 'unknown', 3) }, created_at: '2026-01-02T00:00:00Z' }] }],
        });
      return json({ ...row(acct, fam, i), rotation_urls: { ...nulls, ...Object.fromEntries(D4.map((d) => [d, `${base}/rotations/${d}.png`])) }, storage_urls: {}, style_settings: null, animations: [] });
    }

    if (!listFam) return json({ detail: 'Not found' }, 404);
    const f = FAMS[listFam];
    const total = mock.counts[acct][listFam];
    const limit = Number(u.searchParams.get('limit'));
    const offset = Number(u.searchParams.get('offset'));
    const rows = [];
    for (let i = offset; i < Math.min(total, offset + limit); i++) rows.push(row(acct, listFam, i));
    return json({ [f.rows]: rows, total, usage: { type: 'usd', usd: 0 } }); // real list answers carry usage
  });

  /** One list row; detail answers spread it too. */
  function row(acct: string, fam: Fam, i: number): Record<string, unknown> {
    const rid = id(acct, fam, i);
    const r: Record<string, unknown> = { id: rid, name: `${FAMS[fam].label} ${i + 1}`, status: statusOf(fam, i), created_at: createdAt(fam, i) };
    const pic = FAMS[fam].pic;
    if (pic) r[pic] = `${IMG}/${acct}/${rid}.png`; // even unfinished rows carry a link: the app must not use it
    if (fam === 'characters') {
      Object.assign(r, { directions: charDirs(i).length, animation_count: charAnims(i).length, state_name: 'Idle', group_id: `${acct}-solo-${i}`, prompt: `synthetic courier ${i + 1}`, size: { width: 16, height: 16 } });
      const g = mock.groups.findIndex((rows) => rows.includes(i));
      const base = mock.groups[g]?.[0];
      if (g >= 0) Object.assign(r, { name: `${FAMS[fam].label} ${base + 1}`, group_id: `${acct}-group-${g + 1}`, state_name: i === base ? null : 'Armored' });
    }
    if (fam === 'objects') Object.assign(r, { directions: i === 0 ? 1 : 4, state_name: i === OPEN_OBJECT ? 'open' : 'base' });
    return r;
  }

  const seed = (url: string) => [...url].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 9973, 7);
  await ctx.route('https://backblaze.pixellab.ai/**', (route) => {
    const req = route.request();
    mock.hits.push({ method: req.method(), url: req.url(), host: 'image', redirected: false, list: false, detail: false });
    if (mock.mode === 'blocked') return route.abort('connectionrefused');
    return route.fulfill({ status: 200, headers: CORS, contentType: 'image/png', body: png(seed(req.url()), mock.size) });
  });

  // Playwright does not route the request a fulfilled redirect leads to (it would reach the real host), so the
  // helpers' redirect targets are answered through the browser's own interception, page by page.
  const catchRedirects = async (page: Page) => {
    const cdp = await ctx.newCDPSession(page);
    cdp.on('Fetch.requestPaused', (e: { requestId: string; request: { url: string; method: string } }) => {
      mock.hits.push({ method: e.request.method, url: e.request.url, host: 'image', redirected: true, list: false, detail: false });
      const headers = Object.entries({ ...CORS, 'content-type': 'image/png' }).map(([name, value]) => ({ name, value }));
      cdp.send('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: 200, responseHeaders: headers, body: png(seed(e.request.url)).toString('base64') }).catch(() => {}); // the page may have closed
    });
    await cdp.send('Fetch.enable', { patterns: [{ urlPattern: `${IMG}/helper/*`, requestStage: 'Request' }] });
  };
  if ('context' in target) await catchRedirects(target);
  else {
    for (const p of ctx.pages()) await catchRedirects(p);
    ctx.on('page', (p) => void catchRedirects(p));
  }
  return mock;
}

/** Waits until no new PixelLab request has arrived for `ms`. */
export async function settle(page: Page, mock: Mock, ms = 1200): Promise<void> {
  let n = -1;
  while (n !== mock.hits.length) {
    n = mock.hits.length;
    await page.waitForTimeout(ms);
  }
}

/** Pastes a key on the key screen and waits for the library home. */
export async function connect(page: Page, key = GOOD_KEY): Promise<void> {
  await page.getByLabel('PixelLab API key').fill(key);
  await page.getByRole('button', { name: 'Test key' }).click();
  await page.getByRole('link', { name: /^Characters, / }).waitFor();
}

/** Everything the app could have written outside the tab: localStorage plus every IndexedDB store, as one string. */
export function deviceStorage(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const out: unknown[] = [Object.entries(localStorage)];
    for (const { name } of await indexedDB.databases()) {
      const db = await new Promise<IDBDatabase>((ok, no) => {
        const r = indexedDB.open(name!);
        r.onsuccess = () => ok(r.result);
        r.onerror = () => no(r.error);
      });
      for (const s of db.objectStoreNames) {
        const store = db.transaction(s).objectStore(s);
        const all = (q: IDBRequest) => new Promise((ok) => (q.onsuccess = () => ok(q.result)));
        out.push(name, s, await all(store.getAllKeys()), await all(store.getAll()));
      }
      db.close();
    }
    return JSON.stringify(out);
  });
}

/** Writes the saved `org` record (favorites and folders) from asset names, as the app would after the same clicks. Folder ids
 * are a0…01, a0…02, … in list order. "gone" stands for an object deleted in PixelLab (a snapshot no saved card has). Reload after. */
export function seedOrg(page: Page, o: { favorites: string[]; folders: { name: string; items: string[] }[] }): Promise<void> {
  return page.evaluate(
    (o) =>
      new Promise<void>((done, fail) => {
        const r = indexedDB.open('pixellab-backpack');
        r.onerror = () => fail(r.error);
        r.onsuccess = () => {
          const kv = r.result.transaction('kv', 'readwrite').objectStore('kv');
          const all = kv.getAll();
          const keys = kv.getAllKeys();
          keys.onsuccess = () => { // answered after getAll
            try {
            const byName = new Map<string, { familyId: string; card: { key: string; name: string; done: boolean } }>();
            keys.result.forEach((k, i) => {
              const fam = String(k).startsWith('family:') && String(k).slice(7);
              if (fam) for (const card of all.result[i].cards) if (card.done && !byName.has(card.name)) byName.set(card.name, { familyId: fam, card });
            });
            const cards: Record<string, unknown> = {};
            const key = (name: string) => {
              const s = byName.get(name === 'gone' ? 'Object 1' : name);
              if (!s) throw new Error(`${name} is not saved`);
              const snap = name === 'gone' ? { ...s, card: { ...s.card, key: 'ffffffffffff', id: 'a-objects-999' } } : s;
              cards[snap.card.key] = snap;
              return snap.card.key;
            };
            const rec = {
              v: 1,
              favorites: o.favorites.map(key),
              folders: o.folders.map((f, i) => ({ id: `a${String(i + 1).padStart(11, '0')}`, name: f.name, at: i, items: f.items.map(key) })),
              cards,
            };
            kv.put(rec, 'org');
            } catch (e) {
              fail(String(e));
            }
          };
          kv.transaction.oncomplete = () => (r.result.close(), done());
          kv.transaction.onerror = () => fail(kv.transaction.error);
        };
      }),
    o,
  );
}

/** Rewrites the saved `family:<fam>` in IndexedDB: checkedAt and deepLoadedAt (when set) moved this many ms into the past. Reload after. */
export function ageSaved(page: Page, fam: Fam, o: { checkedMs?: number; deepMs?: number }): Promise<void> {
  return page.evaluate(
    ({ key, checkedMs = 0, deepMs = 0 }) =>
      new Promise<void>((done, fail) => {
        const r = indexedDB.open('pixellab-backpack');
        r.onerror = () => fail(r.error);
        r.onsuccess = () => {
          const kv = r.result.transaction('kv', 'readwrite').objectStore('kv');
          const get = kv.get(key);
          get.onsuccess = () => {
            const s = get.result;
            if (!s) return fail(new Error(`${key} is not saved`));
            s.checkedAt -= checkedMs;
            if (s.deepLoadedAt !== null) s.deepLoadedAt -= deepMs;
            kv.put(s, key);
          };
          kv.transaction.oncomplete = () => (r.result.close(), done());
          kv.transaction.onerror = () => fail(kv.transaction.error);
        };
      }),
    { key: `family:${fam}`, ...o },
  );
}
