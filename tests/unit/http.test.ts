import { afterEach, beforeEach, expect, test, vi } from 'vitest';

type Http = typeof import('../../src/lib/api/http');
interface Pending {
  url: string;
  init?: RequestInit;
  reply: (status?: number, body?: unknown) => void;
  fail: (e: unknown) => void;
}

let http: Http;
let pending: Pending[]; // fetches the test has not answered yet
let calls: { url: string; init?: RequestInit }[];
let local: Map<string, string>;
let session: Map<string, string>;
const KEY = 'secret-key-123';
const API = 'https://api.pixellab.ai/v2';
const IMG = 'https://backblaze.pixellab.ai';

const storage = (m: Map<string, string>) => ({
  getItem: (k: string) => m.get(k) ?? null,
  setItem: (k: string, v: string) => void m.set(k, v),
  removeItem: (k: string) => void m.delete(k),
});
const tick = (ms = 0) => vi.advanceTimersByTimeAsync(ms);
/** Settle a request without leaving an unhandled rejection. */
const outcome = (p: Promise<unknown>) =>
  p.then(
    (value) => ({ value, err: undefined as undefined | (Error & { kind: string; status?: number }) }),
    (err) => ({ value: undefined, err: err as Error & { kind: string; status?: number } }),
  );

function loadModule() {
  vi.resetModules();
  return import('../../src/lib/api/http');
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  local = new Map();
  session = new Map();
  pending = [];
  calls = [];
  vi.stubGlobal('localStorage', storage(local));
  vi.stubGlobal('sessionStorage', storage(session));
  vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (url: string, init?: RequestInit) =>
        new Promise<Response>((res, rej) => {
          calls.push({ url, init });
          pending.push({
            url,
            init,
            reply: (status = 200, body: unknown = { ok: true }) => res(new Response(JSON.stringify(body), { status })),
            fail: rej,
          });
        }),
    ),
  );
  http = await loadModule();
  http.setKey(KEY);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Answer every fetch straight away with 200. */
const autoReply = () =>
  vi.mocked(fetch).mockImplementation(async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response('{"ok":true}');
  });

test('at most 2 API requests run at a time', async () => {
  const ps = [1, 2, 3, 4].map((i) => outcome(http.apiGet(`/characters?offset=${i}`)));
  await tick();
  expect(pending).toHaveLength(2);
  pending[0].reply();
  await tick();
  expect(pending).toHaveLength(3);
  pending.slice(1).forEach((p) => p.reply());
  await tick();
  pending.slice(3).forEach((p) => p.reply());
  expect((await Promise.all(ps)).every((r) => !r.err)).toBe(true);
});

test('user requests go before waiting background ones', async () => {
  const ps = ['/a', '/b', '/c', '/d'].map((p) => outcome(http.apiGet(p)));
  const user = outcome(http.apiGet('/user', { user: true }));
  await tick();
  pending[0].reply();
  await tick();
  expect(pending[2].url).toBe(`${API}/user`); // after the two running, before /c and /d
  pending.slice(1).forEach((p) => p.reply());
  await tick();
  pending.slice(3).forEach((p) => p.reply());
  await tick();
  pending.slice(5).forEach((p) => p.reply());
  await Promise.all([...ps, user]);
});

test('a burst of 8, then 2 per second', async () => {
  autoReply();
  const ps = Array.from({ length: 14 }, (_, i) => outcome(http.apiGet(`/p${i}`)));
  await tick();
  expect(calls).toHaveLength(8);
  await tick(1000);
  expect(calls).toHaveLength(10);
  await tick(1000);
  expect(calls).toHaveLength(12);
  await tick(2000);
  expect(calls).toHaveLength(14);
  expect((await Promise.all(ps)).every((r) => !r.err)).toBe(true);
});

test('daily cap pauses, rejects waiting requests, and Keep loading allows 1,000 more', async () => {
  autoReply();
  local.set('pixellab-backpack:api-count', JSON.stringify({ t: Array(998).fill(Date.now() - 1000), extra: 0 }));
  http = await loadModule();
  http.setKey(KEY);
  const seen: string[] = [];
  http.onStatus((s) => seen.push(s));
  const ps = [1, 2, 3].map((i) => outcome(http.apiGet(`/p${i}`)));
  await tick();
  const [a, b, c] = await Promise.all(ps);
  expect([a.err, b.err]).toEqual([undefined, undefined]);
  expect(c.err?.kind).toBe('cap');
  expect(seen).toContain('paused');
  expect(http.getCounters()).toMatchObject({ todayApi: 1000, dailyCap: 1000, status: 'paused' });

  expect((await outcome(http.apiGet('/later'))).err?.kind).toBe('cap');
  http.keepLoading();
  expect(http.getCounters()).toMatchObject({ dailyCap: 2000, status: 'ok' });
  expect((await outcome(http.apiGet('/later2'))).err).toBeUndefined();
});

