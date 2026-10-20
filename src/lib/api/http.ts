// The only door to PixelLab: view-only guard, key holder and the API safety net
// (docs/plan/mvp-plan.md "The safety net"). Nothing else in the app calls fetch.
import { APP_ID } from '../app';

const API = 'https://api.pixellab.ai/v2';
const API_HOST = 'api.pixellab.ai';
const IMAGE_HOST = 'backblaze.pixellab.ai';
const KEY_NAME = `${APP_ID}:key`; // sessionStorage: this tab only
const COUNT_NAME = `${APP_ID}:api-count`; // localStorage: request times only, no data

const CONCURRENCY = 2;
const BURST = 8;
const PER_SECOND = 2;
const DAILY_CAP = 1000;
const DAY = 24 * 3600_000;
const MAX_RETRIES = 2;
const MAX_FAILS = 3; // consecutive failures before stopping
const PAUSE = 60_000; // after the first 429
const WINDOW = 5 * 60_000; // a second 429 inside this stops everything

export type Status = 'ok' | 'slowed' | 'paused' | 'stopped' | 'offline' | 'blocked' | 'key-lost';
export type HttpErrorKind = 'guard' | 'cap' | 'stopped' | 'key-lost' | 'offline' | 'blocked' | 'cancelled' | 'http';

export interface ActivityEntry {
  time: number;
  label: string;
  source: 'api' | 'image';
  result: 'ok' | 'error' | 'cap' | 'cancelled';
  status?: number;
  bytes?: number;
  ms: number;
}

/** Messages carry only the kind and status: never the URL, the key or an id. */
export class HttpError extends Error {
  readonly kind: HttpErrorKind;
  readonly status?: number;
  constructor(kind: HttpErrorKind, status?: number) {
    super(`PixelLab request failed: ${kind}${status ? ` (${status})` : ''}`);
    this.name = 'HttpError';
    this.kind = kind;
    this.status = status;
  }
}

// ---- key ----
let key: string | null = null;
try {
  key = sessionStorage.getItem(KEY_NAME);
} catch {
  /* no sessionStorage: memory only */
}

export function getKey(): string | null {
  return key;
}

export function setKey(k: string | null): void {
  key = k || null;
  try {
    if (key) sessionStorage.setItem(KEY_NAME, key);
    else sessionStorage.removeItem(KEY_NAME);
  } catch {
    /* memory only */
  }
  if (status === 'key-lost') setStatus('ok');
}

// ---- status and activity ----
let status: Status = 'ok';
const statusListeners = new Set<(s: Status) => void>();
const activityListeners = new Set<(e: ActivityEntry) => void>();
let sessionApi = 0;
let imageHost = 0;

/** While halted the status stays 'stopped'/'blocked' until retry(), so the UI always offers Try again. */
function setStatus(s: Status): void {
  if (halted || s === status) return;
  status = s;
  statusListeners.forEach((cb) => cb(s));
}

