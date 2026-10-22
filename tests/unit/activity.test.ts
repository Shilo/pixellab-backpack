import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';

// No DOM library is installed, so behaviour is tested through the components' exported logic plus server renders.
const h = vi.hoisted(() => ({
  emit: (_e: unknown) => {},
  openCheck: vi.fn(),
  counters: { sessionApi: 7, todayApi: 9, dailyCap: 1000, apiCached: 4, imageHost: 3, imageCached: 1, status: 'ok' },
}));
vi.mock('../../src/lib/data/library.svelte', () => ({ library: { openCheck: h.openCheck }, REFRESH_GAP: 60_000 }));
vi.mock('../../src/lib/api/http', () => ({
  onActivity: (cb: (e: unknown) => void) => ((h.emit = cb), () => {}),
  getCounters: () => h.counters,
  CACHE_MS: 15,
}));

import Activity, { copyLog, estimatePreflights, formatLog, listSummary, resultName, size, statusName } from '../../src/lib/ui/Activity.svelte';
import MoreMenu, { runRefresh } from '../../src/lib/ui/MoreMenu.svelte';

const at = new Date(2026, 9, 20, 9, 5, 7).getTime();
const entry = (o = {}) => ({ time: at, label: 'Characters · first page', source: 'api' as const, auth: true, result: 'ok' as const, status: 200, bytes: 2048, ms: 120, ...o });
const counters = h.counters;

describe('Activity text', () => {
  it('names results, sizes and statuses', () => {
    expect(resultName(entry())).toBe('OK');
    expect(resultName(entry({ result: 'error', status: 401 }))).toBe('Wrong key (401)');
    expect(resultName(entry({ result: 'error', status: 429 }))).toBe('Too many requests (429)');
    expect(resultName(entry({ result: 'error', status: undefined }))).toBe('Network error');
    expect(resultName(entry({ result: 'cap' }))).toBe('Blocked by daily cap');
    expect(size(undefined)).toBe('-');
    expect(size(2048)).toBe('2.0 KB');
    expect(statusName('key-lost')).toBe('Key lost');
  });

  it('estimates hidden permission checks: list pages once per label per 10 minutes, keyed only', () => {
    const list = [entry(), entry({ time: at + 1000 }), entry({ label: 'Objects · first page' }), entry({ time: at + 11 * 60_000 }), entry({ source: 'image', label: 'Picture', auth: false })];
    expect(estimatePreflights(list)).toBe(3);
  });

  it('N2: counts keyed requests only, and each asset detail or keyed picture as its own check', () => {
    const list = [
      entry({ label: 'Isometric tiles · picture', auth: false }), // a keyless helper sends no check
      entry({ label: 'Characters · details' }),
      entry({ label: 'Characters · details', time: at + 1000 }), // another asset: another URL
      entry({ label: 'Characters · details', time: at + 2000 }),
      entry({ label: 'Tiles Pro · picture' }),
      entry({ label: 'Characters · page 2' }),
      entry({ label: 'Characters · page 2', time: at + 1000 }),
      entry({ label: 'Objects · details', result: 'error', status: undefined }), // refused before sending (offline, stopped, no key)
    ];
    expect(estimatePreflights(list)).toBe(5);
  });

  it('copies a plain-text log with counters and one line per request', () => {
    const text = formatLog([entry()], counters);
    expect(text).toContain('API requests today: 9 / 1000');
    expect(text).toContain('Status: OK');
    expect(text.split('\n').at(-1)).toBe('09:05:07 | Characters · first page | PixelLab API | OK | 2.0 KB | 120 ms');
  });

  it('sums the list as real requests plus cached ones', () => {
    const img = (cached: boolean) => entry({ source: 'image', cached });
    expect(listSummary([entry(), ...Array.from({ length: 16 }, () => img(true))])).toBe('1 request + 16 cached, newest first');
    expect(listSummary([entry(), img(false), img(true)])).toBe('2 requests + 1 cached, newest first');
    expect(listSummary([entry()])).toBe('1 request + 0 cached, newest first');
    expect(listSummary([entry(), entry({ cached: true })])).toBe('1 request + 1 cached, newest first'); // a saved-copy row
    expect(listSummary(Array.from({ length: 200 }, () => entry()))).toBe('200 requests + 0 cached, newest 200 shown');
  });

  it('names every cached row "Cached", API or picture, and counts cached requests next to real ones', () => {
    const list = [
      entry({ label: 'Objects · first page', cached: true, auth: false, ms: 0, bytes: undefined }),
      entry({ source: 'image', label: 'UI · picture', cached: true, ms: 9 }),
      entry({ source: 'image', label: 'UI · picture', cached: false, ms: 700 }),
    ];
    const text = formatLog(list, counters);
    expect(text).toContain('API requests: 7 + 4 cached');
    expect(text).toContain('Image requests: 2 + 1 cached'); // 3 image loads, 1 of them from the browser cache
    expect(text).toContain('Objects · first page | PixelLab API | Cached');
    expect(text).toContain('UI · picture | Image host | Cached');
    expect(text).toContain('UI · picture | Image host | OK');
    expect(resultName(list[0])).toBe('Cached');
    expect(text).not.toContain('Browser cache');
  });
});

