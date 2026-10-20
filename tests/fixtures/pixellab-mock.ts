// A synthetic PixelLab for e2e tests: list routes, picture helpers, the image host. No real key, no real data.
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

/** Every 10th row (index 3, 13, ...) is still generating: it must stay hidden and never get a picture request. */
const unfinished = (i: number) => i % 10 === 3;
const id = (acct: string, fam: Fam, i: number) => `${acct}-${fam}-${i}`;
const IMG = 'https://backblaze.pixellab.ai/file';

/** A tiny RGBA PNG: a 16x16 two-colour checker with a 1px border, colours from the seed (crispness is easy to see). */
function png(seed: number): Buffer {
  const w = 16;
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
}

export interface Mock {
  hits: Hit[];
  /** ids of rows that are still generating: none may ever appear in a request. */
  unfinishedIds: string[];
  /** 'ok' | 'blocked' (connection refused, like a CORS failure). */
  mode: 'ok' | 'blocked';
  /** API requests whose path + query start with one of these answer 404 (a failure that is not retried). */
  fail: string[];
  counts: Record<string, Record<Fam, number>>;
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
  };
  for (const [acct, c] of Object.entries(mock.counts))
    for (const fam of Object.keys(c) as Fam[]) for (let i = 0; i < c[fam]; i++) if (unfinished(i)) mock.unfinishedIds.push(id(acct, fam, i));

  await ctx.route('https://api.pixellab.ai/**', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const listFam = (Object.keys(FAMS) as Fam[]).find((f) => u.pathname === `/v2${FAMS[f].path}`);
    mock.hits.push({ method: req.method(), url: req.url(), host: 'api', redirected: false, list: !!listFam });
    if (mock.mode === 'blocked') return route.abort('connectionrefused');
    if (mock.fail.some((f) => (u.pathname + u.search).startsWith(f))) return route.fulfill({ status: 404, headers: CORS });
    const json = (body: unknown, status = 200) => route.fulfill({ status, headers: CORS, contentType: 'application/json', body: JSON.stringify(body) });

    // Documented no-auth picture helpers answer with a redirect to the image host.
    const helper = /^\/mcp\/(?:tilesets|sidescroller-tilesets|isometric-tile)\/([^/]+)\/(?:image|download)$/.exec(u.pathname);
    if (helper) return route.fulfill({ status: 302, headers: { ...CORS, location: `${IMG}/helper/${helper[1]}.png` } });

    const acct = ACCOUNTS[(req.headers()['authorization'] ?? '').replace(/^Bearer /, '')];
    if (!acct) return json({ detail: 'Invalid API key' }, 401);

    const pro = /^\/v2\/tiles-pro\/([^/]+)$/.exec(u.pathname);
    if (pro) return json({ storage_urls: { tile_0: `${IMG}/pro/${pro[1]}.png` }, kind: 'tiles' });

    if (!listFam) return json({ detail: 'Not found' }, 404);
    const f = FAMS[listFam];
    const total = mock.counts[acct][listFam];
    const limit = Number(u.searchParams.get('limit'));
    const offset = Number(u.searchParams.get('offset'));
    const rows = [];
    for (let i = offset; i < Math.min(total, offset + limit); i++) {
      const rid = id(acct, listFam, i);
      const row: Record<string, unknown> = { id: rid, name: `${f.label} ${i + 1}`, status: unfinished(i) ? 'processing' : 'completed', created_at: '2026-01-01T00:00:00Z' };
      if (f.pic) row[f.pic] = `${IMG}/${acct}/${rid}.png`; // even unfinished rows carry a link: the app must not use it
      rows.push(row);
    }
    return json({ [f.rows]: rows, total });
  });

  const seed = (url: string) => [...url].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 9973, 7);
  await ctx.route('https://backblaze.pixellab.ai/**', (route) => {
    const req = route.request();
    mock.hits.push({ method: req.method(), url: req.url(), host: 'image', redirected: false, list: false });
    if (mock.mode === 'blocked') return route.abort('connectionrefused');
    return route.fulfill({ status: 200, headers: CORS, contentType: 'image/png', body: png(seed(req.url())) });
  });

  // Playwright does not route the request a fulfilled redirect leads to (it would reach the real host), so the
  // helpers' redirect targets are answered through the browser's own interception, page by page.
  const catchRedirects = async (page: Page) => {
    const cdp = await ctx.newCDPSession(page);
    cdp.on('Fetch.requestPaused', (e: { requestId: string; request: { url: string; method: string } }) => {
      mock.hits.push({ method: e.request.method, url: e.request.url, host: 'image', redirected: true, list: false });
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