test('the daily cap is a rolling 24 hours', async () => {
  autoReply();
  local.set('pixellab-backpack:api-count', JSON.stringify({ t: Array(1000).fill(Date.now()), extra: 0 }));
  http = await loadModule();
  http.setKey(KEY);
  expect((await outcome(http.apiGet('/x'))).err?.kind).toBe('cap');
  await tick(24 * 3600_000 + 1000);
  expect((await outcome(http.apiGet('/y'))).err).toBeUndefined();
});

test('retries are limited to 2, back off, and count toward the daily total', async () => {
  const p = outcome(http.apiGet('/characters'));
  await tick();
  pending[0].reply(500);
  await tick(2000); // 1st back-off
  expect(pending).toHaveLength(2);
  pending[1].reply(503);
  await tick(4000); // 2nd back-off is longer
  expect(pending).toHaveLength(3);
  pending[2].reply(200, { total: 1 });
  expect((await p).value).toEqual({ total: 1 });
  expect(http.getCounters()).toMatchObject({ sessionApi: 3, todayApi: 3 });
});

test('three failures in a row stop everything until Try again', async () => {
  const seen: string[] = [];
  http.onStatus((s) => seen.push(s));
  const p = outcome(http.apiGet('/characters'));
  const queued = outcome(http.apiGet('/objects')); // the 2nd slot is free, so this one fails alongside
  await tick();
  pending[0].reply(500);
  await tick(2000);
  pending[2].reply(500);
  await tick(4000);
  pending[3].reply(500);
  expect((await p).err?.kind).toBe('stopped');
  expect(seen).toContain('stopped');
  pending[1].reply(200);
  await queued;
  const n = calls.length;
  expect((await outcome(http.apiGet('/ui'))).err?.kind).toBe('stopped');
  expect(calls).toHaveLength(n); // no request while stopped

  http.retry();
  expect(http.getCounters().status).toBe('ok');
  const again = outcome(http.apiGet('/ui'));
  await tick();
  pending.at(-1)!.reply();
  expect((await again).err).toBeUndefined();
});

test('first 429: one at a time and a 60 s pause; a second 429 within 5 minutes stops', async () => {
  const seen: string[] = [];
  http.onStatus((s) => seen.push(s));
  const p = outcome(http.apiGet('/characters'));
  await tick();
  pending[0].reply(429);
  await tick(59_000);
  expect(pending).toHaveLength(1);
  expect(http.getCounters().status).toBe('slowed');
  await tick(1500);
  expect(pending).toHaveLength(2); // retried after the pause
  const other = outcome(http.apiGet('/objects'));
  await tick();
  expect(pending).toHaveLength(2); // concurrency is 1 now
  pending[1].reply(429); // second 429 within 5 minutes
  expect((await p).err?.kind).toBe('stopped');
  expect((await other).err?.kind).toBe('stopped');
  expect(seen).toEqual(['slowed', 'ok', 'stopped']);
});

test('a 429 followed by success returns to normal after the pause', async () => {
  const p = outcome(http.apiGet('/characters'));
  await tick();
  pending[0].reply(429);
  await tick(61_000);
  pending[1].reply();
  expect((await p).err).toBeUndefined();
  expect(http.getCounters().status).toBe('ok');
});

test.each([
  [401, 'key-lost'],
  [404, 'http'],
  [423, 'http'],
])('no retry on %i', async (status, kind) => {
  const p = outcome(http.apiGet('/characters'));
  await tick();
  pending[0].reply(status);
  const { err } = await p;
  expect(err).toMatchObject({ kind, status });
  await tick(60_000);
  expect(calls).toHaveLength(1);
  if (status === 401) {
    expect(http.getCounters().status).toBe('key-lost');
    expect((await outcome(http.apiGet('/more'))).err?.kind).toBe('key-lost');
    expect(calls).toHaveLength(1);
    http.setKey('new-key');
    expect(http.getCounters().status).toBe('ok');
  }
});

test('the key never appears in an Activity entry, an error, or localStorage', async () => {
  const entries: unknown[] = [];
  http.onActivity((e) => entries.push(e));
  const errors: Error[] = [];
  for (const [path, status] of [['/characters/asset-id-777', 200], ['/objects/asset-id-888', 404], ['/ui', 401]] as const) {
    const p = outcome(http.apiGet(path, { label: 'Some label' }));
    await tick();
    pending.at(-1)!.reply(status);
    const { err } = await p;
    if (err) errors.push(err);
  }
  expect(entries).toHaveLength(3);
  expect(entries.map((e) => (e as { result: string }).result)).toEqual(['ok', 'error', 'error']);
  const dump = JSON.stringify([entries, errors.map((e) => e.message)]);
  for (const secret of [KEY, 'asset-id-777', 'asset-id-888', 'pixellab.ai']) expect(dump).not.toContain(secret);
  expect([...local.values()].join()).not.toContain(KEY);
  expect(calls[0].init?.headers).toEqual({ Authorization: `Bearer ${KEY}` });
  expect(calls[0].init?.method).toBe('GET');
});

