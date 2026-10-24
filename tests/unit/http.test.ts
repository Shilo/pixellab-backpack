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
/** BroadcastChannel stand-in: delivers at once to every other channel of the same name (each loaded module is a tab). */
let posts: unknown[];
class FakeChannel {
  static all = new Set<FakeChannel>();
  onmessage: ((e: { data: unknown }) => void) | null = null;
  constructor(readonly name: string) {
    FakeChannel.all.add(this);
  }
  postMessage(data: unknown) {
    posts.push(data);
    for (const c of FakeChannel.all) if (c !== this && c.name === this.name) c.onmessage?.({ data });
  }
}
const tick = (ms = 0) => vi.advanceTimersByTimeAsync(ms);
/** Settle a request without leaving an unhandled rejection. */
const outcome = (p: Promise<unknown>) =>
  p.then(
    (value) => ({ value, err: undefined as undefined | (Error & { kind: string; status?: number }) }),
    (err) => ({ value: undefined, err: err as Error & { kind: string; status?: number } }),
  );

/** A reload of this tab (the old page and its channel are gone), or with `newTab` a second tab beside it. */
function loadModule(newTab = false) {
  if (!newTab) FakeChannel.all.clear();
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
  posts = [];
  FakeChannel.all.clear();
  vi.stubGlobal('BroadcastChannel', FakeChannel);
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

test('a wake-up timer that fires a moment early still sends the waiting request', async () => {
  // Browsers may run a timer up to 1 ms before Date.now() reaches its due time (fractional delays are truncated).
  const fakeTimeout = globalThis.setTimeout;
  vi.stubGlobal('setTimeout', (fn: () => void, ms = 0) => fakeTimeout(fn, ms > 1 ? ms - 1 : ms));
  autoReply();
  const ps = Array.from({ length: 9 }, (_, i) => outcome(http.apiGet(`/p${i}`)));
  await tick();
  expect(calls).toHaveLength(8);
  await tick(2000);
  expect(calls).toHaveLength(9);
  expect((await Promise.all(ps)).every((r) => !r.err)).toBe(true);
});

test('daily cap pauses, rejects waiting requests, and Keep loading allows 1,000 more', async () => {
  autoReply();
  local.set('pixellab-backpack:api-count', JSON.stringify({ t: Array(998).fill(Date.now() - 1000), taps: [] }));
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
  local.set('pixellab-backpack:api-count', JSON.stringify({ t: Array(1000).fill(Date.now()), taps: [] }));
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

test('a stop fails requests waiting out a retry delay at once, so Try again never waits on the halted work', async () => {
  const a = outcome(http.apiGet('/characters'));
  const b = outcome(http.apiGet('/objects'));
  await tick();
  pending[0].reply(500); // /characters retries at 2 s
  await tick(1500);
  pending[1].reply(500); // /objects retries at 3.5 s
  await tick(500);
  expect(pending).toHaveLength(3);
  pending[2].reply(500); // 3rd failure in a row: stop, while /objects still waits to retry
  expect((await a).err?.kind).toBe('stopped');
  let settled = false;
  void b.then(() => (settled = true));
  await tick(); // no time passes
  expect(settled).toBe(true);
  expect((await b).err?.kind).toBe('stopped');
  await tick(10_000);
  expect(calls).toHaveLength(3); // nothing re-sent later either
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

test('N2: a retried keyed request logs the key only on its first attempt; a refused one logs no answer status', async () => {
  const entries: { auth: boolean; status?: number }[] = [];
  http.onActivity((e) => entries.push(e));
  const p = outcome(http.apiGet('/characters/x'));
  await tick();
  pending[0].reply(500);
  await tick(5000);
  pending[1].reply(200);
  await p;
  http.setKey(null);
  await outcome(http.apiGet('/characters/y')); // never sent
  expect(entries.map((e) => [e.auth, e.status])).toEqual([[true, 500], [false, 200], [true, undefined]]);
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

test('Keep me signed in moves the key between the two stores, never both', async () => {
  const S = 'pixellab-backpack:key';
  const L = 'pixellabApiKey';
  expect(http.keptSignedIn()).toBe(false);
  http.setKeepSignedIn(true);
  expect(http.keptSignedIn()).toBe(true);
  expect([session.get(S), local.get(L)]).toEqual([undefined, KEY]);
  http.setKey('another-secret-456'); // a new key stays in the current mode's store
  expect([session.size, local.get(L)]).toEqual([0, 'another-secret-456']);
  http = await loadModule(); // a reload prefers the kept key
  expect([http.getKey(), http.keptSignedIn()]).toEqual(['another-secret-456', true]);
  http.setKeepSignedIn(false);
  expect(http.keptSignedIn()).toBe(false);
  expect([session.get(S), local.has(L)]).toEqual(['another-secret-456', false]);
  http.setKey(null);
  http.setKeepSignedIn(true); // no key: nothing to move
  expect([session.size, local.has(L), http.keptSignedIn()]).toEqual([0, false, false]);
});

test('I1: a memory-only key (the agent token) never reaches either store, even with Keep me signed in on; a human key still does', async () => {
  local.clear();
  session.clear();
  http = await loadModule();
  http.setKey(KEY, { memoryOnly: true });
  expect(http.getKey()).toBe(KEY);
  expect([...session.values(), ...local.values()]).not.toContain(KEY);
  http.setKeepSignedIn(true);
  expect([...session.values(), ...local.values()]).not.toContain(KEY);
  expect(http.keptSignedIn()).toBe(false);
  http.setKey(KEY); // a pasted key: the normal path again (this tab only, as Keep never turned on)
  expect([...session.values()]).toContain(KEY);
  http.setKeepSignedIn(true);
  expect([...local.values()]).toContain(KEY);
});

test('a kept key wins over a tab key on load', async () => {
  local.set('pixellabApiKey', 'kept-key-1234');
  session.set('pixellab-backpack:key', 'tab-key-5678');
  http = await loadModule();
  expect(http.getKey()).toBe('kept-key-1234');
});

test('setKey(null) clears both stores and sends no queued auth job', async () => {
  http.setKeepSignedIn(true);
  const ps = ['/a', '/b', '/c', '/d'].map((p) => outcome(http.apiGet(p)));
  await tick();
  expect(pending).toHaveLength(2);
  http.setKey(null);
  expect((await Promise.all(ps.slice(2))).map((r) => r.err?.kind)).toEqual(['key-lost', 'key-lost']);
  pending.forEach((p) => p.reply());
  await tick(1000);
  expect(calls).toHaveLength(2);
  expect(calls.every((c) => (c.init?.headers as { Authorization: string }).Authorization === `Bearer ${KEY}`)).toBe(true);
  expect([session.size, local.has('pixellabApiKey')]).toEqual([0, false]);
});

test('a job waiting to retry is dropped, not sent as "Bearer null", when the key is cleared', async () => {
  const p = outcome(http.apiGet('/a'));
  await tick();
  pending[0].reply(500);
  http.setKey(null);
  await tick(5000);
  expect((await p).err?.kind).toBe('key-lost');
  expect(calls).toHaveLength(1);
});

test('turning Keep me signed in off removes the saved key even if the tab copy cannot be written', async () => {
  http.setKeepSignedIn(true);
  vi.stubGlobal('sessionStorage', { ...storage(session), setItem: () => { throw new Error('full'); } });
  http.setKeepSignedIn(false);
  expect([http.keptSignedIn(), local.has('pixellabApiKey'), http.getKey()]).toEqual([false, false, KEY]);
});

test('N1: replacing a kept key when the saved copy cannot be written never leaves the old key saved', async () => {
  const L = 'pixellabApiKey';
  http.setKeepSignedIn(true);
  const kept = await loadModule(true); // another tab on the saved key
  vi.stubGlobal('localStorage', { ...storage(local), setItem: () => { throw new Error('full'); } });
  posts = [];
  http.setKey('another-secret-456');
  expect([local.has(L), http.getKey(), http.keptSignedIn()]).toEqual([false, 'another-secret-456', false]);
  expect(posts).toEqual(['key-changed']); // a bare word, never a key
  expect([kept.getKey(), kept.keptSignedIn()]).toEqual([null, false]); // the other kept tab signs out, not onto the old key
  http = await loadModule(); // a reload never signs in with the replaced key
  expect(http.getKey()).not.toBe(KEY);
});

test('Forget key signs out every other tab, tab-only or kept, with a bare message; no tab answers', async () => {
  const L = 'pixellabApiKey';
  const tabOnly = await loadModule(true); // a duplicated tab: same tab key
  http.setKeepSignedIn(true);
  const kept = await loadModule(true); // a new tab reads the kept key
  posts = [];
  const out = [vi.fn(), vi.fn()];
  tabOnly.onSignedOut(out[0]);
  kept.onSignedOut(out[1]);
  http.forgetKey();
  expect(posts).toEqual([{ type: 'signed-out', id: expect.any(String) }]); // one message, from this tab only; never the key
  expect([http.getKey(), tabOnly.getKey(), kept.getKey(), kept.keptSignedIn()]).toEqual([null, null, null, false]);
  expect(out.map((f) => f.mock.calls.length)).toEqual([1, 1]);
  expect([session.size, local.has(L)]).toEqual([0, false]);
  expect((await outcome(tabOnly.apiGet('/characters'))).err?.kind).toBe('key-lost');
  expect(calls).toHaveLength(0);
});

test('a kept tab retains its account as session-only when another app replaces the saved key', async () => {
  const L = 'pixellabApiKey';
  const tabOnly = await loadModule(true);
  http.setKeepSignedIn(true);
  const kept = await loadModule(true);
  const out = vi.fn();
  kept.onSignedOut(out);
  posts = [];
  http.setKey('replaced-key-456');
  expect(posts).toEqual(['key-changed']);
  expect([kept.getKey(), tabOnly.getKey(), kept.keptSignedIn()]).toEqual([KEY, KEY, false]);
  http.setKeepSignedIn(false); // the saved key is deleted: kept tabs sign out (no "stopped working")
  expect([kept.getKey(), kept.keptSignedIn(), kept.getCounters().status, tabOnly.getKey(), out.mock.calls.length]).toEqual([KEY, false, 'ok', KEY, 0]);
  expect(posts).toEqual(['key-changed', 'key-changed']); // neither receiver answered
  expect(local.has(L)).toBe(false);
});

test('a hung request times out after 30 s like a network failure: retried, counted, and blocked after 3', async () => {
  const timers: AbortController[] = [];
  const timeout = vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
    timers.push(new AbortController());
    return timers.at(-1)!.signal;
  });
  const hang = () => {
    timers.at(-1)!.abort(new DOMException('timed out', 'TimeoutError'));
    pending.at(-1)!.fail(pending.at(-1)!.init!.signal!.reason);
  };
  const p = outcome(http.apiGet('/characters'));
  await tick();
  expect(timeout).toHaveBeenCalledWith(30_000);
  hang();
  await tick(2000);
  expect(pending).toHaveLength(2);
  expect(http.getCounters().status).toBe('ok');
  hang();
  await tick(4000);
  hang();
  expect((await p).err?.kind).toBe('blocked');
  expect(http.getCounters()).toMatchObject({ status: 'blocked', sessionApi: 3 });
  // The image host has the same timeout per request.
  const pic = outcome(http.publicGet(`${IMG}/a.png`));
  await tick();
  expect(timeout).toHaveBeenCalledTimes(4);
  hang();
  expect((await pic).err?.kind).toBe('blocked');
});

test('keyHint shows at most the last 4 characters, and nothing for a short key', () => {
  expect(http.keyHint()).toBe('-123');
  http.setKey('short');
  expect(http.keyHint()).toBeNull();
  http.setKey(null);
  expect(http.keyHint()).toBeNull();
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
  expect(calls[0].init).toEqual({ method: 'GET', signal: expect.any(AbortSignal) }); // the timeout; no headers
  expect(http.getCounters()).toMatchObject({ sessionApi: 0, todayApi: 0, imageHost: 20 });
});

test('an image-host answer under 15 ms is marked as from the browser cache; slower or failed ones are not', async () => {
  const entries: { cached?: boolean }[] = [];
  http.onActivity((e) => entries.push(e));
  const fast = http.publicGet(`${IMG}/fast.png`);
  const slow = http.publicGet(`${IMG}/slow.png`);
  const bad = http.publicGet(`${IMG}/bad.png`);
  await tick();
  pending[0].reply();
  await fast;
  await tick(15);
  pending[1].reply(); // exactly 15 ms is not under the line: downloaded
  await slow;
  pending[2].reply(404); // a failed load is never "from cache"
  await bad;
  expect(entries.map((e) => e.cached)).toEqual([true, false, false]);
  expect(http.getCounters()).toMatchObject({ imageHost: 3, imageCached: 1 });
});

test('a request the saved copy answers is logged as a cached API row and never counts toward caps', async () => {
  const entries: unknown[] = [];
  http.onActivity((e) => entries.push(e));
  http.recordCached('Objects · first page');
  expect(entries).toEqual([expect.objectContaining({ label: 'Objects · first page', source: 'api', result: 'ok', cached: true, auth: false, ms: 0 })]);
  expect(http.getCounters()).toMatchObject({ sessionApi: 0, todayApi: 0, apiCached: 1 });
  expect(calls).toHaveLength(0);
});

test('API-host helpers via publicGet use the safety net but send no key', async () => {
  autoReply();
  const entries: { auth: boolean }[] = [];
  http.onActivity((e) => entries.push(e));
  const ps = Array.from({ length: 10 }, (_, i) => outcome(http.publicGet(`${API}/characters/helper${i}`, { api: true })));
  await tick();
  expect(calls).toHaveLength(8); // burst of 8
  expect(calls[0].init?.headers).toBeUndefined();
  await tick(1000);
  await Promise.all(ps);
  expect(http.getCounters()).toMatchObject({ sessionApi: 10, todayApi: 10, imageHost: 0 });
  const keyed = outcome(http.apiGet('/characters'));
  await tick(1000);
  await keyed;
  expect(entries.map((e) => e.auth)).toEqual([...Array(10).fill(false), true]); // Activity's preflight estimate counts keyed ones only
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

test('waiting work waits while hidden and goes out when visible; running work finishes', async () => {
  const listeners: (() => void)[] = [];
  const onChange = () => listeners.forEach((cb) => cb());
  const doc = { visibilityState: 'visible', addEventListener: (_: string, cb: () => void) => listeners.push(cb) };
  vi.stubGlobal('document', doc);
  http = await loadModule();
  http.setKey(KEY);
  const running = [outcome(http.apiGet('/a')), outcome(http.apiGet('/b'))];
  const waiting = outcome(http.apiGet('/c'));
  await tick();
  expect(pending).toHaveLength(2);
  doc.visibilityState = 'hidden';
  onChange();
  pending.forEach((p) => p.reply());
  expect((await Promise.all(running)).every((r) => !r.err)).toBe(true);
  await tick(5000);
  expect(pending).toHaveLength(2); // nothing new goes out while hidden, and nothing is cancelled
  doc.visibilityState = 'visible';
  onChange();
  await tick();
  expect(pending).toHaveLength(3);
  pending[2].reply();
  expect((await waiting).err).toBeUndefined();
});

test('whenVisible resolves at once while visible, else on the first change to visible', async () => {
  const listeners: (() => void)[] = [];
  const doc = { visibilityState: 'hidden', addEventListener: (_: string, cb: () => void) => listeners.push(cb), removeEventListener: () => {} };
  vi.stubGlobal('document', doc);
  http = await loadModule();
  let shown = false;
  void http.whenVisible().then(() => (shown = true));
  await tick();
  expect(shown).toBe(false);
  doc.visibilityState = 'visible';
  listeners.forEach((cb) => cb());
  await tick();
  expect(shown).toBe(true);
  await http.whenVisible(); // visible: at once
});

test('M-1: replacement never shares an old request or returns its old-account payload', async () => {
  const a = outcome(http.apiGet('/objects?limit=100&offset=0'));
  await tick();
  http.setKey('other-key-456');
  const b = outcome(http.apiGet('/objects?limit=100&offset=0'));
  await tick();
  expect(pending).toHaveLength(2);
  expect(pending[1].init?.headers).toEqual({ Authorization: 'Bearer other-key-456' });
  pending[0].reply(200, { who: 'a' });
  pending[1].reply(200, { who: 'b' });
  expect((await a).err?.kind).toBe('cancelled');
  expect((await b).value).toEqual({ who: 'b' });
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

test('K8: aborting a request that already went out does not cut it off: its answer still arrives', async () => {
  const ac = new AbortController();
  const p = outcome(http.apiGet('/characters/x', { signal: ac.signal }));
  await tick();
  ac.abort();
  expect(pending[0].init?.signal?.aborted).toBe(false);
  pending[0].reply();
  expect((await p).err).toBeUndefined();
});

test('isImageUrl: plain https on the image host only', () => {
  expect(http.isImageUrl(`${IMG}/x.png`)).toBe(true);
  for (const u of [`${API}/characters`, 'http://backblaze.pixellab.ai/x.png', 'https://u:p@backblaze.pixellab.ai/x.png', 'https://evil.example/x.png', 'not a url'])
    expect(http.isImageUrl(u)).toBe(false);
});

test('a failure while online is retried and counted; "blocked" only after the last retry', async () => {
  const seen: string[] = [];
  http.onStatus((s) => seen.push(s));
  const p = outcome(http.apiGet('/characters'));
  await tick();
  pending[0].fail(new TypeError('Failed to fetch'));
  await tick(2000);
  expect(pending).toHaveLength(2); // retried
  expect(http.getCounters().status).toBe('ok');
  pending[1].fail(new TypeError('Failed to fetch'));
  await tick(4000);
  expect(pending).toHaveLength(3);
  pending[2].fail(new TypeError('Failed to fetch'));
  const { err } = await p;
  expect(err?.kind).toBe('blocked');
  expect(http.getCounters()).toMatchObject({ status: 'blocked', sessionApi: 3, todayApi: 3 });
  // 3 failures in a row halt the queue like any other outage
  expect((await outcome(http.apiGet('/objects'))).err?.kind).toBe('stopped');
  expect(calls).toHaveLength(3);
  expect(seen).toEqual(['blocked']);
  http.retry();
  const again = outcome(http.apiGet('/ui'));
  await tick();
  pending[3].reply();
  expect((await again).err).toBeUndefined();
});

test('a request that succeeds while the queue is halted on "blocked" does not clear the status', async () => {
  const slow = outcome(http.apiGet('/slow'));
  const bad = outcome(http.apiGet('/bad'));
  await tick();
  pending[1].fail(new TypeError('Failed to fetch'));
  await tick(2000);
  pending[2].fail(new TypeError('Failed to fetch'));
  await tick(4000);
  pending[3].fail(new TypeError('Failed to fetch'));
  expect((await bad).err?.kind).toBe('blocked');
  pending[0].reply(); // the other request was still in flight and now succeeds
  expect((await slow).err).toBeUndefined();
  expect(http.getCounters().status).toBe('blocked'); // still halted, so the UI keeps "Try again"
  expect((await outcome(http.apiGet('/next'))).err?.kind).toBe('stopped');
  http.retry();
  expect(http.getCounters().status).toBe('ok');
});

test('a stopped queue stays stopped: a late 429 and browser events never show ok; only Try again recovers', async () => {
  const on: Record<string, () => void> = {};
  vi.stubGlobal('addEventListener', (type: string, cb: () => void) => void (on[type] = cb));
  http = await loadModule();
  http.setKey(KEY);
  const late = outcome(http.apiGet('/late'));
  const bad = outcome(http.apiGet('/bad'));
  await tick();
  pending[1].reply(500);
  await tick(2000);
  pending[2].reply(500);
  await tick(4000);
  pending[3].reply(500);
  expect((await bad).err?.kind).toBe('stopped');
  pending[0].reply(429); // the other request was in flight and lands after the stop
  expect((await late).err?.kind).toBe('stopped');
  expect(http.getCounters().status).toBe('stopped');
  // the user scrolls offline (a picture fails), then the connection comes back
  vi.stubGlobal('navigator', { onLine: false });
  on.offline();
  const pic = outcome(http.publicGet(`${IMG}/a.png`));
  await tick();
  pending.at(-1)!.fail(new TypeError('Failed to fetch'));
  expect((await pic).err?.kind).toBe('offline');
  vi.stubGlobal('navigator', { onLine: true });
  on.online();
  await tick(60_000); // past the 429 pause: the scheduler wakes up
  expect(http.getCounters().status).toBe('stopped');
  expect((await outcome(http.apiGet('/next'))).err?.kind).toBe('stopped');
  http.retry();
  expect(http.getCounters().status).toBe('ok');
  const again = outcome(http.apiGet('/again'));
  await tick();
  pending.at(-1)!.reply();
  expect((await again).err).toBeUndefined();
});

test('a failed picture from the image host throws but never changes the status', async () => {
  const seen: string[] = [];
  http.onStatus((s) => seen.push(s));
  const pic = outcome(http.publicGet(`${IMG}/a.png`));
  await tick();
  pending[0].fail(new TypeError('Failed to fetch'));
  expect((await pic).err?.kind).toBe('blocked');
  expect(http.getCounters().status).toBe('ok');
  const api = outcome(http.apiGet('/characters'));
  await tick();
  pending[1].reply();
  expect((await api).err).toBeUndefined();
  expect(seen).toEqual([]);
});

test('a network failure followed by success is retried and resolves', async () => {
  const p = outcome(http.apiGet('/characters'));
  await tick();
  pending[0].fail(new TypeError('Failed to fetch'));
  await tick(2000);
  pending[1].reply(200, { total: 2 });
  expect((await p).value).toEqual({ total: 2 });
  expect(http.getCounters()).toMatchObject({ status: 'ok', todayApi: 2 });
});

test('offline is reported at once, nothing is sent, and it recovers', async () => {
  const seen: string[] = [];
  http.onStatus((s) => seen.push(s));
  vi.stubGlobal('navigator', { onLine: false });
  expect((await outcome(http.apiGet('/objects'))).err?.kind).toBe('offline');
  expect(calls).toHaveLength(0);
  // a fetch that fails because the connection dropped mid-flight is offline too, without retry
  vi.stubGlobal('navigator', { onLine: true });
  const p = outcome(http.apiGet('/characters'));
  await tick();
  vi.stubGlobal('navigator', { onLine: false });
  pending[0].fail(new TypeError('Failed to fetch'));
  expect((await p).err?.kind).toBe('offline');
  expect(calls).toHaveLength(1);
  expect(seen).toEqual(['offline']);

  vi.stubGlobal('navigator', { onLine: true });
  const back = outcome(http.apiGet('/ui'));
  await tick();
  pending.at(-1)!.reply();
  expect((await back).err).toBeUndefined();
  expect(http.getCounters().status).toBe('ok');
});

test('the cap is checked before every send: 999 used never becomes 1,001', async () => {
  autoReply();
  local.set('pixellab-backpack:api-count', JSON.stringify({ t: Array(999).fill(Date.now() - 1000), taps: [] }));
  http = await loadModule();
  http.setKey(KEY);
  const rs = await Promise.all([outcome(http.apiGet('/a')), outcome(http.apiGet('/b'))]);
  expect(rs.map((r) => r.err?.kind)).toEqual([undefined, 'cap']);
  expect(calls).toHaveLength(1);
  expect(http.getCounters().todayApi).toBe(1000);
});

test('each Keep loading tap adds 1,000 for 24 hours only', async () => {
  autoReply();
  http.keepLoading();
  await tick(12 * 3600_000);
  http.keepLoading();
  expect(http.getCounters().dailyCap).toBe(3000);
  await tick(12 * 3600_000 + 1000); // the first tap is now over 24 h old
  expect(http.getCounters().dailyCap).toBe(2000);
  await tick(12 * 3600_000);
  expect(http.getCounters().dailyCap).toBe(1000);
});

test('publicGet accepts the helper URLs on the API host and picture links on the image host', async () => {
  autoReply();
  const ok = [
    `${API}/mcp/tilesets/id1/image`,
    `${API}/mcp/sidescroller-tilesets/id2/image`,
    `${API}/mcp/isometric-tile/id3/download`,
    `${IMG}/file/bucket/users/u/characters/c/rotations/south.png`,
  ];
  const rs = await Promise.all(ok.map((u) => outcome(http.publicGet(u, { api: u.startsWith(API) }))));
  expect(rs.map((r) => r.err)).toEqual([undefined, undefined, undefined, undefined]);
  expect(http.getCounters()).toMatchObject({ sessionApi: 3, imageHost: 1 });
});

test('agentKey: the kill switch sends no request; otherwise the dev endpoint answers, same-origin and uncached', async () => {
  autoReply();
  local.set('backpack.agentKey', 'off');
  expect(await http.agentKey()).toBeNull();
  expect(calls).toEqual([]);
  local.delete('backpack.agentKey');
  expect(await http.agentKey()).toBe('{"ok":true}');
  expect(calls).toEqual([{ url: '/__dev/pixellab-key', init: { cache: 'no-store' } }]);
});

for (const initial of ['shared', 'old-only', 'both'] as const) {
  test(`remembered key ${initial}: only the shared name is used, including after Forget`, async () => {
    session.clear();
    local.clear();
    if (initial !== 'old-only') local.set('pixellabApiKey', 'shared-key-1234');
    if (initial !== 'shared') local.set('pixellab-backpack:key-kept', 'legacy-key-5678');
    local.set('pixeldoll.apiKey', 'other-app-legacy');
    http = await loadModule();
    const expected = initial === 'old-only' ? null : 'shared-key-1234';
    expect([http.getKey(), http.keptSignedIn(), local.get('pixellabApiKey')]).toEqual([expected, !!expected, expected ?? undefined]);
    expect(local.get('pixellab-backpack:key-kept')).toBe(initial === 'shared' ? undefined : 'legacy-key-5678');
    expect(local.get('pixeldoll.apiKey')).toBe('other-app-legacy');
    http.forgetKey();
    http = await loadModule();
    expect([http.getKey(), http.keptSignedIn(), local.has('pixellabApiKey')]).toEqual([null, false, false]);
    expect(local.get('pixellab-backpack:key-kept')).toBe(initial === 'shared' ? undefined : 'legacy-key-5678');
    expect(local.get('pixeldoll.apiKey')).toBe('other-app-legacy');
  });
}


for (const oldStatus of [200, 401, 429, 500]) {
  test(`late ${oldStatus} for the previous key cannot reject or throttle the new connection`, async () => {
    const old = outcome(http.apiGet('/old-key-request'));
    await tick();
    http.setKey('new-key-456');
    const current = outcome(http.apiGet('/current-key-request'));
    await tick();
    pending[1].reply();
    expect((await current).err).toBeUndefined();
    pending[0].reply(oldStatus);
    expect((await old).err?.kind).toBe('cancelled');
    expect([http.getKey(), http.getCounters().status]).toEqual(['new-key-456', 'ok']);
    await tick(10_000);
    expect(calls).toHaveLength(2); // the stale response never schedules another request
  });
}


test('same-key Forget/reconnect discards late successes and never retries old work', async () => {
  const old = outcome(http.apiGet('/old'));
  await tick();
  http.forgetKey(); http.setKey(KEY);
  pending[0].reply(200, { stale: true });
  expect((await old).err?.kind).toBe('cancelled');
  await tick(10000);
  expect(calls).toHaveLength(1);
});

test('a saved replacement keeps this tab on its original account without overwriting the new saved key', async () => {
  http.setKeepSignedIn(true);
  const changed = vi.fn(); http.onKeyModeChanged(changed);
  local.set('pixellabApiKey', 'synthetic-other-account');
  const external = new FakeChannel('pixellab-auth'); external.postMessage('key-changed');
  expect(http.getKey()).toBe(KEY);
  expect(http.keptSignedIn()).toBe(false);
  expect(session.get('pixellab-backpack:key')).toBe(KEY);
  expect(local.get('pixellabApiKey')).toBe('synthetic-other-account');
  expect(changed).toHaveBeenCalledOnce();
  const reload = await loadModule(true);
  expect(reload.getKey()).toBe('synthetic-other-account');
});

test('an inactive tab cannot restore its session token after another app forgot it', async () => {
  expect(session.get('pixellab-backpack:key')).toBe(KEY);
  local.set('pixellabAuthForget', 'synthetic-new-forget');
  http = await loadModule();
  expect(http.getKey()).toBeNull();
  expect(session.has('pixellab-backpack:key')).toBe(false);
});

test('authenticated requests omit cookies, avoid HTTP caching and refuse redirects', async () => {
  const answer = outcome(http.apiGet('/characters'));
  await tick();
  expect(pending[0].init).toMatchObject({credentials:'omit', cache:'no-store', redirect:'error'});
  pending[0].reply(); await answer;
});
