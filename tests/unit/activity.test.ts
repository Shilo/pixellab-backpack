import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';

// No DOM library is installed, so behaviour is tested through the components' exported logic plus server renders.
const h = vi.hoisted(() => ({
  emit: (_e: unknown) => {},
  openCheck: vi.fn(),
  counters: { sessionApi: 7, todayApi: 9, dailyCap: 1000, imageHost: 3, status: 'ok' },
}));
vi.mock('../../src/lib/data/library.svelte', () => ({ library: { openCheck: h.openCheck, avoided: 0 } }));
vi.mock('../../src/lib/api/http', () => ({
  onActivity: (cb: (e: unknown) => void) => ((h.emit = cb), () => {}),
  getCounters: () => h.counters,
}));

import Activity, { copyLog, estimatePreflights, formatLog, resultName, size, statusName } from '../../src/lib/ui/Activity.svelte';
import MoreMenu, { runRefresh } from '../../src/lib/ui/MoreMenu.svelte';

const at = new Date(2026, 9, 20, 9, 5, 7).getTime();
const entry = (o = {}) => ({ time: at, label: 'Characters · first page', source: 'api' as const, result: 'ok' as const, status: 200, bytes: 2048, ms: 120, ...o });
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

  it('estimates hidden permission checks: one per kind of request per 10 minutes, API only', () => {
    const list = [entry(), entry({ time: at + 1000 }), entry({ label: 'Objects · first page' }), entry({ time: at + 11 * 60_000 }), entry({ source: 'image', label: 'Picture' })];
    expect(estimatePreflights(list)).toBe(3);
  });

  it('copies a plain-text log with counters and one line per request', () => {
    const text = formatLog([entry()], counters);
    expect(text).toContain('API requests today: 9 of 1000');
    expect(text).toContain('Status: OK');
    expect(text.split('\n').at(-1)).toBe('09:05:07 | Characters · first page | PixelLab API | OK | 2.0 KB | 120 ms');
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
    for (const s of ['API requests this session', 'API requests today', 'Image-host loads', 'Status', 'Copy log', 'hidden permission check']) expect(body).toContain(s);
  });

  it('the menu has exactly two items: Refresh and Activity', () => {
    const body = html(MoreMenu, { open: true, onClose() {}, onActivity() {} });
    expect(body.match(/role="menuitem"/g)).toHaveLength(2);
    expect(body).toContain('Refresh');
    expect(body).toContain('Activity');
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
    expect(String((writeText.mock.calls[0] as unknown[])[0])).toContain('Image-host loads: 3');
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