test('the key lives in memory and sessionStorage; null clears both', async () => {
  expect(http.getKey()).toBe(KEY);
  expect(session.get('pixellab-backpack:key')).toBe(KEY);
  http = await loadModule(); // a reload in the same tab
  expect(http.getKey()).toBe(KEY);
  http.setKey(null);
  expect(http.getKey()).toBeNull();
  expect(session.size).toBe(0);
  expect((await outcome(http.apiGet('/characters'))).err?.kind).toBe('key-lost');
  expect(calls).toHaveLength(0);
});

test('only https GET to the two PixelLab hosts is allowed', async () => {
  const bad = ['http://api.pixellab.ai/v2/x', 'https://evil.example/x', 'https://api.pixellab.ai.evil.example/x', 'https://user:pw@api.pixellab.ai/x', 'not a url', 'ftp://backblaze.pixellab.ai/x'];
  for (const url of bad) expect((await outcome(http.publicGet(url))).err?.kind).toBe('guard');
  for (const path of ['@evil.example/x', 'characters', '.evil.example']) expect((await outcome(http.apiGet(path))).err?.kind).toBe('guard');
  expect(calls).toHaveLength(0);
});

test('image-host requests go straight out, without the key, and do not count toward API caps', async () => {
  autoReply();
  const ps = Array.from({ length: 20 }, (_, i) => outcome(http.publicGet(`${IMG}/pic${i}.png`)));
  await tick();
  expect(calls).toHaveLength(20); // no queue, no burst limit
  expect((await Promise.all(ps)).every((r) => !r.err)).toBe(true);
  expect(calls[0].init).toEqual({ method: 'GET', signal: undefined });
  expect(http.getCounters()).toMatchObject({ sessionApi: 0, todayApi: 0, imageHost: 20 });
});

test('API-host helpers via publicGet use the safety net but send no key', async () => {
  autoReply();
  const ps = Array.from({ length: 10 }, (_, i) => outcome(http.publicGet(`${API}/characters/helper${i}`, { api: true })));
  await tick();
  expect(calls).toHaveLength(8); // burst of 8
  expect(calls[0].init?.headers).toBeUndefined();
  await tick(1000);
  await Promise.all(ps);
  expect(http.getCounters()).toMatchObject({ sessionApi: 10, todayApi: 10, imageHost: 0 });
});

test('publicGet hands non-ok answers back as is', async () => {
  const p = http.publicGet(`${API}/characters/x`, { api: true });
  await tick();
  pending[0].reply(404);
  expect((await p).status).toBe(404);
  expect(calls).toHaveLength(1);
});

test('identical in-flight requests share one fetch', async () => {
  const a = http.apiGet('/characters?limit=100&offset=0');
  const b = http.apiGet('/characters?limit=100&offset=0');
  const c = http.publicGet(`${IMG}/same.png`);
  const d = http.publicGet(`${IMG}/same.png`);
  await tick();
  expect(pending).toHaveLength(2);
  pending.forEach((p) => p.reply());
  expect(await a).toEqual(await b);
  expect(await (await c).json()).toEqual(await (await d).json());
});

test('waiting work is cancelled while the tab is hidden; running work finishes', async () => {
  let onChange = () => {};
  const doc = { visibilityState: 'visible', addEventListener: (_: string, cb: () => void) => (onChange = cb) };
  vi.stubGlobal('document', doc);
  http = await loadModule();
  http.setKey(KEY);
  const running = [outcome(http.apiGet('/a')), outcome(http.apiGet('/b'))];
  const waiting = outcome(http.apiGet('/c'));
  await tick();
  expect(pending).toHaveLength(2);
  doc.visibilityState = 'hidden';
  onChange();
  expect((await waiting).err?.kind).toBe('cancelled');
  pending.forEach((p) => p.reply());
  expect((await Promise.all(running)).every((r) => !r.err)).toBe(true);
});

test('an aborted request leaves the queue', async () => {
  const ac = new AbortController();
  const ps = [outcome(http.apiGet('/a')), outcome(http.apiGet('/b'))];
  const waiting = outcome(http.apiGet('/c', { signal: ac.signal }));
  await tick();
  ac.abort();
  expect((await waiting).err?.kind).toBe('cancelled');
  pending.forEach((p) => p.reply());
  await Promise.all(ps);
  expect(calls).toHaveLength(2);
});

test('offline and blocked are reported, not retried', async () => {
  const seen: string[] = [];
  http.onStatus((s) => seen.push(s));
  const p = outcome(http.apiGet('/characters'));
  await tick();
  pending[0].fail(new TypeError('Failed to fetch'));
  expect((await p).err?.kind).toBe('blocked');
  expect(http.getCounters().status).toBe('blocked');

  vi.stubGlobal('navigator', { onLine: false });
  const n = calls.length;
  expect((await outcome(http.apiGet('/objects'))).err?.kind).toBe('offline');
  expect(calls).toHaveLength(n); // nothing sent while offline
  expect(seen).toEqual(['blocked', 'offline']);

  vi.stubGlobal('navigator', { onLine: true });
  const back = outcome(http.apiGet('/ui'));
  await tick();
  pending.at(-1)!.reply();
  expect((await back).err).toBeUndefined();
  expect(http.getCounters().status).toBe('ok');
  expect(calls).toHaveLength(n + 1);
});