export function onStatus(cb: (s: Status) => void): () => void {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

export function onActivity(cb: (e: ActivityEntry) => void): () => void {
  activityListeners.add(cb);
  return () => activityListeners.delete(cb);
}

function record(source: 'api' | 'image', label: string, result: ActivityEntry['result'], t0: number, status?: number, bytes?: number) {
  const entry: ActivityEntry = { time: Date.now(), label, source, result, status, bytes, ms: Date.now() - t0 };
  activityListeners.forEach((cb) => cb(entry));
}

// ---- daily cap: request times in a rolling 24 h, plus the times of "Keep loading" taps (+1,000 each, also for 24 h) ----
interface Count {
  t: number[];
  taps: number[];
}
let mem: Count = { t: [], taps: [] };

function readCount(): Count {
  let c = mem;
  try {
    const s = JSON.parse(localStorage.getItem(COUNT_NAME) ?? 'null');
    if (s && Array.isArray(s.t)) c = { t: s.t, taps: Array.isArray(s.taps) ? s.taps : [] };
  } catch {
    /* use memory */
  }
  const recent = (a: unknown[]) => a.filter((x): x is number => typeof x === 'number' && x > Date.now() - DAY);
  return { t: recent(c.t), taps: recent(c.taps) };
}

function writeCount(c: Count): void {
  mem = c;
  try {
    localStorage.setItem(COUNT_NAME, JSON.stringify(c));
  } catch {
    /* memory only */
  }
}

const used = () => readCount().t.length;
const limit = () => DAILY_CAP * (1 + readCount().taps.length);

export function keepLoading(): void {
  const c = readCount();
  writeCount({ ...c, taps: [...c.taps, Date.now()] });
  if (status === 'paused') setStatus('ok');
  pump();
}

export function getCounters() {
  return { sessionApi, todayApi: used(), dailyCap: limit(), imageHost, status: status as string };
}

// ---- scheduler (API requests only) ----
interface Job {
  url: string;
  auth: boolean;
  user: boolean;
  /** true: a non-ok answer is an error (apiGet). false: the response is handed back as is (publicGet). */
  strict: boolean;
  label: string;
  signal?: AbortSignal;
  /** Reads the answer inside the request slot. */
  parse: (res: Response) => Promise<{ value: unknown; bytes?: number }>;
  retries: number;
  ok: (v: unknown) => void;
  fail: (e: HttpError) => void;
}

const queue: Job[] = [];
let running = 0;
let tokens = BURST;
let refilled = Date.now();
let pausedUntil = 0;
let last429 = -Infinity;
let fails = 0;
let halted = false; // "stopped": nothing is sent until retry()
let wakeAt = 0;

const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';
const offline = () => typeof navigator !== 'undefined' && navigator.onLine === false;
const concurrency = () => (Date.now() - last429 < WINDOW ? 1 : CONCURRENCY);

function wake(ms: number): void {
  const at = Date.now() + ms;
  if (wakeAt > Date.now() && wakeAt <= at) return;
  wakeAt = at;
  setTimeout(pump, ms);
}

function fail(job: Job, err: HttpError, t0 = Date.now(), status?: number): void {
  const result = err.kind === 'cap' ? 'cap' : err.kind === 'cancelled' ? 'cancelled' : 'error';
  record('api', job.label, result, t0, status);
  job.fail(err);
}

function rejectQueue(kind: HttpErrorKind): void {
  queue.splice(0).forEach((j) => fail(j, new HttpError(kind)));
}

function pump(): void {
  if (status === 'slowed' && Date.now() >= pausedUntil) setStatus('ok');
  if (halted) return rejectQueue('stopped');
  if (hidden()) return rejectQueue('cancelled');
  if (offline()) {
    setStatus('offline');
    return rejectQueue('offline');
  }
  if (used() >= limit()) {
    setStatus('paused');
    return rejectQueue('cap');
  }
  if (status === 'paused') setStatus('ok');
  while (queue.length && running < concurrency()) {
    if (used() >= limit()) {
      setStatus('paused');
      return rejectQueue('cap');
    }
    const now = Date.now();
    if (now < pausedUntil) return wake(pausedUntil - now);
    tokens = Math.min(BURST, tokens + ((now - refilled) / 1000) * PER_SECOND);
    refilled = now;
    if (tokens < 1) return wake(((1 - tokens) / PER_SECOND) * 1000);
    tokens -= 1;
    void attempt(queue.shift()!);
  }
}

function stop(why: 'stopped' | 'blocked' = 'stopped'): void {
  setStatus(why); // before the flag, which freezes the status
  halted = true;
  rejectQueue('stopped');
}

/** A thrown fetch: aborted, offline, or (browser online) unreachable: CORS, an extension, a firewall or an outage. */
function netKind(e: unknown): 'cancelled' | 'offline' | 'blocked' {
  return (e as Error)?.name === 'AbortError' ? 'cancelled' : offline() ? 'offline' : 'blocked';
}

async function attempt(job: Job): Promise<void> {
  const t0 = Date.now();
  running++;
  sessionApi++;
  const c = readCount();
  writeCount({ ...c, t: [...c.t, t0] });
  if (used() >= limit()) setStatus('paused');
  try {
    const init: RequestInit = { method: 'GET', signal: job.signal };
    if (job.auth) init.headers = { Authorization: `Bearer ${key}` };
    let res: Response | undefined;
    try {
      res = await fetch(job.url, init);
    } catch (e) {
      // Offline and aborts end here. A failure while online may be an outage answering without CORS
      // headers, so it is treated like a 5xx below: retried, counted, and 'blocked' only at the end.
      const kind = netKind(e);
      if (kind === 'offline') setStatus(kind);
      if (kind !== 'blocked') return fail(job, new HttpError(kind), t0);
    }
    if (res && (status === 'offline' || status === 'blocked')) setStatus('ok');
    const s = res ? res.status : 0;
    if (res?.ok) {
      fails = 0;
      let out: Awaited<ReturnType<Job['parse']>>;
      try {
        out = await job.parse(res);
      } catch {
        return fail(job, new HttpError('http', s), t0, s);
      }
      record('api', job.label, 'ok', t0, s, out.bytes);
      return job.ok(out.value);
    }
    if (s === 401 && job.auth) {
      fails = 0;
      setStatus('key-lost');
      rejectQueue('key-lost');
      return fail(job, new HttpError('key-lost', s), t0, s);
    }
    if (res && s !== 429 && s < 500) {
      fails = 0; // the server answered (404, 423 ...): no retry
      if (job.strict) return fail(job, new HttpError('http', s), t0, s);
      record('api', job.label, 'error', t0, s);
      return job.ok(res);
    }
    // 429, 5xx or a network failure (s = 0): back off, retry at most twice, stop on repeated trouble
    fails++;
    if (s === 429) {
      if (Date.now() - last429 < WINDOW) stop();
      else {
        last429 = Date.now();
        pausedUntil = last429 + PAUSE;
        setStatus('slowed');
        wake(PAUSE);
      }
    }
    const why = s ? 'stopped' : 'blocked';
    if (fails >= MAX_FAILS) stop(why);
    if (halted) return fail(job, new HttpError(why, s || undefined), t0, s || undefined);
    if (job.retries >= MAX_RETRIES) {
      if (!s) setStatus('blocked');
      return fail(job, new HttpError(s ? 'http' : 'blocked', s || undefined), t0, s || undefined);
    }
    record('api', job.label, 'error', t0, s || undefined);
    job.retries++;
    const delay = s === 429 ? 0 : 1000 * 2 ** job.retries * (0.5 + Math.random());
    setTimeout(() => {
      if (job.signal?.aborted) return fail(job, new HttpError('cancelled'));
      queue.unshift(job);
      pump();
    }, delay);
  } finally {
    running--;
    pump();
  }
}

/** "Try again" after a stop. */
export function retry(): void {
  fails = 0;
  halted = false;
  last429 = -Infinity;
  pausedUntil = 0;
  setStatus('ok');
  pump();
}

// ---- public functions ----
type Opts = { user?: boolean; signal?: AbortSignal; label?: string };

/** Which host a URL is on. Throws unless it is plain https on a PixelLab host. */
function guard(url: string): 'api' | 'image' {
  let u: URL | undefined;
  try {
    u = new URL(url);
  } catch {
    /* falls through */
  }
  if (u?.protocol === 'https:' && !u.username && !u.password) {
    if (u.hostname === API_HOST) return 'api';
    if (u.hostname === IMAGE_HOST) return 'image';
  }
  throw new HttpError('guard');
}

// One shared request per identical in-flight URL. ponytail: a user request that joins a queued
// background one keeps its lower priority; the first caller's signal governs the shared request.
const inflight = new Map<string, Promise<unknown>>();

function shared<T>(url: string, auth: boolean, make: () => Promise<T>): Promise<T> {
  const k = (auth ? 'k ' : '') + url;
  let p = inflight.get(k) as Promise<T> | undefined;
  if (!p) {
    p = make();
    const done = () => inflight.delete(k);
    p.then(done, done);
    inflight.set(k, p);
  }
  return p;
}

function submit(url: string, o: Opts & { auth: boolean; strict: boolean }, parse: Job['parse']): Promise<unknown> {
  return new Promise((ok, failJob) => {
    const job: Job = { url, auth: o.auth, user: !!o.user, strict: o.strict, label: o.label ?? 'API request', signal: o.signal, parse, retries: 0, ok, fail: failJob };
    if (o.signal?.aborted) return fail(job, new HttpError('cancelled'));
    if (job.auth && (!key || status === 'key-lost')) return fail(job, new HttpError('key-lost'));
    if (job.user) {
      const i = queue.findIndex((j) => !j.user); // behind other user requests, ahead of the rest
      queue.splice(i < 0 ? queue.length : i, 0, job);
    } else queue.push(job);
    o.signal?.addEventListener(
      'abort',
      () => {
        const i = queue.indexOf(job);
        if (i >= 0) fail(queue.splice(i, 1)[0], new HttpError('cancelled'));
      },
      { once: true },
    );
    pump();
  });
}

/** GET https://api.pixellab.ai/v2<path> with the key; JSON; through the safety net. `user`: jumps the queue. */
export function apiGet<T>(path: string, o: Opts = {}): Promise<T> {
  const url = API + path;
  try {
    if (!path.startsWith('/') || guard(url) !== 'api') throw new HttpError('guard');
  } catch (e) {
    return Promise.reject(e);
  }
  return shared(url, true, () =>
    submit(url, { ...o, auth: true, strict: true }, async (res) => {
      const text = await res.text();
      return { value: JSON.parse(text), bytes: text.length };
    }),
  ) as Promise<T>;
}

/**
 * GET without the key and without extra headers. The image host goes straight out (no API caps);
 * the API host (documented helpers) goes through the safety net. The host decides, so `api` is only a hint.
 * Non-ok answers are returned as is, except 429/5xx on the API host, which retry and then throw.
 */
export async function publicGet(url: string, o: Opts & { api?: boolean } = {}): Promise<Response> {
  const host = guard(url);
  const res = (await shared(url, false, () => (host === 'api' ? viaNet(url, o) : direct(url, o)))) as Response;
  return res.clone(); // each caller gets its own body
}

const viaNet = (url: string, o: Opts) =>
  submit(url, { ...o, auth: false, strict: false }, async (res) => ({
    value: res,
    bytes: Number(res.headers.get('content-length')) || undefined,
  }));

async function direct(url: string, o: Opts): Promise<Response> {
  const t0 = Date.now();
  const label = o.label ?? 'Picture';
  imageHost++;
  try {
    const res = await fetch(url, { method: 'GET', signal: o.signal });
    record('image', label, res.ok ? 'ok' : 'error', t0, res.status, Number(res.headers.get('content-length')) || undefined);
    return res;
  } catch (e) {
    // One failed picture never changes the app's status (the API side needs 3 failures; 'offline' comes from the browser).
    const kind = netKind(e);
    record('image', label, kind === 'cancelled' ? 'cancelled' : 'error', t0);
    throw new HttpError(kind);
  }
}

// ---- browser events ----
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', pump);
globalThis.addEventListener?.('online', () => status === 'offline' && setStatus('ok'));
globalThis.addEventListener?.('offline', () => setStatus('offline'));