describe('panels', () => {
  const html = (c: unknown, props: Record<string, unknown>) => (render(c as never, { props: props as never }) as { body: string }).body;

  it('render nothing when closed', () => {
    expect(html(Activity, { open: false, onClose() {} })).not.toContain('Activity');
    expect(html(MoreMenu, { open: false, onClose() {}, onActivity() {} })).not.toContain('Refresh');
  });

  it('Activity shows counters, the estimate note and Copy log', () => {
    const body = html(Activity, { open: true, onClose() {} });
    for (const s of ['API requests', 'API requests today', 'Image requests', '+ 0 cached', 'Status', 'Copy log', 'hidden permission check']) expect(body).toContain(s);
    for (const s of ['this session', 'Requests avoided', 'Image-host loads']) expect(body).not.toContain(s);
  });

  it('the menu has exactly three items: Refresh, Activity and Settings', () => {
    const body = html(MoreMenu, { open: true, onClose() {}, onActivity() {}, onSettings() {} });
    expect(body.match(/role="menuitem"/g)).toHaveLength(3);
    for (const s of ['Refresh', 'Activity', 'Settings']) expect(body).toContain(s);
  });
});

describe('live list', () => {
  it('an emitted entry becomes a row, newest first', () => {
    h.emit(entry({ label: 'Objects · first page' }));
    h.emit(entry({ label: 'Tileset picture', source: 'image', result: 'error', status: 429 }));
    const body = (render(Activity as never, { props: { open: true, onClose() {} } as never }) as { body: string }).body;
    expect(body).toContain('Objects · first page');
    expect(body).toContain('Too many requests (429)');
    expect(body.indexOf('Tileset picture')).toBeLessThan(body.indexOf('Objects · first page'));
  });
});

describe('Copy log', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('writes the plain-text log to the clipboard', async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    expect(await copyLog()).toBe('done');
    expect(writeText).toHaveBeenCalledOnce();
    expect(String((writeText.mock.calls[0] as unknown[])[0])).toContain('Image requests: 2 + 1 cached');
  });

  it('reports a failed copy', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: async () => Promise.reject(new Error('denied')) } });
    expect(await copyLog()).toBe('failed');
  });
});

describe('Refresh', () => {
  const menu = () => (render(MoreMenu as never, { props: { open: true, onClose() {}, onActivity() {} } as never }) as { body: string }).body;

  it('forces the check once, stays focusable (aria-disabled, not disabled) for 60 s, then works again', () => {
    vi.useFakeTimers();
    try {
      runRefresh();
      expect(h.openCheck).toHaveBeenCalledWith({ force: true });
      runRefresh();
      expect(h.openCheck).toHaveBeenCalledTimes(1);
      const body = menu();
      expect(body).toContain('aria-disabled="true"');
      expect(body).not.toMatch(/<button[^>]*\sdisabled/);
      vi.advanceTimersByTime(60_000);
      expect(menu()).toContain('aria-disabled="false"');
      runRefresh();
      expect(h.openCheck).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
